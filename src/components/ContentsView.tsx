import React from 'react';
import { Rocket, Monitor, ArrowRight, BookOpen } from 'lucide-react';
import type { Procedure } from '../types/procedure';

interface ContentsViewProps {
  procedures: Procedure[];
  onSelectVersion: (version: 'v10' | 'r78') => void;
  onBackToDashboard?: () => void;
}

export const ContentsView: React.FC<ContentsViewProps> = ({
  procedures,
  onSelectVersion,
}) => {
  const v10Count = procedures.filter(
    (p) => (p.status === 'aprovado' || !p.status) && (p.systemVersion === 'v10' || !p.systemVersion)
  ).length;

  const classicoCount = procedures.filter(
    (p) => (p.status === 'aprovado' || !p.status) && (p.systemVersion === 'classico' || p.systemVersion === 'r78')
  ).length;

  return (
    <div className="modules-drilldown-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Topo Limpo e Minimalista */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--red-soft)',
            color: 'var(--red)',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.74rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            marginBottom: '10px',
          }}
        >
          <BookOpen size={13} />
          <span>REPOSITÓRIO DE PROCEDIMENTOS</span>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
          Conteúdos Operacionais
        </h1>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '520px', marginInline: 'auto' }}>
          Selecione a versão do sistema para consultar os módulos e procedimentos operacionais padronizados.
        </p>
      </div>

      {/* 2 Cards de Versão em Destaque */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Card Digifarma v10 */}
        <div
          onClick={() => onSelectVersion('v10')}
          role="button"
          tabIndex={0}
          style={{
            background: 'var(--bg-primary)',
            border: '1.5px solid var(--border)',
            borderRadius: '18px',
            padding: '28px 24px',
            cursor: 'pointer',
            transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: 'var(--shadow-subtle)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '260px',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--red)';
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 30px rgba(231, 76, 60, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'var(--shadow-subtle)';
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: 'var(--red-soft)',
                  color: 'var(--red)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Rocket size={28} />
              </div>

              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  background: 'rgba(59, 130, 246, 0.12)',
                  color: '#3b82f6',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  letterSpacing: '0.04em',
                }}
              >
                v10
              </span>
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0', letterSpacing: '-0.01em' }}>
              Digifarma v10
            </h2>

            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Rotinas e procedimentos operacionais padronizados da versão v10. Manuais em PDF e formato interativo HTML.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border)',
            }}
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {v10Count} {v10Count === 1 ? 'procedimento ativo' : 'procedimentos ativos'}
            </span>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.84rem',
                fontWeight: 800,
                color: 'var(--red)',
              }}
            >
              <span>Acessar Módulos</span>
              <ArrowRight size={15} />
            </span>
          </div>
        </div>

        {/* Card Digifarma Clássico */}
        <div
          onClick={() => onSelectVersion('r78')}
          role="button"
          tabIndex={0}
          style={{
            background: 'var(--bg-primary)',
            border: '1.5px solid var(--border)',
            borderRadius: '18px',
            padding: '28px 24px',
            cursor: 'pointer',
            transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: 'var(--shadow-subtle)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '260px',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--red)';
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 30px rgba(231, 76, 60, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'var(--shadow-subtle)';
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: 'var(--red-soft)',
                  color: 'var(--red)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Monitor size={28} />
              </div>

              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: 'var(--red)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  letterSpacing: '0.04em',
                }}
              >
                Clássico
              </span>
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0', letterSpacing: '-0.01em' }}>
              Digifarma Clássico
            </h2>

            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Rotinas operacionais e documentação técnica da versão clássica do ERP Digifarma.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border)',
            }}
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {classicoCount} {classicoCount === 1 ? 'procedimento ativo' : 'procedimentos ativos'}
            </span>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.84rem',
                fontWeight: 800,
                color: 'var(--red)',
              }}
            >
              <span>Acessar Módulos</span>
              <ArrowRight size={15} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
