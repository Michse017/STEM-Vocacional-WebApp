import React, { useState } from 'react';
import { Btn } from './ui/Btn';
import { QuestionBlock } from './QuestionBlock';

export function SectionBlock({ section, isDraft, busy=false, canMoveUp, canMoveDown, onMoveUp, onMoveDown, onPatch, onDelete, onAddQuestion, onAddQuestionWithOptions, onPatchQuestion, onDeleteQuestion, onAddOption, onPatchOption, onDeleteOption, onReorderQuestions, onInsertIcfesPackage, onReorderAllQuestions, allCodes = [] }) {
  const [expanded, setExpanded] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(section.title);
  // type-first wizard
  const [newQ, setNewQ] = useState({ code: '', text: '', type: 'text', required: true, validation_rules: null });
  const [choiceOpts, setChoiceOpts] = useState([{ value: '', label: '' }]);
  const isChoice = newQ.type === 'single_choice' || newQ.type === 'multi_choice';
  const isDate = newQ.type === 'date';
  const [submitting, setSubmitting] = useState(false);
  const slugify = (s) => (s || '').toString().toLowerCase().trim()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9_\-\.]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const suggestedCode = newQ.text ? slugify(newQ.text).slice(0, 40) : '';
  const isValidCode = (code) => /^[a-z0-9_\-\.]{1,50}$/.test(code);
  const isUnique = (code) => code && !allCodes.includes(code);
  const canSubmit = newQ.text.trim().length > 0 && isValidCode(newQ.code || suggestedCode) && isUnique((newQ.code || suggestedCode));

  const saveTitle = () => { onPatch(section.id, { title: titleVal }); setEditingTitle(false); };
  const addQuestion = async (e) => {
    e.preventDefault();
    if (!newQ.text.trim()) return;
    if (!newQ.code) {
      // auto-suggest code if empty
      const auto = suggestedCode || `q_${Date.now()}`;
      setNewQ(q => ({ ...q, code: auto }));
    }
    const finalCode = newQ.code?.trim() || suggestedCode;
    if (!isValidCode(finalCode)) { alert('El código debe usar sólo minúsculas, números, guiones y guiones bajos (máx 50).'); return; }
    if (!isUnique(finalCode)) { alert('Ese código ya existe en esta versión. Cambia el código.'); return; }
    // If DOB special type was chosen, ensure type=date and min_age rule embedded
    setSubmitting(true);
    let payload = { ...newQ, code: finalCode };
    if (payload.type === 'dob_14') {
      payload = { ...payload, type: 'date', validation_rules: { min_age_years: 14 } };
    }
    // Sanear validation_rules numéricos (min, max, step) antes de enviar
    if (payload.validation_rules) {
      const nr = { ...payload.validation_rules };
      const toNum = (x) => {
        if (x === '' || x === undefined || x === null) return undefined;
        if (typeof x === 'number') return x;
        const n = parseFloat(String(x).replace(',', '.'));
        return Number.isFinite(n) ? n : undefined;
      };
      if (Object.prototype.hasOwnProperty.call(nr, 'min')) nr.min = toNum(nr.min);
      if (Object.prototype.hasOwnProperty.call(nr, 'max')) nr.max = toNum(nr.max);
      if (Object.prototype.hasOwnProperty.call(nr, 'step')) nr.step = toNum(nr.step);
      payload.validation_rules = nr;
    }
    if (isChoice) {
      const filtered = (choiceOpts || []).map(o => ({ value: (o.value||'').trim(), label: (o.label||'').trim() })).filter(o => o.value && o.label);
      if (filtered.length === 0) {
        // crear sin opciones si no se proveen
        await onAddQuestion(section.id, payload);
      } else {
        await onAddQuestionWithOptions(section.id, payload, filtered);
      }
    } else {
      await onAddQuestion(section.id, payload);
    }
    setNewQ({ code: '', text: '', type: 'text', required: true, validation_rules: null });
    setChoiceOpts([{ value: '', label: '' }]);
    setSubmitting(false);
  };

  return (
    <div style={{ border: '1px solid #d5dae2', borderRadius: 6, padding: 10, marginBottom: 10, background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Btn variant='secondary' onClick={() => setExpanded(x => !x)} disabled={busy}>{expanded ? '−' : '+'}</Btn>
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
            <Btn variant='secondary' onClick={onMoveUp} disabled={!canMoveUp || busy} title='Subir sección'>↑</Btn>
            <Btn variant='secondary' onClick={onMoveDown} disabled={!canMoveDown || busy} title='Bajar sección'>↓</Btn>
            <Btn variant='secondary' onClick={() => setEditingTitle(e => !e)} disabled={busy}>{editingTitle ? 'Cancelar' : 'Editar'}</Btn>
            <Btn variant='danger' onClick={() => onDelete(section.id)} disabled={busy}>Eliminar</Btn>
          </div>
        )}
      </div>
      {expanded && (
        <div style={{ marginTop: 10 }}>
     <div onDragOver={e => { if (isDraft && !busy) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; } }}
               onDrop={e => {
       if (!isDraft || busy) return;
                 const draggedId = Number(e.dataTransfer.getData('text/plain'));
                 if (!draggedId) return;
                 const list = [...section.questions].sort((a,b) => a.order - b.order || a.id - b.id);
                 const fromIdx = list.findIndex(x => x.id === draggedId);
                 // Drop at end for simplicidad (podemos mejorar a posiciones precisas más adelante)
                 if (fromIdx >= 0) {
                   const [moved] = list.splice(fromIdx, 1);
                   list.push(moved);
                   const orderedIds = list.map(x => x.id);
                   onReorderAllQuestions?.(orderedIds);
                 }
               }}>
          {[...section.questions].sort((a,b) => a.order - b.order || a.id - b.id).map((q, idx, arr) => (
            <QuestionBlock key={q.id} question={q} isDraft={isDraft}
              canMoveUp={idx > 0} canMoveDown={idx < arr.length - 1}
              onMoveUp={() => onReorderQuestions?.(q.id, 'up')}
              onMoveDown={() => onReorderQuestions?.(q.id, 'down')}
              onPatch={onPatchQuestion} onDelete={onDeleteQuestion}
              onAddOption={onAddOption} onPatchOption={onPatchOption} onDeleteOption={onDeleteOption}
              section={section}
              busy={busy}
        />
          ))}
      </div>
          {isDraft && (
            <form onSubmit={addQuestion} style={{ marginTop: 10, display: 'grid', gap: 8, border: '1px dashed #c0c8d3', padding: 10, borderRadius: 6 }}>
              <strong style={{ fontSize: 12 }}>Nueva pregunta</strong>
              <div style={{ display:'flex', gap: 8, alignItems:'center', flexWrap:'wrap' }}>
                <label style={{fontSize:12}}>Tipo</label>
                <select value={newQ.type} disabled={busy || submitting} onChange={async e => {
                  const v = e.target.value;
                  // If selecting ICFES package, trigger insertion and reset selector back to default
                  if (v === 'icfes_package') {
                    onInsertIcfesPackage?.();
                    // keep form as-is but reset type to text to avoid accidental submission
                    setNewQ(q => ({ ...q, type: 'text' }));
                    return;
                  }
                  // Templates with predefined options
                  if (v === 'template_sexo') {
                    setNewQ(q => ({ ...q, text: 'Sexo', type: 'single_choice', required: true }));
                    setChoiceOpts([
                      { value: 'Masculino', label: 'Masculino' },
                      { value: 'Femenino', label: 'Femenino' },
                      { value: 'Prefiero no responder', label: 'Prefiero no responder' },
                    ]);
                    return;
                  }
                  if (v === 'template_nivel_educativo') {
                    setNewQ(q => ({ ...q, text: 'Nivel educativo', type: 'single_choice', required: true }));
                    setChoiceOpts([
                      { value: 'Sin escolaridad', label: 'Sin escolaridad' },
                      { value: 'Primaria incompleta', label: 'Primaria incompleta' },
                      { value: 'Primaria completa', label: 'Primaria completa' },
                      { value: 'Secundaria incompleta', label: 'Secundaria incompleta' },
                      { value: 'Secundaria completa', label: 'Secundaria completa' },
                      { value: 'Técnica/Tecnológica', label: 'Técnica/Tecnológica' },
                      { value: 'Universitaria', label: 'Universitaria' },
                      { value: 'Posgrado', label: 'Posgrado' },
                    ]);
                    return;
                  }
                  if (v === 'template_ocupacion') {
                    setNewQ(q => ({ ...q, text: 'Ocupación', type: 'single_choice', required: true }));
                    setChoiceOpts([
                      { value: 'Empleado formal', label: 'Empleado formal' },
                      { value: 'Trabajador independiente', label: 'Trabajador independiente' },
                      { value: 'Desempleado', label: 'Desempleado' },
                      { value: 'Agricultor', label: 'Agricultor' },
                      { value: 'Ama de casa', label: 'Ama de casa' },
                      { value: 'Otro', label: 'Otro', is_other: true },
                    ]);
                    return;
                  }
                  if (v === 'template_discapacidad') {
                    setNewQ(q => ({ ...q, text: 'Condición de discapacidad', type: 'multi_choice', required: false }));
                    setChoiceOpts([
                      { value: 'Ninguna', label: 'Ninguna' },
                      { value: 'Física', label: 'Física' },
                      { value: 'Visual', label: 'Visual' },
                      { value: 'Auditiva', label: 'Auditiva' },
                      { value: 'Cognitiva', label: 'Cognitiva' },
                      { value: 'Otra', label: 'Otra', is_other: true },
                    ]);
                    return;
                  }
                  if (v === 'template_grupo_etnico') {
                    setNewQ(q => ({ ...q, text: 'Grupo étnico', type: 'single_choice', required: false }));
                    setChoiceOpts([
                      { value: 'Ninguno', label: 'Ninguno' },
                      { value: 'Afrodescendiente', label: 'Afrodescendiente' },
                      { value: 'Indígena', label: 'Indígena' },
                      { value: 'Raizal / Palenquero', label: 'Raizal / Palenquero' },
                      { value: 'Gitano (ROM)', label: 'Gitano (ROM)' },
                      { value: 'Otro', label: 'Otro', is_other: true },
                    ]);
                    return;
                  }
                  if (v === 'template_boolean_vf') {
                    setNewQ(q => ({ ...q, text: 'Verdadero / Falso', type: 'single_choice', required: true }));
                    setChoiceOpts([
                      { value: 'Verdadero', label: 'Verdadero' },
                      { value: 'Falso', label: 'Falso' },
                    ]);
                    return;
                  }
                  setNewQ(q => ({ ...q, type: v }));
                }}>
                  <option value='text'>Texto</option>
                  <option value='textarea'>Texto largo</option>
                  <option value='number'>Número</option>
                  <option value='date'>Fecha</option>
                  <option value='email'>Correo electrónico</option>
                  <option value='boolean'>Sí/No</option>
                  <option value='single_choice'>Opción única</option>
                  <option value='multi_choice'>Selección múltiple</option>
                  <option value='scale_1_5'>Escala 1-5</option>
                  <option value='dob_14'>Fecha de nacimiento (&gt;= 14 años)</option>
                  <option value='icfes_package'>Paquete ICFES…</option>
                  <optgroup label='Plantillas rápidas'>
                    <option value='template_sexo'>Sexo</option>
                    <option value='template_nivel_educativo'>Nivel educativo</option>
                    <option value='template_ocupacion'>Ocupación</option>
                    <option value='template_discapacidad'>Discapacidad</option>
                    <option value='template_grupo_etnico'>Grupo étnico</option>
                    <option value='template_boolean_vf'>Verdadero/Falso</option>
                  </optgroup>
                </select>
                <label style={{ fontSize: 12, display: 'flex', gap: 4, alignItems: 'center' }}>
                  <input type='checkbox' checked={newQ.required} onChange={e => setNewQ(q => ({ ...q, required: e.target.checked }))} /> Requerida
                </label>
                <Btn type='submit' disabled={!canSubmit || submitting || busy}>{submitting ? 'Agregando…' : 'Agregar'}</Btn>
              </div>
              <div style={{ display:'grid', gap:4 }}>
                <input placeholder='Código (ej: edad, grado, sexo)' value={newQ.code}
                       onChange={e => setNewQ(q => ({ ...q, code: e.target.value.toLowerCase() }))}
                       style={{ fontSize: 12, fontFamily: 'monospace', background:'#f8fafc', border:'1px solid #e2e8f0', padding:'6px 8px', borderRadius: 6 }} />
                <div style={{ fontSize: 11, color: '#4a5568' }}>
                  El código es el identificador único de la pregunta. Usa minúsculas, números, guion y guion_bajo.
                  {(!newQ.code && suggestedCode) && (
                    <>
                      {' '}Sugerido: <span style={{ fontFamily: 'monospace' }}>{suggestedCode}</span>
                    </>
                  )}
                </div>
                {newQ.code && !isValidCode(newQ.code) && (
                  <div style={{ fontSize: 11, color: '#b91c1c' }}>Formato inválido. Ejemplos válidos: edad, grado_11, correo-padre.</div>
                )}
                {newQ.code && isValidCode(newQ.code) && !isUnique(newQ.code) && (
                  <div style={{ fontSize: 11, color: '#b91c1c' }}>Este código ya existe en esta versión.</div>
                )}
              </div>
              <textarea placeholder='Texto de la pregunta' rows={2} value={newQ.text} onChange={e => setNewQ(q => ({ ...q, text: e.target.value }))} />
              {newQ.type === 'number' && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', padding: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6 }}>
                  <span style={{ fontSize: 12, color: '#475569' }}>Validación numérica</span>
                  <label style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                    Min:
                    <input
                      type='text'
                      placeholder='ej. 0'
                      value={newQ.validation_rules?.min ?? ''}
                      onChange={e => setNewQ(v => ({ ...v, validation_rules: { ...(v.validation_rules||{}), min: e.target.value } }))}
                      style={{ width: 80 }}
                    />
                  </label>
                  <label style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                    Max:
                    <input
                      type='text'
                      placeholder='ej. 5'
                      value={newQ.validation_rules?.max ?? ''}
                      onChange={e => setNewQ(v => ({ ...v, validation_rules: { ...(v.validation_rules||{}), max: e.target.value } }))}
                      style={{ width: 80 }}
                    />
                  </label>
                  <label style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      type='checkbox'
                      checked={!!newQ.validation_rules?.allow_decimal}
                      onChange={e => setNewQ(v => ({ ...v, validation_rules: { ...(v.validation_rules||{}), allow_decimal: e.target.checked } }))}
                    />
                    Permitir decimales
                  </label>
                  <label style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                    Step:
                    <input
                      type='text'
                      placeholder='ej. 0.1'
                      value={newQ.validation_rules?.step ?? ''}
                      onChange={e => setNewQ(v => ({ ...v, validation_rules: { ...(v.validation_rules||{}), step: e.target.value } }))}
                      style={{ width: 80 }}
                    />
                  </label>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    Ejemplos: Promedio 0–5 con decimales (min 0, max 5, decimales ON, step 0.1) · Estrato 1–6 entero (min 1, max 6, decimales OFF)
                  </div>
                </div>
              )}
              {isChoice && (
                <div style={{ display:'grid', gap:6 }}>
                  <strong style={{fontSize:12}}>Opciones</strong>
                  {(choiceOpts || []).map((op, idx) => (
                    <div key={idx} style={{display:'flex', gap:6, alignItems:'center', flexWrap:'wrap'}}>
                      <input placeholder='Valor' value={op.value} onChange={e => setChoiceOpts(prev => prev.map((p,i) => i===idx? { ...p, value: e.target.value }: p))} />
                      <input placeholder='Etiqueta' value={op.label} onChange={e => setChoiceOpts(prev => prev.map((p,i) => i===idx? { ...p, label: e.target.value }: p))} />
                      <Btn type='button' variant='secondary' onClick={() => setChoiceOpts(prev => prev.filter((_,i) => i!==idx))}>Quitar</Btn>
                    </div>
                  ))}
                  <Btn type='button' variant='secondary' onClick={() => setChoiceOpts(prev => [...prev, { value:'', label:'' }])}>Agregar opción</Btn>
                </div>
              )}
              {isDate && (
                <div style={{ display:'grid', gap:6 }}>
                  <strong style={{fontSize:12}}>Reglas de fecha (presets)</strong>
                  <label style={{fontSize:12}}>
                    <input type='checkbox' onChange={e => setNewQ(q => ({ ...q, validation_rules: { ...(q.validation_rules||{}), not_after_today: e.target.checked || undefined } }))} /> No después de hoy
                  </label>
                  <div style={{display:'flex', gap:8, alignItems:'center'}}>
                    <span style={{fontSize:12}}>Desde año</span>
                    <input type='number' placeholder='YYYY' onChange={e => setNewQ(q => ({ ...q, validation_rules: { ...(q.validation_rules||{}), min_year: e.target.value? Number(e.target.value): undefined } }))} style={{width:100}} />
                    <span style={{fontSize:12}}>Hasta año</span>
                    <input type='number' placeholder='YYYY' onChange={e => setNewQ(q => ({ ...q, validation_rules: { ...(q.validation_rules||{}), max_year: e.target.value? Number(e.target.value): undefined } }))} style={{width:100}} />
                  </div>
                  {section?.questions?.length > 0 && (
                    <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
                      <span style={{fontSize:12}}>No antes de</span>
                      <select onChange={e => setNewQ(q => ({ ...q, validation_rules: { ...(q.validation_rules||{}), not_before_code: e.target.value || undefined } }))}>
                        <option value=''>-- ninguna --</option>
                        {section.questions.map(q => (<option key={q.id} value={q.code}>{q.text?.slice(0,60) || q.code}</option>))}
                      </select>
                      <span style={{fontSize:12}}>No después de</span>
                      <select onChange={e => setNewQ(q => ({ ...q, validation_rules: { ...(q.validation_rules||{}), not_after_code: e.target.value || undefined } }))}>
                        <option value=''>-- ninguna --</option>
                        {section.questions.map(q => (<option key={q.id} value={q.code}>{q.text?.slice(0,60) || q.code}</option>))}
                      </select>
                    </div>
                  )}
                </div>
              )}
              {newQ.type === 'dob_14' && (
                <div style={{ fontSize: 12, color: '#4a5568' }}>
                  Se creará una pregunta de tipo Fecha con validación de edad mínima de 14 años respecto a la fecha actual.
                </div>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
}
