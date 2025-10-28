import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api';

export function QuestionnairePanel({ code, onBack, onOpenVersion }) {
  const [q, setQ] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const d = await api('/admin/questionnaires');
      const item = (d.items||[]).find(x => x.code === code);
      setQ(item || null);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [code]);
  useEffect(()=>{ load(); }, [load]);

  const isPrimary = !!q?.is_primary;

  const setPrimary = async (primary) => {
    try {
      setBusy(true);
      await api(`/admin/questionnaires/${code}/set-primary`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ primary })
      });
      await load();
    } catch (e) { alert(e.message || 'No se pudo cambiar el principal'); }
    finally { setBusy(false); }
  };

  const toggleStatus = async () => {
    try {
      setBusy(true);
      const target = q.status === 'active' ? 'inactive' : 'active';
      await api(`/admin/questionnaires/${encodeURIComponent(code)}`, {
        method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status: target })
      });
      await load();
    } catch (e) { alert(e.message); }
    finally { setBusy(false); }
  };

  const createNewVersion = async () => {
    try {
      setBusy(true);
      const res = await api(`/admin/questionnaires/${encodeURIComponent(code)}/new-version`, { method: 'POST' });
      const id = res?.version?.id;
      if (id) onOpenVersion?.(id);
    } catch (e) { alert(e.message || 'No se pudo crear la nueva versión'); }
    finally { setBusy(false); }
  };

  const cloneVersion = async (id) => {
    if (!window.confirm('Clonar esta versión en un nuevo borrador?')) return;
    try { setBusy(true); await api(`/admin/versions/${id}/clone`, { method:'POST' }); await load(); }
    catch (e) { alert(e.message); }
    finally { setBusy(false); }
  };

  const unpublishVersion = async (id) => {
    if (!window.confirm('Despublicar esta versión? Pasará a borrador.')) return;
    try { setBusy(true); await api(`/admin/versions/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status: 'draft' }) }); await load(); }
    catch (e) { alert(e.message); }
    finally { setBusy(false); }
  };

  const deleteVersion = async (id) => {
    if (!window.confirm('Eliminar esta versión?')) return;
    try { setBusy(true); await api(`/admin/versions/${id}`, { method:'DELETE' }); await load(); }
    catch (e) { alert(e.message); }
    finally { setBusy(false); }
  };

  const versions = useMemo(() => (q?.versions || []).slice().sort((a,b)=>a.number-b.number), [q]);

  return (
    <div className='card' style={{ display:'grid', gap: 12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap: 12, flexWrap:'wrap' }}>
        <div>
          <button className='btn btn-secondary btn-sm' onClick={onBack}>&larr; Volver</button>
          <h2 className='admin-h2' style={{ marginTop: 8 }}>{q?.title || code}</h2>
          <div style={{ fontSize:12, color:'var(--text-muted)' }}>
            Código: <strong>{code}</strong>
          </div>
        </div>
        <div style={{ display:'flex', gap: 8, flexWrap:'wrap' }}>
          <span className={`badge badge-${q?.status}`}>{q?.status}</span>
          <button className='btn btn-secondary btn-sm' onClick={toggleStatus} disabled={busy}>
            {q?.status === 'active' ? 'Desactivar' : 'Activar'}
          </button>
          {!isPrimary ? (
            <button className='btn btn-primary btn-sm' onClick={()=>setPrimary(true)} disabled={busy}>Marcar como principal</button>
          ) : (
            <button className='btn btn-warning btn-sm' onClick={()=>setPrimary(false)} disabled={busy}>Quitar principal</button>
          )}
          <button className='btn btn-primary btn-sm' onClick={createNewVersion} disabled={busy}>Nueva versión</button>
        </div>
      </div>

      {(loading || busy) && <div>Cargando...</div>}
      {error && <div className='admin-error'>Error: {error}</div>}

      {q?.description && (
        <div className='card' style={{ background:'#f8fafc' }}>
          {q.description}
        </div>
      )}

      <div>
        <h3 style={{ margin:'6px 0' }}>Versiones ({versions.length})</h3>
        <div className='table-wrap'>
          <table className='table'>
            <thead>
              <tr>
                <th>v</th>
                <th>Estado</th>
                <th>Secciones</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
            {versions.map(v => {
              const canUnpublish = v.state === 'published';
              return (
                <tr key={v.id}>
                  <td>v{v.number}</td>
                  <td>{v.state}</td>
                  <td>{v.sections}</td>
                  <td style={{ display:'flex', gap:6 }}>
                    <button className='btn btn-secondary btn-sm' onClick={()=>onOpenVersion(v.id)}>Abrir</button>
                    <button className='btn btn-secondary btn-sm' onClick={()=>cloneVersion(v.id)}>Clonar</button>
                    <button className='btn btn-warning btn-sm' onClick={()=>unpublishVersion(v.id)} disabled={!canUnpublish}>Despublicar</button>
                    <button className='btn btn-danger btn-sm' onClick={()=>deleteVersion(v.id)}>Eliminar</button>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
