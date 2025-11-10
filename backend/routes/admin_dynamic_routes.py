"""Admin endpoints (CRUD + lifecycle) for dynamic questionnaires.
Always available; guarded by JWT via require_admin.
"""
from flask import Blueprint, request, jsonify, current_app
from backend.services.auth_admin_service import require_admin
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from database.controller import engine
from database.dynamic_models import (
	Questionnaire, QuestionnaireVersion, Section, Question, Option,
	QuestionnaireAssignment, Response, ResponseItem
)
from database.controller import SessionLocal, get_usuario_by_codigo, create_usuario
from backend.services import ml_registry
from backend.services.ml_inference_service import _resolve_path  # internal helper is fine for diagnostics
from database.models import Usuario

admin_dynamic_bp = Blueprint("admin_dynamic", __name__)

# --- Helpers ---

def _enabled():
	return True

def _error(msg, status=400, **extra):
	body = {"error": msg}
	if extra:
		body.update(extra)
	return jsonify(body), status


# --- Access control (shared secret via header) ---

@admin_dynamic_bp.before_request
def _admin_guard():  # type: ignore[override]
	"""Guard all admin endpoints with JWT; optional fallback to header if enabled.
	We reuse the require_admin logic by wrapping a no-op when needed.
	"""
	if request.method == "OPTIONS":
		return None
	# Use the decorator's core enforcement by invoking a trivial function
	@require_admin
	def _ok():
		return None
	return _ok()

def _serialize_version(version: QuestionnaireVersion):
	"""Return full hierarchical structure for admin UI including IDs."""
	# assignment count for this version
	try:
		with Session(engine) as _s:
			assignment_count = _s.query(QuestionnaireAssignment).filter_by(questionnaire_version_id=version.id).count()
	except Exception:
		assignment_count = 0
	# latest-published flag
	q = version.questionnaire
	published_numbers = [vv.version_number for vv in (q.versions if q else []) if vv.status == "published"]
	latest_published = max(published_numbers) if published_numbers else None
	is_latest_published = (version.status == "published" and latest_published == version.version_number)
	return {
		"id": version.id,
		"number": version.version_number,
		"status": version.status,
		"metadata_json": getattr(version, "metadata_json", None),
		"assignment_count": assignment_count,
		"is_latest_published": is_latest_published,
		"questionnaire": {
			"code": version.questionnaire.code if version.questionnaire else None,
			"title": version.questionnaire.title if version.questionnaire else None,
			"status": version.questionnaire.status if version.questionnaire else None,
		},
		"sections": [
			{
				"id": sec.id,
				"title": sec.title,
				"description": sec.description,
				"order": sec.order,
				"questions": [
					{
						"id": qu.id,
						"code": qu.code,
						"text": qu.text,
						"type": qu.type,
						"required": qu.required,
						"order": qu.order,
						"validation_rules": qu.validation_rules,
						"visible_if": qu.visible_if,
						"is_computed": qu.is_computed,
						"computed_expression": qu.computed_expression,
						"options": [
							{
								"id": op.id,
								"value": op.value,
								"label": op.label,
								"order": op.order,
								"is_other": op.is_other_flag
							}
							for op in sorted(qu.options, key=lambda o: o.order)
						]
					}
					for qu in sorted(sec.questions, key=lambda q: q.order)
				]
			}
			for sec in sorted(version.sections, key=lambda s: s.order)
		]
	}

# --- Utility serializers/helpers ---

def _parse_value(item: ResponseItem):
	"""Parse stored ResponseItem into a JSON-friendly value consistent with public API."""
	if item.numeric_value is not None:
		return item.numeric_value
	if item.value is None:
		return None
	if item.value in ("true", "false"):
		return item.value == "true"
	if "," in item.value and item.value.count(",") >= 1:
		return [v for v in item.value.split(",") if v]
	return item.value

# --- Questionnaire CRUD ---

@admin_dynamic_bp.route("/admin/questionnaires", methods=["GET"])
def list_questionnaires_admin():
	if not _enabled():
		return _error("dynamic_disabled", 404)
	with Session(engine) as s:
		rows = s.execute(select(Questionnaire)).scalars().all()
		data = []
		for q in rows:
			versions = sorted(q.versions, key=lambda v: v.version_number)
			# compute latest published number
			published_numbers = [v.version_number for v in versions if v.status == "published"]
			latest_published = max(published_numbers) if published_numbers else None
			data.append({
				"code": q.code,
				"title": q.title,
				"status": q.status,
				"is_primary": bool(getattr(q, 'is_primary', False)),
				"versions": [
					{
						"id": v.id,
						"number": v.version_number,
						"state": v.status,
						"sections": len(v.sections),
						"assignments": s.query(QuestionnaireAssignment).filter_by(questionnaire_version_id=v.id).count(),
						"is_latest_published": (v.status == "published" and v.version_number == latest_published)
					}
					for v in versions
				]
			})
	return jsonify({"items": data})

@admin_dynamic_bp.route("/admin/questionnaires/<code>/set-primary", methods=["POST"])
def set_primary_questionnaire(code: str):
	"""Mark a questionnaire as primary. Requires active status and a published version.

	Body: { "primary": true|false }
	If false, simply unsets this questionnaire if it's currently primary.
	"""
	if not _enabled():
		return _error("dynamic_disabled", 404)
	payload = request.get_json(force=True, silent=True) or {}
	make_primary = bool(payload.get("primary", True))
	with Session(engine) as s:
		q = s.execute(select(Questionnaire).where(Questionnaire.code == code)).scalar_one_or_none()
		if not q:
			return _error("not_found", 404)
		if make_primary:
			# must be active and have a published version to be useful
			if q.status != "active":
				return _error("questionnaire_inactive", 409)
			if not any(v.status == "published" for v in q.versions):
				return _error("no_published_version", 409)
			# block if another is already primary
			other_primary = s.query(Questionnaire).filter(Questionnaire.is_primary == True, Questionnaire.code != q.code).first()
			if other_primary:
				return _error("another_primary_exists", 409, current_primary=other_primary.code)
			q.is_primary = True
		else:
			q.is_primary = False
		s.commit()
		return jsonify({"message": "primary_updated", "code": q.code, "is_primary": bool(q.is_primary)})

@admin_dynamic_bp.route("/admin/users", methods=["POST"])
def admin_create_user():
	"""Create a student user by code (idempotent, admin-only).

	Body: { "codigo_estudiante": "..." }
	Returns 201 when created, 200 when already exists.
	"""
	data = request.get_json(silent=True) or {}
	codigo = (data.get("codigo_estudiante") or "").strip()
	if not codigo:
		return _error("codigo_estudiante_required")
	db = SessionLocal()
	try:
		existing = get_usuario_by_codigo(db, codigo)
		if existing:
			return jsonify({
				"id_usuario": existing.id_usuario,
				"codigo_estudiante": existing.codigo_estudiante,
			}), 200
		nuevo = create_usuario(db, codigo)
		return jsonify({
			"id_usuario": nuevo.id_usuario,
			"codigo_estudiante": nuevo.codigo_estudiante,
		}), 201
	except Exception as e:
		db.rollback()
		return _error(str(e), 500)
	finally:
		db.close()

# --- Admin: Users listing (registered students) ---

