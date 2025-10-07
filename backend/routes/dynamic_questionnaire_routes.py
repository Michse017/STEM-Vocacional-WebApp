"""Public endpoints for dynamic questionnaire consumption.
"""
from flask import Blueprint, jsonify, current_app, request
from sqlalchemy.orm import Session
from sqlalchemy.orm import selectinload
from time import time
from database.controller import engine
from database.dynamic_models import (
	Questionnaire, QuestionnaireVersion, Section, Question, Option,
	QuestionnaireAssignment, Response, ResponseItem
)
from backend.services.dynamic_validation import validate_answers
from database.controller import get_usuario_by_codigo
from sqlalchemy import desc
from sqlalchemy.sql import func

dynamic_questionnaire_bp = Blueprint("dynamic_questionnaire", __name__)

# --- Tiny in-process cache for serialized versions (reduces rework within short bursts) ---
_SER_CACHE = {}
_SER_TTL_SECONDS = 10

def _serialize_version_cached(version: "QuestionnaireVersion"):
	now = time()
	entry = _SER_CACHE.get(version.id)
	if entry and (now - entry[0] < _SER_TTL_SECONDS):
		return entry[1]
	payload = _serialize_version(version)
	_SER_CACHE[version.id] = (now, payload)
	return payload

@dynamic_questionnaire_bp.route("/dynamic/overview", methods=["GET"])
def dynamic_overview():
	"""Return combined data to minimize client round-trips.
	Query params: user_code
	Response shape:
	{
	  primary: { questionnaire: <structure or null>, user: {status, answers} | null },
	  items: [ { code, title, status, progress_percent, finalized_at, submitted_at } ]
	}
	"""
	if not _feature_enabled():
		return jsonify({"error": "disabled"}), 404
	user_code = (request.args.get("user_code") or "").strip() or None
	with Session(engine) as s:
		# Primary
		primary_payload = {"questionnaire": None, "user": None}
		q_primary = (
			s.query(Questionnaire)
			.options(selectinload(Questionnaire.versions).selectinload(QuestionnaireVersion.sections).selectinload(Section.questions).selectinload(Question.options))
			.filter(Questionnaire.is_primary == True, Questionnaire.status == "active")
			.first()
		)
		if q_primary:
			versions_sorted = sorted(q_primary.versions, key=lambda v: v.version_number, reverse=True)
			v_primary = next((v for v in versions_sorted if v.status == "published"), versions_sorted[0] if versions_sorted else None)
			if v_primary:
				primary_payload["questionnaire"] = _serialize_version_cached(v_primary)
				if user_code:
					assign = s.query(QuestionnaireAssignment).filter_by(user_code=user_code, questionnaire_version_id=v_primary.id).order_by(desc(QuestionnaireAssignment.last_activity_at)).first()
					if assign:
						resp = s.query(Response).filter_by(assignment_id=assign.id).order_by(desc(Response.id)).first()
						answers = {}
						if resp:
							qmap = {}
							for sec in v_primary.sections:
								for qu in sec.questions:
									qmap[qu.id] = qu.code
							items = s.query(ResponseItem).filter_by(response_id=resp.id).all()
							for it in items:
								code_key = qmap.get(it.question_id)
								if not code_key:
									continue
								answers[code_key] = _parse_value(it)
						primary_payload["user"] = {"status": assign.status, "answers": answers}
		# Items for user
		result_items = []
		qs = (
			s.query(Questionnaire)
			.options(selectinload(Questionnaire.versions).selectinload(QuestionnaireVersion.sections).selectinload(Section.questions))
			.filter(Questionnaire.status == "active")
			.all()
		)
		for q in qs:
			if getattr(q, 'is_primary', False):
				continue
			versions_sorted = sorted(q.versions, key=lambda v: v.version_number, reverse=True)
			target_version = next((v for v in versions_sorted if v.status == "published"), None)
			if not target_version:
				continue
			total_questions = sum(len(sec.questions) for sec in target_version.sections)
			status = "new"
			progress = 0
			finalized_at = None
			submitted_at = None
			if user_code:
				assign = s.query(QuestionnaireAssignment).filter_by(user_code=user_code, questionnaire_version_id=target_version.id).order_by(desc(QuestionnaireAssignment.last_activity_at)).first()
				if assign:
					status = assign.status
					resp = s.query(Response).filter_by(assignment_id=assign.id).order_by(desc(Response.id)).first()
					answered = 0
					if resp:
						items = s.query(ResponseItem).filter_by(response_id=resp.id).all()
						for it in items:
							if it.numeric_value is not None:
								answered += 1
							elif it.value is not None and str(it.value).strip() != "":
								answered += 1
						finalized_at = resp.finalized_at.isoformat() if resp.finalized_at else None
						submitted_at = resp.submitted_at.isoformat() if resp.submitted_at else None
					if total_questions > 0:
						progress = max(0, min(100, int(round((answered / total_questions) * 100))))
			result_items.append({
				"code": q.code,
				"title": q.title,
				"status": status,
				"progress_percent": progress,
				"finalized_at": finalized_at,
				"submitted_at": submitted_at,
			})
	return jsonify({"primary": primary_payload, "items": result_items})

