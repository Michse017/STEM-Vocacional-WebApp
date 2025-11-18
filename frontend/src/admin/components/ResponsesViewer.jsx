import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { api, recomputeVersionMl } from '../api';

export function ResponsesViewer({ versionId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState('');
  const [userCode, setUserCode] = useState('');
  const [columns, setColumns] = useState([]); // question codes in order
  const [baseColumns, setBaseColumns] = useState(["response_id","assignment_id","user_code","status","started_at","submitted_at","finalized_at","last_activity_at","ml_prob","ml_decision","ml_label","ml_status","ml_reason"]);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [recLoading, setRecLoading] = useState(false);
  const [recOnlyFinalized, setRecOnlyFinalized] = useState(false);
  const [recLimit, setRecLimit] = useState('');

  // Load question list for the version
  useEffect(() => {
    let ignore = false;
    async function loadColumns() {
      try {
        setError(null);
        const d = await api(`/admin/versions/${versionId}/questions`);
        if (ignore) return;
        setColumns((d?.items || []).map(x => x.code));
      } catch (e) {
        if (ignore) return;
        setError(e.message);
      }
    }
    if (versionId) { loadColumns(); }
    return () => { ignore = true; };
  }, [versionId]);

  // Load rows with filters
  const load = useCallback(async (nextPage = 1) => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(nextPage));
      params.set('page_size', String(pageSize));
      if (userCode.trim()) params.set('user_code', userCode.trim());
      if (status) params.set('status', status);
      const d = await api(`/admin/versions/${versionId}/responses/wide?` + params.toString());
      setRows(d?.items || []);
      setBaseColumns(d?.base_columns || []);
      setColumns(d?.question_codes || []);
      setTotal(d?.total || 0);
      setPage(nextPage);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [versionId, pageSize, status, userCode]);

  useEffect(() => { if (versionId) load(1); }, [versionId, pageSize, status, load]);

  const allColumns = useMemo(() => [...baseColumns, ...columns], [baseColumns, columns]);

  // CSV export (base + dynamic question codes)
  const exportCsv = () => {
    if (!rows.length) return;
    const header = allColumns;
    const lines = [header.join(',')];
    rows.forEach(r => {
      const cols = header.map(c => {
        const v = r[c];
        if (Array.isArray(v)) return '"' + v.join('|').replace(/"/g,'""') + '"';
        if (v === null || v === undefined) return '';
        const s = String(v);
        if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g,'""') + '"';
        return s;
      });
      lines.push(cols.join(','));
    });
    const blob = new Blob([lines.join('\n')], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `version_${versionId}_responses.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const triggerRecompute = async (dryRun = false) => {
    if (!versionId) return;
    const limitNum = recLimit.trim() ? parseInt(recLimit.trim(), 10) : undefined;
    const msg = dryRun
      ? `¿Simular recomputo ML para la versión ${versionId}?\nSolo finalizados: ${recOnlyFinalized ? 'sí' : 'no'}${limitNum ? `\nLímite: ${limitNum}` : ''}`
      : `¿Recomputar ML para la versión ${versionId}?\nSolo finalizados: ${recOnlyFinalized ? 'sí' : 'no'}${limitNum ? `\nLímite: ${limitNum}` : ''}`;
    if (!window.confirm(msg)) return;
    setRecLoading(true);
    try {
      const res = await recomputeVersionMl(versionId, { onlyFinalized: recOnlyFinalized, limit: Number.isFinite(limitNum) ? limitNum : null, dryRun });
      const p = res?.processed ?? 0; const ok = res?.ok ?? 0;
      alert(`${dryRun ? 'Simulado' : 'Listo'}: procesados=${p}, ok=${ok}${res?.dry_run ? ' (dry-run)' : ''}`);
      if (!dryRun) await load(1);
    } catch (e) {
      alert(`Error: ${e.message || e}`);
    } finally {
      setRecLoading(false);
    }
  };

  return (
    <div style={{ display:'grid', gap: 8 }}>
      <div style={{ display:'flex', gap: 8, alignItems:'center', flexWrap:'wrap' }}>
        <strong>Respuestas</strong>
        <div style={{ marginLeft: 'auto', display:'flex', gap: 6, alignItems:'center', flexWrap:'wrap' }}>
          <input className='form-control' placeholder='Filtrar por código de usuario' value={userCode} onChange={e => setUserCode(e.target.value)} style={{ width: 220 }} />
          <select className='form-control' value={status} onChange={e => setStatus(e.target.value)}>
            <option value=''>Todos</option>
            <option value='in_progress'>En progreso</option>
            <option value='submitted'>Enviado</option>
            <option value='finalized'>Finalizado</option>
          </select>
          <select className='form-control' value={pageSize} onChange={e => setPageSize(parseInt(e.target.value)||20)}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <button className='btn btn-secondary btn-sm' onClick={() => load(1)} disabled={loading}>Aplicar</button>
          <div style={{ width:1, height:22, background:'#e2e8f0' }} />
          <button className='btn btn-secondary btn-sm' onClick={exportCsv} disabled={loading || !rows.length}>Exportar CSV</button>
          <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
            <input type='checkbox' checked={recOnlyFinalized} onChange={e => setRecOnlyFinalized(e.target.checked)} /> Sólo finalizados
          </label>
          <input className='form-control' style={{ width:100 }} placeholder='Límite' value={recLimit} onChange={e => setRecLimit(e.target.value)} />
          <button className='btn btn-warning btn-sm' onClick={() => triggerRecompute(true)} disabled={recLoading}>Simular ML</button>
          <button className='btn btn-primary btn-sm' onClick={() => triggerRecompute(false)} disabled={recLoading}>Recomputar ML</button>
        </div>
      </div>
      {error && <div style={{ color:'crimson' }}>Error: {String(error)}</div>}
      <div style={{ overflow: 'auto', border:'1px solid #e2e8f0', borderRadius: 8 }}>
        <table className='table' style={{ minWidth: 900 }}>
          <thead>
            <tr>
              {allColumns.map(col => (
                <th key={col} style={{ position:'sticky', top:0, background:'#f8fafc', zIndex:1 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={allColumns.length} style={{ textAlign:'center' }}>Cargando...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={allColumns.length} style={{ textAlign:'center' }}>Sin resultados</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.response_id}>
                  {allColumns.map(c => (
                    <td key={c}>
                      {(() => {
                        const v = r[c];
                        if (Array.isArray(v)) return v.join(', ');
                        if (c === 'ml_prob' && typeof v === 'number') return (v*100).toFixed(1)+'%';
                        if (c === 'ml_decision') return v === true ? 'true' : (v === false ? 'false' : '');
                        return v === undefined || v === null ? '' : String(v);
                      })()}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
        <span style={{ fontSize:12, color:'#555' }}>{total} resultados</span>
        <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
          <button className='btn btn-secondary btn-sm' onClick={() => load(Math.max(1, page-1))} disabled={loading || page <= 1}>Prev</button>
          <span style={{ alignSelf:'center' }}>Página {page} / {totalPages}</span>
          <button className='btn btn-secondary btn-sm' onClick={() => load(Math.min(totalPages, page+1))} disabled={loading || page >= totalPages}>Next</button>
        </div>
      </div>
    </div>
  );
}
