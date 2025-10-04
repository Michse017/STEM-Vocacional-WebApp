"""Validation service for dynamic questionnaire responses.

Core function: validate_answers(version, answers_dict)
Returns (ok: bool, errors: dict, normalized: dict)

Rules implemented now:
 - Required presence (unless hidden by visible_if rule evaluating to False)
 - Type coercion for number, scale_1_5, boolean, date (basic ISO), multi_choice arrays
 - single_choice / multi_choice option membership check
 - scale_1_5 range 1..5
 - visible_if simple evaluator supporting structure: {"code": <question_code>, "equals": <value>}
   or {"and": [<rule>, ...]} / {"or": [<rule>, ...]}

Future extensions: regex, min/max length, numeric ranges, custom expressions.
"""
from __future__ import annotations
from datetime import datetime
from typing import Dict, Any, Tuple


def evaluate_visibility(rule, answers: Dict[str, Any]) -> bool:
    if not rule:
        return True
    if isinstance(rule, dict):
        if "and" in rule:
            return all(evaluate_visibility(r, answers) for r in rule["and"])
        if "or" in rule:
            return any(evaluate_visibility(r, answers) for r in rule["or"])
        code = rule.get("code")
        if code:
            expected = rule.get("equals")
            return answers.get(code) == expected
    return True  # fallback permissive


def coerce_boolean(val):
    if isinstance(val, bool):
        return val, None
    if val is None:
        return None, "empty"
    s = str(val).strip().lower()
    if s in ("true", "1", "yes", "si"):
        return True, None
    if s in ("false", "0", "no"):
        return False, None
    return None, "not_boolean"


def coerce_int(val):
    try:
        return int(val), None
    except Exception:
        return None, "not_integer"


def coerce_date(val):
    if not val:
        return None, "empty"
    try:
        # accept YYYY-MM-DD
        datetime.strptime(val, "%Y-%m-%d")
        return val, None
    except Exception:
        return None, "invalid_date"


def validate_answers(version, answers: Dict[str, Any]) -> Tuple[bool, Dict[str, Any], Dict[str, Any]]:
    errors = {}
    normalized = {}
    # Build lookup by code
    code_map = {}
    for sec in version.sections:
        for qu in sec.questions:
            code_map[qu.code] = qu

    # Determine visibility (simple pre-pass using raw answers)
    visible_cache = {}
    for code, qu in code_map.items():
        visible_cache[code] = evaluate_visibility(qu.visible_if, answers)

    # Required checks
    for code, qu in code_map.items():
        if qu.required and visible_cache.get(code, True):
            if code not in answers or answers[code] in (None, ""):
                errors[code] = "required"

    # Iterate answers
    for code, raw in answers.items():
        qu = code_map.get(code)
        if not qu:
            continue  # ignore unknown
        if not visible_cache.get(code, True):
            # If not visible, ignore and do not mark error
            continue
        qtype = qu.type
        if qtype in ("text", "textarea"):
            normalized[code] = str(raw) if raw is not None else ""
        elif qtype == "number":
            val, err = coerce_int(raw)
            if err:
                errors[code] = err
            else:
                normalized[code] = val
        elif qtype == "scale_1_5":
            val, err = coerce_int(raw)
            if err:
                errors[code] = err
            else:
                if 1 <= val <= 5:
                    normalized[code] = val
                else:
                    errors[code] = "out_of_range"
        elif qtype == "boolean":
            val, err = coerce_boolean(raw)
            if err:
                errors[code] = err
            else:
                normalized[code] = val
        elif qtype == "date":
            val, err = coerce_date(str(raw))
            if err:
                errors[code] = err
            else:
                normalized[code] = val
        elif qtype == "single_choice":
            opts = {o.value for o in qu.options}
            sval = str(raw)
            if sval not in opts:
                errors[code] = "invalid_option"
            else:
                normalized[code] = sval
        elif qtype == "multi_choice":
            if not isinstance(raw, (list, tuple)):
                errors[code] = "not_array"
            else:
                opts = {o.value for o in qu.options}
                invalid = [v for v in raw if v not in opts]
                if invalid:
                    errors[code] = {"invalid_options": invalid}
                else:
                    normalized[code] = list(raw)
        else:
            # fallback: store as string
            normalized[code] = str(raw)

    ok = len(errors) == 0
    return ok, errors, normalized

__all__ = ["validate_answers"]