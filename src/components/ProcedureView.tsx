import React, { useMemo } from 'react';
import {
  Edit3,
  Printer,
  Trash2,
  Clock,
  User,
  AlertCircle,
  Info,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  CheckSquare,
  Navigation,
  ChevronRight,
  Monitor,
  Rocket,
} from 'lucide-react';
import type {
  Procedure,
  HeadingBlock,
  TextBlock,
  ImageBlock,
  CalloutBlock,
  StepBlock,
  SystemMenu,
} from '../types/procedure';

interface ProcedureViewProps {
  procedure: Procedure;
  menus: SystemMenu[];
  onEdit: () => void;
  onDelete: () => void;
  onOpenImageLightbox: (url: string, caption?: string) => void;
  onUpdateStepCompletion: (blockId: string, completed: boolean) => void;
}

export const ProcedureView: React.FC<ProcedureViewProps> = ({
  procedure,
  menus,
  onEdit,
  onDelete,
  onOpenImageLightbox,
  onUpdateStepCompletion,
}) => {
  // Encontrar nomes amigáveis para Menus e Submenus
  const menuInfo = useMemo(() => {
    const foundMenu = menus.find(
      (m) => m.id === procedure.menuId || m.label.toLowerCase() === procedure.category?.toLowerCase()
    );
    const foundSubmenu = foundMenu?.submenus.find((s) => s.id === procedure.submenuId);
    return {
      menuLabel: foundMenu?.label || procedure.category || 'Geral',
      submenuLabel: foundSubmenu?.label || null,
    };
  }, [menus, procedure]);

  // Caminho do Procedimento formatado em segmentos
  const pathSegments = useMemo(() => {
    if (procedure.systemPath && procedure.systemPath.trim()) {
      return procedure.systemPath
        .split(/[➔>]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const versionStr =
      procedure.systemVersion === 'v10'
        ? 'Digifarma V10'
        : procedure.systemVersion === 'classico'
        ? 'Digifarma Clássico'
        : 'Digifarma ERP';

    return [
      versionStr,
      menuInfo.menuLabel,
      menuInfo.submenuLabel,
      procedure.title,
    ].filter(Boolean) as string[];
  }, [procedure, menuInfo]);

  // Lista de passos interativos para acompanhamento de checklist
  const stepBlocks = useMemo(() => {
    return procedure.blocks.filter((b): b is StepBlock => b.type === 'step');
  }, [procedure.blocks]);

  const completedSteps = useMemo(() => {
    return stepBlocks.filter((s) => s.completed).length;
  }, [stepBlocks]);

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Atualizado recentemente';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Contador sequencial dos passos para a linha do tempo moderna
  let stepIndex = 0;

  return (
    <article className="procedure-reader" id="printable-procedure">
      {/* ==============================================================
          CABEÇALHO OFICIAL EXCLUSIVO PARA IMPRESSÃO / PDF (POP)
          Visível APENAS quando impresso via @media print
          ============================================================== */}
      <div className="print-only print-sop-container">
        <div className="print-sop-header-table">
          <div className="print-sop-top-row">
            <div className="print-sop-brand-box">
              <span className="print-sop-brand-name">DIGIFARMA</span>
              <span className="print-sop-brand-sub">SISTEMAS FARMACÊUTICOS</span>
            </div>
            <div className="print-sop-title-box">
              <span className="print-sop-type">PROCEDIMENTO OPERACIONAL PADRÃO (POP)</span>
              <span className="print-sop-doc-name">{procedure.title}</span>
            </div>
            <div className="print-sop-code-box">
              <div className="print-code-item">
                <span className="print-code-lbl">CÓDIGO:</span>
                <span className="print-code-val">
                  POP-{(procedure.category || 'GER').slice(0, 4).toUpperCase()}-
                  {(procedure.id || '001').slice(0, 5).toUpperCase()}
                </span>
              </div>
              <div className="print-code-item">
                <span className="print-code-lbl">VERSÃO:</span>
                <span className="print-code-val">
                  {procedure.systemVersion === 'v10' ? 'V10 Web' : 'Clássico'} (v2.0)
                </span>
              </div>
              <div className="print-code-item">
                <span className="print-code-lbl">REVISÃO:</span>
                <span className="print-code-val">{formatDate(procedure.updated_at)}</span>
              </div>
            </div>
          </div>

          <div className="print-sop-meta-row">
            <div className="print-meta-cell">
              <span className="print-meta-lbl">Módulo / Área:</span>
              <span className="print-meta-val">{menuInfo.menuLabel}</span>
            </div>
            <div className="print-meta-cell">
              <span className="print-meta-lbl">Caminho no ERP:</span>
              <span className="print-meta-val">{pathSegments.join(' ➔ ')}</span>
            </div>
            <div className="print-meta-cell">
              <span className="print-meta-lbl">Elaborador / Autor:</span>
              <span className="print-meta-val">{procedure.author || 'Equipe Técnica Digifarma'}</span>
            </div>
            <div className="print-meta-cell">
              <span className="print-meta-lbl">Status da Norma:</span>
              <span className="print-meta-val print-badge-active">HOMOLOGADO</span>
            </div>
          </div>
        </div>

        {procedure.subtitle && (
          <div className="print-sop-section print-objective-section">
            <div className="print-section-header">1. OBJETIVO & ESCOPO OPERACIONAL</div>
            <p className="print-section-body">{procedure.subtitle}</p>
          </div>
        )}

        <div className="print-sop-section print-route-section">
          <div className="print-section-header">
            {procedure.subtitle ? '2. ROTA DE ACESSO NO DIGIFARMA' : '1. ROTA DE ACESSO NO DIGIFARMA'}
          </div>
          <div className="print-route-badge-trail">
            {pathSegments.map((seg, idx) => (
              <span key={idx} className="print-trail-item">
                {idx > 0 && <span className="print-trail-arrow">➔</span>}
                <strong className="print-trail-text">{seg}</strong>
              </span>
            ))}
          </div>
        </div>

        <div className="print-section-header print-steps-main-header">
          {procedure.subtitle
            ? '3. ROTEIRO DE EXECUÇÃO PASSO A PASSO'
            : '2. ROTEIRO DE EXECUÇÃO PASSO A PASSO'}
        </div>
      </div>

      {/* ==============================================================
          BARRA DE TOPO: CAMINHO NO SISTEMA E AÇÕES (DESIGN MINIMALISTA)
          ============================================================== */}
      <div className="procedure-top-nav no-print">
        {/* Banner com o Caminho Exato no Sistema */}
        <div className="system-route-banner">
          <div className="route-badge-icon">
            <Navigation size={13} color="var(--primary-600)" />
            <span className="route-badge-text">CAMINHO NO SISTEMA</span>
          </div>

          <div className="route-trail">
            {pathSegments.map((seg, idx) => {
              const isLast = idx === pathSegments.length - 1;
              // Detecta atalhos de teclado como (F2), (F5), (F10)
              const matchKbd = seg.match(/\((F\d+)\)/);
              const cleanSeg = matchKbd ? seg.replace(/\(F\d+\)/, '').trim() : seg;
              const kbdKey = matchKbd ? matchKbd[1] : null;

              return (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight size={13} className="route-arrow" />}
                  <span className={`route-segment ${isLast ? 'route-segment-target' : ''}`}>
                    {cleanSeg}
                    {kbdKey && <kbd className="route-kbd">{kbdKey}</kbd>}
                  </span>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Ações Minimalistas */}
        <div className="procedure-actions-minimal">
          <button
            type="button"
            className="btn-action-ghost"
            onClick={handlePrint}
            title="Imprimir POP ou salvar em PDF limpo"
          >
            <Printer size={15} />
            <span>Imprimir / PDF</span>
          </button>

          <button
            type="button"
            className="btn-action-primary"
            onClick={onEdit}
            title="Editar este passo a passo"
          >
            <Edit3 size={14} />
            <span>Editar</span>
          </button>

          <button
            type="button"
            className="btn-icon-danger-minimal"
            onClick={onDelete}
            title="Excluir procedimento"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* ==============================================================
          CABEÇALHO EDITORIAL DO PROCEDIMENTO (PADRÃO V10)
          ============================================================== */}
      <header className="procedure-main-header">
        <p className="eyebrow no-print">
          <span className="num">
            {procedure.systemVersion === 'v10' ? 'DIGIFARMA V10' : 'DIGIFARMA CLÁSSICO'}
          </span>
          <span>{menuInfo.menuLabel} • PROCEDIMENTO OPERACIONAL PADRÃO</span>
        </p>

        <h1 className="procedure-hero-title">{procedure.title || 'Passo a Passo Sem Título'}</h1>

        {procedure.subtitle && (
          <p className="procedure-hero-subtitle lead">{procedure.subtitle}</p>
        )}

        {/* Linha Sutil de Metadados e Badges V10 */}
        <div className="procedure-meta-minimal no-print">
          <span className="meta-inline-item">
            {procedure.systemVersion === 'v10' ? (
              <span className="pill" style={{ background: 'var(--red-soft)', color: 'var(--red)' }}>
                <Rocket size={12} />
                Digifarma V10
              </span>
            ) : (
              <span className="pill" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.25)' }}>
                <Monitor size={12} />
                Digifarma Clássico
              </span>
            )}
          </span>

          <span className="meta-separator">•</span>

          <span className="meta-inline-item">
            <User size={13} />
            <span>{procedure.author || 'Equipe Digifarma'}</span>
          </span>

          <span className="meta-separator">•</span>

          <span className="meta-inline-item">
            <Clock size={13} />
            <span>Revisado em {formatDate(procedure.updated_at)}</span>
          </span>

          {stepBlocks.length > 0 && (
            <>
              <span className="meta-separator">•</span>
              <span className="meta-inline-item checklist-count">
                <CheckSquare size={13} />
                <span>
                  {completedSteps} de {stepBlocks.length} itens checados ({stepBlocks.length > 0 ? Math.round((completedSteps / stepBlocks.length) * 100) : 0}%)
                </span>
              </span>
            </>
          )}
        </div>
      </header>

      {/* ==============================================================
          CORPO DO PASSO A PASSO (TIMELINE MINIMALISTA & PADRÃO V10)
          ============================================================== */}
      <div className="procedure-flow-timeline">
        {procedure.blocks.map((block) => {
          // ==========================================
          // 1. TÍTULO / ETAPA (HEADING)
          // ==========================================
          if (block.type === 'heading') {
            const hBlock = block as HeadingBlock;
            stepIndex++;
            const stepNumStr = String(stepIndex).padStart(2, '0');

            return (
              <div key={block.id} className="timeline-step-node">
                <div className="step-circle-badge">
                  <span>{stepIndex}</span>
                </div>
                <div className="step-content-box">
                  <p className="eyebrow no-print" style={{ marginBottom: '4px' }}>
                    <span className="num">{stepNumStr}</span>
                    <span>ETAPA OPERACIONAL</span>
                  </p>
                  <h2 className="step-heading-title">{hBlock.content}</h2>
                </div>
              </div>
            );
          }

          // ==========================================
          // 2. TEXTO DESCRITIVO (TEXT)
          // ==========================================
          if (block.type === 'text') {
            const tBlock = block as TextBlock;
            return (
              <div key={block.id} className="timeline-text-node">
                <div className="timeline-connector-spacer" />
                <div className="step-prose-content">
                  <p>{tBlock.content}</p>
                </div>
              </div>
            );
          }

          // ==========================================
          // 3. CAPTURA DE TELA / IMAGEM (SHOTFRAME V10)
          // ==========================================
          if (block.type === 'image') {
            const imgBlock = block as ImageBlock;
            return (
              <div key={block.id} className="timeline-media-node">
                <div className="timeline-connector-spacer" />
                <figure className="step-figure-clean">
                  <div className="shotframe">
                    <div className="glow no-print" />
                    <span className="themetag no-print">
                      {procedure.systemVersion === 'v10' ? 'Digifarma V10 Web' : 'Digifarma Clássico'}
                    </span>
                    <div
                      className="frame step-image-wrap"
                      onClick={() => onOpenImageLightbox(imgBlock.url, imgBlock.caption)}
                      title="Clique para ampliar em tela cheia"
                    >
                      <img
                        src={imgBlock.url}
                        alt={imgBlock.altText || imgBlock.caption || 'Tela do sistema'}
                        className="step-image-element"
                        loading="lazy"
                      />
                      <div className="image-zoom-indicator no-print">
                        <ZoomIn size={14} />
                        <span>Ampliar Imagem</span>
                      </div>
                    </div>
                  </div>

                  {imgBlock.caption && (
                    <figcaption className="step-figure-caption">
                      {imgBlock.caption}
                    </figcaption>
                  )}
                </figure>
              </div>
            );
          }

          // ==========================================
          // 4. ALERTA / DICA / AVISO (CALLOUT V10)
          // ==========================================
          if (block.type === 'callout') {
            const cBlock = block as CalloutBlock;

            const getCalloutIcon = () => {
              switch (cBlock.calloutType) {
                case 'warning':
                  return <AlertTriangle size={18} color="var(--amber)" />;
                case 'danger':
                  return <AlertCircle size={18} color="var(--red)" />;
                case 'success':
                  return <CheckCircle2 size={18} color="var(--accent)" />;
                default:
                  return <Info size={18} color="#3b82f6" />;
              }
            };

            return (
              <div key={block.id} className="timeline-callout-node">
                <div className="timeline-connector-spacer" />
                <aside className={`callout-card-minimal callout-${cBlock.calloutType}`}>
                  <div className="callout-card-icon">{getCalloutIcon()}</div>
                  <div className="callout-card-body">
                    {cBlock.title && <h3 className="callout-title">{cBlock.title}</h3>}
                    <p className="callout-text">{cBlock.content}</p>
                  </div>
                </aside>
              </div>
            );
          }

          // ==========================================
          // 5. ITEM DE CONFERÊNCIA (CHECKLIST STEP V10)
          // ==========================================
          if (block.type === 'step') {
            const sBlock = block as StepBlock;
            return (
              <div key={block.id} className="timeline-checklist-node">
                <div className="timeline-connector-spacer" />
                <label className={`checklist-item-row ${sBlock.completed ? 'completed' : ''}`}>
                  <div className="no-print" style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      className="checklist-checkbox"
                      checked={!!sBlock.completed}
                      onChange={(e) => onUpdateStepCompletion(block.id, e.target.checked)}
                    />
                  </div>
                  {/* Caixa de marcação quadrada visível exclusivamente na impressão / PDF */}
                  <span className="print-only print-checkbox-indicator">
                    {sBlock.completed ? '☑' : '☐'}
                  </span>
                  <span className="checklist-text">{sBlock.content}</span>
                </label>
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* ==============================================================
          PROTOCOLO DE HOMOLOGAÇÃO & ASSINATURAS (PDF / IMPRESSÃO)
          ============================================================== */}
      <div className="print-only print-sop-signatures-block">
        <div className="print-section-header">CONTROLE DE APROVAÇÃO E HOMOLOGAÇÃO (BPF)</div>
        <div className="print-signatures-grid">
          <div className="print-sign-col">
            <span className="print-sign-title">ELABORADO POR:</span>
            <div className="print-sign-line" />
            <span className="print-sign-name">{procedure.author || 'Equipe Técnica Digifarma'}</span>
            <span className="print-sign-role">Operador / Autor</span>
          </div>

          <div className="print-sign-col">
            <span className="print-sign-title">REVISADO / TREINADO:</span>
            <div className="print-sign-line" />
            <span className="print-sign-name">___________________________</span>
            <span className="print-sign-role">Colaborador em Treinamento</span>
          </div>

          <div className="print-sign-col">
            <span className="print-sign-title">APROVADO POR:</span>
            <div className="print-sign-line" />
            <span className="print-sign-name">___________________________</span>
            <span className="print-sign-role">Farmacêutico RT / Gestão</span>
          </div>
        </div>

        <div className="print-sop-disclaimer">
          <span>Digifarma Sistemas Farmacêuticos • Manual de Procedimento Operacional Padrão (POP)</span>
          <span>Impresso via Repositório Oficial • {new Date().toLocaleDateString('pt-BR')}</span>
        </div>
      </div>

      {/* Rodapé do Procedimento */}
      <footer className="procedure-reader-footer no-print">
        <div className="footer-done-banner">
          <CheckCircle2 size={18} color="var(--primary-600)" />
          <span>Fim do procedimento operacional padrão.</span>
        </div>
      </footer>
    </article>
  );
};
