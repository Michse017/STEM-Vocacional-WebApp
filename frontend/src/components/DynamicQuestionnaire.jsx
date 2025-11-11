import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getDynamicQuestionnaire, getMyDynamicStatus, saveDynamicResponse, finalizeDynamicResponse, saveDynamicResponseKeepAlive, getPrefillValues } from "../api";
import styled, { keyframes } from "styled-components";
import { ArrowLeft, ChevronRight, CheckCircle2, XCircle, AlertCircle, Save, Check, Award } from "lucide-react";

// Animations
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.15; }
  50% { opacity: 0.3; }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 8px 32px rgba(139, 92, 246, 0.2); }
  50% { box-shadow: 0 8px 40px rgba(139, 92, 246, 0.4); }
`;

// Styled Components
const QuestionnaireContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #faf5ff 0%, #eff6ff 50%, #f0fdf4 100%);
  padding: 2rem 1rem;
  position: relative;
  overflow-x: hidden;
  animation: ${fadeIn} 0.6s ease;
`;

const FloatingElement = styled.div`
  position: fixed;
  opacity: 0.12;
  pointer-events: none;
  animation: ${float} ${props => props.duration || '8s'} ease-in-out infinite, ${pulse} 4s ease-in-out infinite;
  z-index: 0;
  filter: drop-shadow(0 0 15px currentColor);
  
  &.atom {
    top: 10%;
    right: 10%;
    animation-delay: 0s;
  }
  
  &.beaker {
    bottom: 20%;
    left: 10%;
    animation-delay: 2s;
  }
  
  &.gear {
    top: 60%;
    right: 5%;
    animation-delay: 4s;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const HeaderCard = styled.div`
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(15px);
  border-radius: 20px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.5);
  animation: ${slideUp} 0.6s ease;
  position: sticky;
  top: 20px;
  z-index: 10;
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(139, 92, 246, 0.15);
  border: 2px solid rgba(139, 92, 246, 0.3);
  color: #8B5CF6;
  padding: 0.625rem 1.25rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
  
  &:hover {
    background: rgba(139, 92, 246, 0.25);
    transform: translateX(-5px);
    box-shadow: 0 6px 16px rgba(139, 92, 246, 0.3);
  }
`;

const QuestionnaireTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 50%, #10B981 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 1rem 0 0.5rem;
`;

const VersionBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: rgba(107, 114, 128, 0.15);
  color: #6B7280;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 0.75rem;
  border: 1px solid rgba(107, 114, 128, 0.2);
`;

const AlertBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 12px;
  margin-top: 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  animation: ${slideUp} 0.4s ease;
  
  ${props => props.variant === 'success' && `
    background: rgba(16, 185, 129, 0.15);
    border: 2px solid #10B981;
    color: #065F46;
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
  `}
  
  ${props => props.variant === 'error' && `
    background: rgba(239, 68, 68, 0.15);
    border: 2px solid #EF4444;
    color: #991B1B;
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
  `}
`;

const MLCard = styled.div`
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border: 2px solid #10B981;
  border-radius: 20px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  animation: ${slideUp} 0.6s ease 0.1s both, ${glow} 3s ease-in-out infinite;
  box-shadow: 0 8px 32px rgba(16, 185, 129, 0.4);
`;

const MLBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  border-radius: 16px;
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1rem;
  box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
  animation: ${pulse} 2s ease-in-out infinite;
  
  ${props => props.$positive ? `
    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
    color: white;
  ` : `
    background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
    color: white;
  `}
`;

const MLText = styled.p`
  font-size: 0.95rem;
  color: #065F46;
  line-height: 1.6;
  margin: 0.75rem 0;
`;

const MLDetails = styled.details`
  margin-top: 1rem;
  
  summary {
    cursor: pointer;
    color: #059669;
    font-weight: 600;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0;
    
    &:hover {
      color: #047857;
    }
  }
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
`;

const FeatureItem = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(5px);
  padding: 0.75rem;
  border-radius: 10px;
  border: 1px solid rgba(16, 185, 129, 0.3);
  
  strong {
    color: #047857;
    display: block;
    margin-bottom: 0.25rem;
    font-size: 0.85rem;
  }
  
  span {
    color: #6B7280;
    font-size: 0.8rem;
  }
`;

const SectionFieldset = styled.fieldset`
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  border: 2px solid rgba(139, 92, 246, 0.2);
  border-radius: 20px;
  padding: 0;
  margin: 0 0 1.5rem;
  animation: ${slideUp} 0.6s ease ${props => props.$index * 0.1}s both;
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.12);
  position: relative;
  overflow: hidden;
  
  &:hover {
    box-shadow: 0 12px 40px rgba(139, 92, 246, 0.18);
  }
`;

