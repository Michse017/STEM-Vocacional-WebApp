import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api, deleteQuestionnaire } from '../api';
import { CreateQuestionnaire } from './CreateQuestionnaire';
import { Modal } from './ui/Modal';

export function QuestionnairesGrid({ onOpenPanel }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [term, setTerm] = useState('');
  const [primaryOpen, setPrimaryOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { const d = await api('/admin/questionnaires'); setItems(d.items || []); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load, refreshSignal]);

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return items;
    return items.filter(q => q.code.toLowerCase().includes(t) || (q.title||'').toLowerCase().includes(t));
  }, [items, term]);

  const principal = useMemo(() => items.find(i => i.is_primary), [items]);

  const setPrimary = async (code, primary) => {
    try {
      setBusy(true);
      await api(`/admin/questionnaires/${code}/set-primary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primary })
      });
      setPrimaryOpen(false);
      setRefreshSignal(s => s + 1);
    } catch (e) { alert(e.message || 'No se pudo cambiar el principal'); }
    finally { setBusy(false); }
  };

  const removeQuestionnaire = async (code) => {
    if (!window.confirm(`Eliminar cuestionario "${code}"?\nNota: Debes borrar o despublicar todas las versiones primero.`)) return;
    try { setBusy(true); await deleteQuestionnaire(code); setRefreshSignal(s => s + 1); }
    catch (e) { alert((e?.message||'Error al eliminar')); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ display:'grid', gap: 16 }}>
      <div className='card' style={{ display:'grid', gap: 12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 className='admin-h2' style={{ marginBottom: 4 }}>Cuestionarios</h2>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>
              {principal ? <>Principal actual: <strong>{principal.code}</strong></> : 'No hay cuestionario principal.'}
            </div>
          </div>
          <div style={{ display:'flex', gap: 8, flexWrap:'wrap' }}>
            <button className='btn btn-secondary btn-sm' onClick={() => setPrimaryOpen(true)}>Designar principal</button>
            {principal && <button className='btn btn-warning btn-sm' onClick={() => setPrimary(principal.code, false)} disabled={busy}>Quitar principal</button>}
          </div>
        </div>
        <div style={{ display:'grid', gap: 10, gridTemplateColumns:'1fr 1fr', alignItems:'start' }}>
          <CreateQuestionnaire onCreated={() => setRefreshSignal(s => s + 1)} />
          <div>
            <input className='form-control' placeholder='Buscar cuestionario' value={term} onChange={e=>setTerm(e.target.value)} />
          </div>
        </div>
      </div>

      {loading && <div className='card'>Cargando...</div>}
      {error && <div className='card admin-error'>Error: {error}</div>}

      <div className='cards-grid'>
        {filtered.map(q => (
          <div key={q.code} className='q-card' onClick={()=>onOpenPanel(q.code)}>
            <div className='q-card-head'>
              <div className='q-card-title'>
                <div className='q-card-code'>{q.code}</div>
                <div className='q-card-sub'>{q.title}</div>
              </div>
              <span className={`badge badge-${q.status}`}>{q.status}</span>
            </div>
            {q.description && <div className='q-card-desc'>{q.description}</div>}
            <div className='q-card-foot'>
              <small>{(q.versions?.length||0)} versiones</small>
              <button className='btn btn-secondary btn-sm' onClick={(e)=>{e.stopPropagation(); onOpenPanel(q.code);}}>Abrir panel</button>
              <button className='btn btn-danger btn-sm' onClick={(e)=>{e.stopPropagation(); removeQuestionnaire(q.code);}}>Eliminar</button>
            </div>
          </div>
        ))}
        {(!loading && filtered.length===0) && (
          <div className='card' style={{ padding:16 }}>No hay resultados.</div>
        )}
      </div>

      <Modal open={primaryOpen} onClose={()=>setPrimaryOpen(false)} title='Selecciona el cuestionario principal'>
        <div style={{ display:'grid', gap:8 }}>
          {items.map(it => (
            <button key={it.code} className='btn btn-secondary' style={{ display:'flex', justifyContent:'space-between' }} onClick={()=>setPrimary(it.code, true)} disabled={busy}>
              <span>
                <strong style={{ marginRight:6 }}>{it.code}</strong>
                <span style={{ color:'#64748b' }}>{it.title}</span>
              </span>
              {it.is_primary && <span className='badge badge-primary'>Actual</span>}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