@admin_dynamic_bp.route("/admin/users", methods=["GET"])
def list_registered_users():
	"""List registered users with pagination and simple search.

	Query params:
	- page (default 1)
	- page_size (default 20, max 200)
	- q: substring to match in codigo_estudiante or username

	Response:
	{ page, page_size, total, items: [ { id_usuario, codigo_estudiante, username, created_at, last_login_at } ] }
	"""
	if not _enabled():
		return _error("dynamic_disabled", 404)
	try:
		page = max(1, int(request.args.get("page", 1)))
		page_size = int(request.args.get("page_size", 20))
	except Exception:
		page = 1; page_size = 20
	page_size = max(1, min(200, page_size))
	q = (request.args.get("q") or "").strip()
	with Session(engine) as s:
		query = s.query(Usuario)
		if q:
			like = f"%{q}%"
			query = query.filter((Usuario.codigo_estudiante.ilike(like)) | (Usuario.username.ilike(like)))
		# count
		total = query.count()
		rows = (query
				.order_by(Usuario.id_usuario.desc())
				.offset((page - 1) * page_size)
				.limit(page_size)
				.all())
		items = []
		for u in rows:
			items.append({
				"id_usuario": u.id_usuario,
				"codigo_estudiante": u.codigo_estudiante,
				"username": u.username,
				"created_at": u.created_at.isoformat() if getattr(u, "created_at", None) else None,
				"last_login_at": u.last_login_at.isoformat() if getattr(u, "last_login_at", None) else None,
			})
		return jsonify({"page": page, "page_size": page_size, "total": int(total), "items": items})

@admin_dynamic_bp.route("/admin/users/<int:id_usuario>", methods=["DELETE"])
def delete_user(id_usuario: int):
	"""Eliminar un usuario y TODOS sus datos de cuestionarios (assignments, responses, items).

	Reglas:
	 - Bloquea si no existe.
	 - No requiere force: siempre elimina en cascada a nivel aplicación.
	Respuesta:
	 { message, deleted: { assignments, responses, items } }
	"""
	if not _enabled():
		return _error("dynamic_disabled", 404)
	with Session(engine) as s:
		u = s.get(Usuario, id_usuario)
		if not u:
			return _error("user_not_found", 404)
		codigo = u.codigo_estudiante
		assignments = s.query(QuestionnaireAssignment).filter(QuestionnaireAssignment.user_code == codigo).all()
		assignment_ids = [a.id for a in assignments]
		responses_deleted = 0
		items_deleted = 0
		assignments_deleted = 0
		if assignment_ids:
			response_ids = [i for (i,) in s.query(Response.id).filter(Response.assignment_id.in_(assignment_ids)).all()]
			if response_ids:
				items_deleted = s.query(ResponseItem).filter(ResponseItem.response_id.in_(response_ids)).delete(synchronize_session=False)
				responses_deleted = s.query(Response).filter(Response.id.in_(response_ids)).delete(synchronize_session=False)
			assignments_deleted = s.query(QuestionnaireAssignment).filter(QuestionnaireAssignment.id.in_(assignment_ids)).delete(synchronize_session=False)
		# eliminar usuario al final
		s.delete(u)
		s.commit()
		return jsonify({
			"message": "user_deleted",
			"deleted": {"assignments": assignments_deleted, "responses": responses_deleted, "items": items_deleted}
		})

@admin_dynamic_bp.route("/admin/questionnaires", methods=["POST"])
def create_questionnaire():
	if not _enabled():
		return _error("dynamic_disabled", 404)
	payload = request.get_json(force=True, silent=True) or {}
	# Code becomes optional: auto-generate a unique slug from title when omitted
	title = (payload.get("title") or "").strip()
	description = (payload.get("description") or "").strip()
	req_code = (payload.get("code") or "").strip()
	if not title:
		return _error("title_required")
	# helper slugify
	import re as _re
	def _slugify(s):
		s = s.lower().strip()
		s = _re.sub(r"[^a-z0-9\-\s]", "", s)
		s = _re.sub(r"\s+", "-", s)
		s = _re.sub(r"-+", "-", s)
		return s[:64] or "q"
	with Session(engine) as s:
		# determine code
		code = req_code or _slugify(title)
		# ensure uniqueness by suffixing -2, -3 ...
		base = code
		i = 2
		while s.execute(select(func.count()).select_from(Questionnaire).where(Questionnaire.code==code)).scalar():
			code = f"{base}-{i}"
			i += 1
			if len(code) > 64:
				code = code[:64]
		q = Questionnaire(code=code, title=title, description=description)
		# initial draft version number 1
		v = QuestionnaireVersion(questionnaire=q, version_number=1, status="draft")
		s.add(q)
		s.commit()
		return jsonify({
			"message": "questionnaire_created",
			"questionnaire": {"code": q.code, "title": q.title},
			"version": {"id": v.id, "number": v.version_number, "status": v.status}
		}), 201

# --- Admin: Questions for a version (for viewer columns) ---

@admin_dynamic_bp.route("/admin/versions/<int:version_id>/questions", methods=["GET"])
def list_questions_for_version(version_id: int):
	"""Return ordered list of questions for a version with codes and basic metadata.
	Response: { items: [ { id, code, text, type, section: { id, title, order } } ] }
	"""
	if not _enabled():
		return _error("dynamic_disabled", 404)
	with Session(engine) as s:
		v = s.get(QuestionnaireVersion, version_id)
		if not v:
			return _error("version_not_found", 404)
		items = []
		for sec in sorted(v.sections, key=lambda ss: ss.order):
			for qu in sorted(sec.questions, key=lambda qq: qq.order):
				items.append({
					"id": qu.id,
					"code": qu.code,
					"text": qu.text,
					"type": qu.type,
					"required": qu.required,
					"order": qu.order,
					"section": {"id": sec.id, "title": sec.title, "order": sec.order}
				})
		return jsonify({"items": items})

@admin_dynamic_bp.route("/admin/questionnaires/<code>/clone-published", methods=["POST"])
def clone_latest_published(code: str):
	if not _enabled():
		return _error("dynamic_disabled", 404)
	with Session(engine) as s:
		q = s.execute(select(Questionnaire).where(Questionnaire.code==code)).scalar_one_or_none()
		if not q:
			return _error("not_found", 404)
		# Prefer latest published; if none, fallback to latest existing version
		published = [v for v in q.versions if v.status == "published"]
		if published:
			base = sorted(published, key=lambda v: v.version_number)[-1]
		else:
			if not q.versions:
				return _error("no_versions", 409)
			base = sorted(q.versions, key=lambda v: v.version_number)[-1]
		new_number = max(v.version_number for v in q.versions) + 1
		new_v = QuestionnaireVersion(questionnaire=q, version_number=new_number, status="draft")
		s.add(new_v)  # add early to avoid SAWarning on relationship operations
		# deep copy sections/questions/options
		for sec in sorted(base.sections, key=lambda s2: s2.order):
			new_sec = Section(version=new_v, title=sec.title, description=sec.description, order=sec.order, active_flag=sec.active_flag)
			s.add(new_sec)
			for qu in sorted(sec.questions, key=lambda q2: q2.order):
				new_q = Question(
					section=new_sec,
					code=qu.code,
					text=qu.text,
					type=qu.type,
					required=qu.required,
					order=qu.order,
					validation_rules=qu.validation_rules,
					visible_if=qu.visible_if,
					is_computed=qu.is_computed,
					computed_expression=qu.computed_expression,
					active_flag=qu.active_flag
				)
				s.add(new_q)
				for op in sorted(qu.options, key=lambda o2: o2.order):
					new_op = Option(question=new_q, value=op.value, label=op.label, order=op.order, is_other_flag=op.is_other_flag, active_flag=op.active_flag)
					s.add(new_op)
		s.commit()
		return jsonify({
			"message": "cloned",
			"version": {"id": new_v.id, "number": new_v.version_number, "status": new_v.status}
		}), 201

