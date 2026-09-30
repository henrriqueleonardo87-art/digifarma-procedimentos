import React from 'react';
import { Plus } from 'lucide-react';
import type { Procedure, SystemMenu, SystemVersion } from '../types/procedure';

interface SidebarProps {
  menus: SystemMenu[];
  procedures: Procedure[];
  activeVersion: SystemVersion;
  activeId: string | null;
  currentView: string;
  onChangeView: (view: string) => void;
  onSelectProcedure: (id: string) => void;
  onNewProcedure: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

function navIcon(name: string) {
  const paths: Record<string, string> = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    list: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2.6V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H6v-2.6h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.6v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v2.6h-.2a1.7 1.7 0 0 0-1.6 1z"/>',
    rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15zM6 6h10M6 10h10"/>',
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
  procedures,
  activeId,
  currentView,
  onChangeView,
  onSelectProcedure,
  onNewProcedure,
  darkMode,
  onToggleDarkMode,
}) => {
  return (
    <aside className="sidebar no-print" id="sidebar">
      {/* Brand Header estilo LH Group */}
      <div
        className="brand"
        onClick={() => onChangeView('dashboard')}
        style={{ cursor: 'pointer' }}
      >
        <div className="brand-logo-icon">
          <span style={{ color: 'var(--red)', fontWeight: 900, fontSize: '1.25rem' }}>D</span>
        </div>
        <div>
          <div className="name">Digifarma</div>
          <div className="sub brand-product">Procedimentos & POPs</div>
        </div>
      </div>

      {/* Lista de Navegação Principal */}
      <div className="nav-items-scroll">
        <button
          type="button"
          className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => onChangeView('dashboard')}
        >
          <span className="ic">{navIcon('grid')}</span>
          <span>Tela inicial</span>
        </button>

        {/* Item solicitado pelo usuário: exatamente "Procedimentos" */}
        <button
          type="button"
          className={`nav-item ${currentView === 'procedimentos' ? 'active' : ''}`}
          onClick={() => onChangeView('procedimentos')}
        >
          <span className="ic">{navIcon('list')}</span>
          <span>Procedimentos</span>
          <span className="sidebar-count-tag">{procedures.length}</span>
        </button>

        <button
          type="button"
          className={`nav-item ${currentView === 'v10' ? 'active' : ''}`}
          onClick={() => onChangeView('v10')}
        >
          <span className="ic">{navIcon('rocket')}</span>
          <span>Digifarma V10</span>
          <span className="sidebar-mini-badge v10">Cloud</span>
        </button>

        <button
          type="button"
          className={`nav-item ${currentView === 'classico' ? 'active' : ''}`}
          onClick={() => onChangeView('classico')}
        >
          <span className="ic">{navIcon('monitor')}</span>
          <span>Digifarma Clássico</span>
          <span className="sidebar-mini-badge">Desktop</span>
        </button>

        {/* Divisão: Roteiros Homologados */}
        <div className="sidebar-section-divider">
          <span>POP em Destaque</span>
        </div>

        {procedures.slice(0, 4).map((proc) => {
          const isSelected = activeId === proc.id && currentView === 'procedure-detail';
          return (
            <button
              type="button"
              key={proc.id}
              className={`nav-item featured-proc-item ${isSelected ? 'active' : ''}`}
              onClick={() => onSelectProcedure(proc.id)}
            >
              <span className="ic">{navIcon('book')}</span>
              <span className="featured-proc-label" title={proc.title}>
                {proc.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Rodapé do Menu Lateral */}
      <div className="sidebar-foot">
        <button
          type="button"
          className="btn-new-pop-sidebar"
          onClick={onNewProcedure}
        >
          <Plus size={14} />
          <span>Novo Procedimento</span>
        </button>

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

        <button
          type="button"
          className={`nav-item sidebar-config-item ${currentView === 'config' ? 'active' : ''}`}
          onClick={() => onChangeView('config')}
        >
          <span className="ic">{navIcon('settings')}</span>
          <span>Configurações</span>
        </button>

        <div className="sidebar-user">
          <div className="sidebar-avatar">LT</div>
          <div className="sidebar-user-info">
            <strong>Leonardo Trevas</strong>
            <span>Farmacêutico RT</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
