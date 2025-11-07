"""ML inference service for dynamic questionnaires.

Safe-by-default: if no binding or artifact cannot be loaded, it records a skipped
status in Response.summary_cache and returns gracefully.

Currently supports scikit-learn models with predict_proba. Torch artifacts are
also supported when the binding runtime is 'torch' or when a Torch module/bundle
is detected. Unknown containers are skipped safely.
"""
from __future__ import annotations
from typing import Any, Dict, Tuple, Optional
import os
from datetime import datetime

from .ml_registry import get_binding

try:
    import joblib  # type: ignore
except Exception:  # pragma: no cover
    joblib = None  # type: ignore

# Optional numpy for vector shape; code avoids hard dependency
try:
    import numpy as np  # type: ignore
except Exception:  # pragma: no cover
    np = None  # type: ignore


# ---- Public API ----

def try_infer_and_store(s, version, response_obj, answers: Dict[str, Any], question_map_by_code: Dict[str, Any]) -> Dict[str, Any]:
    """Attempt to run ML inference for a questionnaire response and store summary.

    - Reads binding via ml_registry.get_binding(version); if none -> skipped.
    - Loads artifact via joblib; supports direct sklearn estimators.
    - Builds a single-row feature vector using binding.feature_mapping.
    - Applies basic scaling for pga_final depending on pga_scale.
    - Computes prob for positive_index and decision by threshold.
    - Writes into response_obj.summary_cache['ml'].

    Returns the ml summary dict recorded (or skipped descriptor).
    """
    binding = get_binding(version)
    ml_summary: Dict[str, Any] = {
        "status": "skipped",
        "reason": "no_binding",
    }
    if not binding:
        _merge_ml_summary(response_obj, ml_summary)
        return ml_summary

    # Resolve artifact path relative to repo root if needed
    artifact_path = binding["artifact_path"]
    resolved_path = _resolve_path(artifact_path)
    if joblib is None:
        ml_summary = {"status": "skipped", "reason": "joblib_not_available", "artifact": artifact_path}
        _merge_ml_summary(response_obj, ml_summary)
        return ml_summary
    if not os.path.exists(resolved_path):
        ml_summary = {"status": "skipped", "reason": "artifact_missing", "artifact": artifact_path}
        _merge_ml_summary(response_obj, ml_summary)
        return ml_summary

    try:
        obj = joblib.load(resolved_path)
    except Exception as e:  # pragma: no cover
        ml_summary = {"status": "skipped", "reason": "artifact_load_error", "artifact": artifact_path, "error": str(e)}
        _merge_ml_summary(response_obj, ml_summary)
        return ml_summary

    runtime = str(binding.get("runtime") or "sklearn").lower()

    # Build features (prefer v2 feature_specs when available)
    if isinstance(binding.get("input"), dict) and isinstance(binding["input"].get("features"), list):
        features, feature_order_v2, traces = _build_features_v2(binding, answers)
    else:
        features, traces = _build_features(binding, answers)
        feature_order_v2 = None

    # Detect capabilities up-front
    looks_torch = _looks_like_torch_artifact(obj)
    estimator, feature_order = _extract_estimator_and_features(obj)

    # Route order:
    # 1) If it actually looks like Torch, try Torch first; if that fails due to missing model but we can
    #    extract a sklearn estimator, fall back to sklearn.
    # 2) Otherwise, if we can extract a sklearn estimator, use sklearn path even if runtime says 'torch'.
    # 3) If neither is recognized, report unsupported_container.
    if looks_torch:
        ml_summary = _infer_with_torch(obj, binding, artifact_path, features, feature_order_v2)
        if isinstance(ml_summary, dict) and ml_summary.get("status") == "skipped" and estimator is not None:
            # Fallback to sklearn if Torch container didn't expose a callable model but holds a sklearn one
            ml_summary = _infer_with_sklearn(estimator, feature_order_v2 or feature_order, binding, artifact_path, features, traces)
            # annotate runtime mismatch note for transparency
            ml_summary.setdefault("notes", []).append("fallback_to_sklearn_from_torch_container")
        _merge_ml_summary(response_obj, ml_summary)
        return ml_summary

    if estimator is not None:
        ml_summary = _infer_with_sklearn(estimator, feature_order_v2 or feature_order, binding, artifact_path, features, traces)
        # If the binding said torch but we used sklearn, add a note (non-fatal)
        if runtime == "torch" and isinstance(ml_summary, dict) and ml_summary.get("status") == "ok":
            ml_summary.setdefault("notes", []).append("runtime_declared_torch_but_used_sklearn")
        _merge_ml_summary(response_obj, ml_summary)
        return ml_summary

    # Nothing recognized
    ml_summary = {"status": "skipped", "reason": "unsupported_container", "artifact": artifact_path}
    _merge_ml_summary(response_obj, ml_summary)
    return ml_summary

