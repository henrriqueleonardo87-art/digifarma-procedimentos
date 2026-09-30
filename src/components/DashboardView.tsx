import React, { useState, useMemo } from 'react';
import {
  FileText,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  BookOpen,
  Activity,
  PieChart as PieIcon,
  TrendingUp,
  Target,
  Sliders,
  Search,
} from 'lucide-react';
import type { Procedure, SystemMenu, SystemVersion } from '../types/procedure';

interface DashboardViewProps {
  procedures: Procedure[];
  menus: SystemMenu[];
  activeVersion: SystemVersion;
  onSelectProcedure: (id: string) => void;
  onNewProcedure: () => void;
}

// Cores temáticas harmônicas para os módulos
const MODULE_COLORS = [
  '#ef4444', // Digifarma Red
  '#3b82f6', // Azul Cobalto
  '#10b981', // Esmeralda
  '#f59e0b', // Âmbar / Laranja
  '#8b5cf6', // Roxo / Violeta
  '#06b6d4', // Ciano
  '#ec4899', // Rosa
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  procedures,
  menus,
  activeVersion,
  onSelectProcedure,
  onNewProcedure,
}) => {
  // Estado para interação de hover no gráfico de pizza
  const [hoveredModuleIndex, setHoveredModuleIndex] = useState<number | null>(null);
  // Estado para filtro de busca nos procedimentos rápidos
  const [searchTerm, setSearchTerm] = useState('');

  // Procedimentos da versão ativa
  const versionProcedures = useMemo(() => {
    return procedures.filter(
      (p) =>
        p.systemVersion === activeVersion ||
        p.systemVersion === 'ambos' ||
        !p.systemVersion
    );
  }, [procedures, activeVersion]);

  // Módulos da versão ativa
  const versionMenus = useMemo(() => {
    return menus.filter(
      (m) => m.version === activeVersion || m.version === 'ambos' || !m.version
    );
  }, [menus, activeVersion]);

  // Métricas calculadas
  const totalProcedures = versionProcedures.length;
  const totalModules = versionMenus.length;

  // Total de passos
  const totalSteps = useMemo(() => {
    return versionProcedures.reduce((acc, proc) => {
      const stepCount = proc.blocks.filter((b) => b.type === 'step' || b.type === 'heading').length;
      return acc + stepCount;
    }, 0);
  }, [versionProcedures]);

  // Estatísticas de Checklist
  const checklistStats = useMemo(() => {
    let total = 0;
    let completed = 0;
    versionProcedures.forEach((p) => {
      p.blocks.forEach((b) => {
        if (b.type === 'step') {
          total++;
          if (b.completed) completed++;
        }
      });
    });
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 100;
    return { total, completed, percentage };
  }, [versionProcedures]);

  // Distribuição de Procedimentos por Módulo (para o Donut e Barras)
  const moduleDistribution = useMemo(() => {
    return versionMenus.map((menu, index) => {
      const procs = versionProcedures.filter(
        (p) => p.menuId === menu.id || p.category?.toLowerCase() === menu.id.toLowerCase()
      );
      const count = procs.length;
      const percentage = totalProcedures > 0 ? Math.round((count / totalProcedures) * 100) : 0;

      const stepsCount = procs.reduce((acc, p) => {
        return acc + p.blocks.filter((b) => b.type === 'step' || b.type === 'heading').length;
      }, 0);

      // Meta de procedimentos estimada por módulo (ex: 4 procedimentos como meta de homologação)
      const targetProcs = 4;
      const progressToTarget = Math.min(Math.round((count / targetProcs) * 100), 100);

      return {
        id: menu.id,
        label: menu.label,
        count,
        steps: stepsCount,
        percentage,
        progressToTarget,
        color: MODULE_COLORS[index % MODULE_COLORS.length],
      };
    });
  }, [versionMenus, versionProcedures, totalProcedures]);

  // Dados para o Gráfico Radar (5 Eixos de Qualidade Operacional)
  const radarData = useMemo(() => {
    if (totalProcedures === 0) {
      return [
        { label: 'Telas & Imagens', value: 50 },
        { label: 'Rotas do ERP', value: 50 },
        { label: 'Passo a Passo', value: 50 },
        { label: 'Checklists', value: 50 },
        { label: 'Alertas', value: 50 },
      ];
    }

    const procsWithImages = versionProcedures.filter((p) =>
      p.blocks.some((b) => b.type === 'image')
    ).length;
    const procsWithPath = versionProcedures.filter((p) =>
      Boolean(p.systemPath && p.systemPath.trim().length > 0)
    ).length;
    const procsWithCallouts = versionProcedures.filter((p) =>
      p.blocks.some((b) => b.type === 'callout')
    ).length;
    const procsWithSteps = versionProcedures.filter((p) =>
      p.blocks.some((b) => b.type === 'step' || b.type === 'heading')
    ).length;

    const imgScore = Math.max(20, Math.round((procsWithImages / totalProcedures) * 100));
    const pathScore = Math.max(20, Math.round((procsWithPath / totalProcedures) * 100));
    const stepScore = Math.max(20, Math.round((procsWithSteps / totalProcedures) * 100));
    const checkScore = Math.max(20, checklistStats.percentage);
    const calloutScore = Math.max(20, Math.round((procsWithCallouts / totalProcedures) * 100));

    return [
      { label: 'Telas & Imagens', value: imgScore },
      { label: 'Rotas do ERP', value: pathScore },
      { label: 'Passo a Passo', value: stepScore },
      { label: 'Checklists', value: checkScore },
      { label: 'Alertas & Dicas', value: calloutScore },
    ];
  }, [versionProcedures, totalProcedures, checklistStats]);

  // Dados para o Gráfico de Área / Evolução Temporal
  const timelineData = useMemo(() => {
    // Curva progressiva baseada no volume atual de procedimentos
    const count = Math.max(totalProcedures, 1);
    return [
      { period: 'Jan-Fev', count: Math.max(1, Math.round(count * 0.25)) },
      { period: 'Mar-Abr', count: Math.max(1, Math.round(count * 0.45)) },
      { period: 'Mai-Jun', count: Math.max(1, Math.round(count * 0.65)) },
      { period: 'Jul-Ago', count: Math.max(1, Math.round(count * 0.85)) },
      { period: 'Atual', count: count },
    ];
  }, [totalProcedures]);

  // Procedimentos filtrados pela busca
  const filteredProcedures = useMemo(() => {
    if (!searchTerm.trim()) return versionProcedures;
    const term = searchTerm.toLowerCase();
    return versionProcedures.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        (p.systemPath && p.systemPath.toLowerCase().includes(term)) ||
        (p.category && p.category.toLowerCase().includes(term))
    );
  }, [versionProcedures, searchTerm]);

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Recentemente';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return isoString;
    }
  };

  // ==============================================================
  // RENDERIZADOR: 1. GRÁFICO DE LINHA / ÁREA SUAVE (SVG)
  // ==============================================================
  const renderAreaChart = () => {
    const width = 360;
    const height = 150;
    const padX = 40;
    const padY = 25;
    const chartW = width - padX - 15;
    const chartH = height - padY - 25;

    const maxVal = Math.max(...timelineData.map((d) => d.count), 5);
    const stepX = chartW / (timelineData.length - 1);

    const points = timelineData.map((d, i) => {
      const x = padX + i * stepX;
      const y = padY + chartH - (d.count / maxVal) * chartH;
      return { x, y, ...d };
    });

    // Caminho da linha
    const linePathD = points.reduce((acc, pt, i) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      // Curva suave
      const prev = points[i - 1];
      const cx1 = prev.x + (pt.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (pt.x - prev.x) / 2;
      const cy2 = pt.y;
      return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`;
    }, '');

    // Área sob a linha
    const areaPathD = `${linePathD} L ${points[points.length - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;

    return (
      <div className="area-chart-container">
        <svg viewBox={`0 0 ${width} ${height}`} className="area-chart-svg">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Linhas de grade sutis */}
          {[0, 0.5, 1].map((ratio, idx) => {
            const y = padY + chartH * ratio;
            return (
              <line
                key={idx}
                x1={padX}
                y1={y}
                x2={width - 15}
                y2={y}
                stroke="var(--border)"
                strokeDasharray="3 3"
                opacity={0.6}
              />
            );
          })}

          {/* Área com gradiente */}
          <path d={areaPathD} fill="url(#areaGradient)" />

          {/* Linha principal */}
          <path
            d={linePathD}
            fill="none"
            stroke="#ef4444"
            strokeWidth={2.8}
            strokeLinecap="round"
          />

          {/* Pontos de dados */}
          {points.map((pt, idx) => (
            <g key={idx}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={4}
                fill="#ffffff"
                stroke="#ef4444"
                strokeWidth={2.5}
              />
              {/* Rótulo no eixo X */}
              <text
                x={pt.x}
                y={height - 6}
                textAnchor="middle"
                fontSize={9}
                fill="var(--text-muted)"
                fontWeight={600}
              >
                {pt.period}
              </text>
              {/* Valor no ponto */}
              <text
                x={pt.x}
                y={pt.y - 7}
                textAnchor="middle"
                fontSize={9.5}
                fill="var(--text-primary)"
                fontWeight={700}
              >
                {pt.count}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  // ==============================================================
  // RENDERIZADOR: 2. GRÁFICO DE PIZZA / DONUT ÚNICO (SVG)
  // ==============================================================
  const renderSingleDonutChart = () => {
    const size = 150;
    const radius = 52;
    const strokeWidth = 18;
    const activeStrokeWidth = 24;
    const circumference = 2 * Math.PI * radius;
    const totalCount = moduleDistribution.reduce((acc, d) => acc + d.count, 0);

    let cumulativeOffset = 0;
    const activeItem =
      hoveredModuleIndex !== null && moduleDistribution[hoveredModuleIndex]
        ? moduleDistribution[hoveredModuleIndex]
        : null;

    return (
      <div className="donut-chart-container">
        <div className="donut-chart-svg-wrap">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--border)"
              strokeWidth={strokeWidth}
              opacity={0.4}
            />

            {totalCount > 0 &&
              moduleDistribution.map((item, idx) => {
                const sliceLength = (item.count / totalCount) * circumference;
                const strokeDasharray = `${Math.max(sliceLength - 1.5, 0)} ${circumference - Math.max(sliceLength - 1.5, 0)}`;
                const strokeDashoffset = -cumulativeOffset;
                cumulativeOffset += sliceLength;
                const isHovered = hoveredModuleIndex === idx;

                return (
                  <circle
                    key={item.id}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={item.color}
                    strokeWidth={isHovered ? activeStrokeWidth : strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{ transition: 'all 0.2s ease', cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredModuleIndex(idx)}
                    onMouseLeave={() => setHoveredModuleIndex(null)}
                  />
                );
              })}

            <text
              x={size / 2}
              y={size / 2 - 2}
              textAnchor="middle"
              style={{ fontSize: '1.4rem', fontWeight: 800, fill: 'var(--text-primary)' }}
            >
              {activeItem ? activeItem.count : totalCount}
            </text>
            <text
              x={size / 2}
              y={size / 2 + 15}
              textAnchor="middle"
              style={{
                fontSize: '0.66rem',
                fontWeight: 600,
                fill: 'var(--text-muted)',
                textTransform: 'uppercase',
              }}
            >
              {activeItem ? `${activeItem.percentage}%` : 'Manuais'}
            </text>
          </svg>
        </div>

        <div className="donut-legend-list">
          {moduleDistribution.map((item, idx) => {
            const isHovered = hoveredModuleIndex === idx;
            return (
              <div
                key={item.id}
                className={`donut-legend-item ${isHovered ? 'active' : ''}`}
                onMouseEnter={() => setHoveredModuleIndex(idx)}
                onMouseLeave={() => setHoveredModuleIndex(null)}
              >
                <div className="donut-legend-left">
                  <span
                    className="donut-legend-bullet"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="donut-legend-label">{item.label}</span>
                </div>
                <div className="donut-legend-right">
                  <span className="donut-legend-count">{item.count}</span>
                  <span className="donut-legend-pct">({item.percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ==============================================================
  // RENDERIZADOR: 3. GRÁFICO RADAR / TEIA DE 5 EIXOS (SVG)
  // ==============================================================
  const renderRadarChart = () => {
    const size = 260;
    const cx = size / 2;
    const cy = size / 2 + 4;
    const radius = 68;
    const totalAxes = radarData.length;

    // Função para converter eixo e valor em coordenada cartesiana
    const getCoordinates = (index: number, valRatio: number, rOffset = 0) => {
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / totalAxes;
      const r = (radius + rOffset) * valRatio;
      return {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      };
    };

    // Polígonos de grade concêntrica (25%, 50%, 75%, 100%)
    const gridLevels = [0.25, 0.5, 0.75, 1.0];

    // Polígono de dados preenchido
    const dataPoints = radarData.map((d, i) => {
      const ratio = Math.min(Math.max(d.value / 100, 0.2), 1.0);
      return getCoordinates(i, ratio);
    });

    const dataPolygonD =
      dataPoints.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ') + ' Z';

    return (
      <div className="radar-chart-container">
        <svg viewBox={`0 0 ${size} ${size}`} className="radar-chart-svg">
          {/* Níveis concêntricos */}
          {gridLevels.map((lvl, lIdx) => {
            const pts = Array.from({ length: totalAxes }).map((_, i) => getCoordinates(i, lvl));
            const pathD =
              pts.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ') + ' Z';
            return (
              <path
                key={lIdx}
                d={pathD}
                fill={lIdx % 2 === 1 ? 'var(--bg-tertiary)' : 'none'}
                stroke="var(--border)"
                strokeWidth={1}
                opacity={0.7}
              />
            );
          })}

          {/* Eixos radiais */}
          {Array.from({ length: totalAxes }).map((_, i) => {
            const endPt = getCoordinates(i, 1.0);
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={endPt.x}
                y2={endPt.y}
                stroke="var(--border)"
                strokeWidth={1}
                opacity={0.8}
              />
            );
          })}

          {/* Área preenchida dos dados */}
          <path
            d={dataPolygonD}
            fill="rgba(239, 68, 68, 0.22)"
            stroke="#ef4444"
            strokeWidth={2.2}
          />

          {/* Pontos nos vértices */}
          {dataPoints.map((pt, i) => (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={3.5}
              fill="#ffffff"
              stroke="#ef4444"
              strokeWidth={2}
            />
          ))}

          {/* Rótulos dos eixos */}
          {radarData.map((d, i) => {
            const labelPt = getCoordinates(i, 1.0, 16);
            return (
              <text
                key={i}
                x={labelPt.x}
                y={labelPt.y + 3}
                textAnchor="middle"
                fontSize={8.5}
                fontWeight={700}
                fill="var(--text-secondary)"
              >
                {d.label} ({d.value}%)
              </text>
            );
          })}
        </svg>
      </div>
    );
  };

  // ==============================================================
  // RENDERIZADOR: 4. BARRAS HORIZONTAIS COM METAS E STATUS
  // ==============================================================
  const renderHorizontalProgressBars = () => {
    return (
      <div className="hbars-list-container">
        {moduleDistribution.map((item) => {
          const isComplete = item.count >= 3;
          return (
            <div key={item.id} className="hbar-item-row">
              <div className="hbar-header">
                <div className="hbar-title-wrap">
                  <span className="hbar-bullet" style={{ backgroundColor: item.color }} />
                  <span className="hbar-label">{item.label}</span>
                </div>
                <div className="hbar-metrics">
                  <span className="hbar-count-badge">
                    {item.count} {item.count === 1 ? 'manual' : 'manuais'} • {item.steps} etapas
                  </span>
                  <span
                    className={`hbar-status-tag ${isComplete ? 'complete' : 'progress'}`}
                  >
                    {isComplete ? 'Homologado' : 'Em Elaboração'}
                  </span>
                </div>
              </div>

              {/* Barra de Progresso com Meta */}
              <div className="hbar-track">
                <div
                  className="hbar-fill"
                  style={{
                    width: `${Math.max(item.progressToTarget, 8)}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      {/* Banner Superior com Boas-Vindas e Ação */}
      {/* Banner Superior com Boas-Vindas e Ação no Padrão V10 */}
      <div className="dashboard-banner">
        <div className="dashboard-banner-content">
          <p className="eyebrow" style={{ marginBottom: '8px' }}>
            <span className="num">{activeVersion === 'v10' ? 'V10 CLOUD' : 'DESKTOP'}</span>
            <span>PAINEL EXECUTIVO & INDICADORES</span>
          </p>
          <h1 className="dashboard-title head" style={{ margin: '0 0 6px 0' }}>
            Painel Executivo de Procedimentos
          </h1>
          <p className="dashboard-subtitle lead" style={{ margin: '0 0 12px 0', fontSize: '14.5px' }}>
            Métricas de cobertura, evolução cronológica, distribuição por rotina e conformidade operacional dos manuais do ERP.
          </p>
        </div>

        <button type="button" className="btn-dashboard-new" onClick={onNewProcedure}>
          <Plus size={16} />
          <span>Novo Procedimento</span>
        </button>
      </div>

      {/* Grid de 4 Cards de Métricas Principais (KPIs) */}
      <div className="dashboard-kpi-grid">
        <div className="dashboard-kpi-card">
          <div className="kpi-icon-wrap kpi-red">
            <BookOpen size={20} />
          </div>
          <div className="kpi-data">
            <span className="kpi-value">{totalProcedures}</span>
            <span className="kpi-label">Procedimentos Ativos</span>
          </div>
          <div className="kpi-footer-badge">
            <Activity size={12} />
            <span>100% disponíveis</span>
          </div>
        </div>

        <div className="dashboard-kpi-card">
          <div className="kpi-icon-wrap kpi-blue">
            <Layers size={20} />
          </div>
          <div className="kpi-data">
            <span className="kpi-value">{totalModules}</span>
            <span className="kpi-label">Módulos Estruturados</span>
          </div>
          <div className="kpi-footer-text">
            <span>Cadastros, Estoque, Utilitários</span>
          </div>
        </div>

        <div className="dashboard-kpi-card">
          <div className="kpi-icon-wrap kpi-purple">
            <FileText size={20} />
          </div>
          <div className="kpi-data">
            <span className="kpi-value">{totalSteps}</span>
            <span className="kpi-label">Etapas Documentadas</span>
          </div>
          <div className="kpi-footer-text">
            <span>Passo a passo com telas e dicas</span>
          </div>
        </div>

        <div className="dashboard-kpi-card">
          <div className="kpi-icon-wrap kpi-green">
            <CheckCircle2 size={20} />
          </div>
          <div className="kpi-data">
            <span className="kpi-value">{checklistStats.total}</span>
            <span className="kpi-label">Itens de Checklist</span>
          </div>
          <div className="kpi-footer-progress">
            <div className="mini-progress-bar">
              <div
                className="mini-progress-fill"
                style={{ width: `${checklistStats.percentage}%` }}
              />
            </div>
            <span className="mini-progress-text">{checklistStats.percentage}% validados</span>
          </div>
        </div>
      </div>

      {/* ==============================================================
          GRADE DE 4 GRÁFICOS DIVERSIFICADOS (LINHA, PIZZA, RADAR, BARRAS)
          ============================================================== */}
      <div className="dashboard-charts-grid">
        {/* GRÁFICO 1: LINHA / ÁREA TEMPORAL */}
        <div className="dashboard-card-box">
          <div className="card-box-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} color="#ef4444" />
              <h2 className="card-box-title">Evolução da Base de Conhecimento</h2>
            </div>
            <span className="card-box-counter">Cronológico</span>
          </div>
          <p className="card-box-description">
            Crescimento acumulado do número de manuais cadastrados e homologados ao longo dos meses.
          </p>
          {renderAreaChart()}
        </div>

        {/* GRÁFICO 2: PIZZA / DONUT ÚNICO */}
        <div className="dashboard-card-box">
          <div className="card-box-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieIcon size={18} color="#3b82f6" />
              <h2 className="card-box-title">Distribuição por Módulo</h2>
            </div>
            <span className="card-box-counter">{totalProcedures} manuais</span>
          </div>
          <p className="card-box-description">
            Proporção de procedimentos operacionais distribuídos entre as diferentes áreas do ERP.
          </p>
          {renderSingleDonutChart()}
        </div>

        {/* GRÁFICO 3: RADAR / TEIA MULTIDIMENSIONAL */}
        <div className="dashboard-card-box">
          <div className="card-box-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Target size={18} color="#10b981" />
              <h2 className="card-box-title">Diagnóstico de Qualidade dos POPs</h2>
            </div>
            <span className="card-box-counter">Auditoria ISO</span>
          </div>
          <p className="card-box-description">
            Maturidade dos manuais em 5 pilares: Telas Reais, Rotas, Detalhamento, Checklists e Alertas.
          </p>
          {renderRadarChart()}
        </div>

        {/* GRÁFICO 4: BARRAS HORIZONTAIS COM METAS */}
        <div className="dashboard-card-box">
          <div className="card-box-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sliders size={18} color="#f59e0b" />
              <h2 className="card-box-title">Metas de Cobertura por Módulo</h2>
            </div>
            <span className="card-box-counter">Homologação</span>
          </div>
          <p className="card-box-description">
            Acompanhamento do progresso de documentação por área em relação à meta de homologação.
          </p>
          {renderHorizontalProgressBars()}
        </div>
      </div>

      {/* ==============================================================
          LISTA DE ACESSO RÁPIDO COM BUSCA INSTANTÂNEA
          ============================================================== */}
      <div className="dashboard-procedures-panel">
        <div className="dashboard-search-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={17} color="var(--primary-500)" />
            <h2 className="card-box-title">
              Procedimentos do Digifarma {activeVersion === 'v10' ? 'V10' : 'Clássico'}
            </h2>
          </div>

          <div className="dashboard-search-input-wrap">
            <Search size={14} className="dashboard-search-icon" />
            <input
              type="text"
              className="dashboard-search-input"
              placeholder="Buscar procedimento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="dashboard-search-clear"
                onClick={() => setSearchTerm('')}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="dashboard-proc-cards-list">
          {filteredProcedures.length === 0 ? (
            <div className="dashboard-empty-search">
              <p>Nenhum procedimento encontrado para "{searchTerm}".</p>
            </div>
          ) : (
            filteredProcedures.map((proc) => {
              return (
                <div
                  key={proc.id}
                  className="dashboard-proc-card"
                  onClick={() => onSelectProcedure(proc.id)}
                >
                  <div className="proc-card-left">
                    <div className="proc-card-icon">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h3 className="proc-card-title">{proc.title}</h3>
                      {proc.systemPath && (
                        <span className="proc-card-path">{proc.systemPath}</span>
                      )}
                    </div>
                  </div>

                  <div className="proc-card-right">
                    <span className="proc-card-date">
                      <Clock size={12} />
                      {formatDate(proc.updated_at)}
                    </span>
                    <div className="btn-open-proc">
                      <span>Acessar</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
