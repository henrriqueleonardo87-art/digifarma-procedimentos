import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Clock,
  ArrowRight,
  Edit,
  Trash2,
  Rocket,
  Monitor,
  Printer,
  BookOpen,
  CheckCircle2,
  FolderPlus,
  Boxes,
  ShoppingCart,
  DollarSign,
  FileSpreadsheet,
  ShieldCheck,
  Settings,
  ChevronRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { Procedure, SystemMenu, SystemVersion } from '../types/procedure';

interface ProcedimentosListViewProps {
  procedures: Procedure[];
  menus: SystemMenu[];
  activeVersion: SystemVersion;
  onSelectProcedure: (id: string, autoPrint?: boolean) => void;
  onNewProcedure: () => void;
  onEditProcedure: (proc: Procedure) => void;
  onDeleteProcedure: (proc: Procedure) => void;
  onChangeVersion?: (version: SystemVersion) => void;
}

// Mapeamento de ícones e descrições dos setores da farmácia
const SECTOR_METADATA: Record<
  string,
  { label: string; icon: React.FC<{ size?: number }>; desc: string; color: string }
> = {
  cadastros: {
    label: 'Cadastros',
    icon: FolderPlus,
    desc: 'Medicamentos, clientes, fornecedores, convênios e tabela de preços.',
    color: '#3b82f6',
  },
  estoque: {
    label: 'Estoque & Entradas',
    icon: Boxes,
    desc: 'Entrada de notas XML, controle de lotes/validades PVPS, inventário e balanço.',
    color: '#10b981',
  },
  vendas: {
    label: 'Vendas & Balcão',
    icon: ShoppingCart,
    desc: 'Atendimento, consulta F7 com IA, pré-venda, cashback e fidelidade.',
    color: '#f59e0b',
  },
  financeiro: {
    label: 'Financeiro & Caixa',
    icon: DollarSign,
    desc: 'Fechamento de caixa cego, contas a pagar, receber e sangrias.',
    color: '#8b5cf6',
  },
  fiscal: {
    label: 'Fiscal & Tributário',
    icon: FileSpreadsheet,
    desc: 'Emissão de NFC-e, NF-e, cartas de correção e regras tributárias.',
    color: '#06b6d4',
  },
  sngpc: {
    label: 'SNGPC & Controlados',
    icon: ShieldCheck,
    desc: 'Portaria 344/98, receituários especiais, livro eletrônico e Anvisa.',
    color: '#ef4444',
  },
  utilitarios: {
    label: 'Configurações & Sistema',
    icon: Settings,
    desc: 'Usuários, alçadas de desconto, permissões e backup do banco.',
    color: '#64748b',
  },
};

