import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getDynamicQuestionnaire, getMyDynamicStatus, saveDynamicResponse, finalizeDynamicResponse, saveDynamicResponseKeepAlive, getPrefillValues } from "../api";

function InputForQuestion({ q, value, onChange, disabled, answers, fieldErrors }) {
  const common = { className: "form-control", style: { width:"100%" }, disabled: !!disabled };

  // Helpers for date bounds based on rules and other answers
  const computeDateBounds = (q) => {
    const r = q.validation_rules || {};
    let minAttr = undefined;
    let maxAttr = undefined;
    const today = new Date();
    const fmt = (d) => d.toISOString().slice(0,10);
    if (r.min_date) minAttr = String(r.min_date);
    if (r.max_date) maxAttr = String(r.max_date);
    if (r.not_after_today) {
      const t = fmt(today);
      maxAttr = maxAttr ? (t < maxAttr ? t : maxAttr) : t;
    }
    if (r.min_year) {
      const y = parseInt(r.min_year, 10); if (!isNaN(y)) {
        const d = new Date(Date.UTC(y, 0, 1));
        const s = fmt(d);
        minAttr = minAttr ? (s > minAttr ? s : minAttr) : s;
      }
    }
    if (r.max_year) {
      const y = parseInt(r.max_year, 10); if (!isNaN(y)) {
        const d = new Date(Date.UTC(y, 11, 31));
        const s = fmt(d);
        maxAttr = maxAttr ? (s < maxAttr ? s : maxAttr) : s;
      }
    }
    if (r.min_age_years) {
      const n = parseInt(r.min_age_years, 10); if (!isNaN(n)) {
        const d = new Date(Date.UTC(today.getUTCFullYear()-n, today.getUTCMonth(), today.getUTCDate()));
        const s = fmt(d);
        // fecha debe ser <= hoy - n -> max
        maxAttr = maxAttr ? (s < maxAttr ? s : maxAttr) : s;
      }
    }
    if (r.max_age_years) {
      const n = parseInt(r.max_age_years, 10); if (!isNaN(n)) {
        const d = new Date(Date.UTC(today.getUTCFullYear()-n, today.getUTCMonth(), today.getUTCDate()));
        const s = fmt(d);
        // fecha debe ser >= hoy - n -> min
        minAttr = minAttr ? (s > minAttr ? s : minAttr) : s;
      }
    }
    if (r.not_before_code && answers) {
      const other = answers[r.not_before_code];
      if (other) minAttr = String(other);
    }
    if (r.not_after_code && answers) {
      const other = answers[r.not_after_code];
      if (other) maxAttr = String(other);
    }
    return { minAttr, maxAttr };
  };
  switch (q.type) {
    case "textarea":
      return <textarea {...common} value={value || ""} onChange={e => onChange(e.target.value)} rows={3} />;
    case "number": {
      const vr = q.validation_rules || {};
      const stepVal = vr.allow_decimal ? (vr.step !== undefined ? vr.step : 'any') : 1;
      const props = { min: vr.min ?? undefined, max: vr.max ?? undefined, step: stepVal };
      const isIcfesGlobal = q.code === 'puntaje_global_saber11';
      return <input {...common} {...props} type="number" value={value ?? ""} onChange={e => onChange(e.target.value === "" ? "" : Number(e.target.value))} disabled={!!disabled || isIcfesGlobal} />;
    }
    case "date":
      {
        const { minAttr, maxAttr } = computeDateBounds(q);
        return <input {...common} type="date" min={minAttr} max={maxAttr} value={value || ""} onChange={e => onChange(e.target.value)} />;
      }
    case "email":
      return <input {...common} type="email" value={value || ""} onChange={e => onChange(e.target.value)} />;
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
    case "choice": {
      const hasOther = (q.options || []).some(op => op.is_other);
      const selectedIsOther = hasOther && value && (q.options || []).some(op => op.is_other && op.value === value);
      return (
        <div style={{display:"flex", flexDirection:"column", gap:"0.5rem"}}>
          <div style={{display:"flex", flexWrap:"wrap", gap:"1rem"}}>
            {q.options?.map(op => (
              <label key={op.value} style={{display:"flex", alignItems:"center", gap:"0.5rem"}}>
                <input type="radio" disabled={!!disabled} name={q.code} value={op.value} checked={value === op.value} onChange={() => onChange(op.value)} />
                {op.label}{op.is_other ? ' (Otro)' : ''}
              </label>
            ))}
          </div>
          {hasOther && (
            <input
              className="form-control"
              placeholder="Especifique (otro)"
              value={(answers && answers[`otro_${q.code}`]) || ''}
              onChange={e => onChange({ __other: e.target.value })}
              disabled={!selectedIsOther || !!disabled}
            />
          )}
        </div>
      );
    }
    case "multi_choice": {
      // Behavior: 'Ninguna' (case-insensitive) disables others; 'Todas las anteriores' selects all except none/other
      const options = q.options || [];
      const isNone = (label) => /ningun|ninguna|ninguno/i.test(label || "");
      const isAll = (label) => /todas\s+las\s+anteriores/i.test(label || "");
      const noneOption = options.find(op => isNone(op.label));
      const allOption = options.find(op => isAll(op.label));
      const selected = Array.isArray(value) ? new Set(value) : new Set();

      const toggle = (op, checked) => {
        const arr = new Set(selected);
        if (checked) {
          // If picking NONE, clear all others and keep only NONE
          if (noneOption && op.value === noneOption.value) {
            arr.clear();
            arr.add(op.value);
          } else if (allOption && op.value === allOption.value) {
            // Select all non-none, non-other (exclude any is_other)
            arr.delete(noneOption?.value);
            options.forEach(o => {
              if (o.value === noneOption?.value) return;
              if (o.is_other) return; // exclude 'Otro' from 'todas las anteriores'
              arr.add(o.value);
            });
          } else {
            // selecting a normal option unselects NONE
            arr.delete(noneOption?.value);
            arr.add(op.value);
          }
        } else {
          arr.delete(op.value);
          // If removing last normal when ALL was selected, leave array without ALL if nothing left
        }
        onChange(Array.from(arr));
      };

      const noneSelected = noneOption ? selected.has(noneOption.value) : false;

      return (
        <div style={{display:"flex", flexDirection:"column", gap:"0.5rem"}}>
          {options.map(op => {
            const checked = selected.has(op.value);
            const disabledOpt = !!disabled || (noneSelected && (!noneOption || op.value !== noneOption.value));
            return (
              <label key={op.value} style={{display:"flex", alignItems:"center", gap:"0.5rem"}}>
                <input type="checkbox" disabled={disabledOpt} checked={checked} onChange={e => toggle(op, e.target.checked)} />
                {op.label}{op.is_other ? ' (Otro)' : ''}
              </label>
            );
          })}
          {/* Sin campo de texto para multi_choice 'Otro' */}
          {/* Inline field error */}
          {!!fieldErrors?.length && (
            <div style={{ color: 'crimson', fontSize: 12 }}>
              {fieldErrors.map((m, i) => <div key={i}>{m}</div>)}
            </div>
          )}
        </div>
      );
    }
    default:
      return (
        <>
          <input {...common} type="text" value={value || ""} onChange={e => onChange(e.target.value)} />
          {!!fieldErrors?.length && (
            <div style={{ color: 'crimson', fontSize: 12 }}>
              {fieldErrors.map((m, i) => <div key={i}>{m}</div>)}
            </div>
          )}
        </>
      );
  }
}

