import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { SectionBlock } from './SectionBlock';

export function VersionEditor({ versionId, onClose, onRefreshList }) {
  const [version, setVersion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addingSec, setAddingSec] = useState(false);
  const [newSec, setNewSec] = useState({ title: '', description: '' });
  // reserved for future inline create pattern (removed unused state to satisfy lint)

  const load = async () => {
    setLoading(true); setError(null);
    try { const d = await api(`/admin/versions/${versionId}`); setVersion(d.version); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionId]);

  const isDraft = version?.status === 'draft';
  const isPublished = version?.status === 'published';
  const assignments = version?.assignment_count || 0;
  const isLatestPublished = !!version?.is_latest_published;
  const deleteVersion = async () => {
    if (!window.confirm('¿Eliminar esta versión (borrador)?')) return;
    try { await api(`/admin/versions/${versionId}`, { method: 'DELETE' }); onClose(); onRefreshList(); }
    catch (e) { setError(e.message); }
  };

  const unpublish = async () => {
    if (!window.confirm('¿Despublicar esta versión? Pasará a borrador y dejará de estar disponible públicamente.')) return;
    try {
      await api(`/admin/versions/${versionId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'draft' }) });
      await load();
      onRefreshList();
    } catch (e) { setError(e.message); }
  };

  const publish = async () => {
    if (!window.confirm('Publicar esta versión?')) return;
    try { await api(`/admin/versions/${versionId}/publish`, { method: 'POST' }); await load(); onRefreshList(); }
    catch (e) { alert(e.message); }
  };

  const toggleQuestionnaireStatus = async () => {
    if (!version?.questionnaire?.code) return;
    const target = version.questionnaire.status === 'active' ? 'inactive' : 'active';
    try {
      await api(`/admin/questionnaires/${encodeURIComponent(version.questionnaire.code)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: target })
      });
      await load();
      onRefreshList();
    } catch (e) { setError(e.message); }
  };

  const patchSection = async (id, patch) => { try { await api(`/admin/sections/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }); await load(); } catch (e) { alert(e.message); } };
  const deleteSection = async (id) => { if (!window.confirm('Eliminar sección?')) return; try { await api(`/admin/sections/${id}`, { method: 'DELETE' }); await load(); } catch (e) { alert(e.message); } };
  const addQuestion = async (sectionId, payload) => { try { await api(`/admin/sections/${sectionId}/questions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); await load(); } catch (e) { alert(e.message); } };
  const addQuestionWithOptions = async (sectionId, baseQuestion, options) => {
    try {
      const q = await api(`/admin/sections/${sectionId}/questions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(baseQuestion) });
      const qid = q?.question?.id;
      if (qid && Array.isArray(options) && options.length) {
        for (const op of options) {
          await api(`/admin/questions/${qid}/options`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(op) });
        }
      }
      // If there is an 'Otro' option flagged as is_other, create a companion text question with visible_if
      const hasOther = Array.isArray(options) && options.some(o => o.is_other);
      if (qid && hasOther) {
        const code = baseQuestion.code;
        await api(`/admin/sections/${sectionId}/questions`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: `otro_${code}`,
            text: `Especifique (otro)`,
            type: 'text',
            required: true,
            visible_if: { code, equals: 'Otro' },
            validation_rules: { minLength: 1, maxLength: 200 }
          })
        });
      }
      await load();
    } catch (e) { alert(e.message || 'No se pudo crear la pregunta con opciones'); }
  };
  const patchQuestion = async (id, patch) => { try { await api(`/admin/questions/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }); await load(); } catch (e) { alert(e.message); } };
  const deleteQuestion = async (id) => { if (!window.confirm('Eliminar pregunta?')) return; try { await api(`/admin/questions/${id}`, { method: 'DELETE' }); await load(); } catch (e) { alert(e.message); } };
  const addOption = async (questionId, payload) => { try { await api(`/admin/questions/${questionId}/options`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); await load(); } catch (e) { alert(e.message); } };
  const patchOption = async (id, patch) => { try { await api(`/admin/options/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }); await load(); } catch (e) { alert(e.message); } };
  const deleteOption = async (id) => { if (!window.confirm('Eliminar opción?')) return; try { await api(`/admin/options/${id}`, { method: 'DELETE' }); await load(); } catch (e) { alert(e.message); } };
  const insertIcfesPackage = async () => {
    if (!window.confirm('Insertar paquete de preguntas ICFES (puntajes 0-100 y global)?')) return;
    try {
      await api(`/admin/versions/${versionId}/insert-icfes-package`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ include_global: true }) });
      await load();
    } catch (e) { alert(e.message || 'No se pudo insertar el paquete ICFES'); }
  };

  const addSection = async (e) => {
    e?.preventDefault?.();
    if (!newSec.title.trim()) { alert('El título de la sección es obligatorio.'); return; }
    try {
      await api(`/admin/versions/${versionId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newSec.title, description: newSec.description || undefined })
      });
      setNewSec({ title: '', description: '' });
      setAddingSec(false);
      await load();
    } catch (e) {
      alert(e.message || 'No se pudo crear la sección');
    }
  };

  // --- Reorder helpers ---
  const reorderSection = async (sectionId, direction) => {
    if (!version?.sections?.length) return;
    const secs = [...version.sections].sort((a,b) => a.order - b.order || a.id - b.id);
    const idx = secs.findIndex(s => s.id === sectionId);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= secs.length) return;
    const a = secs[idx];
    const b = secs[targetIdx];
    try {
      // swap orders in one shot
      await Promise.all([
        api(`/admin/sections/${a.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: b.order }) }),
        api(`/admin/sections/${b.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: a.order }) })
      ]);
      await load();
    } catch (e) { alert(e.message || 'No se pudo reordenar la sección'); }
  };

  const reorderQuestions = async (sectionId, questionId, direction) => {
    const sec = version?.sections?.find(s => s.id === sectionId);
    if (!sec || !sec.questions?.length) return;
    const qs = [...sec.questions].sort((a,b) => a.order - b.order || a.id - b.id);
    const idx = qs.findIndex(q => q.id === questionId);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= qs.length) return;
    const a = qs[idx];
    const b = qs[targetIdx];
    try {
      await Promise.all([
        api(`/admin/questions/${a.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: b.order }) }),
        api(`/admin/questions/${b.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: a.order }) })
      ]);
      await load();
    } catch (e) { alert(e.message || 'No se pudo reordenar la pregunta'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Versión v{version?.number} ({version?.status})</h3>
        <div style={{ display: 'flex', gap: 6, flexWrap:'wrap' }}>
          <button className='btn btn-secondary btn-sm' onClick={toggleQuestionnaireStatus}>
            {version?.questionnaire?.status === 'active' ? 'Desactivar cuestionario' : 'Activar cuestionario'}
          </button>
          {isDraft && <button className='btn btn-primary btn-sm' onClick={publish}>Publicar</button>}
          {isDraft && <button className='btn btn-danger btn-sm' onClick={deleteVersion}>Eliminar versión (borrador)</button>}
          {isPublished && <button className='btn btn-warning btn-sm' onClick={unpublish}>Despublicar</button>}
          <button className='btn btn-secondary btn-sm' onClick={onClose}>Cerrar</button>
        </div>
      </div>
      {loading && <p>Cargando...</p>}
      {error && <p style={{ color: 'crimson' }}>Error: {error}</p>}
      {version && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <div style={{ margin: '6px 0', fontSize: 12, color: '#555' }}>
              Asignaciones: <strong>{assignments}</strong>{isPublished && isLatestPublished ? ' · Última publicada' : ''}
            </div>
            {(isPublished && (isLatestPublished || assignments > 0)) && (
              <div style={{ background: '#fff6f6', border: '1px solid #f5c2c7', color: '#842029', padding: '8px 10px', borderRadius: 6, marginBottom: 8 }}>
                No puedes eliminar esta versión porque {isLatestPublished ? 'es la última publicada' : ''}{isLatestPublished && assignments > 0 ? ' y ' : ''}{assignments > 0 ? 'tiene asignaciones registradas' : ''}. Puedes despublicarla para retirarla del público.
              </div>
            )}
            <h4 style={{ margin: '0.5rem 0' }}>Secciones</h4>
            {isDraft && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                {!addingSec && (
                  <button className='btn btn-secondary btn-sm' onClick={() => setAddingSec(true)}>Agregar sección</button>
                )}
              </div>
            )}
            {isDraft && addingSec && (
              <form onSubmit={addSection} style={{ display: 'grid', gap: 6, background:'#fff', border:'1px dashed #cbd5e0', padding:10, borderRadius:8, marginBottom: 8 }}>
                <strong style={{ fontSize: 12 }}>Nueva sección</strong>
                <input placeholder='Título' value={newSec.title} onChange={e => setNewSec(s => ({ ...s, title: e.target.value }))} />
                <textarea rows={2} placeholder='Descripción (opcional)' value={newSec.description} onChange={e => setNewSec(s => ({ ...s, description: e.target.value }))} />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className='btn btn-primary btn-sm' type='submit'>Crear</button>
                  <button className='btn btn-secondary btn-sm' type='button' onClick={() => { setAddingSec(false); setNewSec({ title: '', description: '' }); }}>Cancelar</button>
                </div>
              </form>
            )}
            {[...version.sections].sort((a,b) => a.order - b.order || a.id - b.id).map((sec, idx, arr) => (
              <SectionBlock
                key={sec.id}
                section={sec}
                isDraft={isDraft}
                canMoveUp={idx > 0}
                canMoveDown={idx < arr.length - 1}
                onMoveUp={() => reorderSection(sec.id, 'up')}
                onMoveDown={() => reorderSection(sec.id, 'down')}
                onPatch={patchSection}
                onDelete={deleteSection}
                onAddQuestion={addQuestion}
                onAddQuestionWithOptions={addQuestionWithOptions}
                onPatchQuestion={patchQuestion}
                onDeleteQuestion={deleteQuestion}
                onAddOption={addOption}
                onPatchOption={patchOption}
                onDeleteOption={deleteOption}
                onInsertIcfesPackage={insertIcfesPackage}
                onReorderQuestions={(questionId, dir) => reorderQuestions(sec.id, questionId, dir)}
              />
            ))}
            {version.sections.length === 0 && (
              <div style={{ padding: 12, color: '#4a5568', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius: 8 }}>
                Aún no hay secciones. Crea al menos una sección para poder agregar preguntas y opciones. Luego podrás publicar la versión.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