@admin_dynamic_bp.route("/admin/questionnaires/<code>/new-version", methods=["POST"])
def create_new_blank_version(code: str):
	"""Create a new blank draft version for a questionnaire.
	Increments version_number to max+1, or creates number 1 if no versions exist.
	"""
	if not _enabled():
		return _error("dynamic_disabled", 404)
	with Session(engine) as s:
		q = s.execute(select(Questionnaire).where(Questionnaire.code==code)).scalar_one_or_none()
		if not q:
			return _error("not_found", 404)
		if q.versions:
			new_number = max(v.version_number for v in q.versions) + 1
		else:
			new_number = 1
		new_v = QuestionnaireVersion(questionnaire=q, version_number=new_number, status="draft")
		s.add(new_v)
		s.commit()
		return jsonify({"message": "new_version_created", "version": {"id": new_v.id, "number": new_v.version_number, "status": new_v.status}}), 201

@admin_dynamic_bp.route("/admin/versions/<int:version_id>", methods=["GET"])
def get_version(version_id: int):
	"""Fetch full structure for a given version (draft or published) for admin UI."""
	if not _enabled():
		return _error("dynamic_disabled", 404)
	with Session(engine) as s:
		v = s.get(QuestionnaireVersion, version_id)
		if not v:
			return _error("version_not_found", 404)
		return jsonify({"version": _serialize_version(v)})

@admin_dynamic_bp.route("/admin/versions/<int:version_id>", methods=["DELETE"])
def delete_version(version_id: int):
	"""Eliminar una versión de cuestionario (sólo si está en draft)."""
	if not _enabled():
		return _error("dynamic_disabled", 404)
	with Session(engine) as s:
		v = s.get(QuestionnaireVersion, version_id)
		if not v:
			return _error("version_not_found", 404)
		# Force purge path (?force=1): purge assignments/responses/items, then delete version
		force = str(request.args.get("force", "")).lower() in ("1", "true", "yes")
		if force:
			if v.status == "published":
				return _error("cannot_force_delete_published", 409)
			# delete data for this version (cascade app-level)
			assignment_ids = [i for (i,) in s.query(QuestionnaireAssignment.id).filter_by(questionnaire_version_id=v.id).all()]
			responses_deleted = 0
			items_deleted = 0
			assignments_deleted = 0
			if assignment_ids:
				response_ids = [i for (i,) in s.query(Response.id).filter(Response.assignment_id.in_(assignment_ids)).all()]
				if response_ids:
					items_deleted = s.query(ResponseItem).filter(ResponseItem.response_id.in_(response_ids)).delete(synchronize_session=False)
					responses_deleted = s.query(Response).filter(Response.id.in_(response_ids)).delete(synchronize_session=False)
				assignments_deleted = s.query(QuestionnaireAssignment).filter(QuestionnaireAssignment.id.in_(assignment_ids)).delete(synchronize_session=False)
			s.delete(v)
			s.commit()
			return jsonify({"message": "version_force_deleted", "deleted": {"assignments": assignments_deleted, "responses": responses_deleted, "items": items_deleted}})
		# Si no es force: permitir borrar si la versión NO está publicada, eliminando sus datos relacionados
		if v.status in ("draft", "archived"):
			# eliminar respuestas y asignaciones de esta versión
			assignment_ids = [i for (i,) in s.query(QuestionnaireAssignment.id).filter_by(questionnaire_version_id=v.id).all()]
			if assignment_ids:
				response_ids = [i for (i,) in s.query(Response.id).filter(Response.assignment_id.in_(assignment_ids)).all()]
				if response_ids:
					s.query(ResponseItem).filter(ResponseItem.response_id.in_(response_ids)).delete(synchronize_session=False)
					s.query(Response).filter(Response.id.in_(response_ids)).delete(synchronize_session=False)
				s.query(QuestionnaireAssignment).filter(QuestionnaireAssignment.id.in_(assignment_ids)).delete(synchronize_session=False)
			# ahora eliminar la versión
			s.delete(v)
			s.commit()
			return jsonify({"message": "version_deleted"})
		# Si es publicada: permitir borrar sólo si NO es la última publicada y no tiene asignaciones
		if v.status == "published":
			q = v.questionnaire
			published_numbers = [vv.version_number for vv in q.versions if vv.status == "published"]
			latest_published = max(published_numbers) if published_numbers else None
			if latest_published is None or v.version_number == latest_published:
				return _error("cannot_delete_latest_published", 409)
			has_assignments = s.query(QuestionnaireAssignment).filter_by(questionnaire_version_id=v.id).limit(1).count() > 0
			if has_assignments:
				return _error("version_has_assignments", 409)
			try:
				s.delete(v)
				s.commit()
			except IntegrityError:
				s.rollback()
				return _error("version_has_responses", 409)
			return jsonify({"message": "version_deleted"})
		# Si está archivada: permitir borrar solo si no tiene asignaciones
		if v.status == "archived":
			has_assignments = s.query(QuestionnaireAssignment).filter_by(questionnaire_version_id=v.id).limit(1).count() > 0
			if has_assignments:
				return _error("version_has_assignments", 409)
			try:
				s.delete(v)
				s.commit()
			except IntegrityError:
				s.rollback()
				return _error("version_has_responses", 409)
			return jsonify({"message": "version_deleted"})
		return _error("unsupported_version_status", 409)

@admin_dynamic_bp.route("/admin/versions/<int:version_id>/force-delete", methods=["DELETE"])
def force_delete_version(version_id: int):
	"""Eliminar DEFINITIVAMENTE una versión ARCHIVADA junto con sus datos relacionados.
	Reglas:
	  - Solo permitido si la versión está en estado 'archived'.
	  - Elimina ResponseItem -> Response -> Assignment de esa versión, luego la versión.
	Devuelve conteos de eliminados para auditoría.
	"""
	if not _enabled():
		return _error("dynamic_disabled", 404)
	with Session(engine) as s:
		v = s.get(QuestionnaireVersion, version_id)
		if not v:
			return _error("version_not_found", 404)
		if v.status != "archived":
			return _error("archive_first", 409)
		# Collect ids
		assignment_ids = [a.id for a in s.query(QuestionnaireAssignment.id).filter_by(questionnaire_version_id=v.id).all()]
		assignment_ids = [i for (i,) in assignment_ids] if assignment_ids and isinstance(assignment_ids[0], tuple) else assignment_ids
		responses_deleted = 0
		items_deleted = 0
		assignments_deleted = 0
		if assignment_ids:
			# Responses for assignments
			response_ids = [r.id for r in s.query(Response.id).filter(Response.assignment_id.in_(assignment_ids)).all()]
			response_ids = [i for (i,) in response_ids] if response_ids and isinstance(response_ids[0], tuple) else response_ids
			if response_ids:
				# Delete items, then responses
				items_deleted = s.query(ResponseItem).filter(ResponseItem.response_id.in_(response_ids)).delete(synchronize_session=False)
				responses_deleted = s.query(Response).filter(Response.id.in_(response_ids)).delete(synchronize_session=False)
			assignments_deleted = s.query(QuestionnaireAssignment).filter(QuestionnaireAssignment.id.in_(assignment_ids)).delete(synchronize_session=False)
		# Finally, delete the version
		s.delete(v)
		s.commit()
		return jsonify({
			"message": "version_force_deleted",
			"deleted": {
				"assignments": assignments_deleted,
				"responses": responses_deleted,
				"items": items_deleted
			}
		})

