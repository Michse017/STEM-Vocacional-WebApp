import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getDynamicOverview } from "../api";

export default function DynamicList() {
  const location = useLocation();
  const navigate = useNavigate();
  let { usuario } = location.state || {};
  if (!usuario) {
    try { const u = JSON.parse(sessionStorage.getItem('usuario') || 'null'); if (u && u.id_usuario) usuario = u; } catch (_) {}
  }
  useEffect(() => {
    if (!usuario) {
      navigate('/login');
    }
  }, [usuario, navigate]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const ov = await getDynamicOverview(usuario?.codigo_estudiante || '');
        if (!mounted) return;
        const arr = [];
        if (ov?.primary?.questionnaire) {
          const q = ov.primary.questionnaire;
          arr.push({
            code: q.code,
            title: q.title,
            status: ov.primary.user?.status || 'new',
            progress_percent: (() => {
              const total = (q.sections || []).reduce((acc, s) => acc + (s.questions?.length || 0), 0);
              const answered = ov.primary.user?.answers ? Object.keys(ov.primary.user.answers).length : 0;
              const p = total > 0 ? Math.round((answered / total) * 100) : 0;
              return (ov.primary.user?.status === 'finalized') ? 100 : p;
            })(),
            finalized_at: null,
          });
        }
        for (const i of (ov?.items || [])) arr.push(i);
        setItems(arr);
      } catch (e) {
        if (mounted) setError(e.message || "No se pudo cargar la lista.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="card" style={{padding:"1rem"}}>Cargando cuestionarios...</div>;
  if (error) return <div className="card" style={{padding:"1rem", color:"crimson"}}>{error}</div>;

  return (
    <div className="card" style={{padding:"1.25rem"}}>
      <h2 style={{marginBottom:"1rem"}}>Cuestionarios Disponibles</h2>
      {items.length === 0 ? (
        <p>No hay cuestionarios dinámicos disponibles.</p>
      ) : (
        <ul style={{listStyle:"none", padding:0, display:"grid", gap:"0.75rem"}}>
          {items.map(q => (
            <li key={q.code} className="card" style={{padding:"1rem"}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:"1rem"}}>
                <div>
                  <div style={{fontWeight:600}}>{q.title || q.code}</div>
                  <div style={{fontSize:"0.875rem", color:"var(--text-muted)"}}>Código: {q.code} · Estado: {q.status} · Progreso: {q.progress_percent ?? 0}%</div>
                  <div className="progress-container" style={{ marginTop: 6 }}><div className="progress-bar" style={{ width: `${q.progress_percent ?? 0}%` }}></div></div>
                </div>
                <Link
                  to={`/dynamic/${encodeURIComponent(q.code)}`}
                  state={{ usuario }}
                  className="btn btn-primary"
                >
                  {q.status === 'finalized' ? 'Revisar' : ( (q.progress_percent ?? 0) > 0 ? 'Continuar' : 'Responder')}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
