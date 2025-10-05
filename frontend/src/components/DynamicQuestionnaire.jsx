import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getDynamicQuestionnaire, getMyDynamicStatus, saveDynamicResponse, finalizeDynamicResponse, saveDynamicResponseKeepAlive } from "../api";

function InputForQuestion({ q, value, onChange, disabled }) {
  const common = { className: "form-control", style: { width:"100%" }, disabled: !!disabled };
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
          <label style={{display:"flex", alignItems:"center", gap:"0.5rem"}}>
            <input type="radio" disabled={!!disabled} checked={value === true} onChange={() => onChange(true)} /> Sí
          </label>
          <label style={{display:"flex", alignItems:"center", gap:"0.5rem"}}>
            <input type="radio" disabled={!!disabled} checked={value === false} onChange={() => onChange(false)} /> No
          </label>
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
  const [openSections, setOpenSections] = useState({});

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
  }, [code, usuario?.codigo_estudiante]);

  // Client-side visibility evaluator (mirrors backend simple rules)
  const evalVisible = (rule, vals) => {
    if (!rule) return true;
    if (typeof rule !== 'object') return true;
    if (Array.isArray(rule.and)) return rule.and.every(r => evalVisible(r, vals));
    if (Array.isArray(rule.or)) return rule.or.some(r => evalVisible(r, vals));
    const code = rule.code;
    if (code) {
      const expected = rule.equals;
      return (vals ?? {})[code] === expected;
    }
    return true;
  };

  // Derive which sections have at least one visible question
  const visibleMap = useMemo(() => {
    const map = {};
    if (!data?.sections) return map;
    for (const sec of data.sections) {
      const vqs = (sec.questions || []).filter(q => evalVisible(q.visible_if, answers));
      map[sec.id] = vqs.map(q => q.id);
    }
    return map;
  }, [data, answers]);

  // Initialize open state on first load to open first section that has visible questions
  useEffect(() => {
    if (!data?.sections?.length) return;
    setOpenSections(prev => {
      if (Object.keys(prev).length) return prev;
      const next = {};
      let opened = false;
      for (const sec of data.sections) {
        const hasVisible = (visibleMap[sec.id] || []).length > 0;
        next[sec.id] = !opened && hasVisible; // open the first visible one
        if (!opened && hasVisible) opened = true;
      }
      return next;
    });
  }, [data, visibleMap]);

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

  if (loading) return <div className="cuestionario-container"><div className="card" style={{padding:"1rem"}}>Cargando...</div></div>;
  if (error) return <div className="cuestionario-container"><div className="card" style={{padding:"1rem", color:"crimson"}}>{error}</div></div>;
  if (!data) return <div className="cuestionario-container"><div className="card" style={{padding:"1rem"}}>No encontrado.</div></div>;

  return (
    <div className="cuestionario-container">
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
            <label style={{fontWeight:600, display:"block", marginBottom:"0.5rem"}}>Código de estudiante (opcional)</label>
            <input className="form-control" type="text" value={userCode} onChange={e => setUserCode(e.target.value)} placeholder="Ej: A00123456" disabled={finalized} />
          </div>

          {data.sections?.map(sec => {
            const visibleQIds = visibleMap[sec.id] || [];
            const hasVisible = visibleQIds.length > 0;
            if (!hasVisible) return null;
            const isOpen = !!openSections[sec.id];
            const answeredInSec = (sec.questions || []).filter(q => visibleQIds.includes(q.id)).reduce((acc, q) => acc + (answers[q.code] !== undefined && answers[q.code] !== "" ? 1 : 0), 0);
            const totalInSec = visibleQIds.length;
            return (
              <fieldset key={sec.id} className="accordion-section">
                <legend onClick={() => setOpenSections(prev => ({ ...prev, [sec.id]: !isOpen }))} aria-expanded={isOpen}>
                  <span>{sec.title}</span>
                  <span style={{display:"flex", alignItems:"center", gap:"0.75rem"}}>
                    <span style={{fontSize:"0.9rem", color:"var(--text-muted)"}}>{answeredInSec}/{totalInSec}</span>
                    <span className="accordion-icon" style={{transform: isOpen ? "rotate(90deg)" : "rotate(0deg)"}}>›</span>
                  </span>
                </legend>
                {isOpen && (
                  <div className="fieldset-content">
                    <div style={{display:"flex", flexDirection:"column", gap:"0.75rem"}}>
                      {sec.questions?.filter(q => visibleQIds.includes(q.id)).map(q => (
                        <div key={q.id}>
                          <label style={{display:"block", fontWeight:600, marginBottom:"0.25rem"}}>
                            {q.text} {q.required && <span style={{color:"crimson"}}>*</span>}
                          </label>
                          <InputForQuestion q={q} value={answers[q.code]} onChange={v => handleChange(q.code, v)} disabled={finalized} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </fieldset>
            );
          })}

          {submitErr && <div className="alert alert-error">{submitErr}</div>}
          {submitMsg && <div className="alert alert-success">{submitMsg}</div>}

          <div style={{display:"flex", gap:"1rem", flexWrap:"wrap"}}>
            {!finalized && (
              <>
                <button type="button" className="btn btn-secondary" onClick={handleSave}>Guardar</button>
                <button type="button" className="btn btn-primary" onClick={handleFinalize}>Finalizar</button>
              </>
            )}
            <button type="button" className="btn" onClick={() => navigate("/dashboard", { state: { usuario } })}>{finalized ? "Volver al Dashboard" : "Cancelar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