@admin_dynamic_bp.route("/admin/versions/<int:version_id>", methods=["PATCH"])
def patch_version(version_id: int):
	"""Actualizar metadatos de la versión.
	Body: { "status": "draft" } para despublicar, { "status": "published" } para publicar (demote siblings),
	o { "status": "archived" } para archivar (solo permitido desde draft).
	"""
	if not _enabled():
		return _error("dynamic_disabled", 404)
	payload = request.get_json(force=True, silent=True) or {}
	target_status = (payload.get("status") or "").strip()
	if target_status not in ("draft", "published", "archived"):
		return _error("invalid_status")
	with Session(engine) as s:
		v = s.get(QuestionnaireVersion, version_id)
		if not v:
			return _error("version_not_found", 404)
		if target_status == "draft":
			if v.status != "published":
				return _error("only_published_can_be_unpublished", 409)
			v.status = "draft"
			v.valid_from = None
			v.valid_to = None
			s.commit()
			return jsonify({"message": "version_unpublished", "version": {"id": v.id, "status": v.status}})
		if target_status == "published":
			if v.status != "draft":
				return _error("not_draft", 409)
			# Demote siblings
			siblings = v.questionnaire.versions if v.questionnaire else []
			for sibl in siblings:
				if sibl.id != v.id and sibl.status == "published":
					sibl.status = "draft"
					sibl.valid_from = None
					sibl.valid_to = None
			v.status = "published"
			v.valid_from = func.now()
			s.commit()
			return jsonify({"message": "published", "version": {"id": v.id, "status": v.status}})
		if target_status == "archived":
			if v.status != "draft":
				return _error("archive_only_from_draft", 409)
			v.status = "archived"
			v.valid_to = func.now()
			s.commit()
			return jsonify({"message": "archived", "version": {"id": v.id, "status": v.status}})
	return _error("unsupported_operation", 409)

@admin_dynamic_bp.route("/admin/versions/<int:version_id>/metadata", methods=["PATCH"]) 
def patch_version_metadata(version_id: int):
	"""Actualizar metadata_json de la versión (para binding ML u otros metadatos).

	Body: { "metadata_json": { ... } }
	"""
	if not _enabled():
		return _error("dynamic_disabled", 404)
	payload = request.get_json(force=True, silent=True) or {}
	metadata = payload.get("metadata_json")
	if metadata is not None and not isinstance(metadata, dict):
		return _error("metadata_json_must_be_object")
	with Session(engine) as s:
		v = s.get(QuestionnaireVersion, version_id)
		if not v:
			return _error("version_not_found", 404)
		v.metadata_json = metadata
		s.commit()
		return jsonify({"message": "metadata_updated", "version": {"id": v.id}})

# --- Admin: ML Models registry (for FeatureBindingWizard) ---

@admin_dynamic_bp.route("/admin/ml/models", methods=["GET"])
def list_ml_models():
	if not _enabled():
		return _error("dynamic_disabled", 404)
	try:
		models = ml_registry.list_available_models()
		return jsonify({"items": models})
	except Exception as e:
		current_app.logger.exception("list_ml_models_failed")
		return _error(str(e), 500)


@admin_dynamic_bp.route("/admin/ml/models/<string:model_id>", methods=["GET"])
def get_ml_model(model_id: str):
	if not _enabled():
		return _error("dynamic_disabled", 404)
	try:
		cfg = ml_registry.get_model_config(model_id)
		if not cfg:
			return _error("model_not_found", 404)
		return jsonify({"model": cfg})
	except Exception as e:
		current_app.logger.exception("get_ml_model_failed")
		return _error(str(e), 500)


@admin_dynamic_bp.route("/admin/versions/<int:version_id>/ml/check", methods=["GET"])
def check_version_ml_binding(version_id: int):
	"""Diagnostics for ML binding of a version.

	Returns JSON with:
	  - binding_present
	  - artifact_path, resolved_path, artifact_exists
	  - features_mapped: [{ name, source, type, ok }]
	  - unmapped: [name]
	  - unknown_sources: [source]
	  - feature_order_ok
	"""
	if not _enabled():
		return _error("dynamic_disabled", 404)
	with Session(engine) as s:
		v = s.get(QuestionnaireVersion, version_id)
		if not v:
			return _error("version_not_found", 404)
		meta = getattr(v, "metadata_json", None) or {}
		b = (meta or {}).get("ml_binding") or {}
		if not b:
			return jsonify({"binding_present": False})

		artifact_path = b.get("artifact_path") or ""
		resolved_path = _resolve_path(artifact_path) if artifact_path else None
		import os
		artifact_exists = bool(resolved_path and os.path.exists(resolved_path))

		# Build question codes set for this version
		qcodes = set()
		for sec in v.sections:
			for qu in sec.questions:
				qcodes.add(qu.code)

		feats = []
		unmapped = []
		unknown = []
		feature_order_ok = True
		order_seen = set()
		try:
			inp = b.get("input") or {}
			specs = inp.get("features") or []
			for spec in specs:
				if not isinstance(spec, dict):
					continue
				name = spec.get("name")
				src = spec.get("source")
				ftype = (spec.get("type") or "number")
				if not name or not src:
					feats.append({"name": name or "", "source": src or "", "type": ftype, "ok": False})
					if not src:
						unmapped.append(name or "")
					continue
				ok = src in qcodes
				feats.append({"name": name, "source": src, "type": ftype, "ok": ok})
				if not ok:
					unknown.append(src)
			# order check
			ord_list = (b.get("input") or {}).get("feature_order") or [f.get("name") for f in (inp.get("features") or []) if f.get("name")]
			if not ord_list or len(set(ord_list)) != len(ord_list):
				feature_order_ok = False
			else:
				names = [f.get("name") for f in (inp.get("features") or []) if f.get("name")]
				feature_order_ok = set(ord_list) == set(names)
		except Exception:
			pass

		return jsonify({
			"binding_present": True,
			"artifact_path": artifact_path,
			"resolved_path": resolved_path,
			"artifact_exists": artifact_exists,
			"features_mapped": feats,
			"unmapped": [u for u in unmapped if u],
			"unknown_sources": list(sorted(set(unknown))),
			"feature_order_ok": bool(feature_order_ok),
		})

