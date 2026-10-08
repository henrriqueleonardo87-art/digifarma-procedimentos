import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
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
  currentUser: _currentUser,
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
      <a
        className="brand"
        href="#"
        aria-label="Painel Digifarma"
        onClick={(e) => {
          e.preventDefault();
          handleNavClick('dashboard');
        }}
      >
        <span className="brand-mark">+</span>
        {!isCollapsed && (
          <span>
            digifarma
            <small>PAINEL DO TREINADOR</small>
          </span>
        )}
      </a>

      {/* Cabeçalho da Seção / Menu com botão de recolher ou expandir */}
      {!isCollapsed ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px 13px',
          }}
        >
          <div className="nav-caption" style={{ padding: 0, margin: 0 }}>
            MENU
          </div>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Recolher menu lateral"
              style={{
                border: '1px solid var(--line)',
                background: 'var(--bg-secondary)',
                color: 'var(--muted)',
                borderRadius: '6px',
                padding: '3px 6px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.borderColor = 'var(--red)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--muted)';
                e.currentTarget.style.borderColor = 'var(--line)';
              }}
            >
              <ChevronLeft size={14} />
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px', width: '100%' }}>
          {onToggleCollapse && (
            <button
              type="button"
              className="sidebar-header-collapse-btn collapsed no-print"
              onClick={onToggleCollapse}
              title="Expandir menu lateral"
              style={{
                border: '1px solid var(--line)',
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                width: '38px',
                height: '32px',
                padding: 0,
                cursor: 'pointer',
                color: 'var(--text-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--red)';
                e.currentTarget.style.color = 'var(--red)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--line)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
            >
              <ChevronRight size={15} />
            </button>
          )}
        </div>
      )}

      {/* Navegação Principal reordenada: Visão geral, Conteúdos, Publicações, Mural, Revisões, Arquivos, Utilitários, Studio */}
      <nav aria-label="Seções do painel" id="nav">
        {/* 1. Visão Geral (Dashboard) */}
        <button
          type="button"
          data-view="overview"
          className={currentView === 'dashboard' ? 'active' : ''}
          onClick={() => handleNavClick('dashboard')}
          title="Visão Geral"
        >
          <span>◫</span>
          {!isCollapsed && 'Visão geral'}
        </button>

        {/* 2. Conteúdos (v10 e Clássico) */}
        <button
          type="button"
          data-view="conteudos"
          className={isConteudosActive ? 'active' : ''}
          onClick={() => handleNavClick('conteudos')}
          title="Conteúdos Operacionais"
        >
          <span>≡</span>
          {!isCollapsed && 'Conteúdos'}
        </button>

        {/* 3. Publicações */}
        <button
          type="button"
          data-view="publicacoes"
          className={currentView === 'publicacoes' ? 'active' : ''}
          onClick={() => handleNavClick('publicacoes')}
          title="Publicações da Equipe"
        >
          <span>▥</span>
          {!isCollapsed && (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', fontSize: 'inherit', color: 'inherit' }}>
              Publicações
              {notesNotificationCount > 0 && (
                <span className="chip" style={{ marginLeft: 'auto', background: 'var(--red)', color: '#fff' }}>
                  {notesNotificationCount}
                </span>
              )}
            </span>
          )}
        </button>

        {/* 4. Mural (Kanban) */}
        <button
          type="button"
          data-view="mural"
          className={currentView === 'mural' ? 'active' : ''}
          onClick={() => handleNavClick('mural')}
          title="Mural de Atividades"
        >
          <span>▦</span>
          {!isCollapsed && 'Mural'}
        </button>

        {/* 5. Revisões */}
        <button
          type="button"
          data-view="revision"
          className={currentView === 'revision' ? 'active' : ''}
          onClick={() => handleNavClick('revision')}
          title="Painel de Revisão"
        >
          <span>◎</span>
          {!isCollapsed && (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', fontSize: 'inherit', color: 'inherit' }}>
              Revisões
              {pendingReviewCount > 0 && (
                <span className="chip" style={{ marginLeft: 'auto', background: 'var(--amber)', color: '#fff' }}>
                  {pendingReviewCount}
                </span>
              )}
            </span>
          )}
        </button>

        {/* 6. Arquivos */}
        <button
          type="button"
          data-view="arquivos"
          className={currentView === 'arquivos' ? 'active' : ''}
          onClick={() => handleNavClick('arquivos')}
          title="Arquivos e Documentos"
        >
          <span>⇄</span>
          {!isCollapsed && 'Arquivos'}
        </button>

        {/* 7. Utilitários */}
        <button
          type="button"
          data-view="utilitarios"
          className={currentView === 'utilitarios' ? 'active' : ''}
          onClick={() => handleNavClick('utilitarios')}
          title="Utilitários do Sistema"
        >
          <span>▤</span>
          {!isCollapsed && 'Utilitários'}
        </button>

        {/* 8. Studio */}
        <button
          type="button"
          data-view="studio"
          className={currentView === 'studio' ? 'active' : ''}
          onClick={() => handleNavClick('studio')}
          title="Studio - Editor de Criação"
        >
          <span>↗</span>
          {!isCollapsed && 'Studio'}
        </button>
      </nav>

      {/* Rodapé Padrão Digifarma */}
      <div className="sidebar-bottom">
        <div
          style={{
            display: 'flex',
            flexDirection: isCollapsed ? 'column' : 'row',
            gap: isCollapsed ? '6px' : '8px',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <button
            type="button"
            className="side-action"
            onClick={() => handleNavClick('config')}
            title="Configurações do Sistema"
            style={{
              flex: isCollapsed ? undefined : 1,
              width: isCollapsed ? '44px' : '100%',
              height: isCollapsed ? '38px' : 'auto',
              padding: isCollapsed ? '0' : '6px 8px',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              background: currentView === 'config' ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: '15px' }}>⚙</span>
            {!isCollapsed && <span>Config</span>}
          </button>

          <button
            type="button"
            className="side-action"
            onClick={onToggleDarkMode}
            title={darkMode ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            style={{
              flex: isCollapsed ? undefined : 1,
              width: isCollapsed ? '44px' : '100%',
              height: isCollapsed ? '38px' : 'auto',
              padding: isCollapsed ? '0' : '6px 8px',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: '14px' }}>{darkMode ? '☀️' : '🌙'}</span>
            {!isCollapsed && <span>{darkMode ? 'Claro' : 'Escuro'}</span>}
          </button>
        </div>

        {onLogout && (
          <button
            type="button"
            className="side-action"
            onClick={onLogout}
            title="Sair da conta"
            style={{
              marginTop: '6px',
              width: isCollapsed ? '44px' : '100%',
              height: isCollapsed ? '34px' : 'auto',
              padding: isCollapsed ? '0' : '6px 8px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: 'var(--muted)',
              border: 'none',
              background: 'transparent',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '15px' }}>↺</span>
            {!isCollapsed && <span>Sair</span>}
          </button>
        )}
      </div>
    </aside>
  );
};
