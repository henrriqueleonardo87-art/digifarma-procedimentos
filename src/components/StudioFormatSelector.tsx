import React from 'react';
import { FileText, Monitor, Layers, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import type { ProcedureFormat } from '../types/procedure';

interface StudioFormatSelectorProps {
  onSelectFormat: (format: ProcedureFormat) => void;
  onBack: () => void;
}

export const StudioFormatSelector: React.FC<StudioFormatSelectorProps> = ({
  onSelectFormat,
  onBack,
}) => {
  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '24px 16px 48px 16px' }}>
      {/* Botão de Retorno e Header */}
      <div style={{ marginBottom: '28px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '6px 14px',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            marginBottom: '16px',
            transition: 'all 0.15s ease',
          }}
        >
          <ArrowLeft size={14} />
          <span>Voltar ao Início</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '2px 8px',
              borderRadius: '6px',
              background: 'var(--red-soft)',
              color: 'var(--red)',
              border: '1px solid rgba(237, 38, 43, 0.2)',
            }}
          >
            DIGIFARMA STUDIO
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>• Escolha de Arquitetura</span>
        </div>

        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
          Qual formato você deseja criar?
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '720px', lineHeight: 1.5 }}>
          Selecione a estrutura documental do procedimento antes de abrir o editor. Você poderá configurar telas, blocos de instruções, checklist e regras BPF.
        </p>
      </div>

      {/* Grade de 3 Cards de Seleção de Formato */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Card 1: HTML Interativo */}
        <div
          onClick={() => onSelectFormat('html')}
          role="button"
          tabIndex={0}
          style={{
            background: 'var(--bg-primary)',
            border: '1.5px solid var(--border)',
            borderRadius: '16px',
            padding: '26px 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 12px 28px rgba(59, 130, 246, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.03)';
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  background: 'rgba(59, 130, 246, 0.12)',
                  color: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                }}
              >
                <Monitor size={26} />
              </div>

              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '3px 9px',
                  borderRadius: '999px',
                  background: 'rgba(59, 130, 246, 0.12)',
                  color: '#3b82f6',
                  letterSpacing: '0.04em',
                }}
              >
                WEB INTERATIVO
              </span>
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              Manual HTML
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 18px 0' }}>
              Documento digital dinâmico com navegação passo a passo, screenshots ampliáveis em lightbox e simulação de rotinas do sistema.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={14} color="#3b82f6" />
                <span>Navegação instantânea em qualquer navegador</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={14} color="#3b82f6" />
                <span>Checklist de conclusão etapa por etapa</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={14} color="#3b82f6" />
                <span>Excelente para treinamento presencial ou remoto</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.12)',
              color: '#3b82f6',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>Iniciar no Modo HTML</span>
            <span>➔</span>
          </button>
        </div>

        {/* Card 2: PDF Oficial */}
        <div
          onClick={() => onSelectFormat('pdf')}
          role="button"
          tabIndex={0}
          style={{
            background: 'var(--bg-primary)',
            border: '1.5px solid var(--border)',
            borderRadius: '16px',
            padding: '26px 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--red)';
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 12px 28px rgba(237, 38, 43, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.03)';
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  background: 'var(--red-soft)',
                  color: 'var(--red)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(237, 38, 43, 0.25)',
                }}
              >
                <FileText size={26} />
              </div>

              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '3px 9px',
                  borderRadius: '999px',
                  background: 'var(--red-soft)',
                  color: 'var(--red)',
                  letterSpacing: '0.04em',
                }}
              >
                BPF &amp; AUDITORIA
              </span>
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              Documento PDF Oficial
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 18px 0' }}>
              Formatação técnica institucional para impressão e arquivo legal. Ideal para Procedimentos Operacionais Padrão (POP) e auditorias de vigilância sanitária.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={14} color="var(--red)" />
                <span>Diagramação padrão A4 pronta para impressão</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={14} color="var(--red)" />
                <span>Homologação com assinaturas do RT e gerência</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={14} color="var(--red)" />
                <span>Cabeçalho institucional e numeração de controle</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: '8px',
              background: 'var(--red)',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(237, 38, 43, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            <span>Iniciar no Modo PDF</span>
            <span>➔</span>
          </button>
        </div>

        {/* Card 3: Ambos (Híbrido) */}
        <div
          onClick={() => onSelectFormat('both')}
          role="button"
          tabIndex={0}
          style={{
            background: 'var(--bg-primary)',
            border: '1.5px solid var(--border)',
            borderRadius: '16px',
            padding: '26px 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#8b5cf6';
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 12px 28px rgba(139, 92, 246, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.03)';
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  background: 'rgba(139, 92, 246, 0.12)',
                  color: '#8b5cf6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(139, 92, 246, 0.25)',
                }}
              >
                <Layers size={26} />
              </div>

              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '3px 9px',
                  borderRadius: '999px',
                  background: 'rgba(139, 92, 246, 0.12)',
                  color: '#8b5cf6',
                  letterSpacing: '0.04em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Sparkles size={11} /> RECOMENDADO
              </span>
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              Híbrido (PDF + HTML)
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 18px 0' }}>
              O melhor dos dois formatos. O repositório armazena tanto o documento oficial para download quanto o passo a passo interativo no navegador.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={14} color="#8b5cf6" />
                <span>Alternância fluida entre leitor PDF e visualizador HTML</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={14} color="#8b5cf6" />
                <span>Permite anexar PDFs externos ou gerar manuais web</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#8b5cf6' }}>
                <CheckCircle2 size={14} color="#8b5cf6" />
                <span>Flexibilidade máxima para implantação e suporte</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: '8px',
              background: 'rgba(139, 92, 246, 0.12)',
              color: '#8b5cf6',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>Iniciar Modo Híbrido</span>
            <span>➔</span>
          </button>
        </div>
      </div>
    </div>
  );
};
