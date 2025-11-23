import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { submitUxSurvey } from '../api';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 4rem 1rem 2rem;
  z-index: 2000;
`;

const ModalCard = styled.div`
  width: min(900px, 100%);
  background: linear-gradient(135deg,#ffffff 0%, #f8fafc 60%, #f1f5f9 100%);
  border-radius: 24px;
  box-shadow: 0 20px 40px -10px rgba(0,0,0,0.25);
  border: 1px solid rgba(255,255,255,0.6);
  position: relative;
  overflow: hidden;
`;

const Header = styled.div`
  padding: 1.25rem 1.5rem 1rem;
  border-bottom: 1px solid #e2e8f0;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.45rem;
  background: linear-gradient(90deg,#8B5CF6,#3B82F6,#10B981);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Sub = styled.p`
  margin: 0.5rem 0 0;
  font-size: 0.85rem;
  color: #475569;
  line-height: 1.4;
`;

const Content = styled.div`
  padding: 1.25rem 1.5rem 2rem;
  max-height: 60vh;
  overflow-y: auto;
`;

const LikertRow = styled.div`
  margin-bottom: 1.1rem;
  background: rgba(255,255,255,0.7);
  border: 2px solid rgba(139,92,246,0.18);
  border-radius: 16px;
  padding: 0.9rem 1rem 0.75rem;
  transition: box-shadow .3s ease, border-color .3s ease;
  &:hover { box-shadow: 0 0 0 4px rgba(139,92,246,0.08); border-color: rgba(139,92,246,0.4); }
`;

const QText = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.6rem;
`;

const Scale = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px,1fr));
  gap: 0.5rem;
`;

const ScaleOption = styled.label`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${p => p.$checked ? 'linear-gradient(135deg,#8B5CF6,#3B82F6)' : 'rgba(255,255,255,0.9)'};
  color: ${p => p.$checked ? '#fff' : '#334155'};
  border: 2px solid ${p => p.$checked ? 'rgba(139,92,246,0.9)' : 'rgba(139,92,246,0.3)'};
  border-radius: 10px;
  padding: 0.6rem 0.5rem;
  cursor: pointer;
  transition: all .25s ease;
  user-select: none;
  &:hover { background: ${p => p.$checked ? 'linear-gradient(135deg,#7c3aed,#2563eb)' : 'rgba(255,255,255,1)'}; }
  input { display:none; }
`;

const Footer = styled.div`
  padding: 0.9rem 1.25rem 1.25rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const SubmitBtn = styled.button`
  background: linear-gradient(135deg,#10B981,#059669);
  border: none;
  color: #fff;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.85rem 1.6rem;
  border-radius: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 18px rgba(16,185,129,0.4);
  transition: transform .25s ease;
  &:hover { transform: translateY(-3px); }
  &:active { transform: translateY(-1px); }
  &:disabled { opacity: 0.55; cursor: not-allowed; }
`;

const DisabledNote = styled.div`
  font-size: 0.7rem;
  font-weight: 500;
  color: #64748b;
`;

const Alert = styled.div`
  display:flex;
  align-items:center;
  gap:0.5rem;
  font-size:0.75rem;
  font-weight:600;
  padding:0.55rem 0.65rem;
  border-radius:10px;
  background: ${p => p.$variant==='error' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'};
  color: ${p => p.$variant==='error' ? '#b91c1c' : '#065f46'};
  border:2px solid ${p => p.$variant==='error' ? '#ef4444' : '#10b981'};
`;

const ThankYou = styled.div`
  text-align:center;
  padding: 2rem 1.5rem 2.25rem;
`;

const ThankTitle = styled.h3`
  margin:0 0 .75rem;
  font-size:1.4rem;
  background: linear-gradient(90deg,#10B981,#059669);
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
`;

const ThankText = styled.p`
  font-size:0.9rem;
  color:#065f46;
  line-height:1.5;
  margin:0 auto;
  max-width:520px;
`;

// Hardcoded labels ordered to align with backend codes ux_q1..ux_q10
const QUESTIONS = [
  'Encontré la plataforma innecesariamente compleja',
  'Considero que la plataforma fue fácil de usar',
  'Necesité ayuda técnica para usar la plataforma',
  'Las funciones estaban bien integradas',
  'Hubo demasiada inconsistencia en la plataforma',
  'Imagino que la mayoría aprendería a usarla rápidamente',
  'La plataforma me resultó muy pesada de usar',
  'Me sentí muy confiado usando la plataforma',
  'Tuve que aprender demasiadas cosas antes de usarla',
  'Recomendaría esta plataforma a otros estudiantes'
];

