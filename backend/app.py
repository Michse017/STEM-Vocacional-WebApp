from flask import Flask, request, jsonify, session
from flask_cors import CORS
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

import datetime

app = Flask(__name__)
app.secret_key = "supersecret"
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

def safe_float(val):
    try:
        if val in (None, '', 'NaN'):
            return None
        return float(val)
    except Exception:
        return None

def autocompleta_valor(question, respuestas_db):
    if question["text"].startswith("¿Presentaste las pruebas Saber 11"):
        fecha_grad = respuestas_db.get("resp_educativa_familiar", {}).get("fecha_graduacion")
        if fecha_grad:
            try:
                if isinstance(fecha_grad, datetime.date):
                    year = fecha_grad.year
                elif isinstance(fecha_grad, str) and len(fecha_grad) == 4:
                    year = int(fecha_grad)
                else:
                    year = int(str(fecha_grad)[:4])
                return "Sí" if year > 2014 else "No"
            except Exception:
                return ""
        return ""
    if question["text"].startswith("¿Tienes los resultados oficiales de Saber 11"):
        puntajes = [
            respuestas_db.get("resp_cognitiva", {}).get("ptj_fisica"),
            respuestas_db.get("resp_cognitiva", {}).get("ptj_quimica"),
            respuestas_db.get("resp_cognitiva", {}).get("ptj_biologia"),
            respuestas_db.get("resp_cognitiva", {}).get("ptj_matematicas"),
        ]
        if all([safe_float(x) is not None for x in puntajes]):
            return "Sí"
        if all([x is None for x in puntajes]):
            return "No"
        return ""
    if question["text"].startswith("¿Tus pruebas incluyen resultados en áreas sociales"):
        puntajes = [
            respuestas_db.get("resp_cognitiva", {}).get("ptj_geografia"),
            respuestas_db.get("resp_cognitiva", {}).get("ptj_historia"),
            respuestas_db.get("resp_cognitiva", {}).get("ptj_filosofia"),
            respuestas_db.get("resp_cognitiva", {}).get("ptj_sociales_ciudadano"),
            respuestas_db.get("resp_cognitiva", {}).get("ptj_ciencias_sociales"),
        ]
        if any([safe_float(x) is not None for x in puntajes]):
            return "Sí"
        if all([x is None for x in puntajes]):
            return "No"
        return ""
    if question["text"].startswith("¿Incluyeron lectura crítica, lenguaje e inglés en tus pruebas Saber 11"):
        puntajes = [
            respuestas_db.get("resp_cognitiva", {}).get("ptj_lenguaje"),
            respuestas_db.get("resp_cognitiva", {}).get("ptj_lectura_critica"),
            respuestas_db.get("resp_cognitiva", {}).get("ptj_ingles"),
        ]
        if any([safe_float(x) is not None for x in puntajes]):
            return "Sí"
        if all([x is None for x in puntajes]):
            return "No"
        return ""
    if question["text"].startswith("¿Has presentado la prueba Saber Pro (ECAES)?"):
        ecaes = respuestas_db.get("resp_cognitiva", {}).get("ecaes")
        return "Sí" if safe_float(ecaes) is not None else "No"
    return None

@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.json
    codigo_estudiante = data.get("codigo_estudiante")
    usuario = authenticate_user(codigo_estudiante)
    if usuario:
        session["user_id"] = usuario.codigo_estudiante
        session["id_usuario"] = usuario.id_usuario
        return jsonify({"success": True, "codigo_estudiante": usuario.codigo_estudiante, "id_usuario": usuario.id_usuario})
    return jsonify({"success": False, "message": "ID no encontrado"}), 404

@app.route("/api/cuestionario", methods=["GET"])
def get_cuestionario():
    codigo = request.args.get("codigo_estudiante")
    usuario = get_usuario_by_codigo(codigo)
    if not usuario:
        return jsonify({"success": False, "message": "Usuario no encontrado"}), 404
    respuestas_db = get_usuario_full_responses(usuario.id_usuario)
    dimensions = []
    for dim in QUESTIONNAIRE_STRUCTURE:
        table = dim["table"]
        dim_block = {"dimension": dim["dimension"], "questions": []}
        for q in dim["questions"]:
            variables = q["variable"] if isinstance(q["variable"], list) else [q["variable"]]
            value = None
            for var in variables:
                v = respuestas_db.get(table, {}).get(var)
                if v is not None:
                    value = v
                    break
            auto = autocompleta_valor(q, respuestas_db)
            if auto is not None:
                value = auto
            dim_block["questions"].append({
                "text": q["text"],
                "variable": q["variable"],
                "type": q.get("type", "texto"),
                "options": q.get("options"),
                "value": "" if value is None else value
            })
        dimensions.append(dim_block)
    return jsonify({"success": True, "dimensions": dimensions})

@app.route("/api/cuestionario", methods=["POST"])
def post_cuestionario():
    data = request.json
    codigo_estudiante = data.get("codigo_estudiante")
    respuestas = data.get("respuestas")
    usuario = get_usuario_by_codigo(codigo_estudiante)
    if not usuario:
        return jsonify({"success": False, "message": "Usuario no encontrado"}), 404
    try:
        upsert_cognitiva(usuario.id_usuario, respuestas.get("resp_cognitiva", {}))
        upsert_educativa_familiar(usuario.id_usuario, respuestas.get("resp_educativa_familiar", {}))
        upsert_socioeconomica(usuario.id_usuario, respuestas.get("resp_socioeconomica", {}))
        upsert_autoeficacia(usuario.id_usuario, respuestas.get("resp_autoeficacia", {}))
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route("/api/dashboard", methods=["GET"])
def get_dashboard():
    codigo = request.args.get("codigo_estudiante")
    usuario = get_usuario_by_codigo(codigo)
    if not usuario:
        return jsonify({"success": False, "message": "Usuario no encontrado"}), 404
    respuestas_db = get_usuario_full_responses(usuario.id_usuario)
    dimensions = []
    for dim in QUESTIONNAIRE_STRUCTURE:
        table = dim["table"]
        dim_block = {"dimension": dim["dimension"], "questions": []}
        for q in dim["questions"]:
            variables = q["variable"] if isinstance(q["variable"], list) else [q["variable"]]
            value = None
            for var in variables:
                v = respuestas_db.get(table, {}).get(var)
                if v is not None:
                    value = v
                    break
            auto = autocompleta_valor(q, respuestas_db)
            if auto is not None:
                value = auto
            dim_block["questions"].append({
                "text": q["text"],
                "variable": q["variable"],
                "type": q.get("type", "texto"),
                "options": q.get("options"),
                "value": "" if value is None else value
            })
        dimensions.append(dim_block)
    return jsonify({"success": True, "codigo": codigo, "dimensions": dimensions})

if __name__ == "__main__":
    app.run(debug=True)