const SectionLegend = styled.legend`
  width: 100%;
  padding: 1.25rem 1.5rem;
  margin: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    background: rgba(139, 92, 246, 0.08);
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(
      90deg, 
      #8B5CF6 0%, 
      #8B5CF6 ${props => props.$progress}%, 
      rgba(139, 92, 246, 0.15) ${props => props.$progress}%
    );
    box-shadow: 0 0 10px rgba(139, 92, 246, 0.4);
  }
`;

const SectionTitleDiv = styled.div`
  flex: 1;
`;

const SectionName = styled.h3`
  font-size: 1.15rem;
  font-weight: 700;
  color: #1F2937;
  margin: 0 0 0.25rem;
`;

const SectionCount = styled.span`
  font-size: 0.85rem;
  color: #6B7280;
  font-weight: 500;
`;

const ChevronIconStyled = styled(ChevronRight)`
  transition: transform 0.3s ease;
  transform: ${props => props.$open ? 'rotate(90deg)' : 'rotate(0)'};
  color: #8B5CF6;
  filter: drop-shadow(0 0 6px rgba(139, 92, 246, 0.4));
`;

const SectionContent = styled.div`
  padding: ${props => props.$open ? '1.5rem' : '0 1.5rem'};
  max-height: ${props => props.$open ? '10000px' : '0'};
  overflow: hidden;
  transition: all 0.5s ease;
  opacity: ${props => props.$open ? '1' : '0'};
`;

const QuestionDiv = styled.div`
  margin-bottom: 1.5rem;
`;

const QuestionLabel = styled.label`
  display: block;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 0.5rem;
  
  ${props => props.$required && `
    &::after {
      content: ' *';
      color: #EF4444;
      font-weight: 700;
    }
  `}
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(139, 92, 246, 0.25);
  border-radius: 12px;
  font-size: 0.95rem;
  color: #1F2937;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
    background: rgba(255, 255, 255, 0.95);
  }
  
  &:disabled {
    background: rgba(156, 163, 175, 0.1);
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const StyledTextarea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(139, 92, 246, 0.25);
  border-radius: 12px;
  font-size: 0.95rem;
  color: #1F2937;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
    background: rgba(255, 255, 255, 0.95);
  }
  
  &:disabled {
    background: rgba(156, 163, 175, 0.1);
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const RadioChoiceDiv = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
`;

const RadioChoiceLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.7);
  border: 2px solid ${props => props.$checked ? '#3B82F6' : 'rgba(139, 92, 246, 0.2)'};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.95);
    border-color: #3B82F6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
  }
  
  input {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #3B82F6;
  }
  
  ${props => props.$checked && `
    background: rgba(59, 130, 246, 0.12);
    font-weight: 600;
    color: #1E40AF;
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
  `}
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.7);
  border: 2px solid ${props => props.$checked ? '#10B981' : 'rgba(139, 92, 246, 0.2)'};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.95);
    border-color: #10B981;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
  }
  
  input {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #10B981;
  }
  
  ${props => props.$checked && `
    background: rgba(16, 185, 129, 0.12);
    font-weight: 600;
    color: #065F46;
    box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
  `}
`;

const FieldErrorDiv = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #DC2626;
  font-size: 0.8rem;
  margin-top: 0.5rem;
  font-weight: 500;
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const ActionBar = styled.div`
  position: sticky;
  bottom: 20px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(15px);
  border-radius: 20px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 -8px 32px rgba(139, 92, 246, 0.2);
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.5);
  
  @media (max-width: 768px) {
    flex-direction: column;
    
    button {
      width: 100%;
    }
  }
`;

const BaseButton = styled.button`
  padding: 0.875rem 1.75rem;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  position: relative;
  overflow: hidden;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:hover:not(:disabled) {
    transform: translateY(-3px);
  }
  
  &:active:not(:disabled) {
    transform: translateY(-1px);
  }
`;

const PrimaryButton = styled(BaseButton)`
  background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
  
  &:hover:not(:disabled) {
    box-shadow: 0 8px 24px rgba(139, 92, 246, 0.6);
  }
`;

const SecondaryButton = styled(BaseButton)`
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%);
  color: #3B82F6;
  border: 2px solid rgba(59, 130, 246, 0.3);
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.2);
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(59, 130, 246, 0.15) 100%);
    border-color: #3B82F6;
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  }
`;

const SuccessButton = styled(BaseButton)`
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
  
  &:hover:not(:disabled) {
    box-shadow: 0 8px 24px rgba(16, 185, 129, 0.6);
  }
`;

const CancelButton = styled(BaseButton)`
  background: rgba(156, 163, 175, 0.1);
  color: #6B7280;
  border: 2px solid rgba(156, 163, 175, 0.3);
  
  &:hover:not(:disabled) {
    background: rgba(156, 163, 175, 0.2);
  }
