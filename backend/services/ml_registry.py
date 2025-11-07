"""Model registry utilities.

Reads model binding information stored in QuestionnaireVersion.metadata_json.

Binding (v1) minimal schema (backward compatible):
{
    "ml_binding": {
        "artifact_path": "models/model.joblib",
        "positive_index": 1,
        "threshold": 0.5,
        "pga_scale": "0-5",
        "feature_mapping": { "sex": "sexo", "pga_final": "pga_final", ... }
    }
}

Binding (v2) generalized schema (preferred):
{
    "ml_binding": {
        "artifact_path": "models/model.joblib",
        "runtime": "sklearn",  # sklearn|torch|onnx|plugin (extensible)
        "class_names": ["NO_STEM", "STEM"],
        "positive_label": "STEM",  # alternative to positive_index
        "threshold": 0.65,
        "input": {
            "feature_order": ["sex", "puntaje_matematicas", "pga_final"],  # optional override
            "features": [
                { "name": "sex", "source": "sexo", "type": "category", "map": {"M": 1, "F": 0}, "default": 0 },
                { "name": "colegio_publico", "source": "colegio_publico", "type": "bool", "default": 0 },
                { "name": "puntaje_matematicas", "source": "puntaje_matematicas", "type": "number", "clip_min": 0, "clip_max": 100, "default": 0 },
                { "name": "pga_final", "source": "pga_final", "type": "number", "divide_by": 100, "default": 0 }
            ]
        }
    }
}

If binding is missing or malformed, callers should treat it as no-op.
"""
from __future__ import annotations
from typing import Any, Dict, Optional, TYPE_CHECKING, List

if TYPE_CHECKING:
    # Only for type checking; avoids runtime import requirements
    from database.dynamic_models import QuestionnaireVersion


def get_binding(version: "QuestionnaireVersion") -> Optional[Dict[str, Any]]:
    """Return ML model binding config for a questionnaire version, or None.

    Expected to read version.metadata_json["ml_binding"]. Performs basic validation
    and normalization.
    """
    meta = getattr(version, "metadata_json", None) or {}
    if not isinstance(meta, dict):
        return None
    binding = meta.get("ml_binding")
    if not isinstance(binding, dict):
        return None
    artifact_path = binding.get("artifact_path")
    if not artifact_path:
        return None
    # Pass-through optional fields; keep v1 compatibility
    out: Dict[str, Any] = {
        "artifact_path": artifact_path,
        "threshold": float(binding.get("threshold", 0.5)),
    }
    # class handling
    if "class_names" in binding:
        cn = binding.get("class_names")
        if isinstance(cn, (list, tuple)):
            out["class_names"] = list(cn)
    if "positive_label" in binding:
        out["positive_label"] = binding.get("positive_label")
    out["positive_index"] = int(binding.get("positive_index", 1))

    # v1 fields
    if isinstance(binding.get("feature_mapping"), dict):
        out["feature_mapping"] = dict(binding.get("feature_mapping"))
    if "pga_scale" in binding:
        out["pga_scale"] = binding.get("pga_scale") or "0-5"

    # v2 fields
    if isinstance(binding.get("input"), dict):
        out["input"] = dict(binding.get("input"))
    if "runtime" in binding:
        out["runtime"] = str(binding.get("runtime") or "sklearn")

    return out


# ------------------ Preconfigured Models Registry (for Admin Wizard) ------------------

def _default_models_registry() -> List[Dict[str, Any]]:
    """Return a static list of available ML models preconfigured on the backend.

    Each model describes the features required by the model (names and types),
    but does NOT bind to questionnaire codes (that is done in the admin UI).
    """
    return [
        {
            "id": "binary_stem",
            "name": "STEM Classifier (NO_STEM vs STEM)",
            "artifact_path": "backend/models/mlp_model_MLP_weighted_sampler.joblib",
            "runtime": "sklearn",
            "class_names": ["NO_STEM", "STEM"],
            "positive_label": "STEM",
            "threshold": 0.65,
            "input": {
                # Feature order aligned with artifact's feature_cols
                "feature_order": [
                    "Ptj_lectura_critica",
                    "Ptj_ingles",
                    "Ptj_ciencias_naturales",
                    "Ptj_matematicas",
                    "Ptj_sociales_ciudadano",
                    "Estrato",
                    "pga_final",
                    "Sexo"
                ],
                "features": [
                    {"name": "Ptj_lectura_critica", "type": "number", "clip_min": 0, "clip_max": 100, "default": 0},
                    {"name": "Ptj_ingles", "type": "number", "clip_min": 0, "clip_max": 100, "default": 0},
                    {"name": "Ptj_ciencias_naturales", "type": "number", "clip_min": 0, "clip_max": 100, "default": 0},
                    {"name": "Ptj_matematicas", "type": "number", "clip_min": 0, "clip_max": 100, "default": 0},
                    {"name": "Ptj_sociales_ciudadano", "type": "number", "clip_min": 0, "clip_max": 100, "default": 0},
                    {"name": "Estrato", "type": "number", "default": 0},
                    {"name": "pga_final", "type": "number", "default": 0},
                    {"name": "Sexo", "type": "category", "map": {"M": 1, "F": 0, "m": 1, "f": 0, "Masculino": 1, "Femenino": 0, "masculino": 1, "femenino": 0}, "default": 0}
                ]
            }
        }
    ]


def list_available_models() -> List[Dict[str, Any]]:
    """List the available models (id, name, runtime)."""
    models = _default_models_registry()
    return [{"id": m["id"], "name": m["name"], "runtime": m.get("runtime", "sklearn")} for m in models]


def get_model_config(model_id: str) -> Optional[Dict[str, Any]]:
    """Get the full model configuration for a given id."""
    for m in _default_models_registry():
        if m.get("id") == model_id:
            return m
    return None
