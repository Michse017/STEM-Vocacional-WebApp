import React, { useEffect, useMemo, useState } from 'react';
import { listQuestionnairesAdmin, listResponsesWide } from '../api';

// SUS scoring: odd (1,3,5,7,9) negative: contrib = answer - 1; even (2,4,6,8,10) positive: contrib = 5 - answer; score = sum * 2.5
function computeSusScore(row) {
  const vals = [];
  for (let i = 1; i <= 10; i++) {
    const v = row[`ux_q${i}`];
    if (typeof v !== 'number') return null; // incomplete
    vals.push(v);
  }
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const val = vals[i];
    if ((i % 2) === 0) { // odd index -> question number i+1 is 1,3,5,7,9
      sum += (val - 1); // negative worded
    } else {
      sum += (5 - val); // positive worded
    }
  }
  return parseFloat((sum * 2.5).toFixed(1));
}

export function UxSurveyResultsTable() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState([]);
  const [userFilter, setUserFilter] = useState('');
  const [versionId, setVersionId] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  // Discover published version of ux_survey
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await listQuestionnairesAdmin();
        const items = data?.items || [];
        const ux = items.find(q => q.code === 'ux_survey');
        if (ux) {
          const pub = (ux.versions || []).find(v => v.state === 'published');
          if (pub && mounted) setVersionId(pub.id);
        }
      } catch (e) {
        if (mounted) setError(e.message || 'No se pudo cargar cuestionarios');
      }
    })();
    return () => { mounted = false; };
  }, []);

  const load = async (nextPage = page) => {
    if (!versionId) return;
    setLoading(true); setError('');
    try {
      const data = await listResponsesWide(versionId, { page: nextPage, pageSize, userCode: userFilter.trim() });
      setRows(data?.items || []);
      setTotal(data?.total || 0);
      setPage(nextPage);
    } catch (e) {
      setError(e.message || 'No se pudo cargar respuestas de encuesta');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (versionId) load(1); /* eslint-disable-next-line */ }, [versionId, pageSize]);

  // Optional auto refresh each 30s
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => setRefreshTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, [autoRefresh]);
  useEffect(() => { if (autoRefresh && versionId) load(page); /* eslint-disable-line */ }, [refreshTick]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil((total || 0) / pageSize)), [total, pageSize]);

  const exportCsv = () => {
    const header = ['user_code','submitted_at','sus_score','ux_q1','ux_q2','ux_q3','ux_q4','ux_q5','ux_q6','ux_q7','ux_q8','ux_q9','ux_q10'];
    const lines = [header.join(',')];
    rows.forEach(r => {
      const sus = computeSusScore(r);
      const cols = [
        r.user_code,
        r.submitted_at || '',
        sus == null ? '' : sus,
        r.ux_q1 ?? '',
        r.ux_q2 ?? '',
        r.ux_q3 ?? '',
        r.ux_q4 ?? '',
        r.ux_q5 ?? '',
        r.ux_q6 ?? '',
        r.ux_q7 ?? '',
        r.ux_q8 ?? '',
        r.ux_q9 ?? '',
        r.ux_q10 ?? ''
      ];
      lines.push(cols.join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ux_survey_responses.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h2 className='admin-h2'>Encuesta de Satisfacción (SUS adaptada)</h2>
      {!versionId && !error && <p style={{ fontSize:12 }}>Buscando versión publicada de la encuesta...</p>}
      {error && <div className='alert alert-error'>{error}</div>}
      {versionId && (
        <>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:8 }}>
            <input className='form-control' style={{ maxWidth:220 }} placeholder='Filtrar por código' value={userFilter} onChange={e=>setUserFilter(e.target.value)} />
            <select className='form-control' value={pageSize} onChange={e=>setPageSize(parseInt(e.target.value)||50)} style={{ width:100 }}>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
            <button className='btn btn-secondary btn-sm' disabled={loading} onClick={()=>load(1)}>Aplicar</button>
            <button className='btn btn-secondary btn-sm' disabled={loading} onClick={()=>setAutoRefresh(a=>!a)}>{autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}</button>
            <button className='btn btn-secondary btn-sm' disabled={loading || rows.length===0} onClick={exportCsv}>Exportar CSV</button>
            <div style={{ marginLeft:'auto', fontSize:12, color:'var(--text-muted)' }}>{total} respuestas</div>
          </div>
          <div className='table-wrap'>
            <table className='table'>
              <thead>
                <tr>
                  <th style={{ minWidth:160 }}>Código</th>
                  <th style={{ minWidth:170 }}>Enviada</th>
                  <th style={{ width:110 }}>SUS</th>
                  {Array.from({ length: 10 }, (_, i) => <th key={i} style={{ width:60 }}>Q{i+1}</th>)}
                  <th style={{ minWidth:250 }}>Comentario</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={14} style={{ textAlign:'center' }}>Cargando...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={14} style={{ textAlign:'center' }}>Sin resultados</td></tr>
                ) : (
                  rows.map(r => {
                    const sus = computeSusScore(r);
                    return (
                      <tr key={r.response_id}>
                        <td><code>{r.user_code}</code></td>
                        <td>{r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '—'}</td>
                        <td>{sus == null ? '—' : sus}</td>
                        {Array.from({ length: 10 }, (_, i) => <td key={i}>{r[`ux_q${i+1}`] ?? '—'}</td>)}
                        <td>{r.ux_comment ? r.ux_comment : '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:8 }}>
            <button className='btn btn-secondary btn-sm' disabled={loading || page<=1} onClick={()=>load(page-1)}>Prev</button>
            <span style={{ fontSize:12, color:'var(--text-muted)' }}>Página {page} / {Math.max(1, Math.ceil(total / pageSize))}</span>
            <button className='btn btn-secondary btn-sm' disabled={loading || page>=Math.max(1, Math.ceil(total / pageSize))} onClick={()=>load(page+1)}>Next</button>
          </div>
        </>
      )}
      <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:8 }}>SUS calculado: suma transformada x2.5, rango 0-100.</p>
    </div>
  );
}
