import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { listDynamicQuestionnaires } from "../api";

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
        const data = await listDynamicQuestionnaires();
        if (mounted) setItems(data?.items || []);
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
                  <div style={{fontSize:"0.875rem", color:"var(--text-muted)"}}>Código: {q.code} · Estado: {q.status}</div>
                </div>
                <Link
                  to={`/dynamic/${encodeURIComponent(q.code)}`}
                  state={{ usuario }}
                  className="btn btn-primary"
                >
                  Responder
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
