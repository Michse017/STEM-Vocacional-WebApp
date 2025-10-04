import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getDynamicQuestionnaire, getMyDynamicStatus, saveDynamicResponse, finalizeDynamicResponse, saveDynamicResponseKeepAlive } from "../api";

function InputForQuestion({ q, value, onChange, disabled }) {
  const common = { style: { width:"100%" }, disabled: !!disabled };
  switch (q.type) {
    case "textarea":
      return <textarea {...common} value={value || ""} onChange={e => onChange(e.target.value)} rows={3} />;
    case "number":
      return <input {...common} type="number" value={value ?? ""} onChange={e => onChange(e.target.value === "" ? "" : Number(e.target.value))} />;
    case "date":
      return <input {...common} type="date" value={value || ""} onChange={e => onChange(e.target.value)} />;
    case "boolean":
      return (
        <div style={{display:"flex", gap:"1rem"}}>
          <label><input type="radio" disabled={!!disabled} checked={value === true} onChange={() => onChange(true)} /> Sí</label>
          <label><input type="radio" disabled={!!disabled} checked={value === false} onChange={() => onChange(false)} /> No</label>
        </div>
      );
    case "single_choice":
    case "choice":
      return (
        <div style={{display:"flex", flexWrap:"wrap", gap:"1rem"}}>
          {q.options?.map(op => (
            <label key={op.value} style={{display:"flex", alignItems:"center", gap:"0.5rem"}}>
              <input type="radio" disabled={!!disabled} name={q.code} value={op.value} checked={value === op.value} onChange={() => onChange(op.value)} />
              {op.label}
            </label>
          ))}
        </div>
      );
    case "multi_choice":
      return (
        <div style={{display:"flex", flexDirection:"column", gap:"0.5rem"}}>
          {q.options?.map(op => {
            const checked = Array.isArray(value) && value.includes(op.value);
            return (
              <label key={op.value} style={{display:"flex", alignItems:"center", gap:"0.5rem"}}>
                <input type="checkbox" disabled={!!disabled} checked={checked} onChange={e => {
                  const arr = Array.isArray(value) ? [...value] : [];
                  if (e.target.checked) { if (!arr.includes(op.value)) arr.push(op.value); }
                  else { const i = arr.indexOf(op.value); if (i>=0) arr.splice(i,1); }
                  onChange(arr);
                }} />
                {op.label}
              </label>
            );
          })}
        </div>
      );
    default:
      return <input {...common} type="text" value={value || ""} onChange={e => onChange(e.target.value)} />;
  }
}

