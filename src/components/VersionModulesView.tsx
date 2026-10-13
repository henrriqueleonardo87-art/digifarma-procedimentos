import React, { useState, useMemo } from 'react';
import {
  Upload,
  Plus,
  ArrowLeft,
  BookOpen,
  Printer,
  FileText,
  FolderPlus,
  Folder,
  Package,
  Users,
  Truck,
  Tag,
  Boxes,
  FileInput,
  ClipboardCheck,
  Calendar,
  ArrowLeftRight,
  ShoppingCart,
  UserCheck,
  Award,
  ShieldCheck,
  DollarSign,
  Lock,
  CreditCard,
  TrendingUp,
  FileSpreadsheet,
  Receipt,
  Percent,
  FileCode,
  ShieldAlert,
  Settings,
  UserCog,
  Database,
  Layers,
  LayoutGrid,
  List,
} from 'lucide-react';
import type { Procedure, SystemMenu } from '../types/procedure';
import { downloadProcedureHtml } from '../lib/htmlExporter';

interface VersionModulesViewProps {
  version: 'v10' | 'r78';
  procedures: Procedure[];
  menus: SystemMenu[];
  onSelectProcedure: (id: string, autoPrint?: boolean) => void;
  onBackToDashboard: () => void;
  onNewProcedure: (category?: string, menuId?: string, version?: 'v10' | 'r78') => void;
  onOpenConfig?: () => void;
  isEditorEnabled?: boolean;
  onOpenImport?: (defaultCategory?: string, defaultMenuId?: string, forceVersion?: 'v10' | 'r78') => void;
}

const getMenuIconComponent = (iconName?: string) => {
  switch (iconName) {
    case 'FolderPlus': return FolderPlus;
    case 'Package': return Package;
    case 'Users': return Users;
    case 'Truck': return Truck;
    case 'Tag': return Tag;
    case 'Boxes': return Boxes;
    case 'FileInput': return FileInput;
    case 'ClipboardCheck': return ClipboardCheck;
    case 'CalendarAlert': return Calendar;
    case 'ArrowLeftRight': return ArrowLeftRight;
    case 'ShoppingCart': return ShoppingCart;
    case 'UserCheck': return UserCheck;
    case 'Award': return Award;
    case 'ShieldCheck': return ShieldCheck;
    case 'DollarSign': return DollarSign;
    case 'Lock': return Lock;
    case 'CreditCard': return CreditCard;
    case 'TrendingUp': return TrendingUp;
    case 'FileSpreadsheet': return FileSpreadsheet;
    case 'Receipt': return Receipt;
    case 'Percent': return Percent;
    case 'FileCode': return FileCode;
    case 'ShieldAlert': return ShieldAlert;
    case 'BookOpen': return BookOpen;
    case 'Settings': return Settings;
    case 'UserCog': return UserCog;
    case 'Database': return Database;
    case 'Layers': return Layers;
    default: return Folder;
  }
};

