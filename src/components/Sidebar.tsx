import React from 'react';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
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
}) => {
  const handleNavClick = (view: string) => {
    onChangeView(view);
    onCloseMobile?.();
  };

  return (
    <aside className={`sidebar no-print ${isOpenMobile ? 'mobile-open' : ''}`} id="sidebar">
      {/* Brand Header */}
      <div className="brand">
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', flex: 1 }}
          onClick={() => handleNavClick('dashboard')}
        >
          <div className="brand-logo-icon">
            <span style={{ color: 'var(--red)', fontWeight: 900, fontSize: '1.25rem' }}>D</span>
          </div>
          <div>
            <div className="name">Digifarma</div>
            <div className="sub brand-product">Treinamento & POPs</div>
          </div>
        </div>

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
        >
          <span className="ic">{navIcon('grid')}</span>
          <span>Tela inicial</span>
        </button>

        <button
          type="button"
          className={`nav-item ${currentView === 'v10' ? 'active' : ''}`}
          onClick={() => handleNavClick('v10')}
        >
          <span className="ic">{navIcon('rocket')}</span>
          <span>Digifarma V10</span>
        </button>

        <button
          type="button"
          className={`nav-item ${currentView === 'r78' ? 'active' : ''}`}
          onClick={() => handleNavClick('r78')}
        >
          <span className="ic">{navIcon('monitor')}</span>
          <span>Digifarma R78</span>
        </button>
      </div>

      {/* Rodapé do Menu Lateral */}
      <div className="sidebar-foot">
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
          onClick={() => handleNavClick('config')}
        >
          <span className="ic">{navIcon('settings')}</span>
          <span>Configurações</span>
        </button>
      </div>
    </aside>
  );
};
