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
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="format-selector-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '820px',
          padding: '2rem',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)',
          animation: 'modalFadeIn 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                }}
              >
                {versionName}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>• Novo Procedimento</span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Escolha o Formato do Procedimento
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '6px 0 0 0' }}>
              Defina como você deseja estruturar e utilizar este manual operacional:
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Grade de 3 Cards de Formato */}
        <div className="format-cards-grid">
          {/* Card 1: HTML Interativo */}
          <div
            className="format-choice-card"
            onClick={() => onSelectFormat('html')}
            style={{
              background: 'var(--bg-tertiary)',
              border: '2px solid var(--border)',
              borderRadius: '14px',
              padding: '1.35rem 1.15rem',
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.12)',
                color: '#3b82f6',
                display: 'grid',
                placeItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <Monitor size={22} />
            </div>

            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: '#3b82f6',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              Treinamento em Tela
            </span>

            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
              HTML Interativo
            </h3>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, flex: 1, margin: '0 0 16px 0' }}>
              Roteiro dinâmico com navegação em tela, mãozinhas indicadoras, radar sonar, menus suspensos e exportação de arquivo HTML independente.
            </p>

            <button
              type="button"
              className="btn secondary sm"
              style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectFormat('html');
              }}
            >
              <Sparkles size={13} />
              <span>Criar em HTML</span>
            </button>
          </div>

          {/* Card 2: Documento PDF Oficial */}
          <div
            className="format-choice-card"
            onClick={() => onSelectFormat('pdf')}
            style={{
              background: 'var(--bg-tertiary)',
              border: '2px solid var(--border)',
              borderRadius: '14px',
              padding: '1.35rem 1.15rem',
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(231, 76, 60, 0.12)',
                color: 'var(--red)',
                display: 'grid',
                placeItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <FileText size={22} />
            </div>

            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: 'var(--red)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              Impressão &amp; Homologação
            </span>

            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
              PDF Oficial (A4)
            </h3>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, flex: 1, margin: '0 0 16px 0' }}>
              Layout moderno com design visual idêntico ao HTML, ajustado com precisão milimétrica em A4 Paisagem, sem páginas em branco e sem corte de textos.
            </p>

            <button
              type="button"
              className="btn secondary sm"
              style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectFormat('pdf');
              }}
            >
              <Printer size={13} />
              <span>Criar em PDF</span>
            </button>
          </div>

          {/* Card 3: Ambos (HTML + PDF) */}
          <div
            className="format-choice-card featured"
            onClick={() => onSelectFormat('both')}
            style={{
              background: 'var(--bg-tertiary)',
              border: '2px solid var(--red)',
              borderRadius: '14px',
              padding: '1.35rem 1.15rem',
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              position: 'relative',
              boxShadow: '0 4px 16px rgba(231, 76, 60, 0.15)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-10px',
                right: '14px',
                background: 'var(--red)',
                color: '#fff',
                fontSize: '0.64rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '999px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Recomendado
            </div>

            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                display: 'grid',
                placeItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <Layers size={22} />
            </div>

            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: '#10b981',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              Versão Completa
            </span>

            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
              Ambos (HTML + PDF)
            </h3>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, flex: 1, margin: '0 0 16px 0' }}>
              Manual completo e unificado: visualize com interatividade total em tela e gere impressões perfeitas em PDF moderno a qualquer momento.
            </p>

            <button
              type="button"
              className="btn primary sm"
              style={{ width: '100%', justifyContent: 'center', fontWeight: 800 }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectFormat('both');
              }}
            >
              <CheckCircle2 size={13} />
              <span>Criar Completo</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <button type="button" className="btn secondary sm" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
