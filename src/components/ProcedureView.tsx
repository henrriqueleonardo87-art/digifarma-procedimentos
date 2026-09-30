import React, { useState, useMemo } from 'react';
import {
  Edit3,
  Printer,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ArrowLeft,
  Lightbulb,
  Info,
  History,
  FileDown,
  ChevronDown,
  Target,
  MousePointer,
  Star,
  Zap,
  Ban,
  Lock,
  Check,
  Clock,
  FileX,
  Eye,
  EyeOff,
  ClipboardCheck,
} from 'lucide-react';
import type {
  Procedure,
  StepBlock,
  ImageBlock,
  CalloutBlock,
  SystemMenu,
  SlideIndicator,
} from '../types/procedure';
import { ProcedureTimelineModal } from './ProcedureTimelineModal';
import { downloadProcedureHtml } from '../lib/htmlExporter';

interface ProcedureViewProps {
  procedure: Procedure;
  menus: SystemMenu[];
  onEdit: () => void;
  onDelete: () => void;
  onOpenImageLightbox: (url: string, caption?: string) => void;
  onUpdateStepCompletion: (blockId: string, completed: boolean) => void;
  onBack?: () => void;
  autoPrint?: boolean;
  onToggleActive?: () => void;
  onUnpublish?: () => void;
  onSendToReview?: () => void;
  onPublish?: () => void;
}

