import React from 'react';
import { Rocket, Monitor, ArrowRight } from 'lucide-react';
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
    <>
      <section className="heading">
        <div>
          <span className="eyebrow">REPOSITÓRIO &amp; MÓDULOS</span>
          <h1 id="pageTitle">Conteúdos Operacionais</h1>
          <p id="pageSubtitle">Selecione a versão do sistema para consultar os módulos e manuais homologados.</p>
        </div>
        <div className="capture">
          <span className="live-dot" /> 2 Ambientes ativos
          <span>Digifarma v10 &amp; Clássico</span>
        </div>
      </section>

      <div className="grid equal">
        {/* Card Digifarma v10 */}
        <div
          className="panel"
          onClick={() => onSelectVersion('v10')}
          role="button"
          tabIndex={0}
          style={{
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '260px',
            transition: 'border-color 0.2s ease, transform 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--red)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--line)';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '11px',
                  background: 'var(--red-soft)',
                  color: 'var(--red)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Rocket size={24} />
              </div>

              <span className="tag" style={{ background: '#fff0f0', color: 'var(--red)' }}>
                Versão Principal
              </span>
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px', color: 'var(--ink)' }}>
              Digifarma v10
            </h2>

            <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
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
              borderTop: '1px solid var(--line)',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)' }}>
              {v10Count} {v10Count === 1 ? 'procedimento ativo' : 'procedimentos ativos'}
            </span>

            <span className="button primary" style={{ padding: '8px 14px', fontSize: '11px' }}>
              <span>Acessar Módulos</span>
              <ArrowRight size={13} />
            </span>
          </div>
        </div>

        {/* Card Digifarma Clássico */}
        <div
          className="panel"
          onClick={() => onSelectVersion('r78')}
          role="button"
          tabIndex={0}
          style={{
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '260px',
            transition: 'border-color 0.2s ease, transform 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--red)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--line)';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '11px',
                  background: 'rgba(22, 38, 58, 0.06)',
                  color: 'var(--ink)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Monitor size={24} />
              </div>

              <span className="tag">
                Legado Homologado
              </span>
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px', color: 'var(--ink)' }}>
              Digifarma Clássico
            </h2>

            <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
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
              borderTop: '1px solid var(--line)',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)' }}>
              {classicoCount} {classicoCount === 1 ? 'procedimento ativo' : 'procedimentos ativos'}
            </span>

            <span className="button subtle" style={{ padding: '8px 14px', fontSize: '11px' }}>
              <span>Acessar Módulos</span>
              <ArrowRight size={13} />
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