@admin_dynamic_bp.route("/admin/versions/<int:version_id>/ml/recompute", methods=["POST"])
def recompute_version_ml(version_id: int):
	"""Recalcular el resumen ML para respuestas ya almacenadas de una versión.

	Body opcional:
	{ "only_finalized": bool, "limit": int, "dry_run": bool }

	Respuesta: { processed, ok, dry_run }
	"""
	if not _enabled():
		return _error("dynamic_disabled", 404)
	payload = request.get_json(silent=True) or {}
	only_finalized = bool(payload.get("only_finalized", False))
	try:
		limit = int(payload.get("limit")) if payload.get("limit") is not None else None
	except Exception:
		limit = None
	dry_run = bool(payload.get("dry_run", False))

	from sqlalchemy.orm import Session
	from sqlalchemy import desc
	from backend.services.ml_inference_service import try_infer_and_store

	with Session(engine) as s:
		v = s.get(QuestionnaireVersion, version_id)
		if not v:
			return _error("version_not_found", 404)
		# Build code maps
		qmap_by_code = {}
		qid_to_code = {}
		for sec in v.sections:
			for qu in sec.questions:
				qmap_by_code[qu.code] = qu
				qid_to_code[qu.id] = qu.code

		q_assign = s.query(QuestionnaireAssignment).filter_by(questionnaire_version_id=v.id)
		if only_finalized:
			q_assign = q_assign.filter_by(status="finalized")
		assigns = q_assign.order_by(desc(QuestionnaireAssignment.last_activity_at)).all()

		processed = 0
		updated = 0
		for a in assigns:
			if limit and processed >= limit:
				break
			processed += 1
			resp = s.query(Response).filter_by(assignment_id=a.id).order_by(desc(Response.id)).first()
			if not resp:
				continue
			items = s.query(ResponseItem).filter_by(response_id=resp.id).all()
			answers = {}
			for it in items:
				code_key = qid_to_code.get(it.question_id)
				if not code_key:
					continue
				answers[code_key] = _parse_value(it)
			ml_summary = try_infer_and_store(s, v, resp, answers, qmap_by_code)
			if isinstance(ml_summary, dict) and ml_summary.get("status") == "ok":
				updated += 1
			if not dry_run and (processed % 50 == 0):
				s.commit()
		if not dry_run:
			s.commit()
		return jsonify({"processed": processed, "ok": updated, "dry_run": dry_run})

@admin_dynamic_bp.route("/admin/versions/<int:version_id>/clone", methods=["POST"])
def clone_version(version_id: int):
	"""Clona una versión específica a un nuevo borrador del mismo cuestionario."""
	if not _enabled():
		return _error("dynamic_disabled", 404)
	with Session(engine) as s:
		base = s.get(QuestionnaireVersion, version_id)
		if not base:
			return _error("version_not_found", 404)
		q = base.questionnaire
		if not q:
			return _error("questionnaire_not_found", 404)
		new_number = (max(v.version_number for v in q.versions) + 1) if q.versions else 1
		new_v = QuestionnaireVersion(questionnaire=q, version_number=new_number, status="draft")
		s.add(new_v)
		for sec in sorted(base.sections, key=lambda s2: s2.order):
			new_sec = Section(version=new_v, title=sec.title, description=sec.description, order=sec.order, active_flag=sec.active_flag)
			s.add(new_sec)
			for qu in sorted(sec.questions, key=lambda q2: q2.order):
				new_q = Question(section=new_sec, code=qu.code, text=qu.text, type=qu.type, required=qu.required, order=qu.order,
								  validation_rules=qu.validation_rules, visible_if=qu.visible_if,
								  is_computed=qu.is_computed, computed_expression=qu.computed_expression, active_flag=qu.active_flag)
				s.add(new_q)
				for op in sorted(qu.options, key=lambda o2: o2.order):
					s.add(Option(question=new_q, value=op.value, label=op.label, order=op.order, is_other_flag=op.is_other_flag, active_flag=op.active_flag))
		s.commit()
		return jsonify({"message": "cloned", "version": {"id": new_v.id, "number": new_v.version_number, "status": new_v.status}}), 201

# --- Sections ---

@admin_dynamic_bp.route("/admin/versions/<int:version_id>/sections", methods=["POST"])
def add_section(version_id: int):
	if not _enabled():
		return _error("dynamic_disabled", 404)
	payload = request.get_json(force=True, silent=True) or {}
	title = (payload.get("title") or "").strip()
	order = payload.get("order")
	if not title:
		return _error("title_required")
	with Session(engine) as s:
		v = s.get(QuestionnaireVersion, version_id)
		if not v:
			return _error("version_not_found", 404)
		if v.status != "draft":
			return _error("version_not_draft", 409)
		if order is None:
			# default last
			existing_orders = [sec.order for sec in v.sections]
			order = (max(existing_orders)+1) if existing_orders else 1
		sec = Section(version=v, title=title, description=payload.get("description"), order=order, active_flag=True)
		s.add(sec)
		s.commit()
		return jsonify({"message": "section_added", "section": {"id": sec.id, "title": sec.title, "order": sec.order}}), 201

# --- Questions ---

@admin_dynamic_bp.route("/admin/sections/<int:section_id>/questions", methods=["POST"])
def add_question(section_id: int):
	if not _enabled():
		return _error("dynamic_disabled", 404)
	payload = request.get_json(force=True, silent=True) or {}
	code = (payload.get("code") or "").strip()
	text = (payload.get("text") or "").strip()
	q_type = (payload.get("type") or "text").strip()
	required = bool(payload.get("required", True))
	if not text:
		return _error("text_required")
	with Session(engine) as s:
		sec = s.get(Section, section_id)
		if not sec:
			return _error("section_not_found", 404)
		if sec.version.status != "draft":
			return _error("version_not_draft", 409)
		# Determine code: if missing, auto-generate a unique slug from text within the version
		existing_codes = {q.code for s2 in sec.version.sections for q in s2.questions}
		if not code:
			import re as _re
			def _slugify(s: str) -> str:
				s = s.lower().strip()
				s = _re.sub(r"[^a-z0-9\-\s]", "", s)
				s = _re.sub(r"\s+", "-", s)
				s = _re.sub(r"-+", "-", s)
				return s[:64] or "q"
			base = _slugify(text)
			candidate = base
			i = 2
			while candidate in existing_codes:
				candidate = f"{base}-{i}"
				i += 1
				if len(candidate) > 64:
					candidate = candidate[:64]
			code = candidate
		else:
			if code in existing_codes:
				return _error("code_exists", 409)
		existing_orders = [q.order for q in sec.questions]
		order = payload.get("order")
		if order is None:
			order = (max(existing_orders)+1) if existing_orders else 1
		qu = Question(section=sec, code=code, text=text, type=q_type, required=required, order=order,
					   validation_rules=payload.get("validation_rules"), visible_if=payload.get("visible_if"))
		s.add(qu)
		s.commit()
		return jsonify({"message": "question_added", "question": {"id": qu.id, "code": qu.code, "order": qu.order}}), 201

# --- Options ---

