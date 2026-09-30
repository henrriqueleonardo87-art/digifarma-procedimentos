import React from 'react';
import {
  Monitor,
  Rocket,
  ArrowRight,
} from 'lucide-react';
import type { SystemVersion, Procedure } from '../types/procedure';

interface VersionSelectScreenProps {
  procedures: Procedure[];
  onSelectVersion: (version: SystemVersion) => void;
}

export const VersionSelectScreen: React.FC<VersionSelectScreenProps> = ({
  procedures,
  onSelectVersion,
}) => {
  const countClassico = procedures.filter(
    (p) => p.systemVersion === 'classico' || p.systemVersion === 'ambos' || !p.systemVersion
  ).length;

  const countV10 = procedures.filter(
    (p) => p.systemVersion === 'v10' || p.systemVersion === 'ambos'
  ).length;

  return (
    <div className="version-portal-minimal">
      {/* Cabeçalho Minimalista */}
      {/* Cabeçalho no Padrão V10 */}
      <header className="portal-header-minimal">
        <p className="eyebrow" style={{ justifyContent: 'center', marginBottom: '10px' }}>
          <span className="num">DIGIFARMA V10</span>
          <span>REPOSITÓRIO OFICIAL DE MANUAIS POP</span>
        </p>
        <div className="logo" style={{ fontSize: 'clamp(36px, 6vw, 54px)', marginBottom: '8px', textAlign: 'center' }}>
          <span className="a" style={{ color: 'var(--text-secondary)' }}>Digi</span>
          <span className="b" style={{ color: 'var(--red)', fontWeight: 800 }}>farma</span>{' '}
          <span
            style={{
              fontSize: '0.38em',
              fontWeight: 800,
              letterSpacing: '0.25em',
              color: 'var(--red)',
              verticalAlign: 'middle',
              border: '1.5px solid var(--red)',
              borderRadius: '999px',
              padding: '3px 12px',
              background: 'var(--red-soft)',
            }}
          >
            V10
          </span>
        </div>
        <p className="portal-subtitle-minimal lead" style={{ textAlign: 'center', maxWidth: '60ch', margin: '0 auto 12px' }}>
          Uma nova experiência em gestão farmacêutica e procedimentos operacionais padrão.
        </p>
        <span className="portal-instruction" style={{ textAlign: 'center' }}>
          Selecione a versão do sistema para acessar as rotinas e procedimentos homologados:
        </span>
      </header>

      {/* Grid com os 2 Cards Elegantes */}
      <div className="version-cards-grid-minimal">
        {/* CARD 1: DIGIFARMA CLÁSSICO */}
        <div
          className="version-card-minimal"
          onClick={() => onSelectVersion('classico')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelectVersion('classico')}
        >
          <div className="card-minimal-top">
            <div className="card-minimal-icon classico">
              <Monitor size={28} />
            </div>
            <span className="card-minimal-count">
              {countClassico} {countClassico === 1 ? 'manual' : 'manuais'}
            </span>
          </div>

          <div className="card-minimal-body">
            <span className="card-minimal-tag">Versão Desktop</span>
            <h2 className="card-minimal-title">Digifarma Clássico</h2>
            <p className="card-minimal-desc">
              Rotinas operacionais da retaguarda tradicional desktop: atalhos F2/F5/F10, cadastro de produtos, importação de XML de notas fiscais e relatórios gerenciais.
            </p>
          </div>

          <div className="card-minimal-footer">
            <span className="card-access-text">Acessar Manuais Clássico</span>
            <ArrowRight size={16} className="card-access-arrow" />
          </div>
        </div>

        {/* CARD 2: DIGIFARMA V10 */}
        <div
          className="version-card-minimal"
          onClick={() => onSelectVersion('v10')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelectVersion('v10')}
        >
          <div className="card-minimal-top">
            <div className="card-minimal-icon v10">
              <Rocket size={28} />
            </div>
            <span className="card-minimal-count">
              {countV10} {countV10 === 1 ? 'manual' : 'manuais'}
            </span>
          </div>

          <div className="card-minimal-body">
            <span className="card-minimal-tag tag-v10">Plataforma Web & Cloud</span>
            <h2 className="card-minimal-title">Digifarma V10</h2>
            <p className="card-minimal-desc">
              Plataforma em nuvem de nova geração: navegação web ágil, catálogo com busca inteligente, PDV Web integrado com PIX dinâmico e dashboards analíticos.
            </p>
          </div>

          <div className="card-minimal-footer">
            <span className="card-access-text">Acessar Manuais V10</span>
            <ArrowRight size={16} className="card-access-arrow" />
          </div>
        </div>
      </div>

      <footer className="portal-footer-minimal">
        <span>Digifarma ERP • Gestão Farmacêutica Profissional</span>
      </footer>
    </div>
  );
};
