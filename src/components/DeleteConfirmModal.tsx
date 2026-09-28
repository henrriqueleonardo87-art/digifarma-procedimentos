import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  procedureTitle: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  procedureTitle,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ color: 'var(--danger-text)' }}>
            <AlertTriangle size={20} />
            Excluir Procedimento
          </h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
            Tem certeza de que deseja excluir permanentemente o procedimento:
          </p>
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.95rem',
            }}
          >
            "{procedureTitle}"
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Esta ação não poderá ser desfeita no Supabase nem na base local.
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            <Trash2 size={16} />
            Excluir Definitivamente
          </button>
        </div>
      </div>
    </div>
  );
};
