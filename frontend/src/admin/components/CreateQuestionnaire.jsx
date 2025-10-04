import React, { useState } from 'react';
import { api } from '../api';

export function CreateQuestionnaire({ onCreated }) {
  const [form, setForm] = useState({ code: '', title: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState(null);
  const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    if (!form.code.trim() || !form.title.trim()) return setMsg('Código y título requeridos');
    setCreating(true); setMsg(null);
    try { await api('/admin/questionnaires', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); setMsg('Creado'); setForm({ code: '', title: '', description: '' }); onCreated(); }
    catch (e) { setMsg(e.message); }
    finally { setCreating(false); }
  };
  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
      <h2 className='admin-h2'>Crear nuevo</h2>
      <input className='form-control' placeholder='Código' name='code' value={form.code} onChange={onChange} disabled={creating} />
      <input className='form-control' placeholder='Título' name='title' value={form.title} onChange={onChange} disabled={creating} />
      <textarea className='form-control' placeholder='Descripción' name='description' rows={3} value={form.description} onChange={onChange} disabled={creating} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button className='btn btn-primary btn-sm' type='submit' disabled={creating}>Crear</button>
        <button className='btn btn-secondary btn-sm' type='button' disabled={creating} onClick={() => setForm({ code: '', title: '', description: '' })}>Limpiar</button>
      </div>
      {msg && <div className="alert alert-success">{msg}</div>}
    </form>
  );
}
