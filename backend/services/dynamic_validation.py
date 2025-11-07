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
from datetime import datetime, date
from typing import Dict, Any, Tuple
import re


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


def coerce_float(val):
    try:
        # Accept ints and floats; reject empty strings
        if val is None or (isinstance(val, str) and val.strip() == ""):
            return None, "empty"
        return float(val), None
    except Exception:
        return None, "not_number"


def coerce_date(val):
    if not val:
        return None, "empty"
    try:
        # accept YYYY-MM-DD
        datetime.strptime(val, "%Y-%m-%d")
        return val, None
    except Exception:
        return None, "invalid_date"


def _add_years(d: date, years: int) -> date:
    try:
        return d.replace(year=d.year + years)
    except ValueError:
        # handle Feb 29 -> Feb 28
        return d.replace(month=2, day=28, year=d.year + years)


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
        rules = qu.validation_rules or {}
        if qtype in ("text", "textarea"):
            sval = str(raw) if raw is not None else ""
            # length rules
            try:
                min_len = int(rules.get("minLength")) if rules and "minLength" in rules else None
            except Exception:
                min_len = None
            try:
                max_len = int(rules.get("maxLength")) if rules and "maxLength" in rules else None
            except Exception:
                max_len = None
            if min_len is not None and len(sval) < min_len:
                errors[code] = "too_short"
            elif max_len is not None and len(sval) > max_len:
                errors[code] = "too_long"
            else:
                # regex
                pattern = rules.get("regex") if isinstance(rules, dict) else None
                if pattern:
                    try:
                        if not re.fullmatch(str(pattern), sval or ""):
                            errors[code] = "regex_no_match"
                        else:
                            normalized[code] = sval
                    except re.error:
                        # invalid pattern => ignore
                        normalized[code] = sval
                else:
                    normalized[code] = sval
        elif qtype == "email":
            sval = str(raw) if raw is not None else ""
            # Simple but robust email regex per HTML spec approximation
            email_regex = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"
            if not re.fullmatch(email_regex, sval or ""):
                errors[code] = "invalid_email"
            else:
                normalized[code] = sval
        elif qtype == "number":
            # Allow decimals via validation_rules.allow_decimal
            allow_decimal = False
            try:
                if isinstance(rules, dict) and rules.get("allow_decimal"):
                    allow_decimal = True
            except Exception:
                allow_decimal = False
            if allow_decimal:
                val, err = coerce_float(raw)
                if err:
                    errors[code] = err
                else:
                    # min/max may be float
                    try:
                        min_v = float(rules.get("min")) if rules and "min" in rules else None
                    except Exception:
                        min_v = None
                    try:
                        max_v = float(rules.get("max")) if rules and "max" in rules else None
                    except Exception:
                        max_v = None
                    if min_v is not None and val < min_v:
                        errors[code] = "below_min"
                    elif max_v is not None and val > max_v:
                        errors[code] = "above_max"
                    else:
                        # optional step validation for decimals (relative to min or 0)
                        step_ok = True
                        try:
                            step_raw = rules.get("step") if isinstance(rules, dict) else None
                            step = float(step_raw) if step_raw is not None and str(step_raw).strip() != "" else None
                        except Exception:
                            step = None
                        if step is not None and step > 0:
                            base = min_v if (min_v is not None) else 0.0
                            # avoid FP issues with a tolerance
                            diff = abs(val - base)
                            rem = diff % step
                            tol = 1e-9
                            if not (rem < tol or abs(rem - step) < tol):
                                step_ok = False
                        if not step_ok:
                            errors[code] = "invalid_step"
                        else:
                            # Note: DB numeric_value es entero; para decimales se almacena como string en value
                            normalized[code] = val
            else:
                val, err = coerce_int(raw)
                if err:
                    errors[code] = err
                else:
                    # numeric range via rules (int)
                    try:
                        min_v = int(rules.get("min")) if rules and "min" in rules else None
                    except Exception:
                        min_v = None
                    try:
                        max_v = int(rules.get("max")) if rules and "max" in rules else None
                    except Exception:
                        max_v = None
                    if min_v is not None and val < min_v:
                        errors[code] = "below_min"
                    elif max_v is not None and val > max_v:
                        errors[code] = "above_max"
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
                # optional date bounds YYYY-MM-DD in rules
                min_d = rules.get("min_date") if isinstance(rules, dict) else None
                max_d = rules.get("max_date") if isinstance(rules, dict) else None
                # presets: not_after_today, min_year, max_year
                try:
                    if isinstance(rules, dict) and rules.get("not_after_today"):
                        today_s = date.today().strftime("%Y-%m-%d")
                        max_d = min(max_d, today_s) if max_d else today_s
                    if isinstance(rules, dict) and ("min_year" in rules):
                        y = int(rules.get("min_year"))
                        min_d = max(min_d, f"{y:04d}-01-01") if min_d else f"{y:04d}-01-01"
                    if isinstance(rules, dict) and ("max_year" in rules):
                        y = int(rules.get("max_year"))
                        max_d = min(max_d, f"{y:04d}-12-31") if max_d else f"{y:04d}-12-31"
                except Exception:
                    pass
                ok_bounds = True
                try:
                    if min_d and val < str(min_d):
                        errors[code] = "before_min_date"; ok_bounds = False
                    if ok_bounds and max_d and val > str(max_d):
                        errors[code] = "after_max_date"; ok_bounds = False
                    # relative rules against another date answer in same payload
                    if ok_bounds and isinstance(rules, dict) and rules.get("not_before_code"):
                        other_code = str(rules.get("not_before_code"))
                        other_val = answers.get(other_code)
                        if other_val:
                            ov, oerr = coerce_date(str(other_val))
                            if not oerr and ov and val < ov:
                                errors[code] = "before_other_date"; ok_bounds = False
                    if ok_bounds and isinstance(rules, dict) and rules.get("not_after_code"):
                        other_code = str(rules.get("not_after_code"))
                        other_val = answers.get(other_code)
                        if other_val:
                            ov, oerr = coerce_date(str(other_val))
                            if not oerr and ov and val > ov:
                                errors[code] = "after_other_date"; ok_bounds = False
                    # age-based rules relative to today (e.g., DOB must be at least N years old)
                    if ok_bounds and isinstance(rules, dict) and ("min_age_years" in rules or "max_age_years" in rules):
                        d_obj = datetime.strptime(val, "%Y-%m-%d").date()
                        today = date.today()
                        if "min_age_years" in rules:
                            try:
                                min_age = int(rules.get("min_age_years"))
                                if _add_years(d_obj, min_age) > today:
                                    errors[code] = "min_age"; ok_bounds = False
                            except Exception:
                                pass
                        if ok_bounds and "max_age_years" in rules:
                            try:
                                max_age = int(rules.get("max_age_years"))
                                # if older than max_age (i.e., birth date + max_age < today), that's still valid; we flag only if younger than allowed max_age? Generally, max_age means age <= max.
                                # Here interpret: age must be <= max_age -> if add max_age years is before today, still ok. If add max_age years is before a date further than today? We'll consider violation if age > max.
                                if _add_years(d_obj, max_age) < today:
                                    errors[code] = "max_age"; ok_bounds = False
                            except Exception:
                                pass
                except Exception:
                    pass
                if ok_bounds:
                    normalized[code] = val
        elif qtype in ("single_choice", "choice"):
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

    # --- Domain-specific validations and computed fields (migrated from legacy rules) ---
    try:
        # ICFES global score auto-calc if component scores present
        comps = []
        comp_codes = [
            "puntaje_lectura_critica",
            "puntaje_matematicas",
            "puntaje_sociales_ciudadanas",
            "puntaje_ciencias_naturales",
            "puntaje_ingles",
        ]
        for cc in comp_codes:
            v = answers.get(cc)
            try:
                v = int(v) if v is not None and v != "" else None
            except Exception:
                v = None
            comps.append(v)
        if all(v is not None for v in comps):
            lc, m, sc, cn, i = comps
            ponderado = 3 * (lc + m + sc + cn) + i
            indice = ponderado / 13
            global_calc = round(indice * 5)
            # normalize within 0..500 just in case
            global_calc = max(0, min(500, int(global_calc)))
            normalized["puntaje_global_saber11"] = global_calc
        # Range checks for score components (0..100)
        for cc in [
            "puntaje_lectura_critica",
            "puntaje_matematicas",
            "puntaje_sociales_ciudadanas",
            "puntaje_ciencias_naturales",
            "puntaje_ingles",
        ]:
            if cc in answers and answers.get(cc) not in (None, ""):
                try:
                    vi = int(answers.get(cc))
                    if not (0 <= vi <= 100):
                        errors[cc] = "out_of_range"
                    else:
                        normalized[cc] = vi
                except Exception:
                    errors[cc] = "not_integer"
        # Range check for global (0..500) if provided explicitly
        if "puntaje_global_saber11" in answers and answers.get("puntaje_global_saber11") not in (None, ""):
            try:
                gv = int(answers.get("puntaje_global_saber11"))
                if not (0 <= gv <= 500):
                    errors["puntaje_global_saber11"] = "out_of_range"
                else:
                    normalized["puntaje_global_saber11"] = gv
            except Exception:
                errors["puntaje_global_saber11"] = "not_integer"
        # Generic handling for "Otro": if a question has options flagged as is_other and the answer selects any of them,
        # require a companion text answer in answers["otro_<code>"] to be non-empty.
        for code, qu in code_map.items():
            if not visible_cache.get(code, True):
                continue
            if not getattr(qu, "options", None):
                continue
            other_values = [getattr(o, "value", None) for o in qu.options if getattr(o, "is_other_flag", False)]
            other_values = [v for v in other_values if v]
            if not other_values:
                continue
            ans = answers.get(code)
            selected_other = False
            if qu.type in ("single_choice", "choice"):
                selected_other = ans in other_values
            elif qu.type == "multi_choice" and isinstance(ans, (list, tuple)):
                selected_other = any(v in other_values for v in ans)
            if selected_other:
                companion_key = f"otro_{code}"
                if not str(answers.get(companion_key) or "").strip():
                    errors[companion_key] = "required"
    except Exception:
        # Defensive: domain rules should not crash validation
        pass

    ok = len(errors) == 0
    return ok, errors, normalized

__all__ = ["validate_answers"]