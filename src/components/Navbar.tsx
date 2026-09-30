import React from 'react';
import {
  Moon,
  Sun,
  Cloud,
  Settings,
  Monitor,
  Rocket,
  Plus,
  LayoutGrid,
} from 'lucide-react';
import type { SystemVersion } from '../types/procedure';

interface NavbarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  isSupabaseConnected: boolean;
  onOpenSupabaseModal: () => void;
  onOpenSettings: () => void;
  onNewProcedure: () => void;
  activeVersion: SystemVersion | null;
  onChangeVersion: (version: SystemVersion) => void;
  onReturnToVersionSelect: () => void;
  onToggleSidebarMobile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  onToggleDarkMode,
  isSupabaseConnected,
  onOpenSupabaseModal,
  onOpenSettings,
  onNewProcedure,
  activeVersion,
  onChangeVersion,
  onReturnToVersionSelect,
}) => {
  return (
    <header className="app-navbar-minimal no-print">
      {/* Lado Esquerdo: Marca & Seletor de Versão */}
      <div className="navbar-left">
        <div
          className="navbar-brand-minimal"
          onClick={onReturnToVersionSelect}
          title="Voltar para a seleção de versão"
        >
          <div className="logo" style={{ display: 'flex', alignItems: 'center' }}>
            <span className="brand-logo-text" style={{ fontSize: '1.05rem', fontWeight: 600 }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>DIGI</span>
              <span className="brand-accent" style={{ color: 'var(--red)', fontWeight: 800 }}>FARMA</span>
            </span>
            <span className="brand-sub-badge" style={{ textTransform: 'uppercase' }}>
              {activeVersion === 'v10' ? 'V10' : 'POP'}
            </span>
          </div>
        </div>

        {/* Seletor Segmentado Minimalista (Clássico / V10) */}
        {activeVersion && (
          <div className="version-segmented-control">
            <button
              type="button"
              className={`segmented-btn ${activeVersion === 'classico' ? 'active' : ''}`}
              onClick={() => onChangeVersion('classico')}
              title="Alternar para Digifarma Clássico (Desktop)"
            >
              <Monitor size={13} />
              <span>Clássico</span>
            </button>

            <button
              type="button"
              className={`segmented-btn ${activeVersion === 'v10' ? 'active' : ''}`}
              onClick={() => onChangeVersion('v10')}
              title="Alternar para Digifarma V10 (Web/Cloud)"
            >
              <Rocket size={13} />
              <span>V10</span>
            </button>

            <button
              type="button"
              className="segmented-icon-btn"
              onClick={onReturnToVersionSelect}
              title="Ver os 2 cards na tela inicial"
            >
              <LayoutGrid size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Lado Direito: Ações Limpas e Organizadas */}
      <div className="navbar-right">
        {/* Status da Nuvem Supabase (Ícone Minimalista com Indicador) */}
        <button
          type="button"
          className="btn-icon-minimal-nav"
          onClick={onOpenSupabaseModal}
          title={isSupabaseConnected ? 'Supabase Nuvem Conectada' : 'Nuvem Desconectada (Modo Local)'}
        >
          <Cloud size={16} />
          <span className={`cloud-dot ${isSupabaseConnected ? 'connected' : 'offline'}`} />
        </button>

        {/* Botão de Configurações */}
        <button
          type="button"
          className="btn-icon-minimal-nav"
          onClick={onOpenSettings}
          title="Configurações de menus, submenus e backup"
        >
          <Settings size={16} />
        </button>

        {/* Alternar Tema Escuro / Claro */}
        <button
          type="button"
          className="btn-icon-minimal-nav"
          onClick={onToggleDarkMode}
          title={darkMode ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        >
          {darkMode ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} />}
        </button>

        <div className="nav-divider" />

        {/* Botão Principal: Novo Manual */}
        <button
          type="button"
          className="btn-nav-primary"
          onClick={onNewProcedure}
        >
          <Plus size={15} />
          <span>Novo Manual</span>
        </button>
      </div>
    </header>
  );
};
