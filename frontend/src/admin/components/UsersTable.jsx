import React, { useEffect, useMemo, useState } from 'react';
import { listUsers, deleteUser } from '../api';

export function UsersTable() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState([]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil((total || 0) / pageSize)), [total, pageSize]);

  const load = async (nextPage = page) => {
    setLoading(true); setError('');
    try {
      const d = await listUsers({ page: nextPage, pageSize, q });
      setRows(d?.items || []);
      setTotal(d?.total || 0);
      setPage(nextPage);
    } catch (e) {
      setError(e.message || 'No se pudo cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [pageSize]);

  return (
    <div>
      <h2 className="admin-h2">Usuarios registrados</h2>
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom: 8, flexWrap:'wrap' }}>
        <input className='form-control' placeholder='Buscar por código o usuario' value={q} onChange={e=>setQ(e.target.value)} style={{ maxWidth: 280 }} />
        <select className='form-control' value={pageSize} onChange={e=>setPageSize(parseInt(e.target.value)||20)} style={{ width: 120 }}>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <button className='btn btn-secondary btn-sm' onClick={()=>load(1)} disabled={loading}>Aplicar</button>
        <div style={{ marginLeft:'auto', fontSize:12, color:'var(--text-muted)' }}>{total} resultados</div>
      </div>
      {error && <div className='alert alert-error'>{error}</div>}
      <div className='table-wrap'>
        <table className='table'>
          <thead>
            <tr>
              <th style={{ width: 90 }}>ID</th>
              <th style={{ minWidth: 160 }}>Código</th>
              <th style={{ minWidth: 160 }}>Usuario</th>
              <th style={{ minWidth: 200 }}>Creado</th>
              <th style={{ minWidth: 200 }}>Último acceso</th>
              <th style={{ width: 120 }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign:'center' }}>Cargando...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign:'center' }}>Sin resultados</td></tr>
            ) : (
              rows.map(r => (
                <tr key={r.id_usuario}>
                  <td>{r.id_usuario}</td>
                  <td><code>{r.codigo_estudiante}</code></td>
                  <td>{r.username || '—'}</td>
                  <td>{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</td>
                  <td>{r.last_login_at ? new Date(r.last_login_at).toLocaleString() : '—'}</td>
                  <td>
                    <button
                      className='btn btn-danger btn-sm'
                      disabled={loading}
                      onClick={async () => {
                        if (!window.confirm(`Eliminar usuario ${r.codigo_estudiante} y todos sus datos?`)) return;
                        setLoading(true); setError('');
                        try {
                          await deleteUser(r.id_usuario);
                          await load(1);
                        } catch (e) {
                          setError(e.message || 'No se pudo eliminar usuario');
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap: 8, marginTop: 8 }}>
        <button className='btn btn-secondary btn-sm' onClick={()=>load(Math.max(1, page-1))} disabled={loading || page<=1}>Prev</button>
        <span style={{ fontSize:12, color:'var(--text-muted)' }}>Página {page} / {totalPages}</span>
        <button className='btn btn-secondary btn-sm' onClick={()=>load(Math.min(totalPages, page+1))} disabled={loading || page>=totalPages}>Next</button>
      </div>
    </div>
  );
}