def _infer_with_sklearn(estimator: Any, feature_order: Optional[list], binding: Dict[str, Any], artifact_path: str, features: Dict[str, Any], traces: Dict[str, Any]) -> Dict[str, Any]:
    # Reorder features if artifact provided an explicit order
    ordered_values = [features.get(name) for name in feature_order] if feature_order else list(features.values())
    if np is not None:
        X = np.array([ordered_values], dtype=float)
    else:
        X = [ordered_values]  # basic list fallback for predict on some estimators

    # Predict probability
    prob_pos: Optional[float] = None
    try:
        if hasattr(estimator, "predict_proba"):
            proba = estimator.predict_proba(X)
            # proba shape (1, n_classes)
            idx = _select_positive_index(binding, estimator)
            prob_pos = float(proba[0][idx])
        elif hasattr(estimator, "decision_function"):
            # Heuristic sigmoid
            import math
            d = estimator.decision_function(X)
            # handle binary case
            z = float(d[0] if isinstance(d, (list, tuple)) else d)
            prob_pos = 1.0 / (1.0 + math.exp(-z))
        else:
            return {"status": "skipped", "reason": "no_predict_proba", "artifact": artifact_path}
    except Exception as e:
        return {"status": "skipped", "reason": "predict_error", "artifact": artifact_path, "error": str(e)}

    threshold = float(binding.get("threshold", 0.5))
    decision = bool(prob_pos is not None and prob_pos >= threshold)

    ml_summary = {
        "status": "ok",
        "runtime": "sklearn",
        "artifact": artifact_path,
        "positive_index": int(binding.get("positive_index", 1)),
        "threshold": threshold,
        "prob": prob_pos,
        "decision": decision,
        "features": features,
        "traces": traces,
        "feature_order": feature_order,
        "class_names": binding.get("class_names"),
        "positive_label": binding.get("positive_label"),
        "evaluated_at": datetime.utcnow().isoformat() + "Z",
    }
    # Derive human-readable label (e.g., STEM / NO_STEM) for convenience
    try:
        cls = binding.get("class_names") if isinstance(binding.get("class_names"), (list, tuple)) else None
        pos_label = binding.get("positive_label")
        if decision:
            if pos_label:
                ml_summary["label"] = str(pos_label)
            elif cls and len(cls) > int(binding.get("positive_index", 1)):
                ml_summary["label"] = str(cls[int(binding.get("positive_index", 1))])
            else:
                ml_summary["label"] = "POSITIVE"
        else:
            # negative label: pick the other class if available
            if pos_label and cls and pos_label in cls and len(cls) == 2:
                other = [c for c in cls if c != pos_label]
                ml_summary["label"] = other[0] if other else f"NO_{pos_label}"
            elif cls and len(cls) == 2:
                neg_idx = 1 - int(binding.get("positive_index", 1)) if int(binding.get("positive_index", 1)) in (0,1) else 0
                ml_summary["label"] = str(cls[neg_idx])
            elif pos_label:
                ml_summary["label"] = f"NO_{pos_label}"
            else:
                ml_summary["label"] = "NEGATIVE"
    except Exception:
        ml_summary["label"] = "UNKNOWN"
    return ml_summary


