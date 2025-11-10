import React, { useState } from 'react';
import { api } from '../api';

export function UsersPanel() {
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  // API_BASE y cabeceras se gestionan en api()

  const createUser = async (e) => {
    e.preventDefault();
    setMsg(''); setErr('');
    const code = (codigo || '').trim();
    if (!code) { setErr('Ingresa un código de estudiante.'); return; }
    setLoading(true);
    try {
      // Usar endpoint admin dedicado para creación idempotente
      const data = await api('/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ codigo_estudiante: code }) });
      setMsg(`Usuario ${data.codigo_estudiante} listo. ID: ${data.id_usuario}`);
      setCodigo('');
    } catch (e) {
      setErr(e.message || 'No se pudo crear/validar el usuario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ margin: 0, marginBottom: '.5rem' }}>Usuarios</h2>
      <form onSubmit={createUser} style={{ display: 'grid', gap: 8 }}>
        <label style={{ fontWeight: 600 }}>Agregar usuario por código</label>
        <input className="form-control" placeholder="Ej: A00123456" value={codigo} onChange={e=>setCodigo(e.target.value)} disabled={loading} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary btn-sm" type="submit" disabled={loading}>Guardar</button>
          <button className="btn btn-secondary btn-sm" type="button" onClick={()=>{setCodigo(''); setMsg(''); setErr('');}} disabled={loading}>Limpiar</button>
        </div>
        {msg && <div className="alert alert-success">{msg}</div>}
        {err && <div className="alert alert-error">{err}</div>}
      </form>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>El ID se genera automáticamente al crear el usuario (POST /api/admin/users).</p>
    </div>
  );
}
