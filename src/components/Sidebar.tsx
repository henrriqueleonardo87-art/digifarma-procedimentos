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
  Grid,
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
      {/* Brand Header idêntico ao modelo Digifarma Gestor */}
      <div
        className={`brand ${isCollapsed ? 'brand-collapsed' : ''}`}
        style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          cursor: 'pointer',
          margin: isCollapsed ? '0 0 20px 0' : '0 4px 28px 4px',
          textDecoration: 'none',
        }}
        onClick={() => handleNavClick('dashboard')}
        title="Painel Digifarma"
      >
        <span className="brand-mark">+</span>
        {!isCollapsed && (
          <div style={{ overflow: 'hidden' }}>
            <span
              style={{
                display: 'block',
                color: 'var(--red)',
                fontWeight: 750,
                fontSize: '24px',
                letterSpacing: '-1px',
                lineHeight: 1.1,
              }}
            >
              digifarma
            </span>
            <small
              style={{
                display: 'block',
                fontSize: '9px',
                fontWeight: 600,
                letterSpacing: '1.5px',
                color: 'var(--muted)',
                marginTop: '3px',
                textTransform: 'uppercase',
              }}
            >
              PAINEL DO TREINADOR
            </small>
          </div>
        )}

        {/* Botão de recolher/fechar se não colapsado */}
        {!isCollapsed && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
            {onToggleCollapse && (
              <button
                type="button"
                className="sidebar-header-collapse-btn no-print"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCollapse();
                }}
                title="Recolher menu"
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <ChevronLeft size={16} />
              </button>
            )}
            {onCloseMobile && (
              <button
                type="button"
                className="sidebar-mobile-close-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseMobile();
                }}
                title="Fechar menu"
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>

      {isCollapsed && onToggleCollapse && (
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <button
            type="button"
            className="sidebar-header-collapse-btn collapsed no-print"
            onClick={onToggleCollapse}
            title="Expandir menu"
            style={{
              border: '1px solid var(--line)',
              background: '#fff',
              borderRadius: '6px',
              padding: '4px',
              cursor: 'pointer',
              color: 'var(--muted)',
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Nav Caption Padrão Gestor */}
      {!isCollapsed && <div className="nav-caption">OPERAÇÃO &amp; CONTEÚDOS</div>}

      {/* Navegação Principal */}
      <nav aria-label="Seções do painel" id="nav">
        {/* 1. Visão Geral (Dashboard) */}
        <button
          type="button"
          className={currentView === 'dashboard' ? 'active' : ''}
          onClick={() => handleNavClick('dashboard')}
          title="Visão Geral"
        >
          <span className="nav-icon-glyph">
            <Grid size={16} />
          </span>
          {!isCollapsed && <span>Visão geral</span>}
        </button>

        {/* 2. Conteúdos (v10 e Clássico) */}
        <button
          type="button"
          className={isConteudosActive ? 'active' : ''}
          onClick={() => handleNavClick('conteudos')}
          title="Conteúdos Operacionais"
        >
          <span className="nav-icon-glyph">
            <BookOpen size={16} />
          </span>
          {!isCollapsed && <span>Conteúdos</span>}
        </button>

        {/* 3. Arquivos */}
        <button
          type="button"
          className={currentView === 'arquivos' ? 'active' : ''}
          onClick={() => handleNavClick('arquivos')}
          title="Arquivos e Documentos"
        >
          <span className="nav-icon-glyph">
            <FolderKanban size={16} />
          </span>
          {!isCollapsed && <span>Arquivos</span>}
        </button>

        {/* 4. Publicações */}
        <button
          type="button"
          className={currentView === 'publicacoes' ? 'active' : ''}
          onClick={() => handleNavClick('publicacoes')}
          title="Publicações da Equipe"
        >
          <span className="nav-icon-glyph" style={{ position: 'relative' }}>
            <StickyNote size={16} />
            {isCollapsed && notesNotificationCount > 0 ? (
              <span className="sidebar-pending-badge dot" />
            ) : null}
          </span>
          {!isCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span>Publicações</span>
              {notesNotificationCount > 0 && (
                <span className="sidebar-pending-badge">{notesNotificationCount}</span>
              )}
            </div>
          )}
        </button>

        {/* 5. Mural (Kanban) */}
        <button
          type="button"
          className={currentView === 'mural' ? 'active' : ''}
          onClick={() => handleNavClick('mural')}
          title="Mural de Atividades"
        >
          <span className="nav-icon-glyph">
            <LayoutDashboard size={16} />
          </span>
          {!isCollapsed && <span>Mural</span>}
        </button>

        {/* 6. Revisões */}
        <button
          type="button"
          className={currentView === 'revision' ? 'active' : ''}
          onClick={() => handleNavClick('revision')}
          title="Painel de Revisão"
        >
          <span className="nav-icon-glyph" style={{ position: 'relative' }}>
            <ClipboardCheck size={16} />
            {isCollapsed && pendingReviewCount > 0 ? (
              <span className="sidebar-pending-badge dot" />
            ) : null}
          </span>
          {!isCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span>Revisões</span>
              {pendingReviewCount > 0 && (
                <span className="sidebar-pending-badge">{pendingReviewCount}</span>
              )}
            </div>
          )}
        </button>

        {/* 7. Utilitários */}
        <button
          type="button"
          className={currentView === 'utilitarios' ? 'active' : ''}
          onClick={() => handleNavClick('utilitarios')}
          title="Utilitários do Sistema"
        >
          <span className="nav-icon-glyph">
            <Wrench size={16} />
          </span>
          {!isCollapsed && <span>Utilitários</span>}
        </button>

        {/* 8. Studio */}
        <button
          type="button"
          className={currentView === 'studio' ? 'active' : ''}
          onClick={() => handleNavClick('studio')}
          title="Studio - Editor de Criação"
        >
          <span className="nav-icon-glyph">
            <PenTool size={16} />
          </span>
          {!isCollapsed && <span>Studio</span>}
        </button>
      </nav>

      {/* Rodapé Padrão Digifarma Gestor */}
      <div className="sidebar-bottom">
        {!isCollapsed && (
          <>
            <div>
              <span className="live-dot" />
              <strong style={{ color: 'var(--ink)' }}>Procedimentos ativos</strong>
            </div>
            <p>
              Repositório operacional.<br />
              Digifarma v10 &amp; Clássico.
            </p>
          </>
        )}

        {/* Controles de Configurações e Tema Lado a Lado */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            gap: '8px',
            marginBottom: '10px',
            marginTop: '8px',
          }}
        >
          <button
            type="button"
            className="side-action"
            onClick={() => handleNavClick('config')}
            title="Configurações"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '7px',
              border: currentView === 'config' ? '1px solid var(--red)' : '1px solid var(--line)',
              background: currentView === 'config' ? '#fff0f0' : '#fff',
              color: currentView === 'config' ? 'var(--red)' : 'var(--muted)',
              flex: isCollapsed ? 'none' : '1',
              fontWeight: 600,
            }}
          >
            <SettingsIcon size={14} />
            {!isCollapsed && <span>Configurações</span>}
          </button>

          <button
            type="button"
            className="side-action"
            onClick={onToggleDarkMode}
            title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px 10px',
              borderRadius: '7px',
              border: '1px solid var(--line)',
              background: '#fff',
              color: darkMode ? '#f59e0b' : 'var(--muted)',
              minWidth: '34px',
            }}
          >
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>

        {/* Identificação de Usuário */}
        {currentUser && !isCollapsed && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '8px',
              borderTop: '1px solid var(--line)',
              marginTop: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--red)',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {(currentUser.name || currentUser.username).charAt(0).toUpperCase()}
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 650,
                  color: 'var(--ink)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {currentUser.name || currentUser.username}
              </span>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Sair"
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                <LogOut size={13} />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
