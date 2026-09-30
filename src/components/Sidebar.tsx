import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Package,
  Boxes,
  Users,
  Truck,
  Wrench,
  Settings,
  ShieldCheck,
  CreditCard,
  Database,
  Sliders,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  FileText,
  FileSpreadsheet,
  X,
  Monitor,
  Rocket,
  BarChart3,
  CheckCircle2,
  Lock,
  Star,
  Pill,
} from 'lucide-react';
import type { Procedure, SystemMenu, SystemVersion } from '../types/procedure';

interface SidebarProps {
  menus: SystemMenu[];
  procedures: Procedure[];
  activeVersion: SystemVersion;
  activeId: string | null;
  isDashboardActive: boolean;
  onOpenDashboard: () => void;
  onSelectProcedure: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenSettings: () => void;
  onNewProcedure: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  menus,
  procedures,
  activeVersion,
  activeId,
  isDashboardActive,
  onOpenDashboard,
  onSelectProcedure,
  searchQuery,
  onSearchChange,
  isCollapsed,
  onToggleCollapse,
  onOpenSettings,
  onNewProcedure,
}) => {
  // Módulos abertos
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    cadastros: true,
    estoque: true,
    utilitarios: true,
  });

  const toggleMenuExpand = (menuId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  // Mapeamento de ícones limpos
  const getIcon = (iconName?: string, size = 15) => {
    switch (iconName) {
      case 'FolderPlus':
        return <FolderPlus size={size} />;
      case 'Boxes':
        return <Boxes size={size} />;
      case 'Wrench':
        return <Wrench size={size} />;
      case 'Package':
        return <Package size={size} />;
      case 'Users':
        return <Users size={size} />;
      case 'Truck':
        return <Truck size={size} />;
      case 'ShieldCheck':
        return <ShieldCheck size={size} />;
      case 'Settings':
        return <Settings size={size} />;
      case 'CreditCard':
        return <CreditCard size={size} />;
      case 'Database':
        return <Database size={size} />;
      case 'Sliders':
        return <Sliders size={size} />;
      case 'FileSpreadsheet':
        return <FileSpreadsheet size={size} />;
      default:
        return <FileText size={size} />;
    }
  };

  // Menus filtrados pela versão ativa
  const versionMenus = useMemo(() => {
    return menus.filter(
      (m) => m.version === activeVersion || m.version === 'ambos' || !m.version
    );
  }, [menus, activeVersion]);

  // Procedimentos filtrados pela versão ativa
  const versionProcedures = useMemo(() => {
    return procedures.filter(
      (p) =>
        p.systemVersion === activeVersion ||
        p.systemVersion === 'ambos' ||
        !p.systemVersion
    );
  }, [procedures, activeVersion]);

  // Busca textual em tempo real
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();

    return versionProcedures.filter((p) => {
      const inTitle = p.title.toLowerCase().includes(q);
      const inSub = p.subtitle?.toLowerCase().includes(q);
      const inPath = p.systemPath?.toLowerCase().includes(q);
      const inCategory = p.category?.toLowerCase().includes(q);
      return inTitle || inSub || inPath || inCategory;
    });
  }, [versionProcedures, searchQuery]);

  // Encontra o procedimento associado a um item do menu
  const findProcedureForMenuItem = (menuId: string, itemSubId: string) => {
    return versionProcedures.find(
      (p) =>
        (p.menuId === menuId || p.category?.toLowerCase() === menuId.toLowerCase()) &&
        (p.submenuId === itemSubId || p.id.toLowerCase().includes(itemSubId.toLowerCase()))
    );
  };

  // ==============================================================
  // MODO COLAPSADO (MINI-RAIL / ÍCONES NO CANTO)
  // ==============================================================
  if (isCollapsed) {
    return (
      <aside className="app-sidebar collapsed no-print">
        <div className="sidebar-collapse-bar">
          <button
            className="btn-icon-minimal"
            onClick={onToggleCollapse}
            title="Expandir menu lateral"
          >
            <PanelLeftOpen size={18} color="var(--primary-500)" />
          </button>
        </div>

        <div className="mini-rail-items">
          <button
            className={`mini-rail-btn ${isDashboardActive ? 'active' : ''}`}
            onClick={onOpenDashboard}
            title="Painel e Métricas"
          >
            <BarChart3 size={18} />
          </button>

          <div style={{ width: '24px', height: '1px', background: 'var(--border)', margin: '4px 0' }} />

          {versionMenus.map((menu) => (
            <button
              key={menu.id}
              className="mini-rail-btn"
              onClick={() => {
                onToggleCollapse();
                toggleMenuExpand(menu.id);
              }}
              title={menu.label}
            >
              {getIcon(menu.icon, 18)}
            </button>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="app-sidebar no-print">
      {/* Header do Menu com Logo e Versão */}
      <div className="sidebar-header-minimal">
        <div className="sidebar-version-badge">
          {activeVersion === 'v10' ? (
            <>
              <Rocket size={13} color="#10b981" />
              <span>Digifarma V10</span>
            </>
          ) : (
            <>
              <Monitor size={13} color="var(--primary-500)" />
              <span>Digifarma Clássico</span>
            </>
          )}
        </div>

        <button
          className="btn-icon-minimal"
          onClick={onToggleCollapse}
          title="Recolher menu lateral"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      {/* Busca Global Instantânea (Ctrl + Espaço) */}
      <div className="sidebar-search-container">
        <div className="search-input-wrapper">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar procedimento... (Ctrl+Espaço)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              className="btn-clear-search"
              onClick={() => onSearchChange('')}
              title="Limpar busca"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Árvore de Procedimentos e Atalhos */}
      <div className="sidebar-tree-scroll">
        {/* Navegação Principal em Cards Estilo LH Group */}
        <div className="sidebar-nav-list" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
          <button
            type="button"
            className={`nav-item-lh ${isDashboardActive ? 'active' : ''}`}
            onClick={onOpenDashboard}
          >
            <span className="ic">
              <BarChart3 size={15} />
            </span>
            <span className="label">Painel Executivo</span>
            <span className="sidebar-count-tag">{versionProcedures.length}</span>
          </button>

          {/* Atalho Rápido para Procedimentos Destaques */}
          {versionProcedures.some((p) => p.id === 'proc-v10-tabela-f7-ia') && (
            <button
              type="button"
              className={`nav-item-lh ${!isDashboardActive && activeId === 'proc-v10-tabela-f7-ia' ? 'active' : ''}`}
              onClick={() => onSelectProcedure('proc-v10-tabela-f7-ia')}
            >
              <span className="ic" style={{ color: 'var(--red)' }}>
                <Pill size={15} />
              </span>
              <span className="label">F7 Tabela com IA</span>
              <span className="sidebar-mini-badge v10">V10</span>
            </button>
          )}

          {versionProcedures.some((p) => p.id === 'proc-v10-painel-360-cliente') && (
            <button
              type="button"
              className={`nav-item-lh ${!isDashboardActive && activeId === 'proc-v10-painel-360-cliente' ? 'active' : ''}`}
              onClick={() => onSelectProcedure('proc-v10-painel-360-cliente')}
            >
              <span className="ic" style={{ color: '#f59e0b' }}>
                <Star size={15} />
              </span>
              <span className="label">Painel 360º Cliente</span>
              <span className="sidebar-mini-badge v10">CRM</span>
            </button>
          )}

          {versionProcedures.some((p) => p.id === 'proc-v10-caixa-cego-gestor') && (
            <button
              type="button"
              className={`nav-item-lh ${!isDashboardActive && activeId === 'proc-v10-caixa-cego-gestor' ? 'active' : ''}`}
              onClick={() => onSelectProcedure('proc-v10-caixa-cego-gestor')}
            >
              <span className="ic" style={{ color: '#10b981' }}>
                <Lock size={15} />
              </span>
              <span className="label">Caixa Cego Gestor</span>
              <span className="sidebar-mini-badge">Segurança</span>
            </button>
          )}
        </div>

        <div style={{ height: '1px', background: 'var(--border)', margin: '6px 4px 8px' }} />

        {searchResults !== null ? (
          /* RESULTADOS DA BUSCA */
          <div className="search-results-list">
            <div className="sidebar-section-title">
              Resultados da Busca ({searchResults.length})
            </div>
            {searchResults.length === 0 ? (
              <div className="search-empty-state">
                <span>Nenhum procedimento encontrado para "{searchQuery}".</span>
              </div>
            ) : (
              searchResults.map((proc) => {
                const isActive = !isDashboardActive && proc.id === activeId;
                return (
                  <button
                    key={proc.id}
                    className={`tree-leaf-item ${isActive ? 'active' : ''}`}
                    onClick={() => onSelectProcedure(proc.id)}
                  >
                    <FileText size={13} className="tree-leaf-icon" />
                    <div className="tree-leaf-text">
                      <span className="tree-leaf-title">{proc.title}</span>
                      {proc.systemPath && (
                        <span className="tree-leaf-path">{proc.systemPath}</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          /* NAVEGAÇÃO DIRETA: MÓDULOS ➔ ITENS / PROCEDIMENTOS */
          <div className="modules-accordion-tree">
            <div className="sidebar-section-title">
              Módulos e Procedimentos
            </div>

            {versionMenus.map((menu) => {
              const isExpanded = !!expandedMenus[menu.id];

              return (
                <div key={menu.id} className="module-group">
                  {/* Cabeçalho do Módulo */}
                  <div
                    className="module-header-row"
                    onClick={() => toggleMenuExpand(menu.id)}
                  >
                    <div className="module-header-left">
                      <span className="module-icon">{getIcon(menu.icon, 15)}</span>
                      <span className="module-title">{menu.label}</span>
                    </div>

                    <div className="module-header-right">
                      <span className="module-chevron">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </span>
                    </div>
                  </div>

                  {/* Itens do Módulo */}
                  {isExpanded && (
                    <div className="module-children">
                      {menu.submenus.map((item) => {
                        const matchingProc = findProcedureForMenuItem(menu.id, item.id);
                        const isItemActive = !isDashboardActive && matchingProc && matchingProc.id === activeId;

                        return (
                          <button
                            key={item.id}
                            className={`procedure-direct-btn ${isItemActive ? 'active' : ''}`}
                            onClick={() => {
                              if (matchingProc) {
                                onSelectProcedure(matchingProc.id);
                              } else {
                                onNewProcedure();
                              }
                            }}
                            title={matchingProc?.title || `Abrir manual de ${item.label}`}
                          >
                            <span className="procedure-direct-icon">
                              {matchingProc ? (
                                <FileText size={13} />
                              ) : (
                                <span className="item-empty-dot" />
                              )}
                            </span>
                            <span className="procedure-direct-title">{item.label}</span>
                            {matchingProc && (
                              <CheckCircle2 size={12} className="procedure-ready-check" />
                            )}
                          </button>
                        );
                      })}

                      {menu.submenus.length === 0 && (
                        <div className="module-empty-hint">
                          <span>Nenhum procedimento cadastrado.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rodapé Minimalista do Sidebar */}
      <div className="sidebar-footer-minimal">
        <button
          type="button"
          className="btn-new-proc-minimal"
          onClick={onNewProcedure}
        >
          <Plus size={14} />
          <span>Novo Manual</span>
        </button>

        <button
          type="button"
          className="btn-settings-minimal"
          onClick={onOpenSettings}
          title="Configurações de menus e módulos"
        >
          <Settings size={15} />
        </button>
      </div>
    </aside>
  );
};
