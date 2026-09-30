import React from 'react';
import { History, Calendar, User, Clock, CheckCircle2, X } from 'lucide-react';
import type { Procedure } from '../types/procedure';

interface ProcedureTimelineModalProps {
  procedure: Procedure;
  isOpen: boolean;
  onClose: () => void;
}

function formatDate(iso?: string) {
  if (!iso) return 'Data não informada';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export const ProcedureTimelineModal: React.FC<ProcedureTimelineModalProps> = ({
  procedure,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const creator = procedure.createdBy || procedure.author || 'Leonardo';
  const editor = procedure.updatedBy || procedure.author || 'Leonardo';
  const createdDate = formatDate(procedure.created_at);
  const updatedDate = formatDate(procedure.updated_at);
  const isDifferentDate = procedure.created_at !== procedure.updated_at;

  const historyItems = procedure.history || [];

  return (
    <div className="timeline-modal-backdrop" onClick={onClose}>
      <div
        className="timeline-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Topo do Modal */}
        <div className="timeline-header">
          <div className="timeline-header-title-wrap">
            <div className="timeline-icon-box">
              <History size={20} />
            </div>
            <div>
              <h2 className="timeline-title">Histórico de Alterações</h2>
              <span className="timeline-sub">{procedure.title}</span>
            </div>
          </div>

          <button
            type="button"
            className="timeline-btn-close"
            onClick={onClose}
            aria-label="Fechar histórico"
          >
            <X size={18} />
          </button>
        </div>

        {/* Resumo Rápido */}
        <div className="timeline-summary-grid">
          <div className="timeline-summary-item created">
            <div className="summary-label">
              <Calendar size={13} />
              <span>Criação Original</span>
            </div>
            <div className="summary-val">{createdDate}</div>
            <div className="summary-author">
              <User size={12} />
              <span>Por: <strong>{creator}</strong></span>
            </div>
          </div>

          <div className="timeline-summary-item updated">
            <div className="summary-label">
              <Clock size={13} />
              <span>Última Atualização</span>
            </div>
            <div className="summary-val">{updatedDate}</div>
            <div className="summary-author">
              <User size={12} />
              <span>Por: <strong>{editor}</strong></span>
            </div>
          </div>
        </div>

        {/* Linha do Tempo Visual */}
        <div className="timeline-events-container">
          <h3 className="timeline-events-heading">Linha do Tempo Operacional</h3>

          <div className="timeline-track">
            {/* Evento Atual de Modificação */}
            {isDifferentDate && (
              <div className="timeline-event-item">
                <div className="timeline-node update">
                  <Clock size={14} />
                </div>
                <div className="timeline-content">
                  <div className="timeline-event-top">
                    <span className="event-badge update">Revisão / Atualização</span>
                    <span className="event-date">{updatedDate}</span>
                  </div>
                  <p className="event-desc">
                    Revisão de conteúdo e atualização dos passos operacionais.
                  </p>
                  <span className="event-user">Responsável: <strong>{editor}</strong></span>
                </div>
              </div>
            )}

            {/* Eventos customizados do histórico se houver */}
            {historyItems.map((h, i) => (
              <div key={h.id || i} className="timeline-event-item">
                <div className="timeline-node custom">
                  <Clock size={14} />
                </div>
                <div className="timeline-content">
                  <div className="timeline-event-top">
                    <span className="event-badge custom">{h.action}</span>
                    <span className="event-date">{formatDate(h.timestamp)}</span>
                  </div>
                  <p className="event-desc">{h.details || h.description || 'Alteração realizada'}</p>
                  <span className="event-user">Responsável: <strong>{h.user}</strong></span>
                </div>
              </div>
            ))}

            {/* Evento de Criação */}
            <div className="timeline-event-item">
              <div className="timeline-node create">
                <CheckCircle2 size={14} />
              </div>
              <div className="timeline-content">
                <div className="timeline-event-top">
                  <span className="event-badge create">Criação & Homologação</span>
                  <span className="event-date">{createdDate}</span>
                </div>
                <p className="event-desc">
                  Procedimento operacional padrão cadastrado na base de conhecimento.
                </p>
                <span className="event-user">Criado por: <strong>{creator}</strong></span>
              </div>
            </div>
          </div>
        </div>

        <div className="timeline-footer">
          <button type="button" className="btn secondary sm" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
