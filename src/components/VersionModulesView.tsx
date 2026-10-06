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
  Upload,
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
  isEditorEnabled?: boolean;
  onOpenImport?: (category?: string, menuId?: string, version?: 'v10' | 'r78') => void;
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
  isEditorEnabled = false,
  onOpenImport,
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const versionName = version === 'v10' ? 'Digifarma V10' : 'Digifarma Clássico';

  // Procedimentos da versão selecionada (APENAS revisados e aprovados/publicados)
  const versionProcedures = useMemo(() => {
    return procedures.filter((p) => {
      // Regra de ouro: só fica disponível para os usuários se for revisado e publicado
      const isApproved = p.status === 'aprovado' || !p.status;
      if (!isApproved) return false;

      const pVer = p.systemVersion || 'v10';
      if (version === 'v10') return pVer === 'v10';
      return pVer === 'classico' || pVer === 'r78';
    });
  }, [procedures, version]);

  // Menus da versão selecionada:
  // Se for Clássico: SOMENTE menus cadastrados como 'classico'/'r78' OU menus que possuam procedimentos aprovados para o Clássico!
  const versionMenus = useMemo(() => {
    return (menus || []).filter((m) => {
      const mVer = m.version;
      if (version === 'v10') {
        return mVer === 'v10' || mVer === 'ambos' || !mVer;
      }
      // Clássico
      if (mVer === 'classico' || mVer === 'r78') return true;
      // Se mVer for ambos ou indefinido, só mostra no Clássico se tiver procedimentos do clássico nele!
      return versionProcedures.some((p) => {
        const cat = (p.category || '').toLowerCase();
        const mId = (p.menuId || '').toLowerCase();
        const path = (p.systemPath || '').toLowerCase();
        const target = m.label.toLowerCase();
        return mId === m.id.toLowerCase() || cat === target || cat.includes(target) || path.includes(target);
      });
    });
  }, [menus, version, versionProcedures]);

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

          {onOpenImport && (
            <button
              type="button"
              className="btn-import-pop-compact"
              onClick={() => onOpenImport(activeMenu.label, activeMenu.id, version)}
              style={{
                marginLeft: 'auto',
                background: 'var(--red)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
              }}
            >
              <Upload size={13} />
              <span>Importar POP</span>
            </button>
          )}
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
          {/* Card Importar para o Módulo Ativo */}
          {onOpenImport && (
            <div
              className="image-card-item image-card-import-item"
              onClick={() => onOpenImport(activeMenu.label, activeMenu.id, version)}
              role="button"
              tabIndex={0}
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1.5px dashed var(--red)',
              }}
            >
              <div className="image-card-icon-center" style={{ color: 'var(--red)' }}>
                <Upload size={28} />
              </div>
              <h3 className="image-card-title">Importar POP</h3>
              <p className="image-card-subtitle">
                Adicionar PDF ou HTML em {activeMenu.label}
              </p>
              <span className="image-card-count-badge" style={{ background: 'var(--red)', color: '#fff' }}>
                + Importar Arquivo
              </span>
            </div>
          )}

          {/* Card Novo para o Módulo Ativo (Apenas se editor ativado) */}
          {isEditorEnabled && (
            <div
              className="image-card-item image-card-new-item"
              onClick={() => onNewProcedure(activeMenu.label, activeMenu.id, version)}
              role="button"
              tabIndex={0}
            >
              <div className="image-card-icon-center new-icon-center">
                <Plus size={28} />
              </div>
              <h3 className="image-card-title">Novo Manual</h3>
              <p className="image-card-subtitle">
                Cadastrar no Studio em {activeMenu.label}
              </p>
              <span className="image-card-count-badge new-badge">
                + Novo no Editor
              </span>
            </div>
          )}

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
              const reviewerName = proc.reviewedBy || proc.author || 'Qualidade Digifarma';
              return (
                <div
                  key={proc.id}
                  className="image-card-item proc-card-clean"
                  onClick={() => onSelectProcedure(proc.id, false)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="proc-clean-top-bar">
                    <div className="proc-clean-icon">
                      <ActiveIcon size={20} />
                    </div>
                    <span className="proc-reviewer-tag">
                      ✓ Liberado por: <strong>{reviewerName}</strong>
                    </span>
                  </div>
                  <h3 className="image-card-title">{proc.title}</h3>
                  <p className="image-card-subtitle-clean">
                    {proc.subtitle || 'Procedimento homologado e validado'}
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
            {searchResults.map((proc) => {
              const reviewerName = proc.reviewedBy || proc.author || 'Qualidade Digifarma';
              return (
                <div
                  key={proc.id}
                  className="image-card-item proc-card-clean"
                  onClick={() => onSelectProcedure(proc.id, false)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="proc-clean-top-bar">
                    <div className="proc-clean-icon">
                      <FileText size={20} />
                    </div>
                    <span className="proc-reviewer-tag">
                      ✓ Liberado por: <strong>{reviewerName}</strong>
                    </span>
                  </div>
                  <h3 className="image-card-title">{proc.title}</h3>
                  <p className="image-card-subtitle-clean">{proc.subtitle || 'Procedimento homologado e validado'}</p>

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
              );
            })}
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
                Você pode criar e organizar os módulos e rotinas desta versão acessando "Módulos" no menu lateral.
              </p>
              {onOpenConfig && (
                <button
                  type="button"
                  className="btn primary sm"
                  onClick={onOpenConfig}
                  style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Sliders size={14} />
                  <span>Gerenciar Módulos Agora</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