export default function DynamicQuestionnaire() {
  const { code } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  let { usuario } = location.state || {};
  if (!usuario) {
    try { const u = JSON.parse(sessionStorage.getItem('usuario') || 'null'); if (u && u.id_usuario) usuario = u; } catch (_) {}
  }
  useEffect(() => {
    if (!usuario) navigate('/login');
  }, [usuario, usuario?.codigo_estudiante, navigate]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({});
  const [userCode, setUserCode] = useState(usuario?.codigo_estudiante || "");
  const [submitMsg, setSubmitMsg] = useState("");
  const [submitErr, setSubmitErr] = useState("");
  const [finalized, setFinalized] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getDynamicQuestionnaire(code);
        if (mounted) setData(res?.questionnaire || null);
        if (usuario?.codigo_estudiante) {
          const mine = await getMyDynamicStatus(code, usuario.codigo_estudiante);
          if (mounted && mine) {
            setFinalized(mine.status === 'finalized');
            if (mine.answers) setAnswers(mine.answers);
          }
        }
      } catch (e) {
        if (mounted) setError(e.message || "No se pudo cargar el cuestionario.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [code]);

  // (If needed later) You can compute a flattened list of questions here.

  const handleChange = (qcode, val) => {
    setAnswers(prev => ({ ...prev, [qcode]: val }));
  };

  const handleSave = async () => {
    setSubmitErr(""); setSubmitMsg("");
    try {
      const payload = { user_code: usuario?.codigo_estudiante || userCode || undefined, answers };
      await saveDynamicResponse(code, payload);
      setSubmitMsg("Progreso guardado.");
    } catch (e) {
      setSubmitErr(e.message || "No se pudo guardar.");
    }
  };

  const handleFinalize = async () => {
    setSubmitErr(""); setSubmitMsg("");
    try {
      const payload = { user_code: usuario?.codigo_estudiante || userCode || undefined, answers };
      await finalizeDynamicResponse(code, payload);
      setFinalized(true);
      setSubmitMsg("Cuestionario finalizado.");
      setTimeout(() => navigate("/dashboard", { state: { usuario } }), 1000);
    } catch (e) {
      setSubmitErr(e.message || "No se pudo finalizar.");
    }
  };

  // Autosave on unload (best-effort keepalive)
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (finalized) return;
      const payload = { user_code: usuario?.codigo_estudiante || userCode || undefined, answers };
      // fire and forget; keep it quick
      saveDynamicResponseKeepAlive(code, payload);
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [finalized, answers, code, usuario, userCode]);

  if (loading) return <div className="card" style={{padding:"1rem"}}>Cargando...</div>;
  if (error) return <div className="card" style={{padding:"1rem", color:"crimson"}}>{error}</div>;
  if (!data) return <div className="card" style={{padding:"1rem"}}>No encontrado.</div>;

  return (
    <div className="card" style={{padding:"1.25rem"}}>
      <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{marginBottom:"1rem"}}>Volver</button>
      <h2 style={{marginBottom:"0.5rem"}}>{data.title || code}</h2>
      <div style={{fontSize:"0.875rem", color:"var(--text-muted)", marginBottom:"1rem"}}>Versión #{data.version_number} · Estado {data.status}</div>
      {finalized && (
        <div className="alert alert-success" style={{marginBottom:"1rem"}}>
          Este cuestionario fue finalizado. Estás en modo solo lectura.
        </div>
      )}

  <form onSubmit={(e) => e.preventDefault()} style={{display:"flex", flexDirection:"column", gap:"1rem"}}>
        <div className="card" style={{padding:"1rem"}}>
          <label style={{fontWeight:600}}>Código de estudiante (opcional)</label>
          <input type="text" value={userCode} onChange={e => setUserCode(e.target.value)} placeholder="Ej: A00123456" disabled={finalized} />
        </div>

        {data.sections?.map(sec => (
          <div key={sec.id} className="card" style={{padding:"1rem"}}>
            <h3 style={{marginBottom:"0.5rem"}}>{sec.title}</h3>
            <div style={{display:"flex", flexDirection:"column", gap:"0.75rem"}}>
              {sec.questions?.map(q => (
                <div key={q.id}>
                  <label style={{display:"block", fontWeight:600, marginBottom:"0.25rem"}}>{q.text} {q.required && <span style={{color:"crimson"}}>*</span>}</label>
                  <InputForQuestion q={q} value={answers[q.code]} onChange={v => handleChange(q.code, v)} disabled={finalized} />
                </div>
              ))}
            </div>
          </div>
        ))}

        {submitErr && <div className="alert alert-error">{submitErr}</div>}
        {submitMsg && <div className="alert alert-success">{submitMsg}</div>}

        <div style={{display:"flex", gap:"1rem", flexWrap:"wrap"}}>
          <button type="button" className="btn btn-secondary" onClick={handleSave} disabled={finalized}>Guardar</button>
          <button type="button" className="btn btn-primary" onClick={handleFinalize} disabled={finalized}>Finalizar</button>
          <button type="button" className="btn" onClick={() => navigate("/dynamic", { state: { usuario } })}>{finalized ? "Volver" : "Cancelar"}</button>
        </div>
      </form>
    </div>
  );
}
