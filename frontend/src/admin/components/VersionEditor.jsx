import React, { useEffect, useState } from 'react';
import { api, patchVersionMetadata } from '../api';
import { SectionBlock } from './SectionBlock';
import { ResponsesViewer } from './ResponsesViewer';
import FeatureBindingWizard from './FeatureBindingWizard';

export function VersionEditor({ versionId, onClose, onRefreshList }) {
  const [version, setVersion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState('structure'); // 'structure' | 'responses' | 'metadata'
  const [addingSec, setAddingSec] = useState(false);
  const [newSec, setNewSec] = useState({ title: '', description: '' });
  const [metaText, setMetaText] = useState('');
  const [metaDirty, setMetaDirty] = useState(false);
  const [showWizard, setShowWizard] = useState(false); // legacy; wizard is always visible now
  // reserved for future inline create pattern (removed unused state to satisfy lint)

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const d = await api(`/admin/versions/${versionId}`);
      setVersion(d.version);
      // prepare metadata editor text
      const meta = d?.version?.metadata_json ?? null;
      const pretty = meta ? JSON.stringify(meta, null, 2) : '{\n  "ml_binding": {\n    \n  }\n}';
      setMetaText(pretty);
      setMetaDirty(false);
    }
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
    try { setBusy(true); await api(`/admin/versions/${versionId}`, { method: 'DELETE' }); onClose(); onRefreshList(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const unpublish = async () => {
    if (!window.confirm('¿Despublicar esta versión? Pasará a borrador y dejará de estar disponible públicamente.')) return;
    try {
      setBusy(true);
      await api(`/admin/versions/${versionId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'draft' }) });
      await load();
      onRefreshList();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const publish = async () => {
    if (!window.confirm('Publicar esta versión?')) return;
    try { setBusy(true); await api(`/admin/versions/${versionId}/publish`, { method: 'POST' }); await load(); onRefreshList(); }
    catch (e) { alert(e.message); }
    finally { setBusy(false); }
  };

  const toggleQuestionnaireStatus = async () => {
    if (!version?.questionnaire?.code) return;
    const target = version.questionnaire.status === 'active' ? 'inactive' : 'active';
    try {
      setBusy(true);
      await api(`/admin/questionnaires/${encodeURIComponent(version.questionnaire.code)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: target })
      });
      await load();
      onRefreshList();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const patchSection = async (id, patch) => { try { setBusy(true); await api(`/admin/sections/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }); await load(); } catch (e) { alert(e.message); } finally { setBusy(false); } };
  const deleteSection = async (id) => { if (!window.confirm('Eliminar sección?')) return; try { setBusy(true); await api(`/admin/sections/${id}`, { method: 'DELETE' }); await load(); } catch (e) { alert(e.message); } finally { setBusy(false); } };
  const addQuestion = async (sectionId, payload) => { try { setBusy(true); await api(`/admin/sections/${sectionId}/questions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); await load(); } catch (e) { alert(e.message); } finally { setBusy(false); } };
  const addQuestionWithOptions = async (sectionId, baseQuestion, options) => {
    try {
  setBusy(true);
  const q = await api(`/admin/sections/${sectionId}/questions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(baseQuestion) });
      const qid = q?.question?.id;
      if (qid && Array.isArray(options) && options.length) {
        for (const op of options) {
          await api(`/admin/questions/${qid}/options`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(op) });
        }
      }
      await load();
    } catch (e) { alert(e.message || 'No se pudo crear la pregunta con opciones'); }
    finally { setBusy(false); }
  };
  const patchQuestion = async (id, patch) => { try { setBusy(true); await api(`/admin/questions/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }); await load(); } catch (e) { alert(e.message); } finally { setBusy(false); } };
  const deleteQuestion = async (id) => { if (!window.confirm('Eliminar pregunta?')) return; try { setBusy(true); await api(`/admin/questions/${id}`, { method: 'DELETE' }); await load(); } catch (e) { alert(e.message); } finally { setBusy(false); } };
  const addOption = async (questionId, payload) => { try { setBusy(true); await api(`/admin/questions/${questionId}/options`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); await load(); } catch (e) { alert(e.message); } finally { setBusy(false); } };
  const patchOption = async (id, patch) => { try { setBusy(true); await api(`/admin/options/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }); await load(); } catch (e) { alert(e.message); } finally { setBusy(false); } };
  const deleteOption = async (id) => { if (!window.confirm('Eliminar opción?')) return; try { setBusy(true); await api(`/admin/options/${id}`, { method: 'DELETE' }); await load(); } catch (e) { alert(e.message); } finally { setBusy(false); } };
  const insertIcfesPackage = async () => {
    if (!window.confirm('Insertar paquete de preguntas ICFES (puntajes 0-100 y global)?')) return;
    try {
      setBusy(true);
      await api(`/admin/versions/${versionId}/insert-icfes-package`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ include_global: true }) });
      await load();
    } catch (e) { alert(e.message || 'No se pudo insertar el paquete ICFES'); }
    finally { setBusy(false); }
  };

  // --- Metadata & ML binding ---
  const saveMetadata = async () => {
    let parsed = null;
    try {
      parsed = metaText && metaText.trim() ? JSON.parse(metaText) : {};
    } catch (e) {
      alert('JSON inválido en metadata. Revisa el formato.');
      return;
    }
    try {
      setBusy(true);
      await patchVersionMetadata(versionId, parsed);
      await load();
      setMetaDirty(false);
    } catch (e) {
      alert(e.message || 'No se pudo guardar metadata');
    } finally {
      setBusy(false);
    }
  };

  // Removed template/auto-generation: mapping is model-first in the wizard

  const addSection = async (e) => {
    e?.preventDefault?.();
    if (!newSec.title.trim()) { alert('El título de la sección es obligatorio.'); return; }
    try {
      setBusy(true);
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
    } finally { setBusy(false); }
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

  // Reorder questions by new ordered id list (drag & drop support)
  const reorderQuestionsBulk = async (sectionId, orderedIds) => {
    try {
      // assign sequential order starting at 1
      const patches = orderedIds.map((qid, idx) =>
        api(`/admin/questions/${qid}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: idx + 1 }) })
      );
      await Promise.all(patches);
      await load();
    } catch (e) { alert(e.message || 'No se pudo reordenar'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Versión v{version?.number} ({version?.status})</h3>
        <div style={{ display: 'flex', gap: 6, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ display:'inline-flex', border:'1px solid #e2e8f0', borderRadius: 6, overflow:'hidden', marginRight: 8 }}>
            <button className={'btn btn-secondary btn-sm'+(view==='structure'?' active':'')} onClick={()=>setView('structure')} disabled={busy} style={{ border:'none', borderRight:'1px solid #e2e8f0' }}>Estructura</button>
            <button className={'btn btn-secondary btn-sm'+(view==='responses'?' active':'')} onClick={()=>setView('responses')} disabled={busy} style={{ border:'none', borderRight:'1px solid #e2e8f0' }}>Respuestas</button>
            <button className={'btn btn-secondary btn-sm'+(view==='metadata'?' active':'')} onClick={()=>setView('metadata')} disabled={busy} style={{ border:'none' }}>ML / Metadata</button>
          </div>
          <button className='btn btn-secondary btn-sm' onClick={toggleQuestionnaireStatus} disabled={busy}>
            {version?.questionnaire?.status === 'active' ? 'Desactivar cuestionario' : 'Activar cuestionario'}
          </button>
          {isDraft && <button className='btn btn-primary btn-sm' onClick={publish} disabled={busy}>Publicar</button>}
          {isDraft && <button className='btn btn-danger btn-sm' onClick={deleteVersion} disabled={busy}>Eliminar versión (borrador)</button>}
          {isPublished && <button className='btn btn-warning btn-sm' onClick={unpublish} disabled={busy}>Despublicar</button>}
          <button className='btn btn-secondary btn-sm' onClick={onClose} disabled={busy}>Cerrar</button>
        </div>
      </div>
      {(loading || busy) && <p>Cargando...</p>}
      {error && <p style={{ color: 'crimson' }}>Error: {error}</p>}
      {version && view === 'structure' && (
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
                  <button className='btn btn-secondary btn-sm' onClick={() => setAddingSec(true)} disabled={busy}>Agregar sección</button>
                )}
              </div>
            )}
            {isDraft && addingSec && (
              <form onSubmit={addSection} style={{ display: 'grid', gap: 6, background:'#fff', border:'1px dashed #cbd5e0', padding:10, borderRadius:8, marginBottom: 8 }}>
                <strong style={{ fontSize: 12 }}>Nueva sección</strong>
                <input placeholder='Título' value={newSec.title} onChange={e => setNewSec(s => ({ ...s, title: e.target.value }))} />
                <textarea rows={2} placeholder='Descripción (opcional)' value={newSec.description} onChange={e => setNewSec(s => ({ ...s, description: e.target.value }))} />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className='btn btn-primary btn-sm' type='submit' disabled={busy}>Crear</button>
                  <button className='btn btn-secondary btn-sm' type='button' onClick={() => { setAddingSec(false); setNewSec({ title: '', description: '' }); }} disabled={busy}>Cancelar</button>
                </div>
              </form>
            )}
            {[...version.sections].sort((a,b) => a.order - b.order || a.id - b.id).map((sec, idx, arr) => (
              <SectionBlock
                key={sec.id}
                section={sec}
                isDraft={isDraft}
                busy={busy}
                allCodes={version.sections.flatMap(s => (s.questions||[]).map(q => q.code))}
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
                onReorderAllQuestions={(orderedIds) => reorderQuestionsBulk(sec.id, orderedIds)}
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
      {version && view === 'responses' && (
        <div style={{ display:'grid', gap: 16 }}>
          <ResponsesViewer versionId={versionId} />
        </div>
      )}
      {version && view === 'metadata' && (
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ color: '#4a5568', fontSize: 12 }}>
            Edita <code>metadata_json</code> de esta versión. Aquí puedes definir el <strong>binding ML</strong> (v1 o v2). Guarda para aplicar.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className='btn btn-primary btn-sm' type='button' onClick={saveMetadata} disabled={busy || !metaText}>{metaDirty ? 'Guardar cambios' : 'Guardar'}</button>
          </div>
          <FeatureBindingWizard
            version={version}
            metaText={metaText}
            onApply={(obj)=>{ setMetaText(JSON.stringify(obj, null, 2)); setMetaDirty(true); }}
          />
          <textarea
            rows={20}
            style={{ width: '100%', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
            value={metaText}
            onChange={e => { setMetaText(e.target.value); setMetaDirty(true); }}
          />
        </div>
      )}
    </div>
  );
}