# ---- Internals ----

def _resolve_path(p: str) -> str:
    """Resolve an artifact path with a few conveniences:
    - env:VAR → use the environment variable VAR as the absolute path
    - Expand ~ and environment variables (%, $)
    - If relative, resolve from repo root
    - Fallback search by basename in common locations (models/, backend/models/)
    Returns a best-effort absolute path; caller will check existence.
    """
    if not p:
        return p
    # env:VAR support
    if isinstance(p, str) and p.lower().startswith("env:"):
        var = p.split(":", 1)[1]
        if var:
            val = os.environ.get(var)
            if val:
                p = val
    # Expand ~ and env vars
    try:
        p = os.path.expanduser(os.path.expandvars(p))
    except Exception:
        pass
    if os.path.isabs(p):
        return p
    here = os.path.dirname(__file__)
    repo_root = os.path.abspath(os.path.join(here, os.pardir, os.pardir))
    primary = os.path.abspath(os.path.join(repo_root, p))
    # If primary doesn't exist, try common fallbacks by basename
    try:
        if not os.path.exists(primary):
            base = os.path.basename(p)
            candidates = [
                os.path.join(repo_root, "models", base),
                os.path.join(repo_root, "backend", "models", base),
            ]
            for c in candidates:
                if os.path.exists(c):
                    return os.path.abspath(c)
    except Exception:
        pass
    return primary


def _extract_estimator_and_features(obj: Any) -> Tuple[Optional[Any], Optional[list]]:
    """Return (estimator, feature_order) if recognized, else (None, None).
    Supports common containers seen in joblib artifacts:
    - Plain sklearn estimator or Pipeline (has predict/ predict_proba)
    - dict with keys {"model"|"estimator"|"clf"} and optional feature list under
      {"feature_cols"|"features"}
    - tuple/list where one element is the estimator and another element is a
      list of feature names (order)
    - objects exposing attribute .model or .estimator holding a sklearn object
    """
    if obj is None:
        return None, None
    # Simple sklearn estimator
    if hasattr(obj, "predict") or hasattr(obj, "predict_proba"):
        return obj, None
    # Wrapped in dict
    if isinstance(obj, dict):
        est = (
            obj.get("model")
            or obj.get("estimator")
            or obj.get("clf")
            or obj.get("sklearn_model")
            or obj.get("best_estimator_")
            or obj.get("best_estimator")
            or obj.get("classifier")
            or obj.get("model_final")
            or obj.get("estimator_")
        )
        feat = obj.get("feature_cols") or obj.get("features")
        if est is not None and (hasattr(est, "predict") or hasattr(est, "predict_proba")):
            return est, list(feat) if isinstance(feat, (list, tuple)) else None
        # Some users pickle {'pipeline': pipe, 'features': [...]} etc.
        for key in ("pipeline", "pipe"):
            est = obj.get(key)
            if est is not None and (hasattr(est, "predict") or hasattr(est, "predict_proba")):
                return est, list(feat) if isinstance(feat, (list, tuple)) else None
        # Generic container hint
        if obj.get("artifact_type") == "sklearn" and obj.get("object") is not None:
            est = obj.get("object")
            if hasattr(est, "predict") or hasattr(est, "predict_proba"):
                return est, list(feat) if isinstance(feat, (list, tuple)) else None
    # Tuple/list container → find estimator and features
    if isinstance(obj, (list, tuple)) and len(obj) > 0:
        est_candidate = None
        feat_names: Optional[list] = None
        for item in obj:
            if est_candidate is None and (hasattr(item, "predict") or hasattr(item, "predict_proba")):
                est_candidate = item
            if feat_names is None and isinstance(item, (list, tuple)) and item and all(isinstance(x, str) for x in item):
                feat_names = list(item)
            if isinstance(item, dict):
                # dict inside the tuple may also hold features
                inner_feat = item.get("feature_cols") or item.get("features") if hasattr(item, "get") else None
                if isinstance(inner_feat, (list, tuple)) and inner_feat and all(isinstance(x, str) for x in inner_feat):
                    feat_names = list(inner_feat)
        if est_candidate is not None:
            return est_candidate, feat_names
    # Attribute containers: has .model or .estimator wrapping sklearn model
    try:
        est = (
            getattr(obj, "model", None)
            or getattr(obj, "estimator", None)
            or getattr(obj, "clf", None)
            or getattr(obj, "best_estimator_", None)
            or getattr(obj, "classifier", None)
        )
        if est is not None and (hasattr(est, "predict") or hasattr(est, "predict_proba")):
            # Attempt to fetch embedded feature names if available
            feat = getattr(obj, "feature_cols", None) or getattr(obj, "features", None)
            return est, list(feat) if isinstance(feat, (list, tuple)) else None
    except Exception:
        pass
    return None, None


