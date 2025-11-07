import React, { useEffect, useMemo, useState } from 'react';
import { listMlModels, getMlModel } from '../api';

// Wizard to build ml_binding.input.features focusing on model-first mapping
// Props:
// - version: full version object from VersionEditor (includes sections/questions)
// - metaText: current metadata JSON string (for reading existing binding)
// - onApply(jsonObj): callback with updated metadata JSON object (caller persists/saves)
export default function FeatureBindingWizard({ version, metaText, onApply }) {
  const [rows, setRows] = useState([]); // [{name, source, type, map, default, divide_by, multiply_by, offset, clip_min, clip_max}]
  const [order, setOrder] = useState([]);
  const [artifactPath, setArtifactPath] = useState('backend/models/model.joblib');
  const [artifactFile, setArtifactFile] = useState('model.joblib'); // only filename; path is locked to backend/models/
  const [runtime, setRuntime] = useState('sklearn');
  const [classNames, setClassNames] = useState('NO_STEM,STEM');
  const [positiveLabel, setPositiveLabel] = useState('STEM');
  const [threshold, setThreshold] = useState('0.65');
  const [modelList, setModelList] = useState([]); // [{id,name,runtime}]
  const [selectedModelId, setSelectedModelId] = useState('');
  // Note: full model config kept local in effects; no state needed beyond selectedModelId

  const questionCodes = useMemo(() => {
    if (!version?.sections) return [];
    const list = [];
    [...version.sections]
      .sort((a,b)=>a.order-b.order || a.id-b.id)
      .forEach(sec => [...(sec.questions||[])].sort((a,b)=>a.order-b.order || a.id-b.id).forEach(q => list.push({ code: q.code, type: q.type })));
    return list;
  }, [version]);

  // Parse current meta to prefill (only when there's no selected model)
  useEffect(() => {
    let meta = {};
    try { meta = metaText && metaText.trim() ? JSON.parse(metaText) : {}; } catch { meta = {}; }
    const b = meta.ml_binding || {};
    if (!selectedModelId) {
      const ap = (b.artifact_path || 'backend/models/model.joblib');
      setArtifactPath(ap);
      try {
        const parts = String(ap).split(/[/\\\\]/);
        setArtifactFile(parts[parts.length - 1] || 'model.joblib');
      } catch { setArtifactFile('model.joblib'); }
      setRuntime((b.runtime || 'sklearn').toLowerCase());
      if (Array.isArray(b.class_names)) setClassNames(b.class_names.join(','));
      if (b.positive_label) setPositiveLabel(b.positive_label);
      if (b.threshold !== undefined) setThreshold(String(b.threshold));
      const specs = b.input?.features || [];
      setRows(specs.map(s => ({
        name: s.name || '',
        source: s.source || '',
        type: (s.type || 'number'),
        map: s.map || {},
        default: s.default !== undefined ? s.default : 0,
        divide_by: s.divide_by,
        multiply_by: s.multiply_by,
        offset: s.offset,
        clip_min: s.clip_min,
        clip_max: s.clip_max,
      })));
      const ord = b.input?.feature_order || specs.map(s => s.name).filter(Boolean);
      setOrder(ord);
    }
  }, [metaText, selectedModelId]);

  // Load available models list
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const d = await listMlModels();
        if (mounted && Array.isArray(d?.items)) setModelList(d.items);
      } catch (_) { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, []);

  // When a model is selected, fetch full config and seed rows and config
  useEffect(() => {
    if (!selectedModelId) return;
    let mounted = true;
    (async () => {
      try {
        const d = await getMlModel(selectedModelId);
        const m = d?.model;
        if (!mounted || !m) return;
        const ap = m.artifact_path || 'backend/models/model.joblib';
        setArtifactPath(ap);
        try {
          const parts = String(ap).split(/[/\\\\]/);
          setArtifactFile(parts[parts.length - 1] || 'model.joblib');
        } catch { setArtifactFile('model.joblib'); }
        setRuntime(String(m.runtime || 'sklearn').toLowerCase());
        if (Array.isArray(m.class_names)) setClassNames(m.class_names.join(','));
        setPositiveLabel(m.positive_label || '');
        setThreshold(String(m.threshold ?? ''));
        const feats = m?.input?.features || [];
        const ord = m?.input?.feature_order || feats.map(f => f.name).filter(Boolean);
        setOrder(ord);
        setRows(feats.map(f => ({
          name: f.name || '',
          source: '', // user must connect
          type: f.type || 'number',
          map: f.map || {},
          default: f.default,
          divide_by: f.divide_by,
          multiply_by: f.multiply_by,
          offset: f.offset,
          clip_min: f.clip_min,
          clip_max: f.clip_max,
        })));
      } catch (_) { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, [selectedModelId]);

  const move = (idx, dir) => {
    setRows(r => {
      const arr = [...r];
      const j = dir === 'up' ? idx - 1 : idx + 1;
      if (j < 0 || j >= arr.length) return arr;
      const tmp = arr[idx]; arr[idx] = arr[j]; arr[j] = tmp;
      return arr;
    });
  };

  const apply = () => {
    const num = (v) => {
      if (v === '' || v === undefined || v === null) return undefined;
      if (typeof v === 'number') return v;
      const n = parseFloat(String(v).replace(',', '.'));
      return Number.isFinite(n) ? n : undefined;
    };
    const cleaned = rows.map(r => {
      const o = { name: String(r.name||'').trim(), source: String(r.source||'').trim(), type: String(r.type||'number') };
      if (!o.name || !o.source) return null;
      if (r.type === 'category' || r.type === 'bool') {
        if (r.map && typeof r.map === 'object') o.map = r.map;
      }
      if (r.default !== undefined) o.default = num(r.default) ?? 0;
      if (r.divide_by !== undefined) o.divide_by = num(r.divide_by);
      if (r.multiply_by !== undefined) o.multiply_by = num(r.multiply_by);
      if (r.offset !== undefined) o.offset = num(r.offset);
      if (r.clip_min !== undefined) o.clip_min = num(r.clip_min);
      if (r.clip_max !== undefined) o.clip_max = num(r.clip_max);
      return o;
    }).filter(Boolean);
    // Require full mapping if a model is selected
    if (selectedModelId && cleaned.length !== rows.length) {
      alert('Faltan conexiones: mapea todas las variables del modelo a códigos del cuestionario.');
      return;
    }
    const ord = (order && order.length ? order : cleaned.map(c => c.name));
    const cls = classNames.split(',').map(s => s.trim()).filter(Boolean);
    const thr = num(threshold) ?? undefined;

    // Merge back into metadata
    let meta = {};
    try { meta = metaText && metaText.trim() ? JSON.parse(metaText) : {}; } catch { meta = {}; }
    const binding = meta.ml_binding || {};
    binding.artifact_path = artifactPath;
    binding.runtime = runtime || 'sklearn';
    if (cls.length) binding.class_names = cls; else delete binding.class_names;
    binding.positive_label = positiveLabel || undefined;
    if (thr !== undefined) binding.threshold = thr; else delete binding.threshold;
    binding.input = binding.input || {};
    binding.input.feature_order = ord;
    binding.input.features = cleaned;
    const next = { ...meta, ml_binding: binding };
    onApply(next);
  };

  const renderRow = (r, idx) => {
    return (
      <div key={idx} className='card' style={{ padding:8 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:8, alignItems:'center' }}>
          <input className='form-control' placeholder='Nombre de la variable del modelo' value={r.name||''} disabled readOnly />
          <select className='form-control' value={r.type||'number'} disabled>
            <option value='number'>number</option>
            <option value='bool'>bool</option>
            <option value='category'>category</option>
          </select>
          <select className='form-control' value={r.source||''} onChange={e=>{
            const v=e.target.value; setRows(arr=>arr.map((x,i)=>i===idx?{...x, source:v}:x));
          }}>
            <option value=''>— conectar a código del cuestionario —</option>
            {questionCodes.map(q => (
              <option key={q.code} value={q.code}>{q.code} ({q.type})</option>
            ))}
          </select>
          <div style={{ display:'flex', gap:6 }}>
            <button type='button' className='btn btn-secondary btn-sm' onClick={()=>move(idx,'up')} disabled={!!selectedModelId && idx===0}>↑</button>
            <button type='button' className='btn btn-secondary btn-sm' onClick={()=>move(idx,'down')} disabled={!!selectedModelId && idx===(rows.length-1)}>↓</button>
          </div>
        </div>
        {/* Transforms (solo lectura): si existen, mostramos un resumen compacto para no distraer */}
        {(() => {
          const vals = {
            default: r.default,
            divide_by: r.divide_by,
            multiply_by: r.multiply_by,
            offset: r.offset,
            clip_min: r.clip_min,
            clip_max: r.clip_max,
          };
          const entries = Object.entries(vals).filter(([,v]) => v !== undefined && v !== '' && v !== null);
          if (!entries.length) return null;
          const summary = entries.map(([k,v]) => `${k}=${v}`).join(' · ');
          return (
            <div style={{ marginTop:6 }}>
              <div style={{ fontSize:12, color:'#666' }} title="Ajustes numéricos aplicados por el modelo (solo lectura)">
                Ajustes del modelo: {summary}
              </div>
            </div>
          );
        })()}
        {r.type !== 'number' && (
          <div style={{ marginTop:8 }}>
            <label style={{ fontSize:12, color:'#555' }}>map (JSON)</label>
            <textarea rows={2} className='form-control' value={JSON.stringify(r.map||{}, null, 2)} readOnly disabled />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className='card' style={{ padding:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <strong>Configuración y mapeo del modelo ML (v2)</strong>
      </div>
      <div style={{ display:'grid', gap:8, marginTop:8 }}>
        {/* Selección de modelo pre-cargado */}
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 2fr 2fr 1fr', gap:8 }}>
          <select className='form-control' value={selectedModelId} onChange={e=>setSelectedModelId(e.target.value)}>
            <option value=''>— Seleccionar modelo pre-cargado —</option>
            {modelList.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.runtime})</option>
            ))}
          </select>
          <input className='form-control' placeholder='runtime' value={runtime} disabled readOnly />
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ whiteSpace:'nowrap', fontSize:12, color:'#666' }}>backend/models/</span>
            <input className='form-control' placeholder='archivo.joblib' value={artifactFile}
              onChange={e=>{
                const name = (e.target.value || '').replace(/[/\\\\]/g,'');
                setArtifactFile(name || 'model.joblib');
                setArtifactPath(`backend/models/${name || 'model.joblib'}`);
              }} />
          </div>
          <input className='form-control' placeholder='class_names (coma: A,B)' value={classNames} disabled readOnly />
          <input className='form-control' placeholder='positive_label' value={positiveLabel} disabled readOnly />
        </div>
        <div style={{ fontSize:12, color:'#666' }}>Ruta bloqueada a backend/models/. Cambia sólo el nombre del archivo.</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:8 }}>
          <input className='form-control' placeholder='threshold (0-1)' value={threshold} disabled readOnly />
        </div>

        {/* Variables del modelo y conexión a códigos del cuestionario */}
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontSize:12, color:'#555' }}>
            Conecta cada variable del modelo seleccionado a un código del cuestionario. Solo necesitas mapear los códigos; los
            ajustes numéricos del modelo (divide_by, offset, etc.) ya vienen preconfigurados y, si existen, se muestran en un resumen.
          </span>
        </div>

        <div style={{ display:'grid', gap:8 }}>
          {rows.map((r, idx) => renderRow(r, idx))}
        </div>

        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button className='btn btn-primary btn-sm' onClick={apply}>Aplicar al JSON</button>
        </div>
      </div>
    </div>
  );
}
