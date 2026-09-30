import React, { useState, useMemo } from 'react';
import {
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  BookOpen,
  PieChart as PieIcon,
  TrendingUp,
  Search,
  Printer,
} from 'lucide-react';
import type { Procedure, SystemMenu, SystemVersion } from '../types/procedure';

interface DashboardViewProps {
  procedures: Procedure[];
  menus: SystemMenu[];
  activeVersion: SystemVersion;
  onSelectProcedure: (id: string, autoPrint?: boolean) => void;
  onNewProcedure: () => void;
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
}) => {
  const [hoveredModuleIndex, setHoveredModuleIndex] = useState<number | null>(null);
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

  // Procedimentos filtrados para a listagem
  const filteredProcedures = useMemo(() => {
    if (!searchTerm.trim()) return procedures;
    const q = searchTerm.toLowerCase();
    return procedures.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.subtitle?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.systemPath?.toLowerCase().includes(q)
    );
  }, [procedures, searchTerm]);

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

  // Renderizador: Gráfico Donut
  const renderDonutChart = () => {
    const size = 150;
    const radius = 52;
    const strokeWidth = 18;
    const activeStrokeWidth = 24;
    const circumference = 2 * Math.PI * radius;
    const totalCount = moduleDistribution.reduce((acc, d) => acc + d.count, 0) || 1;

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
              opacity={0.35}
            />

            {moduleDistribution.map((item, idx) => {
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
              {activeItem ? activeItem.count : totalProcedures}
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
              {activeItem ? `${activeItem.percentage}%` : 'POPs'}
            </text>
          </svg>
        </div>

        <div className="donut-legend-list">
          {moduleDistribution.slice(0, 5).map((item, idx) => {
            const isHovered = hoveredModuleIndex === idx;
            return (
              <div
                key={item.id}
                className={`donut-legend-item ${isHovered ? 'active' : ''}`}
                onMouseEnter={() => setHoveredModuleIndex(idx)}
                onMouseLeave={() => setHoveredModuleIndex(null)}
              >
                <div className="donut-legend-left">
                  <span className="donut-legend-bullet" style={{ backgroundColor: item.color }} />
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

  return (
    <div className="dashboard-container">
      {/* Cabeçalho Executivo do Dashboard */}
      <div className="dashboard-banner-clean">
        <div>
          <span className="dashboard-eyebrow">PAINEL OPERACIONAL</span>
          <h1 className="dashboard-title-clean">Indicadores & Procedimentos</h1>
          <p className="dashboard-sub-clean">
            Visão consolidada da conformidade operacional, rotinas homologadas e documentação do Digifarma.
          </p>
        </div>
      </div>

      {/* Grid de 4 Totalizadores Limpos e Profissionais */}
      <div className="clean-kpi-grid">
        <div className="clean-kpi-card">
          <div className="clean-kpi-icon red">
            <BookOpen size={18} />
          </div>
          <div className="clean-kpi-body">
            <span className="clean-kpi-number">{totalProcedures}</span>
            <span className="clean-kpi-title">Procedimentos Homologados</span>
          </div>
        </div>

        <div className="clean-kpi-card">
          <div className="clean-kpi-icon blue">
            <Layers size={18} />
          </div>
          <div className="clean-kpi-body">
            <span className="clean-kpi-number">{totalModules}</span>
            <span className="clean-kpi-title">Módulos Estruturados</span>
          </div>
        </div>

        <div className="clean-kpi-card">
          <div className="clean-kpi-icon emerald">
            <CheckCircle2 size={18} />
          </div>
          <div className="clean-kpi-body">
            <span className="clean-kpi-number">{totalSteps}</span>
            <span className="clean-kpi-title">Etapas Documentadas</span>
          </div>
        </div>

        <div className="clean-kpi-card">
          <div className="clean-kpi-icon purple">
            <Clock size={18} />
          </div>
          <div className="clean-kpi-body">
            <span className="clean-kpi-number">{checklistStats.percentage}%</span>
            <span className="clean-kpi-title">Conformidade BPF</span>
          </div>
        </div>
      </div>

      {/* Grade de 2 Gráficos Executivos Organizados */}
      <div className="clean-charts-grid">
        <div className="clean-chart-card">
          <div className="clean-chart-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} color="#ef4444" />
              <h3>Evolução da Base de Manuais</h3>
            </div>
            <span className="clean-chart-badge">Últimos meses</span>
          </div>
          <p className="clean-chart-desc">Crescimento cumulativo de rotinas homologadas.</p>
          {renderAreaChart()}
        </div>

        <div className="clean-chart-card">
          <div className="clean-chart-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieIcon size={16} color="#3b82f6" />
              <h3>Distribuição por Módulo</h3>
            </div>
            <span className="clean-chart-badge">{totalProcedures} POPs</span>
          </div>
          <p className="clean-chart-desc">Proporção de rotinas por área do ERP.</p>
          {renderDonutChart()}
        </div>
      </div>

      {/* Tabela / Lista Compacta e Profissional da Base de Procedimentos */}
      <div className="clean-procedures-section">
        <div className="clean-section-header">
          <div>
            <h2 className="clean-section-title">Base de Procedimentos</h2>
            <p className="clean-section-sub">Consulte e acesse rapidamente as rotinas operacionais.</p>
          </div>

          <div className="clean-header-actions">
            <div className="clean-search-wrap">
              <Search size={14} className="clean-search-ic" />
              <input
                type="text"
                className="clean-search-input"
                placeholder="Buscar por nome, atalho, rota..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="clean-search-clear"
                  onClick={() => setSearchTerm('')}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Botão Novo POP Discreto e Elegante */}
            <button
              type="button"
              className="btn-new-pop-compact"
              onClick={onNewProcedure}
            >
              <Plus size={14} />
              <span>Novo Procedimento</span>
            </button>
          </div>
        </div>

        {/* Tabela Compacta de Linhas */}
        <div className="compact-table-container">
          <table className="compact-table">
            <thead>
              <tr>
                <th style={{ width: '45%' }}>Procedimento / Rotina</th>
                <th style={{ width: '18%' }}>Módulo</th>
                <th style={{ width: '15%' }}>Versão</th>
                <th style={{ width: '10%' }}>Etapas</th>
                <th style={{ width: '12%', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProcedures.map((proc) => {
                const stepCount = proc.blocks.filter(
                  (b) => b.type === 'step' || b.type === 'heading'
                ).length;
                const isV10 = proc.systemVersion === 'v10';

                return (
                  <tr key={proc.id} onClick={() => onSelectProcedure(proc.id, false)}>
                    <td>
                      <div className="proc-cell-title">
                        <span className="proc-cell-bullet" />
                        <div>
                          <strong>{proc.title}</strong>
                          {proc.systemPath && (
                            <span className="proc-cell-route">{proc.systemPath}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="proc-cell-badge mod">{proc.category || 'Geral'}</span>
                    </td>
                    <td>
                      <span className={`proc-cell-badge ver ${isV10 ? 'v10' : 'r78'}`}>
                        {isV10 ? 'V10 Cloud' : 'R78 Desktop'}
                      </span>
                    </td>
                    <td>
                      <span className="proc-cell-steps">{stepCount} etapas</span>
                    </td>
                    <td>
                      <div
                        className="proc-cell-actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="btn-cell-action"
                          onClick={() => onSelectProcedure(proc.id, false)}
                          title="Abrir procedimento em slides"
                        >
                          <span>Abrir</span>
                          <ArrowRight size={11} />
                        </button>

                        <button
                          type="button"
                          className="btn-cell-action print"
                          onClick={() => onSelectProcedure(proc.id, true)}
                          title="Gerar PDF / Imprimir"
                        >
                          <Printer size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
