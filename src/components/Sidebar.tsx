import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { AppUser } from '../types/auth';
import { APP_VERSION } from '../config/version';

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
      {!isCollapsed && <div className="nav-caption">GESTÃO DA REDE</div>}

      {/* Navegação Principal */}
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

        {/* 3. Arquivos */}
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

        {/* 4. Publicações */}
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

        {/* 5. Mural (Kanban) */}
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

        {/* 6. Revisões */}
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
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="side-action"
            onClick={() => handleNavClick('config')}
            title="Configurações"
            style={{
              flex: 1,
              padding: '6px 8px',
              border: '1px solid var(--line)',
              borderRadius: '6px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              textAlign: 'center',
            }}
          >
            ⚙ {!isCollapsed && 'Config'}
          </button>
          <button
            type="button"
            className="side-action"
            onClick={onToggleDarkMode}
            title="Tema Claro / Escuro"
            style={{
              flex: 1,
              padding: '6px 8px',
              border: '1px solid var(--line)',
              borderRadius: '6px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              textAlign: 'center',
            }}
          >
            {darkMode ? '☀️ Claro' : '🌙 Escuro'}
          </button>
        </div>

        {onLogout && (
          <button
            type="button"
            className="side-action"
            onClick={onLogout}
            style={{ marginTop: '8px', color: 'var(--muted)' }}
          >
            ↺ {!isCollapsed && 'Sair da conta'}
          </button>
        )}

        {/* Controle de Versão Minimalista */}
        <div
          style={{
            marginTop: '8px',
            textAlign: 'center',
            fontSize: '0.67rem',
            fontWeight: 500,
            color: 'var(--muted)',
            letterSpacing: '0.04em',
            userSelect: 'none',
            opacity: 0.65,
          }}
          title={`Digifarma Repositório ${APP_VERSION}`}
        >
          {APP_VERSION}
        </div>
      </div>
    </aside>
  );
};
