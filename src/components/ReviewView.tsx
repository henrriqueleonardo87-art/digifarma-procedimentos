import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Edit3,
  FileCheck,
  Search,
  MessageSquare,
  ShieldCheck,
  X,
  Upload,
  FileText,
  Monitor
} from 'lucide-react';
import type { Procedure } from '../types/procedure';
import type { AppUser } from '../types/auth';

interface ReviewViewProps {
  procedures: Procedure[];
  onViewProcedure: (procedure: Procedure) => void;
  onEditProcedure: (procedure: Procedure) => void;
  onApproveProcedure: (procedureId: string, reviewerName: string) => void;
  onRequestAdjustments: (procedureId: string, reviewerName: string, reason: string) => void;
  currentUser?: AppUser | null;
  isEditorEnabled?: boolean;
  onOpenImport?: (procedure: Procedure) => void;
}

export const ReviewView: React.FC<ReviewViewProps> = ({
  procedures,
  onViewProcedure,
  onEditProcedure,
  onApproveProcedure,
  onRequestAdjustments,
  currentUser,
  isEditorEnabled = false,
  onOpenImport,
}) => {
  const [filterTab, setFilterTab] = useState<'pending' | 'adjustments' | 'approved' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal de Solicitação de Ajustes
  const [adjustingProc, setAdjustingProc] = useState<Procedure | null>(null);
  const [adjustmentReason, setAdjustmentReason] = useState('');

  const reviewerName = currentUser?.name || currentUser?.username || 'Revisor Técnico';

  // Contadores
  const pendingList = procedures.filter((p) => p.status === 'pendente');
  const adjustmentsList = procedures.filter((p) => p.status === 'ajustes_solicitados');
  const approvedList = procedures.filter((p) => !p.status || p.status === 'aprovado');

  // Filtragem dos procedimentos
  const filteredProcedures = procedures.filter((p) => {
    // Filtro por Aba
    if (filterTab === 'pending' && p.status !== 'pendente') return false;
    if (filterTab === 'adjustments' && p.status !== 'ajustes_solicitados') return false;
    if (filterTab === 'approved' && p.status && p.status !== 'aprovado') return false;

    // Filtro por Texto
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchAuthor = (p.author || '').toLowerCase().includes(q);
      const matchCat = (p.category || '').toLowerCase().includes(q);
      return matchTitle || matchAuthor || matchCat;
    }
    return true;
  });

  const handleOpenAdjustModal = (proc: Procedure) => {
    setAdjustingProc(proc);
    setAdjustmentReason(proc.rejectionReason || '');
  };

  const handleConfirmAdjustments = () => {
    if (!adjustingProc || !adjustmentReason.trim()) return;
    onRequestAdjustments(adjustingProc.id, reviewerName, adjustmentReason.trim());
    setAdjustingProc(null);
    setAdjustmentReason('');
  };

  return (
    <div className="review-dashboard-container">
      {/* Topo Executivo */}
      <div className="review-hero-header">
        <div className="review-hero-left">
          <div className="review-hero-badge">
            <ShieldCheck size={14} color="var(--red)" />
            <span>CENTRAL DE HOMOLOGAÇÃO ISO 9001 & BPF</span>
          </div>
          <h1 className="review-hero-title">Painel de Revisão & Aprovação de POPs</h1>
          <p className="review-hero-desc">
            Controle de qualidade e validação de procedimentos operacionais antes da publicação oficial aos colaboradores.
          </p>
        </div>

        {/* Métricas / Cards Rápidos */}
        <div className="review-stats-grid">
          <div
            className={`review-stat-card pending ${filterTab === 'pending' ? 'selected' : ''}`}
            onClick={() => setFilterTab('pending')}
          >
            <div className="review-stat-ico">
              <Clock size={20} />
            </div>
            <div>
              <span className="review-stat-number">{pendingList.length}</span>
              <span className="review-stat-label">Aguardando Revisão</span>
            </div>
          </div>

          <div
            className={`review-stat-card adjustments ${filterTab === 'adjustments' ? 'selected' : ''}`}
            onClick={() => setFilterTab('adjustments')}
          >
            <div className="review-stat-ico">
              <AlertTriangle size={20} />
            </div>
            <div>
              <span className="review-stat-number">{adjustmentsList.length}</span>
              <span className="review-stat-label">Ajustes Solicitados</span>
            </div>
          </div>

          <div
            className={`review-stat-card approved ${filterTab === 'approved' ? 'selected' : ''}`}
            onClick={() => setFilterTab('approved')}
          >
            <div className="review-stat-ico">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <span className="review-stat-number">{approvedList.length}</span>
              <span className="review-stat-label">Homologados & Ativos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="review-filter-toolbar">
        <div className="review-tabs-group">
          <button
            type="button"
            className={`review-tab-btn ${filterTab === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterTab('pending')}
          >
            <Clock size={14} />
            <span>Pendentes ({pendingList.length})</span>
          </button>

          <button
            type="button"
            className={`review-tab-btn ${filterTab === 'adjustments' ? 'active' : ''}`}
            onClick={() => setFilterTab('adjustments')}
          >
            <AlertTriangle size={14} />
            <span>Ajustes Solicitados ({adjustmentsList.length})</span>
          </button>

          <button
            type="button"
            className={`review-tab-btn ${filterTab === 'approved' ? 'active' : ''}`}
            onClick={() => setFilterTab('approved')}
          >
            <CheckCircle2 size={14} />
            <span>Homologados ({approvedList.length})</span>
          </button>

          <button
            type="button"
            className={`review-tab-btn ${filterTab === 'all' ? 'active' : ''}`}
            onClick={() => setFilterTab('all')}
          >
            <span>Todos ({procedures.length})</span>
          </button>
        </div>

        <div className="review-search-wrap">
          <Search size={15} className="review-search-icon" />
          <input
            type="text"
            className="review-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, autor, módulo..."
          />
          {searchTerm && (
            <button
              type="button"
              className="review-search-clear"
              onClick={() => setSearchTerm('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Lista de Procedimentos em Revisão */}
      <div className="review-cards-list">
        {filteredProcedures.length === 0 ? (
          <div className="review-empty-state">
            <FileCheck size={48} color="var(--text-muted)" />
            <h3>Nenhum procedimento encontrado nesta categoria</h3>
            <p>
              {filterTab === 'pending'
                ? 'Todos os procedimentos estão em dia! Nenhum POP aguardando revisão no momento.'
                : 'Não há itens correspondentes aos critérios de filtro selecionados.'}
            </p>
          </div>
        ) : (
          filteredProcedures.map((proc) => {
            const isV10 = proc.systemVersion === 'v10';
            const status = proc.status || 'aprovado';
            const stepCount = proc.blocks.filter((b) => b.type === 'step').length;

            return (
              <div key={proc.id} className={`review-card status-${status}`}>
                <div className="review-card-top">
                  <div className="review-card-meta">
                    <span className={`review-status-tag ${status}`}>
                      {status === 'pendente' && '⏳ Aguardando Revisão'}
                      {status === 'ajustes_solicitados' && '⚠️ Ajustes Solicitados'}
                      {status === 'aprovado' && '✓ Homologado Oficial'}
                    </span>

                    <span className="review-version-pill">
                      {isV10 ? 'Digifarma V10' : 'Digifarma Clássico'}
                    </span>

                    <span className="review-category-pill">
                      {proc.category || 'Geral'}
                    </span>

                    <span className="review-steps-count">
                      {stepCount} etapa{stepCount !== 1 ? 's' : ''}
                    </span>

                    {proc.pdfFileUrl && (
                      <span className="file-format-badge pdf" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                        <FileText size={12} /> PDF
                      </span>
                    )}
                    {proc.htmlFileData && (
                      <span className="file-format-badge html" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#e0f2fe', color: '#0284c7', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                        <Monitor size={12} /> HTML
                      </span>
                    )}
                  </div>

                  <div className="review-card-author-info">
                    <span>Criado/Elaborado por: <strong>{proc.author || 'Usuário'}</strong></span>
                    {proc.reviewedBy && (
                      <span className="reviewed-by-info">
                        · Última análise: <strong>{proc.reviewedBy}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="review-card-body">
                  <h3 className="review-card-title">{proc.title}</h3>
                  <p className="review-card-subtitle">
                    {proc.subtitle || 'Procedimento Operacional Padrão do ERP Digifarma.'}
                  </p>

                  {/* Alerta de Feedback / Ajustes Solicitados */}
                  {status === 'ajustes_solicitados' && proc.rejectionReason && (
                    <div className="review-reason-box">
                      <div className="review-reason-header">
                        <AlertTriangle size={15} color="#d97706" />
                        <strong>Apontamentos do Revisor para Correção:</strong>
                      </div>
                      <p className="review-reason-text">{proc.rejectionReason}</p>
                    </div>
                  )}
                </div>

                {/* Barra de Ações Rápidas de Revisão */}
                <div className="review-card-actions">
                  <div className="review-actions-left">
                    <button
                      type="button"
                      className="btn-review-action preview"
                      onClick={() => onViewProcedure(proc)}
                      title="Abrir e conferir o procedimento em modo apresentação"
                    >
                      <Eye size={14} />
                      <span>Visualizar POP</span>
                    </button>

                    {onOpenImport && (
                      <button
                        type="button"
                        className="btn-review-action preview"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                        onClick={() => onOpenImport(proc)}
                        title="Anexar ou atualizar arquivo PDF/HTML deste procedimento"
                      >
                        <Upload size={14} />
                        <span>Anexar Arquivo</span>
                      </button>
                    )}

                    {isEditorEnabled && (
                      <button
                        type="button"
                        className="btn-review-action edit"
                        onClick={() => onEditProcedure(proc)}
                        title="Editar o procedimento no estúdio"
                      >
                        <Edit3 size={14} />
                        <span>Editar</span>
                      </button>
                    )}
                  </div>

                  <div className="review-actions-right">
                    {status !== 'ajustes_solicitados' && (
                      <button
                        type="button"
                        className="btn-review-action request-changes"
                        onClick={() => handleOpenAdjustModal(proc)}
                        title="Solicitar alterações ao autor antes de aprovar"
                      >
                        <MessageSquare size={14} />
                        <span>Solicitar Ajustes</span>
                      </button>
                    )}

                    {status !== 'aprovado' ? (
                      <button
                        type="button"
                        className="btn-review-action approve"
                        onClick={() => onApproveProcedure(proc.id, reviewerName)}
                        title="Aprovar e homologar oficialmente o POP"
                      >
                        <CheckCircle2 size={15} />
                        <span>Aprovar &amp; Publicar</span>
                      </button>
                    ) : (
                      <span className="approved-checked-badge">
                        <CheckCircle2 size={14} color="#10b981" />
                        <span>Publicado no Sistema</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal para Solicitar Ajustes com Justificativa */}
      {adjustingProc && (
        <div className="review-modal-backdrop" onClick={() => setAdjustingProc(null)}>
          <div className="review-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="review-modal-header">
              <div className="review-modal-title-row">
                <AlertTriangle size={20} color="#f59e0b" />
                <h3>Solicitar Ajustes no POP</h3>
              </div>
              <button
                type="button"
                className="review-modal-close"
                onClick={() => setAdjustingProc(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="review-modal-body">
              <p className="review-modal-hint">
                Procedimento: <strong>{adjustingProc.title}</strong>
              </p>
              <p className="review-modal-subhint">
                Descreva com detalhes o que o autor deve corrigir (ex: trocar print da etapa 2, detalhar regra fiscal, ajustar posicionamento dos indicadores). Essa mensagem aparecerá diretamente na tela do procedimento para ajuste imediato.
              </p>

              <textarea
                className="review-textarea"
                rows={5}
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="Exemplo: Na Etapa 02, o campo 'Código NCM' precisa estar com indicador de destaque vermelho e a dica de agilidade deve citar o atalho F2..."
                autoFocus
              />
            </div>

            <div className="review-modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setAdjustingProc(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-modal-confirm"
                disabled={!adjustmentReason.trim()}
                onClick={handleConfirmAdjustments}
              >
                <MessageSquare size={14} />
                <span>Enviar Apontamentos ao Autor</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
