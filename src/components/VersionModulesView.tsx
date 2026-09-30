import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  ShoppingCart,
  FileText,
  BarChart3,
  Users,
  Package,
  ShieldAlert,
  Settings,
  ArrowLeft,
  ChevronRight,
  BookOpen,
  Printer,
  Sparkles,
  Search,
  Plus,
} from 'lucide-react';
import type { Procedure, SystemMenu } from '../types/procedure';

interface VersionModulesViewProps {
  version: 'v10' | 'r78';
  procedures: Procedure[];
  menus: SystemMenu[];
  onSelectProcedure: (id: string, autoPrint?: boolean) => void;
  onBackToDashboard: () => void;
  onNewProcedure: (category?: string, menuId?: string, version?: 'v10' | 'r78') => void;
}

interface ModuleCardDef {
  id: string;
  title: string;
  subtitle: string;
  icon: React.FC<{ size?: number; className?: string }>;
  tags: string[];
}

// Módulos base padronizados no formato exato da imagem de referência
const MODULE_DEFS: ModuleCardDef[] = [
  {
    id: 'caixa',
    title: 'Caixa',
    subtitle: 'Abrir e gerenciar caixa',
    icon: CreditCard,
    tags: ['caixa', 'financeiro', 'sangria', 'fechamento'],
  },
  {
    id: 'vendas',
    title: 'Vendas',
    subtitle: 'Nova venda e consultas',
    icon: ShoppingCart,
    tags: ['venda', 'balcao', 'f7', 'atendimento', 'fidelidade'],
  },
  {
    id: 'notas-fiscais',
    title: 'Notas Fiscais',
    subtitle: 'Emissão e consulta',
    icon: FileText,
    tags: ['fiscal', 'nfce', 'nfe', 'xml', 'danfe'],
  },
  {
    id: 'estatisticas',
    title: 'Estatísticas',
    subtitle: 'Relatórios e gráficos',
    icon: BarChart3,
    tags: ['estatisticas', 'relatorio', 'metricas', 'indicadores'],
  },
  {
    id: 'clientes',
    title: 'Clientes',
    subtitle: 'Cadastro de clientes',
    icon: Users,
    tags: ['cliente', 'convenio', 'cadastro', 'cpf', '360'],
  },
  {
    id: 'estoque',
    title: 'Estoque',
    subtitle: 'Inventário e validades',
    icon: Package,
    tags: ['estoque', 'inventario', 'lote', 'validade', 'pvps'],
  },
  {
    id: 'controlados',
    title: 'Controlados',
    subtitle: 'Portaria 344 e Anvisa',
    icon: ShieldAlert,
    tags: ['sngpc', 'controlado', 'portaria344', 'receita', 'anvisa'],
  },
  {
    id: 'configuracoes',
    title: 'Configurações',
    subtitle: 'Usuários e parâmetros',
    icon: Settings,
    tags: ['config', 'usuario', 'permissao', 'alcada', 'backup'],
  },
];

export const VersionModulesView: React.FC<VersionModulesViewProps> = ({
  version,
  procedures,
  onSelectProcedure,
  onBackToDashboard,
  onNewProcedure,
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const versionName = version === 'v10' ? 'Digifarma V10' : 'Digifarma R78';

  // Procedimentos da versão selecionada
  const versionProcedures = useMemo(() => {
    return procedures.filter((p) => {
      const pVer = p.systemVersion || 'v10';
      if (version === 'v10') return pVer === 'v10' || pVer === 'ambos';
      return pVer === 'classico' || pVer === 'r78' || pVer === 'ambos';
    });
  }, [procedures, version]);

  // Procedimentos pertencentes ao módulo selecionado
  const moduleProcedures = useMemo(() => {
    if (!selectedModuleId) return [];

    const modDef = MODULE_DEFS.find((m) => m.id === selectedModuleId);
    const tags = modDef?.tags || [selectedModuleId];

    return versionProcedures.filter((p) => {
      const cat = (p.category || '').toLowerCase();
      const mId = (p.menuId || '').toLowerCase();
      const subId = (p.submenuId || '').toLowerCase();
      const title = p.title.toLowerCase();
      const path = (p.systemPath || '').toLowerCase();

      return tags.some(
        (t) =>
          cat.includes(t) ||
          mId.includes(t) ||
          subId.includes(t) ||
          title.includes(t) ||
          path.includes(t) ||
          p.tags?.some((pt) => pt.toLowerCase().includes(t))
      );
    });
  }, [versionProcedures, selectedModuleId]);

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

  const activeModuleDef = MODULE_DEFS.find((m) => m.id === selectedModuleId);

  // =========================================================================
  // CENÁRIO 2: SUBMENUS EM CARDS (QUANDO UM MÓDULO É CLICADO)
  // =========================================================================
  if (selectedModuleId && activeModuleDef) {
    const ActiveIcon = activeModuleDef.icon;

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
            <span className="crumb-active">{activeModuleDef.title}</span>
          </div>
        </div>

        {/* Cabeçalho do Módulo */}
        <div className="module-focus-header">
          <div className="module-focus-icon-wrap">
            <ActiveIcon size={28} />
          </div>
          <div>
            <h1 className="module-focus-title">Módulo {activeModuleDef.title}</h1>
            <p className="module-focus-sub">
              {activeModuleDef.subtitle} · Selecione o submenu abaixo para abrir o passo a passo homologado
            </p>
          </div>
        </div>

        {/* Grade de Submenus em Cards Exatamente como a Imagem */}
        <div className="image-cards-grid">
          {/* Card Novo para o Módulo Ativo */}
          <div
            className="image-card-item image-card-new-item"
            onClick={() => onNewProcedure(activeModuleDef.title, activeModuleDef.id, version)}
            role="button"
            tabIndex={0}
          >
            <div className="image-card-icon-center new-icon-center">
              <Plus size={28} />
            </div>
            <h3 className="image-card-title">Novo</h3>
            <p className="image-card-subtitle">
              Cadastrar rotina em {activeModuleDef.title}
            </p>
            <span className="image-card-count-badge new-badge">
              + Novo neste Módulo
            </span>
          </div>

          {moduleProcedures.map((proc) => {
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
  // CENÁRIO 1: GRADE DE MÓDULOS PRINCIPAIS EM CARDS (ESTILO DA IMAGEM)
  // =========================================================================
  return (
    <div className="modules-drilldown-container">
      {/* Topo do Módulo da Versão */}
      <div className="version-modules-hero">
        <div className="version-hero-badge">
          <Sparkles size={13} />
          <span>{version === 'v10' ? 'DIGIFARMA V10' : 'DIGIFARMA R78'}</span>
        </div>
        <h1 className="version-hero-title">
          {version === 'v10' ? 'Digifarma V10' : 'Digifarma R78'}
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
        /* Grade de Menus em Cards Idêntica à Imagem de Referência */
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

          {MODULE_DEFS.map((mod) => {
            const ModIcon = mod.icon;
            const count = versionProcedures.filter((p) => {
              const cat = (p.category || '').toLowerCase();
              const mId = (p.menuId || '').toLowerCase();
              const subId = (p.submenuId || '').toLowerCase();
              const title = p.title.toLowerCase();
              return mod.tags.some(
                (t) =>
                  cat.includes(t) ||
                  mId.includes(t) ||
                  subId.includes(t) ||
                  title.includes(t)
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
                <h3 className="image-card-title">{mod.title}</h3>
                <p className="image-card-subtitle">{mod.subtitle}</p>

                {count > 0 && (
                  <span className="image-card-count-badge">
                    {count} {count === 1 ? 'procedimento' : 'procedimentos'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