@dynamic_questionnaire_bp.route("/dynamic/questionnaires", methods=["GET"])
def list_questionnaires():
	if not _feature_enabled():
		return jsonify({"message": "Dynamic questionnaires disabled"}), 404
	with Session(engine) as session:
		qs = (
			session.query(Questionnaire)
			.options(selectinload(Questionnaire.versions))
			.filter(Questionnaire.status == "active")
			.all()
		)
		data = []
		for q in qs:
			# Ocultar el cuestionario principal del listado público
			if getattr(q, 'is_primary', False):
				continue
			has_published = any(v.status == "published" for v in q.versions)
			if not has_published:
				continue
			data.append({"code": q.code, "title": q.title, "status": q.status, "versions": len(q.versions)})
	return jsonify({"items": data})

@dynamic_questionnaire_bp.route("/dynamic/primary", methods=["GET"])
def get_primary_questionnaire():
	"""Return the primary questionnaire structure (latest published version)."""
	if not _feature_enabled():
		return jsonify({"message": "Dynamic questionnaires disabled"}), 404
	with Session(engine) as session:
		q = (
			session.query(Questionnaire)
			.options(selectinload(Questionnaire.versions).selectinload(QuestionnaireVersion.sections).selectinload(Section.questions).selectinload(Question.options))
			.filter(Questionnaire.is_primary == True, Questionnaire.status == "active")
			.first()
		)
		if not q:
			return jsonify({"error": "not_found"}), 404
		versions_sorted = sorted(q.versions, key=lambda v: v.version_number, reverse=True)
		version = next((v for v in versions_sorted if v.status == "published"), versions_sorted[0] if versions_sorted else None)
		if not version:
			return jsonify({"error": "no_versions"}), 404
		structure = _serialize_version_cached(version)
	return jsonify({"questionnaire": structure})

@dynamic_questionnaire_bp.route("/dynamic/questionnaires/<code>", methods=["GET"])
def get_questionnaire(code: str):
	if not _feature_enabled():
		return jsonify({"message": "Dynamic questionnaires disabled"}), 404
	with Session(engine) as session:
		q = (
			session.query(Questionnaire)
			.options(selectinload(Questionnaire.versions).selectinload(QuestionnaireVersion.sections).selectinload(Section.questions).selectinload(Question.options))
			.filter_by(code=code)
			.first()
		)
		if not q:
			return jsonify({"error": "not_found"}), 404
		# prefer latest published; if none, fallback to latest draft
		versions_sorted = sorted(q.versions, key=lambda v: v.version_number, reverse=True)
		version = next((v for v in versions_sorted if v.status == "published"), versions_sorted[0] if versions_sorted else None)
		if not version:
			return jsonify({"error": "no_versions"}), 404
		structure = _serialize_version_cached(version)
	return jsonify({"questionnaire": structure})