def _looks_like_torch_artifact(obj: Any) -> bool:
    try:
        # Torch module: has state_dict and is callable
        if hasattr(obj, "state_dict") and callable(getattr(obj, "__call__", None)):
            return True
        if isinstance(obj, dict):
            if any(k in obj for k in ("model_state_dict", "state_dict")):
                return True
            # A dict that contains a torch model instance
            m = obj.get("model") or obj.get("net") or obj.get("module")
            if m is not None and hasattr(m, "state_dict") and callable(getattr(m, "__call__", None)):
                return True
    except Exception:
        pass
    return False


def _build_features(binding: Dict[str, Any], answers: Dict[str, Any]) -> Tuple[Dict[str, float], Dict[str, Any]]:
    mapping = binding.get("feature_mapping", {}) or {}
    pga_scale = (binding.get("pga_scale") or "0-5").lower()
    feats: Dict[str, float] = {}
    traces: Dict[str, Any] = {}

    def _as_float(v: Any) -> Optional[float]:
        try:
            if v is None:
                return None
            if isinstance(v, bool):
                return 1.0 if v else 0.0
            if isinstance(v, (int, float)):
                return float(v)
            s = str(v).strip().lower()
            if s in ("true", "si", "sí", "yes", "y"):
                return 1.0
            if s in ("false", "no", "n"):
                return 0.0
            return float(s)
        except Exception:
            return None

    # Helper: sex mapping
    def _sex_to_num(v: Any) -> Optional[float]:
        if v is None:
            return None
        if isinstance(v, (int, float)):
            return float(v)
        s = str(v).strip().lower()
        if s in ("m", "h", "masculino", "hombre", "male"):
            return 1.0
        if s in ("f", "fem", "femenino", "mujer", "female"):
            return 0.0
        return None

    for feat_name, code in mapping.items():
        raw = answers.get(code)
        if feat_name == "sex":
            feats[feat_name] = _sex_to_num(raw) or 0.0
        elif feat_name == "colegio_publico":
            val = _as_float(raw)
            # normalize any non-zero to 1
            feats[feat_name] = 1.0 if (val is not None and val != 0.0) else 0.0
        elif feat_name == "pga_final":
            orig = _as_float(raw)
            used = orig
            if orig is not None and pga_scale == "0-500":
                used = orig / 100.0
            feats[feat_name] = used if used is not None else 0.0
            traces.setdefault("pga_final_trace", {"original": orig, "used": used, "scale": pga_scale})
        else:
            # ICFES and others
            feats[feat_name] = _as_float(raw) or 0.0
    return feats, traces