export const ProcedureView: React.FC<ProcedureViewProps> = ({
  procedure,
  menus,
  onEdit,
  onDelete,
  onOpenImageLightbox,
  onUpdateStepCompletion,
  onBack,
  autoPrint = false,
  onToggleActive,
  onUnpublish,
  onSendToReview,
  onPublish,
}) => {
  // Disparo automático de impressão quando solicitado direto do card
  React.useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);
  // Encontrar nomes amigáveis para Menus e Submenus
  const menuInfo = useMemo(() => {
    const foundMenu = menus.find(
      (m) => m.id === procedure.menuId || m.label.toLowerCase() === procedure.category?.toLowerCase()
    );
    const foundSubmenu = foundMenu?.submenus.find((s) => s.id === procedure.submenuId);
    return {
      menuLabel: foundMenu?.label || procedure.category || 'Operacional ERP',
      submenuLabel: foundSubmenu?.label || null,
    };
  }, [menus, procedure]);

  // Lista de passos operacionais
  const stepBlocks = useMemo(() => {
    return procedure.blocks.filter((b): b is StepBlock => b.type === 'step');
  }, [procedure.blocks]);

  // Imagens associadas
  const imageBlocks = useMemo(() => {
    return procedure.blocks.filter((b): b is ImageBlock => b.type === 'image');
  }, [procedure.blocks]);

  // Callouts / Alertas
  const calloutBlocks = useMemo(() => {
    return procedure.blocks.filter((b): b is CalloutBlock => b.type === 'callout');
  }, [procedure.blocks]);

  const completedSteps = useMemo(() => {
    return stepBlocks.filter((s) => s.completed).length;
  }, [stepBlocks]);

  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  const isV10 = procedure.systemVersion === 'v10';
  const versionTag = isV10 ? 'DIGIFARMA V10' : 'DIGIFARMA CLÁSSICO';

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = '';
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1200);
  };

  const getSlideIndicators = (slideIdx: number): SlideIndicator[] => {
    const isCover = slideIdx === 0;
    const isStep = slideIdx >= 1 && slideIdx <= stepBlocks.length;
    const isBpf = slideIdx === stepBlocks.length + 1;
    const isChecklist = slideIdx === stepBlocks.length + 2;
    const isSignatures = slideIdx === stepBlocks.length + 3;
    const stepIdx = isStep ? slideIdx - 1 : undefined;

    const targetId = isCover
      ? 'slide-cover'
      : isStep
      ? `slide-step-${stepIdx}`
      : isBpf
      ? 'slide-bpf'
      : isChecklist
      ? 'slide-checklist'
      : 'slide-signatures';

    const found = procedure.slidesConfig?.find((s) => {
      if (isCover) return s.slideType === 'cover' || s.id === 'slide-cover';
      if (isStep) return s.stepIndex === stepIdx || s.id === `slide-step-${stepIdx}`;
      if (isBpf) return s.slideType === 'callout' || s.id === 'slide-bpf';
      if (isChecklist) return s.slideType === 'checklist' || s.id === 'slide-checklist';
      if (isSignatures) return s.slideType === 'signatures' || s.id === 'slide-signatures';
      return s.id === targetId;
    });

    return found?.indicators || [];
  };

  const renderIndicatorViewItem = (ind: SlideIndicator) => {
    const color = ind.color || '#ef4444';
    const opacity = ind.opacity ?? 1.0;
    const glow = ind.glow ?? 'none';
    const size = ind.size ?? 'md';
    const glowStyle =
      glow === 'neon'
        ? `0 0 12px ${color}, 0 0 4px #ffffff`
        : glow === 'soft'
        ? `0 0 8px ${color}`
        : undefined;

    let elemContent: React.ReactNode = null;

    if (ind.type === 'hand') {
      const rotation =
        ind.direction === 'right'
          ? 90
          : ind.direction === 'down'
          ? 180
          : ind.direction === 'left'
          ? 270
          : ind.direction === 'down-right'
          ? 135
          : ind.direction === 'up-right'
          ? 45
          : 0;
      const scale = size === 'sm' ? 0.75 : size === 'lg' ? 1.35 : size === 'xl' ? 1.75 : 1.0;

      elemContent = (
        <svg
          width={38 * scale}
          height={38 * scale}
          viewBox="0 0 24 24"
          fill={color}
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: `rotate(${rotation}deg)`,
            filter: glowStyle ? `drop-shadow(${glowStyle})` : 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))',
          }}
        >
          <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v3" />
          <path d="M14 9V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7" />
          <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
          <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
        </svg>
      );
    } else if (ind.type === 'arrow') {
      const rotation =
        ind.direction === 'down'
          ? 90
          : ind.direction === 'left'
          ? 180
          : ind.direction === 'up'
          ? 270
          : ind.direction === 'down-right'
          ? 45
          : ind.direction === 'up-right'
          ? -45
          : 0;
      const scale = size === 'sm' ? 0.75 : size === 'lg' ? 1.35 : size === 'xl' ? 1.75 : 1.0;
      const markerId = `view-ah-${ind.id}`;

      elemContent = (
        <svg
          width={52 * scale}
          height={26 * scale}
          viewBox="0 0 52 26"
          style={{
            transform: `rotate(${rotation}deg)`,
            filter: glowStyle ? `drop-shadow(${glowStyle})` : 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))',
          }}
        >
          <defs>
            <marker id={markerId} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <polygon points="0 0, 7 3.5, 0 7" fill={color} />
            </marker>
          </defs>
          <line
            x1="4"
            y1="13"
            x2="44"
            y2="13"
            stroke={color}
            strokeWidth={size === 'lg' || size === 'xl' ? 5 : size === 'sm' ? 3 : 4}
            strokeLinecap="round"
            markerEnd={`url(#${markerId})`}
          />
        </svg>
      );
    } else if (ind.type === 'rect') {
      const isFilled = ind.fillMode === 'filled';
      const w = size === 'sm' ? 70 : size === 'lg' ? 150 : size === 'xl' ? 200 : 110;
      const h = size === 'sm' ? 36 : size === 'lg' ? 75 : size === 'xl' ? 100 : 54;
      elemContent = (
        <div
          style={{
            width: `${w}px`,
            height: `${h}px`,
            border: `3px solid ${color}`,
            backgroundColor: isFilled ? (ind.bgColor || color) : 'transparent',
            opacity,
            borderRadius: '8px',
            boxShadow: glowStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: ind.textColor || (isFilled ? '#ffffff' : color),
            fontFamily: ind.fontFamily || 'inherit',
            fontSize: '0.75rem',
            fontWeight: 800,
            padding: '2px 4px',
            textAlign: 'center',
          }}
        >
          {ind.label || ''}
        </div>
      );
    } else if (ind.type === 'circle') {
      const isFilled = ind.fillMode === 'filled';
      const d = size === 'sm' ? 36 : size === 'lg' ? 72 : size === 'xl' ? 96 : 52;
      elemContent = (
        <div
          style={{
            width: `${d}px`,
            height: `${d}px`,
            borderRadius: '50%',
            border: `3px solid ${color}`,
            backgroundColor: isFilled ? (ind.bgColor || color) : 'transparent',
            opacity,
            boxShadow: glowStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: ind.textColor || (isFilled ? '#ffffff' : color),
            fontFamily: ind.fontFamily || 'inherit',
            fontSize: size === 'sm' ? '0.75rem' : '0.9rem',
            fontWeight: 900,
          }}
        >
          {ind.label || ''}
        </div>
      );
    } else if (ind.type === 'text') {
      elemContent = (
        <div
          style={{
            backgroundColor: ind.bgColor || 'rgba(15, 23, 42, 0.88)',
            color: ind.textColor || ind.color || '#ffffff',
            border: `1.5px solid ${color}`,
            fontFamily: ind.fontFamily || 'inherit',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: size === 'sm' ? '0.75rem' : size === 'lg' ? '1.05rem' : size === 'xl' ? '1.25rem' : '0.86rem',
            fontWeight: 700,
            opacity,
            boxShadow: glowStyle || '0 4px 12px rgba(0,0,0,0.5)',
            maxWidth: '280px',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.3,
          }}
        >
          {ind.label || 'Texto Informativo'}
        </div>
      );
    } else if (ind.type === 'badge') {
      elemContent = (
        <div
          style={{
            backgroundColor: color,
            color: ind.textColor || '#ffffff',
            fontFamily: ind.fontFamily || 'inherit',
            padding: size === 'sm' ? '2px 8px' : size === 'lg' ? '5px 14px' : '3px 10px',
            borderRadius: '999px',
            fontSize: size === 'sm' ? '0.7rem' : size === 'lg' ? '0.9rem' : '0.78rem',
            fontWeight: 800,
            opacity,
            boxShadow: glowStyle || '0 4px 10px rgba(0,0,0,0.4)',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          {ind.label || 'Atenção'}
        </div>
      );
    } else if (ind.type === 'icon') {
      const sz = size === 'sm' ? 20 : size === 'lg' ? 36 : size === 'xl' ? 48 : 28;
      elemContent = (
        <div
          style={{
            opacity,
            filter: glowStyle ? `drop-shadow(${glowStyle})` : 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))',
          }}
        >
          {ind.iconName === 'target' ? (
            <Target size={sz} color={color} />
          ) : ind.iconName === 'cursor' ? (
            <MousePointer size={sz} color={color} />
          ) : ind.iconName === 'star' ? (
            <Star size={sz} color={color} fill={color} />
          ) : ind.iconName === 'check' ? (
            <Check size={sz} color={color} strokeWidth={3} />
          ) : ind.iconName === 'info' ? (
            <Info size={sz} color={color} />
          ) : ind.iconName === 'bolt' ? (
            <Zap size={sz} color={color} fill={color} />
          ) : ind.iconName === 'forbidden' ? (
            <Ban size={sz} color={color} />
          ) : ind.iconName === 'lock' ? (
            <Lock size={sz} color={color} />
          ) : (
            <AlertTriangle size={sz} color={color} fill="rgba(245, 158, 11, 0.25)" />
          )}
        </div>
      );
    } else if (ind.type === 'dropdown') {
      elemContent = (
        <details
          className="canva-interactive-dropdown"
          style={{
            borderColor: color,
            boxShadow: glowStyle,
            opacity,
            fontFamily: ind.fontFamily || 'inherit',
          }}
        >
          <summary style={{ backgroundColor: color, color: ind.textColor || '#ffffff' }}>
            <span>{ind.label || 'Opções & Instruções Fiscais'}</span>
            <ChevronDown size={14} className="dropdown-chevron-icon" />
          </summary>
          <div className="dropdown-body-content" style={{ backgroundColor: ind.bgColor || '#1e293b' }}>
            {ind.content && (
              <p style={{ color: ind.textColor || '#f1f5f9', marginBottom: '6px' }}>{ind.content}</p>
            )}
            {ind.dropdownOptions && ind.dropdownOptions.length > 0 && (
              <ul className="dropdown-options-list">
                {ind.dropdownOptions.map((opt) => (
                  <li key={opt.id} className="dropdown-opt-item">
                    <span className="dropdown-opt-bullet" style={{ backgroundColor: color }} />
                    <span style={{ color: ind.textColor || '#e2e8f0' }}>{opt.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>
      );
    } else if (ind.type === 'spotlight') {
      elemContent = (
        <div
          className="spotlight-beacon"
          style={{
            borderColor: color,
            backgroundColor: 'rgba(231, 76, 60, 0.25)',
            boxShadow: glowStyle,
            width: size === 'sm' ? '32px' : size === 'lg' ? '56px' : '44px',
            height: size === 'sm' ? '32px' : size === 'lg' ? '56px' : '44px',
          }}
        />
      );
    } else if (ind.type === 'gif' && ind.gifUrl) {
      elemContent = (
        <img
          src={ind.gifUrl}
          alt="GIF"
          style={{
            maxWidth: size === 'sm' ? '60px' : size === 'lg' ? '120px' : '88px',
            borderRadius: '8px',
            opacity,
            boxShadow: glowStyle || '0 4px 12px rgba(0,0,0,0.5)',
          }}
        />
      );
    }

    return (
      <div
        key={ind.id}
        className="canva-canvas-indicator"
        style={{
          position: 'absolute',
          left: `${ind.x}%`,
          top: `${ind.y}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: 20,
          userSelect: 'none',
        }}
      >
        {elemContent}
      </div>
    );
  };

  return (
    <article className="presentation-manual-root" id="printable-procedure">
      {/* ── BARRA FIXA DE AÇÕES DO POP (NÃO APARECE NA IMPRESSÃO) ── */}
      <div className="proc-action-bar no-print">
        {onBack && (
          <button type="button" className="btn-proc-action" onClick={onBack}>
            <ArrowLeft size={15} />
            <span>Voltar</span>
          </button>
        )}

        <div className="proc-action-center">
          <span className={`version-pill ${isV10 ? 'v10' : 'classico'}`}>
            {versionTag}
          </span>
          {procedure.isActive === false ? (
            <span className="proc-status-pill inactive" title="Procedimento Inativo">
              🚫 Inativo
            </span>
          ) : procedure.status === 'aprovado' ? (
            <span className="proc-status-pill approved" title="Procedimento Homologado e Publicado">
              ✓ Publicado
            </span>
          ) : procedure.status === 'pendente' ? (
            <span className="proc-status-pill pending" title="Aguardando homologação em Revisões">
              ⏳ Em Revisão
            </span>
          ) : procedure.status === 'ajustes_solicitados' ? (
            <span className="proc-status-pill adjustments" title="Ajustes Solicitados pelo Revisor">
              ⚠️ Ajustes Solicitados
            </span>
          ) : procedure.status === 'despublicado' ? (
            <span className="proc-status-pill unpublished" title="Procedimento Despublicado">
              📄 Despublicado
            </span>
          ) : null}
          <span className="proc-action-title">{procedure.title}</span>
          {procedure.systemPath && (
            <span className="proc-action-path">{procedure.systemPath}</span>
          )}
        </div>

        <div className="proc-action-right">
          {/* Publicar diretamente */}
          {procedure.status !== 'aprovado' && onPublish && (
            <button
              type="button"
              className="btn-proc-action primary-success"
              onClick={onPublish}
              title="Publicar procedimento diretamente"
            >
              <CheckCircle2 size={15} />
              <span>Publicar</span>
            </button>
          )}

          {/* Despublicar */}
          {procedure.status === 'aprovado' && onUnpublish && (
            <button
              type="button"
              className="btn-proc-action"
              onClick={onUnpublish}
              title="Despublicar procedimento (remover de circulação)"
            >
              <FileX size={15} />
              <span>Despublicar</span>
            </button>
          )}

          {/* Mandar para Revisão a qualquer momento */}
          {procedure.status !== 'pendente' && onSendToReview && (
            <button
              type="button"
              className="btn-proc-action"
              onClick={onSendToReview}
              title="Enviar este procedimento para homologação na tela de Revisões"
            >
              <ClipboardCheck size={15} />
              <span>Mandar p/ Revisão</span>
            </button>
          )}

          {/* Inativar / Reativar sem apagar */}
          {onToggleActive && (
            <button
              type="button"
              className={`btn-proc-action ${procedure.isActive === false ? 'reactivate' : 'inactivate'}`}
              onClick={onToggleActive}
              title={procedure.isActive === false ? 'Reativar procedimento' : 'Inativar procedimento (não apaga)'}
            >
              {procedure.isActive === false ? (
                <>
                  <Eye size={15} />
                  <span>Reativar</span>
                </>
              ) : (
                <>
                  <EyeOff size={15} />
                  <span>Inativar</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            className="btn-proc-action"
            onClick={onEdit}
            title="Editar conteúdo, passos e imagens no Canva Studio"
          >
            <Edit3 size={15} />
            <span>Editar</span>
          </button>

          <button
            type="button"
            className="btn-proc-action"
            onClick={() => setIsTimelineOpen(true)}
            title="Ver linha do tempo e histórico de alterações"
          >
            <History size={15} color="var(--red)" />
            <span>Histórico</span>
          </button>

          <button
            type="button"
            className="btn-proc-action"
            onClick={() => downloadProcedureHtml(procedure)}
            title="Baixar arquivo HTML dinâmico com animações e GIFs"
          >
            <FileDown size={15} />
            <span>HTML</span>
          </button>

          <button
            type="button"
            className="btn-proc-action primary"
            onClick={handlePrint}
            title="Imprimir ou gerar PDF oficial em A4 Paisagem"
          >
            <Printer size={15} />
            <span>Imprimir PDF</span>
          </button>

          <button
            type="button"
            className="btn-proc-action danger"
            onClick={onDelete}
            title="Apagar procedimento definitivamente"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Modal / Drawer de Histórico e Linha do Tempo */}
      <ProcedureTimelineModal
        procedure={procedure}
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
      />

      {/* Banner de Procedimento Inativo */}
      {procedure.isActive === false && (
        <div className="review-alert-banner danger no-print" style={{ margin: '16px auto', maxWidth: '1120px' }}>
          <Ban size={24} color="#ef4444" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: '0.95rem' }}>Procedimento Inativo</strong>
            <p style={{ margin: '4px 0 0 0', lineHeight: 1.45 }}>
              Este procedimento está <strong>inativado</strong>. Ele permanece salvo com todo o histórico preservado, mas não aparece nas rotinas operacionais ativas.
            </p>
          </div>
          {onToggleActive && (
            <button
              type="button"
              className="btn-banner-edit"
              onClick={onToggleActive}
              style={{ background: '#10b981', color: '#fff', borderColor: '#10b981' }}
            >
              Reativar Procedimento
            </button>
          )}
        </div>
      )}

      {/* Banner de Procedimento Despublicado */}
      {procedure.status === 'despublicado' && procedure.isActive !== false && (
        <div className="review-alert-banner warning no-print" style={{ margin: '16px auto', maxWidth: '1120px' }}>
          <FileX size={24} color="#f59e0b" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: '0.95rem' }}>Procedimento Despublicado</strong>
            <p style={{ margin: '4px 0 0 0', lineHeight: 1.45 }}>
              Este procedimento foi retirado do ar. Você pode editá-lo, enviá-lo para revisão ou publicá-lo diretamente.
            </p>
          </div>
          {onPublish && (
            <button type="button" className="btn-banner-edit" onClick={onPublish}>
              Publicar Agora
            </button>
          )}
        </div>
      )}

      {/* Banner de Revisão / Ajustes Solicitados pelo Revisor */}
      {procedure.status === 'ajustes_solicitados' && procedure.rejectionReason && (
        <div className="review-alert-banner warning no-print" style={{ margin: '16px auto', maxWidth: '1120px' }}>
          <AlertTriangle size={24} color="#f59e0b" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: '0.95rem' }}>
              Ajustes Solicitados pelo Revisor ({procedure.reviewedBy || 'Controle de Qualidade'}):
            </strong>
            <p style={{ margin: '4px 0 0 0', lineHeight: 1.45 }}>{procedure.rejectionReason}</p>
          </div>
          <button type="button" className="btn-banner-edit" onClick={onEdit}>
            Ajustar no Editor
          </button>
        </div>
      )}

      {procedure.status === 'pendente' && (
        <div className="review-alert-banner info no-print" style={{ margin: '16px auto', maxWidth: '1120px' }}>
          <Clock size={22} color="#3b82f6" style={{ flexShrink: 0 }} />
          <div>
            <strong>Procedimento em Fila de Homologação:</strong>
            <p style={{ margin: '4px 0 0 0' }}>
              Este POP está aguardando revisão oficial técnica antes de ser considerado homologado no sistema.
            </p>
          </div>
        </div>
      )}

      {/* ── 01 · SLIDE / PÁGINA 1: CAPA EDITORIAL DIGIFARMA V10 ── */}
      <section className="slide deep cover" style={{ position: 'relative' }}>
        <div className="inner">
          <div className="logo">
            <span className="a">Digi</span>
            <span className="b">farma</span>
          </div>

          <div className="v10">{versionTag}</div>

          <h1 className="display">{procedure.title}</h1>

          <p className="lead muted" style={{ marginTop: '22px' }}>
            {procedure.subtitle ||
              'Procedimento Operacional Padrão (POP) e Instrução de Trabalho do ERP Digifarma.'}
          </p>

          <div className="slogan muted">
            Digitalmente <b>fácil</b> · Homologado ISO 9001 &amp; Boas Práticas Farmacêuticas
          </div>

          {/* Faixa de 4 Números / Estatísticas do Procedimento */}
          <div className="stats">
            <div className="stat">
              <div className="n">
                {stepBlocks.length || 1}
                <small>etapas</small>
              </div>
              <div className="l muted">roteiro passo a passo documentado</div>
            </div>

            <div className="stat">
              <div className="n">
                {stepBlocks.length}
                <small>itens</small>
              </div>
              <div className="l muted">
                {completedSteps}/{stepBlocks.length} itens checados ({stepBlocks.length > 0 ? Math.round((completedSteps / stepBlocks.length) * 100) : 100}%)
              </div>
            </div>

            <div className="stat">
              <div className="n">
                100<small>%</small>
              </div>
              <div className="l muted">conformidade com regras fiscais e BPF</div>
            </div>

            <div className="stat">
              <div className="n" style={{ fontSize: 'clamp(20px, 3vw, 32px)' }}>
                {menuInfo.menuLabel}
              </div>
              <div className="l muted">módulo integrado do sistema ERP</div>
            </div>
          </div>
        </div>

        {/* Indicadores Visuais da Capa */}
        {getSlideIndicators(0).map(renderIndicatorViewItem)}
      </section>

      {/* ── 02 · ETAPAS OPERACIONAIS FORMATADAS EM SLIDES ── */}
      {stepBlocks.map((step, idx) => {
        const stepNum = String(idx + 1).padStart(2, '0');
        // Imagem associada a este passo (ou imagem correspondente pelo índice)
        const associatedImg = imageBlocks[idx] || (idx === 0 && imageBlocks.length > 0 ? imageBlocks[0] : null);

        return (
          <section key={step.id} className="slide light step-slide" data-title={`Etapa ${stepNum}`}>
            <div className="inner">
              <p className="eyebrow">
                <span className="num">{stepNum}</span>
                Etapa Operacional
              </p>

              <h2 className="head">{step.title}</h2>

              <p className="lead muted">{step.instruction}</p>

              {/* Layout Dividido: Instruções + Benefícios à esquerda, Screenshot à direita */}
              <div className="feature-split">
                <div className="feature-list">
                  {/* Resultado Esperado */}
                  {step.expectedResult && (
                    <div className="fitem">
                      <div className="fico">
                        <CheckCircle2 size={20} />
                      </div>
                      <div className="ftxt">
                        <h4>Resultado Esperado</h4>
                        <p>
                          {step.expectedResult} <b>Validado no ERP.</b>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Dica Operacional */}
                  {step.tips && (
                    <div className="fitem">
                      <div className="fico">
                        <Lightbulb size={20} />
                      </div>
                      <div className="ftxt">
                        <h4>Dica de Agilidade</h4>
                        <p>
                          {step.tips} <b>Menos cliques.</b>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Alerta de Atenção */}
                  {step.warnings && (
                    <div className="fitem">
                      <div className="fico" style={{ backgroundColor: 'rgba(245, 158, 11, 0.16)', color: '#d97706' }}>
                        <AlertTriangle size={20} />
                      </div>
                      <div className="ftxt">
                        <h4 style={{ color: '#d97706' }}>Ponto Crítico</h4>
                        <p>{step.warnings}</p>
                      </div>
                    </div>
                  )}

                  {/* Checklist Interativo do Passo */}
                  <div className="step-interactive-check no-print">
                    <label className="step-check-label">
                      <input
                        type="checkbox"
                        checked={step.completed || false}
                        onChange={(e) => onUpdateStepCompletion(step.id, e.target.checked)}
                      />
                      <span>Marcar esta etapa como executada e conferida</span>
                    </label>
                  </div>
                </div>

                {/* Captura de Tela no Padrão Shotframe com Glow da Apresentação */}
                <div className="shotframe">
                  <div className="glow" />
                  <span className="themetag">Tela Real do Digifarma</span>
                  <div
                    className="frame"
                    onClick={() => {
                      if (associatedImg?.url) {
                        onOpenImageLightbox(associatedImg.url, associatedImg.caption || step.title);
                      }
                    }}
                    title="Clique para ampliar tela"
                  >
                    {associatedImg?.url ? (
                      <img src={associatedImg.url} alt={associatedImg.caption || step.title} />
                    ) : (
                      <div className="frame-placeholder">
                        <ZoomIn size={32} color="var(--red)" />
                        <span>Interface do ERP vinculada a esta etapa</span>
                      </div>
                    )}

                    {/* Indicadores Visuais da Etapa, Formas, Cores e Mãozinha */}
                    {getSlideIndicators(idx + 1).map(renderIndicatorViewItem)}
                  </div>
                  {associatedImg?.caption && (
                    <div className="shotframe-caption-text">{associatedImg.caption}</div>
                  )}
                </div>
              </div>

              {/* Antes / Depois quando houver contexto histórico */}
              {isV10 && idx === 0 && (
                <div className="ba no-print">
                  <div className="col old">
                    <span className="tag">Digifarma Clássico</span>
                    <ul>
                      <li>Menus fixos e múltiplos cliques manuais</li>
                      <li>Sem pré-validação automática em tempo real</li>
                      <li>Consultas isoladas em janelas cinzas</li>
                    </ul>
                  </div>
                  <div className="col new">
                    <span className="tag">Digifarma V10</span>
                    <ul>
                      <li>Fluxo inteligente integrado em tela única</li>
                      <li>IA assistiva e preenchimento de campos instantâneo</li>
                      <li>Rastreabilidade visual e modo escuro nativo</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </section>
        );
      })}

      {/* ── 03 · ALERTAS E BOAS PRÁTICAS ADICIONAIS ── */}
      {calloutBlocks.length > 0 && (
        <section className="slide light" data-title="Observações Importantes" style={{ position: 'relative' }}>
          <div className="inner">
            <p className="eyebrow">
              <span className="num">BPF</span>
              Diretrizes &amp; Recomendações
            </p>
            <h2 className="head">Orientações de Segurança</h2>
            <div className="grid g2">
              {calloutBlocks.map((c) => (
                <div key={c.id} className="card">
                  <div className="ico">
                    <Info size={22} />
                  </div>
                  <h3>{c.title}</h3>
                  <p>{c.text}</p>
                  <span className="benefit">
                    Conformidade: <b>Boas Práticas Farmacêuticas</b>
                  </span>
                </div>
              ))}
            </div>
          </div>
          {getSlideIndicators(stepBlocks.length + 1).map(renderIndicatorViewItem)}
        </section>
      )}

      {/* ── 04 · CHECKLIST FINAL DE AUDITORIA & QUALIDADE ── */}
      <section className="slide light" data-title="Checklist de Validação" style={{ position: 'relative' }}>
        <div className="inner">
          <p className="eyebrow">
            <span className="num">CHECKLIST</span>
            Auditoria Operacional
          </p>
          <h2 className="head">Critérios de Homologação</h2>
          <p className="lead muted">
            Confirme que todas as etapas foram concluídas em conformidade antes de liberar a rotina.
          </p>

          <div className="why">
            {stepBlocks.map((s, i) => (
              <div key={s.id} className="row">
                <div className="ck">✓</div>
                <div>
                  <b>
                    Etapa {String(i + 1).padStart(2, '0')}: {s.title}
                  </b>
                  <span>
                    {s.expectedResult || 'Procedimento verificado e aprovado pelo operador.'}
                  </span>
                </div>
              </div>
            ))}
            <div className="row">
              <div className="ck">✓</div>
              <div>
                <b>Rastreabilidade &amp; Registro</b>
                <span>Todos os dados e comprovantes foram devidamente arquivados no banco de dados.</span>
              </div>
            </div>
            <div className="row">
              <div className="ck">✓</div>
              <div>
                <b>Dupla Checagem Farmacêutica</b>
                <span>Valores, lotes e rotas fiscais validados conforme a legislação sanitária.</span>
              </div>
            </div>
          </div>
        </div>
        {getSlideIndicators(stepBlocks.length + 2).map(renderIndicatorViewItem)}
      </section>

      {/* ── 05 · SLIDE FINAL: ASSINATURAS E APROVAÇÃO OFICIAL BPF ── */}
      <section className="slide deep cta print-sop-signatures-block" data-title="Homologação" style={{ position: 'relative' }}>
        <div className="inner">
          <div className="logo">
            <span className="a">Digi</span>
            <span className="b">farma</span>
            <span style={{ fontSize: '.4em', fontWeight: 700, letterSpacing: '.2em', color: 'var(--red)', verticalAlign: 'middle', marginLeft: '12px' }}>
              POP HOMOLOGADO
            </span>
          </div>

          <p className="big">
            Homologação Técnica &amp;<br />
            <b>Controle de Qualidade</b>.
          </p>

          <p className="lead muted" style={{ maxWidth: '58ch' }}>
            Procedimento Operacional Padrão aprovado segundo as diretrizes de Boas Práticas Farmacêuticas (RDC ANVISA) e normas de gestão da qualidade ISO 9001.
          </p>

          {/* Bloco Oficial de Assinaturas */}
          <div className="print-signatures-grid" style={{ marginTop: '48px' }}>
            <div className="print-sign-col">
              <span className="print-sign-title">ELABORADO POR</span>
              <div className="print-sign-line" />
              <span className="print-sign-name">Farmacêutico / Analista de Processos</span>
              <span className="print-sign-role">Digifarma Sistemas</span>
            </div>

            <div className="print-sign-col">
              <span className="print-sign-title">REVISADO POR</span>
              <div className="print-sign-line" />
              <span className="print-sign-name">Garantia da Qualidade (BPF)</span>
              <span className="print-sign-role">Controle de Procedimentos</span>
            </div>

            <div className="print-sign-col">
              <span className="print-sign-title">APROVADO POR</span>
              <div className="print-sign-line" />
              <span className="print-sign-name">Leonardo Henrique B. Trevas</span>
              <span className="print-sign-role">Responsável Técnico / Gestor</span>
            </div>
          </div>

          <div className="contact" style={{ marginTop: '48px' }}>
            <b>Digifarma Sistemas LTDA</b> · Digitalmente <b style={{ color: 'var(--red)' }}>fácil</b>
          </div>
        </div>
        {getSlideIndicators(stepBlocks.length + 3).map(renderIndicatorViewItem)}
      </section>
    </article>
  );
};
