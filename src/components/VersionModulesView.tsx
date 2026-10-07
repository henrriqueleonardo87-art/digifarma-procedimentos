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
  BookOpen,
  Printer,
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

  const versionName = version === 'v10' ? 'v10' : 'Clássico';

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

          {onOpenImport && (
            <button
              type="button"
              className="button subtle"
              onClick={() => onOpenImport(activeMenu.label, activeMenu.id, version)}
              style={{
                marginLeft: 'auto',
                padding: '6px 12px',
                fontSize: '11px',
              }}
              title="Importar POP em PDF ou HTML para este módulo"
            >
              <Upload size={12} />
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
                background: 'var(--bg-secondary)',
                border: '1.5px dashed var(--red)',
              }}
            >
              <div
                className="image-card-icon-center"
                style={{ color: 'var(--red)', background: 'var(--red-soft)' }}
              >
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
                <div
                  className="image-card-icon-center"
                  style={{ color: 'var(--red)', background: 'var(--red-soft)' }}
                >
                  <SubIcon size={24} />
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
                      title="Abrir passo a passo interativo"
                    >
                      <BookOpen size={12} />
                      <span>Abrir</span>
                    </button>

                    <button
                      type="button"
                      className="btn-subcard-print"
                      onClick={() => onSelectProcedure(subProcs[0].id, true)}
                      title="Visualizar / Imprimir em PDF"
                    >
                      <Printer size={12} />
                      <span>PDF</span>
                    </button>

                    <button
                      type="button"
                      className="btn-subcard-html"
                      onClick={() => downloadProcedureHtml(subProcs[0])}
                      title="Baixar versão HTML offline deste procedimento"
                    >
                      <FileText size={12} />
                      <span>HTML</span>
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
                      <ActiveIcon size={18} />
                    </div>
                    <span
                      className="proc-reviewer-tag"
                      title={`Liberado por: ${reviewerName}`}
                    >
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

          {/* Estado Vazio Moderno e Minimalista dentro de um Módulo sem Rotinas */}
          {submenus.length === 0 && moduleProcedures.length === 0 && (
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
                Nenhum POP cadastrado em {activeMenu.label}
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
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Upload size={16} />
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
  // CENÁRIO 1: GRADE DE MÓDULOS PRINCIPAIS EM CARDS (BASEADA EM CONFIGURAÇÕES)
  // =========================================================================
  return (
    <>
      {/* ── 1. Heading Oficial com Eyebrow, H1, Subtítulo e Capture ── */}
      <section className="heading">
        <div>
          <span className="eyebrow">REPOSITÓRIO &amp; MÓDULOS</span>
          <h1 id="pageTitle">Digifarma {version === 'v10' ? 'v10' : 'Clássico'}</h1>
          <p id="pageSubtitle">
            Repositório de rotinas e procedimentos operacionais padronizados do ERP Digifarma.
          </p>
        </div>
        <div className="capture">
          <span className="live-dot" /> Módulos cadastrados
          <span id="captured">
            {versionMenus.length} módulos · {versionProcedures.length} procedimentos
          </span>
        </div>
      </section>

      {/* ── 2. Barra Contínua de Filtros Globais (.filters) ── */}
      <section className="filters" aria-label="Filtros globais">
        <div className="filter store-filter" style={{ flex: 1, borderRight: 'none' }}>
          <label htmlFor="ver-search">BUSCA POR ROTINA OU PALAVRA-CHAVE</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              id="ver-search"
              type="text"
              placeholder="Pesquise por nome do procedimento, palavra-chave ou rotina..."
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
          <span className="live-dot" /> {versionProcedures.length} Homologados
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
            <span>Importar POP ({version === 'v10' ? 'v10' : 'Clássico'})</span>
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
                      <FileText size={18} />
                    </div>
                    <span
                      className="proc-reviewer-tag"
                      title={`Liberado por: ${reviewerName}`}
                    >
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
      ) : (
        /* Grade de Menus em Cards Baseada nos Menus Cadastrados em Configurações */
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

                {count > 0 ? (
                  <span className="image-card-count-badge">
                    {count} {count === 1 ? 'procedimento' : 'procedimentos'}
                  </span>
                ) : mod.submenus && mod.submenus.length > 0 ? (
                  <span className="image-card-count-badge">
                    {mod.submenus.length} submenus
                  </span>
                ) : (
                  <span className="image-card-count-badge" style={{ opacity: 0.7 }}>
                    Módulo ativo
                  </span>
                )}
              </div>
            );
          })}

          {/* Estado Vazio Moderno, Limpo e Minimalista em Branco e Vermelho */}
          {versionMenus.length === 0 && (
            <div
              className="version-empty-menus-box"
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '60px 28px',
                background: 'var(--bg-primary)',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                boxShadow: '0 8px 30px -4px rgba(0, 0, 0, 0.05)',
                marginTop: '1rem',
              }}
            >
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '18px',
                  background: 'var(--red-soft)',
                  border: '1px solid rgba(231, 76, 60, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 18px',
                  boxShadow: '0 6px 18px rgba(231, 76, 60, 0.18)',
                }}
              >
                <FolderPlus size={32} color="var(--red)" />
              </div>

              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                Nenhum módulo ativo no {versionName}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '500px', margin: '0 auto 26px', lineHeight: 1.6 }}>
                Você pode importar procedimentos oficiais em formato PDF e HTML ou estruturar os módulos do sistema nas configurações.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {onOpenImport && (
                  <button
                    type="button"
                    onClick={() => onOpenImport(undefined, undefined, version)}
                    style={{
                      background: 'var(--red)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '11px',
                      padding: '11px 24px',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(231, 76, 60, 0.35)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Upload size={17} />
                    <span>Importar POP para o {versionName}</span>
                  </button>
                )}

                {onOpenConfig && (
                  <button
                    type="button"
                    onClick={onOpenConfig}
                    style={{
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      border: '1.5px solid var(--border)',
                      borderRadius: '11px',
                      padding: '11px 22px',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Sliders size={16} color="var(--red)" />
                    <span>Configurar Módulos do Sistema</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
