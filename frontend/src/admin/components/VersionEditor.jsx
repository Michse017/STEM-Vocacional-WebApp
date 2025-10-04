import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { SectionBlock } from './SectionBlock';

export function VersionEditor({ versionId, onClose, onRefreshList }) {
  const [version, setVersion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
  const isArchived = version?.status === 'archived';
  const assignments = version?.assignment_count || 0;
  const isLatestPublished = !!version?.is_latest_published;
  const deleteVersion = async () => {
    if (!window.confirm('¿Eliminar esta versión (borrador)?')) return;
    try { await api(`/admin/versions/${versionId}`, { method: 'DELETE' }); onClose(); onRefreshList(); }
    catch (e) { setError(e.message); }
  };

  const deletePublishedVersion = async () => {
    if (!window.confirm('¿Eliminar esta versión?')) return;
    try {
      await api(`/admin/versions/${versionId}`, { method: 'DELETE' });
      onClose();
      onRefreshList();
    } catch (e) {
      // Surface 409 reason directly to the user
      alert(e.message || 'No se pudo eliminar la versión (verifique que no sea la última publicada ni tenga asignaciones).');
      setError(e.message);
    }
  };

  const archivePublishedVersion = async () => {
    if (!window.confirm('¿Archivar esta versión publicada? Quedará oculta del público y no podrá usarse para nuevas respuestas.')) return;
    try {
      await api(`/admin/versions/${versionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' })
      });
      await load();
      onRefreshList();
    } catch (e) { setError(e.message); }
  };

  const unarchiveVersion = async () => {
    if (!window.confirm('¿Desarchivar esta versión? Volverá a estado publicado.')) return;
    try {
      await api(`/admin/versions/${versionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' })
      });
      await load();
      onRefreshList();
    } catch (e) { setError(e.message); }
  };

  const forceDeleteArchived = async () => {
    if (!window.confirm('Esta acción eliminará definitivamente asignaciones y respuestas asociadas a esta versión. ¿Continuar?')) return;
    if (!window.confirm('Confirmación final: esta acción es IRREVERSIBLE. ¿Eliminar definitivamente?')) return;
    try {
      const res = await api(`/admin/versions/${versionId}/force-delete`, { method: 'DELETE' });
      alert(`Versión eliminada. Registros borrados: asignaciones=${res.deleted?.assignments || 0}, respuestas=${res.deleted?.responses || 0}, items=${res.deleted?.items || 0}`);
      onClose();
      onRefreshList();
    } catch (e) {
      alert(e.message || 'No se pudo eliminar definitivamente.');
      setError(e.message);
    }
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
  const patchQuestion = async (id, patch) => { try { await api(`/admin/questions/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }); await load(); } catch (e) { alert(e.message); } };
  const deleteQuestion = async (id) => { if (!window.confirm('Eliminar pregunta?')) return; try { await api(`/admin/questions/${id}`, { method: 'DELETE' }); await load(); } catch (e) { alert(e.message); } };
  const addOption = async (questionId, payload) => { try { await api(`/admin/questions/${questionId}/options`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); await load(); } catch (e) { alert(e.message); } };
  const patchOption = async (id, patch) => { try { await api(`/admin/options/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }); await load(); } catch (e) { alert(e.message); } };
  const deleteOption = async (id) => { if (!window.confirm('Eliminar opción?')) return; try { await api(`/admin/options/${id}`, { method: 'DELETE' }); await load(); } catch (e) { alert(e.message); } };

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
          {isPublished && <button className='btn btn-warning btn-sm' onClick={archivePublishedVersion}>Archivar versión publicada</button>}
          {isPublished && (
            <button
              className='btn btn-danger btn-sm'
              onClick={deletePublishedVersion}
              disabled={isLatestPublished || assignments > 0}
              title={isLatestPublished ? 'No se puede eliminar la última versión publicada' : (assignments > 0 ? 'No se puede eliminar: tiene asignaciones' : 'Eliminar versión publicada')}
            >
              Eliminar versión publicada
            </button>
          )}
          {isArchived && <button className='btn btn-secondary btn-sm' onClick={unarchiveVersion}>Desarchivar</button>}
          {isArchived && assignments === 0 && (
            <button className='btn btn-danger btn-sm' onClick={deletePublishedVersion} title='Eliminar versión (archivada)'>
              Eliminar versión (archivada)
            </button>
          )}
          {isArchived && assignments > 0 && (
            <button className='btn btn-danger btn-sm' onClick={forceDeleteArchived} title='Eliminar definitivamente (purga datos)'>
              Eliminar definitivamente
            </button>
          )}
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
                No puedes eliminar esta versión porque {isLatestPublished ? 'es la última publicada' : ''}{isLatestPublished && assignments > 0 ? ' y ' : ''}{assignments > 0 ? 'tiene asignaciones registradas' : ''}. Puedes archivar para ocultarla del público.
              </div>
            )}
            {(isArchived && assignments > 0) && (
              <div style={{ background: '#fff6f6', border: '1px solid #f5c2c7', color: '#842029', padding: '8px 10px', borderRadius: 6, marginBottom: 8 }}>
                No puedes eliminar una versión archivada que tiene asignaciones registradas. Manténla archivada para conservar el historial.
              </div>
            )}
            <h4 style={{ margin: '0.5rem 0' }}>Secciones</h4>
            {version.sections.map(sec => (
              <SectionBlock key={sec.id} section={sec} isDraft={isDraft} onPatch={patchSection} onDelete={deleteSection}
                onAddQuestion={addQuestion} onPatchQuestion={patchQuestion} onDeleteQuestion={deleteQuestion}
                onAddOption={addOption} onPatchOption={patchOption} onDeleteOption={deleteOption} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
