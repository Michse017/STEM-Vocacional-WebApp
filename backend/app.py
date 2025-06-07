from flask import Flask, render_template, request, redirect, url_for, session, flash
import os

from logic.auth import authenticate_user
from logic.questionnaire import get_questionnaire_for_user, save_questionnaire_response

app = Flask(__name__)
app.secret_key = "supersecret"

@app.route("/", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        user_id = request.form.get("user_id")
        user = authenticate_user(user_id)
        if user is not None:
            session["user_id"] = user_id
            session["user_name"] = user.get("Programa", "")
            return redirect(url_for("questionnaire"))
        else:
            flash("ID no encontrado. Intenta de nuevo.")
    return render_template("login.html")

@app.route("/questionnaire", methods=["GET", "POST"])
def questionnaire():
    if "user_id" not in session:
        return redirect(url_for("login"))
    user_id = session["user_id"]
    if request.method == "POST":
        # Recoge todas las respuestas del formulario
        responses = []
        for dim_index in range(4):  # 4 dimensiones
            num_questions = int(request.form.get(f"num_questions_dim_{dim_index}", 0))
            for q_index in range(num_questions):
                var_name = request.form.get(f"dim_{dim_index}_q_{q_index}_var")
                value = request.form.get(f"dim_{dim_index}_q_{q_index}")
                responses.append({"variable": var_name, "value": value})
        save_questionnaire_response(user_id, responses)
        flash("¡Cuestionario guardado correctamente!")
        return redirect(url_for("dashboard"))
    dimensions = get_questionnaire_for_user(user_id)
    return render_template("questionnaire.html", dimensions=dimensions)

@app.route("/dashboard")
def dashboard():
    if "user_id" not in session:
        return redirect(url_for("login"))
    return f"Bienvenido/a, tu código es {session['user_id']} - Tu programa: {session.get('user_name', '')}"

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))

if __name__ == "__main__":
    app.run(debug=True)