const OPTIONS = [
  { value: 5, label: 'Muy de acuerdo' },
  { value: 4, label: 'De acuerdo' },
  { value: 3, label: 'Neutral' },
  { value: 2, label: 'En desacuerdo' },
  { value: 1, label: 'Muy en desacuerdo' }
];

const CommentBox = styled.textarea`
  width: 100%;
  padding: 0.75rem 0.85rem;
  background: rgba(255,255,255,0.9);
  border: 2px solid rgba(139,92,246,0.3);
  border-radius: 14px;
  font-size: 0.85rem;
  resize: vertical;
  min-height: 90px;
  font-family: inherit;
  transition: border-color .25s ease, box-shadow .25s ease;
  &:focus { outline:none; border-color:#3B82F6; box-shadow:0 0 0 4px rgba(59,130,246,0.15); }
`;

export default function UxSurveyModal({ open, userCode, onClose, onSubmitted }) {
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!open) {
      setAnswers({});
      setSubmitting(false);
      setError('');
      setSuccess(false);
      setComment('');
    }
  }, [open]);

  const allAnswered = Object.keys(answers).length === QUESTIONS.length && QUESTIONS.every((_, i) => answers[`ux_q${i+1}`]);

  const handleSelect = (qIndex, value) => {
    setAnswers(prev => ({ ...prev, [`ux_q${qIndex+1}`]: value }));
  };

  const handleSubmit = async () => {
    if (!allAnswered || submitting) return;
    setSubmitting(true); setError('');
    try {
      await submitUxSurvey({ userCode, answers, comment });
      setSuccess(true);
      // small delay before notifying parent
      setTimeout(() => {
        if (onSubmitted) onSubmitted();
      }, 900);
    } catch (e) {
      setError(e.message || 'No se pudo enviar la encuesta.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <Overlay>
      <ModalCard>
        {success ? (
          <ThankYou>
            <CheckCircle2 size={50} color="#10B981" />
            <ThankTitle>¡Gracias!</ThankTitle>
            <ThankText>
              Tus respuestas nos ayudan a mejorar la experiencia de orientación vocacional. Puedes continuar explorando la plataforma.
            </ThankText>
            <div style={{ marginTop:'1.5rem' }}>
              <SubmitBtn onClick={onClose}>Cerrar</SubmitBtn>
            </div>
          </ThankYou>
        ) : (
          <>
            <Header>
              <Title>Encuesta de Satisfacción</Title>
              <Sub>Antes de continuar necesitamos tu percepción sobre la plataforma. Marca una opción por cada afirmación y agrega un comentario opcional.</Sub>
            </Header>
            <Content>
              {QUESTIONS.map((q, idx) => (
                <LikertRow key={idx}>
                  <QText>{idx+1}. {q}</QText>
                  <Scale>
                    {OPTIONS.map(opt => (
                      <ScaleOption key={opt.value} $checked={answers[`ux_q${idx+1}`] === opt.value}>
                        <input type="radio" name={`ux_q${idx+1}`} value={opt.value} onChange={() => handleSelect(idx, opt.value)} />
                        {opt.label}
                      </ScaleOption>
                    ))}
                  </Scale>
                </LikertRow>
              ))}
              <LikertRow>
                <QText>Comentario o recomendación (opcional)</QText>
                <CommentBox placeholder="Escribe tu sugerencia o comentario (opcional)" value={comment} onChange={e=>setComment(e.target.value)} maxLength={2000} />
                <div style={{ fontSize:10, color:'#64748b', marginTop:4 }}>Máx. 2000 caracteres</div>
              </LikertRow>
            </Content>
            <Footer>
              {error && (
                <Alert $variant='error'>
                  <XCircle size={16} /> {error}
                </Alert>
              )}
              {allAnswered && !error && (
                <Alert $variant='success'>
                  <AlertCircle size={16} /> Todo listo para enviar.
                </Alert>
              )}
              {!allAnswered && (
                <DisabledNote>Responde todas las afirmaciones para habilitar el envío.</DisabledNote>
              )}
              <Actions>
                <SubmitBtn disabled={!allAnswered || submitting} onClick={handleSubmit}>
                  {submitting ? 'Enviando...' : 'Enviar Encuesta'}
                </SubmitBtn>
              </Actions>
            </Footer>
          </>
        )}
      </ModalCard>
    </Overlay>
  );
}
