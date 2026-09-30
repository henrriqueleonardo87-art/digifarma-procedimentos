import React, { useState } from 'react';
import { Plus, Calendar, CheckCircle2 } from 'lucide-react';

interface AgendaEvent {
  id: string;
  title: string;
  module: string;
  date: string;
  time: string;
  type: 'treinamento' | 'auditoria' | 'rotina';
}

const DEFAULT_EVENTS: AgendaEvent[] = [
  {
    id: 'ev-1',
    title: 'Treinamento de Balcão: F7 com IA e Busca por Sintomas',
    module: 'Vendas & Balcão',
    date: '2026-09-30',
    time: '14:00',
    type: 'treinamento',
  },
  {
    id: 'ev-2',
    title: 'Auditoria de Conferência Cega no Fechamento de Caixa',
    module: 'Financeiro & Caixa',
    date: '2026-10-02',
    time: '18:30',
    type: 'auditoria',
  },
  {
    id: 'ev-3',
    title: 'Rotina Semanal: Balanço Rotativo de Psicotrópicos (SNGPC)',
    module: 'Estoque & Controlados',
    date: '2026-10-05',
    time: '09:00',
    type: 'rotina',
  },
  {
    id: 'ev-4',
    title: 'Revisão dos POPs de Entrada de Notas XML e Validade PVPS',
    module: 'Compras & Entrada',
    date: '2026-10-10',
    time: '10:30',
    type: 'rotina',
  },
];

export const AgendaView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 30)); // Setembro/Outubro 2026
  const [events, setEvents] = useState<AgendaEvent[]>(DEFAULT_EVENTS);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newModule, setNewModule] = useState('Vendas & Balcão');
  const [newDate, setNewDate] = useState('2026-10-01');
  const [newTime, setNewTime] = useState('14:00');

  const monthLabel = (d: Date) => {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return `${months[d.getMonth()]} de ${d.getFullYear()}`;
  };

  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const ev: AgendaEvent = {
      id: `ev-${Date.now()}`,
      title: newTitle.trim(),
      module: newModule,
      date: newDate,
      time: newTime,
      type: 'treinamento',
    };
    setEvents((prev) => [...prev, ev]);
    setNewTitle('');
    setShowNewModal(false);
  };

  return (
    <div className="agenda-view-container">
      <div className="topbar">
        <div>
          <h1 className="dashboard-title head" style={{ margin: 0 }}>
            Agenda &amp; Rotinas da Farmácia
          </h1>
          <div className="muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
            Cronograma de auditorias, treinamentos operacionais de equipe e rotinas obrigatórias BPF.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn primary"
            onClick={() => setShowNewModal(true)}
          >
            <Plus size={15} />
            <span>+ Novo Treinamento</span>
          </button>

          <div className="period-nav" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button type="button" className="btn icon-only" onClick={handlePrevMonth}>
              ‹
            </button>
            <strong style={{ minWidth: '150px', textAlign: 'center', fontSize: '0.9rem' }}>
              {monthLabel(currentDate)}
            </strong>
            <button type="button" className="btn icon-only" onClick={handleNextMonth}>
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Eventos / Cartões de Treinamento */}
      <div className="grid cols-2" style={{ marginTop: '1rem' }}>
        <div className="card">
          <div className="section-title">
            <h2 style={{ fontSize: '1rem', margin: 0 }}>Treinamentos e Auditorias Agendadas</h2>
            <span className="muted" style={{ fontSize: '0.8rem' }}>{events.length} rotinas</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
            {events.map((ev) => (
              <div
                key={ev.id}
                className="agenda-event-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-tertiary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--red-soft)',
                      color: 'var(--red)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Calendar size={18} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                      {ev.title}
                    </strong>
                    <div className="muted" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                      {ev.module} • {ev.date} às {ev.time}
                    </div>
                  </div>
                </div>

                <span
                  className="status-pill status-confirmado"
                  style={{ fontSize: '0.72rem' }}
                >
                  <CheckCircle2 size={11} />
                  Agendado
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-title">
            <h2 style={{ fontSize: '1rem', margin: 0 }}>Calendário de Conformidade BPF</h2>
            <span className="muted" style={{ fontSize: '0.8rem' }}>Ciclo Mensal</span>
          </div>

          <div className="checklist-guidelines" style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--paper-2)' }}>
              <strong style={{ fontSize: '0.85rem' }}>Fechamento Cego Diário</strong>
              <p className="muted" style={{ fontSize: '0.75rem', margin: '2px 0 0 0' }}>
                Obrigatório para todos os caixas ao final de cada turno para evitar divergências.
              </p>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--paper-2)' }}>
              <strong style={{ fontSize: '0.85rem' }}>Conferência de Validades (PVPS)</strong>
              <p className="muted" style={{ fontSize: '0.75rem', margin: '2px 0 0 0' }}>
                Primeiro que Vence, Primeiro que Sai — verificação semanal de gôndolas e armários.
              </p>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--paper-2)' }}>
              <strong style={{ fontSize: '0.85rem' }}>Treinamento de Balconistas com F7 IA</strong>
              <p className="muted" style={{ fontSize: '0.75rem', margin: '2px 0 0 0' }}>
                Capacitação da equipe de atendimento para agilizar a pesquisa de similares e genéricos.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Novo Treinamento */}
      {showNewModal && (
        <div className="screen-help-modal-overlay">
          <div className="screen-help-modal" style={{ maxWidth: '440px' }}>
            <div className="screen-help-header">
              <h3>Novo Treinamento / Rotina</h3>
              <button
                type="button"
                className="btn sm ghost"
                onClick={() => setShowNewModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEvent}>
              <div className="screen-help-body">
                <div className="field">
                  <label>Título do Treinamento</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Treinamento Caixa Cego"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Módulo do ERP</label>
                  <select value={newModule} onChange={(e) => setNewModule(e.target.value)}>
                    <option>Vendas &amp; Balcão</option>
                    <option>Financeiro &amp; Caixa</option>
                    <option>Estoque &amp; Controlados</option>
                    <option>Compras &amp; Entrada</option>
                  </select>
                </div>

                <div className="field-row">
                  <div className="field">
                    <label>Data</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Horário</label>
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="screen-help-footer">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setShowNewModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn primary">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
