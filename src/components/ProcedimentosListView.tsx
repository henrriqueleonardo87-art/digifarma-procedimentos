import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Clock,
  ArrowRight,
  Edit,
  Trash2,
} from 'lucide-react';
import type { Procedure, SystemMenu, SystemVersion } from '../types/procedure';

interface ProcedimentosListViewProps {
  procedures: Procedure[];
  menus: SystemMenu[];
  activeVersion: SystemVersion;
  onSelectProcedure: (id: string) => void;
  onNewProcedure: () => void;
  onEditProcedure: (proc: Procedure) => void;
  onDeleteProcedure: (proc: Procedure) => void;
}

export const ProcedimentosListView: React.FC<ProcedimentosListViewProps> = ({
  procedures,
  menus,
  activeVersion,
  onSelectProcedure,
  onNewProcedure,
  onEditProcedure,
  onDeleteProcedure,
}) => {
  const [filterVersion, setFilterVersion] = useState<string>(activeVersion || 'todos');
  const [filterMenu, setFilterMenu] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<string>('data_desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filtragem
  const filteredList = useMemo(() => {
    let list = [...procedures];

    if (filterVersion !== 'todos') {
      list = list.filter((p) => p.systemVersion === filterVersion || p.systemVersion === 'ambos');
    }

    if (filterMenu !== 'todos') {
      list = list.filter(
        (p) => p.menuId === filterMenu || p.category?.toLowerCase() === filterMenu.toLowerCase()
      );
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.subtitle?.toLowerCase().includes(q) ||
          p.systemPath?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
      );
    }

    // Ordenação
    list.sort((a, b) => {
      if (sortOrder === 'titulo_asc') return a.title.localeCompare(b.title);
      if (sortOrder === 'titulo_desc') return b.title.localeCompare(a.title);
      if (sortOrder === 'data_asc') {
        return (a.updated_at || '').localeCompare(b.updated_at || '');
      }
      return (b.updated_at || '').localeCompare(a.updated_at || '');
    });

    return list;
  }, [procedures, filterVersion, filterMenu, searchTerm, sortOrder]);

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Recentemente';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return isoString;
    }
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredList.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="procedimentos-view-container">
      {/* Topbar estilo LH Group */}
      <div className="topbar">
        <div>
          <h1 className="dashboard-title head" style={{ margin: 0 }}>
            Procedimentos Operacionais Padrão (POPs)
          </h1>
          <div className="muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
            Consulte, gerencie e audite todos os manuais e instruções de trabalho do Digifarma ERP.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {selectedIds.length > 0 && (
            <span className="muted" style={{ fontSize: '0.82rem' }}>
              {selectedIds.length} selecionado(s)
            </span>
          )}

          <button
            type="button"
            className="btn primary"
            onClick={onNewProcedure}
          >
            <Plus size={15} />
            <span>+ Novo POP</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros no Padrão LH Group */}
      <div className="filters">
        <select
          id="f-version"
          value={filterVersion}
          onChange={(e) => setFilterVersion(e.target.value)}
        >
          <option value="todos">Todas as versões</option>
          <option value="v10">Digifarma V10 Cloud</option>
          <option value="classico">Digifarma Clássico (Desktop)</option>
        </select>

        <select
          id="f-menu"
          value={filterMenu}
          onChange={(e) => setFilterMenu(e.target.value)}
        >
          <option value="todos">Todos os módulos</option>
          {menus.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>

        <select
          id="f-status"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="todos">Todos os status</option>
          <option value="homologado">Homologados BPF</option>
          <option value="elaboracao">Em Elaboração</option>
        </select>

        <div className="search-filter-box" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por nome, rota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '30px' }}
          />
        </div>

        <select
          id="f-sort"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="data_desc">Data (mais recente)</option>
          <option value="data_asc">Data (mais antiga)</option>
          <option value="titulo_asc">Título (A-Z)</option>
          <option value="titulo_desc">Título (Z-A)</option>
        </select>

        <button
          type="button"
          className="btn sm ghost"
          onClick={() => {
            setFilterVersion('todos');
            setFilterMenu('todos');
            setFilterStatus('todos');
            setSearchTerm('');
            setSortOrder('data_desc');
          }}
        >
          Limpar filtros
        </button>
      </div>

      {/* Tabela Formatada no Padrão LH Group */}
      <div className="table-wrap">
        {filteredList.length === 0 ? (
          <div className="empty-state">
            <div className="ic">🗒</div>
            <p>Nenhum procedimento encontrado com os filtros selecionados.</p>
          </div>
        ) : (
          <table className="table-lh">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredList.length}
                    onChange={toggleSelectAll}
                    title="Selecionar todos"
                  />
                </th>
                <th style={{ width: '105px' }}>Data</th>
                <th style={{ width: '110px' }}>Versão</th>
                <th>Manual / POP</th>
                <th>Módulo &amp; Rota no ERP</th>
                <th style={{ width: '130px' }}>Etapas / Checklist</th>
                <th style={{ width: '130px' }}>Status</th>
                <th style={{ width: '130px', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((proc) => {
                const stepCount = proc.blocks.filter((b) => b.type === 'step' || b.type === 'heading').length;
                const checkCount = proc.blocks.filter((b) => b.type === 'step').length;
                const isV10 = proc.systemVersion === 'v10';
                const menuObj = menus.find((m) => m.id === proc.menuId);
                const isChecked = selectedIds.includes(proc.id);

                return (
                  <tr
                    key={proc.id}
                    className="tx-row-editable"
                    onClick={() => onSelectProcedure(proc.id)}
                    title="Clique para visualizar o manual completo"
                  >
                    <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectOne(proc.id)}
                      />
                    </td>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        {formatDate(proc.updated_at)}
                      </span>
                    </td>
                    <td>
                      <span className={`version-pill ${isV10 ? 'v10' : 'classico'}`}>
                        {isV10 ? 'V10 Cloud' : 'Desktop'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                          {proc.title}
                        </strong>
                        {proc.subtitle && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {proc.subtitle}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="module-tag-pill">
                          {menuObj?.label || proc.category || 'Geral'}
                        </span>
                        {proc.systemPath && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            {proc.systemPath}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {stepCount} {stepCount === 1 ? 'etapa' : 'etapas'}
                        {checkCount > 0 && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> • {checkCount} checks</span>}
                      </span>
                    </td>
                    <td>
                      <span className="status-pill status-confirmado">
                        <span className="dot" />
                        Homologado
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn-table-action"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectProcedure(proc.id);
                          }}
                          title="Acessar POP"
                        >
                          <span>Acessar</span>
                          <ArrowRight size={13} />
                        </button>

                        <button
                          type="button"
                          className="btn sm ghost"
                          style={{ padding: '0.35rem 0.5rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditProcedure(proc);
                          }}
                          title="Editar"
                        >
                          <Edit size={13} />
                        </button>

                        <button
                          type="button"
                          className="btn sm danger"
                          style={{ padding: '0.35rem 0.5rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteProcedure(proc);
                          }}
                          title="Excluir"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
