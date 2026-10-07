import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  ClipboardCheck,
  FolderKanban,
  StickyNote,
  BookOpen,
  LayoutDashboard,
  Wrench,
  PenTool,
  Settings as SettingsIcon,
  Sun,
  Moon,
} from 'lucide-react';
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
  notesNotificationCount?: number;
}

function navIcon(name: string) {
  const paths: Record<string, string> = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
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
  notesNotificationCount = 0,
}) => {
  const handleNavClick = (view: string) => {
    onChangeView(view);
    onCloseMobile?.();
  };

  const isConteudosActive =
    currentView === 'conteudos' || currentView === 'v10' || currentView === 'r78';

  return (
    <aside
      className={`sidebar no-print ${isOpenMobile ? 'mobile-open' : ''} ${
        isCollapsed ? 'collapsed' : ''
      }`}
      id="sidebar"
    >
      {/* Brand Header */}
      <div className={`brand ${isCollapsed ? 'brand-collapsed' : ''}`}>
        {!isCollapsed ? (
          <>
            <div
              className="brand-logo-area"
              onClick={() => handleNavClick('dashboard')}
              title="Painel do Treinador - Início"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                cursor: 'pointer',
                flex: 1,
                overflow: 'hidden',
              }}
            >
              <div className="brand-logo-icon">
                <span style={{ color: 'var(--red)', fontWeight: 900, fontSize: '1.25rem' }}>P</span>
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div className="name" style={{ fontSize: '0.96rem', fontWeight: 800 }}>Painel Treinador</div>
                <div className="sub brand-product">Digifarma ERP</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {onToggleCollapse && (
                <button
                  type="button"
                  className="sidebar-header-collapse-btn no-print"
                  onClick={onToggleCollapse}
                  title="Recolher menu lateral"
                  aria-label="Recolher menu lateral"
                >
                  <ChevronLeft size={16} />
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
          </>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
            }}
          >
            <div
              className="brand-logo-icon"
              onClick={() => handleNavClick('dashboard')}
              title="Painel do Treinador - Início"
              style={{ cursor: 'pointer' }}
            >
              <span style={{ color: 'var(--red)', fontWeight: 900, fontSize: '1.25rem' }}>P</span>
            </div>

            {onToggleCollapse && (
              <button
                type="button"
                className="sidebar-header-collapse-btn collapsed no-print"
                onClick={onToggleCollapse}
                title="Expandir menu lateral"
                aria-label="Expandir menu lateral"
                style={{ margin: 0 }}
              >
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navegação Principal Reestruturada */}
      <div className="nav-items-scroll">
        {/* 1. Tela Inicial */}
        <button
          type="button"
          className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleNavClick('dashboard')}
          title="Tela inicial"
        >
          <span className="ic">{navIcon('grid')}</span>
          {!isCollapsed && <span>Tela inicial</span>}
        </button>

        {/* 2. Conteúdos (v10 e Clássico unificados em cards) */}
        <button
          type="button"
          className={`nav-item ${isConteudosActive ? 'active' : ''}`}
          onClick={() => handleNavClick('conteudos')}
          title="Conteúdos (Digifarma v10 e Clássico)"
        >
          <span className="ic">
            <BookOpen size={18} />
          </span>
          {!isCollapsed && <span style={{ whiteSpace: 'nowrap' }}>Conteúdos</span>}
        </button>

        {/* 3. Arquivos (Substitui Interno: Pastas, arquivos e anotações diretas) */}
        <button
          type="button"
          className={`nav-item ${currentView === 'arquivos' ? 'active' : ''}`}
          onClick={() => handleNavClick('arquivos')}
          title="Arquivos e Documentos"
        >
          <span className="ic">
            <FolderKanban size={18} />
          </span>
          {!isCollapsed && <span style={{ whiteSpace: 'nowrap' }}>Arquivos</span>}
        </button>

        {/* 4. Publicações (Feed de comunicados, direcionamento e comentários) */}
        <button
          type="button"
          className={`nav-item ${currentView === 'publicacoes' ? 'active' : ''}`}
          onClick={() => handleNavClick('publicacoes')}
          title="Publicações da Equipe"
        >
          <span className="ic" style={{ position: 'relative' }}>
            <StickyNote size={18} />
            {isCollapsed && notesNotificationCount > 0 ? (
              <span className="sidebar-pending-badge dot" title={`${notesNotificationCount} novas`} />
            ) : null}
          </span>
          {!isCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '6px' }}>
              <span style={{ whiteSpace: 'nowrap' }}>Publicações</span>
              {notesNotificationCount > 0 ? (
                <span className="sidebar-pending-badge">{notesNotificationCount}</span>
              ) : null}
            </div>
          )}
        </button>

        {/* 5. Mural (Kanban Trello: A Fazer, Em Andamento, Concluído + Personalizados) */}
        <button
          type="button"
          className={`nav-item ${currentView === 'mural' ? 'active' : ''}`}
          onClick={() => handleNavClick('mural')}
          title="Mural de Atividades e Tarefas"
        >
          <span className="ic">
            <LayoutDashboard size={18} />
          </span>
          {!isCollapsed && <span style={{ whiteSpace: 'nowrap' }}>Mural</span>}
        </button>

        {/* 6. Revisões (Central de Homologação / Aprovação de Procedimentos) */}
        <button
          type="button"
          className={`nav-item ${currentView === 'revision' ? 'active' : ''}`}
          onClick={() => handleNavClick('revision')}
          title="Painel de Revisão"
        >
          <span className="ic" style={{ position: 'relative' }}>
            <ClipboardCheck size={18} />
            {isCollapsed && pendingReviewCount > 0 ? (
              <span className="sidebar-pending-badge dot" title={`${pendingReviewCount} pendentes`} />
            ) : null}
          </span>
          {!isCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '6px' }}>
              <span style={{ whiteSpace: 'nowrap' }}>Revisões</span>
              {pendingReviewCount > 0 ? (
                <span className="sidebar-pending-badge">{pendingReviewCount}</span>
              ) : null}
            </div>
          )}
        </button>

        {/* 7. Utilitários (Módulos, Cadastro de Clientes e Usuários) */}
        <button
          type="button"
          className={`nav-item ${currentView === 'utilitarios' ? 'active' : ''}`}
          onClick={() => handleNavClick('utilitarios')}
          title="Utilitários do Sistema"
        >
          <span className="ic">
            <Wrench size={18} />
          </span>
          {!isCollapsed && <span style={{ whiteSpace: 'nowrap' }}>Utilitários</span>}
        </button>

        {/* 8. Studio (Editor e Criação de Procedimentos) */}
        <button
          type="button"
          className={`nav-item ${currentView === 'studio' ? 'active' : ''}`}
          onClick={() => handleNavClick('studio')}
          title="Studio - Editor de Criação"
        >
          <span className="ic">
            <PenTool size={18} />
          </span>
          {!isCollapsed && <span style={{ whiteSpace: 'nowrap' }}>Studio</span>}
        </button>
      </div>

      {/* Rodapé Compacto: Configurações e Claro/Escuro lado a lado como ÍCONES */}
      <div className="sidebar-foot" style={{ padding: '10px 10px 12px 10px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            gap: '8px',
            marginBottom: '8px',
          }}
        >
          {/* Botão Configurações como Ícone */}
          <button
            type="button"
            className={`sidebar-compact-icon-action ${currentView === 'config' ? 'active' : ''}`}
            onClick={() => handleNavClick('config')}
            title="Configurações do Sistema"
            aria-label="Configurações"
            style={{
              flex: isCollapsed ? 'none' : '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 10px',
              borderRadius: '8px',
              border: currentView === 'config' ? '1px solid var(--red)' : '1px solid var(--border)',
              background: currentView === 'config' ? 'var(--red-soft)' : 'var(--bg-secondary)',
              color: currentView === 'config' ? 'var(--red)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            <SettingsIcon size={16} />
            {!isCollapsed && <span>Configurações</span>}
          </button>

          {/* Botão Claro / Escuro como Ícone ao lado */}
          <button
            type="button"
            className="sidebar-compact-icon-action"
            onClick={onToggleDarkMode}
            title={darkMode ? 'Mudar para tema Claro' : 'Mudar para tema Escuro'}
            aria-label="Alternar Tema Claro/Escuro"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 10px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              color: darkMode ? '#fbbf24' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              minWidth: '38px',
            }}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        {/* Usuário no Rodapé */}
        {currentUser && (
          <div className={`sidebar-user-bottom ${isCollapsed ? 'collapsed' : ''}`} style={{ margin: 0 }}>
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
