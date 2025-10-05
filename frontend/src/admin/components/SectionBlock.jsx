import React, { useState } from 'react';
import { Btn } from './ui/Btn';
import { QuestionBlock } from './QuestionBlock';

export function SectionBlock({ section, isDraft, canMoveUp, canMoveDown, onMoveUp, onMoveDown, onPatch, onDelete, onAddQuestion, onAddQuestionWithOptions, onPatchQuestion, onDeleteQuestion, onAddOption, onPatchOption, onDeleteOption, onReorderQuestions, onInsertIcfesPackage }) {
  const [expanded, setExpanded] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(section.title);
  const [newQ, setNewQ] = useState({ code: '', text: '', type: 'text', required: true, validation_rules: null });

  const saveTitle = () => { onPatch(section.id, { title: titleVal }); setEditingTitle(false); };
  const addQuestion = (e) => {
    e.preventDefault();
    if (!newQ.code.trim() || !newQ.text.trim()) return;
    // If DOB special type was chosen, ensure type=date and min_age rule embedded
    let payload = { ...newQ };
    if (payload.type === 'dob_14') {
      payload = { ...payload, type: 'date', validation_rules: { min_age_years: 14 } };
    }
    onAddQuestion(section.id, payload);
    setNewQ({ code: '', text: '', type: 'text', required: true, validation_rules: null });
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
            <Btn variant='secondary' onClick={onMoveUp} disabled={!canMoveUp} title='Subir sección'>↑</Btn>
            <Btn variant='secondary' onClick={onMoveDown} disabled={!canMoveDown} title='Bajar sección'>↓</Btn>
            <Btn variant='secondary' onClick={() => setEditingTitle(e => !e)}>{editingTitle ? 'Cancelar' : 'Editar'}</Btn>
            <Btn variant='danger' onClick={() => onDelete(section.id)}>Eliminar</Btn>
          </div>
        )}
      </div>
      {expanded && (
        <div style={{ marginTop: 10 }}>
          {[...section.questions].sort((a,b) => a.order - b.order || a.id - b.id).map((q, idx, arr) => (
            <QuestionBlock key={q.id} question={q} isDraft={isDraft}
              canMoveUp={idx > 0} canMoveDown={idx < arr.length - 1}
              onMoveUp={() => onReorderQuestions?.(q.id, 'up')}
              onMoveDown={() => onReorderQuestions?.(q.id, 'down')}
              onPatch={onPatchQuestion} onDelete={onDeleteQuestion}
              onAddOption={onAddOption} onPatchOption={onPatchOption} onDeleteOption={onDeleteOption}
              section={section}
              onCreateOtherCompanion={async (otherValue) => {
                // Avoid duplicate companion creation
                const companionCode = `otro_${q.code}`;
                const exists = section.questions.some(qq => qq.code === companionCode);
                if (exists) return;
                await onAddQuestion(section.id, {
                  code: companionCode,
                  text: 'Especifique (otro)',
                  type: 'text',
                  required: true,
                  visible_if: { code: q.code, equals: otherValue },
                  validation_rules: { minLength: 1, maxLength: 200 }
                });
              }} />
          ))}
          {isDraft && (
            <form onSubmit={addQuestion} style={{ marginTop: 10, display: 'grid', gap: 6, border: '1px dashed #c0c8d3', padding: 8, borderRadius: 6 }}>
              <strong style={{ fontSize: 12 }}>Nueva pregunta</strong>
              <input placeholder='Código' value={newQ.code} onChange={e => setNewQ(q => ({ ...q, code: e.target.value }))} />
              <textarea placeholder='Texto' rows={2} value={newQ.text} onChange={e => setNewQ(q => ({ ...q, text: e.target.value }))} />
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <select value={newQ.type} onChange={async e => {
                  const v = e.target.value;
                  // If selecting ICFES package, trigger insertion and reset selector back to default
                  if (v === 'icfes_package') {
                    onInsertIcfesPackage?.();
                    // keep form as-is but reset type to text to avoid accidental submission
                    setNewQ(q => ({ ...q, type: 'text' }));
                    return;
                  }
                  // Templates with predefined options
                  const mk = (code, text, type='single_choice', required=true) => ({ code, text, type, required });
                  if (v === 'template_sexo') {
                    await onAddQuestionWithOptions?.(section.id, mk('sexo', 'Sexo'), [
                      { value: 'Masculino', label: 'Masculino' },
                      { value: 'Femenino', label: 'Femenino' },
                      { value: 'Prefiero no responder', label: 'Prefiero no responder' },
                    ]);
                    setNewQ(q => ({ ...q, code: '', text: '', type: 'text' }));
                    return;
                  }
                  if (v === 'template_nivel_educativo') {
                    await onAddQuestionWithOptions?.(section.id, mk('nivel_educativo', 'Nivel educativo', 'single_choice'), [
                      { value: 'Sin escolaridad', label: 'Sin escolaridad' },
                      { value: 'Primaria incompleta', label: 'Primaria incompleta' },
                      { value: 'Primaria completa', label: 'Primaria completa' },
                      { value: 'Secundaria incompleta', label: 'Secundaria incompleta' },
                      { value: 'Secundaria completa', label: 'Secundaria completa' },
                      { value: 'Técnica/Tecnológica', label: 'Técnica/Tecnológica' },
                      { value: 'Universitaria', label: 'Universitaria' },
                      { value: 'Posgrado', label: 'Posgrado' },
                    ]);
                    setNewQ(q => ({ ...q, code: '', text: '', type: 'text' }));
                    return;
                  }
                  if (v === 'template_ocupacion') {
                    await onAddQuestionWithOptions?.(section.id, mk('ocupacion', 'Ocupación', 'single_choice'), [
                      { value: 'Empleado formal', label: 'Empleado formal' },
                      { value: 'Trabajador independiente', label: 'Trabajador independiente' },
                      { value: 'Desempleado', label: 'Desempleado' },
                      { value: 'Agricultor', label: 'Agricultor' },
                      { value: 'Ama de casa', label: 'Ama de casa' },
                      { value: 'Otro', label: 'Otro', is_other: true },
                    ]);
                    setNewQ(q => ({ ...q, code: '', text: '', type: 'text' }));
                    return;
                  }
                  if (v === 'template_discapacidad') {
                    await onAddQuestionWithOptions?.(section.id, mk('condicion_discapacidad', 'Condición de discapacidad', 'multi_choice', false), [
                      { value: 'Ninguna', label: 'Ninguna' },
                      { value: 'Física', label: 'Física' },
                      { value: 'Visual', label: 'Visual' },
                      { value: 'Auditiva', label: 'Auditiva' },
                      { value: 'Cognitiva', label: 'Cognitiva' },
                      { value: 'Otra', label: 'Otra', is_other: true },
                    ]);
                    setNewQ(q => ({ ...q, code: '', text: '', type: 'text' }));
                    return;
                  }
                  if (v === 'template_grupo_etnico') {
                    await onAddQuestionWithOptions?.(section.id, mk('grupo_etnico', 'Grupo étnico', 'single_choice', false), [
                      { value: 'Ninguno', label: 'Ninguno' },
                      { value: 'Afrodescendiente', label: 'Afrodescendiente' },
                      { value: 'Indígena', label: 'Indígena' },
                      { value: 'Raizal / Palenquero', label: 'Raizal / Palenquero' },
                      { value: 'Gitano (ROM)', label: 'Gitano (ROM)' },
                      { value: 'Otro', label: 'Otro', is_other: true },
                    ]);
                    setNewQ(q => ({ ...q, code: '', text: '', type: 'text' }));
                    return;
                  }
                  setNewQ(q => ({ ...q, type: v }));
                }}>
                  <option value='text'>Texto</option>
                  <option value='textarea'>Texto largo</option>
                  <option value='number'>Número</option>
                  <option value='date'>Fecha</option>
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
                  </optgroup>
                </select>
                <label style={{ fontSize: 12, display: 'flex', gap: 4, alignItems: 'center' }}>
                  <input type='checkbox' checked={newQ.required} onChange={e => setNewQ(q => ({ ...q, required: e.target.checked }))} /> Requerida
                </label>
                <Btn type='submit'>Agregar</Btn>
              </div>
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
