import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function DynamicQuestionnaireRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const [err, setErr] = useState("");
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const base = ((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.startsWith('127.') || window.location.hostname.endsWith('.local')))
          ? 'http://localhost:5000/api' : 'https://stem-backend-9sc0.onrender.com/api');
        const res = await fetch(`${base}/dynamic/primary`);
        if (!res.ok) throw new Error("No hay cuestionario principal");
        const data = await res.json();
        const code = data?.questionnaire?.code;
        if (!code) throw new Error("Falta código del cuestionario principal");
        navigate(`/dynamic/${encodeURIComponent(code)}`, { replace: true, state: location.state || {} });
      } catch (e) {
        if (mounted) setErr(e.message || "No se pudo redirigir.");
      }
    })();
    return () => { mounted = false; };
  }, [navigate, location.state]);

  if (err) {
    return <div className="card" style={{padding:"1rem", color:"crimson"}}>{err}</div>;
  }
  return <div className="card" style={{padding:"1rem"}}>Redirigiendo…</div>;
}
