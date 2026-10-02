import React from 'react';
import { Monitor, FileText, Layers, X, Sparkles, Printer, CheckCircle2 } from 'lucide-react';
import type { ProcedureFormat, SystemVersion } from '../types/procedure';

interface NewProcedureFormatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFormat: (format: ProcedureFormat) => void;
  targetVersion?: SystemVersion;
}

export const NewProcedureFormatModal: React.FC<NewProcedureFormatModalProps> = ({
  isOpen,
  onClose,
  onSelectFormat,
  targetVersion,
}) => {
  if (!isOpen) return null;

  const versionName = targetVersion === 'classico' ? 'Digifarma Clássico' : 'Digifarma V10';

  return (
    <div className="modal-backdrop new-pop-backdrop" onClick={onClose}>
      <div
        className="format-selector-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#161a24',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '680px',
          padding: '1.4rem 1.6rem',
          boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.06)',
          animation: 'modalFadeIn 0.2s ease',
          color: '#f1f5f9',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: '#222938',
                  color: '#e2e8f0',
                  border: '1px solid #334155',
                }}
              >
                {versionName}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>• Novo Procedimento</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
              Escolha o Formato do Procedimento
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
              Defina como você deseja estruturar e utilizar este manual operacional:
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#222938',
              border: '1px solid #334155',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Grade de 3 Cards Compactos de Formato */}
        <div className="format-cards-grid">
          {/* Card 1: HTML Interativo */}
          <div
            className="format-choice-card"
            onClick={() => onSelectFormat('html')}
            style={{
              background: '#1d2332',
              border: '1.5px solid #2d374d',
              borderRadius: '12px',
              padding: '1rem 0.95rem',
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#3b82f6',
                display: 'grid',
                placeItems: 'center',
                marginBottom: '0.65rem',
              }}
            >
              <Monitor size={18} />
            </div>

            <span
              style={{
                fontSize: '0.64rem',
                fontWeight: 800,
                color: '#60a5fa',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: '2px',
              }}
            >
              Treinamento em Tela
            </span>

            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 6px 0', color: '#ffffff' }}>
              HTML Interativo
            </h3>

            <p style={{ fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.4, flex: 1, margin: '0 0 12px 0' }}>
              Navegação interativa, mãozinhas indicadoras, radar sonar, menus suspensos e exportação HTML.
            </p>

            <button
              type="button"
              className="btn secondary sm"
              style={{ width: '100%', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', padding: '6px 8px' }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectFormat('html');
              }}
            >
              <Sparkles size={12} />
              <span>Criar em HTML</span>
            </button>
          </div>

          {/* Card 2: Documento PDF Oficial */}
          <div
            className="format-choice-card"
            onClick={() => onSelectFormat('pdf')}
            style={{
              background: '#1d2332',
              border: '1.5px solid #2d374d',
              borderRadius: '12px',
              padding: '1rem 0.95rem',
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'grid',
                placeItems: 'center',
                marginBottom: '0.65rem',
              }}
            >
              <FileText size={18} />
            </div>

            <span
              style={{
                fontSize: '0.64rem',
                fontWeight: 800,
                color: '#f87171',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: '2px',
              }}
            >
              Impressão &amp; Homologação
            </span>

            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 6px 0', color: '#ffffff' }}>
              PDF Oficial (A4)
            </h3>

            <p style={{ fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.4, flex: 1, margin: '0 0 12px 0' }}>
              Design A4 Paisagem moderno full-bleed, sem páginas em branco e sem corte de textos.
            </p>

            <button
              type="button"
              className="btn secondary sm"
              style={{ width: '100%', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', padding: '6px 8px' }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectFormat('pdf');
              }}
            >
              <Printer size={12} />
              <span>Criar em PDF</span>
            </button>
          </div>

          {/* Card 3: Ambos (HTML + PDF) */}
          <div
            className="format-choice-card featured"
            onClick={() => onSelectFormat('both')}
            style={{
              background: '#1d2332',
              border: '1.5px solid var(--red)',
              borderRadius: '12px',
              padding: '1rem 0.95rem',
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              position: 'relative',
              boxShadow: '0 4px 16px rgba(239, 68, 68, 0.2)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-9px',
                right: '12px',
                background: 'var(--red)',
                color: '#fff',
                fontSize: '0.6rem',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: '999px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Recomendado
            </div>

            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'grid',
                placeItems: 'center',
                marginBottom: '0.65rem',
              }}
            >
              <Layers size={18} />
            </div>

            <span
              style={{
                fontSize: '0.64rem',
                fontWeight: 800,
                color: '#34d399',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: '2px',
              }}
            >
              Versão Completa
            </span>

            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 6px 0', color: '#ffffff' }}>
              Ambos (HTML + PDF)
            </h3>

            <p style={{ fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.4, flex: 1, margin: '0 0 12px 0' }}>
              Interatividade total em tela e impressões perfeitas em PDF moderno para auditorias.
            </p>

            <button
              type="button"
              className="btn primary sm"
              style={{ width: '100%', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', padding: '6px 8px' }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectFormat('both');
              }}
            >
              <CheckCircle2 size={12} />
              <span>Criar Completo</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #2d374d', paddingTop: '0.85rem' }}>
          <button type="button" className="btn secondary sm" style={{ fontSize: '0.78rem' }} onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
