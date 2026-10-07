import React, { useRef, useState, useEffect } from 'react';
import {
  Menu,
  LogOut,
  User as UserIcon,
  Camera,
  Bell,
  ClipboardCheck,
  StickyNote,
  LayoutDashboard,
  ChevronRight,
  X,
} from 'lucide-react';
import type { AppUser } from '../types/auth';
import { playNotificationSound } from '../lib/notificationSound';

interface NavbarProps {
  onToggleSidebarMobile?: () => void;
  currentUser?: AppUser | null;
  onLogout?: () => void;
  onUpdateAvatar?: (avatarUrl: string) => Promise<void> | void;
  pendingReviewCount?: number;
  notesNotificationCount?: number;
  onNavigate?: (view: string) => void;
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
  onNavigate,
  onOpenRevision,
  onOpenNotes,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const displayName = currentUser?.name || currentUser?.username || 'Visitante';
  const totalNotifications = pendingReviewCount + notesNotificationCount;

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleNotificationBellClick = () => {
    if (!isNotificationOpen && totalNotifications > 0) {
      playNotificationSound();
    }
    setIsNotificationOpen(!isNotificationOpen);
  };

  const handleGoTo = (view: string) => {
    setIsNotificationOpen(false);
    playNotificationSound();
    if (onNavigate) {
      onNavigate(view);
    } else if (view === 'revision' && onOpenRevision) {
      onOpenRevision();
    } else if (view === 'publicacoes' && onOpenNotes) {
      onOpenNotes();
    }
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
        {/* Notificações Interativas com Som e Redirecionamento */}
        <div style={{ position: 'relative' }} ref={notificationRef}>
          <button
            type="button"
            className={`header-btn-notification ${totalNotifications > 0 ? 'has-notifications' : ''}`}
            onClick={handleNotificationBellClick}
            title={
              totalNotifications > 0
                ? `${totalNotifications} notificações ativas`
                : 'Central de Notificações'
            }
          >
            <Bell size={18} />
            {totalNotifications > 0 && (
              <span className="notification-badge-count">{totalNotifications}</span>
            )}
          </button>

          {/* Dropdown de Notificações */}
          {isNotificationOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '320px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.14)',
                zIndex: 1000,
                overflow: 'hidden',
                animation: 'fadeIn 0.15s ease',
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  background: 'var(--bg-secondary)',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bell size={15} color="var(--red)" />
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Notificações
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNotificationOpen(false)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={15} />
                </button>
              </div>

              <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {pendingReviewCount > 0 && (
                  <div
                    onClick={() => handleGoTo('revision')}
                    role="button"
                    tabIndex={0}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-secondary)',
                      cursor: 'pointer',
                      border: '1px solid var(--border-subtle)',
                      transition: 'all 0.12s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--red)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '8px',
                          background: 'var(--red-soft)',
                          color: 'var(--red)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <ClipboardCheck size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          Revisões Pendentes
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {pendingReviewCount} procedimentos aguardando
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={14} color="var(--text-muted)" />
                  </div>
                )}

                {notesNotificationCount > 0 && (
                  <div
                    onClick={() => handleGoTo('publicacoes')}
                    role="button"
                    tabIndex={0}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-secondary)',
                      cursor: 'pointer',
                      border: '1px solid var(--border-subtle)',
                      transition: 'all 0.12s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--red)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '8px',
                          background: 'rgba(59, 130, 246, 0.12)',
                          color: '#3b82f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <StickyNote size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          Publicações Direcionadas
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {notesNotificationCount} novas para você
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={14} color="var(--text-muted)" />
                  </div>
                )}

                {/* Acesso rápido ao Mural */}
                <div
                  onClick={() => handleGoTo('mural')}
                  role="button"
                  tabIndex={0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-primary)',
                    cursor: 'pointer',
                    border: '1px solid var(--border-subtle)',
                    transition: 'all 0.12s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--red)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '8px',
                        background: 'rgba(16, 185, 129, 0.12)',
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <LayoutDashboard size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Mural de Atividades
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Acompanhe tarefas e andamento
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </div>

                {totalNotifications === 0 && (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    Nenhuma notificação pendente no momento.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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
