import React from 'react';

export function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'grid', placeItems:'center', zIndex:1000 }}>
      <div style={{ background:'#fff', width:'min(680px, 96vw)', borderRadius:12, boxShadow:'0 10px 30px rgba(0,0,0,0.2)', overflow:'hidden' }}>
        <div style={{ padding:'12px 14px', borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <strong>{title}</strong>
          <button className='btn btn-secondary btn-sm' onClick={onClose}>Cerrar</button>
        </div>
        <div style={{ padding:16 }}>
          {children}
        </div>
        {footer && (
          <div style={{ padding:12, borderTop:'1px solid #e2e8f0', background:'#f8fafc' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
