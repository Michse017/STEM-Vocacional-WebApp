import React, { useState } from 'react';
import { Btn } from './ui/Btn';
import { OptionRow } from './OptionRow';

export function QuestionBlock({ question, isDraft, onPatch, onDelete, onAddOption, onPatchOption, onDeleteOption }) {
  const [editing, setEditing] = useState(false);
  const [editVals, setEditVals] = useState({ code: question.code, text: question.text, required: question.required, type: question.type });
  const [addingOption, setAddingOption] = useState(false);
  const [newOpt, setNewOpt] = useState({ value: '', label: '' });

  const save = () => { onPatch(question.id, editVals); setEditing(false); };
  const addOption = (e) => {
    e.preventDefault();
    if (!newOpt.value.trim() || !newOpt.label.trim()) return;
    onAddOption(question.id, newOpt); setNewOpt({ value: '', label: '' }); setAddingOption(false);
  };

  return (
    <div style={{ border: '1px solid #e0e4ea', borderRadius: 4, padding: 8, marginBottom: 8, background: '#fdfdfe' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {editing ? (
          <input value={editVals.code} onChange={e => setEditVals(v => ({ ...v, code: e.target.value }))} style={{ fontSize: 12, fontFamily: 'monospace', background: '#eef2f8', border: '1px solid #ccd', padding: '2px 4px', borderRadius: 4, width: 140 }} />
        ) : (
          <span style={{ fontSize: 12, fontFamily: 'monospace', background: '#eef2f8', padding: '2px 4px', borderRadius: 4 }}>{question.code}</span>
        )}
        {isDraft && (
          <div style={{ display: 'flex', gap: 4 }}>
            <Btn variant='secondary' onClick={() => setEditing(e => !e)}>{editing ? 'Cancelar' : 'Editar'}</Btn>
            <Btn variant='danger' onClick={() => onDelete(question.id)}>Eliminar</Btn>
          </div>
        )}
      </div>
      {editing ? (
        <div style={{ marginTop: 6, display: 'grid', gap: 6 }}>
          <textarea rows={2} value={editVals.text} onChange={e => setEditVals(v => ({ ...v, text: e.target.value }))} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={editVals.type} onChange={e => setEditVals(v => ({ ...v, type: e.target.value }))}>
              <option value='text'>Texto</option>
              <option value='textarea'>Texto largo</option>
              <option value='number'>Número</option>
              <option value='date'>Fecha</option>
              <option value='boolean'>Sí/No</option>
              <option value='single_choice'>Opción única</option>
              <option value='multi_choice'>Selección múltiple</option>
              <option value='scale_1_5'>Escala 1-5</option>
            </select>
            <label style={{ fontSize: 12, display: 'flex', gap: 4 }}>
              <input type='checkbox' checked={editVals.required} onChange={e => setEditVals(v => ({ ...v, required: e.target.checked }))} /> Requerida
            </label>
            <Btn onClick={save}>Guardar</Btn>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: 13, margin: '6px 0' }}>{question.text}</p>
      )}
      {['single_choice', 'multi_choice'].includes(question.type) && (
        <div style={{ marginTop: 4 }}>
          <strong style={{ fontSize: 11 }}>Opciones</strong>
            <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0', display: 'grid', gap: 4 }}>
              {question.options.map(o => (
                <OptionRow key={o.id} option={o} isDraft={isDraft} onPatch={onPatchOption} onDelete={onDeleteOption} />
              ))}
            </ul>
          {isDraft && !addingOption && <Btn variant='secondary' onClick={() => setAddingOption(true)}>Agregar opción</Btn>}
          {isDraft && addingOption && (
            <form onSubmit={addOption} style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <input placeholder='Valor' value={newOpt.value} onChange={e => setNewOpt(o => ({ ...o, value: e.target.value }))} />
              <input placeholder='Etiqueta' value={newOpt.label} onChange={e => setNewOpt(o => ({ ...o, label: e.target.value }))} />
              <Btn type='submit'>Guardar</Btn>
              <Btn type='button' variant='secondary' onClick={() => { setAddingOption(false); setNewOpt({ value: '', label: '' }); }}>Cancelar</Btn>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
