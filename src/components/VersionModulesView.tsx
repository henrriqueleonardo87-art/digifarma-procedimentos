import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  ShoppingCart,
  FileText,
  BarChart3,
  Users,
  Package,
  ShieldAlert,
  ShieldCheck,
  Settings,
  ArrowLeft,
  ChevronRight,
  BookOpen,
  Printer,
  Sparkles,
  Search,
  Plus,
  FolderPlus,
  Boxes,
  Wrench,
  Truck,
  Database,
  Layers,
  Folder,
  Sliders,
} from 'lucide-react';
import type { Procedure, SystemMenu } from '../types/procedure';

interface VersionModulesViewProps {
  version: 'v10' | 'r78';
  procedures: Procedure[];
  menus: SystemMenu[];
  onSelectProcedure: (id: string, autoPrint?: boolean) => void;
  onBackToDashboard: () => void;
  onNewProcedure: (category?: string, menuId?: string, version?: 'v10' | 'r78') => void;
  onOpenConfig?: () => void;
}

// Mapeamento dinâmico de ícones para menus e submenus configurados
const getMenuIconComponent = (iconName?: string): React.FC<{ size?: number; className?: string }> => {
  switch (iconName) {
    case 'CreditCard':
      return CreditCard;
    case 'ShoppingCart':
      return ShoppingCart;
    case 'FileText':
      return FileText;
    case 'BarChart3':
      return BarChart3;
    case 'Users':
      return Users;
    case 'Package':
      return Package;
    case 'ShieldAlert':
      return ShieldAlert;
    case 'ShieldCheck':
      return ShieldCheck;
    case 'Settings':
      return Settings;
    case 'FolderPlus':
      return FolderPlus;
    case 'Boxes':
      return Boxes;
    case 'Wrench':
      return Wrench;
    case 'Truck':
      return Truck;
    case 'Database':
      return Database;
    case 'Layers':
      return Layers;
    default:
      return Folder;
  }
};

