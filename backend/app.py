from flask import Flask, render_template, request, redirect, url_for, session, flash
from backend.logic.questionnaire_structure import QUESTIONNAIRE_STRUCTURE
from backend.controllers.usuario_controller import authenticate_user
from database.controller import (
    get_usuario_by_codigo,
    get_usuario_full_responses,
    upsert_cognitiva,
    upsert_educativa_familiar,
    upsert_socioeconomica,
    upsert_autoeficacia
)

app = Flask(__name__)
app.secret_key = "supersecret"

def get_prefilled_responses(usuario):
    # Lee todas las respuestas existentes para el usuario y las mapea a la estructura del cuestionario
    respuestas_db = get_usuario_full_responses(usuario.id_usuario)
    dimensions = []
    for dim in QUESTIONNAIRE_STRUCTURE:
        table = dim["table"]
        dim_block = {"dimension": dim["dimension"], "questions": []}
        for q in dim["questions"]:
            # Una pregunta puede mapear a varias columnas (variable es lista)
            variables = q["variable"] if isinstance(q["variable"], list) else [q["variable"]]
            value = None
            for var in variables:
                value = (
                    respuestas_db.get(table, {}).get(var)
                    if respuestas_db.get(table)
                    else None
                )
                if value is not None:
                    break
            dim_block["questions"].append({
                "text": q["text"],
                "variable": q["variable"],
                "type": q.get("type", "texto"),
                "options": q.get("options"),
                "value": value if value is not None else ""
            })
        dimensions.append(dim_block)
    return dimensions

@app.route("/", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        codigo_estudiante = request.form.get("user_id")
        usuario = authenticate_user(codigo_estudiante)
        if usuario:
            session["user_id"] = usuario.codigo_estudiante
            session["id_usuario"] = usuario.id_usuario
            return redirect(url_for("questionnaire"))
        else:
            flash("ID no encontrado. Intenta de nuevo.")
    return render_template("login.html")

@app.route("/questionnaire", methods=["GET", "POST"])
def questionnaire():
    if "user_id" not in session or "id_usuario" not in session:
        return redirect(url_for("login"))
    usuario = get_usuario_by_codigo(session["user_id"])
    if not usuario:
        flash("Usuario no encontrado.")
        return redirect(url_for("login"))
    # GET: Renderiza el cuestionario con respuestas actuales
    if request.method == "GET":
        dimensions = get_prefilled_responses(usuario)
        return render_template("questionnaire.html", dimensions=dimensions)

    # POST: Guarda las respuestas
    # Recoge todas las respuestas del formulario
    responses = {}
    for dim_index, dim in enumerate(QUESTIONNAIRE_STRUCTURE):
        table = dim["table"]
        responses[table] = {}
        num_questions = len(dim["questions"])
        for q_index, q in enumerate(dim["questions"]):
            var_name = q["variable"]
            form_name = f"dim_{dim_index}_q_{q_index}"
            value = request.form.get(form_name)
            if isinstance(var_name, list):
                # Si es lista (múltiple variable), guardar en todas
                for v in var_name:
                    responses[table][v] = value
            else:
                responses[table][var_name] = value

    # Guardar en cada tabla
    upsert_cognitiva(usuario.id_usuario, responses.get("resp_cognitiva", {}))
    upsert_educativa_familiar(usuario.id_usuario, responses.get("resp_educativa_familiar", {}))
    upsert_socioeconomica(usuario.id_usuario, responses.get("resp_socioeconomica", {}))
    upsert_autoeficacia(usuario.id_usuario, responses.get("resp_autoeficacia", {}))

    flash("¡Cuestionario guardado correctamente!")
    return redirect(url_for("dashboard"))

@app.route("/dashboard")
def dashboard():
    if "user_id" not in session or "id_usuario" not in session:
        return redirect(url_for("login"))
    usuario = get_usuario_by_codigo(session["user_id"])
    if not usuario:
        return redirect(url_for("login"))
    dimensions = get_prefilled_responses(usuario)
    return render_template("dashboard.html", codigo=session["user_id"], dimensions=dimensions)

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))

if __name__ == "__main__":
    app.run(debug=True)