@dynamic_questionnaire_bp.route("/dynamic/questionnaires/<code>/responses", methods=["POST"])
def submit_response(code: str):
	"""Shadow mode response submission.
	Payload format:
	{
	  "user_code": "abc123",  # optional for now
	  "answers": { "question_code": <value>, ... }
	}
	- Accepts only latest published version; if no published, uses latest draft.
	- Basic validation: required questions must be present (non-empty), type-specific basic checks.
	- Stores normalized items.
	"""
	if not _feature_enabled():
		return jsonify({"error": "disabled"}), 404
	payload = request.get_json(force=True, silent=True) or {}
	user_code = (payload.get("user_code") or "").strip() or None
	answers = payload.get("answers") or {}
	if not isinstance(answers, dict):
		return jsonify({"error": "invalid_answers_format"}), 400
	from sqlalchemy.orm import Session
	from database.controller import engine
	with Session(engine) as s:
		q = s.query(Questionnaire).filter_by(code=code).first()
		if not q:
			return jsonify({"error": "not_found"}), 404
		# choose version: prefer latest published else latest draft
		versions_sorted = sorted(q.versions, key=lambda v: v.version_number, reverse=True)
		target_version = None
		for v in versions_sorted:
			if v.status == "published":
				target_version = v
				break
		if not target_version and versions_sorted:
			target_version = versions_sorted[0]
		if not target_version:
			return jsonify({"error": "no_version"}), 409
		ok, errs, normalized = validate_answers(target_version, answers)
		if not ok:
			return jsonify({"error": "validation", "details": errs}), 400
		# Rebuild question map for persistence
		question_map = {}
		for sec in target_version.sections:
			for qu in sec.questions:
				question_map[qu.code] = qu
	# Persist
		assign = QuestionnaireAssignment(user_code=user_code, questionnaire_version_id=target_version.id, status="submitted")
		s.add(assign)
		s.flush()
		resp = Response(assignment_id=assign.id)
		s.add(resp)
		s.flush()
		_upsert_items(s, resp.id, question_map, normalized)
		s.commit()
		return jsonify({"message": "stored", "version_id": target_version.id, "response_id": resp.id, "assignment_id": assign.id}), 201

@dynamic_questionnaire_bp.route("/dynamic/questionnaires/<code>/mine", methods=["GET"])
def get_my_dynamic_status(code: str):
	if not _feature_enabled():
		return jsonify({"error": "disabled"}), 404
	user_code = (request.args.get("user_code") or "").strip() or None
	if not user_code:
		return jsonify({"error": "missing_user_code"}), 400
	with Session(engine) as s:
		q = s.query(Questionnaire).filter_by(code=code).first()
		if not q:
			return jsonify({"error": "not_found"}), 404
		versions_sorted = sorted(q.versions, key=lambda v: v.version_number, reverse=True)
		target_version = None
		for v in versions_sorted:
			if v.status == "published":
				target_version = v
				break
		if not target_version and versions_sorted:
			target_version = versions_sorted[0]
		if not target_version:
			return jsonify({"error": "no_version"}), 409
		assign = s.query(QuestionnaireAssignment).filter_by(user_code=user_code, questionnaire_version_id=target_version.id).order_by(desc(QuestionnaireAssignment.last_activity_at)).first()
		if not assign:
			return jsonify({"status": "new", "answers": {} })
		# take latest response for assignment
		resp = s.query(Response).filter_by(assignment_id=assign.id).order_by(desc(Response.id)).first()
		answers = {}
		if resp:
			# build code map for question ids
			question_map = {}
			for sec in target_version.sections:
				for qu in sec.questions:
					question_map[qu.id] = qu.code
			items = s.query(ResponseItem).filter_by(response_id=resp.id).all()
			for it in items:
				code_key = question_map.get(it.question_id)
				if not code_key:
					continue
				answers[code_key] = _parse_value(it)
		return jsonify({
			"status": assign.status,
			"answers": answers
		})

