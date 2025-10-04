"""Admin endpoints (CRUD + lifecycle) for dynamic questionnaires.
Feature-flagged by ENABLE_DYNAMIC_QUESTIONNAIRES.
Authentication/authorization NOT yet enforced (add later) – do NOT expose to production without guards.
"""
from flask import Blueprint, request, jsonify, current_app
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from database.controller import engine
from database.dynamic_models import (
	Questionnaire, QuestionnaireVersion, Section, Question, Option,
	QuestionnaireAssignment, Response, ResponseItem
)
from database.controller import SessionLocal, get_usuario_by_codigo, create_usuario

admin_dynamic_bp = Blueprint("admin_dynamic", __name__)

# --- Helpers ---

def _enabled():
	return current_app.config.get("ENABLE_DYNAMIC_QUESTIONNAIRES") is True

def _error(msg, status=400, **extra):
	body = {"error": msg}
	if extra:
		body.update(extra)
	return jsonify(body), status


# --- Access control (shared secret via header) ---

@admin_dynamic_bp.before_request
def _require_admin_access_key():  # type: ignore[override]
	"""Require X-Admin-Access header to match ADMIN_ACCESS_KEY when configured.
	- Skips OPTIONS to allow CORS preflight.
	- If ADMIN_ACCESS_KEY is empty/None, no enforcement (useful for local-only dev).
	"""
	if request.method == "OPTIONS":
		return None
	configured_key = current_app.config.get("ADMIN_ACCESS_KEY")
	if configured_key:
		provided = request.headers.get("X-Admin-Access", "")
		if provided != configured_key:
			return jsonify({"error": "unauthorized"}), 401
	return None

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

@admin_dynamic_bp.route("/usuarios", methods=["POST"])
def admin_create_user():
	"""Crea un usuario por código (o devuelve el existente). ID es autoincrement en BD.
	Body: { "codigo_estudiante": "..." }
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
				"finalizado": getattr(existing, 'finalizado', False)
			})
		nuevo = create_usuario(db, codigo)
		return jsonify({
			"id_usuario": nuevo.id_usuario,
			"codigo_estudiante": nuevo.codigo_estudiante,
			"finalizado": getattr(nuevo, 'finalizado', False)
		}), 201
	except Exception as e:
		db.rollback()
		return _error(str(e), 500)
	finally:
		db.close()

@admin_dynamic_bp.route("/admin/questionnaires", methods=["POST"])
def create_questionnaire():
	if not _enabled():
		return _error("dynamic_disabled", 404)
	payload = request.get_json(force=True, silent=True) or {}
	code = (payload.get("code") or "").strip()
	title = (payload.get("title") or "").strip()
	description = (payload.get("description") or "").strip()
	if not code or not title:
		return _error("code_and_title_required")
	if len(code) > 64:
		return _error("code_too_long")
	with Session(engine) as s:
		exists = s.execute(select(func.count()).select_from(Questionnaire).where(Questionnaire.code==code)).scalar()
		if exists:
			return _error("code_exists", 409)
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

@admin_dynamic_bp.route("/admin/questionnaires/<code>/clone-published", methods=["POST"])
def clone_latest_published(code: str):
	if not _enabled():
		return _error("dynamic_disabled", 404)
	with Session(engine) as s:
		q = s.execute(select(Questionnaire).where(Questionnaire.code==code)).scalar_one_or_none()
		if not q:
			return _error("not_found", 404)
		published = [v for v in q.versions if v.status == "published"]
		if not published:
			return _error("no_published_version", 409)
		base = sorted(published, key=lambda v: v.version_number)[-1]
		new_number = max(v.version_number for v in q.versions) + 1
		new_v = QuestionnaireVersion(questionnaire=q, version_number=new_number, status="draft")
		s.add(new_v)  # add early to avoid SAWarning on relationship operations
		# deep copy sections/questions/options
		for sec in base.sections:
			new_sec = Section(version=new_v, title=sec.title, description=sec.description, order=sec.order, active_flag=sec.active_flag)
			for qu in sec.questions:
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
				for op in qu.options:
					Option(question=new_q, value=op.value, label=op.label, order=op.order, is_other_flag=op.is_other_flag, active_flag=op.active_flag)
		s.commit()
		return jsonify({
			"message": "cloned",
			"version": {"id": new_v.id, "number": new_v.version_number, "status": new_v.status}
		}), 201

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
		if v.status == "draft":
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
			s.delete(v)
			s.commit()
			return jsonify({"message": "version_deleted"})
		# Si está archivada: permitir borrar solo si no tiene asignaciones
		if v.status == "archived":
			has_assignments = s.query(QuestionnaireAssignment).filter_by(questionnaire_version_id=v.id).limit(1).count() > 0
			if has_assignments:
				return _error("version_has_assignments", 409)
			s.delete(v)
			s.commit()
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
	"""Actualizar metadatos de la versión. Soporta archivar versiones publicadas.
	Body: { "status": "archived" }
	Regla: Solo se puede archivar si la versión está publicada. Archivar no elimina datos
	y permite ocultar la versión del consumo público sin perder historial.
	"""
	if not _enabled():
		return _error("dynamic_disabled", 404)
	payload = request.get_json(force=True, silent=True) or {}
	target_status = (payload.get("status") or "").strip()
	if target_status not in ("archived", "published"):
		return _error("invalid_status")
	with Session(engine) as s:
		v = s.get(QuestionnaireVersion, version_id)
		if not v:
			return _error("version_not_found", 404)
		if target_status == "archived":
			if v.status != "published":
				return _error("only_published_can_be_archived", 409)
			v.status = "archived"
			v.valid_to = func.now()
			s.commit()
			return jsonify({"message": "version_archived", "version": {"id": v.id, "status": v.status}})
		if target_status == "published":
			if v.status != "archived":
				return _error("only_archived_can_be_unarchived", 409)
			v.status = "published"
			v.valid_to = None
			s.commit()
			return jsonify({"message": "version_unarchived", "version": {"id": v.id, "status": v.status}})
	return _error("unsupported_operation", 409)

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
	if not code or not text:
		return _error("code_and_text_required")
	with Session(engine) as s:
		sec = s.get(Section, section_id)
		if not sec:
			return _error("section_not_found", 404)
		if sec.version.status != "draft":
			return _error("version_not_draft", 409)
		# uniqueness of code within version
		existing_codes = {q.code for s2 in sec.version.sections for q in s2.questions}
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
		v.status = "published"
		v.valid_from = func.now()
		s.commit()
		return jsonify({"message": "published", "version": {"id": v.id, "number": v.version_number}})

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
		s.delete(sec)
		s.commit()
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
		s.delete(qu)
		s.commit()
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
		s.commit()
		return jsonify({"message": "option_updated"})

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
		s.delete(q)
		s.commit()
		return jsonify({"message": "questionnaire_deleted"})

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

