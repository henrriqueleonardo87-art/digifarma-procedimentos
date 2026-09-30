import React from 'react';
import { Menu, LogOut, User as UserIcon } from 'lucide-react';
import type { AppUser } from '../types/auth';

interface NavbarProps {
  onToggleSidebarMobile?: () => void;
  currentUser?: AppUser | null;
  onLogout?: () => void;
  onChangePasswordClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebarMobile,
  currentUser,
  onLogout,
  onChangePasswordClick,
}) => {
  const displayName = currentUser?.name || 'Visitante';

  return (
    <header className="global-header no-print">
      <div className="global-header-left">
        {onToggleSidebarMobile && (
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={onToggleSidebarMobile}
            title="Abrir navegação lateral"
            aria-label="Abrir menu lateral"
          >
            <Menu size={18} />
          </button>
        )}

        <div className="global-brand-desc">
          <h1 className="header-treinamento-title">
            Olá, <span style={{ color: 'var(--red)' }}>{displayName}</span>
          </h1>
          <span className="header-treinamento-sub">
            Plataforma de Capacitação e Procedimentos Operacionais Digifarma
          </span>
        </div>
      </div>

      <div className="global-header-right">
        {currentUser && (
          <div className="header-user-pill">
            <div className="header-user-avatar" title={`Conectado como ${displayName}`}>
              <UserIcon size={14} />
              <span>{displayName}</span>
            </div>

            {onChangePasswordClick && (
              <button
                type="button"
                className="header-btn-key"
                onClick={onChangePasswordClick}
                title="Alterar minha senha"
              >
                Senha
              </button>
            )}

            {onLogout && (
              <button
                type="button"
                className="header-btn-logout"
                onClick={onLogout}
                title="Sair da conta"
                aria-label="Sair"
              >
                <LogOut size={14} />
                <span className="logout-text">Sair</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
