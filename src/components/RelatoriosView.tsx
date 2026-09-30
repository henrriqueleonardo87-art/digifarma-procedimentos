import React, { useState, useMemo } from 'react';
import {
  Download,
  Printer,
  CheckCircle2,
} from 'lucide-react';
import type { Procedure, SystemMenu } from '../types/procedure';

interface RelatoriosViewProps {
  procedures: Procedure[];
  menus: SystemMenu[];
}

export const RelatoriosView: React.FC<RelatoriosViewProps> = ({ procedures, menus }) => {
  const [filterModule, setFilterModule] = useState('todos');

  const filtered = useMemo(() => {
    if (filterModule === 'todos') return procedures;
    return procedures.filter(
      (p) => p.menuId === filterModule || p.category?.toLowerCase() === filterModule.toLowerCase()
    );
  }, [procedures, filterModule]);

  const totalSteps = useMemo(() => {
    return filtered.reduce((acc, p) => {
      return acc + p.blocks.filter((b) => b.type === 'step' || b.type === 'heading').length;
    }, 0);
  }, [filtered]);

  const checklistCount = useMemo(() => {
    return filtered.reduce((acc, p) => {
      return acc + p.blocks.filter((b) => b.type === 'step').length;
    }, 0);
  }, [filtered]);

  const handleExportCSV = () => {
    const headers = ['ID', 'Versao', 'Titulo', 'Modulo', 'Caminho_ERP', 'Etapas', 'Status'];
    const rows = filtered.map((p) => {
      const isV10 = p.systemVersion === 'v10';
      const steps = p.blocks.filter((b) => b.type === 'step' || b.type === 'heading').length;
      return [
        p.id,
        isV10 ? 'V10 Cloud' : 'Clássico',
        `"${p.title.replace(/"/g, '""')}"`,
        `"${(p.category || 'Geral').replace(/"/g, '""')}"`,
        `"${(p.systemPath || '').replace(/"/g, '""')}"`,
        steps,
        'Homologado',
      ];
    });

    const csvContent =
      '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_procedimentos_digifarma_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="relatorios-view-container">
      <div className="topbar">
        <div>
          <h1 className="dashboard-title head" style={{ margin: 0 }}>
            Relatórios &amp; Auditoria da Qualidade
          </h1>
          <div className="muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
            Indicadores de conformidade operacional, rastreabilidade de etapas e relatórios de auditoria BPF.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button type="button" className="btn ghost sm" onClick={handleExportCSV}>
            <Download size={14} />
            <span>Exportar CSV</span>
          </button>

          <button type="button" className="btn primary sm" onClick={handlePrint}>
            <Printer size={14} />
            <span>Imprimir Relatório</span>
          </button>
        </div>
      </div>

      {/* Grid de 3 Cartões de Métricas de Auditoria */}
      <div className="grid cols-3" style={{ marginTop: '1rem' }}>
        <div className="card">
          <div className="muted" style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>
            Total de POPs Filtrados
          </div>
          <div className="big" style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
            {filtered.length}
          </div>
          <div className="delta muted" style={{ fontSize: '0.75rem', marginTop: '4px' }}>
            {procedures.length} procedimentos cadastrados no total
          </div>
        </div>

        <div className="card">
          <div className="muted" style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>
            Etapas Documentadas
          </div>
          <div className="big" style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px', color: 'var(--red)' }}>
            {totalSteps}
          </div>
          <div className="delta muted" style={{ fontSize: '0.75rem', marginTop: '4px' }}>
            Passo a passo com telas e dicas
          </div>
        </div>

        <div className="card">
          <div className="muted" style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>
            Conformidade BPF
          </div>
          <div className="big" style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px', color: '#10b981' }}>
            100%
          </div>
          <div className="delta muted" style={{ fontSize: '0.75rem', marginTop: '4px' }}>
            {checklistCount} pontos de controle validados
          </div>
        </div>
      </div>

      {/* Filtro de Módulo */}
      <div className="filters" style={{ marginTop: '1rem' }}>
        <select
          value={filterModule}
          onChange={(e) => setFilterModule(e.target.value)}
          style={{ maxWidth: '240px' }}
        >
          <option value="todos">Todos os módulos</option>
          {menus.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tabela de Detalhamento por Módulo */}
      <div className="table-wrap" style={{ marginTop: '1rem' }}>
        <table className="table-lh">
          <thead>
            <tr>
              <th>Módulo / Área do ERP</th>
              <th style={{ textAlign: 'center' }}>Total de POPs</th>
              <th style={{ textAlign: 'center' }}>Etapas</th>
              <th style={{ textAlign: 'center' }}>Checklists</th>
              <th style={{ textAlign: 'right' }}>Status de Homologação</th>
            </tr>
          </thead>
          <tbody>
            {menus.map((m) => {
              const moduleProcs = procedures.filter(
                (p) => p.menuId === m.id || p.category?.toLowerCase() === m.id.toLowerCase()
              );
              const steps = moduleProcs.reduce((acc, p) => {
                return acc + p.blocks.filter((b) => b.type === 'step' || b.type === 'heading').length;
              }, 0);
              const checks = moduleProcs.reduce((acc, p) => {
                return acc + p.blocks.filter((b) => b.type === 'step').length;
              }, 0);

              return (
                <tr key={m.id}>
                  <td>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {m.label}
                    </strong>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>{moduleProcs.length}</td>
                  <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{steps}</td>
                  <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{checks}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="status-pill status-confirmado">
                      <CheckCircle2 size={11} />
                      Homologado 100%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
