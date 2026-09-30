import React, { useRef } from 'react';
import { Menu, LogOut, User as UserIcon, Camera, Bell } from 'lucide-react';
import type { AppUser } from '../types/auth';

interface NavbarProps {
  onToggleSidebarMobile?: () => void;
  currentUser?: AppUser | null;
  onLogout?: () => void;
  onUpdateAvatar?: (avatarUrl: string) => Promise<void> | void;
  pendingReviewCount?: number;
  onOpenRevision?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebarMobile,
  currentUser,
  onLogout,
  onUpdateAvatar,
  pendingReviewCount = 0,
  onOpenRevision,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const displayName = currentUser?.name || currentUser?.username || 'Visitante';

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result && onUpdateAvatar) {
        onUpdateAvatar(result);
      }
    };
    reader.readAsDataURL(file);
  };

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
        {/* Notificações de Revisões Pendentes */}
        <button
          type="button"
          className={`header-btn-notification ${pendingReviewCount > 0 ? 'has-notifications' : ''}`}
          onClick={onOpenRevision}
          title={
            pendingReviewCount > 0
              ? `${pendingReviewCount} procedimento(s) pendente(s) de revisão e homologação`
              : 'Nenhum procedimento pendente de revisão'
          }
        >
          <Bell size={18} />
          {pendingReviewCount > 0 && (
            <span className="notification-badge-count">{pendingReviewCount}</span>
          )}
        </button>

        {currentUser && (
          <div className="header-user-pill">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarFileChange}
            />

            <div
              className="header-user-avatar-wrap"
              onClick={() => fileInputRef.current?.click()}
              title="Clique para importar/alterar sua foto de perfil"
            >
              {currentUser.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={displayName}
                  className="header-avatar-img"
                />
              ) : (
                <div className="header-avatar-circle">
                  <UserIcon size={14} />
                </div>
              )}
              <div className="header-avatar-camera-badge" title="Importar foto">
                <Camera size={9} />
              </div>
            </div>

            <span className="header-username-text">{displayName}</span>

            {onLogout && (
              <button
                type="button"
                className="header-btn-logout"
                onClick={onLogout}
                title="Sair da conta"
                aria-label="Sair"
              >
                <LogOut size={13} />
                <span className="logout-text">Sair</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