def _build_features_v2(binding: Dict[str, Any], answers: Dict[str, Any]) -> Tuple[Dict[str, float], Optional[list], Dict[str, Any]]:
    """Generalized feature builder using binding.input.features specs.

    Each feature spec supports:
    - name: output feature name (required)
    - source: questionnaire code to read (required)
    - type: number|bool|category (default: number)
    - map: dict for category→numeric mapping or bool
    - default: value if missing or unparsable (default 0)
    - divide_by, multiply_by, offset
    - clip_min, clip_max
    - order: optional explicit order
    Returns: (features_dict, feature_order, traces)
    """
    inp = binding.get("input") or {}
    specs = inp.get("features") or []
    order_override = inp.get("feature_order") or None
    feats: Dict[str, float] = {}
    traces: Dict[str, Any] = {}
    computed_order: list = []

    def _to_float(v: Any) -> Optional[float]:
        try:
            if v is None:
                return None
            if isinstance(v, bool):
                return 1.0 if v else 0.0
            if isinstance(v, (int, float)):
                return float(v)
            s = str(v).strip()
            if s.lower() in ("true", "si", "sí", "yes", "y"):
                return 1.0
            if s.lower() in ("false", "no", "n"):
                return 0.0
            return float(s)
        except Exception:
            return None

    for spec in specs:
        if not isinstance(spec, dict):
            continue
        name = spec.get("name")
        src = spec.get("source")
        if not name or not src:
            continue
        kind = (spec.get("type") or "number").lower()
        raw = answers.get(src)
        default = spec.get("default", 0)
        val: Optional[float] = None

        if kind == "category":
            mapper = spec.get("map") or {}
            key = raw
            if not isinstance(key, (str, int, float)):
                key = str(key) if key is not None else None
            if isinstance(key, str):
                key_norm = key.strip()
                val = mapper.get(key_norm)
                if val is None:
                    val = mapper.get(key_norm.lower())
            else:
                val = mapper.get(key)
            if val is None:
                # fallback try boolean parsing
                val = _to_float(raw)
        elif kind == "bool":
            mapper = spec.get("map") or {}
            if mapper:
                val = mapper.get(str(raw).strip().lower())
            if val is None:
                val = _to_float(bool(raw) if isinstance(raw, (list, dict)) else raw)
        else:  # number
            val = _to_float(raw)

        if val is None:
            val = default
        # numeric transforms
        try:
            val = float(val)
            if spec.get("divide_by"):
                val = val / float(spec["divide_by"])
            if spec.get("multiply_by"):
                val = val * float(spec["multiply_by"])
            if spec.get("offset"):
                val = val + float(spec["offset"])
            if spec.get("clip_min") is not None:
                val = max(float(spec["clip_min"]), val)
            if spec.get("clip_max") is not None:
                val = min(float(spec["clip_max"]), val)
        except Exception:
            val = default

        feats[name] = float(val)
        computed_order.append((spec.get("order"), name))

        # traces for special known fields (optional)
        if name == "pga_final":
            traces.setdefault("pga_final_trace", {"original": _to_float(raw), "used": feats[name], "spec_div": spec.get("divide_by")})

    # Determine order
    if isinstance(order_override, (list, tuple)) and order_override:
        order = list(order_override)
    else:
        # sort by explicit order then by appearance
        order = [n for _ord, n in sorted(computed_order, key=lambda t: (t[0] is None, t[0]))]
    return feats, order, traces


def _select_positive_index(binding: Dict[str, Any], estimator: Any) -> int:
    # If positive_label and estimator.classes_ are available, map to index
    pos_label = binding.get("positive_label")
    if pos_label is not None:
        try:
            classes = getattr(estimator, "classes_", None)
            if isinstance(classes, (list, tuple)):
                if pos_label in classes:
                    return list(classes).index(pos_label)
        except Exception:
            pass
        # Fallback: if binding declares class_names, use that mapping
        try:
            cn = binding.get("class_names")
            if isinstance(cn, (list, tuple)) and pos_label in cn:
                return list(cn).index(pos_label)
        except Exception:
            pass
    return int(binding.get("positive_index", 1))


def _merge_ml_summary(response_obj, ml_summary: Dict[str, Any]) -> None:
    # Merge into response_obj.summary_cache
    cache = getattr(response_obj, "summary_cache", None) or {}
    if not isinstance(cache, dict):
        cache = {}
    cache["ml"] = ml_summary
    response_obj.summary_cache = cache


# ---- Torch helpers ----

