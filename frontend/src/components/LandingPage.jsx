import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  // El landing es el punto de entrada. Si existe sesión de estudiante en esta ventana,
  // sincroniza un usuario mínimo solo para esta pestaña.
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("active_session") || "null");
      if (s && s.type === "student" && s.code) {
        const existing = JSON.parse(sessionStorage.getItem("usuario") || "null");
        if (!existing || !existing.id_usuario) {
          const minimal = { codigo_estudiante: s.code, id_usuario: -1 };
          try { sessionStorage.setItem("usuario", JSON.stringify(minimal)); } catch {}
        }
      }
    } catch (_) {}
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 10% -10%, rgba(0,112,243,0.06) 0%, transparent 60%)," +
          "radial-gradient(1000px 500px at 110% 10%, rgba(0,200,150,0.06) 0%, transparent 60%)," +
          "linear-gradient(135deg, #f8fbff 0%, #f7fff9 100%)",
      }}
    >
      <div className="landing-container" style={{ paddingTop: "3rem", paddingBottom: "3rem" }}>
        {/* Encabezado */}
        <section className="hero-section animate-fade-in" style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
            <h1
              style={{
                marginLeft: 0,
                fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
                fontWeight: 800,
                background: "linear-gradient(135deg, var(--primary-color), var(--secondary-color))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              STEM Vocational
            </h1>
          </div>
          <p style={{ maxWidth: 920, margin: "0 auto", color: "var(--text-muted)", fontSize: "1.05rem" }}>
            Plataforma para recopilar información sobre orientación vocacional hacia áreas STEM mediante cuestionarios
            dinámicos. Los resultados pueden incluir una recomendación generada por modelos.
          </p>
          <div style={{ marginTop: "1.75rem", display: "flex", justifyContent: "center" }}>
            <Link to="/login" className="btn btn-primary" style={{ padding: "0.9rem 1.6rem" }}>
              Comenzar
            </Link>
          </div>
        </section>

        {/* Públicos */}
        <section className="animate-fade-in" style={{ marginTop: "2rem" }}>
          <div className="features-grid">
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div className="badge badge-primary" style={{ alignSelf: "start" }}>Estudiantes</div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Cuestionario y resumen</h3>
              <p style={{ color: "var(--text-muted-light)" }}>
                Acceso con código, diligenciamiento del cuestionario principal y visualización del resumen. Si hay
                modelo, el resumen puede incluir una recomendación.
              </p>
              <div style={{ marginTop: "auto" }}>
                <Link to="/login" className="btn btn-primary btn-sm">Ingresar</Link>
              </div>
            </div>
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div className="badge badge-primary" style={{ alignSelf: "start" }}>Administración</div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Versiones y publicación</h3>
              <p style={{ color: "var(--text-muted-light)" }}>
                Gestión de cuestionarios: crear, editar y publicar versiones, y definir un cuestionario primario.
              </p>
              <div style={{ marginTop: "auto" }}>
                <Link to="/admin" className="btn btn-secondary btn-sm">Abrir portal</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="animate-fade-in" style={{ marginTop: "3rem" }}>
          <div className="card" style={{ background: "linear-gradient(135deg, rgba(0,112,243,0.04), rgba(0,200,150,0.04))" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem", alignItems: "start" }}>
              <div>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Cuestionario dinámico</h2>
                <p style={{ color: "var(--text-muted)" }}>
                  La aplicación renderiza cuestionarios a partir de definiciones gestionadas en el módulo de
                  administración. Las secciones y preguntas pueden ajustarse sin redeploy del frontend.
                </p>
              </div>
              <div>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Recomendación del modelo</h2>
                <p style={{ color: "var(--text-muted)" }}>
                  Un modelo entrenado evalúa las respuestas y puede registrar una recomendación con su confianza.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Acceso */}
        <section className="animate-fade-in" style={{ textAlign: "center", marginTop: "3rem" }}>
          <div className="card" style={{ maxWidth: 720, margin: "0 auto", borderColor: "rgba(0,112,243,0.2)", background: "linear-gradient(135deg, rgba(0,112,243,0.05), rgba(0,200,150,0.05))" }}>
            <h2 style={{ fontSize: "1.65rem", fontWeight: 800, marginBottom: "0.75rem" }}>Acceso</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.25rem" }}>
              Estudiantes completan el cuestionario principal. La administración gestiona versiones y publicación.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/login" className="btn btn-primary">Ingreso estudiantes</Link>
              <Link to="/admin" className="btn btn-secondary">Portal de administración</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