@admin_dynamic_bp.route("/admin/questions/<int:question_id>/options", methods=["POST"])
def add_option(question_id: int):
	if not _enabled():
		return _error("dynamic_disabled", 404)
	payload = request.get_json(force=True, silent=True) or {}
	value = (payload.get("value") or "").strip()
	label = (payload.get("label") or "").strip()
	if not value or not label:
		return _error("value_and_label_required")
	with Session(engine) as s:
		qu = s.get(Question, question_id)
		if not qu:
			return _error("question_not_found", 404)
		if qu.section.version.status != "draft":
			return _error("version_not_draft", 409)
		existing_values = {o.value for o in qu.options}
		if value in existing_values:
			return _error("value_exists", 409)
		existing_orders = [o.order for o in qu.options]
		order = payload.get("order")
		if order is None:
			order = (max(existing_orders)+1) if existing_orders else 1
		op = Option(question=qu, value=value, label=label, order=order, is_other_flag=bool(payload.get("is_other")))
		s.add(op)
		s.commit()
		return jsonify({"message": "option_added", "option": {"id": op.id, "value": op.value, "order": op.order}}), 201

# --- Publish Version ---

@admin_dynamic_bp.route("/admin/versions/<int:version_id>/publish", methods=["POST"])
def publish_version(version_id: int):
	if not _enabled():
		return _error("dynamic_disabled", 404)
	with Session(engine) as s:
		v = s.get(QuestionnaireVersion, version_id)
		if not v:
			return _error("version_not_found", 404)
		if v.status != "draft":
			return _error("not_draft", 409)
		# Integrity checks
		if len(v.sections) == 0:
			return _error("no_sections", 409)
		total_questions = sum(len(sec.questions) for sec in v.sections)
		if total_questions == 0:
			return _error("no_questions", 409)
		# Code uniqueness already enforced per section; ensure global uniqueness within version
		codes = []
		for sec in v.sections:
			for q in sec.questions:
				codes.append(q.code)
		if len(codes) != len(set(codes)):
			return _error("duplicate_codes", 409)
		# Demote other published siblings to draft
		siblings = v.questionnaire.versions if v.questionnaire else []
		for sibl in siblings:
			if sibl.id != v.id and sibl.status == "published":
				sibl.status = "draft"
				sibl.valid_from = None
				sibl.valid_to = None
		v.status = "published"
		v.valid_from = func.now()
		s.commit()
		return jsonify({"message": "published", "version": {"id": v.id, "number": v.version_number}})

# --- Admin: Responses viewer endpoints ---

