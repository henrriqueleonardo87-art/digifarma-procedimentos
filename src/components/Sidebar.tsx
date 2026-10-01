import React from 'react';
import { ChevronLeft, ChevronRight, LogOut, ClipboardCheck, Sliders } from 'lucide-react';
import type { AppUser } from '../types/auth';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  currentUser?: AppUser | null;
  onLogout?: () => void;
  pendingReviewCount?: number;
}

function navIcon(name: string) {
  const paths: Record<string, string> = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2.6V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H6v-2.6h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.6v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v2.6h-.2a1.7 1.7 0 0 0-1.6 1z"/>',
  };
  return (
    <svg
      className="nav-svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: paths[name] || paths.grid }}
    />
  );
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onChangeView,
  darkMode,
  onToggleDarkMode,
  isOpenMobile,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
  currentUser,
  onLogout,
  pendingReviewCount = 0,
}) => {
  const handleNavClick = (view: string) => {
    onChangeView(view);
    onCloseMobile?.();
  };

  return (
    <aside
      className={`sidebar no-print ${isOpenMobile ? 'mobile-open' : ''} ${
        isCollapsed ? 'collapsed' : ''
      }`}
      id="sidebar"
    >
      {/* Brand Header com Botão de Recolher no Topo */}
      <div className="brand">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isCollapsed ? '0' : '0.65rem',
            cursor: 'pointer',
            flex: 1,
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            overflow: 'hidden',
          }}
          onClick={() => handleNavClick('dashboard')}
          title="Digifarma - Início"
        >
          <div className="brand-logo-icon">
            <span style={{ color: 'var(--red)', fontWeight: 900, fontSize: '1.25rem' }}>D</span>
          </div>
          {!isCollapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div className="name">Digifarma</div>
              <div className="sub brand-product">Treinamento & POPs</div>
            </div>
          )}
        </div>

        {/* Botão de Recolher / Expandir no Topo com ícone de seta */}
        {onToggleCollapse && (
          <button
            type="button"
            className="sidebar-header-collapse-btn no-print"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            aria-label={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}

        {onCloseMobile && (
          <button
            type="button"
            className="sidebar-mobile-close-btn"
            onClick={onCloseMobile}
            aria-label="Fechar menu lateral"
            title="Fechar menu"
          >
            ✕
          </button>
        )}
      </div>

      {/* Lista de Navegação Principal: Somente Tela Inicial, Digifarma V10 e Digifarma R78 */}
      <div className="nav-items-scroll">
        <button
          type="button"
          className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleNavClick('dashboard')}
          title="Tela inicial"
        >
          <span className="ic">{navIcon('grid')}</span>
          {!isCollapsed && <span>Tela inicial</span>}
        </button>

        <button
          type="button"
          className={`nav-item ${currentView === 'v10' ? 'active' : ''}`}
          onClick={() => handleNavClick('v10')}
          title="Digifarma V10"
        >
          <span className="ic">{navIcon('rocket')}</span>
          {!isCollapsed && <span>Digifarma V10</span>}
        </button>

        <button
          type="button"
          className={`nav-item ${currentView === 'r78' ? 'active' : ''}`}
          onClick={() => handleNavClick('r78')}
          title="Digifarma Clássico"
        >
          <span className="ic">{navIcon('monitor')}</span>
          {!isCollapsed && <span style={{ whiteSpace: 'nowrap' }}>Digifarma Clássico</span>}
        </button>

        <button
          type="button"
          className={`nav-item ${currentView === 'revision' ? 'active' : ''}`}
          onClick={() => handleNavClick('revision')}
          title="Central de Revisões"
        >
          <span className="ic" style={{ position: 'relative' }}>
            <ClipboardCheck size={18} />
            {isCollapsed && pendingReviewCount && pendingReviewCount > 0 ? (
              <span className="sidebar-pending-badge dot" title={`${pendingReviewCount} pendentes`} />
            ) : null}
          </span>
          {!isCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '6px' }}>
              <span style={{ whiteSpace: 'nowrap' }}>Revisões</span>
              {pendingReviewCount && pendingReviewCount > 0 ? (
                <span className="sidebar-pending-badge">{pendingReviewCount}</span>
              ) : null}
            </div>
          )}
        </button>

        <button
          type="button"
          className={`nav-item ${currentView === 'personalize' ? 'active' : ''}`}
          onClick={() => handleNavClick('personalize')}
          title="Gerenciar Módulos, Rotinas e Menus"
        >
          <span className="ic">
            <Sliders size={18} />
          </span>
          {!isCollapsed && <span style={{ whiteSpace: 'nowrap' }}>Módulos</span>}
        </button>
      </div>

      {/* Rodapé do Menu Lateral */}
      <div className="sidebar-foot">
        {!isCollapsed ? (
          <div className="theme-toggle">
            <button
              type="button"
              data-theme="light"
              className={!darkMode ? 'active' : ''}
              onClick={() => {
                if (darkMode) onToggleDarkMode();
              }}
            >
              ☀ Claro
            </button>
            <button
              type="button"
              data-theme="dark"
              className={darkMode ? 'active' : ''}
              onClick={() => {
                if (!darkMode) onToggleDarkMode();
              }}
            >
              ☾ Escuro
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="theme-toggle-compact-btn"
            onClick={onToggleDarkMode}
            title={darkMode ? 'Mudar para tema Claro' : 'Mudar para tema Escuro'}
            aria-label="Alternar tema"
          >
            {darkMode ? '☾' : '☀'}
          </button>
        )}

        <button
          type="button"
          className={`nav-item sidebar-config-item ${currentView === 'config' ? 'active' : ''}`}
          onClick={() => handleNavClick('config')}
          title="Configurações"
        >
          <span className="ic">{navIcon('settings')}</span>
          {!isCollapsed && <span>Configurações</span>}
        </button>

        {/* Usuário no Rodapé do Menu Lateral */}
        {currentUser && (
          <div className={`sidebar-user-bottom ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-user-avatar-wrap" title={`Conectado como ${currentUser.name || currentUser.username}`}>
              {currentUser.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.name || currentUser.username}
                  className="sidebar-avatar-img"
                />
              ) : (
                <div className="sidebar-avatar-circle">
                  <span>{(currentUser.name || currentUser.username).charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <div className="sidebar-user-info-clean">
                <span className="sidebar-user-name">{currentUser.name || currentUser.username}</span>
                <span className="sidebar-user-role">Usuário Ativo</span>
              </div>
            )}

            {!isCollapsed && onLogout && (
              <button
                type="button"
                className="sidebar-logout-icon-btn"
                onClick={onLogout}
                title="Desconectar do sistema"
                aria-label="Sair"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
