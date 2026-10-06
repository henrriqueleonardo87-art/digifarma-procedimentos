import React, { useRef } from 'react';
import { Menu, LogOut, User as UserIcon, Camera, Bell } from 'lucide-react';
import type { AppUser } from '../types/auth';

interface NavbarProps {
  onToggleSidebarMobile?: () => void;
  currentUser?: AppUser | null;
  onLogout?: () => void;
  onUpdateAvatar?: (avatarUrl: string) => Promise<void> | void;
  pendingReviewCount?: number;
  notesNotificationCount?: number;
  onOpenRevision?: () => void;
  onOpenNotes?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebarMobile,
  currentUser,
  onLogout,
  onUpdateAvatar,
  pendingReviewCount = 0,
  notesNotificationCount = 0,
  onOpenRevision,
  onOpenNotes,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const displayName = currentUser?.name || currentUser?.username || 'Visitante';
  const totalNotifications = pendingReviewCount + notesNotificationCount;

  const handleNotificationClick = () => {
    if (notesNotificationCount > 0 && pendingReviewCount === 0 && onOpenNotes) {
      onOpenNotes();
    } else if (onOpenRevision) {
      onOpenRevision();
    }
  };

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
            Painel do Treinador · Capacitação e Procedimentos Digifarma
          </span>
        </div>
      </div>

      <div className="global-header-right">
        {/* Notificações de Revisões Pendentes e Recados */}
        <button
          type="button"
          className={`header-btn-notification ${totalNotifications > 0 ? 'has-notifications' : ''}`}
          onClick={handleNotificationClick}
          title={
            totalNotifications > 0
              ? `${pendingReviewCount > 0 ? `${pendingReviewCount} revisão(ões)` : ''}${pendingReviewCount > 0 && notesNotificationCount > 0 ? ' e ' : ''}${notesNotificationCount > 0 ? `${notesNotificationCount} anotação(ões) para você` : ''}`
              : 'Nenhuma notificação no momento'
          }
        >
          <Bell size={18} />
          {totalNotifications > 0 && (
            <span className="notification-badge-count">{totalNotifications}</span>
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