export const VersionModulesView: React.FC<VersionModulesViewProps> = ({
  version,
  procedures,
  menus,
  onSelectProcedure,
  onBackToDashboard,
  onNewProcedure,
  onOpenConfig,
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const versionName = version === 'v10' ? 'Digifarma V10' : 'Digifarma Clássico';

  // Filtra estritamente os MENUS criados em Configurações para esta versão
  const versionMenus = useMemo(() => {
    return (menus || []).filter((m) => {
      const mVer = m.version || 'ambos';
      if (mVer === 'ambos') return true;
      if (version === 'v10') return mVer === 'v10';
      return mVer === 'classico' || mVer === 'r78';
    });
  }, [menus, version]);

  // Procedimentos da versão selecionada
  const versionProcedures = useMemo(() => {
    return procedures.filter((p) => {
      const pVer = p.systemVersion || 'v10';
      if (version === 'v10') return pVer === 'v10' || pVer === 'ambos';
      return pVer === 'classico' || pVer === 'r78' || pVer === 'ambos';
    });
  }, [procedures, version]);

  // Módulo ativo atualmente selecionado (se houver)
  const activeMenu = useMemo(() => {
    if (!selectedModuleId) return null;
    return versionMenus.find((m) => m.id === selectedModuleId) || null;
  }, [selectedModuleId, versionMenus]);

  // Procedimentos pertencentes ao módulo selecionado
  const moduleProcedures = useMemo(() => {
    if (!selectedModuleId || !activeMenu) return [];

    const menuLabel = activeMenu.label.toLowerCase();
    const menuId = selectedModuleId.toLowerCase();

    return versionProcedures.filter((p) => {
      const cat = (p.category || '').toLowerCase();
      const mId = (p.menuId || '').toLowerCase();
      const path = (p.systemPath || '').toLowerCase();
      const title = p.title.toLowerCase();

      return (
        mId === menuId ||
        cat === menuLabel ||
        cat.includes(menuLabel) ||
        path.includes(menuLabel) ||
        title.includes(menuLabel) ||
        p.tags?.some((pt) => pt.toLowerCase().includes(menuLabel))
      );
    });
  }, [versionProcedures, selectedModuleId, activeMenu]);

  // Procedimentos filtrados pela busca
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const q = searchTerm.toLowerCase();
    return versionProcedures.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.subtitle?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.systemPath?.toLowerCase().includes(q)
    );
  }, [versionProcedures, searchTerm]);

  // =========================================================================
  // CENÁRIO 2: SUBMENUS E ROTINAS EM CARDS (QUANDO UM MÓDULO É CLICADO)
  // =========================================================================
  if (selectedModuleId && activeMenu) {
    const ActiveIcon = getMenuIconComponent(activeMenu.icon);
    const submenus = activeMenu.submenus || [];

    return (
      <div className="modules-drilldown-container">
        {/* Breadcrumb e Navegação de Retorno */}
        <div className="drilldown-nav-bar">
          <button
            type="button"
            className="btn-back-drilldown"
            onClick={() => setSelectedModuleId(null)}
          >
            <ArrowLeft size={16} />
            <span>Voltar aos Módulos</span>
          </button>

          <div className="drilldown-breadcrumbs">
            <span className="crumb-root" onClick={onBackToDashboard}>
              Início
            </span>
            <span className="crumb-sep">/</span>
            <span className="crumb-version" onClick={() => setSelectedModuleId(null)}>
              {versionName}
            </span>
            <span className="crumb-sep">/</span>
            <span className="crumb-active">{activeMenu.label}</span>
          </div>
        </div>

        {/* Cabeçalho do Módulo */}
        <div className="module-focus-header">
          <div className="module-focus-icon-wrap">
            <ActiveIcon size={28} />
          </div>
          <div>
            <h1 className="module-focus-title">Módulo {activeMenu.label}</h1>
            <p className="module-focus-sub">
              {submenus.length > 0
                ? `${submenus.length} rotinas e submenus configurados · Selecione uma opção para abrir o passo a passo homologado`
                : 'Selecione ou cadastre uma rotina abaixo para abrir o passo a passo homologado'}
            </p>
          </div>
        </div>

        {/* Grade de Submenus e Procedimentos em Cards */}
        <div className="image-cards-grid">
          {/* Card Novo para o Módulo Ativo */}
          <div
            className="image-card-item image-card-new-item"
            onClick={() => onNewProcedure(activeMenu.label, activeMenu.id, version)}
            role="button"
            tabIndex={0}
          >
            <div className="image-card-icon-center new-icon-center">
              <Plus size={28} />
            </div>
            <h3 className="image-card-title">Novo</h3>
            <p className="image-card-subtitle">
              Cadastrar rotina em {activeMenu.label}
            </p>
            <span className="image-card-count-badge new-badge">
              + Novo neste Módulo
            </span>
          </div>

          {/* Cards para cada Submenu configurado em Configurações */}
          {submenus.map((sub) => {
            const SubIcon = getMenuIconComponent(sub.icon || activeMenu.icon);
            const subProcs = moduleProcedures.filter((p) => {
              const subId = (p.submenuId || '').toLowerCase();
              const cat = (p.category || '').toLowerCase();
              const path = (p.systemPath || '').toLowerCase();
              const target = sub.label.toLowerCase();
              return subId === sub.id.toLowerCase() || cat.includes(target) || path.includes(target);
            });

            return (
              <div
                key={sub.id}
                className="image-card-item"
                onClick={() => {
                  if (subProcs.length > 0) {
                    onSelectProcedure(subProcs[0].id, false);
                  } else {
                    onNewProcedure(activeMenu.label, activeMenu.id, version);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="image-card-icon-center">
                  <SubIcon size={26} />
                </div>
                <h3 className="image-card-title">{sub.label}</h3>
                <p className="image-card-subtitle">
                  {subProcs.length > 0
                    ? subProcs[0].title
                    : `Rotina do módulo ${activeMenu.label}`}
                </p>

                {subProcs.length > 0 ? (
                  <div className="image-card-actions-quick" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="btn-subcard-action"
                      onClick={() => onSelectProcedure(subProcs[0].id, false)}
                      title="Abrir passo a passo completo"
                    >
                      <BookOpen size={13} />
                      <span>Abrir</span>
                      <ChevronRight size={12} />
                    </button>

                    <button
                      type="button"
                      className="btn-subcard-print"
                      onClick={() => onSelectProcedure(subProcs[0].id, true)}
                      title="Imprimir ou gerar PDF deste procedimento"
                    >
                      <Printer size={13} />
                      <span>PDF</span>
                    </button>
                  </div>
                ) : (
                  <span className="image-card-count-badge">
                    Submenu Configurado
                  </span>
                )}
              </div>
            );
          })}

          {/* Procedimentos vinculados diretamente a este módulo que não são de submenus acima */}
          {moduleProcedures
            .filter((proc) => !submenus.some((s) => (proc.submenuId || '').toLowerCase() === s.id.toLowerCase()))
            .map((proc) => {
              return (
                <div
                  key={proc.id}
                  className="image-card-item"
                  onClick={() => onSelectProcedure(proc.id, false)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="image-card-icon-center">
                    <ActiveIcon size={26} />
                  </div>
                  <h3 className="image-card-title">{proc.title}</h3>
                  <p className="image-card-subtitle">
                    {proc.subtitle || 'Clique para abrir o roteiro passo a passo'}
                  </p>

                  <div className="image-card-actions-quick" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="btn-subcard-action"
                      onClick={() => onSelectProcedure(proc.id, false)}
                      title="Abrir passo a passo completo"
                    >
                      <BookOpen size={13} />
                      <span>Abrir</span>
                      <ChevronRight size={12} />
                    </button>

                    <button
                      type="button"
                      className="btn-subcard-print"
                      onClick={() => onSelectProcedure(proc.id, true)}
                      title="Imprimir ou gerar PDF deste procedimento"
                    >
                      <Printer size={13} />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    );
  }

  // =========================================================================
  // CENÁRIO 1: GRADE DE MÓDULOS PRINCIPAIS EM CARDS (BASEADA EM CONFIGURAÇÕES)
  // =========================================================================
  return (
    <div className="modules-drilldown-container">
      {/* Topo do Módulo da Versão */}
      <div className="version-modules-hero">
        <div className="version-hero-badge">
          <Sparkles size={13} />
          <span>{version === 'v10' ? 'DIGIFARMA V10' : 'DIGIFARMA CLÁSSICO'}</span>
        </div>
        <h1 className="version-hero-title">
          {version === 'v10' ? 'Digifarma V10' : 'Digifarma Clássico'}
        </h1>
        <p className="version-hero-sub">
          Selecione o menu desejado para visualizar seus submenus e rotinas passo a passo
        </p>

        {/* Barra de Pesquisa Rápida */}
        <div className="version-search-wrap">
          <Search size={16} className="version-search-ic" />
          <input
            type="text"
            className="version-search-input"
            placeholder="Ou pesquise diretamente qualquer procedimento ou atalho..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="version-search-clear"
              onClick={() => setSearchTerm('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Se houver pesquisa ativa, mostra os resultados diretos */}
      {searchTerm.trim() ? (
        <div className="search-results-section">
          <h2 className="search-results-title">
            Resultados da busca ({searchResults.length})
          </h2>
          <div className="image-cards-grid">
            {searchResults.map((proc) => (
              <div
                key={proc.id}
                className="image-card-item"
                onClick={() => onSelectProcedure(proc.id, false)}
                role="button"
                tabIndex={0}
              >
                <div className="image-card-icon-center">
                  <FileText size={26} />
                </div>
                <h3 className="image-card-title">{proc.title}</h3>
                <p className="image-card-subtitle">{proc.subtitle}</p>

                <div className="image-card-actions-quick" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="btn-subcard-action"
                    onClick={() => onSelectProcedure(proc.id, false)}
                  >
                    <BookOpen size={13} />
                    <span>Abrir</span>
                    <ChevronRight size={12} />
                  </button>
                  <button
                    type="button"
                    className="btn-subcard-print"
                    onClick={() => onSelectProcedure(proc.id, true)}
                  >
                    <Printer size={13} />
                    <span>PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Grade de Menus em Cards Baseada nos Menus Cadastrados em Configurações */
        <div className="image-cards-grid">
          {/* Card Novo */}
          <div
            className="image-card-item image-card-new-item"
            onClick={() => onNewProcedure(undefined, undefined, version)}
            role="button"
            tabIndex={0}
          >
            <div className="image-card-icon-center new-icon-center">
              <Plus size={28} />
            </div>
            <h3 className="image-card-title">Novo</h3>
            <p className="image-card-subtitle">Cadastrar novo manual ou POP</p>
            <span className="image-card-count-badge new-badge">
              + Criar Procedimento
            </span>
          </div>

          {/* Cards dos Menus da Versão configurados pelo usuário */}
          {versionMenus.map((mod) => {
            const ModIcon = getMenuIconComponent(mod.icon);
            const count = versionProcedures.filter((p) => {
              const cat = (p.category || '').toLowerCase();
              const mId = (p.menuId || '').toLowerCase();
              const path = (p.systemPath || '').toLowerCase();
              const label = mod.label.toLowerCase();
              return (
                mId === mod.id.toLowerCase() ||
                cat === label ||
                cat.includes(label) ||
                path.includes(label) ||
                p.tags?.some((t) => t.toLowerCase() === label)
              );
            }).length;

            return (
              <div
                key={mod.id}
                className="image-card-item"
                onClick={() => setSelectedModuleId(mod.id)}
                role="button"
                tabIndex={0}
              >
                <div className="image-card-icon-center">
                  <ModIcon size={26} />
                </div>
                <h3 className="image-card-title">{mod.label}</h3>
                <p className="image-card-subtitle">
                  {mod.submenus && mod.submenus.length > 0
                    ? `${mod.submenus.length} ${mod.submenus.length === 1 ? 'rotina' : 'rotinas'} (${mod.submenus.map((s) => s.label).slice(0, 2).join(', ')}${mod.submenus.length > 2 ? '...' : ''})`
                    : `Módulo do ${versionName}`}
                </p>

                {count > 0 ? (
                  <span className="image-card-count-badge">
                    {count} {count === 1 ? 'procedimento' : 'procedimentos'}
                  </span>
                ) : mod.submenus && mod.submenus.length > 0 ? (
                  <span className="image-card-count-badge">
                    {mod.submenus.length} submenus
                  </span>
                ) : null}
              </div>
            );
          })}

          {/* Estado Vazio caso a versão não tenha nenhum menu cadastrado */}
          {versionMenus.length === 0 && (
            <div
              className="version-empty-menus-box"
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '40px 24px',
                background: 'rgba(30, 41, 59, 0.45)',
                borderRadius: '12px',
                border: '1px dashed #334155',
              }}
            >
              <FolderPlus size={40} style={{ color: 'var(--red)', margin: '0 auto 10px', opacity: 0.8 }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
                Nenhum módulo configurado para o {versionName}
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 16px' }}>
                Você pode criar e organizar os módulos e rotinas desta versão acessando "Personalizar" no menu lateral.
              </p>
              {onOpenConfig && (
                <button
                  type="button"
                  className="btn primary sm"
                  onClick={onOpenConfig}
                  style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Sliders size={14} />
                  <span>Personalizar Menus Agora</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
