import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  MoreVertical,
  Loader2,
  Upload,
  ExternalLink,
  FileText,
  Monitor,
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
import { exportProcedurePdf } from '../lib/pdfExporter';

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
  isEditorEnabled?: boolean;
  onOpenImport?: (procedure: Procedure) => void;
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
  isEditorEnabled = false,
  onOpenImport,
}) => {
  // Disparo automático de PDF quando solicitado direto do card
  React.useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        handleDownloadPdf();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const hasImportedPdf = !!procedure.pdfFileUrl;
  const hasImportedHtml = !!procedure.htmlFileData;
  const hasImportedFiles = hasImportedPdf || hasImportedHtml;

  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'html'>(() => {
    if (procedure.activeViewFormat === 'html' && hasImportedHtml) return 'html';
    if (hasImportedPdf) return 'pdf';
    if (hasImportedHtml) return 'html';
    return procedure.formatType === 'html' ? 'html' : 'pdf';
  });

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

  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMoreMenuOpen]);

  const isV10 = procedure.systemVersion === 'v10';
  const versionTag = isV10 ? 'v10' : 'Clássico';

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (procedure.pdfFileUrl) {
      const a = document.createElement('a');
      a.href = procedure.pdfFileUrl;
      a.download = procedure.pdfFileName || `${procedure.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    try {
      setIsGeneratingPdf(true);
      await exportProcedurePdf(procedure);
    } catch (err) {
      console.error('Falha na geração direta de PDF:', err);
      handlePrint();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadHtml = () => {
    if (procedure.htmlFileData) {
      const blob = new Blob([procedure.htmlFileData], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = procedure.htmlFileName || `${procedure.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }
    downloadProcedureHtml(procedure);
  };

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
      {/* ── BARRA FIXA DE AÇÕES DO POP (MODERNA, LIMPA & DESPOLUÍDA) ── */}
      {/* ── BARRA FIXA DE AÇÕES DO POP (ORGANIZADA, LIMPA & MINIMALISTA) ── */}
      <div className="proc-action-bar-clean no-print">
        {/* Linha 1: Navegação de Retorno, Breadcrumb e Status */}
        <div className="proc-bar-top-row">
          <div className="proc-bar-nav-left">
            {onBack && (
              <button
                type="button"
                className="btn-proc-back"
                onClick={onBack}
                title="Voltar para a listagem"
              >
                <ArrowLeft size={13} />
                <span>Voltar</span>
              </button>
            )}

            <div className="proc-bar-breadcrumbs">
              <span className={`version-pill-compact ${isV10 ? 'v10' : 'classico'}`}>
                {versionTag}
              </span>
              <span className="crumb-sep">/</span>
              <span className="proc-breadcrumb-path" title={procedure.systemPath || procedure.category}>
                {procedure.systemPath
                  ? procedure.systemPath.replace('Digifarma V10', 'v10').replace('Digifarma Clássico', 'Clássico')
                  : procedure.category || 'Módulo'}
              </span>
            </div>
          </div>

          <div className="proc-bar-status-right">
            {procedure.isActive === false ? (
              <span className="proc-status-pill-clean inactive">🚫 Inativo</span>
            ) : procedure.status === 'aprovado' || !procedure.status ? (
              <span className="proc-status-pill-clean approved">
                ✓ Liberado por {procedure.reviewedBy || procedure.author || 'Qualidade Digifarma'}
              </span>
            ) : procedure.status === 'pendente' ? (
              <span className="proc-status-pill-clean pending">⏳ Em Revisão</span>
            ) : procedure.status === 'ajustes_solicitados' ? (
              <span className="proc-status-pill-clean adjustments">⚠️ Ajustes Solicitados</span>
            ) : procedure.status === 'despublicado' ? (
              <span className="proc-status-pill-clean unpublished">📄 Despublicado</span>
            ) : null}
          </div>
        </div>

        {/* Linha 2: Título do Procedimento à Esquerda e Ações Minimalistas à Direita */}
        <div className="proc-bar-main-row">
          <div className="proc-bar-title-block">
            <h1 className="proc-action-heading-title" title={procedure.title}>
              {procedure.title}
            </h1>
          </div>

          {/* Ações Primárias Minimalistas */}
          <div className="proc-action-right-group">
            {/* Seletor de Formato Discreto (Se ambos existirem) */}
            {(hasImportedPdf && hasImportedHtml) && (
              <div className="proc-format-segmented-pill">
                <button
                  type="button"
                  className={`format-seg-btn ${selectedFormat === 'pdf' ? 'active' : ''}`}
                  onClick={() => setSelectedFormat('pdf')}
                  title="Visualizar documento em formato PDF"
                >
                  <FileText size={12} />
                  <span>PDF</span>
                </button>
                <button
                  type="button"
                  className={`format-seg-btn ${selectedFormat === 'html' ? 'active' : ''}`}
                  onClick={() => setSelectedFormat('html')}
                  title="Visualizar documento em formato HTML"
                >
                  <Monitor size={12} />
                  <span>HTML</span>
                </button>
              </div>
            )}

            {/* Botão de Download Minimalista */}
            {selectedFormat === 'html' && hasImportedHtml ? (
              <button
                type="button"
                className="btn-proc-action"
                onClick={handleDownloadHtml}
                title="Baixar Manual HTML"
              >
                <FileDown size={13} />
                <span>Baixar HTML</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn-proc-action"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                title="Baixar Documento PDF Oficial"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 size={13} className="spin-animate" />
                    <span>Baixando...</span>
                  </>
                ) : (
                  <>
                    <FileDown size={13} />
                    <span>Baixar PDF</span>
                  </>
                )}
              </button>
            )}

            {/* Botão de Anexar / Importar POP (Minimalista) */}
            {onOpenImport && (
              <button
                type="button"
                className="btn-proc-action"
                onClick={() => onOpenImport(procedure)}
                title="Anexar ou atualizar arquivos PDF e HTML deste procedimento"
              >
                <Upload size={13} />
                <span>Anexar Arquivo</span>
              </button>
            )}

            {/* Botão de Editar (Minimalista) */}
            {isEditorEnabled && (
              <button
                type="button"
                className="btn-proc-action"
                onClick={onEdit}
                title="Editar procedimento no Studio Digifarma"
              >
                <Edit3 size={13} />
                <span>Editar</span>
              </button>
            )}

            {/* Dropdown Menu com Mais Opções */}
            <div className="proc-more-menu-container" ref={moreMenuRef}>
              <button
                type="button"
                className={`btn-proc-more-trigger ${isMoreMenuOpen ? 'open' : ''}`}
                onClick={() => setIsMoreMenuOpen((v) => !v)}
                title="Mais opções do procedimento"
                aria-label="Mais opções"
              >
                <MoreVertical size={15} />
              </button>

            {isMoreMenuOpen && (
              <div className="proc-more-menu-popover">
                {procedure.status !== 'aprovado' && onPublish && (
                  <button
                    type="button"
                    className="proc-menu-item success"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      onPublish();
                    }}
                  >
                    <CheckCircle2 size={15} color="#10b981" />
                    <span>Publicar Oficialmente</span>
                  </button>
                )}

                {procedure.status === 'aprovado' && onUnpublish && (
                  <button
                    type="button"
                    className="proc-menu-item"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      onUnpublish();
                    }}
                  >
                    <FileX size={15} />
                    <span>Despublicar (Tirar do Ar)</span>
                  </button>
                )}

                {procedure.status !== 'pendente' && onSendToReview && (
                  <button
                    type="button"
                    className="proc-menu-item"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      onSendToReview();
                    }}
                  >
                    <ClipboardCheck size={15} />
                    <span>Mandar p/ Revisão</span>
                  </button>
                )}

                {onToggleActive && (
                  <button
                    type="button"
                    className="proc-menu-item"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      onToggleActive();
                    }}
                  >
                    {procedure.isActive === false ? (
                      <>
                        <Eye size={15} color="#10b981" />
                        <span>Reativar Procedimento</span>
                      </>
                    ) : (
                      <>
                        <EyeOff size={15} color="#ef4444" />
                        <span>Inativar (Não Apaga)</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  className="proc-menu-item"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    handlePrint();
                  }}
                  title="Abrir caixa de diálogo de impressão do navegador"
                >
                  <Printer size={15} />
                  <span>Imprimir no Navegador (Ctrl+P)</span>
                </button>

                <button
                  type="button"
                  className="proc-menu-item"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    downloadProcedureHtml(procedure);
                  }}
                  title="Baixar arquivo HTML individual dinâmico"
                >
                  <FileDown size={15} />
                  <span>Baixar Arquivo HTML</span>
                </button>

                <button
                  type="button"
                  className="proc-menu-item"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    setIsTimelineOpen(true);
                  }}
                >
                  <History size={15} />
                  <span>Linha do Tempo / Histórico</span>
                </button>

                {onDelete && (
                  <>
                    <div className="proc-menu-divider" />
                    <button
                      type="button"
                      className="proc-menu-item danger"
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        onDelete();
                      }}
                    >
                      <Trash2 size={15} color="#ef4444" />
                      <span>Excluir Definitivamente</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
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



      {/* ── VISUALIZADOR REPOSITÓRIO: ARQUIVO PDF IMPORTADO ── */}
      {selectedFormat === 'pdf' && procedure.pdfFileUrl && (
        <div className="repository-viewer-box no-print" style={{ maxWidth: '1120px', width: '100%', margin: '0 auto 24px auto' }}>
          <div
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderBottom: 'none',
              borderRadius: '14px 14px 0 0',
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--red)" />
              <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                {procedure.pdfFileName || `${procedure.title}.pdf`}
              </strong>
              {procedure.pdfFileSize && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ({(procedure.pdfFileSize / (1024 * 1024)).toFixed(2)} MB)
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <a
                href={procedure.pdfFileUrl}
                download={procedure.pdfFileName || `${procedure.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`}
                className="btn-proc-action"
                style={{ textDecoration: 'none' }}
                title="Baixar arquivo PDF"
              >
                <FileDown size={13} />
                <span>Baixar PDF</span>
              </a>

              <a
                href={procedure.pdfFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-proc-action"
                style={{ textDecoration: 'none' }}
                title="Abrir PDF em nova aba do navegador"
              >
                <ExternalLink size={13} />
                <span>Abrir em Nova Aba</span>
              </a>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '0 0 14px 14px',
              overflow: 'hidden',
              height: '820px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
            }}
          >
            <iframe
              src={procedure.pdfFileUrl}
              title={procedure.title}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block',
              }}
            />
          </div>
        </div>
      )}

      {/* ── VISUALIZADOR REPOSITÓRIO: ARQUIVO HTML IMPORTADO ── */}
      {selectedFormat === 'html' && procedure.htmlFileData && (
        <div className="repository-viewer-box no-print" style={{ maxWidth: '1120px', width: '100%', margin: '0 auto 24px auto' }}>
          <div
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderBottom: 'none',
              borderRadius: '14px 14px 0 0',
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Monitor size={18} color="var(--red)" />
              <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                {procedure.htmlFileName || `${procedure.title}.html`}
              </strong>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleDownloadHtml}
                className="btn-proc-action"
                title="Baixar arquivo HTML"
              >
                <FileDown size={13} />
                <span>Baixar HTML</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const w = window.open('', '_blank');
                  if (w && procedure.htmlFileData) {
                    w.document.write(procedure.htmlFileData);
                    w.document.close();
                  }
                }}
                className="btn-proc-action"
                title="Abrir HTML em tela cheia / nova aba"
              >
                <ExternalLink size={13} />
                <span>Tela Cheia / Nova Aba</span>
              </button>
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--border)',
              borderRadius: '0 0 14px 14px',
              overflow: 'hidden',
              height: '820px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
            }}
          >
            <iframe
              srcDoc={procedure.htmlFileData}
              title={procedure.title}
              sandbox="allow-scripts allow-same-origin allow-popups allow-modals"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block',
              }}
            />
          </div>
        </div>
      )}

      {/* ── 01 · SLIDE / PÁGINA 1: CAPA EDITORIAL DIGIFARMA V10 (Exibido quando não há arquivo importado ativo) ── */}
      {(!hasImportedFiles || (!procedure.pdfFileUrl && selectedFormat === 'pdf') || (!procedure.htmlFileData && selectedFormat === 'html')) && (
        <>
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
            {procedure.signatures?.slogan || 'Digitalmente fácil · Homologado ISO 9001 & Boas Práticas Farmacêuticas'}
          </div>

          {/* Faixa de Números / Estatísticas do Procedimento (Dinâmica & Customizável) */}
          {procedure.coverStats !== undefined ? (
            procedure.coverStats.length > 0 && (
              <div className="stats">
                {procedure.coverStats.map((st) => (
                  <div key={st.id} className="stat">
                    <div className="n">
                      {st.number}
                      {st.unit ? <small>{st.unit}</small> : null}
                    </div>
                    <div className="l muted">{st.label}</div>
                  </div>
                ))}
              </div>
            )
          ) : (
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

              <div className="stat">
                <div className="n" style={{ fontSize: 'clamp(18px, 2.5vw, 24px)' }}>
                  {procedure.author || 'Farmacêutico Responsável'}
                </div>
                <div className="l muted">responsável técnico / elaboração</div>
              </div>
            </div>
          )}
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
                  {step.operationalItems && step.operationalItems.length > 0 ? (
                    step.operationalItems.map((op) => (
                      <div key={op.id} className={`fitem ${op.type === 'warning' ? 'warning' : ''}`}>
                        <div
                          className="fico"
                          style={
                            op.type === 'warning'
                              ? { backgroundColor: 'rgba(245, 158, 11, 0.16)', color: '#d97706' }
                              : undefined
                          }
                        >
                          {op.icon ? (
                            <span style={{ fontSize: '1.05rem' }}>{op.icon}</span>
                          ) : (
                            <CheckCircle2 size={20} />
                          )}
                        </div>
                        <div className="ftxt">
                          <h4 style={op.type === 'warning' ? { color: '#d97706' } : undefined}>
                            {op.title}
                          </h4>
                          <p>{op.text || (op as any).content || ''}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
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
                    </>
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
                <div
                  className="shotframe"
                  style={
                    step.imageWidth
                      ? { flex: `0 0 ${step.imageWidth}`, maxWidth: step.imageWidth, width: step.imageWidth }
                      : undefined
                  }
                >
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
            {procedure.checklistItems && procedure.checklistItems.length > 0 ? (
              procedure.checklistItems.map((chk, i) => (
                <div key={chk.id || i} className="row">
                  <div className="ck">✓</div>
                  <div>
                    <b>{chk.title}</b>
                    {chk.note && <span>{chk.note}</span>}
                  </div>
                </div>
              ))
            ) : (
              <>
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
              </>
            )}
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

          {!procedure.signatures?.hideBadge && (
            <div className="v10-badge" style={{ marginBottom: '12px', display: 'inline-block' }}>
              {procedure.signatures?.badge || 'HOMOLOGAÇÃO OFICIAL'}
            </div>
          )}

          {!procedure.signatures?.hideTitle && (
            <h1 className="display" style={{ fontSize: '32px', marginBottom: '8px' }}>
              {procedure.signatures?.title || 'Controle da Qualidade & BPF'}
            </h1>
          )}

          {!procedure.signatures?.hideSubtitle && (
            <p className="lead muted" style={{ maxWidth: '58ch' }}>
              {procedure.signatures?.subtitle || 'Procedimento Operacional Padrão aprovado segundo as diretrizes de Boas Práticas Farmacêuticas (RDC ANVISA) e normas de gestão da qualidade ISO 9001.'}
            </p>
          )}

          {!procedure.signatures?.hideDate && procedure.signatures?.validationDate && (
            <p className="lead muted" style={{ fontSize: '0.82rem', marginTop: '6px', color: '#10b981' }}>
              {procedure.signatures.validationDate}
            </p>
          )}

          {/* Bloco Oficial de Assinaturas Dinâmico */}
          <div
            className="print-signatures-grid"
            style={{
              marginTop: '40px',
              gridTemplateColumns: `repeat(${procedure.signatures?.columns?.length || 3}, 1fr)`
            }}
          >
            {(procedure.signatures?.columns || [
              {
                id: 'col-1',
                title: procedure.signatures?.elaboratedByTitle || 'ELABORADO POR',
                name: procedure.signatures?.elaboratedByName || procedure.author || 'Farmacêutico / Analista de Processos',
                role: procedure.signatures?.elaboratedByRole || 'Digifarma Sistemas',
              },
              {
                id: 'col-2',
                title: procedure.signatures?.reviewedByTitle || 'REVISADO POR',
                name: procedure.signatures?.reviewedByName || procedure.reviewedBy || 'Garantia da Qualidade (BPF)',
                role: procedure.signatures?.reviewedByRole || 'Controle de Procedimentos',
              },
              {
                id: 'col-3',
                title: procedure.signatures?.approvedByTitle || 'APROVADO POR',
                name: procedure.signatures?.approvedByName || 'Leonardo Henrique B. Trevas',
                role: procedure.signatures?.approvedByRole || 'Responsável Técnico / Gestor',
              },
            ]).map((col) => (
              <div key={col.id} className="print-sign-col">
                <span className="print-sign-title">{col.title}</span>
                <div className="print-sign-line" />
                <span className="print-sign-name">{col.name}</span>
                <span className="print-sign-role">{col.role}</span>
                {col.date && (
                  <span className="print-sign-date" style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px', textAlign: 'center' }}>
                    {col.date}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="contact" style={{ marginTop: '48px' }}>
            <b>{procedure.signatures?.companyName || 'Digifarma Sistemas LTDA'}</b> · {procedure.signatures?.slogan || <>Digitalmente <b style={{ color: 'var(--red)' }}>fácil</b></>}
          </div>
        </div>
        {getSlideIndicators(stepBlocks.length + 3).map(renderIndicatorViewItem)}
      </section>
      </>
      )}
    </article>
  );
};
