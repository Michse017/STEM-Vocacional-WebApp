"""Seed script: migrate existing legacy questionnaire structure into dynamic tables.

Usage (PowerShell):
  $env:ENABLE_DYNAMIC_QUESTIONNAIRES="1"
  python seed_dynamic_from_legacy.py

Behavior:
- Creates (or reuses) questionnaire with code 'vocacional'.
- Creates version 1 (or reuses empty draft) and populates two sections:
    1. Datos Sociodemográficos
    2. Inteligencias Múltiples
- For each legacy column creates a dynamic question. For preguntas 1..35 adds options V/F.
- If sections already populated (idempotency) it aborts to avoid duplicates.
- Marks version as 'published' so it becomes the base for future clones.

NOTE: Enumerations & labels are simplified. You may refine texts later by cloning published version via admin endpoint:
  POST /api/admin/questionnaires/vocacional/clone-published
Then edit the resulting draft (future UI) before a publish endpoint is added.
"""
from __future__ import annotations

from sqlalchemy.orm import Session
from sqlalchemy import select
from database.controller import engine
from database.models import Base
from database.dynamic_models import (
    Questionnaire,
    QuestionnaireVersion,
    Section,
    Question,
    Option,
)

# --- Configuration / mappings ---
SOCIO_FIELDS = [
    # (code, text, type)
    ("fecha_nacimiento", "Fecha de nacimiento", "date"),
    ("sexo", "Sexo", "text"),
    ("fecha_graduacion_bachillerato", "Fecha graduación bachillerato", "date"),
    ("nivel_educativo_madre", "Nivel educativo de la madre", "text"),
    ("nivel_educativo_padre", "Nivel educativo del padre", "text"),
    ("ocupacion_padre", "Ocupación del padre", "text"),
    ("ocupacion_madre", "Ocupación de la madre", "text"),
    ("miembros_hogar", "Número de miembros en el hogar", "number"),
    ("numero_hermanos", "Número de hermanos", "number"),
    ("condicion_discapacidad", "Condición de discapacidad", "text"),
    ("otro_discapacidad", "Otra discapacidad", "text"),
    ("grupo_etnico", "Grupo étnico", "text"),
    ("otro_grupo_etnico", "Otro grupo étnico", "text"),
    ("condicion_vulnerabilidad", "Condición de vulnerabilidad", "text"),
    ("trabaja_actualmente", "Trabaja actualmente", "text"),
    ("puntaje_global_saber11", "Puntaje global Saber 11", "number"),
    ("puntaje_lectura_critica", "Puntaje Lectura Crítica", "number"),
    ("puntaje_matematicas", "Puntaje Matemáticas", "number"),
    ("puntaje_sociales_ciudadanas", "Puntaje Sociales y Ciudadanas", "number"),
    ("puntaje_ciencias_naturales", "Puntaje Ciencias Naturales", "number"),
    ("puntaje_ingles", "Puntaje Inglés", "number"),
]

IM_COUNT = 35  # preguntas_1..35


def main():  # noqa: D401
    print("[seed] Starting dynamic seed from legacy schema...")
    Base.metadata.create_all(bind=engine)
    with Session(engine) as session:
        q = session.execute(select(Questionnaire).where(Questionnaire.code == "vocacional")).scalar_one_or_none()
        created_q = False
        if not q:
            q = Questionnaire(code="vocacional", title="Cuestionario Vocacional (Dinámico)", description="Migrado desde legacy")
            session.add(q)
            session.flush()
            created_q = True
            print("[seed] Created questionnaire 'vocacional'.")

        # Find version 1
        v = None
        for vv in q.versions:
            if vv.version_number == 1:
                v = vv
                break
        if not v:
            v = QuestionnaireVersion(questionnaire=q, version_number=1, status="draft")
            session.add(v)
            session.flush()
            print("[seed] Created version 1 (draft).")
        else:
            print(f"[seed] Reusing existing version 1 with status={v.status}.")

        if v.sections:
            print("[seed] Version already has sections; aborting to keep idempotent.")
            session.commit()
            return

        # Section 1: Socio
        socio_section = Section(version=v, title="Datos Sociodemográficos", description="Migrado", order=1)
        session.add(socio_section)
        session.flush()
        order_counter = 1
        for code, text, qtype in SOCIO_FIELDS:
            session.add(Question(section=socio_section, code=code, text=text, type=qtype, required=False, order=order_counter))
            order_counter += 1

        # Section 2: Inteligencias Múltiples
        im_section = Section(version=v, title="Inteligencias Múltiples", description="Migrado", order=2)
        session.add(im_section)
        session.flush()
        for i in range(1, IM_COUNT + 1):
            q_code = f"pregunta_{i}"
            qu = Question(section=im_section, code=q_code, text=f"Pregunta {i}", type="choice", required=False, order=i)
            session.add(qu)
            session.flush()
            session.add_all([
                Option(question=qu, value="V", label="Verdadero", order=1),
                Option(question=qu, value="F", label="Falso", order=2),
            ])

        # Publish version (since this represents the migrated baseline)
        v.status = "published"
        session.commit()
        print("[seed] Seed completed. Questionnaire 'vocacional' version 1 published with:")
        print(f"       Sections: {len(v.sections)}; Socio questions: {len(socio_section.questions)}; IM questions: {len(im_section.questions)}")
        if created_q:
            print("       (New questionnaire created)")
        print("[seed] You can now clone for edits: POST /api/admin/questionnaires/vocacional/clone-published")


if __name__ == "__main__":
    main()
