import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

export function QuestionnaireList({ onSelectVersion, refreshSignal, onError, onInfo }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openCodes, setOpenCodes] = useState({});

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { const d = await api('/admin/questionnaires'); setItems(d.items || []); }
    catch (e) { setError(e.message); onError?.(e.message); }
    finally { setLoading(false); }
  }, [onError]);
  useEffect(() => { load(); }, [load, refreshSignal]);

  const toggleOpen = (code, active) => {
    if (active !== 'active') {
      onError?.('El cuestionario no está activo. Actívalo para ver versiones.');
      return;
    }
    setOpenCodes(s => ({ ...s, [code]: !s[code] }));
  };

  const setPrimary = async (code, primary) => {
    try {
      await api(`/admin/questionnaires/${code}/set-primary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primary }),
      });
      onInfo?.(primary ? 'Marcado como principal' : 'Quitado como principal');
      load();
    } catch (e) {
      const msg = (e?.message || '').includes('another_primary_exists') ? 'Ya hay otro cuestionario principal' : (e?.message || 'Error al cambiar principal');
      onError?.(msg);
    }
  }

  // Version-level actions
  const cloneVersion = async (versionId) => {
    if (!window.confirm('Clonar esta versión en un nuevo borrador?')) return;
    try { await api(`/admin/versions/${versionId}/clone`, { method: 'POST' }); await load(); onInfo?.('Versión clonada'); }
    catch (e) { onError?.(e.message); }
  };
  const unpublishVersion = async (versionId) => {
    if (!window.confirm('Despublicar esta versión? Pasará a borrador.')) return;
    try { await api(`/admin/versions/${versionId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'draft' }) }); await load(); onInfo?.('Versión despublicada'); }
    catch (e) { onError?.(e.message); }
  };
  const deleteVersion = async (versionId) => {
    if (!window.confirm('Eliminar esta versión?')) return;
    try { await api(`/admin/versions/${versionId}`, { method: 'DELETE' }); await load(); onInfo?.('Versión eliminada'); }
    catch (e) { onError?.(e.message); }
  };

  // Eliminación de versiones se realiza dentro del editor de versión para mantener la lista limpia.

  return (
    <div className="card">
      <h2 className="admin-h2">Cuestionarios existentes</h2>
      {loading && <p>Cargando...</p>}
      {error && <p className="admin-error">{error}</p>}
      {!loading && items.length === 0 && <p>No hay cuestionarios.</p>}
      <ul className="q-list">
        {items.map(q => (
          <li key={q.code} className="q-item">
            <div className="q-row">
              <div className="q-meta">
                <strong className="q-code">{q.code}</strong>
                <span className="q-title">{q.title}</span>
                {q.is_primary && <span className="badge badge-primary" title="Cuestionario principal" style={{ marginLeft: 8 }}>PRINCIPAL</span>}
              </div>
              <div className="q-actions">
                <span className={`badge badge-${q.status}`}>{q.status}</span>
                <button className='btn btn-secondary btn-sm' onClick={() => toggleOpen(q.code, q.status)} title='Abrir cuestionario'>Abrir</button>
                {!q.is_primary ? (
                  <button className='btn btn-primary btn-sm' onClick={() => setPrimary(q.code, true)} title='Marcar como principal'>Principal</button>
                ) : (
                  <button className='btn btn-secondary btn-sm' onClick={() => setPrimary(q.code, false)} title='Quitar principal'>Quitar principal</button>
                )}
              </div>
            </div>
            {openCodes[q.code] && q.versions?.length > 0 && (
              <div className="version-chips">
                {q.versions.map(v => {
                  const icon = v.state === 'draft' ? '📝' : '✅';
                  const canUnpublish = v.state === 'published';
                  return (
                    <div key={v.id} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                      <button className='btn btn-secondary btn-sm' onClick={() => onSelectVersion(v.id)} title={`Abrir v${v.number}`}>
                        v{v.number} {icon} ({v.sections})
                      </button>
                      <button className='btn btn-secondary btn-sm' onClick={() => cloneVersion(v.id)} title='Clonar versión'>Clonar</button>
                      <button className='btn btn-warning btn-sm' onClick={() => unpublishVersion(v.id)} disabled={!canUnpublish} title='Despublicar versión'>Despublicar</button>
                      <button className='btn btn-danger btn-sm' onClick={() => deleteVersion(v.id)} title='Eliminar versión'>Del</button>
                    </div>
                  );
                })}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