@dynamic_questionnaire_bp.route("/dynamic/questionnaires/<code>/save", methods=["POST"])
def save_response(code: str):
	if not _feature_enabled():
		return jsonify({"error": "disabled"}), 404
	payload = request.get_json(force=True, silent=True) or {}
	user_code = (payload.get("user_code") or "").strip() or None
	answers = payload.get("answers") or {}
	if not isinstance(answers, dict) or not user_code:
		return jsonify({"error": "invalid_payload"}), 400
	with Session(engine) as s:
		q = s.query(Questionnaire).filter_by(code=code).first()
		if not q:
			return jsonify({"error": "not_found"}), 404
		versions_sorted = sorted(q.versions, key=lambda v: v.version_number, reverse=True)
		target_version = next((v for v in versions_sorted if v.status == "published"), versions_sorted[0] if versions_sorted else None)
		if not target_version:
			return jsonify({"error": "no_version"}), 409
		# Build question map
		question_map = {}
		for sec in target_version.sections:
			for qu in sec.questions:
				question_map[qu.code] = qu
		# Find or create assignment
		assign = s.query(QuestionnaireAssignment).filter_by(user_code=user_code, questionnaire_version_id=target_version.id).first()
		if assign and assign.status == "finalized":
			return jsonify({"error": "finalized"}), 409
		if not assign:
			assign = QuestionnaireAssignment(user_code=user_code, questionnaire_version_id=target_version.id, status="in_progress")
			s.add(assign)
			s.flush()
		# Find or create response
		resp = s.query(Response).filter_by(assignment_id=assign.id).order_by(desc(Response.id)).first()
		if not resp:
			resp = Response(assignment_id=assign.id)
			s.add(resp)
			s.flush()
		# validation with strict partial rules: block certain critical errors
		ok, errs, normalized = validate_answers(target_version, answers)
		# Determine critical errors that must block save
		icfes_codes = {
			"puntaje_lectura_critica",
			"puntaje_matematicas",
			"puntaje_sociales_ciudadanas",
			"puntaje_ciencias_naturales",
			"puntaje_ingles",
			"puntaje_global_saber11",
		}
		date_errs = {"invalid_date", "before_min_date", "after_max_date", "before_other_date", "after_other_date", "min_age", "max_age"}
		critical = {}
		for k, v in (errs or {}).items():
			# Missing inline 'otro_' when selected
			if isinstance(k, str) and k.startswith("otro_") and v == "required":
				critical[k] = v; continue
			# ICFES strict rules
			if k in icfes_codes and v in ("out_of_range", "not_integer"):
				critical[k] = v; continue
			# Date bounds invalid
			q = question_map.get(k)
			if q is not None and getattr(q, "type", None) == "date" and isinstance(v, str) and v in date_errs:
				critical[k] = v; continue
			# Invalid options for choice/multi
			if v == "invalid_option" or v == "not_array" or (isinstance(v, dict) and v.get("invalid_options")):
				critical[k] = v; continue
		if critical:
			return jsonify({"error": "validation", "details": errs, "critical": critical, "mode": "save_strict"}), 400
		_upsert_items(s, resp.id, question_map, normalized)
		assign.status = "in_progress"
		s.commit()
		return jsonify({"message": "saved", "assignment_id": assign.id, "response_id": resp.id})

