import React, { useState } from 'react';
import { Btn } from './ui/Btn';
import { QuestionBlock } from './QuestionBlock';

export function SectionBlock({ section, isDraft, onPatch, onDelete, onAddQuestion, onPatchQuestion, onDeleteQuestion, onAddOption, onPatchOption, onDeleteOption }) {
  const [expanded, setExpanded] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(section.title);
  const [newQ, setNewQ] = useState({ code: '', text: '', type: 'text', required: true });

  const saveTitle = () => { onPatch(section.id, { title: titleVal }); setEditingTitle(false); };
  const addQuestion = (e) => {
    e.preventDefault();
    if (!newQ.code.trim() || !newQ.text.trim()) return;
    onAddQuestion(section.id, newQ);
    setNewQ({ code: '', text: '', type: 'text', required: true });
  };

  return (
    <div style={{ border: '1px solid #d5dae2', borderRadius: 6, padding: 10, marginBottom: 10, background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Btn variant='secondary' onClick={() => setExpanded(x => !x)}>{expanded ? '−' : '+'}</Btn>
          {editingTitle && isDraft ? (
            <span>
              <input value={titleVal} onChange={e => setTitleVal(e.target.value)} style={{ fontSize: 14 }} />
              <Btn onClick={saveTitle}>Guardar</Btn>
            </span>
          ) : (
            <strong style={{ fontSize: 14 }}>{section.title}</strong>
          )}
        </div>
        {isDraft && (
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn variant='secondary' onClick={() => setEditingTitle(e => !e)}>{editingTitle ? 'Cancelar' : 'Editar'}</Btn>
            <Btn variant='danger' onClick={() => onDelete(section.id)}>Eliminar</Btn>
          </div>
        )}
      </div>
      {expanded && (
        <div style={{ marginTop: 10 }}>
          {section.questions.map(q => (
            <QuestionBlock key={q.id} question={q} isDraft={isDraft} onPatch={onPatchQuestion} onDelete={onDeleteQuestion}
              onAddOption={onAddOption} onPatchOption={onPatchOption} onDeleteOption={onDeleteOption} />
          ))}
          {isDraft && (
            <form onSubmit={addQuestion} style={{ marginTop: 10, display: 'grid', gap: 6, border: '1px dashed #c0c8d3', padding: 8, borderRadius: 6 }}>
              <strong style={{ fontSize: 12 }}>Nueva pregunta</strong>
              <input placeholder='Código' value={newQ.code} onChange={e => setNewQ(q => ({ ...q, code: e.target.value }))} />
              <textarea placeholder='Texto' rows={2} value={newQ.text} onChange={e => setNewQ(q => ({ ...q, text: e.target.value }))} />
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <select value={newQ.type} onChange={e => setNewQ(q => ({ ...q, type: e.target.value }))}>
                  <option value='text'>Texto</option>
                  <option value='textarea'>Texto largo</option>
                  <option value='number'>Número</option>
                  <option value='date'>Fecha</option>
                  <option value='boolean'>Sí/No</option>
                  <option value='single_choice'>Opción única</option>
                  <option value='multi_choice'>Selección múltiple</option>
                  <option value='scale_1_5'>Escala 1-5</option>
                </select>
                <label style={{ fontSize: 12, display: 'flex', gap: 4, alignItems: 'center' }}>
                  <input type='checkbox' checked={newQ.required} onChange={e => setNewQ(q => ({ ...q, required: e.target.checked }))} /> Requerida
                </label>
                <Btn type='submit'>Agregar</Btn>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