export const ProcedimentosListView: React.FC<ProcedimentosListViewProps> = ({
  procedures,
  activeVersion,
  onSelectProcedure,
  onNewProcedure,
  onEditProcedure,
  onDeleteProcedure,
  onChangeVersion,
}) => {
  // Estado: se o usuário está visualizando a tela de escolha dos 2 cards ou o detalhe do setor
  const [selectedVersion, setSelectedVersion] = useState<SystemVersion | null>(() => {
    return activeVersion || null;
  });

  // Filtros internos
  const [activeSector, setActiveSector] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Troca de versão
  const handleSelectVersion = (version: SystemVersion) => {
    setSelectedVersion(version);
    setActiveSector('todos');
    if (onChangeVersion) onChangeVersion(version);
  };

  // Contagem de procedimentos por versão
  const v10Count = useMemo(() => {
    return procedures.filter(
      (p) => p.systemVersion === 'v10' || p.systemVersion === 'ambos' || !p.systemVersion
    ).length;
  }, [procedures]);

  const classicoCount = useMemo(() => {
    return procedures.filter(
      (p) => p.systemVersion === 'classico' || p.systemVersion === 'ambos' || !p.systemVersion
    ).length;
  }, [procedures]);

  // Procedimentos da versão selecionada
  const versionProcedures = useMemo(() => {
    if (!selectedVersion) return [];
    return procedures.filter(
      (p) =>
        p.systemVersion === selectedVersion ||
        p.systemVersion === 'ambos' ||
        !p.systemVersion
    );
  }, [procedures, selectedVersion]);

  // Lista filtrada por busca e setor
  const filteredProcedures = useMemo(() => {
    let list = [...versionProcedures];

    if (activeSector !== 'todos') {
      list = list.filter((p) => {
        const mId = (p.menuId || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        return mId === activeSector || cat.includes(activeSector);
      });
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.subtitle?.toLowerCase().includes(q) ||
          p.systemPath?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    return list;
  }, [versionProcedures, activeSector, searchTerm]);

  // Agrupamento por Setor
  const groupedBySector = useMemo(() => {
    const groups: Record<string, Procedure[]> = {};

    filteredProcedures.forEach((proc) => {
      const rawSector = (proc.menuId || proc.category || 'cadastros').toLowerCase();
      let key = 'cadastros';

      if (rawSector.includes('estoque')) key = 'estoque';
      else if (rawSector.includes('venda') || rawSector.includes('balcão') || rawSector.includes('balcao'))
        key = 'vendas';
      else if (rawSector.includes('finan') || rawSector.includes('caixa')) key = 'financeiro';
      else if (rawSector.includes('fisc')) key = 'fiscal';
      else if (rawSector.includes('sngpc') || rawSector.includes('control')) key = 'sngpc';
      else if (rawSector.includes('util') || rawSector.includes('config')) key = 'utilitarios';
      else key = 'cadastros';

      if (!groups[key]) groups[key] = [];
      groups[key].push(proc);
    });

    return groups;
  }, [filteredProcedures]);

  // Lista dos setores disponíveis na versão selecionada
  const availableSectors = useMemo(() => {
    const set = new Set<string>();
    versionProcedures.forEach((proc) => {
      const raw = (proc.menuId || proc.category || 'cadastros').toLowerCase();
      if (raw.includes('estoque')) set.add('estoque');
      else if (raw.includes('venda') || raw.includes('balcão') || raw.includes('balcao'))
        set.add('vendas');
      else if (raw.includes('finan') || raw.includes('caixa')) set.add('financeiro');
      else if (raw.includes('fisc')) set.add('fiscal');
      else if (raw.includes('sngpc') || raw.includes('control')) set.add('sngpc');
      else if (raw.includes('util') || raw.includes('config')) set.add('utilitarios');
      else set.add('cadastros');
    });
    return Array.from(set);
  }, [versionProcedures]);

  // =========================================================================
  // CENÁRIO 1: TELA COM OS 2 CARDS (V10 E CLÁSSICO)
  // =========================================================================
  if (!selectedVersion) {
    return (
      <div className="procedimentos-view-container">
        {/* Cabeçalho Centralizado */}
        <div className="version-choice-hero">
          <p className="eyebrow" style={{ marginBottom: '8px' }}>
            <span className="num">SISTEMA DIGIFARMA</span>
            <span>BASE DE CONHECIMENTO & MANUAIS POP</span>
          </p>
          <h1 className="head" style={{ fontSize: '2rem', marginBottom: '8px' }}>
            Procedimentos Operacionais Padronizados
          </h1>
          <p className="lead muted" style={{ maxWidth: '680px', margin: '0 auto 2.5rem' }}>
            Selecione a versão do Digifarma para acessar os manuais passo a passo, formulários BPF e fluxos operacionais organizados por setor.
          </p>
        </div>

        {/* Grade com os 2 Cards Executivos */}
        <div className="version-cards-grid">
          {/* Card 1: Digifarma V10 Cloud */}
          <div
            className="version-card-exec v10-card"
            onClick={() => handleSelectVersion('v10')}
          >
            <div className="version-card-badge-row">
              <span className="version-pill v10">
                <Sparkles size={12} />
                <span>Nova Geração Cloud</span>
              </span>
              <span className="version-count-pill">{v10Count} Manuais</span>
            </div>

            <div className="version-card-icon-title">
              <div className="version-icon-wrap v10">
                <Rocket size={28} />
              </div>
              <div>
                <h2>Digifarma V10 Cloud</h2>
                <span className="version-card-sub">Web & Mobile · Arquitetura em Nuvem</span>
              </div>
            </div>

            <p className="version-card-desc">
              Roteiros modernos com inteligência artificial no F7 para busca de sintomas, fechamento de caixa cego, fidelidade 360º e sincronização em tempo real.
            </p>

            <div className="version-card-sectors-chips">
              <span className="sector-chip">Cadastros</span>
              <span className="sector-chip">Estoque</span>
              <span className="sector-chip">Vendas & F7 (IA)</span>
              <span className="sector-chip">Caixa Cego</span>
              <span className="sector-chip">Configurações</span>
            </div>

            <div className="version-card-footer">
              <span className="version-card-link">
                Acessar Procedimentos V10
                <ArrowRight size={16} />
              </span>
            </div>
          </div>

          {/* Card 2: Digifarma Clássico Desktop */}
          <div
            className="version-card-exec classico-card"
            onClick={() => handleSelectVersion('classico')}
          >
            <div className="version-card-badge-row">
              <span className="version-pill classico">
                <Monitor size={12} />
                <span>Desktop ERP Estável</span>
              </span>
              <span className="version-count-pill">{classicoCount} Manuais</span>
            </div>

            <div className="version-card-icon-title">
              <div className="version-icon-wrap classico">
                <Monitor size={28} />
              </div>
              <div>
                <h2>Digifarma Clássico</h2>
                <span className="version-card-sub">Windows Desktop · Operação Local</span>
              </div>
            </div>

            <p className="version-card-desc">
              Manuais práticos para rotinas de retaguarda, importação de notas fiscais via XML (F5), cadastro de clientes e atalhos rápidos de teclado.
            </p>

            <div className="version-card-sectors-chips">
              <span className="sector-chip">Cadastros (F2)</span>
              <span className="sector-chip">Entrada XML</span>
              <span className="sector-chip">Vendas & Balcão</span>
              <span className="sector-chip">SNGPC Portaria 344</span>
              <span className="sector-chip">Financeiro</span>
            </div>

            <div className="version-card-footer">
              <span className="version-card-link">
                Acessar Procedimentos Clássico
                <ArrowRight size={16} />
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CENÁRIO 2: PROCEDIMENTOS DA VERSÃO ESCOLHIDA SEPARADOS POR SETOR
  // =========================================================================
  return (
    <div className="procedimentos-view-container">
      {/* Barra de Navegação Superior da Versão */}
      <div className="version-view-top-bar">
        <button
          type="button"
          className="btn-back-version"
          onClick={() => setSelectedVersion(null)}
          title="Voltar para a escolha entre V10 e Clássico"
        >
          <ArrowRight size={15} style={{ transform: 'rotate(180deg)' }} />
          <span>Trocar Versão</span>
        </button>

        <div className="version-view-title-block">
          <div className="version-indicator-tag">
            {selectedVersion === 'v10' ? (
              <>
                <Rocket size={14} color="#10b981" />
                <strong>Digifarma V10 Cloud</strong>
              </>
            ) : (
              <>
                <Monitor size={14} color="#3b82f6" />
                <strong>Digifarma Clássico Desktop</strong>
              </>
            )}
            <span className="tag-separator">•</span>
            <span>{versionProcedures.length} procedimentos homologados</span>
          </div>
        </div>

        <button
          type="button"
          className="btn primary"
          onClick={onNewProcedure}
        >
          <Plus size={15} />
          <span>+ Novo Procedimento</span>
        </button>
      </div>

      {/* Controles de Filtro e Busca */}
      <div className="sector-controls-bar">
        <div className="search-filter-box" style={{ flex: 1, maxWidth: '420px', position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="custom-search-input"
            placeholder="Pesquisar por nome, atalho, palavra-chave..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
          {searchTerm && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchTerm('')}
            >
              ✕
            </button>
          )}
        </div>

        {/* Pílulas de Filtro por Setor */}
        <div className="sector-pills-row">
          <button
            type="button"
            className={`sector-pill ${activeSector === 'todos' ? 'active' : ''}`}
            onClick={() => setActiveSector('todos')}
          >
            <Layers size={13} />
            <span>Todos os Setores</span>
            <span className="pill-badge">{versionProcedures.length}</span>
          </button>

          {availableSectors.map((secKey) => {
            const meta = SECTOR_METADATA[secKey] || {
              label: secKey,
              icon: FolderPlus,
              desc: '',
              color: '#64748b',
            };
            const Icon = meta.icon;
            const count = versionProcedures.filter((p) => {
              const m = (p.menuId || p.category || '').toLowerCase();
              return m === secKey || m.includes(secKey);
            }).length;

            return (
              <button
                type="button"
                key={secKey}
                className={`sector-pill ${activeSector === secKey ? 'active' : ''}`}
                onClick={() => setActiveSector(secKey)}
              >
                <Icon size={13} />
                <span>{meta.label}</span>
                <span className="pill-badge">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de Procedimentos Separados por Setor */}
      {filteredProcedures.length === 0 ? (
        <div className="empty-state-sector">
          <Layers size={40} color="var(--text-muted)" />
          <h3>Nenhum procedimento encontrado</h3>
          <p className="muted">
            {searchTerm
              ? `Nenhum resultado corresponde à busca "${searchTerm}".`
              : 'Não há procedimentos cadastrados neste setor para esta versão.'}
          </p>
          <button
            type="button"
            className="btn secondary sm"
            onClick={() => {
              setSearchTerm('');
              setActiveSector('todos');
            }}
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="sectors-list-container">
          {Object.entries(groupedBySector).map(([secKey, procs]) => {
            const meta = SECTOR_METADATA[secKey] || {
              label: secKey.toUpperCase(),
              icon: FolderPlus,
              desc: 'Rotinas operacionais da farmácia.',
              color: 'var(--red)',
            };
            const SectorIcon = meta.icon;

            return (
              <section key={secKey} className="sector-section-block">
                {/* Cabeçalho do Setor */}
                <div className="sector-block-header">
                  <div className="sector-title-group">
                    <div className="sector-icon-badge" style={{ backgroundColor: `${meta.color}15`, color: meta.color }}>
                      <SectorIcon size={20} />
                    </div>
                    <div>
                      <div className="sector-header-name-row">
                        <h2>{meta.label}</h2>
                        <span className="sector-counter-tag">
                          {procs.length} {procs.length === 1 ? 'procedimento' : 'procedimentos'}
                        </span>
                      </div>
                      <p className="sector-header-desc">{meta.desc}</p>
                    </div>
                  </div>
                </div>

                {/* Grade de Cards de Procedimentos do Setor */}
                <div className="sector-procedures-grid">
                  {procs.map((proc) => {
                    const stepCount = proc.blocks.filter(
                      (b) => b.type === 'step' || b.type === 'heading'
                    ).length;

                    return (
                      <div key={proc.id} className="procedure-exec-card">
                        <div className="proc-card-top">
                          <div className="proc-card-badges">
                            <span className="proc-cat-badge">{proc.category || meta.label}</span>
                            <span className="proc-bpf-badge">
                              <CheckCircle2 size={11} />
                              <span>BPF Homologado</span>
                            </span>
                          </div>

                          <div className="proc-time-estimate">
                            <Clock size={12} />
                            <span>{Math.max(stepCount * 2, 3)} min</span>
                          </div>
                        </div>

                        <h3 className="proc-card-title">{proc.title}</h3>
                        <p className="proc-card-sub">{proc.subtitle}</p>

                        {proc.systemPath && (
                          <div className="proc-card-route">
                            <span className="route-kicker">ROTA ERP:</span>
                            <span className="route-text" title={proc.systemPath}>
                              {proc.systemPath}
                            </span>
                          </div>
                        )}

                        <div className="proc-card-meta-foot">
                          <span className="proc-steps-count">
                            {stepCount} {stepCount === 1 ? 'etapa' : 'etapas'} documentadas
                          </span>

                          <div className="proc-card-actions">
                            {/* Ação 1: Abrir Visualizador em Slides */}
                            <button
                              type="button"
                              className="btn-proc-open"
                              onClick={() => onSelectProcedure(proc.id, false)}
                              title="Abrir procedimento no formato de apresentação de slides"
                            >
                              <BookOpen size={14} />
                              <span>Abrir</span>
                              <ChevronRight size={13} />
                            </button>

                            {/* Ação 2: Imprimir / PDF Direto */}
                            <button
                              type="button"
                              className="btn-proc-print"
                              onClick={() => onSelectProcedure(proc.id, true)}
                              title="Imprimir ou gerar PDF deste procedimento no padrão executivo V10"
                            >
                              <Printer size={14} />
                              <span>PDF</span>
                            </button>

                            {/* Ação 3: Editar */}
                            <button
                              type="button"
                              className="btn-proc-icon-opt"
                              onClick={() => onEditProcedure(proc)}
                              title="Editar procedimento"
                            >
                              <Edit size={13} />
                            </button>

                            {/* Ação 4: Excluir */}
                            <button
                              type="button"
                              className="btn-proc-icon-opt danger"
                              onClick={() => onDeleteProcedure(proc)}
                              title="Excluir procedimento"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};