@admin_dynamic_bp.route("/admin/versions/<int:version_id>/responses/wide", methods=["GET"])
def list_responses_wide(version_id: int):
	"""Return a paginated, pivoted table of latest responses for the given version.

	Query params:
	- page: int (default 1)
	- page_size: int (default 20, max 200)
	- user_code: optional substring filter
	- status: optional in [in_progress, submitted, finalized]
	- date_from, date_to: ISO date-time filters on submitted_at

	Response:
	{
	  page, page_size, total,
	  base_columns: [..],
	  question_codes: [..],
	  items: [ { response_id, assignment_id, user_code, status, started_at, submitted_at, finalized_at, last_activity_at, <code>: <value>, ... } ]
	}
	"""
	if not _enabled():
		return _error("dynamic_disabled", 404)
	page = max(1, int(request.args.get("page", 1)))
	try:
		page_size = int(request.args.get("page_size", 20))
	except Exception:
		page_size = 20
	page_size = max(1, min(200, page_size))
	user_code_like = (request.args.get("user_code") or "").strip()
	status_filter = (request.args.get("status") or "").strip() or None
	date_from = (request.args.get("date_from") or "").strip() or None
	date_to = (request.args.get("date_to") or "").strip() or None

	with Session(engine) as s:
		v = s.get(QuestionnaireVersion, version_id)
		if not v:
			return _error("version_not_found", 404)
		# Build map question_id -> code for this version
		qid_to_code = {}
		for sec in v.sections:
			for qu in sec.questions:
				qid_to_code[qu.id] = qu.code

		# Subquery: latest response per assignment
		from sqlalchemy import select as _select
		latest_resp_sq = (
			s.query(Response.assignment_id, func.max(Response.id).label("rid"))
			.join(QuestionnaireAssignment, QuestionnaireAssignment.id == Response.assignment_id)
			.filter(QuestionnaireAssignment.questionnaire_version_id == version_id)
			.group_by(Response.assignment_id)
			.subquery()
		)
		base_q = (
			s.query(Response, QuestionnaireAssignment)
			.join(latest_resp_sq, (Response.assignment_id == latest_resp_sq.c.assignment_id) & (Response.id == latest_resp_sq.c.rid))
			.join(QuestionnaireAssignment, QuestionnaireAssignment.id == Response.assignment_id)
		)
		if user_code_like:
			base_q = base_q.filter(QuestionnaireAssignment.user_code.ilike(f"%{user_code_like}%"))
		if status_filter in ("in_progress", "submitted", "finalized"):
			base_q = base_q.filter(QuestionnaireAssignment.status == status_filter)
		from sqlalchemy import and_
		if date_from:
			try:
				base_q = base_q.filter(Response.submitted_at >= date_from)
			except Exception:
				pass
		if date_to:
			try:
				base_q = base_q.filter(Response.submitted_at <= date_to)
			except Exception:
				pass
		# Count total
		count_q = base_q.statement.with_only_columns(func.count()).order_by(None)
		total = s.execute(count_q).scalar() or 0
		# Page
		rows = base_q.order_by(Response.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
		response_ids = [resp.id for (resp, _a) in rows]
		items_map = {}
		if response_ids:
			items = s.query(ResponseItem).filter(ResponseItem.response_id.in_(response_ids)).all()
			for it in items:
				items_map.setdefault(it.response_id, []).append(it)
		# Build rows
		base_cols = ["response_id", "assignment_id", "user_code", "status", "started_at", "submitted_at", "finalized_at", "last_activity_at", "ml_prob", "ml_decision", "ml_label", "ml_status", "ml_reason"]
		q_codes = [qid_to_code[q.id] for sec in sorted(v.sections, key=lambda ss: ss.order) for q in sorted(sec.questions, key=lambda qq: qq.order)]
		result_items = []
		for (resp, assign) in rows:
			row = {
				"response_id": resp.id,
				"assignment_id": assign.id,
				"user_code": assign.user_code,
				"status": assign.status,
				"started_at": resp.started_at.isoformat() if resp.started_at else None,
				"submitted_at": resp.submitted_at.isoformat() if resp.submitted_at else None,
				"finalized_at": resp.finalized_at.isoformat() if resp.finalized_at else None,
				"last_activity_at": assign.last_activity_at.isoformat() if assign.last_activity_at else None,
			}
			# Include ML summary columns when available
			try:
				sc = getattr(resp, 'summary_cache', None)
				ml = sc.get('ml') if isinstance(sc, dict) else None
				if isinstance(ml, dict):
					prob = ml.get('prob')
					decision = ml.get('decision')
					row['ml_prob'] = float(prob) if (prob is not None) else None
					row['ml_decision'] = bool(decision) if (decision is not None) else None
					row['ml_label'] = ml.get('label') or None
					row['ml_status'] = ml.get('status') or None
					row['ml_reason'] = ml.get('reason') or None
				else:
					row['ml_prob'] = None
					row['ml_decision'] = None
					row['ml_label'] = None
					row['ml_status'] = None
					row['ml_reason'] = None
			except Exception:
				row['ml_prob'] = None
				row['ml_decision'] = None
				row['ml_label'] = None
				row['ml_status'] = None
				row['ml_reason'] = None
			for it in items_map.get(resp.id, []):
				code = qid_to_code.get(it.question_id)
				if code:
					row[code] = _parse_value(it)
			result_items.append(row)
		return jsonify({
			"page": page,
			"page_size": page_size,
			"total": int(total),
			"base_columns": base_cols,
			"question_codes": q_codes,
			"items": result_items,
		})

@admin_dynamic_bp.route("/admin/responses/<int:response_id>", methods=["GET"])
def get_response_detail(response_id: int):
	"""Return a single response with normalized items keyed by question code."""
	if not _enabled():
		return _error("dynamic_disabled", 404)
	with Session(engine) as s:
		resp = s.get(Response, response_id)
		if not resp:
			return _error("not_found", 404)
		assign = s.get(QuestionnaireAssignment, resp.assignment_id)
		# Build code map for that version
		qid_to_code = {}
		if assign:
			v = s.get(QuestionnaireVersion, assign.questionnaire_version_id)
			if v:
				for sec in v.sections:
					for qu in sec.questions:
						qid_to_code[qu.id] = qu.code
		items = s.query(ResponseItem).filter_by(response_id=resp.id).all()
		answers = {}
		for it in items:
			code = qid_to_code.get(it.question_id)
			if code:
				answers[code] = _parse_value(it)
		return jsonify({
			"response": {
				"id": resp.id,
				"assignment_id": resp.assignment_id,
				"user_code": assign.user_code if assign else None,
				"status": assign.status if assign else None,
				"started_at": resp.started_at.isoformat() if resp.started_at else None,
				"submitted_at": resp.submitted_at.isoformat() if resp.submitted_at else None,
				"finalized_at": resp.finalized_at.isoformat() if resp.finalized_at else None,
				"answers": answers,
			}
		})

# --- Edit / Delete entities (draft only) ---

def _ensure_draft(entity):
	if isinstance(entity, Section):
		return entity.version.status == "draft"
	if isinstance(entity, Question):
		return entity.section.version.status == "draft"
	if isinstance(entity, Option):
		return entity.question.section.version.status == "draft"
	if isinstance(entity, QuestionnaireVersion):
		return entity.status == "draft"
	return False

@admin_dynamic_bp.route("/admin/sections/<int:section_id>", methods=["PATCH"])
def patch_section(section_id: int):
	if not _enabled():
		return _error("dynamic_disabled", 404)
	payload = request.get_json(force=True, silent=True) or {}
	with Session(engine) as s:
		sec = s.get(Section, section_id)
		if not sec:
			return _error("section_not_found", 404)
		if not _ensure_draft(sec):
			return _error("version_not_draft", 409)
		if "title" in payload:
			t = (payload.get("title") or "").strip()
			if t:
				sec.title = t
		if "description" in payload:
			sec.description = payload.get("description")
		if "order" in payload and isinstance(payload.get("order"), int):
			sec.order = payload["order"]
		s.commit()
		return jsonify({"message": "section_updated"})

@admin_dynamic_bp.route("/admin/sections/<int:section_id>", methods=["DELETE"])
def delete_section(section_id: int):
	if not _enabled():
		return _error("dynamic_disabled", 404)
	with Session(engine) as s:
		sec = s.get(Section, section_id)
		if not sec:
			return _error("section_not_found", 404)
		if not _ensure_draft(sec):
			return _error("version_not_draft", 409)
		# Prevent delete if any question in this section has responses
		try:
			q_ids = [q.id for q in sec.questions]
			if q_ids:
				items = s.query(func.count(ResponseItem.id)).filter(ResponseItem.question_id.in_(q_ids)).scalar() or 0
				if items > 0:
					return _error("section_has_responses", 409, responses=items)
		except Exception:
			pass
		try:
			s.delete(sec)
			s.commit()
		except IntegrityError:
			s.rollback()
			return _error("section_has_responses", 409)
		return jsonify({"message": "section_deleted"})

@admin_dynamic_bp.route("/admin/questions/<int:question_id>", methods=["PATCH"])
def patch_question(question_id: int):
	if not _enabled():
		return _error("dynamic_disabled", 404)
	payload = request.get_json(force=True, silent=True) or {}
	with Session(engine) as s:
		qu = s.get(Question, question_id)
		if not qu:
			return _error("question_not_found", 404)
		if not _ensure_draft(qu):
			return _error("version_not_draft", 409)
		# Allow code change (must stay unique within version) and other fields.
		if "code" in payload:
			new_code = (payload.get("code") or "").strip()
			if not new_code:
				return _error("code_empty")
			sibling_codes = {q.code for s2 in qu.section.version.sections for q in s2.questions if q.id != qu.id}
			if new_code in sibling_codes:
				return _error("code_exists", 409)
			qu.code = new_code
		editable_fields = ["text", "type", "required", "order", "validation_rules", "visible_if"]
		for field in editable_fields:
			if field in payload:
				setattr(qu, field, payload[field])
		s.commit()
		return jsonify({"message": "question_updated"})

@admin_dynamic_bp.route("/admin/questions/<int:question_id>", methods=["DELETE"])
def delete_question(question_id: int):
	if not _enabled():
		return _error("dynamic_disabled", 404)
	with Session(engine) as s:
		qu = s.get(Question, question_id)
		if not qu:
			return _error("question_not_found", 404)
		if not _ensure_draft(qu):
			return _error("version_not_draft", 409)
		# Prevent delete if there are response items for this question
		try:
			items = s.query(func.count(ResponseItem.id)).filter(ResponseItem.question_id == qu.id).scalar() or 0
			if items > 0:
				return _error("question_has_responses", 409, responses=items)
		except Exception:
			pass
		try:
			s.delete(qu)
			s.commit()
		except IntegrityError:
			s.rollback()
			return _error("question_has_responses", 409)
		return jsonify({"message": "question_deleted"})

@admin_dynamic_bp.route("/admin/options/<int:option_id>", methods=["PATCH"])
def patch_option(option_id: int):
	if not _enabled():
		return _error("dynamic_disabled", 404)
	payload = request.get_json(force=True, silent=True) or {}
	with Session(engine) as s:
		op = s.get(Option, option_id)
		if not op:
			return _error("option_not_found", 404)
		if not _ensure_draft(op):
			return _error("version_not_draft", 409)
		if "label" in payload:
			op.label = payload["label"]
		if "value" in payload:
			# ensure uniqueness
			sibling_values = {o.value for o in op.question.options if o.id != op.id}
			if payload["value"] in sibling_values:
				return _error("value_exists", 409)
			op.value = payload["value"]
		if "order" in payload and isinstance(payload.get("order"), int):
			op.order = payload["order"]
		if "is_other" in payload:
			op.is_other_flag = bool(payload.get("is_other"))
		s.commit()
		return jsonify({"message": "option_updated"})

@admin_dynamic_bp.route("/admin/versions/<int:version_id>/insert-icfes-package", methods=["POST"])
def insert_icfes_package(version_id: int):
	"""Insert a standard ICFES section with 5 component score questions (0..100)
	and an optional global score question (0..500).

	Codes created:
	- puntaje_lectura_critica
	- puntaje_matematicas
	- puntaje_sociales_ciudadanas
	- puntaje_ciencias_naturales
	- puntaje_ingles
	- puntaje_global_saber11 (optional, computed/optional)
	"""
	if not _enabled():
		return _error("dynamic_disabled", 404)
	payload = request.get_json(silent=True) or {}
	include_global = bool(payload.get("include_global", True))
	with Session(engine) as s:
		v = s.get(QuestionnaireVersion, version_id)
		if not v:
			return _error("version_not_found", 404)
		if v.status != "draft":
			return _error("version_not_draft", 409)
		# Determine next section order
		existing_orders = [sec.order for sec in v.sections]
		order = (max(existing_orders)+1) if existing_orders else 1
		sec = Section(version=v, title="Resultados ICFES Saber 11", description="Ingrese sus puntajes por componente (0-100). El puntaje global se calcula automáticamente.", order=order, active_flag=True)
		s.add(sec)
		def _add_q(code, text, q_order):
			q = Question(section=sec, code=code, text=text, type="number", required=False, order=q_order,
						validation_rules={"min": 0, "max": 100})
			s.add(q)
			return q
		q1 = _add_q("puntaje_lectura_critica", "Puntaje Lectura Crítica (0-100)", 1)
		q2 = _add_q("puntaje_matematicas", "Puntaje Matemáticas (0-100)", 2)
		q3 = _add_q("puntaje_sociales_ciudadanas", "Puntaje Sociales y Ciudadanas (0-100)", 3)
		q4 = _add_q("puntaje_ciencias_naturales", "Puntaje Ciencias Naturales (0-100)", 4)
		q5 = _add_q("puntaje_ingles", "Puntaje Inglés (0-100)", 5)
		if include_global:
			qg = Question(section=sec, code="puntaje_global_saber11", text="Puntaje Global Saber 11 (0-500)", type="number", required=False, order=6,
						validation_rules={"min": 0, "max": 500}, is_computed=False)
			s.add(qg)
		s.commit()
		return jsonify({"message": "icfes_inserted", "section": {"id": sec.id, "title": sec.title}}), 201

@admin_dynamic_bp.route("/admin/options/<int:option_id>", methods=["DELETE"])
def delete_option(option_id: int):
	if not _enabled():
		return _error("dynamic_disabled", 404)
	with Session(engine) as s:
		op = s.get(Option, option_id)
		if not op:
			return _error("option_not_found", 404)
		if not _ensure_draft(op):
			return _error("version_not_draft", 409)
		s.delete(op)
		s.commit()
		return jsonify({"message": "option_deleted"})

@admin_dynamic_bp.route("/admin/questionnaires/<code>", methods=["DELETE"])
def delete_questionnaire(code: str):
	if not _enabled():
		return _error("dynamic_disabled", 404)
	with Session(engine) as s:
		q = s.execute(select(Questionnaire).where(Questionnaire.code==code)).scalar_one_or_none()
		if not q:
			return _error("not_found", 404)
		# forbid deletion if any published version exists
		if any(v.status == "published" for v in q.versions):
			return _error("has_published_version", 409)
		# For questionnaires without published versions, allow deletion even if there are responses:
		# cascade application-level removal of assignments/responses/items for all versions, then delete versions and questionnaire
		versions = list(q.versions)
		total_assignments = 0
		total_responses = 0
		total_items = 0
		for v in versions:
			assignment_ids = [i for (i,) in s.query(QuestionnaireAssignment.id).filter_by(questionnaire_version_id=v.id).all()]
			if assignment_ids:
				response_ids = [i for (i,) in s.query(Response.id).filter(Response.assignment_id.in_(assignment_ids)).all()]
				if response_ids:
					total_items += s.query(ResponseItem).filter(ResponseItem.response_id.in_(response_ids)).delete(synchronize_session=False)
					total_responses += s.query(Response).filter(Response.id.in_(response_ids)).delete(synchronize_session=False)
				total_assignments += s.query(QuestionnaireAssignment).filter(QuestionnaireAssignment.id.in_(assignment_ids)).delete(synchronize_session=False)
		# delete versions (cascade relationships will remove sections/questions/options)
		for v in list(q.versions):
			s.delete(v)
		s.delete(q)
		s.commit()
		return jsonify({"message": "questionnaire_deleted", "deleted": {"versions": len(versions), "assignments": total_assignments, "responses": total_responses, "items": total_items}})

@admin_dynamic_bp.route("/admin/questionnaires/<code>", methods=["PATCH"])
def patch_questionnaire(code: str):
	"""Actualizar metadatos del cuestionario (por ahora: status active/inactive)."""
	if not _enabled():
		return _error("dynamic_disabled", 404)
	payload = request.get_json(force=True, silent=True) or {}
	new_status = (payload.get("status") or "").strip()
	if new_status not in ("active", "inactive"):
		return _error("invalid_status")
	with Session(engine) as s:
		q = s.execute(select(Questionnaire).where(Questionnaire.code==code)).scalar_one_or_none()
		if not q:
			return _error("not_found", 404)
		q.status = new_status
		s.commit()
		return jsonify({"message": "questionnaire_updated", "status": q.status})

@admin_dynamic_bp.route("/admin/questionnaires/<code>/force-delete", methods=["DELETE"])
def force_delete_questionnaire(code: str):
	"""Eliminar DEFINITIVAMENTE un cuestionario COMPLETO con todas sus versiones y datos.
	Requisitos:
	  - Todas las versiones deben estar en estado 'archived'.
	Pasos:
	  - Por cada versión: eliminar ResponseItem -> Response -> Assignment
	  - Eliminar versiones, secciones, preguntas y opciones
	  - Eliminar el cuestionario
	"""
	if not _enabled():
		return _error("dynamic_disabled", 404)
	with Session(engine) as s:
		q = s.execute(select(Questionnaire).where(Questionnaire.code == code)).scalar_one_or_none()
		if not q:
			return _error("not_found", 404)
		versions = list(q.versions)
		if not versions:
			s.delete(q)
			s.commit()
			return jsonify({"message": "questionnaire_force_deleted", "deleted": {"versions": 0, "assignments": 0, "responses": 0, "items": 0}})
		non_archived = [v.version_number for v in versions if v.status != "archived"]
		if non_archived:
			return _error("archive_versions_first", 409, non_archived=non_archived)
		# Delete data per version
		total_assignments = 0
		total_responses = 0
		total_items = 0
		for v in versions:
			assignment_ids = [i for (i,) in s.query(QuestionnaireAssignment.id).filter_by(questionnaire_version_id=v.id).all()]
			if assignment_ids:
				response_ids = [i for (i,) in s.query(Response.id).filter(Response.assignment_id.in_(assignment_ids)).all()]
				if response_ids:
					total_items += s.query(ResponseItem).filter(ResponseItem.response_id.in_(response_ids)).delete(synchronize_session=False)
					total_responses += s.query(Response).filter(Response.id.in_(response_ids)).delete(synchronize_session=False)
				total_assignments += s.query(QuestionnaireAssignment).filter(QuestionnaireAssignment.id.in_(assignment_ids)).delete(synchronize_session=False)
		# Delete versions (will cascade to sections/questions/options)
		for v in versions:
			s.delete(v)
		# Finally delete questionnaire
		s.delete(q)
		s.commit()
		return jsonify({
			"message": "questionnaire_force_deleted",
			"deleted": {"versions": len(versions), "assignments": total_assignments, "responses": total_responses, "items": total_items}
		})

