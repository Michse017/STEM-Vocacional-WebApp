import React, { useState } from 'react';
import { Btn } from './ui/Btn';

export function OptionRow({ option, isDraft, canMoveUp, canMoveDown, onMoveUp, onMoveDown, onPatch, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [vals, setVals] = useState({ value: option.value, label: option.label });
  const save = () => { onPatch(option.id, vals); setEditing(false); };
  return (
    <li style={{ border: '1px solid #dfe3ea', borderRadius: 4, padding: '4px 6px', background: '#fff' }}>
      {editing ? (
        <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <input value={vals.value} onChange={e => setVals(v => ({ ...v, value: e.target.value }))} style={{ width: 80 }} />
          <input value={vals.label} onChange={e => setVals(v => ({ ...v, label: e.target.value }))} style={{ width: 140 }} />
          <Btn onClick={save}>✓</Btn>
          <Btn variant='secondary' onClick={() => { setEditing(false); setVals({ value: option.value, label: option.label }); }}>✕</Btn>
        </span>
      ) : (
        <span style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>
          <code>{option.value}</code> – {option.label} {option.is_other ? <em style={{ color: '#6b7280' }}>(Otro)</em> : null}
          {isDraft && <>
            <Btn variant='secondary' onClick={onMoveUp} disabled={!canMoveUp} title='Subir opción'>↑</Btn>
            <Btn variant='secondary' onClick={onMoveDown} disabled={!canMoveDown} title='Bajar opción'>↓</Btn>
            <Btn variant='secondary' onClick={() => onPatch(option.id, { is_other: !option.is_other })} title='Marcar/Desmarcar como "Otro"'>Otro</Btn>
            <Btn variant='secondary' onClick={() => setEditing(true)}>Editar</Btn>
            <Btn variant='danger' onClick={() => onDelete(option.id)}>X</Btn>
          </>}
        </span>
      )}
    </li>
  );
}
