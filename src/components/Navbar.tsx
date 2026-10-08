import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  Menu,
  LogOut,
  User as UserIcon,
  Bell,
  ClipboardCheck,
  StickyNote,
  LayoutDashboard,
  X,
  MessageSquare,
  AlertTriangle,
  Lightbulb,
  CheckCheck,
} from 'lucide-react';
import type { AppUser } from '../types/auth';
import type { AppNotification } from '../lib/notificationService';
import { playNotificationSound } from '../lib/notificationSound';
import {
  getDesktopNotificationPermission,
  requestDesktopNotificationPermission,
  sendTestDesktopNotification,
} from '../lib/desktopNotification';

interface NavbarProps {
  currentView?: string;
  onToggleSidebarMobile?: () => void;
  currentUser?: AppUser | null;
  onLogout?: () => void;
  onUpdateAvatar?: (avatarUrl: string) => Promise<void> | void;
  pendingReviewCount?: number;
  notesNotificationCount?: number;
  onNavigate?: (view: string, targetId?: string) => void;
  onOpenRevision?: () => void;
  onOpenNotes?: () => void;
  notifications?: AppNotification[];
  onNotificationClick?: (notif: AppNotification) => void;
  onClearAllNotifications?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView = 'dashboard',
  onToggleSidebarMobile,
  currentUser,
  onLogout,
  onUpdateAvatar,
  pendingReviewCount: _pendingReviewCount = 0,
  notesNotificationCount: _notesNotificationCount = 0,
  onNavigate: _onNavigate,
  onOpenRevision: _onOpenRevision,
  onOpenNotes: _onOpenNotes,
  notifications = [],
  onNotificationClick,
  onClearAllNotifications,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [desktopPermission, setDesktopPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    getDesktopNotificationPermission()
  );

  useEffect(() => {
    if (isNotificationOpen) {
      setDesktopPermission(getDesktopNotificationPermission());
    }
  }, [isNotificationOpen]);