def _infer_with_torch(obj: Any, binding: Dict[str, Any], artifact_path: str, features: Dict[str, float], feature_order: Optional[list]) -> Dict[str, Any]:
    # Lazy import torch
    try:
        import torch  # type: ignore
    except Exception as e:
        return {"status": "skipped", "reason": f"torch_not_available: {e}", "artifact": artifact_path}

    # Resolve model from artifact
    model = None
    bundle = obj
    if hasattr(obj, "state_dict") and callable(getattr(obj, "__call__", None)):
        model = obj
        bundle = {}
    elif isinstance(obj, dict):
        # Common keys where the architecture may live
        cand = (
            obj.get("model")
            or obj.get("net")
            or obj.get("module")
            or obj.get("model_architecture")
            or obj.get("architecture")
        )
        if cand is not None and hasattr(cand, "state_dict") and callable(getattr(cand, "__call__", None)):
            model = cand
        bundle = obj
    if model is None:
        return {"status": "skipped", "reason": "unsupported_torch_bundle_missing_model", "artifact": artifact_path}

    # Try load state_dict if available, with gentle remap of common prefixes
    try:
        state = None
        if isinstance(bundle, dict):
            state = bundle.get("model_state_dict") or bundle.get("state_dict")
        if state is not None and hasattr(model, "load_state_dict"):
            missing, unexpected = model.load_state_dict(state, strict=False)
            # Attempt prefix stripping if the majority of keys share a prefix
            try:
                if missing and unexpected:
                    unexpected_keys = list(unexpected)
                    prefixes = set(k.split('.')[0] for k in unexpected_keys if '.' in k)
                    if len(prefixes) == 1:
                        prefix = list(prefixes)[0]
                        keys = list(state.keys()) if hasattr(state, 'keys') else []
                        if keys and all(k.startswith(prefix + ".") for k in keys):
                            remapped = {k[len(prefix)+1:]: v for k, v in state.items() if isinstance(k, str) and k.startswith(prefix + ".")}
                            model.load_state_dict(remapped, strict=False)
            except Exception:
                pass
            model.eval()
    except Exception:
        # continue even if weights fail to load
        try:
            model.eval()
        except Exception:
            pass

    # Determine feature order
    # Priority: binding-provided order (v2) -> artifact-declared order (common keys) -> insertion order
    ordered_names = feature_order if feature_order else None
    if ordered_names is None and isinstance(bundle, dict):
        try:
            for k in ("feature_cols", "feature_order", "features", "columns", "input_order"):
                v = bundle.get(k)
                if isinstance(v, (list, tuple)) and v and all(isinstance(x, (str,)) for x in v):
                    ordered_names = list(v)
                    break
        except Exception:
            pass
    if ordered_names is None:
        ordered_names = list(features.keys())

    X_row = [features.get(name) for name in ordered_names]

    # Optional: apply preprocessor/scaler from the artifact if present
    # This is best-effort and silently falls back if transform is unavailable
    try:
        preproc = None
        if isinstance(bundle, dict):
            for k in ("preprocessor", "preprocess", "scaler", "transformer", "encoder"):
                v = bundle.get(k)
                if v is not None and (hasattr(v, "transform") or hasattr(v, "fit_transform")):
                    preproc = v
                    break
        if preproc is not None and np is not None:
            try:
                import numpy as _np  # type: ignore
                X_proc = preproc.transform(_np.asarray([X_row]))
                try:
                    # normalize back to a simple python list row
                    X_row = (X_proc[0].tolist() if hasattr(X_proc, "__getitem__") else list(X_proc))  # type: ignore[index]
                except Exception:
                    pass
            except Exception:
                # Ignore preprocessor errors and continue without it
                pass
    except Exception:
        pass
    try:
        t = torch.tensor([X_row], dtype=torch.float32)
    except Exception as e:
        return {"status": "skipped", "reason": f"torch_tensor_error: {e}", "artifact": artifact_path}

    # Forward pass
    prob_pos: Optional[float] = None
    try:
        with torch.no_grad():
            y = model(t)
            if hasattr(y, "detach"):
                y = y.detach()
            try:
                import numpy as _np  # type: ignore
            except Exception:
                _np = None  # type: ignore
            # Normalize shape to (1, C)
            try:
                if len(getattr(y, "shape", [])) == 1:
                    y = y.unsqueeze(1)
            except Exception:
                pass
            # Convert to numpy array
            try:
                y_np = y.cpu().numpy()
            except Exception:
                # Fallback via tolist
                y_list = y.cpu().tolist() if hasattr(y, "cpu") else (y.tolist() if hasattr(y, "tolist") else [[float(y)]] )
                # Ensure 2D
                if isinstance(y_list, list) and y_list and not isinstance(y_list[0], list):
                    y_list = [y_list]
                y_np = y_list

            # Compute probabilities
            try:
                C = y_np.shape[1]  # type: ignore[attr-defined]
            except Exception:
                C = len(y_np[0]) if isinstance(y_np, list) and y_np and isinstance(y_np[0], list) else 1

            if C == 1:
                # binary single-logit -> sigmoid
                try:
                    import math as _math
                    z = float(y_np[0][0]) if isinstance(y_np, list) else float(y_np.ravel()[0])
                    prob = 1.0 / (1.0 + _math.exp(-z))
                    prob_pos = float(prob)
                except Exception:
                    prob_pos = None
            else:
                # multi-class -> softmax
                try:
                    import math as _math  # noqa: F401
                    # Use torch for softmax if available
                    from torch.nn.functional import softmax as _softmax  # type: ignore
                    y_t = torch.tensor(y_np)
                    e = _softmax(y_t, dim=1).cpu().numpy()
                except Exception:
                    # manual softmax in numpy
                    try:
                        import numpy as _np2  # type: ignore
                        ex = _np2.exp(y_np - _np2.max(y_np, axis=1, keepdims=True))
                        e = ex / _np2.sum(ex, axis=1, keepdims=True)
                    except Exception:
                        e = y_np
                # pick positive index
                idx = _select_positive_index(binding, estimator=None)  # estimator not used for torch
                try:
                    prob_pos = float(e[0][idx])
                except Exception:
                    prob_pos = None
    except Exception as e:
        return {"status": "skipped", "reason": "torch_predict_error", "artifact": artifact_path, "error": str(e)}

    threshold = float(binding.get("threshold", 0.5))
    decision = bool(prob_pos is not None and prob_pos >= threshold)

    # Derive human-readable label
    try:
        cls = binding.get("class_names") if isinstance(binding.get("class_names"), (list, tuple)) else None
        pos_label = binding.get("positive_label")
        if decision:
            if pos_label:
                ml_label = str(pos_label)
            elif cls and len(cls) > int(binding.get("positive_index", 1)):
                ml_label = str(cls[int(binding.get("positive_index", 1))])
            else:
                ml_label = "POSITIVE"
        else:
            if pos_label and cls and pos_label in cls and len(cls) == 2:
                other = [c for c in cls if c != pos_label]
                ml_label = other[0] if other else f"NO_{pos_label}"
            elif cls and len(cls) == 2:
                neg_idx = 1 - int(binding.get("positive_index", 1)) if int(binding.get("positive_index", 1)) in (0,1) else 0
                ml_label = str(cls[neg_idx])
            elif pos_label:
                ml_label = f"NO_{pos_label}"
            else:
                ml_label = "NEGATIVE"
    except Exception:
        ml_label = "UNKNOWN"

    return {
        "status": "ok",
        "artifact": artifact_path,
        "runtime": "torch",
        "positive_index": int(binding.get("positive_index", 1)),
        "threshold": threshold,
        "prob": prob_pos,
        "decision": decision,
        "label": ml_label,
        "features": features,
        "feature_order": feature_order,
        "class_names": binding.get("class_names"),
        "positive_label": binding.get("positive_label"),
        "evaluated_at": datetime.utcnow().isoformat() + "Z",
    }
