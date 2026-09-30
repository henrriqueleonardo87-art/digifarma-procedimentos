import React, { useState } from 'react';
import {
  Moon,
  Sun,
  Cloud,
  Settings,
  Monitor,
  Rocket,
  Plus,
  LayoutGrid,
  Bell,
  HelpCircle,
  RotateCw,
  Menu,
} from 'lucide-react';
import type { SystemVersion, Procedure } from '../types/procedure';

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
  procedures?: Procedure[];
  onSelectProcedure?: (id: string) => void;
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
  onToggleSidebarMobile,
  procedures = [],
  onSelectProcedure,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Alertas inteligentes no padrão da referência
  const notifications = [
    {
      id: 'notif-1',
      title: 'Tabela F7 com IA Disponível',
      text: 'Novo roteiro para atendimento ágil e pesquisa por sintomas com Inteligência Artificial.',
      type: 'feature',
      procId: 'proc-v10-tabela-f7-ia',
    },
    {
      id: 'notif-2',
      title: 'Controle de Lotes & Validade (PVPS)',
      text: 'Conferência cega e rotina recomendada para entrada de notas XML.',
      type: 'audit',
      procId: 'proc-classico-entrada-xml',
    },
    {
      id: 'notif-3',
      title: 'Fechamento de Caixa Cego Ativo',
      text: 'Prevenção de perdas e protocolo de encerramento sem exibição de saldo ao operador.',
      type: 'security',
      procId: 'proc-v10-caixa-cego-gestor',
    },
  ];

  return (
    <>
      <header className="global-header no-print">
        {/* Lado Esquerdo: Mobile Trigger & Saudação do Usuário */}
        <div className="global-header-left">
          {onToggleSidebarMobile && (
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={onToggleSidebarMobile}
              title="Abrir navegação lateral"
            >
              <Menu size={18} />
            </button>
          )}

          {/* Marca / Logo no Estilo V10 */}
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

          {/* Saudação e Contexto da Farmácia */}
          <div className="global-brand-desc">
            <div className="global-greeting">
              Olá, <strong>Leonardo</strong>
            </div>
            <div className="global-caption">
              Seus manuais operacionais, procedimentos POP e rotinas da farmácia em um só lugar.
            </div>
          </div>
        </div>

        {/* Centro / Seletor Segmentado Minimalista (Clássico / V10) */}
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

        {/* Lado Direito: Ações Globais */}
        <div className="global-header-right">
          {/* Botão de Ajuda de Tela */}
          <button
            type="button"
            className="header-icon-btn"
            onClick={() => setShowHelpModal(true)}
            title="Ajuda sobre o Repositório de Procedimentos"
          >
            <HelpCircle size={16} />
          </button>

          {/* Notificações / Alertas com Popover */}
          <div className="notification-wrap">
            <button
              type="button"
              className="header-icon-btn notification-btn"
              onClick={() => setShowNotifications((prev) => !prev)}
              title="Notificações e Alertas Operacionais"
            >
              <Bell size={16} />
              <span className="notification-badge has">3</span>
            </button>

            {showNotifications && (
              <div className="notification-popover">
                <div className="notification-head">
                  <strong>Alertas Operacionais & BPF</strong>
                  <span>{procedures.length > 0 ? `${procedures.length} POPs ativos` : `${notifications.length} disponíveis`}</span>
                </div>
                <div className="notification-list">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="notification-item"
                      onClick={() => {
                        setShowNotifications(false);
                        if (onSelectProcedure && n.procId) {
                          onSelectProcedure(n.procId);
                        }
                      }}
                    >
                      <span className="notif-bullet" />
                      <div className="notif-content">
                        <strong>{n.title}</strong>
                        <p>{n.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Atualizar Sistema */}
          <button
            type="button"
            className="header-icon-btn"
            onClick={() => window.location.reload()}
            title="Recarregar e atualizar página"
          >
            <RotateCw size={15} />
          </button>

          {/* Status Nuvem Supabase */}
          <button
            type="button"
            className="header-icon-btn"
            onClick={onOpenSupabaseModal}
            title={isSupabaseConnected ? 'Nuvem Supabase Conectada' : 'Modo Local Offline'}
          >
            <Cloud size={16} />
            <span className={`cloud-dot ${isSupabaseConnected ? 'connected' : 'offline'}`} />
          </button>

          {/* Configurações */}
          <button
            type="button"
            className="header-icon-btn"
            onClick={onOpenSettings}
            title="Configurações de menus e banco de dados"
          >
            <Settings size={16} />
          </button>

          {/* Alternar Tema */}
          <button
            type="button"
            className="header-icon-btn"
            onClick={onToggleDarkMode}
            title={darkMode ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          >
            {darkMode ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} />}
          </button>

          {/* Avatar e Perfil do Usuário */}
          <div className="global-user-profile">
            <div className="global-avatar-circle">LT</div>
            <div className="global-user-info-text">
              <strong>Leonardo</strong>
              <span>Farmacêutico RT</span>
            </div>
          </div>

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

      {/* Modal de Ajuda Geral */}
      {showHelpModal && (
        <div className="modal-overlay no-print" onClick={() => setShowHelpModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <span className="eyebrow" style={{ marginBottom: '4px' }}>
                  <span className="num">GUIA RÁPIDO</span>
                  <span>REPOSITÓRIO DE PROCEDIMENTOS</span>
                </span>
                <h3>Como Utilizar a Base de Manuais</h3>
              </div>
              <button
                type="button"
                className="btn-icon-block"
                onClick={() => setShowHelpModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p className="lead" style={{ fontSize: '14px' }}>
                Este repositório reúne os <strong>Procedimentos Operacionais Padrão (POP)</strong> e rotinas de uso do Digifarma V10 e Clássico.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li style={{ display: 'flex', gap: '8px', fontSize: '13.5px' }}>
                  <span style={{ color: 'var(--red)', fontWeight: 800 }}>•</span>
                  <span><strong>Navegação:</strong> Escolha entre Digifarma V10 (Web/Cloud) ou Clássico (Desktop) no topo.</span>
                </li>
                <li style={{ display: 'flex', gap: '8px', fontSize: '13.5px' }}>
                  <span style={{ color: 'var(--red)', fontWeight: 800 }}>•</span>
                  <span><strong>Pesquisa Rápida:</strong> Use a barra lateral ou tecle <strong>Ctrl + Espaço</strong> para localizar procedimentos instantaneamente.</span>
                </li>
                <li style={{ display: 'flex', gap: '8px', fontSize: '13.5px' }}>
                  <span style={{ color: 'var(--red)', fontWeight: 800 }}>•</span>
                  <span><strong>Impressão Oficial (POP / BPF):</strong> Abra qualquer manual e clique em <em>Imprimir / PDF</em> para gerar o formulário homologado de auditoria com controle de versão e assinaturas.</span>
                </li>
                <li style={{ display: 'flex', gap: '8px', fontSize: '13.5px' }}>
                  <span style={{ color: 'var(--red)', fontWeight: 800 }}>•</span>
                  <span><strong>Consultor Leo • IA:</strong> Clique no botão flutuante no canto inferior direito para tirar dúvidas operacionais.</span>
                </li>
              </ul>
            </div>
            <div className="modal-foot">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowHelpModal(false)}
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