  const displayName = currentUser?.name || currentUser?.username || 'Visitante';
  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.isRead),
    [notifications]
  );
  const totalNotifications = unreadNotifications.length;

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

  const eyebrowText = useMemo(() => {
    switch (currentView) {
      case 'conteudos':
      case 'v10':
      case 'r78':
        return 'DIGIFARMA / CONTEÚDOS';
      case 'arquivos':
        return 'DIGIFARMA / ARQUIVOS';
      case 'publicacoes':
        return 'DIGIFARMA / RECADOS';
      case 'mural':
        return 'DIGIFARMA / MURAL';
      case 'revision':
        return 'DIGIFARMA / REVISÕES';
      case 'utilitarios':
        return 'DIGIFARMA / UTILITÁRIOS';
      case 'studio':
      case 'editor':
        return 'DIGIFARMA / STUDIO';
      case 'config':
        return 'DIGIFARMA / CONFIGURAÇÕES';
      case 'procedure-detail':
        return 'DIGIFARMA / PROCEDIMENTO';
      default:
        return 'DIGIFARMA / GESTÃO';
    }
  }, [currentView]);

  const privateTagText = useMemo(() => {
    switch (currentView) {
      case 'conteudos':
      case 'v10':
      case 'r78':
        return 'Repositório de POPs';
      case 'arquivos':
        return 'Explorador';
      case 'publicacoes':
        return 'Mural de Recados';
      case 'mural':
        return 'Quadro de Tarefas';
      case 'revision':
        return 'Homologação';
      case 'utilitarios':
        return 'Ferramentas';
      case 'studio':
      case 'editor':
        return 'Editor Oficial';
      case 'config':
        return 'Parâmetros';
      default:
        return 'Painel privado';
    }
  }, [currentView]);

  return (
    <header className="topbar no-print">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onToggleSidebarMobile && (
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={onToggleSidebarMobile}
            title="Abrir navegação lateral"
            aria-label="Abrir menu lateral"
            style={{
              border: '1px solid var(--line)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              borderRadius: '8px',
              padding: '6px 8px',
              cursor: 'pointer',
              display: 'none',
            }}
          >
            <Menu size={18} />
          </button>
        )}

        <div>
          <span className="eyebrow">{eyebrowText}</span>
          <span className="private-tag">{privateTagText}</span>
        </div>
      </div>

      <div className="top-actions">
        {/* Notificações Interativas com Som e Redirecionamento */}
        <div style={{ position: 'relative' }} ref={notificationRef}>
          <button
            type="button"
            className="button subtle"
            onClick={handleNotificationBellClick}
            title={
              totalNotifications > 0
                ? `${totalNotifications} notificações ativas`
                : 'Central de Notificações'
            }
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Bell size={13} color={totalNotifications > 0 ? 'var(--red)' : '#627086'} />
            <span>Notificações</span>
            {totalNotifications > 0 && (
              <span
                style={{
                  background: 'var(--red)',
                  color: '#ffffff',
                  fontSize: '9px',
                  fontWeight: 700,
                  borderRadius: '999px',
                  padding: '2px 5px',
                  lineHeight: 1,
                }}
              >
                {totalNotifications}
              </span>
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
                  {totalNotifications > 0 && (
                    <span
                      style={{
                        background: 'var(--red)',
                        color: '#fff',
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '10px',
                      }}
                    >
                      {totalNotifications}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {totalNotifications > 0 && onClearAllNotifications && (
                    <button
                      type="button"
                      onClick={() => {
                        onClearAllNotifications();
                        playNotificationSound();
                      }}
                      title="Marcar todas como lidas"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: 'var(--muted)',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <CheckCheck size={13} />
                      <span>Limpar</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsNotificationOpen(false)}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              <div
                style={{
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  maxHeight: '380px',
                  overflowY: 'auto',
                }}
              >
                {unreadNotifications.length > 0 ? (
                  unreadNotifications.map((notif) => {
                    const icon =
                      notif.type === 'publicacao' ? (
                        <StickyNote size={15} color="var(--red)" />
                      ) : notif.type === 'comment' ? (
                        <MessageSquare size={15} color="#3b82f6" />
                      ) : notif.type === 'revision' ? (
                        <ClipboardCheck size={15} color="#10b981" />
                      ) : notif.type === 'rejection' ? (
                        <AlertTriangle size={15} color="#f59e0b" />
                      ) : notif.type === 'sugestao' ? (
                        <Lightbulb size={15} color="#8b5cf6" />
                      ) : (
                        <LayoutDashboard size={15} color="#059669" />
                      );

                    return (
                      <div
                        key={notif.id}
                        onClick={() => {
                          setIsNotificationOpen(false);
                          playNotificationSound();
                          onNotificationClick?.(notif);
                        }}
                        role="button"
                        tabIndex={0}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          transition: 'all 0.12s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--bg-hover)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--bg-secondary)';
                        }}
                      >
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            background: 'var(--bg-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '2px',
                          }}
                        >
                          {icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '6px',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                color: 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {notif.title}
                            </span>
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: 'var(--red)',
                                flexShrink: 0,
                              }}
                            />
                          </div>
                          <p
                            style={{
                              margin: '2px 0 0 0',
                              fontSize: '0.74rem',
                              color: 'var(--text-secondary)',
                              lineHeight: 1.35,
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                            }}
                          >
                            {notif.message}
                          </p>
                          <span
                            style={{
                              fontSize: '0.67rem',
                              color: 'var(--text-muted)',
                              display: 'block',
                              marginTop: '3px',
                            }}
                          >
                            {new Date(notif.createdAt).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div
                    style={{
                      padding: '28px 16px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '0.82rem',
                    }}
                  >
                    <CheckCheck size={28} color="#10b981" style={{ marginBottom: '8px', opacity: 0.85 }} />
                    <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                      Tudo em dia!
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Nenhuma pendência ou notificação no momento.
                    </p>
                  </div>
                )}
              </div>

              {/* Rodapé: Notificações do Windows */}
              <div
                style={{
                  padding: '9px 12px',
                  background: 'var(--bg-secondary)',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: desktopPermission === 'granted' ? '#10b981' : '#f59e0b',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: '0.71rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {desktopPermission === 'granted'
                      ? 'Notificações Windows ativas'
                      : desktopPermission === 'denied'
                      ? 'Notificações bloqueadas'
                      : 'Notificações Windows'}
                  </span>
                </div>
                {desktopPermission === 'granted' ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await sendTestDesktopNotification();
                    }}
                    title="Dispara um alerta de teste nativo no Windows"
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: 'var(--red)',
                      background: 'transparent',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      padding: '3px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    Testar no Windows
                  </button>
                ) : desktopPermission === 'denied' ? (
                  <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>
                    Ver permissões do navegador
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await requestDesktopNotificationPermission();
                      setDesktopPermission(res);
                      if (res === 'granted') {
                        await sendTestDesktopNotification();
                      }
                    }}
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      background: 'var(--red)',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px 9px',
                      borderRadius: '6px',
                    }}
                  >
                    Ativar no Windows
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {currentUser && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#fff',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              padding: '4px 10px 4px 6px',
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarFileChange}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              title="Clique para importar/alterar sua foto de perfil"
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                overflow: 'hidden',
                cursor: 'pointer',
                background: 'var(--red-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--red)',
                flexShrink: 0,
              }}
            >
              {currentUser.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={displayName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <UserIcon size={12} />
              )}
            </div>

            <span style={{ fontSize: '11px', fontWeight: 650, color: 'var(--ink)' }}>
              {displayName}
            </span>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Sair da conta"
                aria-label="Sair"
                style={{
                  border: 'none',
                  background: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  marginLeft: '4px',
                }}
              >
                <LogOut size={12} />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
