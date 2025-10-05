import React, { useState, useEffect } from 'react';
import { api } from './api';
import { Link } from 'react-router-dom';

export default function AdminLogin({ onLoggedIn }) {
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If there's already a token, try to fetch profile
    (async () => {
      try {
        const me = await api('/auth/admin/me');
        if (me && me.id) {
          onLoggedIn?.(me);
        }
      } catch (_) {}
    })();
  }, [onLoggedIn]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api('/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, password })
      });
      if (res?.access_token) {
        try { localStorage.setItem('admin_token', res.access_token); } catch (_) {}
        onLoggedIn?.(res.admin);
      }
    } catch (err) {
      setError(err?.message || 'Login falló');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #f0fdf4 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '28rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '4rem',
              height: '4rem',
              background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 4px 12px rgba(0, 112, 243, 0.3)'
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-5.33 0-8 2.67-8 5v1h16v-1c0-2.33-2.67-5-8-5Z" fill="white" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Acceso Administrador</h2>
          <p style={{ color: 'var(--text-muted-light)', fontSize: '1rem' }}>
            Ingresa tus credenciales de administrador
          </p>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.5rem',
                color: 'var(--text-light)'
              }}
            >
              Usuario (código)
            </label>
            <input
              className="form-control"
              value={codigo}
              onChange={e => setCodigo(e.target.value)}
              required
              placeholder='ej: admin'
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.5rem',
                color: 'var(--text-light)'
              }}
            >
              Contraseña
            </label>
            <input
              className="form-control"
              type='password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="alert alert-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" />
                <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" />
              </svg>
              {error}
            </div>
          )}

          <button className='btn btn-primary' disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Ingresando...' : 'Entrar'}
          </button>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, fontSize: 14 }}>
            <Link className='btn btn-secondary' to='/login'>Soy estudiante</Link>
          </div>
        </form>

        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
          Consejo: Usa <code>python manage.py add-admin &lt;codigo&gt;</code> para crear tus credenciales.
        </p>
      </div>
    </div>
  );
}
