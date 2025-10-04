"""Public endpoints for dynamic questionnaire consumption.
"""
from flask import Blueprint, jsonify, current_app, request
from sqlalchemy.orm import Session
from database.controller import engine
from database.dynamic_models import (
	Questionnaire, QuestionnaireVersion, Section, Question, Option,
	QuestionnaireAssignment, Response, ResponseItem
)
from backend.services.dynamic_validation import validate_answers
from sqlalchemy import desc
from sqlalchemy.sql import func

dynamic_questionnaire_bp = Blueprint("dynamic_questionnaire", __name__)

@dynamic_questionnaire_bp.route("/dynamic/questionnaires", methods=["GET"])
def list_questionnaires():
	if not _feature_enabled():
		return jsonify({"message": "Dynamic questionnaires disabled"}), 404
	with Session(engine) as session:
		qs = session.query(Questionnaire).filter(Questionnaire.status == "active").all()
		data = []
		for q in qs:
			# Ocultar el cuestionario principal 'vocacional' del listado público
			if q.code == "vocacional":
				continue
			has_published = any(v.status == "published" for v in q.versions)
			if not has_published:
				continue
			data.append({"code": q.code, "title": q.title, "status": q.status, "versions": len(q.versions)})
	return jsonify({"items": data})

@dynamic_questionnaire_bp.route("/dynamic/questionnaires/<code>", methods=["GET"])
def get_questionnaire(code: str):
	if not _feature_enabled():
		return jsonify({"message": "Dynamic questionnaires disabled"}), 404
	with Session(engine) as session:
		q = session.query(Questionnaire).filter_by(code=code).first()
		if not q:
			return jsonify({"error": "not_found"}), 404
		# prefer latest published; if none, fallback to latest draft
		versions_sorted = sorted(q.versions, key=lambda v: v.version_number, reverse=True)
		version = next((v for v in versions_sorted if v.status == "published"), versions_sorted[0] if versions_sorted else None)
		if not version:
			return jsonify({"error": "no_versions"}), 404
		structure = _serialize_version(version)
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
		# validation (non-strict for save): coerce types but ignore required errors
		_, _, normalized = validate_answers(target_version, answers)
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
			if q.code == "vocacional":
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
