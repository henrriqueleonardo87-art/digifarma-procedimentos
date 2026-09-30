import React from 'react';
import { Menu } from 'lucide-react';

interface NavbarProps {
  onToggleSidebarMobile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebarMobile }) => {
  return (
    <header className="global-header no-print">
      <div className="global-header-left">
        {onToggleSidebarMobile && (
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={onToggleSidebarMobile}
            title="Abrir navegação lateral"
          >
            <Menu size={18} />
          </button>
        )}

        <div className="global-brand-desc">
          <h1 className="header-treinamento-title">Treinamento</h1>
          <span className="header-treinamento-sub">
            Plataforma de Capacitação e Procedimentos Operacionais Digifarma
          </span>
        </div>
      </div>

      <div className="global-header-right">
        <span className="header-badge-status">Digifarma ERP · Base Oficial</span>
      </div>
    </header>
  );
};
