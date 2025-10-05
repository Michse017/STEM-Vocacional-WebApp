import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Cuestionario() {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    (async () => {
      try {
        const base = ((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.startsWith('127.') || window.location.hostname.endsWith('.local')))
          ? 'http://localhost:5000/api' : 'https://stem-backend-9sc0.onrender.com/api');
        const res = await fetch(`${base}/dynamic/primary`);
        const data = await res.json().catch(() => ({}));
        const code = data?.questionnaire?.code;
        if (code) navigate(`/dynamic/${encodeURIComponent(code)}`, { replace: true, state: location.state || {} });
        else navigate('/dynamic', { replace: true, state: location.state || {} });
      } catch (e) {
        navigate('/dynamic', { replace: true, state: location.state || {} });
      }
    })();
  }, [navigate, location.state]);
  return <div className="card" style={{padding:'1rem'}}>Redirigiendo al cuestionario principal…</div>;
}
