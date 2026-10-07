import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  ArrowRight,
  Plus,
  Printer,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  FileX,
  ClipboardCheck,
  MoreVertical,
  Upload,
} from 'lucide-react';
import type { Procedure, SystemMenu, SystemVersion } from '../types/procedure';

interface DashboardViewProps {
  procedures: Procedure[];
  menus: SystemMenu[];
  activeVersion: SystemVersion;
  onSelectProcedure: (id: string, autoPrint?: boolean) => void;
  onNewProcedure: () => void;
  onToggleActive?: (id: string) => void;
  onUnpublish?: (id: string) => void;
  onSendToReview?: (id: string) => void;
  onPublish?: (id: string) => void;
  onDelete?: (proc: Procedure) => void;
  onEdit?: (proc: Procedure) => void;
  isEditorEnabled?: boolean;
  onOpenImport?: (defaultCategory?: string, defaultMenuId?: string) => void;
}

// Cores temáticas harmônicas para os módulos
const MODULE_COLORS = [
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#ec4899', // Pink
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  procedures,
  menus,
  onSelectProcedure,
  onNewProcedure,
  onToggleActive,
  onUnpublish,
  onSendToReview,
  onPublish,
  onDelete,
  onEdit,
  isEditorEnabled = false,
  onOpenImport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Métricas calculadas
  const totalProcedures = procedures.length;
  const totalModules = menus.length || 7;

  const totalSteps = useMemo(() => {
    return procedures.reduce((acc, proc) => {
      const stepCount = proc.blocks.filter((b) => b.type === 'step' || b.type === 'heading').length;
      return acc + stepCount;
    }, 0);
  }, [procedures]);

  const checklistStats = useMemo(() => {
    let total = 0;
    let completed = 0;
    procedures.forEach((p) => {
      p.blocks.forEach((b) => {
        if (b.type === 'step') {
          total++;
          if (b.completed) completed++;
        }
      });
    });
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 100;
    return { total, completed, percentage };
  }, [procedures]);

  // Distribuição por Módulo
  const moduleDistribution = useMemo(() => {
    const list = menus.map((menu, index) => {
      const procs = procedures.filter(
        (p) =>
          p.menuId === menu.id ||
          p.category?.toLowerCase().includes(menu.id.toLowerCase()) ||
          p.category?.toLowerCase().includes(menu.label.toLowerCase())
      );
      return {
        id: menu.id,
        label: menu.label,
        count: procs.length,
        color: MODULE_COLORS[index % MODULE_COLORS.length],
      };
    });

    const sum = list.reduce((a, b) => a + b.count, 0) || totalProcedures || 1;
    return list.map((item) => ({
      ...item,
      percentage: Math.round((item.count / sum) * 100),
    }));
  }, [menus, procedures, totalProcedures]);

  // Histórico de Evolução Mensal
  const evolutionData = useMemo(() => {
    return [
      { month: 'Mai', count: Math.max(Math.round(totalProcedures * 0.25), 2) },
      { month: 'Jun', count: Math.max(Math.round(totalProcedures * 0.45), 4) },
      { month: 'Jul', count: Math.max(Math.round(totalProcedures * 0.65), 6) },
      { month: 'Ago', count: Math.max(Math.round(totalProcedures * 0.85), 8) },
      { month: 'Set', count: totalProcedures },
    ];
  }, [totalProcedures]);

  const [statusFilter, setStatusFilter] = useState<'todos' | 'publicados' | 'revisao' | 'inativos'>('todos');
  const [versionFilter, setVersionFilter] = useState<'todas' | 'v10' | 'classico'>('todas');
  const [activeRowMenuId, setActiveRowMenuId] = useState<string | null>(null);

  const currentDateStr = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date());
    } catch {
      return 'Hoje';
    }
  }, []);

  useEffect(() => {
    const handleGlobalClick = () => setActiveRowMenuId(null);
    if (activeRowMenuId) {
      window.addEventListener('click', handleGlobalClick);
      return () => window.removeEventListener('click', handleGlobalClick);
    }
  }, [activeRowMenuId]);

  // Contagens por status
  const publishedCount = useMemo(() => {
    return procedures.filter((p) => p.status === 'aprovado' && p.isActive !== false).length;
  }, [procedures]);

  const reviewCount = useMemo(() => {
    return procedures.filter(
      (p) => (p.status === 'pendente' || p.status === 'ajustes_solicitados') && p.isActive !== false
    ).length;
  }, [procedures]);

  const inactiveCount = useMemo(() => {
    return procedures.filter((p) => p.isActive === false).length;
  }, [procedures]);

  // Procedimentos filtrados para a listagem
  const filteredProcedures = useMemo(() => {
    let list = procedures;
    if (versionFilter === 'v10') {
      list = list.filter((p) => p.systemVersion === 'v10' || !p.systemVersion);
    } else if (versionFilter === 'classico') {
      list = list.filter((p) => p.systemVersion === 'classico' || p.systemVersion === 'r78');
    }

    if (statusFilter === 'publicados') {
      list = list.filter((p) => p.status === 'aprovado' && p.isActive !== false);
    } else if (statusFilter === 'revisao') {
      list = list.filter(
        (p) => (p.status === 'pendente' || p.status === 'ajustes_solicitados') && p.isActive !== false
      );
    } else if (statusFilter === 'inativos') {
      list = list.filter((p) => p.isActive === false);
    }

    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase();
    return list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.subtitle?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.systemPath?.toLowerCase().includes(q)
    );
  }, [procedures, searchTerm, statusFilter, versionFilter]);

  // Renderizador: Gráfico de Área / Linha
  const renderAreaChart = () => {
    const width = 480;
    const height = 180;
    const paddingX = 35;
    const paddingY = 25;
    const maxVal = Math.max(...evolutionData.map((d) => d.count), 10);

    const points = evolutionData.map((d, i) => {
      const x = paddingX + (i / (evolutionData.length - 1)) * (width - 2 * paddingX);
      const y = height - paddingY - (d.count / maxVal) * (height - 2 * paddingY);
      return { x, y, ...d };
    });

    const pathData = points.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
    }, '');

    const areaData = `${pathData} L ${points[points.length - 1].x},${height - paddingY} L ${points[0].x},${height - paddingY} Z`;

    return (
      <div className="dash-chart-svg-wrap">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaGradientRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Linhas de Grade Horizontais */}
          {[0.25, 0.5, 0.75, 1.0].map((ratio, idx) => {
            const yLine = height - paddingY - ratio * (height - 2 * paddingY);
            return (
              <line
                key={idx}
                x1={paddingX}
                y1={yLine}
                x2={width - paddingX}
                y2={yLine}
                stroke="var(--border)"
                strokeDasharray="3 3"
                opacity={0.6}
              />
            );
          })}

          <path d={areaData} fill="url(#areaGradientRed)" />
          <path d={pathData} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />

          {points.map((pt, i) => (
            <g key={i}>
              <circle cx={pt.x} cy={pt.y} r={4.5} fill="var(--paper-2)" stroke="#ef4444" strokeWidth="2.2" />
              <text x={pt.x} y={height - 6} textAnchor="middle" fontSize={11} fill="var(--text-muted)">
                {pt.month}
              </text>
              <text x={pt.x} y={pt.y - 8} textAnchor="middle" fontSize={10} fill="var(--text-primary)" fontWeight={700}>
                {pt.count}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <>
      {/* ── 1. Heading com Eyebrow, H1, Subtítulo e Capture com Live Dot ── */}
      <section className="heading">
        <div>
          <span className="eyebrow">DECISÕES COM CONTEXTO</span>
          <h1 id="pageTitle">Visão Operacional</h1>
          <p id="pageSubtitle">Base consolidada de procedimentos, conformidade e homologações do Digifarma.</p>
        </div>
        <div className="capture">
          <span className="live-dot" /> Snapshot de rotinas
          <span id="captured">{currentDateStr}</span>
        </div>
      </section>

      {/* ── 2. Barra Contínua de Filtros Globais (.filters) ── */}
      <section className="filters" aria-label="Filtros globais">
        <div className="filter">
          <label htmlFor="dash-version">VERSÃO</label>
          <select
            id="dash-version"
            value={versionFilter}
            onChange={(e) => setVersionFilter(e.target.value as any)}
          >
            <option value="todas">Todas as versões</option>
            <option value="v10">Digifarma v10</option>
            <option value="classico">Digifarma Clássico</option>
          </select>
        </div>

        <div className="filter">
          <label htmlFor="dash-status">STATUS</label>
          <select
            id="dash-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="todos">Todos os status</option>
            <option value="publicados">Publicados ({publishedCount})</option>
            <option value="revisao">Em Revisão ({reviewCount})</option>
            <option value="inativos">Inativos ({inactiveCount})</option>
          </select>
        </div>

        <div className="filter store-filter" style={{ flex: 1 }}>
          <label htmlFor="dash-search">BUSCA OPERACIONAL</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              id="dash-search"
              type="text"
              placeholder="Buscar por rotina, módulo, rota de acesso..."
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

        <div className="status">
          <span className="live-dot" /> {publishedCount} Homologados
        </div>
      </section>

      {/* ── 3. Cartões de Métricas (.cards com .metric.emphasis) ── */}
      <div className="cards">
        <div className="metric emphasis">
          <label>TOTAL DE PROCEDIMENTOS</label>
          <strong>{totalProcedures}</strong>
          <small>
            Rotinas cadastradas no repositório <span className="chip green">Ativo</span>
          </small>
        </div>

        <div className="metric">
          <label>MÓDULOS ESTRUTURADOS</label>
          <strong>{totalModules}</strong>
          <small>Categorias e áreas do ERP mapeadas</small>
        </div>

        <div className="metric">
          <label>CONFORMIDADE BPF</label>
          <strong>{checklistStats.percentage}%</strong>
          <small>{totalSteps} etapas documentadas no sistema</small>
        </div>
      </div>

      {/* ── 4. Grade Principal com Painéis (.grid 1.7fr 1fr) ── */}
      <div className="grid">
        {/* Painel Esquerdo: Base de Procedimentos (.panel) */}
        <div className="panel">
          <div className="panel-title">
            <div>
              <h3>Base de Procedimentos Operacionais</h3>
              <p>Rotinas homologadas com atalhos, módulos e status.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {onOpenImport && (
                <button
                  type="button"
                  className="button subtle"
                  onClick={() => onOpenImport()}
                  title="Importar POP em PDF ou HTML"
                >
                  <Upload size={12} />
                  <span>Importar POP</span>
                </button>
              )}
              {isEditorEnabled && (
                <button
                  type="button"
                  className="button primary"
                  onClick={onNewProcedure}
                  title="Criar novo manual no Studio"
                >
                  <Plus size={13} />
                  <span>Novo Manual</span>
                </button>
              )}
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '45%' }}>PROCEDIMENTO</th>
                  <th style={{ width: '18%' }}>MÓDULO</th>
                  <th style={{ width: '15%' }}>VERSÃO</th>
                  <th style={{ width: '10%' }}>STATUS</th>
                  <th style={{ width: '12%', textAlign: 'right' }}>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {filteredProcedures.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--muted)' }}>
                      Nenhum procedimento encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredProcedures.map((proc) => {
                    const isV10 = proc.systemVersion === 'v10' || !proc.systemVersion;
                    return (
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
                                <span className="tag" style={{ background: '#fff0f0', color: 'var(--red)' }}>
                                  PDF
                                </span>
                              )}
                              {(proc.htmlFileData || proc.formatType === 'html' || proc.formatType === 'both') && (
                                <span className="tag" style={{ background: '#eef5fc', color: '#3b82f6' }}>
                                  HTML
                                </span>
                              )}
                            </div>
                            {proc.systemPath && (
                              <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                                {proc.systemPath}
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <span className="tag">{proc.category || 'Geral'}</span>
                        </td>

                        <td>
                          <span
                            className="tag"
                            style={{
                              background: isV10 ? '#fff0f0' : '#eef1f6',
                              color: isV10 ? 'var(--red)' : 'var(--muted)',
                              fontWeight: 700,
                            }}
                          >
                            {isV10 ? 'v10' : 'Clássico'}
                          </span>
                        </td>

                        <td>
                          {proc.isActive === false ? (
                            <span className="tag warn">Inativo</span>
                          ) : proc.status === 'aprovado' ? (
                            <span className="tag success">Publicado</span>
                          ) : proc.status === 'pendente' ? (
                            <span className="tag warn">Em Revisão</span>
                          ) : proc.status === 'ajustes_solicitados' ? (
                            <span className="tag danger">Ajustes</span>
                          ) : (
                            <span className="tag">Rascunho</span>
                          )}
                        </td>

                        <td onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                            <button
                              type="button"
                              className="button subtle"
                              style={{ padding: '6px 10px', fontSize: '10px' }}
                              onClick={() => onSelectProcedure(proc.id, false)}
                              title="Visualizar rotina"
                            >
                              <span>Abrir</span>
                              <ArrowRight size={11} />
                            </button>

                            {isEditorEnabled && onEdit && (
                              <button
                                type="button"
                                className="button subtle"
                                style={{ padding: '6px 8px', fontSize: '10px' }}
                                onClick={() => onEdit(proc)}
                                title="Editar no Studio"
                              >
                                <Edit3 size={12} />
                              </button>
                            )}

                            <button
                              type="button"
                              className="button subtle"
                              style={{ padding: '6px 8px', fontSize: '10px' }}
                              onClick={() => onSelectProcedure(proc.id, true)}
                              title="Imprimir / PDF Oficial"
                            >
                              <Printer size={12} />
                            </button>

                            {/* Menu de Mais Ações */}
                            <div className="dash-row-menu-container" style={{ position: 'relative' }}>
                              <button
                                type="button"
                                className="button subtle"
                                style={{ padding: '6px 7px', fontSize: '10px' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveRowMenuId(activeRowMenuId === proc.id ? null : proc.id);
                                }}
                                title="Mais ações"
                              >
                                <MoreVertical size={12} />
                              </button>

                              {activeRowMenuId === proc.id && (
                                <div
                                  className="dash-row-dropdown-popover"
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: '100%',
                                    background: '#fff',
                                    border: '1px solid var(--line)',
                                    borderRadius: '8px',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                    zIndex: 50,
                                    minWidth: '150px',
                                    padding: '4px',
                                  }}
                                >
                                  {proc.status !== 'aprovado' && onPublish && (
                                    <button
                                      type="button"
                                      className="dash-dropdown-item success"
                                      onClick={() => {
                                        setActiveRowMenuId(null);
                                        onPublish(proc.id);
                                      }}
                                    >
                                      <CheckCircle2 size={13} color="#10b981" />
                                      <span>Publicar</span>
                                    </button>
                                  )}

                                  {proc.status === 'aprovado' && onUnpublish && (
                                    <button
                                      type="button"
                                      className="dash-dropdown-item"
                                      onClick={() => {
                                        setActiveRowMenuId(null);
                                        onUnpublish(proc.id);
                                      }}
                                    >
                                      <FileX size={13} />
                                      <span>Despublicar</span>
                                    </button>
                                  )}

                                  {proc.status !== 'pendente' && onSendToReview && (
                                    <button
                                      type="button"
                                      className="dash-dropdown-item"
                                      onClick={() => {
                                        setActiveRowMenuId(null);
                                        onSendToReview(proc.id);
                                      }}
                                    >
                                      <ClipboardCheck size={13} />
                                      <span>Mandar p/ Revisão</span>
                                    </button>
                                  )}

                                  {onToggleActive && (
                                    <button
                                      type="button"
                                      className="dash-dropdown-item"
                                      onClick={() => {
                                        setActiveRowMenuId(null);
                                        onToggleActive(proc.id);
                                      }}
                                    >
                                      {proc.isActive === false ? (
                                        <>
                                          <Eye size={13} color="#10b981" />
                                          <span>Reativar</span>
                                        </>
                                      ) : (
                                        <>
                                          <EyeOff size={13} color="#94a3b8" />
                                          <span>Inativar</span>
                                        </>
                                      )}
                                    </button>
                                  )}

                                  {onDelete && (
                                    <>
                                      <div className="dash-dropdown-divider" />
                                      <button
                                        type="button"
                                        className="dash-dropdown-item danger"
                                        onClick={() => {
                                          setActiveRowMenuId(null);
                                          onDelete(proc);
                                        }}
                                      >
                                        <Trash2 size={13} color="#ef4444" />
                                        <span>Excluir</span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Painel Direito: Distribuição por Módulo (.panel) */}
        <div className="panel">
          <div className="panel-title">
            <div>
              <h3>Distribuição por Módulo</h3>
              <p>Proporção de rotinas por área do ERP.</p>
            </div>
          </div>

          <div style={{ marginTop: '8px' }}>
            {moduleDistribution.map((item) => (
              <div key={item.id} className="bar-row">
                <div className="bar-head">
                  <span>{item.label}</span>
                  <strong>{item.count} ({item.percentage}%)</strong>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${item.percentage}%`, background: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '28px', paddingTop: '18px', borderTop: '1px solid var(--line)' }}>
            <div className="panel-title" style={{ marginBottom: '12px' }}>
              <div>
                <h3>Evolução da Base</h3>
                <p>Crescimento cumulativo de rotinas homologadas.</p>
              </div>
            </div>
            {renderAreaChart()}
          </div>
        </div>
      </div>
    </>
  );
};
