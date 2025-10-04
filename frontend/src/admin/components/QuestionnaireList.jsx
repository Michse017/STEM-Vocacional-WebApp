import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

export function QuestionnaireList({ onSelectVersion, refreshSignal, onError, onInfo }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { const d = await api('/admin/questionnaires'); setItems(d.items || []); }
    catch (e) { setError(e.message); onError?.(e.message); }
    finally { setLoading(false); }
  }, [onError]);
  useEffect(() => { load(); }, [load, refreshSignal]);

  const clonePublished = async (code) => {
    if (!window.confirm('Clonar última versión publicada?')) return;
    try { await api(`/admin/questionnaires/${code}/clone-published`, { method: 'POST' }); load(); onInfo?.('Versión clonada'); }
    catch (e) { onError?.(e.message); }
  };
  const deleteQuestionnaire = async (code) => {
    if (!window.confirm('Eliminar cuestionario? (Solo sin versiones publicadas)')) return;
    try { await api(`/admin/questionnaires/${code}`, { method: 'DELETE' }); load(); onInfo?.('Cuestionario eliminado'); }
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
              </div>
              <div className="q-actions">
                <span className={`badge badge-${q.status}`}>{q.status}</span>
                <button className='btn btn-secondary btn-sm' onClick={() => clonePublished(q.code)} title='Clonar versión publicada'>Clonar</button>
                {q.versions?.some(v => v.state === 'published') ? (
                  <button className='btn btn-danger btn-sm' disabled title='No se puede eliminar: tiene versiones publicadas'>Del</button>
                ) : (
                  <button className='btn btn-danger btn-sm' onClick={() => deleteQuestionnaire(q.code)} title='Eliminar cuestionario'>Del</button>
                )}
              </div>
            </div>
            {q.versions?.length > 0 && (
              <div className="version-chips">
                {q.versions.map(v => {
                  const icon = v.state === 'draft' ? '📝' : (v.state === 'archived' ? '📦' : '✅');
                  return (
                    <button key={v.id} className='btn btn-secondary btn-sm' onClick={() => onSelectVersion(v.id)} title={`Abrir v${v.number}`}>
                      v{v.number} {icon} ({v.sections})
                    </button>
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