export const VersionModulesView: React.FC<VersionModulesViewProps> = ({
  version,
  procedures,
  menus,
  onSelectProcedure,
  onBackToDashboard,
  onNewProcedure,
  isEditorEnabled = false,
  onOpenImport,
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'publicados' | 'revisao' | 'despublicados' | 'inativos' | 'todos'>('publicados');
  const [viewTab, setViewTab] = useState<'modules' | 'list'>('modules');

  const versionName = version === 'v10' ? 'v10' : 'Clássico';

  // Todos os procedimentos correspondentes a esta versão do sistema
  const allVersionProcedures = useMemo(() => {
    return (procedures || []).filter((p) => {
      const pVer = p.systemVersion || 'v10';
      if (version === 'v10') return pVer === 'v10';
      return pVer === 'classico' || pVer === 'r78';
    });
  }, [procedures, version]);

  // Contagens por status
  const publishedCount = useMemo(() => {
    return allVersionProcedures.filter((p) => (p.status === 'aprovado' || !p.status) && p.isActive !== false).length;
  }, [allVersionProcedures]);

  const reviewCount = useMemo(() => {
    return allVersionProcedures.filter(
      (p) => (p.status === 'pendente' || p.status === 'ajustes_solicitados') && p.isActive !== false
    ).length;
  }, [allVersionProcedures]);

  const unpublishedCount = useMemo(() => {
    return allVersionProcedures.filter((p) => p.status === 'despublicado' && p.isActive !== false).length;
  }, [allVersionProcedures]);

  const inactiveCount = useMemo(() => {
    return allVersionProcedures.filter((p) => p.isActive === false).length;
  }, [allVersionProcedures]);

  // Procedimentos da versão filtrados pelo statusFilter (padrão: publicados)
  const versionProcedures = useMemo(() => {
    return allVersionProcedures.filter((p) => {
      if (statusFilter === 'publicados') {
        return (p.status === 'aprovado' || !p.status) && p.isActive !== false;
      }
      if (statusFilter === 'revisao') {
        return (p.status === 'pendente' || p.status === 'ajustes_solicitados') && p.isActive !== false;
      }
      if (statusFilter === 'despublicados') {
        return p.status === 'despublicado' && p.isActive !== false;
      }
      if (statusFilter === 'inativos') {
        return p.isActive === false;
      }
      return true; // 'todos'
    });
  }, [allVersionProcedures, statusFilter]);

  // Menus da versão selecionada
  const versionMenus = useMemo(() => {
    return (menus || []).filter((m) => {
      const mVer = m.version;
      if (version === 'v10') {
        return mVer === 'v10' || mVer === 'ambos' || !mVer;
      }
      if (mVer === 'classico' || mVer === 'r78') return true;
      return allVersionProcedures.some((p) => {
        const cat = (p.category || '').toLowerCase();
        const mId = (p.menuId || '').toLowerCase();
        const path = (p.systemPath || '').toLowerCase();
        const target = m.label.toLowerCase();
        return mId === m.id.toLowerCase() || cat === target || cat.includes(target) || path.includes(target);
      });
    });
  }, [menus, version, allVersionProcedures]);

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

  // Procedimentos filtrados pela busca textual
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

  // Helper para renderizar tag/badge de estado
  const renderStatusBadge = (p: Procedure) => {
    if (p.isActive === false) {
      return (
        <span className="tag warn" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 700 }}>
          Inativo
        </span>
      );
    }
    if (p.status === 'despublicado') {
      return (
        <span className="tag" style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1', fontWeight: 700 }}>
          Despublicado
        </span>
      );
    }
    if (p.status === 'pendente') {
      return (
        <span className="tag warn" style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', fontWeight: 700 }}>
          Em Revisão
        </span>
      );
    }
    if (p.status === 'ajustes_solicitados') {
      return (
        <span className="tag danger" style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', fontWeight: 700 }}>
          Ajustes
        </span>
      );
    }
    return (
      <span className="tag success" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontWeight: 700 }}>
        Publicado
      </span>
    );
  };

  // Contagem de procedimentos de um módulo com base no filtro ativo
  const getMenuCount = (modId: string, modLabel: string) => {
    return versionProcedures.filter((p) => {
      const cat = (p.category || '').toLowerCase();
      const mId = (p.menuId || '').toLowerCase();
      const path = (p.systemPath || '').toLowerCase();
      const label = modLabel.toLowerCase();
      return (
        mId === modId.toLowerCase() ||
        cat === label ||
        cat.includes(label) ||
        path.includes(label) ||
        p.tags?.some((t) => t.toLowerCase() === label)
      );
    }).length;
  };

  // =========================================================================
  // CENÁRIO 2: SUBMENUS E ROTINAS EM CARDS (QUANDO UM MÓDULO É CLICADO)
  // =========================================================================
  if (selectedModuleId && activeMenu) {
    const ActiveIcon = getMenuIconComponent(activeMenu.icon);

    return (
      <div className="modules-drilldown-container" style={{ marginTop: '20px' }}>
        {/* Breadcrumb e Navegação de Retorno */}
        <div className="drilldown-nav-bar" style={{ paddingTop: '14px', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-back-drilldown"
              onClick={() => setSelectedModuleId(null)}
              title="Voltar para a lista de módulos"
            >
              <ArrowLeft size={14} />
              <span>Voltar aos Módulos</span>
            </button>

            <div className="drilldown-breadcrumbs">
              <span className="crumb-root" onClick={onBackToDashboard} title="Ir para a Visão Geral">
                Início
              </span>
              <span className="crumb-sep">/</span>
              <span className="crumb-version" onClick={() => setSelectedModuleId(null)} title={`Módulos ${versionName}`}>
                {versionName}
              </span>
              <span className="crumb-sep">/</span>
              <span className="crumb-active">{activeMenu.label}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            {/* Filtro de Status no Drilldown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              <option value="publicados">Publicados ({publishedCount})</option>
              <option value="revisao">Em Revisão ({reviewCount})</option>
              <option value="despublicados">Despublicados ({unpublishedCount})</option>
              <option value="inativos">Inativos ({inactiveCount})</option>
              <option value="todos">Todos ({allVersionProcedures.length})</option>
            </select>

            {onOpenImport && (
              <button
                type="button"
                className="button subtle"
                onClick={() => onOpenImport(activeMenu.label, activeMenu.id, version)}
                style={{ padding: '6px 12px', fontSize: '11px' }}
                title="Importar POP em PDF ou HTML para este módulo"
              >
                <Upload size={12} />
                <span>Importar POP</span>
              </button>
            )}
          </div>
        </div>

        {/* Cabeçalho do Módulo Ativo */}
        <div className="drilldown-header-hero" style={{ marginBottom: '24px' }}>
          <div className="drilldown-hero-icon" style={{ color: 'var(--red)', background: 'var(--red-soft)' }}>
            <ActiveIcon size={32} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="tag" style={{ background: '#fff0f0', color: 'var(--red)', fontWeight: 700 }}>
                {versionName}
              </span>
              <span className="tag">
                {moduleProcedures.length} {moduleProcedures.length === 1 ? 'procedimento' : 'procedimentos'} ({statusFilter})
              </span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: 'var(--ink)' }}>
              {activeMenu.label}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
              Procedimentos operacionais homologados e rotinas oficiais do ERP Digifarma.
            </p>
          </div>
        </div>

        {/* Grade de Procedimentos e Submenus dentro deste Módulo */}
        <div className="image-cards-grid">
          {/* Card Importar POP em Destaque para este módulo */}
          {onOpenImport && (
            <div
              className="image-card-item image-card-import-item"
              onClick={() => onOpenImport(activeMenu.label, activeMenu.id, version)}
              role="button"
              tabIndex={0}
              style={{
                background: 'var(--bg-secondary)',
                border: '1.5px dashed var(--red)',
              }}
            >
              <div className="image-card-icon-center" style={{ color: 'var(--red)', background: 'var(--red-soft)' }}>
                <Upload size={24} />
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

          {/* Card Novo para o Módulo Ativo (se editor ativado) */}
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

          {/* Lista de TODOS os procedimentos deste módulo */}
          {moduleProcedures.map((proc) => {
            return (
              <div
                key={proc.id}
                className="image-card-item proc-card-clean"
                onClick={() => onSelectProcedure(proc.id, false)}
                role="button"
                tabIndex={0}
              >
                <div className="proc-clean-top-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div className="proc-clean-icon">
                      <ActiveIcon size={16} />
                    </div>
                    {renderStatusBadge(proc)}
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {(proc.pdfFileUrl || proc.formatType === 'pdf' || proc.formatType === 'both') && (
                      <span className="tag" style={{ background: '#fff0f0', color: 'var(--red)', fontSize: '9px', padding: '2px 6px' }}>PDF</span>
                    )}
                    {(proc.htmlFileData || proc.formatType === 'html' || proc.formatType === 'both') && (
                      <span className="tag" style={{ background: '#eef5fc', color: '#3b82f6', fontSize: '9px', padding: '2px 6px' }}>HTML</span>
                    )}
                  </div>
                </div>

                <h3 className="image-card-title">{proc.title}</h3>
                <p className="image-card-subtitle-clean">
                  {proc.subtitle || 'Procedimento operacional padronizado'}
                </p>

                <div className="image-card-actions-quick" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="btn-subcard-action"
                    onClick={() => onSelectProcedure(proc.id, false)}
                    title="Abrir rotina"
                  >
                    <BookOpen size={12} />
                    <span>Abrir</span>
                  </button>

                  <button
                    type="button"
                    className="btn-subcard-print"
                    onClick={() => onSelectProcedure(proc.id, true)}
                    title="Visualizar / Imprimir em PDF"
                  >
                    <Printer size={12} />
                    <span>PDF</span>
                  </button>

                  <button
                    type="button"
                    className="btn-subcard-html"
                    onClick={() => downloadProcedureHtml(proc)}
                    title="Baixar versão HTML offline deste procedimento"
                  >
                    <FileText size={12} />
                    <span>HTML</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Estado Vazio dentro de um Módulo sem Rotinas */}
          {moduleProcedures.length === 0 && (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '48px 24px',
                background: 'var(--bg-primary)',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                margin: '16px 0',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: 'var(--red-soft)',
                  border: '1px solid rgba(231, 76, 60, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 4px 12px rgba(231, 76, 60, 0.15)',
                }}
              >
                <span style={{ color: 'var(--red)', display: 'inline-flex' }}>
                  <ActiveIcon size={26} />
                </span>
              </div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                Nenhum POP com status "{statusFilter}" em {activeMenu.label}
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 20px', lineHeight: 1.55 }}>
                Disponibilize os manuais oficiais em PDF ou HTML para sua equipe farmacêutica neste módulo.
              </p>
              {onOpenImport && (
                <button
                  type="button"
                  onClick={() => onOpenImport(activeMenu.label, activeMenu.id, version)}
                  style={{
                    background: 'var(--red)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 22px',
                    fontSize: '0.86rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(231, 76, 60, 0.35)',
                  }}
                >
                  <Upload size={14} />
                  <span>Importar POP para {activeMenu.label}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // CENÁRIO 1: GRADE DE MÓDULOS PRINCIPAIS EM CARDS + LISTAGEM COMPLETA
  // =========================================================================
  return (
    <>
      {/* ── 1. Heading Oficial com Eyebrow, H1, Subtítulo e Capture ── */}
      <section className="heading">
        <div>
          <span className="eyebrow">REPOSITÓRIO &amp; MÓDULOS</span>
          <h1 id="pageTitle">Digifarma {version === 'v10' ? 'v10' : 'Clássico'}</h1>
          <p id="pageSubtitle">
            Repositório unificado de rotinas e procedimentos operacionais padronizados.
          </p>
        </div>
        <div className="capture">
          <span className="live-dot" /> Módulos cadastrados
          <span id="captured">
            {versionMenus.length} módulos · {versionProcedures.length} {statusFilter}
          </span>
        </div>
      </section>

      {/* ── 2. Barra Contínua de Filtros Globais (.filters) ── */}
      <section className="filters" aria-label="Filtros globais">
        {/* Filtro de Status conforme solicitado pelo usuário (padrão: Publicados) */}
        <div className="filter">
          <label htmlFor="ver-status">FILTRO DE STATUS</label>
          <select
            id="ver-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="publicados">Publicados ({publishedCount})</option>
            <option value="revisao">Em Revisão ({reviewCount})</option>
            <option value="despublicados">Despublicados ({unpublishedCount})</option>
            <option value="inativos">Inativos ({inactiveCount})</option>
            <option value="todos">Todos os status ({allVersionProcedures.length})</option>
          </select>
        </div>

        {/* Alternância de Visualização: Módulos vs Lista Completa */}
        <div className="filter">
          <label>VISUALIZAÇÃO</label>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setViewTab('modules')}
              style={{
                background: viewTab === 'modules' ? 'var(--red)' : 'var(--bg-secondary)',
                color: viewTab === 'modules' ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <LayoutGrid size={12} />
              <span>Módulos</span>
            </button>
            <button
              type="button"
              onClick={() => setViewTab('list')}
              style={{
                background: viewTab === 'list' ? 'var(--red)' : 'var(--bg-secondary)',
                color: viewTab === 'list' ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <List size={12} />
              <span>Lista Geral</span>
            </button>
          </div>
        </div>

        {/* Busca textual */}
        <div className="filter store-filter" style={{ flex: 1, borderRight: 'none' }}>
          <label htmlFor="ver-search">BUSCA POR ROTINA OU PALAVRA-CHAVE</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              id="ver-search"
              type="text"
              placeholder="Pesquise por nome do procedimento, rota ou palavra-chave..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  border: 'none',
                  background: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  fontSize: '11px',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="status" style={{ marginLeft: 'auto' }}>
          <span className="live-dot" /> {publishedCount} Publicados
        </div>
      </section>

      {/* Ações Rápidas */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '22px', flexWrap: 'wrap' }}>
        {onOpenImport && (
          <button
            type="button"
            className="button primary"
            onClick={() => onOpenImport(undefined, undefined, version)}
          >
            <Upload size={14} />
            <span>Importar POP ({versionName})</span>
          </button>
        )}

        {isEditorEnabled && onNewProcedure && (
          <button
            type="button"
            className="button subtle"
            onClick={() => onNewProcedure(undefined, undefined, version)}
          >
            <Plus size={14} />
            <span>Novo no Editor</span>
          </button>
        )}
      </div>

      {/* Se houver pesquisa ativa, mostra os resultados diretos */}
      {searchTerm.trim() ? (
        <div className="search-results-section">
          <h2 className="search-results-title">
            Resultados da busca ({searchResults.length})
          </h2>
          <div className="image-cards-grid">
            {searchResults.map((proc) => {
              return (
                <div
                  key={proc.id}
                  className="image-card-item proc-card-clean"
                  onClick={() => onSelectProcedure(proc.id, false)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="proc-clean-top-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="proc-clean-icon">
                        <FileText size={16} />
                      </div>
                      {renderStatusBadge(proc)}
                    </div>
                    <span className="tag">{proc.category || 'Geral'}</span>
                  </div>
                  <h3 className="image-card-title">{proc.title}</h3>
                  <p className="image-card-subtitle-clean">{proc.subtitle || 'Procedimento homologado e validado'}</p>

                  <div className="image-card-actions-quick" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="btn-subcard-action"
                      onClick={() => onSelectProcedure(proc.id, false)}
                      title="Abrir passo a passo interativo"
                    >
                      <BookOpen size={12} />
                      <span>Abrir</span>
                    </button>

                    <button
                      type="button"
                      className="btn-subcard-print"
                      onClick={() => onSelectProcedure(proc.id, true)}
                      title="Visualizar / Imprimir em PDF"
                    >
                      <Printer size={12} />
                      <span>PDF</span>
                    </button>

                    <button
                      type="button"
                      className="btn-subcard-html"
                      onClick={() => downloadProcedureHtml(proc)}
                      title="Baixar versão HTML offline deste procedimento"
                    >
                      <FileText size={12} />
                      <span>HTML</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : viewTab === 'list' ? (
        /* VISUALIZAÇÃO: TABELA GERAL COMPLETA DE PROCEDIMENTOS */
        <div className="panel" style={{ marginTop: '10px' }}>
          <div className="panel-title">
            <div>
              <h3>Todos os Procedimentos do {versionName} ({versionProcedures.length})</h3>
              <p>Filtro ativo: {statusFilter.toUpperCase()}</p>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '50%' }}>PROCEDIMENTO</th>
                  <th style={{ width: '20%' }}>MÓDULO</th>
                  <th style={{ width: '15%' }}>STATUS</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {versionProcedures.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--muted)' }}>
                      Nenhum procedimento encontrado com o status "{statusFilter}".
                    </td>
                  </tr>
                ) : (
                  versionProcedures.map((proc) => (
                    <tr
                      key={proc.id}
                      onClick={() => onSelectProcedure(proc.id, false)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <strong style={{ opacity: proc.isActive === false ? 0.6 : 1 }}>
                              {proc.title}
                            </strong>
                            {(proc.pdfFileUrl || proc.formatType === 'pdf' || proc.formatType === 'both') && (
                              <span className="tag" style={{ background: '#fff0f0', color: 'var(--red)', fontSize: '9px', padding: '1px 5px' }}>
                                PDF
                              </span>
                            )}
                            {(proc.htmlFileData || proc.formatType === 'html' || proc.formatType === 'both') && (
                              <span className="tag" style={{ background: '#eef5fc', color: '#3b82f6', fontSize: '9px', padding: '1px 5px' }}>
                                HTML
                              </span>
                            )}
                          </div>
                          {proc.systemPath && (
                            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                              {proc.systemPath}
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <span className="tag">{proc.category || 'Geral'}</span>
                      </td>

                      <td>
                        {renderStatusBadge(proc)}
                      </td>

                      <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="button subtle"
                          style={{ padding: '5px 10px', fontSize: '11px' }}
                          onClick={() => onSelectProcedure(proc.id, false)}
                        >
                          Abrir
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VISUALIZAÇÃO: GRADE DE MÓDULOS EM CARDS */
        <>
          <div className="image-cards-grid">
            {/* Card Importar POP em Destaque */}
            {onOpenImport && (
              <div
                className="image-card-item image-card-import-item"
                onClick={() => onOpenImport(undefined, undefined, version)}
                role="button"
                tabIndex={0}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1.5px dashed var(--red)',
                  boxShadow: 'var(--shadow-subtle)',
                }}
              >
                <div
                  className="image-card-icon-center"
                  style={{
                    color: 'var(--red)',
                    background: 'var(--red-soft)',
                  }}
                >
                  <Upload size={24} />
                </div>
                <h3 className="image-card-title">Importar POP</h3>
                <p className="image-card-subtitle">
                  Anexe manuais em PDF ou HTML para o {versionName}
                </p>
                <span
                  className="image-card-count-badge"
                  style={{
                    background: 'var(--red)',
                    color: '#ffffff',
                  }}
                >
                  + Importar Arquivo
                </span>
              </div>
            )}

            {/* Card Novo (apenas se editor ativado) */}
            {isEditorEnabled && onNewProcedure && (
              <div
                className="image-card-item image-card-new-item"
                onClick={() => onNewProcedure(undefined, undefined, version)}
                role="button"
                tabIndex={0}
              >
                <div className="image-card-icon-center new-icon-center">
                  <Plus size={26} />
                </div>
                <h3 className="image-card-title">Novo Manual</h3>
                <p className="image-card-subtitle">Criar slides interativos no estúdio</p>
                <span className="image-card-count-badge new-badge">
                  + Criar no Editor
                </span>
              </div>
            )}

            {/* Cards dos Menus da Versão configurados */}
            {versionMenus.map((mod) => {
              const ModIcon = getMenuIconComponent(mod.icon);
              const count = getMenuCount(mod.id, mod.label);

              return (
                <div
                  key={mod.id}
                  className="image-card-item"
                  onClick={() => setSelectedModuleId(mod.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div
                    className="image-card-icon-center"
                    style={{ color: 'var(--red)', background: 'var(--red-soft)' }}
                  >
                    <ModIcon size={24} />
                  </div>
                  <h3 className="image-card-title">{mod.label}</h3>
                  <p className="image-card-subtitle">
                    {mod.submenus && mod.submenus.length > 0
                      ? `${mod.submenus.length} ${mod.submenus.length === 1 ? 'rotina' : 'rotinas'} (${mod.submenus.map((s) => s.label).slice(0, 2).join(', ')}${mod.submenus.length > 2 ? '...' : ''})`
                      : `Módulo do ${versionName}`}
                  </p>

                  <span className="image-card-count-badge">
                    {count} {count === 1 ? 'procedimento' : 'procedimentos'} ({statusFilter})
                  </span>
                </div>
              );
            })}
          </div>

          {/* TABELA DE PROCEDIMENTOS RECENTES DA VERSÃO ABAIXO DOS MÓDULOS */}
          <div className="panel" style={{ marginTop: '28px' }}>
            <div className="panel-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3>Procedimentos da Versão ({versionProcedures.length})</h3>
                <p>Exibindo: {statusFilter.toUpperCase()}</p>
              </div>
              <button
                type="button"
                className="button subtle"
                onClick={() => setViewTab('list')}
                style={{ fontSize: '11px', padding: '5px 10px' }}
              >
                Ver em tela cheia
              </button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '50%' }}>PROCEDIMENTO</th>
                    <th style={{ width: '20%' }}>MÓDULO</th>
                    <th style={{ width: '15%' }}>STATUS</th>
                    <th style={{ width: '15%', textAlign: 'right' }}>AÇÃO</th>
                  </tr>
                </thead>
                <tbody>
                  {versionProcedures.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--muted)' }}>
                        Nenhum procedimento encontrado com o status "{statusFilter}".
                      </td>
                    </tr>
                  ) : (
                    versionProcedures.slice(0, 10).map((proc) => (
                      <tr
                        key={proc.id}
                        onClick={() => onSelectProcedure(proc.id, false)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <strong style={{ opacity: proc.isActive === false ? 0.6 : 1 }}>
                                {proc.title}
                              </strong>
                              {(proc.pdfFileUrl || proc.formatType === 'pdf' || proc.formatType === 'both') && (
                                <span className="tag" style={{ background: '#fff0f0', color: 'var(--red)', fontSize: '9px', padding: '1px 5px' }}>
                                  PDF
                                </span>
                              )}
                              {(proc.htmlFileData || proc.formatType === 'html' || proc.formatType === 'both') && (
                                <span className="tag" style={{ background: '#eef5fc', color: '#3b82f6', fontSize: '9px', padding: '1px 5px' }}>
                                  HTML
                                </span>
                              )}
                            </div>
                            {proc.systemPath && (
                              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                                {proc.systemPath}
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <span className="tag">{proc.category || 'Geral'}</span>
                        </td>

                        <td>
                          {renderStatusBadge(proc)}
                        </td>

                        <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="button subtle"
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                            onClick={() => onSelectProcedure(proc.id, false)}
                          >
                            Abrir
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
};