`;

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

function InputForQuestion({ q, value, onChange, disabled, answers, fieldErrors }) {
  // Helpers for date bounds based on rules and other answers
  const computeDateBounds = (q) => {
    const r = q.validation_rules || {};
    let minAttr = undefined;
    let maxAttr = undefined;
    const today = new Date();
    const fmt = (d) => d.toISOString().slice(0,10);
    if (r.min_date) minAttr = String(r.min_date);
    if (r.max_date) maxAttr = String(r.max_date);
    if (r.not_after_today) {
      const t = fmt(today);
      maxAttr = maxAttr ? (t < maxAttr ? t : maxAttr) : t;
    }
    if (r.min_year) {
      const y = parseInt(r.min_year, 10); if (!isNaN(y)) {
        const d = new Date(Date.UTC(y, 0, 1));
        const s = fmt(d);
        minAttr = minAttr ? (s > minAttr ? s : minAttr) : s;
      }
    }
    if (r.max_year) {
      const y = parseInt(r.max_year, 10); if (!isNaN(y)) {
        const d = new Date(Date.UTC(y, 11, 31));
        const s = fmt(d);
        maxAttr = maxAttr ? (s < maxAttr ? s : maxAttr) : s;
      }
    }
    if (r.min_age_years) {
      const n = parseInt(r.min_age_years, 10); if (!isNaN(n)) {
        const d = new Date(Date.UTC(today.getUTCFullYear()-n, today.getUTCMonth(), today.getUTCDate()));
        const s = fmt(d);
        // fecha debe ser <= hoy - n -> max
        maxAttr = maxAttr ? (s < maxAttr ? s : maxAttr) : s;
      }
    }
    if (r.max_age_years) {
      const n = parseInt(r.max_age_years, 10); if (!isNaN(n)) {
        const d = new Date(Date.UTC(today.getUTCFullYear()-n, today.getUTCMonth(), today.getUTCDate()));
        const s = fmt(d);
        // fecha debe ser >= hoy - n -> min
        minAttr = minAttr ? (s > minAttr ? s : minAttr) : s;
      }
    }
    if (r.not_before_code && answers) {
      const other = answers[r.not_before_code];
      if (other) minAttr = String(other);
    }
    if (r.not_after_code && answers) {
      const other = answers[r.not_after_code];
      if (other) maxAttr = String(other);
    }
    return { minAttr, maxAttr };
  };
  
  switch (q.type) {
    case "textarea":
      return <StyledTextarea value={value || ""} onChange={e => onChange(e.target.value)} rows={3} disabled={!!disabled} placeholder={q.placeholder} />;
    case "number": {
      const vr = q.validation_rules || {};
      const stepVal = vr.allow_decimal ? (vr.step !== undefined ? vr.step : 'any') : 1;
      const props = { min: vr.min ?? undefined, max: vr.max ?? undefined, step: stepVal };
      const isIcfesGlobal = q.code === 'puntaje_global_saber11';
      return <StyledInput {...props} type="number" value={value ?? ""} onChange={e => onChange(e.target.value === "" ? "" : Number(e.target.value))} disabled={!!disabled || isIcfesGlobal} placeholder={q.placeholder} />;
    }
    case "date":
      {
        const { minAttr, maxAttr } = computeDateBounds(q);
        return <StyledInput type="date" min={minAttr} max={maxAttr} value={value || ""} onChange={e => onChange(e.target.value)} disabled={!!disabled} />;
      }
    case "email":
      return <StyledInput type="email" value={value || ""} onChange={e => onChange(e.target.value)} disabled={!!disabled} placeholder={q.placeholder} />;
    case "boolean":
      return (
        <RadioChoiceDiv>
          <RadioChoiceLabel $checked={value === true}>
            <input type="radio" disabled={!!disabled} checked={value === true} onChange={() => onChange(true)} /> Sí
          </RadioChoiceLabel>
          <RadioChoiceLabel $checked={value === false}>
            <input type="radio" disabled={!!disabled} checked={value === false} onChange={() => onChange(false)} /> No
          </RadioChoiceLabel>
        </RadioChoiceDiv>
      );
    case "single_choice":
    case "choice": {
      const hasOther = (q.options || []).some(op => op.is_other);
      const selectedIsOther = hasOther && value && (q.options || []).some(op => op.is_other && op.value === value);
      return (
        <>
          <RadioChoiceDiv>
            {q.options?.map(op => (
              <RadioChoiceLabel key={op.value} $checked={value === op.value}>
                <input type="radio" disabled={!!disabled} name={q.code} value={op.value} checked={value === op.value} onChange={() => onChange(op.value)} />
                {op.label}{op.is_other ? ' (Otro)' : ''}
              </RadioChoiceLabel>
            ))}
          </RadioChoiceDiv>
          {hasOther && (
            <StyledInput
              style={{ marginTop: "0.75rem" }}
              placeholder="Especifique (otro)"
              value={(answers && answers[`otro_${q.code}`]) || ''}
              onChange={e => onChange({ __other: e.target.value })}
              disabled={!selectedIsOther || !!disabled}
            />
          )}
        </>
      );
    }
    case "multi_choice": {
      // Behavior: 'Ninguna' (case-insensitive) disables others; 'Todas las anteriores' selects all except none/other
      const options = q.options || [];
      const isNone = (label) => /ningun|ninguna|ninguno/i.test(label || "");
      const isAll = (label) => /todas\s+las\s+anteriores/i.test(label || "");
      const noneOption = options.find(op => isNone(op.label));
      const allOption = options.find(op => isAll(op.label));
      const selected = Array.isArray(value) ? new Set(value) : new Set();

      const toggle = (op, checked) => {
        const arr = new Set(selected);
        if (checked) {
          // If picking NONE, clear all others and keep only NONE
          if (noneOption && op.value === noneOption.value) {
            arr.clear();
            arr.add(op.value);
          } else if (allOption && op.value === allOption.value) {
            // Select all non-none, non-other (exclude any is_other)
            arr.delete(noneOption?.value);
            options.forEach(o => {
              if (o.value === noneOption?.value) return;
              if (o.is_other) return; // exclude 'Otro' from 'todas las anteriores'
              arr.add(o.value);
            });
          } else {
            // selecting a normal option unselects NONE
            arr.delete(noneOption?.value);
            arr.add(op.value);
          }
        } else {
          arr.delete(op.value);
          // If removing last normal when ALL was selected, leave array without ALL if nothing left
        }
        onChange(Array.from(arr));
      };

      const noneSelected = noneOption ? selected.has(noneOption.value) : false;

      return (
        <RadioChoiceDiv>
          {options.map(op => {
            const checked = selected.has(op.value);
            const disabledOpt = !!disabled || (noneSelected && (!noneOption || op.value !== noneOption.value));
            return (
              <CheckboxLabel key={op.value} $checked={checked}>
                <input type="checkbox" disabled={disabledOpt} checked={checked} onChange={e => toggle(op, e.target.checked)} />
                {op.label}{op.is_other ? ' (Otro)' : ''}
              </CheckboxLabel>
            );
          })}
        </RadioChoiceDiv>
      );
    }
    default:
      return <StyledInput type="text" value={value || ""} onChange={e => onChange(e.target.value)} disabled={!!disabled} placeholder={q.placeholder} />;
  }
}

export default function DynamicQuestionnaire() {
  const { code } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  let { usuario } = location.state || {};
  if (!usuario) {
    try { const u = JSON.parse(sessionStorage.getItem('usuario') || 'null'); if (u && (u.id_usuario !== undefined)) usuario = u; } catch (_) {}
  }
  // Cross-tab support: if no sessionStorage but there is an active student session in localStorage, synthesize minimal usuario
  if (!usuario) {
    try {
      const s = JSON.parse(localStorage.getItem('active_session') || 'null');
      if (s && s.type === 'student' && s.code) {
        usuario = { codigo_estudiante: s.code, id_usuario: -1 };
        try { sessionStorage.setItem('usuario', JSON.stringify(usuario)); } catch (_) {}
      }
    } catch (_) {}
  }
  useEffect(() => {
    if (!usuario) navigate('/login');
  }, [usuario, usuario?.codigo_estudiante, navigate]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({});
  // userCode input removed: always use usuario/session
  const [submitMsg, setSubmitMsg] = useState("");
  const [submitErr, setSubmitErr] = useState("");
  const [finalized, setFinalized] = useState(false);
  const [openSections, setOpenSections] = useState({});
  const [busySave, setBusySave] = useState(false);
  const [busyFinalize, setBusyFinalize] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({}); // { [qcode]: [messages] }
  const [mlResult, setMlResult] = useState(null);

  // Helper to coerce raw answers from backend into proper JS types based on questionnaire structure
  const coerceAnswers = (structure, raw) => {
    const out = {};
    if (!raw || typeof raw !== 'object') return out;
    const typeByCode = {};
    (structure?.sections || []).forEach(sec => (sec.questions || []).forEach(q => { typeByCode[q.code] = q.type; }));
    for (const [k, v] of Object.entries(raw)) {
      const t = typeByCode[k];
      if (t === 'boolean') {
        if (v === true || v === false) out[k] = v;
        else if (v === 1 || v === '1' || v === 'true' || v === 'True' || v === 'TRUE') out[k] = true;
        else if (v === 0 || v === '0' || v === 'false' || v === 'False' || v === 'FALSE') out[k] = false;
        else out[k] = undefined;
      } else if (t === 'number') {
        if (v === '' || v === null || v === undefined) out[k] = '';
        else out[k] = Number(v);
      } else if (t === 'multi_choice') {
        if (Array.isArray(v)) out[k] = v;
        else if (typeof v === 'string') {
          try { out[k] = v.includes('|') ? v.split('|').filter(Boolean) : JSON.parse(v); }
          catch { out[k] = v ? [v] : []; }
        } else out[k] = [];
      } else {
        out[k] = v;
      }
    }
    return out;
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getDynamicQuestionnaire(code);
        if (mounted) setData(res?.questionnaire || null);
        if (usuario?.codigo_estudiante) {
          const mine = await getMyDynamicStatus(code, usuario.codigo_estudiante);
          if (mounted && mine) {
            setFinalized(mine.status === 'finalized');
            if (mine.answers) setAnswers(coerceAnswers(res?.questionnaire, mine.answers));
            // Persisted ML summary for read-only view after reingress
            if (mine.ml) setMlResult(mine.ml);
          }
          // Prefill for unanswered fields using values from other questionnaires
          try {
            const structure = res?.questionnaire;
            const allCodes = [];
            (structure?.sections || []).forEach(sec => (sec.questions || []).forEach(q => allCodes.push(q.code)));
            const current = mine?.answers ? coerceAnswers(structure, mine.answers) : {};
            const missing = allCodes.filter(c => current[c] === undefined || current[c] === null || current[c] === "");
            if (missing.length) {
              const pf = await getPrefillValues(usuario.codigo_estudiante, missing);
              const values = pf?.values || {};
              const next = { ...(mine?.answers || {}) };
              missing.forEach(c => {
                if (values[c] !== undefined && values[c] !== null && next[c] === undefined) {
                  next[c] = values[c];
                }
              });
              if (mounted) setAnswers(coerceAnswers(structure, next));
            }
          } catch (_) { /* best-effort prefill */ }
        }
      } catch (e) {
        if (mounted) setError(e.message || "No se pudo cargar el cuestionario.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [code, usuario?.codigo_estudiante]);

  // Client-side visibility evaluator (mirrors backend simple rules)
  const evalVisible = useCallback((rule, vals) => {
    if (!rule) return true;
    if (typeof rule !== 'object') return true;
    if (Array.isArray(rule.and)) return rule.and.every(r => evalVisible(r, vals));
    if (Array.isArray(rule.or)) return rule.or.some(r => evalVisible(r, vals));
    const code = rule.code;
    if (code) {
      const expected = rule.equals;
      return (vals ?? {})[code] === expected;
    }
    return true;
  }, []);

  // Derive which sections have at least one visible question
  const visibleMap = useMemo(() => {
    const map = {};
    if (!data?.sections) return map;
    for (const sec of data.sections) {
      const vqs = (sec.questions || []).filter(q => evalVisible(q.visible_if, answers));
      map[sec.id] = vqs.map(q => q.id);
    }
    return map;
  }, [data, answers, evalVisible]);

  // Initialize open state on first load to open first section that has visible questions
  useEffect(() => {
    if (!data?.sections?.length) return;
    setOpenSections(prev => {
      if (Object.keys(prev).length) return prev;
      const next = {};
      let opened = false;
      for (const sec of data.sections) {
        const hasVisible = (visibleMap[sec.id] || []).length > 0;
        next[sec.id] = !opened && hasVisible; // open the first visible one
        if (!opened && hasVisible) opened = true;
      }
      return next;
    });
  }, [data, visibleMap]);

  const handleChange = (qcode, val) => {
    setAnswers(prev => {
      const next = { ...prev };
      if (val && typeof val === 'object' && val.__other !== undefined) {
        // Inline "otro" textbox uses pseudo payload {__other: value}
        next[`otro_${qcode}`] = val.__other;
      } else {
        next[qcode] = val;
      }
      // Auto-calc ICFES global if components present
      const lc = next['puntaje_lectura_critica'];
      const m = next['puntaje_matematicas'];
      const sc = next['puntaje_sociales_ciudadanas'];
      const cn = next['puntaje_ciencias_naturales'];
      const i = next['puntaje_ingles'];
      const allNums = [lc,m,sc,cn,i].every(v => typeof v === 'number' && !isNaN(v));
      if (allNums) {
        const ponderado = 3 * (lc + m + sc + cn) + i;
        const indice = ponderado / 13;
        const global_calc = Math.max(0, Math.min(500, Math.round(indice * 5)));
        next['puntaje_global_saber11'] = global_calc;
      }
      return next;
    });
  };

  // Client-side soft validation before save
  const validateBeforeSave = (opts = { enforceRequired: false }) => {
    if (!data) return null;
    const errs = [];
    const perField = {};
    for (const sec of (data.sections || [])) {
      for (const q of (sec.questions || [])) {
        const val = answers[q.code];
        if (q.type === 'number') {
          if (val !== '' && val !== undefined && val !== null) {
            const vr = q.validation_rules || {};
            if (typeof val !== 'number' || isNaN(val)) {
              errs.push(`${q.text}: valor inválido`);
              perField[q.code] = [...(perField[q.code]||[]), 'Valor inválido'];
            } else {
              if (vr.min !== undefined && val < vr.min) { errs.push(`${q.text}: menor que ${vr.min}`); perField[q.code] = [...(perField[q.code]||[]), `Debe ser ≥ ${vr.min}`]; }
              if (vr.max !== undefined && val > vr.max) { errs.push(`${q.text}: mayor que ${vr.max}`); perField[q.code] = [...(perField[q.code]||[]), `Debe ser ≤ ${vr.max}`]; }
            }
          }
        } else if (q.type === 'date') {
          const { minAttr, maxAttr } = (() => {
            const r = q.validation_rules || {};
            // reuse same logic as computeDateBounds but with current answers
            const today = new Date();
            const fmt = (d) => d.toISOString().slice(0,10);
            let minAttr = r.min_date || undefined;
            let maxAttr = r.max_date || undefined;
            if (r.not_after_today) { const t = fmt(today); maxAttr = maxAttr ? (t < maxAttr ? t : maxAttr) : t; }
            if (r.min_year) { const y = parseInt(r.min_year,10); if(!isNaN(y)){ const s = `${y}-01-01`; minAttr = minAttr ? (s>minAttr?s:minAttr) : s; } }
            if (r.max_year) { const y = parseInt(r.max_year,10); if(!isNaN(y)){ const s = `${y}-12-31`; maxAttr = maxAttr ? (s<maxAttr?s:maxAttr) : s; } }
            if (r.min_age_years) { const n=parseInt(r.min_age_years,10); if(!isNaN(n)){ const d=new Date(); d.setFullYear(d.getFullYear()-n); const s=fmt(d); maxAttr = maxAttr ? (s<maxAttr?s:maxAttr) : s; } }
            if (r.max_age_years) { const n=parseInt(r.max_age_years,10); if(!isNaN(n)){ const d=new Date(); d.setFullYear(d.getFullYear()-n); const s=fmt(d); minAttr = minAttr ? (s>minAttr?s:minAttr) : s; } }
            if (r.not_before_code && answers[r.not_before_code]) minAttr = answers[r.not_before_code];
            if (r.not_after_code && answers[r.not_after_code]) maxAttr = answers[r.not_after_code];
            return { minAttr, maxAttr };
          })();
          if (val) {
            if (minAttr && val < minAttr) { errs.push(`${q.text}: fecha antes de ${minAttr}`); perField[q.code] = [...(perField[q.code]||[]), `No antes de ${minAttr}`]; }
            if (maxAttr && val > maxAttr) { errs.push(`${q.text}: fecha después de ${maxAttr}`); perField[q.code] = [...(perField[q.code]||[]), `No después de ${maxAttr}`]; }
          }
        }
        // Require inline 'otro' text if selected (only for single choice)
        const hasOther = (q.options || []).some(op => op.is_other);
        if (hasOther) {
          const others = (q.options || []).filter(op => op.is_other).map(op => op.value);
          if ((q.type === 'single_choice' || q.type === 'choice') && others.includes(val)) {
            const t = (answers[`otro_${q.code}`] || '').toString().trim();
            if (!t) { errs.push(`${q.text}: especifique el valor de "Otro"`); perField[q.code] = [...(perField[q.code]||[]), 'Debe especificar el valor de "Otro"']; }
          }
        }
        // Required fields (only when enforcing)
        if (opts.enforceRequired && q.required) {
          const has = (() => {
            if (q.type === 'multi_choice') return Array.isArray(val) && val.length > 0;
            return val !== undefined && val !== '' && val !== null;
          })();
          if (!has) { errs.push(`${q.text}: campo obligatorio`); perField[q.code] = [...(perField[q.code]||[]), 'Campo obligatorio']; }
        }
      }
    }
    setFieldErrors(perField);
    return errs.length ? errs : null;
  };

  const handleSave = async () => {
    setSubmitErr(""); setSubmitMsg("");
    setBusySave(true);
    try {
      const errs = validateBeforeSave({ enforceRequired: false });
      if (errs && errs.length) {
        setSubmitErr(`Corrige valores inválidos antes de guardar: \n- ${errs.join('\n- ')}`);
        return;
      }
  const payload = { user_code: usuario?.codigo_estudiante || undefined, answers };
      await saveDynamicResponse(code, payload);
      setSubmitMsg("Progreso guardado.");
    } catch (e) {
      setSubmitErr(e.message || "No se pudo guardar.");
    } finally {
      setBusySave(false);
    }
  };

  const handleFinalize = async () => {
    setSubmitErr(""); setSubmitMsg("");
    setBusyFinalize(true);
    try {
      const errs = validateBeforeSave({ enforceRequired: true });
      if (errs && errs.length) {
        setSubmitErr(`Corrige antes de finalizar: \n- ${errs.join('\n- ')}`);
        return;
      }
      const payload = { user_code: usuario?.codigo_estudiante || undefined, answers };
      const res = await finalizeDynamicResponse(code, payload);
      setFinalized(true);
      const ml = res?.ml || null;
      if (ml) setMlResult(ml);
      setSubmitMsg("Cuestionario finalizado.");
    } catch (e) {
      setSubmitErr(e.message || "No se pudo finalizar.");
    } finally {
      setBusyFinalize(false);
    }
  };

  // Autosave on unload (best-effort keepalive)
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (finalized) return;
  const payload = { user_code: usuario?.codigo_estudiante || undefined, answers };
      // fire and forget; keep it quick
      saveDynamicResponseKeepAlive(code, payload);
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [finalized, answers, code, usuario]);

  if (loading) {
    return (
      <QuestionnaireContainer>
        <ContentWrapper>
          <HeaderCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <LoadingSpinner />
              <span>Cargando cuestionario...</span>
            </div>
          </HeaderCard>
        </ContentWrapper>
      </QuestionnaireContainer>
    );
  }

  if (error) {
    return (
      <QuestionnaireContainer>
        <ContentWrapper>
          <HeaderCard>
            <AlertBox variant="error">
              <XCircle size={20} />
              {error}
            </AlertBox>
          </HeaderCard>
        </ContentWrapper>
      </QuestionnaireContainer>
    );
  }

  if (!data) {
    return (
      <QuestionnaireContainer>
        <ContentWrapper>
          <HeaderCard>
            <AlertBox variant="error">
              <XCircle size={20} />
              Cuestionario no encontrado.
            </AlertBox>
          </HeaderCard>
        </ContentWrapper>
      </QuestionnaireContainer>
    );
  }

  return (
    <QuestionnaireContainer>
      {/* Floating decorative elements */}
      <FloatingElement className="atom">
        <Award size={80} color="#8B5CF6" />
      </FloatingElement>
      <FloatingElement className="beaker" duration="10s">
        <CheckCircle2 size={80} color="#10B981" />
      </FloatingElement>
      <FloatingElement className="gear" duration="12s">
        <AlertCircle size={80} color="#F59E0B" />
      </FloatingElement>

      <ContentWrapper>
        <HeaderCard>
          <BackButton onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
            Volver
          </BackButton>

          <QuestionnaireTitle>
            {data.title || code}
            <VersionBadge>v{data.version_number}</VersionBadge>
          </QuestionnaireTitle>

          {finalized && (
            <AlertBox variant="success">
              <CheckCircle2 size={20} />
              Este cuestionario fue finalizado. Estás en modo solo lectura.
            </AlertBox>
          )}
        </HeaderCard>

        {/* ML result card shown after finalize */}
        {mlResult && (
          <MLCard>
            <MLBadge $positive={mlResult.decision}>
              {mlResult.decision ? (
                <>
                  <CheckCircle2 size={24} />
                  Perfil STEM
                </>
              ) : (
                <>
                  <XCircle size={24} />
                  Perfil No STEM
                </>
              )}
            </MLBadge>

            {typeof mlResult.prob === 'number' && (
              <MLText style={{ fontWeight: 600 }}>
                Probabilidad: {(mlResult.prob * 100).toFixed(1)}%
              </MLText>
            )}

            {mlResult.status && mlResult.status !== 'ok' ? (
              <AlertBox variant="error" style={{ marginTop: '0.75rem' }}>
                <AlertCircle size={16} />
                Inferencia omitida: {mlResult.status}{mlResult.reason ? ` · ${mlResult.reason}` : ''}
                {mlResult.error && <> · {mlResult.error}</>}
              </AlertBox>
            ) : (
              (() => {
                const isPositive = mlResult.decision === true;
                const stemMeaning = 'STEM se refiere a programas en Ciencia, Tecnología, Ingeniería y Matemáticas.';
                const modelNote = 'Este resultado fue generado automáticamente a partir de tus respuestas por un modelo estadístico.';
                const commonTail = 'Tómalo como una guía para explorar; no define tu futuro.';
                const positiveMsg = `Tus respuestas muestran una alta probabilidad de afinidad con áreas STEM. ${stemMeaning} ${modelNote} ${commonTail}`;
                const negativeMsg = `Con base en tus respuestas, el modelo estima menor probabilidad de afinidad con áreas STEM. ${stemMeaning} ${modelNote} Puede que otras áreas (por ejemplo, sociales, humanidades, artes, salud, etc.) se ajusten mejor a tus intereses hoy. También puedes fortalecer tu interés por STEM con actividades y cursos si así lo deseas. ${commonTail}`;
                return (
                  <MLText>{isPositive ? positiveMsg : negativeMsg}</MLText>
                );
              })()
            )}

            {/* Optional feature debug */}
            {mlResult.features && (
              <MLDetails>
                <summary>
                  <ChevronRight size={16} />
                  Ver variables utilizadas
                </summary>
                <FeaturesGrid>
                  {Object.entries(mlResult.features).map(([k, v]) => (
                    <FeatureItem key={k}>
                      <strong>{k}</strong>
                      <span>{String(v)}</span>
                    </FeatureItem>
                  ))}
                </FeaturesGrid>
              </MLDetails>
            )}
          </MLCard>
        )}

        <form onSubmit={(e) => e.preventDefault()}>
          {data.sections?.map((sec, secIndex) => {
            const visibleQIds = visibleMap[sec.id] || [];
            const hasVisible = visibleQIds.length > 0;
            if (!hasVisible) return null;
            const isOpen = !!openSections[sec.id];
            const answeredInSec = (sec.questions || []).filter(q => visibleQIds.includes(q.id)).reduce((acc, q) => {
              const val = answers[q.code];
              const has = q.type === 'multi_choice' ? Array.isArray(val) && val.length > 0 : (val !== undefined && val !== "");
              return acc + (has ? 1 : 0);
            }, 0);
            const totalInSec = visibleQIds.length;
            const progress = totalInSec > 0 ? Math.round((answeredInSec / totalInSec) * 100) : 0;

            return (
              <SectionFieldset key={sec.id} $index={secIndex}>
                <SectionLegend
                  onClick={() => setOpenSections(prev => ({ ...prev, [sec.id]: !isOpen }))}
                  $progress={progress}
                >
                  <SectionTitleDiv>
                    <SectionName>{sec.title}</SectionName>
                    <SectionCount>{answeredInSec}/{totalInSec} respondidas</SectionCount>
                  </SectionTitleDiv>
                  <ChevronIconStyled size={24} $open={isOpen} />
                </SectionLegend>

                <SectionContent $open={isOpen}>
                  {sec.questions?.filter(q => visibleQIds.includes(q.id)).map(q => (
                    <QuestionDiv key={q.id}>
                      <QuestionLabel $required={q.required}>
                        {q.text}
                      </QuestionLabel>
                      <InputForQuestion
                        q={q}
                        value={answers[q.code]}
                        onChange={v => handleChange(q.code, v)}
                        disabled={finalized}
                        answers={answers}
                        fieldErrors={fieldErrors[q.code]}
                      />
                      {!!fieldErrors[q.code]?.length && (
                        <FieldErrorDiv>
                          <AlertCircle size={14} />
                          {fieldErrors[q.code][0]}
                        </FieldErrorDiv>
                      )}
                    </QuestionDiv>
                  ))}
                </SectionContent>
              </SectionFieldset>
            );
          })}

          {submitErr && (
            <AlertBox variant="error">
              <XCircle size={20} />
              {submitErr}
            </AlertBox>
          )}

          {submitMsg && (
            <AlertBox variant="success">
              <CheckCircle2 size={20} />
              {submitMsg}
            </AlertBox>
          )}

          <ActionBar>
            {!finalized ? (
              <>
                <SecondaryButton type="button" onClick={handleSave} disabled={busySave || busyFinalize}>
                  {busySave ? <LoadingSpinner /> : <Save size={18} />}
                  Guardar
                </SecondaryButton>
                <PrimaryButton type="button" onClick={handleFinalize} disabled={busyFinalize || busySave}>
                  {busyFinalize ? <LoadingSpinner /> : <Check size={18} />}
                  Finalizar
                </PrimaryButton>
                <CancelButton type="button" onClick={() => navigate(-1)} disabled={busySave || busyFinalize}>
                  Cancelar
                </CancelButton>
              </>
            ) : (
              <SuccessButton type="button" onClick={() => navigate(-1)}>
                <ArrowLeft size={18} />
                Volver al Dashboard
              </SuccessButton>
            )}
          </ActionBar>
        </form>
      </ContentWrapper>
    </QuestionnaireContainer>
  );
}
