import React from 'react';
import {
  Monitor,
  Rocket,
  ArrowRight,
  BookOpen,
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
      <header className="portal-header-minimal">
        <div className="portal-brand-icon">
          <BookOpen size={24} color="#dc2626" />
        </div>
        <h1 className="portal-title-minimal">
          DIGI<span className="brand-dot">FARMA</span>
        </h1>
        <p className="portal-subtitle-minimal">
          Repositório de Procedimentos Operacionais Padrão (POP)
        </p>
        <span className="portal-instruction">
          Selecione a versão do sistema para acessar os manuais e rotinas operacionais:
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