@dynamic_questionnaire_bp.route("/dynamic/questionnaires/<code>/finalize", methods=["POST"])
def finalize_response(code: str):
	if not _feature_enabled():
		return jsonify({"error": "disabled"}), 404
	payload = request.get_json(force=True, silent=True) or {}
	user_code = (payload.get("user_code") or "").strip() or None
	answers = payload.get("answers") or {}
	if not isinstance(answers, dict) or not user_code:
		return jsonify({"error": "invalid_payload"}), 400
	with Session(engine) as s:
		q = s.query(Questionnaire).filter_by(code=code).first()
		if not q:
			return jsonify({"error": "not_found"}), 404
		versions_sorted = sorted(q.versions, key=lambda v: v.version_number, reverse=True)
		target_version = next((v for v in versions_sorted if v.status == "published"), versions_sorted[0] if versions_sorted else None)
		if not target_version:
			return jsonify({"error": "no_version"}), 409
		# validate strictly
		ok, errs, normalized = validate_answers(target_version, answers)
		if not ok:
			return jsonify({"error": "validation", "details": errs}), 400
		# Build map
		question_map = {}
		for sec in target_version.sections:
			for qu in sec.questions:
				question_map[qu.code] = qu
		# Find or create assignment
		assign = s.query(QuestionnaireAssignment).filter_by(user_code=user_code, questionnaire_version_id=target_version.id).first()
		if not assign:
			assign = QuestionnaireAssignment(user_code=user_code, questionnaire_version_id=target_version.id, status="in_progress")
			s.add(assign)
			s.flush()
		# Response
		resp = s.query(Response).filter_by(assignment_id=assign.id).order_by(desc(Response.id)).first()
		if not resp:
			resp = Response(assignment_id=assign.id)
			s.add(resp)
			s.flush()
		_upsert_items(s, resp.id, question_map, normalized)
		assign.status = "finalized"
		resp.finalized_at = func.now()
		resp.submitted_at = func.now()
		s.commit()
		return jsonify({"message": "finalized", "assignment_id": assign.id, "response_id": resp.id})

# --- Helpers ---

def _feature_enabled():
	return current_app.config.get("ENABLE_DYNAMIC_QUESTIONNAIRES") == True

def _serialize_version(version: QuestionnaireVersion):
	q = version.questionnaire if hasattr(version, "questionnaire") else None
	return {
		"questionnaire_id": q.id if q else None,
		"code": getattr(q, "code", None),
		"title": getattr(q, "title", None),
		"version_id": version.id,
		"version_number": version.version_number,
		"status": version.status,
		"sections": [
			{
				"id": s.id,
				"title": s.title,
				"order": s.order,
				"questions": [
					{
						"id": qu.id,
						"code": qu.code,
						"text": qu.text,
						"type": qu.type,
						"visible_if": getattr(qu, "visible_if", None),
						"required": qu.required,
						"order": qu.order,
						"options": [
							{"value": op.value, "label": op.label, "is_other": op.is_other_flag, "order": op.order}
							for op in sorted(qu.options, key=lambda o: o.order)
						],
					}
					for qu in sorted(s.questions, key=lambda q: q.order)
				],
			}
			for s in sorted(version.sections, key=lambda sec: sec.order)
		],
	}

def _parse_value(item: ResponseItem):
	if item.numeric_value is not None:
		return item.numeric_value
	if item.value is None:
		return None
	# handle boolean stored as string
	if item.value in ("true", "false"):
		return item.value == "true"
	# handle CSV for multi_choice
	if "," in item.value and item.value.count(",") >= 1:
		return [v for v in item.value.split(",") if v]
	return item.value

def _upsert_items(s: Session, response_id: int, question_map_by_code: dict, normalized: dict):
	# we need a map from code->question for ids
	for code_key, value in normalized.items():
		qu = question_map_by_code.get(code_key)
		if not qu:
			continue
		item = s.query(ResponseItem).filter_by(response_id=response_id, question_id=qu.id).first()
		item_kwargs = {"value": None, "numeric_value": None}
		if qu.type in ("number", "scale_1_5") and isinstance(value, int):
			item_kwargs["numeric_value"] = value
			item_kwargs["value"] = str(value)
		elif qu.type == "boolean":
			item_kwargs["numeric_value"] = 1 if value else 0
			item_kwargs["value"] = "true" if value else "false"
		elif qu.type == "multi_choice":
			item_kwargs["value"] = ",".join(value)
		else:
			item_kwargs["value"] = str(value) if value is not None else None
		if item:
			item.value = item_kwargs["value"]
			item.numeric_value = item_kwargs["numeric_value"]
		else:
			s.add(ResponseItem(response_id=response_id, question_id=qu.id, **item_kwargs))