export default function DynamicQuestionnaire() {
  const { code } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  let { usuario } = location.state || {};
  if (!usuario) {
    try { const u = JSON.parse(sessionStorage.getItem('usuario') || 'null'); if (u && (u.id_usuario !== undefined)) usuario = u; } catch (_) {}
  }
  // Cross-tab support: if no sessionStorage but there is an active student session in localStorage, synthesize minimal usuario
  if (!usuario) {
    try {
      const s = JSON.parse(localStorage.getItem('active_session') || 'null');
      if (s && s.type === 'student' && s.code) {
        usuario = { codigo_estudiante: s.code, id_usuario: -1 };
        try { sessionStorage.setItem('usuario', JSON.stringify(usuario)); } catch (_) {}
      }
    } catch (_) {}
  }
  useEffect(() => {
    if (!usuario) navigate('/login');
  }, [usuario, usuario?.codigo_estudiante, navigate]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({});
  // userCode input removed: always use usuario/session
  const [submitMsg, setSubmitMsg] = useState("");
  const [submitErr, setSubmitErr] = useState("");
  const [finalized, setFinalized] = useState(false);
  const [openSections, setOpenSections] = useState({});
  const [busySave, setBusySave] = useState(false);
  const [busyFinalize, setBusyFinalize] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({}); // { [qcode]: [messages] }
  const [mlResult, setMlResult] = useState(null);

  // Helper to coerce raw answers from backend into proper JS types based on questionnaire structure
  const coerceAnswers = (structure, raw) => {
    const out = {};
    if (!raw || typeof raw !== 'object') return out;
    const typeByCode = {};
    (structure?.sections || []).forEach(sec => (sec.questions || []).forEach(q => { typeByCode[q.code] = q.type; }));
    for (const [k, v] of Object.entries(raw)) {
      const t = typeByCode[k];
      if (t === 'boolean') {
        if (v === true || v === false) out[k] = v;
        else if (v === 1 || v === '1' || v === 'true' || v === 'True' || v === 'TRUE') out[k] = true;
        else if (v === 0 || v === '0' || v === 'false' || v === 'False' || v === 'FALSE') out[k] = false;
        else out[k] = undefined;
      } else if (t === 'number') {
        if (v === '' || v === null || v === undefined) out[k] = '';
        else out[k] = Number(v);
      } else if (t === 'multi_choice') {
        if (Array.isArray(v)) out[k] = v;
        else if (typeof v === 'string') {
          try { out[k] = v.includes('|') ? v.split('|').filter(Boolean) : JSON.parse(v); }
          catch { out[k] = v ? [v] : []; }
        } else out[k] = [];
      } else {
        out[k] = v;
      }
    }
    return out;
  };

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
            if (mine.answers) setAnswers(coerceAnswers(res?.questionnaire, mine.answers));
            // Persisted ML summary for read-only view after reingress
            if (mine.ml) setMlResult(mine.ml);
          }
          // Prefill for unanswered fields using values from other questionnaires
          try {
            const structure = res?.questionnaire;
            const allCodes = [];
            (structure?.sections || []).forEach(sec => (sec.questions || []).forEach(q => allCodes.push(q.code)));
            const current = mine?.answers ? coerceAnswers(structure, mine.answers) : {};
            const missing = allCodes.filter(c => current[c] === undefined || current[c] === null || current[c] === "");
            if (missing.length) {
              const pf = await getPrefillValues(usuario.codigo_estudiante, missing);
              const values = pf?.values || {};
              const next = { ...(mine?.answers || {}) };
              missing.forEach(c => {
                if (values[c] !== undefined && values[c] !== null && next[c] === undefined) {
                  next[c] = values[c];
                }
              });
              if (mounted) setAnswers(coerceAnswers(structure, next));
            }
          } catch (_) { /* best-effort prefill */ }
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
  const evalVisible = useCallback((rule, vals) => {
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
  }, []);

  // Derive which sections have at least one visible question
  const visibleMap = useMemo(() => {
    const map = {};
    if (!data?.sections) return map;
    for (const sec of data.sections) {
      const vqs = (sec.questions || []).filter(q => evalVisible(q.visible_if, answers));
      map[sec.id] = vqs.map(q => q.id);
    }
    return map;
  }, [data, answers, evalVisible]);

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
    setAnswers(prev => {
      const next = { ...prev };
      if (val && typeof val === 'object' && val.__other !== undefined) {
        // Inline "otro" textbox uses pseudo payload {__other: value}
        next[`otro_${qcode}`] = val.__other;
      } else {
        next[qcode] = val;
      }
      // Auto-calc ICFES global if components present
      const lc = next['puntaje_lectura_critica'];
      const m = next['puntaje_matematicas'];
      const sc = next['puntaje_sociales_ciudadanas'];
      const cn = next['puntaje_ciencias_naturales'];
      const i = next['puntaje_ingles'];
      const allNums = [lc,m,sc,cn,i].every(v => typeof v === 'number' && !isNaN(v));
      if (allNums) {
        const ponderado = 3 * (lc + m + sc + cn) + i;
        const indice = ponderado / 13;
        const global_calc = Math.max(0, Math.min(500, Math.round(indice * 5)));
        next['puntaje_global_saber11'] = global_calc;
      }
      return next;
    });
  };

  // Client-side soft validation before save
  const validateBeforeSave = (opts = { enforceRequired: false }) => {
    if (!data) return null;
    const errs = [];
    const perField = {};
    for (const sec of (data.sections || [])) {
      for (const q of (sec.questions || [])) {
        const val = answers[q.code];
        if (q.type === 'number') {
          if (val !== '' && val !== undefined && val !== null) {
            const vr = q.validation_rules || {};
            if (typeof val !== 'number' || isNaN(val)) {
              errs.push(`${q.text}: valor inválido`);
              perField[q.code] = [...(perField[q.code]||[]), 'Valor inválido'];
            } else {
              if (vr.min !== undefined && val < vr.min) { errs.push(`${q.text}: menor que ${vr.min}`); perField[q.code] = [...(perField[q.code]||[]), `Debe ser ≥ ${vr.min}`]; }
              if (vr.max !== undefined && val > vr.max) { errs.push(`${q.text}: mayor que ${vr.max}`); perField[q.code] = [...(perField[q.code]||[]), `Debe ser ≤ ${vr.max}`]; }
            }
          }
        } else if (q.type === 'date') {
          const { minAttr, maxAttr } = (() => {
            const r = q.validation_rules || {};
            // reuse same logic as computeDateBounds but with current answers
            const today = new Date();
            const fmt = (d) => d.toISOString().slice(0,10);
            let minAttr = r.min_date || undefined;
            let maxAttr = r.max_date || undefined;
            if (r.not_after_today) { const t = fmt(today); maxAttr = maxAttr ? (t < maxAttr ? t : maxAttr) : t; }
            if (r.min_year) { const y = parseInt(r.min_year,10); if(!isNaN(y)){ const s = `${y}-01-01`; minAttr = minAttr ? (s>minAttr?s:minAttr) : s; } }
            if (r.max_year) { const y = parseInt(r.max_year,10); if(!isNaN(y)){ const s = `${y}-12-31`; maxAttr = maxAttr ? (s<maxAttr?s:maxAttr) : s; } }
            if (r.min_age_years) { const n=parseInt(r.min_age_years,10); if(!isNaN(n)){ const d=new Date(); d.setFullYear(d.getFullYear()-n); const s=fmt(d); maxAttr = maxAttr ? (s<maxAttr?s:maxAttr) : s; } }
            if (r.max_age_years) { const n=parseInt(r.max_age_years,10); if(!isNaN(n)){ const d=new Date(); d.setFullYear(d.getFullYear()-n); const s=fmt(d); minAttr = minAttr ? (s>minAttr?s:minAttr) : s; } }
            if (r.not_before_code && answers[r.not_before_code]) minAttr = answers[r.not_before_code];
            if (r.not_after_code && answers[r.not_after_code]) maxAttr = answers[r.not_after_code];
            return { minAttr, maxAttr };
          })();
          if (val) {
            if (minAttr && val < minAttr) { errs.push(`${q.text}: fecha antes de ${minAttr}`); perField[q.code] = [...(perField[q.code]||[]), `No antes de ${minAttr}`]; }
            if (maxAttr && val > maxAttr) { errs.push(`${q.text}: fecha después de ${maxAttr}`); perField[q.code] = [...(perField[q.code]||[]), `No después de ${maxAttr}`]; }
          }
        }
        // Require inline 'otro' text if selected (only for single choice)
        const hasOther = (q.options || []).some(op => op.is_other);
        if (hasOther) {
          const others = (q.options || []).filter(op => op.is_other).map(op => op.value);
          if ((q.type === 'single_choice' || q.type === 'choice') && others.includes(val)) {
            const t = (answers[`otro_${q.code}`] || '').toString().trim();
            if (!t) { errs.push(`${q.text}: especifique el valor de "Otro"`); perField[q.code] = [...(perField[q.code]||[]), 'Debe especificar el valor de "Otro"']; }
          }
        }
        // Required fields (only when enforcing)
        if (opts.enforceRequired && q.required) {
          const has = (() => {
            if (q.type === 'multi_choice') return Array.isArray(val) && val.length > 0;
            return val !== undefined && val !== '' && val !== null;
          })();
          if (!has) { errs.push(`${q.text}: campo obligatorio`); perField[q.code] = [...(perField[q.code]||[]), 'Campo obligatorio']; }
        }
      }
    }
    setFieldErrors(perField);
    return errs.length ? errs : null;
  };

  const handleSave = async () => {
    setSubmitErr(""); setSubmitMsg("");
    setBusySave(true);
    try {
      const errs = validateBeforeSave({ enforceRequired: false });
      if (errs && errs.length) {
        setSubmitErr(`Corrige valores inválidos antes de guardar: \n- ${errs.join('\n- ')}`);
        return;
      }
  const payload = { user_code: usuario?.codigo_estudiante || undefined, answers };
      await saveDynamicResponse(code, payload);
      setSubmitMsg("Progreso guardado.");
    } catch (e) {
      setSubmitErr(e.message || "No se pudo guardar.");
    } finally {
      setBusySave(false);
    }
  };

  const handleFinalize = async () => {
    setSubmitErr(""); setSubmitMsg("");
    setBusyFinalize(true);
    try {
      const errs = validateBeforeSave({ enforceRequired: true });
      if (errs && errs.length) {
        setSubmitErr(`Corrige antes de finalizar: \n- ${errs.join('\n- ')}`);
        return;
      }
      const payload = { user_code: usuario?.codigo_estudiante || undefined, answers };
      const res = await finalizeDynamicResponse(code, payload);
      setFinalized(true);
      const ml = res?.ml || null;
      if (ml) setMlResult(ml);
      setSubmitMsg("Cuestionario finalizado.");
    } catch (e) {
      setSubmitErr(e.message || "No se pudo finalizar.");
    } finally {
      setBusyFinalize(false);
    }
  };

  // Autosave on unload (best-effort keepalive)
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (finalized) return;
  const payload = { user_code: usuario?.codigo_estudiante || undefined, answers };
      // fire and forget; keep it quick
      saveDynamicResponseKeepAlive(code, payload);
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [finalized, answers, code, usuario]);

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

        {/* ML result card shown after finalize */}
        {mlResult && (
          <div className="card" style={{
            padding: '1rem',
            border: '1px solid #d1fae5',
            background: '#ecfdf5',
            borderRadius: 8,
            marginBottom: '1rem'
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 6 }}>
              <strong style={{ color:'#065f46' }}>Resultado del modelo</strong>
              {typeof mlResult.prob === 'number' && (
                <span style={{ fontSize:12, color:'#047857' }}>Probabilidad: {(mlResult.prob * 100).toFixed(1)}%</span>
              )}
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap: 12 }}>
              {(() => {
                const cls = Array.isArray(mlResult.class_names) ? mlResult.class_names : null;
                const posLabel = mlResult.positive_label || (cls && cls[mlResult.positive_index || 1]);
                const friendly = mlResult.label || (mlResult.decision ? (posLabel || 'POSITIVE') : (posLabel ? `NO_${posLabel}` : 'NEGATIVE'));
                const decisionText = `Clasificación: ${friendly}`;
                return (
                  <span style={{
                    padding: '0.4rem 0.7rem',
                    borderRadius: 999,
                    fontWeight: 600,
                    color: mlResult.decision ? '#065f46' : '#991b1b',
                    background: mlResult.decision ? '#d1fae5' : '#fee2e2',
                    border: `1px solid ${mlResult.decision ? '#a7f3d0' : '#fecaca'}`
                  }}>{decisionText}</span>
                );
              })()}
            </div>
            {mlResult.status && mlResult.status !== 'ok' ? (
              <div style={{ marginTop: 8, fontSize: 12, color:'#991b1b', background:'#fef2f2', border:'1px solid #fecaca', padding:8, borderRadius:6 }}>
                Inferencia omitida: {mlResult.status}{mlResult.reason ? ` · ${mlResult.reason}` : ''}
                {mlResult.error && (
                  <>
                    {` · ${mlResult.error}`}
                  </>
                )}
                {mlResult.env && (
                  <div style={{ marginTop:4, opacity:0.8 }}>
                    <code style={{ fontSize:11 }}>
                      py={mlResult.env.py} skl={mlResult.env.sklearn || 'n/a'} joblib={mlResult.env.joblib || 'n/a'} {mlResult.env.platform}
                    </code>
                  </div>
                )}
              </div>
            ) : (
              (() => {
                // Mensaje enfocado al estudiante (sin tecnicismos ni umbrales)
                const isPositive = mlResult.decision === true; // true => afinidad con STEM
                const stemMeaning = 'STEM se refiere a programas en Ciencia, Tecnología, Ingeniería y Matemáticas.';
                const modelNote = 'Este resultado fue generado automáticamente a partir de tus respuestas por un modelo estadístico.';
                const commonTail = 'Tómalo como una guía para explorar; no define tu futuro.';
                const positiveMsg = `Tus respuestas muestran una alta probabilidad de afinidad con áreas STEM. ${stemMeaning} ${modelNote} ${commonTail}`;
                const negativeMsg = `Con base en tus respuestas, el modelo estima menor probabilidad de afinidad con áreas STEM. ${stemMeaning} ${modelNote} Puede que otras áreas (por ejemplo, sociales, humanidades, artes, salud, etc.) se ajusten mejor a tus intereses hoy. También puedes fortalecer tu interés por STEM con actividades y cursos si así lo deseas. ${commonTail}`;
                return (
                  <div style={{ marginTop: 8, fontSize: 12, lineHeight:1.4, color:'#064e3b' }}>{isPositive ? positiveMsg : negativeMsg}</div>
                );
              })()
            )}
            {/* Optional feature debug */}
            {mlResult.features && (
              <details style={{ marginTop: 8 }}>
                <summary style={{ cursor:'pointer', color:'#047857' }}>Ver variables utilizadas</summary>
                <div style={{ fontSize: 12, color:'#065f46', marginTop:6, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:6 }}>
                  {Object.entries(mlResult.features).map(([k,v]) => (
                    <div key={k} style={{ padding:'6px 8px', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:6 }}>
                      <div style={{ fontWeight:600 }}>{k}</div>
                      <div>{String(v)}</div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()} style={{display:"flex", flexDirection:"column", gap:"1rem"}}>
          {/* Código de estudiante removido del UI; el backend asocia por sesión */}

          {data.sections?.map(sec => {
            const visibleQIds = visibleMap[sec.id] || [];
            const hasVisible = visibleQIds.length > 0;
            if (!hasVisible) return null;
            const isOpen = !!openSections[sec.id];
            const answeredInSec = (sec.questions || []).filter(q => visibleQIds.includes(q.id)).reduce((acc, q) => {
              const val = answers[q.code];
              const has = q.type === 'multi_choice' ? Array.isArray(val) && val.length > 0 : (val !== undefined && val !== "");
              return acc + (has ? 1 : 0);
            }, 0);
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
                          <InputForQuestion q={q} value={answers[q.code]} onChange={v => handleChange(q.code, v)} disabled={finalized} answers={answers} fieldErrors={fieldErrors[q.code]} />
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
                <button type="button" className="btn btn-secondary" onClick={handleSave} disabled={busySave || busyFinalize}>
                  {busySave ? 'Guardando…' : 'Guardar'}
                </button>
                <button type="button" className="btn btn-primary" onClick={handleFinalize} disabled={busyFinalize || busySave}>
                  {busyFinalize ? 'Finalizando…' : 'Finalizar'}
                </button>
              </>
            )}
            <button type="button" className="btn" onClick={() => navigate("/dashboard", { state: { usuario } })}>{finalized ? "Volver al Dashboard" : "Cancelar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
