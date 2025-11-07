import React, { useState } from 'react';
import { Btn } from './ui/Btn';
import { OptionRow } from './OptionRow';
import { api } from '../api';

export function QuestionBlock({ question, isDraft, canMoveUp, canMoveDown, onMoveUp, onMoveDown, onPatch, onDelete, onAddOption, onPatchOption, onDeleteOption, section, busy=false }) {
  const [editing, setEditing] = useState(false);
  const [editVals, setEditVals] = useState({ code: question.code, text: question.text, required: question.required, type: question.type, validation_rules: question.validation_rules || null, visible_if: question.visible_if || null });
  const [addingOption, setAddingOption] = useState(false);
  const [newOpt, setNewOpt] = useState({ value: '', label: '', is_other: false });
  const [collapsed, setCollapsed] = useState(false);
  const [saving, setSaving] = useState(false);
  // If the question appears to be a standard template (by its code), lock the type and advanced editors
  const isTemplateTypeLocked = [
    'Sexo','Nivel educativo','Ocupación','Condición de discapacidad','Grupo étnico','Verdadero / Falso'
  ].includes(question.text) || ['template_sexo','template_nivel_educativo','template_ocupacion','template_discapacidad','template_grupo_etnico','template_boolean_vf'].some(k => (question.code||'').includes(k));

  const save = async () => {
    try {
      setSaving(true);
      // Sanear números en validation_rules (min, max, step)
      const v = JSON.parse(JSON.stringify(editVals || {}));
      if (v && v.validation_rules) {
        const nr = v.validation_rules;
        const toNum = (x) => {
          if (x === '' || x === undefined || x === null) return undefined;
          if (typeof x === 'number') return x;
          const n = parseFloat(String(x).replace(',', '.'));
          return Number.isFinite(n) ? n : undefined;
        };
        if (Object.prototype.hasOwnProperty.call(nr, 'min')) nr.min = toNum(nr.min);
        if (Object.prototype.hasOwnProperty.call(nr, 'max')) nr.max = toNum(nr.max);
        if (Object.prototype.hasOwnProperty.call(nr, 'step')) nr.step = toNum(nr.step);
      }
      await onPatch(question.id, v);
      setEditing(false);
    } finally { setSaving(false); }
  };
  const addOption = (e) => {
    e.preventDefault();
    if (!newOpt.value.trim() || !newOpt.label.trim()) return;
    onAddOption(question.id, newOpt); setNewOpt({ value: '', label: '' }); setAddingOption(false);
  };

  const reorderOptions = async (optionId, direction) => {
    const opts = [...(question.options || [])].sort((a,b) => a.order - b.order || a.id - b.id);
    const idx = opts.findIndex(o => o.id === optionId);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= opts.length) return;
    const a = opts[idx];
    const b = opts[targetIdx];
    try {
      await Promise.all([
        api(`/admin/options/${a.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: b.order }) }),
        api(`/admin/options/${b.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: a.order }) })
      ]);
      // Delegate reload to parent via patch noop to keep it simple
      onPatch(question.id, {});
    } catch (e) {
      alert(e.message || 'No se pudo reordenar la opción');
    }
  };

  const toggleOther = async (opt) => {
    try {
      const willBeOther = !opt.is_other;
      await onPatchOption(opt.id, { is_other: willBeOther });
    } catch (e) { alert(e.message || 'No se pudo actualizar la opción'); }
  };

  return (
    <div style={{ border: '1px solid #e0e4ea', borderRadius: 4, padding: 8, marginBottom: 8, background: '#fdfdfe' }} draggable={isDraft} onDragStart={(e) => {
      e.dataTransfer.setData('text/plain', String(question.id));
      e.dataTransfer.effectAllowed = 'move';
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <button className='btn btn-secondary btn-sm' onClick={() => setCollapsed(c => !c)} title='Mostrar/Ocultar' style={{marginRight:6}} disabled={busy}>{collapsed ? '+' : '−'}</button>
        {editing ? (
          <input value={editVals.code} onChange={e => setEditVals(v => ({ ...v, code: e.target.value }))} style={{ fontSize: 12, fontFamily: 'monospace', background: '#eef2f8', border: '1px solid #ccd', padding: '2px 4px', borderRadius: 4, width: 140 }} />
        ) : (
          <span style={{ fontSize: 12, fontFamily: 'monospace', background: '#eef2f8', padding: '2px 4px', borderRadius: 4 }}>{question.code}</span>
        )}
        {isDraft && (
          <div style={{ display: 'flex', gap: 4 }}>
            <Btn variant='secondary' onClick={onMoveUp} disabled={!canMoveUp || busy} title='Subir pregunta'>↑</Btn>
            <Btn variant='secondary' onClick={onMoveDown} disabled={!canMoveDown || busy} title='Bajar pregunta'>↓</Btn>
            <Btn variant='secondary' onClick={() => setEditing(e => !e)} disabled={busy}>{editing ? 'Cancelar' : 'Editar'}</Btn>
            <Btn variant='danger' onClick={() => onDelete(question.id)} disabled={busy}>Eliminar</Btn>
          </div>
        )}
      </div>
      {!collapsed && (editing ? (
        <div style={{ marginTop: 6, display: 'grid', gap: 6 }}>
          <textarea rows={2} value={editVals.text} onChange={e => setEditVals(v => ({ ...v, text: e.target.value }))} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={editVals.type} disabled={isTemplateTypeLocked || busy} onChange={e => setEditVals(v => ({ ...v, type: e.target.value }))}>
              <option value='text'>Texto</option>
              <option value='textarea'>Texto largo</option>
              <option value='number'>Número</option>
              <option value='date'>Fecha</option>
              <option value='email'>Correo electrónico</option>
              <option value='boolean'>Sí/No</option>
              <option value='single_choice'>Opción única</option>
              <option value='multi_choice'>Selección múltiple</option>
              <option value='scale_1_5'>Escala 1-5</option>
            </select>
            <label style={{ fontSize: 12, display: 'flex', gap: 4 }}>
              <input type='checkbox' checked={editVals.required} onChange={e => setEditVals(v => ({ ...v, required: e.target.checked }))} /> Requerida
            </label>
            <Btn onClick={save} disabled={saving || busy}>{saving ? 'Guardando…' : 'Guardar'}</Btn>
          </div>
          {editVals.type === 'number' && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', padding: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6 }}>
              <span style={{ fontSize: 12, color: '#475569' }}>Validación numérica</span>
              <label style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                Min:
                <input
                  type='text'
                  placeholder='ej. 0'
                  value={editVals.validation_rules?.min ?? ''}
                  onChange={e => setEditVals(v => ({ ...v, validation_rules: { ...(v.validation_rules||{}), min: e.target.value === '' ? undefined : Number(e.target.value) } }))}
                  style={{ width: 80 }}
                />
              </label>
              <label style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                Max:
                <input
                  type='text'
                  placeholder='ej. 5'
                  value={editVals.validation_rules?.max ?? ''}
                  onChange={e => setEditVals(v => ({ ...v, validation_rules: { ...(v.validation_rules||{}), max: e.target.value === '' ? undefined : Number(e.target.value) } }))}
                  style={{ width: 80 }}
                />
              </label>
              <label style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type='checkbox'
                  checked={!!editVals.validation_rules?.allow_decimal}
                  onChange={e => setEditVals(v => ({ ...v, validation_rules: { ...(v.validation_rules||{}), allow_decimal: e.target.checked } }))}
                />
                Permitir decimales
              </label>
              <label style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                Step:
                <input
                  type='text'
                  placeholder='ej. 0.1'
                  value={editVals.validation_rules?.step ?? ''}
                  onChange={e => setEditVals(v => ({ ...v, validation_rules: { ...(v.validation_rules||{}), step: e.target.value === '' ? undefined : e.target.value } }))}
                  style={{ width: 80 }}
                />
              </label>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                Ejemplos: Promedio 0–5 con decimales (min 0, max 5, decimales ON, step 0.1) · Estrato 1–6 entero (min 1, max 6, decimales OFF)
              </div>
            </div>
          )}
          {/* Advanced editors ocultos temporalmente para simplificar la edición */}
        </div>
      ) : (
        <p style={{ fontSize: 13, margin: '6px 0' }}>{question.text}</p>
      ))}
      {['single_choice', 'multi_choice'].includes(question.type) && (
        <div style={{ marginTop: 4 }}>
          <strong style={{ fontSize: 11 }}>Opciones</strong>
            <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0', display: 'grid', gap: 4 }}>
              {[...(question.options || [])].sort((a,b) => a.order - b.order || a.id - b.id).map((o, idx, arr) => (
                <OptionRow key={o.id} option={o} isDraft={isDraft}
                  canMoveUp={idx > 0} canMoveDown={idx < arr.length - 1}
                  onMoveUp={() => reorderOptions(o.id, 'up')}
                  onMoveDown={() => reorderOptions(o.id, 'down')}
                  onPatch={(id, patch) => {
                    if (Object.prototype.hasOwnProperty.call(patch, 'is_other')) {
                      toggleOther(o);
                    } else {
                      onPatchOption(id, patch);
                    }
                  }}
                  onDelete={onDeleteOption} />
              ))}
            </ul>
            {isDraft && (question.options || []).some(o => o.is_other) && (
              <div style={{ fontSize: 12, color: '#4b5563' }}>
                Nota: La opción "Otro" se capturará inline en el formulario público; no se crean preguntas adicionales.
              </div>
            )}
          {isDraft && !addingOption && <Btn variant='secondary' onClick={() => setAddingOption(true)} disabled={busy}>Agregar opción</Btn>}
          {isDraft && addingOption && (
            <form onSubmit={addOption} style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <input placeholder='Valor' value={newOpt.value} onChange={e => setNewOpt(o => ({ ...o, value: e.target.value }))} />
              <input placeholder='Etiqueta' value={newOpt.label} onChange={e => setNewOpt(o => ({ ...o, label: e.target.value }))} />
              <label style={{ fontSize: 12, display: 'flex', gap: 4, alignItems: 'center' }}>
                <input type='checkbox' checked={!!newOpt.is_other} onChange={e => setNewOpt(o => ({ ...o, is_other: e.target.checked }))} /> Opción "Otro"
              </label>
              <Btn type='submit' disabled={busy}>Guardar</Btn>
              <Btn type='button' variant='secondary' onClick={() => { setAddingOption(false); setNewOpt({ value: '', label: '' }); }} disabled={busy}>Cancelar</Btn>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
