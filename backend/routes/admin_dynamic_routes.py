"""Admin endpoints (CRUD + lifecycle) for dynamic questionnaires.
Feature-flagged by ENABLE_DYNAMIC_QUESTIONNAIRES.
Authentication/authorization NOT yet enforced (add later) – do NOT expose to production without guards.
"""
from flask import Blueprint, request, jsonify, current_app
from backend.services.auth_admin_service import require_admin
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
				# finalizado (legacy) removed
			})
		nuevo = create_usuario(db, codigo)
		return jsonify({
			"id_usuario": nuevo.id_usuario,
			"codigo_estudiante": nuevo.codigo_estudiante,
			# finalizado (legacy) removed
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
	"""Actualizar metadatos de la versión.
	Body: { "status": "draft" } para despublicar, o { "status": "published" } para publicar (demote siblings).
	"""
	if not _enabled():
		return _error("dynamic_disabled", 404)
	payload = request.get_json(force=True, silent=True) or {}
	target_status = (payload.get("status") or "").strip()
	if target_status not in ("draft", "published"):
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
	return _error("unsupported_operation", 409)

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