@dynamic_questionnaire_bp.route("/dynamic/prefill", methods=["GET"])
def prefill_values():
	"""Return last known values for given codes across any questionnaires for a user.
	Query params: user_code, codes=code1,code2
	Response: { values: { code: value, ... } }
	"""
	if not _feature_enabled():
		return jsonify({"error": "disabled"}), 404
	user_code = (request.args.get("user_code") or "").strip() or None
	codes_param = (request.args.get("codes") or "").strip()
	codes = [c.strip() for c in codes_param.split(",") if c.strip()]
	if not user_code or not codes:
		return jsonify({"values": {}})
	values = {c: None for c in codes}
	# Strategy: find latest responses for this user, scan items for matching question codes
	with Session(engine) as s:
		# Gather recent responses for this user across assignments, newest first
		assigns = s.query(QuestionnaireAssignment).filter_by(user_code=user_code).order_by(desc(QuestionnaireAssignment.last_activity_at)).all()
		# Build map question_id->code for versions lazily
		qid_to_code_cache = {}
		for a in assigns:
			resp = s.query(Response).filter_by(assignment_id=a.id).order_by(desc(Response.id)).first()
			if not resp:
				continue
			# Build version code map on demand
			if a.questionnaire_version_id not in qid_to_code_cache:
				v = s.get(QuestionnaireVersion, a.questionnaire_version_id)
				cmap = {}
				if v:
					for sec in v.sections:
						for qu in sec.questions:
							cmap[qu.id] = qu.code
				qid_to_code_cache[a.questionnaire_version_id] = cmap
			cmap = qid_to_code_cache.get(a.questionnaire_version_id, {})
			items = s.query(ResponseItem).filter_by(response_id=resp.id).all()
			for it in items:
				c = cmap.get(it.question_id)
				if c and (c in values) and values[c] is None:
					values[c] = _parse_value(it)
			# stop early if all found
			if all(values[c] is not None for c in codes):
				break
	return jsonify({"values": values})


@dynamic_questionnaire_bp.route("/dynamic/my-questionnaires", methods=["GET"])
def my_questionnaires():
	"""Aggregate list of dynamic questionnaires for a user with status and progress.
	Query params: user_code
	Excludes the principal questionnaire 'vocacional'. Only active + published ones are returned.
	Progress: percentage of answered items (any value/numeric_value) over total questions in target version.
	"""
	if not _feature_enabled():
		return jsonify({"error": "disabled"}), 404
	user_code = (request.args.get("user_code") or "").strip() or None
	if not user_code:
		return jsonify({"error": "missing_user_code"}), 400
	with Session(engine) as s:
		result = []
		qs = s.query(Questionnaire).filter(Questionnaire.status == "active").all()
		for q in qs:
			if getattr(q, 'is_primary', False):
				continue
			versions_sorted = sorted(q.versions, key=lambda v: v.version_number, reverse=True)
			target_version = next((v for v in versions_sorted if v.status == "published"), None)
			if not target_version:
				continue
			total_questions = sum(len(sec.questions) for sec in target_version.sections)
			# find assignment & latest response
			assign = s.query(QuestionnaireAssignment).filter_by(user_code=user_code, questionnaire_version_id=target_version.id).order_by(desc(QuestionnaireAssignment.last_activity_at)).first()
			status = assign.status if assign else "new"
			answered = 0
			resp = None
			if assign:
				resp = s.query(Response).filter_by(assignment_id=assign.id).order_by(desc(Response.id)).first()
				if resp:
					items = s.query(ResponseItem).filter_by(response_id=resp.id).all()
					for it in items:
						if it.numeric_value is not None:
							answered += 1
						elif it.value is not None and str(it.value).strip() != "":
							answered += 1
			progress = 0
			if total_questions > 0:
				progress = max(0, min(100, int(round((answered / total_questions) * 100))))
			result.append({
				"code": q.code,
				"title": q.title,
				"status": status,
				"progress_percent": progress,
				"finalized_at": resp.finalized_at.isoformat() if assign and resp and resp.finalized_at else None,
				"submitted_at": resp.submitted_at.isoformat() if assign and resp and resp.submitted_at else None,
			})
	return jsonify({"items": result})
