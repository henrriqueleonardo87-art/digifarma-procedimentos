import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  Minus,
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Printer,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Info,
  Image as ImageIcon,
  Palette,
  FileDown,
  ClipboardPaste,
  Circle,
  Square,
  Type,
  MousePointer,
  Star,
  Target,
  AlertTriangle,
  Zap,
  Ban,
  Lock,
  ChevronDown,
  Check,
  ArrowRight,
  Sliders,
  FileText,
  CheckSquare,
  Award,
  Layers,
} from 'lucide-react';
import type {
  Procedure,
  ProcedureBlock,
  StepBlock,
  ImageBlock,
  CalloutBlock,
  SystemMenu,
  SystemVersion,
  ProcedureHistoryItem,
  SlideIndicator,
  SlideConfig,
  IndicatorDirection,
  IndicatorFillMode,
  IndicatorGlow,
  IndicatorSize,
  IndicatorIconName,
  ProcedureStatus,
  ProcedureSignatures,
} from '../types/procedure';
import type { AppUser } from '../types/auth';
import { uploadProcedureImage } from '../lib/supabase';
import { downloadProcedureHtml } from '../lib/htmlExporter';
import { exportProcedurePdf } from '../lib/pdfExporter';

interface ProcedureEditorProps {
  initialProcedure?: Procedure | null;
  menus: SystemMenu[];
  activeVersion: SystemVersion;
  onSave: (procedure: Procedure) => Promise<void> | void;
  onCancel: () => void;
  currentUser?: AppUser | null;
}

// ─────────────────────────────────────────────────────────────
// COMPONENTES VETORIAIS DE DESIGN (MÃOZINHA, SETA, ÍCONES)
// ─────────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number = 0.25): string {
  if (!hex || !hex.startsWith('#')) return `rgba(231, 76, 60, ${alpha})`;
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 231;
  const g = parseInt(clean.substring(2, 4), 16) || 76;
  const b = parseInt(clean.substring(4, 6), 16) || 60;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const SvgHand: React.FC<{
  color?: string;
  direction?: IndicatorDirection;
  size?: IndicatorSize;
  glow?: IndicatorGlow;
}> = ({ color = '#ef4444', direction = 'up', size = 'md', glow = 'none' }) => {
  const rotation =
    direction === 'right'
      ? 90
      : direction === 'down'
      ? 180
      : direction === 'left'
      ? 270
      : direction === 'down-right'
      ? 135
      : direction === 'up-right'
      ? 45
      : 0;

  const scale = size === 'sm' ? 0.75 : size === 'lg' ? 1.35 : size === 'xl' ? 1.75 : 1.0;
  const glowFilter =
    glow === 'neon'
      ? `drop-shadow(0 0 10px ${color}) drop-shadow(0 0 4px #ffffff)`
      : glow === 'soft'
      ? `drop-shadow(0 0 6px ${color})`
      : 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))';

  return (
    <svg
      width={40 * scale}
      height={40 * scale}
      viewBox="0 0 24 24"
      fill={color}
      stroke="#ffffff"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: `rotate(${rotation}deg)`,
        filter: glowFilter,
        transition: 'transform 0.15s ease',
        display: 'block',
      }}
    >
      <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v3" />
      <path d="M14 9V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7" />
      <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </svg>
  );
};

const SvgArrow: React.FC<{
  color?: string;
  direction?: IndicatorDirection;
  size?: IndicatorSize;
  glow?: IndicatorGlow;
}> = ({ color = '#ef4444', direction = 'right', size = 'md', glow = 'none' }) => {
  const rotation =
    direction === 'down'
      ? 90
      : direction === 'left'
      ? 180
      : direction === 'up'
      ? 270
      : direction === 'down-right'
      ? 135
      : direction === 'up-right'
      ? -45
      : 0;

  const scale = size === 'sm' ? 0.75 : size === 'lg' ? 1.35 : size === 'xl' ? 1.75 : 1.0;
  const glowFilter =
    glow === 'neon'
      ? `drop-shadow(0 0 10px ${color}) drop-shadow(0 0 3px #ffffff)`
      : glow === 'soft'
      ? `drop-shadow(0 0 6px ${color})`
      : 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))';

  const markerId = `ah-${color.replace('#', '')}-${size}`;

  return (
    <svg
      width={54 * scale}
      height={28 * scale}
      viewBox="0 0 54 28"
      style={{
        transform: `rotate(${rotation}deg)`,
        filter: glowFilter,
        display: 'block',
      }}
    >
      <defs>
        <marker
          id={markerId}
          markerWidth="7"
          markerHeight="7"
          refX="6"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 7 3.5, 0 7" fill={color} />
        </marker>
      </defs>
      <line
        x1="4"
        y1="14"
        x2="46"
        y2="14"
        stroke={color}
        strokeWidth={size === 'lg' || size === 'xl' ? 5 : size === 'sm' ? 3 : 4}
        strokeLinecap="round"
        markerEnd={`url(#${markerId})`}
      />
    </svg>
  );
};

const renderIconSymbol = (iconName: IndicatorIconName = 'alert', color = '#ef4444', size = 'md') => {
  const sz = size === 'sm' ? 20 : size === 'lg' ? 36 : size === 'xl' ? 48 : 28;
  switch (iconName) {
    case 'target':
      return <Target size={sz} color={color} />;
    case 'cursor':
      return <MousePointer size={sz} color={color} />;
    case 'star':
      return <Star size={sz} color={color} fill={color} />;
    case 'check':
      return <Check size={sz} color={color} strokeWidth={3} />;
    case 'info':
      return <Info size={sz} color={color} />;
    case 'bolt':
      return <Zap size={sz} color={color} fill={color} />;
    case 'forbidden':
      return <Ban size={sz} color={color} />;
    case 'lock':
      return <Lock size={sz} color={color} />;
    case 'alert':
    default:
      return <AlertTriangle size={sz} color={color} fill="rgba(245, 158, 11, 0.25)" />;
  }
};

export const ProcedureEditor: React.FC<ProcedureEditorProps> = ({
  initialProcedure,
  menus,
  activeVersion,
  onSave,
  onCancel,
  currentUser,
}) => {
  // Modo de visualização: 'canva' (Studio Visual com Design) ou 'pdf-preview' (Editor de Folhas A4 Reais)
  const [editorMode, setEditorMode] = useState<'canva' | 'pdf-preview'>(
    initialProcedure?.formatType === 'pdf' ? 'pdf-preview' : 'canva'
  );

  // Metadados Gerais
  const [title, setTitle] = useState(initialProcedure?.title || 'Novo Procedimento Operacional Padrão');
  const [subtitle, setSubtitle] = useState(
    initialProcedure?.subtitle || 'Procedimento Operacional Padrão e Roteiro de Treinamento do Digifarma ERP'
  );
  const [systemPath] = useState(
    initialProcedure?.systemPath || 'Digifarma V10 ➔ Treinamento Operacional'
  );
  const [systemVersion, setSystemVersion] = useState<SystemVersion | 'ambos'>(
    initialProcedure?.systemVersion || activeVersion
  );
  const [menuId, setMenuId] = useState(initialProcedure?.menuId || (menus[0]?.id || 'cadastros'));
  const [submenuId] = useState(initialProcedure?.submenuId || '');
  const [author, setAuthor] = useState(
    initialProcedure?.author || currentUser?.name || currentUser?.username || 'Leonardo Trevas'
  );

  // Etapas Operacionais (Passo a Passo)
  const initialSteps = initialProcedure?.blocks?.filter((b): b is StepBlock => b.type === 'step') || [];
  const [steps, setSteps] = useState<StepBlock[]>(
    initialSteps.length > 0
      ? initialSteps
      : [
          {
            id: `step-${Date.now()}-1`,
            type: 'step',
            title: 'Acesso à Rotina no Digifarma',
            content: 'Navegue pelo menu lateral e selecione o módulo correspondente.',
            instruction: 'Acesse o sistema com suas credenciais homologadas e abra o formulário principal.',
            expectedResult: 'Janela da rotina carregada em tela única com campos desbloqueados.',
            tips: 'Use a tecla F2 para busca rápida de registros.',
            warnings: 'Confirme se o turno do caixa ou o lote do produto estão abertos antes de continuar.',
            completed: false,
          },
        ]
  );

  // Imagens associadas às etapas (armazenadas por step id ou index)
  const initialImages = initialProcedure?.blocks?.filter((b): b is ImageBlock => b.type === 'image') || [];
  const [images, setImages] = useState<Record<number, string>>(
    initialImages.reduce((acc, img, idx) => {
      acc[idx] = img.url;
      return acc;
    }, {} as Record<number, string>)
  );

  // Alertas e Recomendações BPF
  const initialCallouts = initialProcedure?.blocks?.filter((b): b is CalloutBlock => b.type === 'callout') || [];
  const [callouts, setCallouts] = useState<CalloutBlock[]>(
    initialCallouts.length > 0
      ? initialCallouts
      : [
          {
            id: `callout-${Date.now()}-1`,
            type: 'callout',
            calloutType: 'warning',
            title: 'Rastreabilidade e Segurança Sanitária',
            content: 'Todas as operações que envolvam medicamentos controlados devem ser auditadas pelo Farmacêutico Responsável.',
          },
        ]
  );

  // ─────────────────────────────────────────────────────────────
  // GESTÃO DINÂMICA DE PÁGINAS / SLIDES DO PROCEDIMENTO
  // ─────────────────────────────────────────────────────────────
  const initializeSlides = (): SlideConfig[] => {
    if (initialProcedure?.slidesConfig && initialProcedure.slidesConfig.length > 0) {
      return initialProcedure.slidesConfig.map((s, idx) => ({
        ...s,
        id: s.id || `slide-${s.slideType || 'page'}-${idx}`,
        indicators: s.indicators || [],
      }));
    }

    const defaultSlides: SlideConfig[] = [
      { id: 'slide-cover', slideType: 'cover', bgTheme: 'deep', indicators: [] },
    ];

    const currentStepsList = initialSteps.length > 0 ? initialSteps : [steps[0]];
    currentStepsList.forEach((_, idx) => {
      defaultSlides.push({
        id: `slide-step-${idx}`,
        slideType: 'step',
        stepIndex: idx,
        bgTheme: 'light',
        indicators: idx === 0 ? [
          {
            id: `ind-${Date.now()}-1`,
            type: 'hand',
            direction: 'up',
            color: '#ef4444',
            x: 52,
            y: 58,
            label: 'Campo Código',
            glow: 'soft',
          },
        ] : [],
      });
    });

    defaultSlides.push({ id: 'slide-bpf', slideType: 'callout', bgTheme: 'light', indicators: [] });
    defaultSlides.push({ id: 'slide-checklist', slideType: 'checklist', bgTheme: 'light', indicators: [] });
    defaultSlides.push({ id: 'slide-signatures', slideType: 'signatures', bgTheme: 'deep', indicators: [] });

    return defaultSlides;
  };

  // Assinaturas e Homologação Oficial (Editáveis em tela e impressas no PDF)
  const [signatures, setSignatures] = useState<ProcedureSignatures>(() => ({
    elaboratedByTitle: initialProcedure?.signatures?.elaboratedByTitle || 'ELABORADO POR',
    elaboratedByName: initialProcedure?.signatures?.elaboratedByName || initialProcedure?.author || author || 'Leonardo Henrique B. Trevas',
    elaboratedByRole: initialProcedure?.signatures?.elaboratedByRole || 'Digifarma Sistemas',
    reviewedByTitle: initialProcedure?.signatures?.reviewedByTitle || 'REVISADO POR',
    reviewedByName: initialProcedure?.signatures?.reviewedByName || 'Garantia da Qualidade (BPF)',
    reviewedByRole: initialProcedure?.signatures?.reviewedByRole || 'Controle de Procedimentos',
    approvedByTitle: initialProcedure?.signatures?.approvedByTitle || 'APROVADO POR',
    approvedByName: initialProcedure?.signatures?.approvedByName || 'Leonardo Henrique B. Trevas',
    approvedByRole: initialProcedure?.signatures?.approvedByRole || 'Responsável Técnico / Gestor',
    companyName: initialProcedure?.signatures?.companyName || 'Digifarma Sistemas LTDA',
    slogan: initialProcedure?.signatures?.slogan || 'Digitalmente fácil · Homologado ISO 9001 & Boas Práticas Farmacêuticas',
  }));

  const [slidesConfig, setSlidesConfig] = useState<SlideConfig[]>(initializeSlides);

  // Slide Ativo no Modo Canva (0..N-1)
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Menu popup para adicionar páginas
  const [showAddPageMenu, setShowAddPageMenu] = useState(false);

  // Indicador selecionado para edição de propriedades e arraste
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string | null>(null);

  // Feedback de Toast e Status de Salvamento
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRootRef = useRef<HTMLDivElement>(null);
  const shotframeRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Garante que activeSlideIndex esteja sempre dentro dos limites válidos
  const safeActiveSlideIndex = Math.min(Math.max(0, activeSlideIndex), Math.max(0, slidesConfig.length - 1));
  const currentSlide: SlideConfig | undefined = slidesConfig[safeActiveSlideIndex] || slidesConfig[0];

  // Identifica a etapa associada se a página for do tipo 'step'
  const currentStepIndex = currentSlide?.slideType === 'step' ? (currentSlide.stepIndex ?? 0) : 0;
  void currentStepIndex;

  // ─────────────────────────────────────────────────────────────
  // 1. SUPORTE GLOBAL A COLAR IMAGENS DA ÁREA DE TRANSFERÊNCIA (CTRL+V)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            processPastedImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [safeActiveSlideIndex, steps.length, currentSlide]);

  const processPastedImageFile = async (file: File) => {
    setUploading(true);
    showToast('Processando print screen / imagem...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const targetStepIdx = currentSlide?.slideType === 'step' ? (currentSlide.stepIndex ?? 0) : 0;
      setImages((prev) => ({ ...prev, [targetStepIdx]: dataUrl }));

      showToast(`Imagem anexada com sucesso à Etapa ${(targetStepIdx + 1).toString().padStart(2, '0')}!`);
      setUploading(false);

      // Upload assíncrono para o Supabase Storage se disponível
      try {
        const publicUrl = await uploadProcedureImage(file);
        if (publicUrl) {
          setImages((prev) => ({ ...prev, [targetStepIdx]: publicUrl }));
        }
      } catch {
        // Fallback em Base64 mantido com segurança
      }
    };
    reader.readAsDataURL(file);
  };

  const handleManualUploadClick = (stepIdx: number) => {
    if (fileInputRef.current) {
      fileInputRef.current.dataset.stepIndex = String(stepIdx);
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processPastedImageFile(file);
  };

  // ─────────────────────────────────────────────────────────────
  // 2. ATALHO DE TECLADO: DELETE E BACKSPACE PARA REMOVER ELEMENTOS
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isTyping =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.getAttribute('contenteditable') === 'true' ||
          (activeEl as HTMLElement).isContentEditable);

      if (isTyping) return;
      if (!selectedIndicatorId) return;

      // Exclusão imediata por Delete ou Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        removeIndicator(selectedIndicatorId);
        return;
      }

      // Escala rápida pelo teclado (+ / -)
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        changeIndicatorScale(selectedIndicatorId, 0.1);
        return;
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        changeIndicatorScale(selectedIndicatorId, -0.1);
        return;
      }

      // Movimentação milimétrica por setas direcionais (Shift para salto maior)
      const step = e.shiftKey ? 5 : 1;
      let dx = 0;
      let dy = 0;
      if (e.key === 'ArrowUp') dy = -step;
      else if (e.key === 'ArrowDown') dy = step;
      else if (e.key === 'ArrowLeft') dx = -step;
      else if (e.key === 'ArrowRight') dx = step;

      if (dx !== 0 || dy !== 0) {
        e.preventDefault();
        setSlidesConfig((prev) =>
          prev.map((slide, idx) =>
            idx === safeActiveSlideIndex
              ? {
                  ...slide,
                  indicators: (slide.indicators || []).map((ind) =>
                    ind.id === selectedIndicatorId
                      ? {
                          ...ind,
                          x: Math.max(1, Math.min(99, ind.x + dx)),
                          y: Math.max(1, Math.min(99, ind.y + dy)),
                        }
                      : ind
                  ),
                }
              : slide
          )
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndicatorId, safeActiveSlideIndex, slidesConfig]);

  // ─────────────────────────────────────────────────────────────
  // 3. GESTÃO DE INDICADORES, FORMAS, ARRASTE & PROPRIEDADES
  // ─────────────────────────────────────────────────────────────
  const activeSlideIndicators: SlideIndicator[] = currentSlide?.indicators || [];
  const selectedIndicator = activeSlideIndicators.find((i) => i.id === selectedIndicatorId);

  const pushIndicator = (indicator: SlideIndicator, toastMsg?: string) => {
    setSlidesConfig((prev) =>
      prev.map((slide, idx) =>
        idx === safeActiveSlideIndex
          ? {
              ...slide,
              indicators: [...(slide.indicators || []), indicator],
            }
          : slide
      )
    );
    setSelectedIndicatorId(indicator.id);
    if (toastMsg) showToast(toastMsg);
  };

  const updateSelectedIndicator = (updates: Partial<SlideIndicator>) => {
    if (!selectedIndicatorId) return;
    setSlidesConfig((prev) =>
      prev.map((slide, idx) =>
        idx === safeActiveSlideIndex
          ? {
              ...slide,
              indicators: (slide.indicators || []).map((ind) =>
                ind.id === selectedIndicatorId ? { ...ind, ...updates } : ind
              ),
            }
          : slide
      )
    );
  };

  const changeIndicatorScale = (indId: string, delta: number, slideIdx?: number) => {
    const targetIdx = typeof slideIdx === 'number' ? slideIdx : safeActiveSlideIndex;
    setSlidesConfig((prev) =>
      prev.map((slide, idx) =>
        idx === targetIdx
          ? {
              ...slide,
              indicators: (slide.indicators || []).map((ind) => {
                if (ind.id !== indId) return ind;
                const currentScale = ind.scale ?? 1.0;
                const newScale = Math.max(0.3, Math.min(3.0, Number((currentScale + delta).toFixed(2))));
                return { ...ind, scale: newScale };
              }),
            }
          : slide
      )
    );
  };

  const removeIndicator = (indId: string, slideIdx?: number) => {
    const targetIdx = typeof slideIdx === 'number' ? slideIdx : safeActiveSlideIndex;
    setSlidesConfig((prev) =>
      prev.map((slide, idx) =>
        idx === targetIdx
          ? {
              ...slide,
              indicators: (slide.indicators || []).filter((ind) => ind.id !== indId),
            }
          : slide
      )
    );
    if (selectedIndicatorId === indId) {
      setSelectedIndicatorId(null);
    }
    showToast('Elemento removido.');
  };

  // Mãozinhas
  const addPointingHand = (direction: IndicatorDirection = 'up', color: string = '#ef4444') => {
    const newId = `hand-${Date.now()}`;
    pushIndicator(
      {
        id: newId,
        type: 'hand',
        direction,
        color,
        x: 50,
        y: 50,
        size: 'md',
        glow: 'soft',
        scale: 1.0,
      },
      `Mãozinha indicadora (${direction}) adicionada à página atual!`
    );
  };

  // Setas
  const addArrow = (direction: IndicatorDirection = 'right', color: string = '#ef4444') => {
    const newId = `arrow-${Date.now()}`;
    pushIndicator(
      {
        id: newId,
        type: 'arrow',
        direction,
        color,
        x: 50,
        y: 50,
        size: 'md',
        glow: 'soft',
        scale: 1.0,
      },
      `Seta indicadora (${direction}) adicionada!`
    );
  };

  // Retângulos e Molduras
  const addRectangle = (fillMode: IndicatorFillMode = 'outline', color: string = '#ef4444') => {
    const newId = `rect-${Date.now()}`;
    pushIndicator(
      {
        id: newId,
        type: 'rect',
        fillMode,
        color,
        textColor: '#ffffff',
        x: 50,
        y: 50,
        size: 'md',
        opacity: fillMode === 'filled' ? 0.65 : 1.0,
        glow: 'soft',
        label: fillMode === 'filled' ? 'Destaque' : '',
        scale: 1.0,
      },
      fillMode === 'outline' ? 'Moldura vazada adicionada!' : 'Caixa destacada adicionada!'
    );
  };

  // Círculos e Bolinhas
  const addCircle = (fillMode: IndicatorFillMode = 'outline', color: string = '#ef4444') => {
    const newId = `circle-${Date.now()}`;
    pushIndicator(
      {
        id: newId,
        type: 'circle',
        fillMode,
        color,
        textColor: '#ffffff',
        x: 50,
        y: 50,
        size: 'md',
        opacity: fillMode === 'filled' ? 0.75 : 1.0,
        glow: 'soft',
        scale: 1.0,
      },
      fillMode === 'outline' ? 'Círculo vazado adicionado!' : 'Bolinha destacada adicionada!'
    );
  };

  // Badges
  const addBadge = (label = 'Campo Obrigatório', color = '#ef4444') => {
    const newId = `badge-${Date.now()}`;
    pushIndicator(
      {
        id: newId,
        type: 'badge',
        label,
        color,
        textColor: '#ffffff',
        fontFamily: 'Inter, sans-serif',
        x: 45,
        y: 45,
        size: 'md',
        glow: 'soft',
        scale: 1.0,
      },
      'Badge criada! Edite o texto e a cor na barra acima.'
    );
  };

  // Caixa de Texto Livre
  const addTextBox = (label = 'Instrução do Campo...', textColor = '#ffffff') => {
    const newId = `text-${Date.now()}`;
    pushIndicator(
      {
        id: newId,
        type: 'text',
        label,
        color: '#ef4444',
        textColor,
        bgColor: 'rgba(15, 23, 42, 0.88)',
        fontFamily: 'Inter, sans-serif',
        x: 50,
        y: 45,
        size: 'md',
        glow: 'soft',
        scale: 1.0,
      },
      'Caixa de texto criada! Altere fonte e cores na barra acima.'
    );
  };

  // Ícones Especiais
  const addIcon = (iconName: IndicatorIconName = 'alert', color = '#ef4444') => {
    const newId = `icon-${Date.now()}`;
    pushIndicator(
      {
        id: newId,
        type: 'icon',
        iconName,
        color,
        x: 50,
        y: 50,
        size: 'md',
        glow: 'soft',
        scale: 1.0,
      },
      `Ícone (${iconName}) adicionado!`
    );
  };

  // Menu Suspenso Interativo
  const addDropdown = (
    label = 'Instruções e Ações Fiscais',
    content = 'Selecione uma opção ou consulte as orientações abaixo:'
  ) => {
    const newId = `drop-${Date.now()}`;
    pushIndicator(
      {
        id: newId,
        type: 'dropdown',
        label,
        content,
        color: '#ef4444',
        textColor: '#ffffff',
        bgColor: '#0f172a',
        fontFamily: 'Inter, sans-serif',
        dropdownOptions: [
          { id: `opt-${Date.now()}-1`, text: '1. Gravar registro e confirmar lote' },
          { id: `opt-${Date.now()}-2`, text: '2. Consultar histórico fiscal' },
          { id: `opt-${Date.now()}-3`, text: '3. Imprimir comprovante de saída' },
        ],
        x: 50,
        y: 50,
        size: 'md',
        glow: 'soft',
        scale: 1.0,
      },
      'Menu suspenso adicionado! Adicione ou edite opções na barra acima.'
    );
  };

  // Anel Radar Sonar
  const addSpotlightBeacon = (color = '#ef4444') => {
    const newId = `spot-${Date.now()}`;
    pushIndicator(
      {
        id: newId,
        type: 'spotlight',
        color,
        x: 50,
        y: 50,
        size: 'md',
        scale: 1.0,
      },
      'Radar sonar pulsante adicionado!'
    );
  };

  // GIF Animado
  const addAnimatedGif = (gifUrl = 'https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif') => {
    const newId = `gif-${Date.now()}`;
    pushIndicator(
      {
        id: newId,
        type: 'gif',
        gifUrl,
        x: 60,
        y: 45,
        size: 'md',
        scale: 1.0,
      },
      'GIF animado anexado!'
    );
  };

  // Arraste Suave e Universal de Indicadores pelo Mouse (em qualquer slide, em Modo Canva ou PDF)
  const handleIndicatorMouseDown = (e: React.MouseEvent, indId: string, slideIdx?: number) => {
    e.stopPropagation();
    setSelectedIndicatorId(indId);

    const targetSlideIdx = typeof slideIdx === 'number' ? slideIdx : safeActiveSlideIndex;
    if (targetSlideIdx !== safeActiveSlideIndex) {
      setActiveSlideIndex(targetSlideIdx);
    }

    const targetEl = e.currentTarget as HTMLElement;
    const container = targetEl.closest('.canva-interactive-frame') ||
                      targetEl.closest('.frame') ||
                      targetEl.closest('.slide');
    if (!container) return;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = Math.max(1, Math.min(99, Math.round(((moveEvent.clientX - rect.left) / rect.width) * 100)));
      const y = Math.max(1, Math.min(99, Math.round(((moveEvent.clientY - rect.top) / rect.height) * 100)));

      setSlidesConfig((prev) =>
        prev.map((slide, idx) =>
          idx === targetSlideIdx
            ? {
                ...slide,
                indicators: (slide.indicators || []).map((ind) =>
                  ind.id === indId ? { ...ind, x, y } : ind
                ),
              }
            : slide
        )
      );
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Clique no Shotframe para Reposicionar
  const handleShotframeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    if (selectedIndicatorId) {
      updateSelectedIndicator({ x, y });
    }
  };

  // Alternar Cor / Tema do Slide Ativo (Deep vs Claro)
  const toggleSlideTheme = () => {
    setSlidesConfig((prev) =>
      prev.map((s, idx) => {
        if (idx === safeActiveSlideIndex) {
          const next = s.bgTheme === 'deep' || s.bgTheme === 'dark' ? 'light' : 'deep';
          return { ...s, bgTheme: next };
        }
        return s;
      })
    );
  };

  // ─────────────────────────────────────────────────────────────
  // 4. GESTÃO TOTAL DE PÁGINAS (REORDENAR, DELETAR, ADICIONAR QUALQUER PÁGINA)
  // ─────────────────────────────────────────────────────────────
  const movePage = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= slidesConfig.length) return;
    const updated = [...slidesConfig];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setSlidesConfig(updated);
    setActiveSlideIndex(toIdx);
    showToast('Página reordenada.');
  };

  const deletePage = (idxToDelete: number) => {
    if (slidesConfig.length <= 1) {
      showToast('O documento deve conter pelo menos uma página.');
      return;
    }
    const updated = slidesConfig.filter((_, idx) => idx !== idxToDelete);
    setSlidesConfig(updated);
    if (safeActiveSlideIndex >= updated.length) {
      setActiveSlideIndex(Math.max(0, updated.length - 1));
    } else if (safeActiveSlideIndex === idxToDelete) {
      setActiveSlideIndex(Math.max(0, idxToDelete - 1));
    }
    setSelectedIndicatorId(null);
    showToast('Página excluída.');
  };

  const addPage = (slideType: SlideConfig['slideType']) => {
    setShowAddPageMenu(false);
    let stepIdx: number | undefined = undefined;

    if (slideType === 'step') {
      const nextNum = steps.length + 1;
      const newStep: StepBlock = {
        id: `step-${Date.now()}-${nextNum}`,
        type: 'step',
        title: `Nova Etapa ${nextNum}: Roteiro Operacional`,
        content: 'Instrução do passo a passo no sistema Digifarma.',
        instruction: 'Descreva a validação necessária e os botões que devem ser acionados nesta etapa.',
        expectedResult: 'Registro processado e confirmado com sucesso no banco de dados.',
        tips: 'Atalho ou dica operacional para maior agilidade.',
        completed: false,
      };
      stepIdx = steps.length;
      setSteps([...steps, newStep]);
    }

    const newSlide: SlideConfig = {
      id: `slide-${slideType}-${Date.now()}`,
      slideType,
      stepIndex: stepIdx,
      title: slideType === 'custom' ? 'Página Livre' : undefined,
      bgTheme: slideType === 'cover' || slideType === 'signatures' ? 'deep' : 'light',
      indicators: [],
    };

    const insertAt = safeActiveSlideIndex + 1;
    const updated = [...slidesConfig];
    updated.splice(insertAt, 0, newSlide);
    setSlidesConfig(updated);
    setActiveSlideIndex(insertAt);
    setSelectedIndicatorId(null);
    showToast('Nova página adicionada ao documento!');
  };

  // ─────────────────────────────────────────────────────────────
  // 5. PERSISTÊNCIA, EXPORTAÇÃO DUPLA & IMPRESSÃO
  // ─────────────────────────────────────────────────────────────
  const constructProcedureToSave = (): Procedure => {
    const blocks: ProcedureBlock[] = [];

    // Etapas e Imagens
    steps.forEach((step, idx) => {
      blocks.push({
        ...step,
        stepNumber: idx + 1,
      });

      if (images[idx]) {
        blocks.push({
          id: `img-${step.id}`,
          type: 'image',
          url: images[idx],
          caption: `Interface Operacional - Etapa ${(idx + 1).toString().padStart(2, '0')}`,
        });
      }
    });

    // Callouts / BPF
    callouts.forEach((c) => blocks.push(c));

    const selectedMenu = menus.find((m) => m.id === menuId);
    const systemCategory = selectedMenu?.label || 'Geral';

    const nowIso = new Date().toISOString();
    const isResubmission = initialProcedure?.status === 'ajustes_solicitados';

    const historyItem: ProcedureHistoryItem = {
      id: `hist-${Date.now()}`,
      action: isResubmission ? 'revision' : initialProcedure ? 'update' : 'create',
      timestamp: nowIso,
      user: currentUser?.name || currentUser?.username || 'Leonardo Trevas',
      description: isResubmission
        ? `Ajustes operacionais realizados e reenviado para revisão por ${currentUser?.name || 'Autor'}`
        : initialProcedure
        ? `Atualização completa via Studio Canva por ${currentUser?.name || 'Gestor'}`
        : `Elaboração via Studio Digifarma por ${currentUser?.name || 'Gestor'} (aguardando revisão)`,
    };

    // Todo POP novo ou com ajustes solicitados fica com status 'pendente' até aprovação oficial
    const nextStatus: ProcedureStatus = initialProcedure?.status === 'aprovado' ? 'aprovado' : 'pendente';

    return {
      id: initialProcedure?.id || `proc-${Date.now()}`,
      title,
      subtitle,
      category: systemCategory,
      systemVersion,
      menuId,
      submenuId,
      systemPath,
      author,
      formatType: initialProcedure?.formatType || 'both',
      updatedBy: currentUser?.name || currentUser?.username || 'Leonardo Trevas',
      status: nextStatus,
      rejectionReason: isResubmission ? undefined : initialProcedure?.rejectionReason,
      history: [historyItem, ...(initialProcedure?.history || [])],
      tags: [systemVersion === 'v10' ? 'Digifarma V10' : 'Digifarma Clássico', systemCategory, 'BPF'],
      blocks,
      slidesConfig,
      signatures,
      created_at: initialProcedure?.created_at || nowIso,
      updated_at: nowIso,
    };
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const proc = constructProcedureToSave();
      await onSave(proc);
      showToast(
        initialProcedure?.status === 'ajustes_solicitados'
          ? 'Procedimento reenviado para a Tela de Revisão com sucesso!'
          : 'Procedimento salvo e enviado para aprovação!'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Erro ao salvar: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleExportHtml = () => {
    const proc = constructProcedureToSave();
    downloadProcedureHtml(proc);
    showToast('Download do arquivo HTML com animações iniciado!');
  };

  const handlePrintPdf = async () => {
    const proc = constructProcedureToSave();
    showToast('Gerando PDF Oficial em alta definição...');
    try {
      await exportProcedurePdf(proc);
      showToast('PDF baixado com sucesso!');
    } catch {
      const originalTitle = document.title;
      document.title = '';
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
      }, 1200);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 6. RENDERIZADOR UNIVERSAL DE INDICADORES (STAGE & PRINT)
  // ─────────────────────────────────────────────────────────────
  const renderIndicatorItem = (
    ind: SlideIndicator,
    isInteractive: boolean = false,
    slideIdx?: number
  ) => {
    const isSelected = selectedIndicatorId === ind.id;
    const color = ind.color || '#ef4444';
    const opacity = ind.opacity ?? 1.0;
    const glow = ind.glow ?? 'none';
    const size = ind.size ?? 'md';
    const scale = ind.scale ?? 1.0;

    const glowStyle =
      glow === 'neon'
        ? `0 0 12px ${color}, 0 0 4px #ffffff`
        : glow === 'soft'
        ? `0 0 8px ${color}`
        : undefined;

    let content: React.ReactNode = null;

    if (ind.type === 'hand') {
      content = <SvgHand color={color} direction={ind.direction} size={size} glow={glow} />;
    } else if (ind.type === 'arrow') {
      content = <SvgArrow color={color} direction={ind.direction} size={size} glow={glow} />;
    } else if (ind.type === 'rect') {
      const isFilled = ind.fillMode === 'filled';
      const w = size === 'sm' ? 70 : size === 'lg' ? 150 : size === 'xl' ? 200 : 110;
      const h = size === 'sm' ? 36 : size === 'lg' ? 75 : size === 'xl' ? 100 : 54;
      content = (
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
      content = (
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
      content = (
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
      content = (
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
      content = (
        <div
          style={{
            opacity,
            filter: glowStyle ? `drop-shadow(${glowStyle})` : 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {renderIconSymbol(ind.iconName || 'alert', color, size)}
        </div>
      );
    } else if (ind.type === 'dropdown') {
      content = (
        <details
          className="canva-interactive-dropdown"
          open={isInteractive}
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
      content = (
        <div
          className="spotlight-beacon"
          style={{
            borderColor: color,
            backgroundColor: hexToRgba(color, 0.25),
            boxShadow: glowStyle,
            width: size === 'sm' ? '32px' : size === 'lg' ? '56px' : '44px',
            height: size === 'sm' ? '32px' : size === 'lg' ? '56px' : '44px',
          }}
        />
      );
    } else if (ind.type === 'gif' && ind.gifUrl) {
      content = (
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
        className={`canva-canvas-indicator ${isSelected && isInteractive ? 'selected-indicator' : ''}`}
        style={{
          position: 'absolute',
          left: `${ind.x}%`,
          top: `${ind.y}%`,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
          cursor: isInteractive ? 'grab' : 'default',
          zIndex: isSelected ? 35 : 20,
          userSelect: 'none',
        }}
        onMouseDown={isInteractive ? (e) => handleIndicatorMouseDown(e, ind.id, slideIdx) : undefined}
        onClick={isInteractive ? (e) => {
          e.stopPropagation();
          setSelectedIndicatorId(ind.id);
          if (typeof slideIdx === 'number') {
            setActiveSlideIndex(slideIdx);
          }
        } : undefined}
      >
        {/* Controle flutuante de escala e exclusão diretamente no elemento selecionado */}
        {isSelected && isInteractive && (
          <div
            className="canva-element-control-bubble no-print"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="canva-control-btn"
              title="Diminuir tamanho (Atalho: -)"
              onClick={() => changeIndicatorScale(ind.id, -0.1, slideIdx)}
            >
              <Minus size={11} />
            </button>
            <span className="canva-control-badge">
              {Math.round((ind.scale ?? 1.0) * 100)}%
            </span>
            <button
              type="button"
              className="canva-control-btn"
              title="Aumentar tamanho (Atalho: +)"
              onClick={() => changeIndicatorScale(ind.id, 0.1, slideIdx)}
            >
              <Plus size={11} />
            </button>
            <div className="canva-control-divider" />
            <button
              type="button"
              className="canva-control-btn danger"
              title="Remover elemento (Atalho: Del)"
              onClick={() => removeIndicator(ind.id, slideIdx)}
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}

        {/* Botão de exclusão "X" diretamente no elemento para remoção imediata */}
        {isInteractive && (
          <button
            type="button"
            className="indicator-corner-delete-btn no-print"
            onClick={(e) => {
              e.stopPropagation();
              removeIndicator(ind.id, slideIdx);
            }}
            title="Remover este elemento da tela"
          >
            ✕
          </button>
        )}
        {content}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // 7. RENDERIZADORES DE SLIDE INDIVIDUAL (CANVAS DO STUDIO & PDF)
  // ─────────────────────────────────────────────────────────────
  const renderSlideContent = (
    slide: SlideConfig,
    slideIdx: number,
    isEditable: boolean,
    isStage: boolean = false
  ) => {
    const isDark = slide.bgTheme === 'deep' || slide.bgTheme === 'dark';
    const indicators = slide.indicators || [];
    const isInteractive = isStage || isEditable;

    // TIPO 1: CAPA EDITORIAL
    if (slide.slideType === 'cover') {
      return (
        <section
          key={slide.id || `slide-${slideIdx}`}
          className={`slide deep cover ${isStage ? 'canva-slide-canvas' : ''}`}
          onClick={isInteractive ? () => setActiveSlideIndex(slideIdx) : undefined}
          style={{ position: 'relative' }}
        >
          <div className="inner">
            <div className="logo">
              <span className="a">Digi</span>
              <span className="b">farma</span>
            </div>

            {isInteractive ? (
              <div
                className="v10-badge"
                onClick={(e) => {
                  e.stopPropagation();
                  setSystemVersion(systemVersion === 'v10' ? 'classico' : 'v10');
                }}
                title="Clique para alternar versão (Digifarma V10 / Digifarma Clássico)"
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                {systemVersion === 'v10' ? 'DIGIFARMA V10' : 'DIGIFARMA CLÁSSICO'} ⇄
              </div>
            ) : (
              <div className="v10-badge">
                {systemVersion === 'v10' ? 'DIGIFARMA V10' : 'DIGIFARMA CLÁSSICO'}
              </div>
            )}

            {isInteractive ? (
              <input
                type="text"
                className="canva-inline-display-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título Principal do Manual..."
              />
            ) : (
              <h1 className="display">{title}</h1>
            )}

            {isInteractive ? (
              <textarea
                className="canva-inline-lead-input"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Subtítulo ou resumo operacional da rotina..."
                rows={2}
              />
            ) : (
              <p className="lead">{subtitle}</p>
            )}

            {isInteractive ? (
              <input
                type="text"
                className="canva-inline-fitem-input"
                style={{ width: '100%', marginTop: '8px', fontSize: '0.82rem', color: '#94a3b8' }}
                value={signatures.slogan || ''}
                onChange={(e) => setSignatures((prev) => ({ ...prev, slogan: e.target.value }))}
                placeholder="Slogan / Certificação BPF (Ex: Digitalmente fácil · Homologado ISO 9001)..."
              />
            ) : (
              <div className="slogan muted" style={{ marginTop: '8px' }}>
                {signatures.slogan || 'Digitalmente fácil · Homologado ISO 9001 & Boas Práticas Farmacêuticas'}
              </div>
            )}

            <div className="stats" style={{ marginTop: '28px' }}>
              <div className="stat">
                <div className="n">{steps.length || 1}<small>etapas</small></div>
                <div className="l">Roteiro operacional documentado</div>
              </div>
              <div className="stat">
                <div className="n">100<small>%</small></div>
                <div className="l">Conformidade com Boas Práticas (BPF)</div>
              </div>
              <div className="stat">
                {isInteractive ? (
                  <div className="n" style={{ fontSize: '20px' }}>
                    <select
                      value={menuId}
                      onChange={(e) => setMenuId(e.target.value)}
                      className="canva-select-module"
                    >
                      {menus.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="n">{menus.find((m) => m.id === menuId)?.label || 'Cadastros'}</div>
                )}
                <div className="l">Módulo integrado do sistema</div>
              </div>
              <div className="stat">
                {isInteractive ? (
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => {
                      setAuthor(e.target.value);
                      setSignatures((prev) => ({ ...prev, elaboratedByName: e.target.value }));
                    }}
                    className="canva-inline-author-input"
                    placeholder="Autor / Responsável"
                  />
                ) : (
                  <div className="n">{author}</div>
                )}
                <div className="l">Responsável técnico / elaboração</div>
              </div>
            </div>
          </div>

          {indicators.map((ind) => renderIndicatorItem(ind, isInteractive, slideIdx))}
        </section>
      );
    }

    // TIPO 2: ETAPA OPERACIONAL
    if (slide.slideType === 'step') {
      const stepIdx = slide.stepIndex ?? 0;
      const step = steps[stepIdx] || steps[0];
      const stepNum = String(stepIdx + 1).padStart(2, '0');
      const imgUrl = images[stepIdx];

      return (
        <section
          key={slide.id || `slide-${slideIdx}`}
          className={`slide ${isDark ? 'deep' : 'light'} step-slide ${isStage ? 'canva-slide-canvas' : ''}`}
          onClick={isInteractive ? () => setActiveSlideIndex(slideIdx) : undefined}
          style={{ position: 'relative' }}
        >
          <div className="inner">
            <p className="eyebrow">
              <span>ETAPA {stepNum}</span> · Roteiro Passo a Passo
            </p>

            {isInteractive ? (
              <input
                type="text"
                className="canva-inline-head-input"
                value={step.title || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setSteps((prev) =>
                    prev.map((s, idx) => (idx === stepIdx ? { ...s, title: val } : s))
                  );
                }}
                placeholder="Título da Etapa..."
              />
            ) : (
              <h2 className="head">{step.title}</h2>
            )}

            {isInteractive ? (
              <textarea
                className="canva-inline-lead-input light"
                value={step.instruction || step.content}
                onChange={(e) => {
                  const val = e.target.value;
                  setSteps((prev) =>
                    prev.map((s, idx) =>
                      idx === stepIdx ? { ...s, instruction: val, content: val } : s
                    )
                  );
                }}
                placeholder="Instrução passo a passo detalhada..."
                rows={2}
              />
            ) : (
              <p className="lead">{step.instruction || step.content}</p>
            )}

            <div className="feature-split">
              <div className="feature-left">
                {/* Resultado Esperado */}
                <div className="fitem">
                  <div className="fico">✓</div>
                  <div className="ftxt" style={{ flex: 1 }}>
                    <h4>Resultado Esperado</h4>
                    {isInteractive ? (
                      <input
                        type="text"
                        className="canva-inline-fitem-input"
                        value={step.expectedResult || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSteps((prev) =>
                            prev.map((s, idx) =>
                              idx === stepIdx ? { ...s, expectedResult: val } : s
                            )
                          );
                        }}
                        placeholder="O que deve acontecer..."
                      />
                    ) : (
                      <p>{step.expectedResult || 'Registro processado e confirmado.'}</p>
                    )}
                  </div>
                </div>

                {/* Dica de Agilidade */}
                <div className="fitem">
                  <div className="fico">💡</div>
                  <div className="ftxt" style={{ flex: 1 }}>
                    <h4>Dica de Agilidade</h4>
                    {isInteractive ? (
                      <input
                        type="text"
                        className="canva-inline-fitem-input"
                        value={step.tips || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSteps((prev) =>
                            prev.map((s, idx) =>
                              idx === stepIdx ? { ...s, tips: val } : s
                            )
                          );
                        }}
                        placeholder="Atalhos do teclado..."
                      />
                    ) : (
                      <p>{step.tips || 'Atalho F2 para busca rápida.'}</p>
                    )}
                  </div>
                </div>

                {/* Ponto Crítico */}
                <div className="fitem warning">
                  <div className="fico">⚠️</div>
                  <div className="ftxt" style={{ flex: 1 }}>
                    <h4 style={{ color: '#d97706' }}>Ponto Crítico</h4>
                    {isInteractive ? (
                      <input
                        type="text"
                        className="canva-inline-fitem-input"
                        value={step.warnings || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSteps((prev) =>
                            prev.map((s, idx) =>
                              idx === stepIdx ? { ...s, warnings: val } : s
                            )
                          );
                        }}
                        placeholder="Atenção especial para evitar erros..."
                      />
                    ) : (
                      <p>{step.warnings || 'Valide a numeração do lote.'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Shotframe da Etapa */}
              <div className="shotframe">
                <div
                  className={`frame ${isInteractive ? 'canva-interactive-frame' : ''}`}
                  ref={isStage ? shotframeRef : undefined}
                  onClick={isInteractive ? handleShotframeClick : undefined}
                  title={isInteractive ? 'Clique para posicionar. Arraste qualquer forma com o mouse!' : undefined}
                >
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={step.title}
                      className={isInteractive ? 'canva-step-img' : undefined}
                      draggable={false}
                    />
                  ) : (
                    <div
                      className="canva-placeholder-drop"
                      style={{ color: '#94a3b8', padding: '36px', textAlign: 'center', cursor: isInteractive ? 'pointer' : 'default' }}
                      onClick={isInteractive ? () => handleManualUploadClick(stepIdx) : undefined}
                    >
                      <ImageIcon size={38} color="var(--red)" />
                      <strong>Nenhuma imagem anexada</strong>
                      <span>Cole um print com Ctrl+V ou clique para importar</span>
                    </div>
                  )}

                  {indicators.map((ind) => renderIndicatorItem(ind, isInteractive, slideIdx))}
                </div>

                {isInteractive && (
                  <div className="shotframe-toolbar-bottom no-print">
                    <button
                      type="button"
                      className="btn-shot-action"
                      onClick={() => handleManualUploadClick(stepIdx)}
                    >
                      <Upload size={13} />
                      <span>Importar Imagem</span>
                    </button>

                    {imgUrl && (
                      <button
                        type="button"
                        className="btn-shot-action danger"
                        onClick={() => {
                          setImages((prev) => {
                            const copy = { ...prev };
                            delete copy[stepIdx];
                            return copy;
                          });
                        }}
                      >
                        <Trash2 size={13} />
                        <span>Remover Foto</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      );
    }

    // TIPO 3: BOAS PRÁTICAS (BPF)
    if (slide.slideType === 'callout') {
      return (
        <section
          key={slide.id || `slide-${slideIdx}`}
          className={`slide ${isDark ? 'deep' : 'light'} ${isStage ? 'canva-slide-canvas' : ''}`}
          onClick={isInteractive ? () => setActiveSlideIndex(slideIdx) : undefined}
          style={{ position: 'relative' }}
        >
          <div className="inner">
            <p className="eyebrow">
              <span>BPF</span> · Boas Práticas &amp; Diretrizes
            </p>

            {isInteractive ? (
              <input
                type="text"
                className="canva-inline-head-input"
                value={slide.title || 'Orientações de Segurança & Auditoria'}
                onChange={(e) => {
                  const val = e.target.value;
                  setSlidesConfig((prev) =>
                    prev.map((s, idx) => (idx === slideIdx ? { ...s, title: val } : s))
                  );
                }}
                placeholder="Título da Página BPF..."
              />
            ) : (
              <h2 className="head">{slide.title || 'Orientações de Segurança & Auditoria'}</h2>
            )}

            {isInteractive ? (
              <textarea
                className="canva-inline-lead-input light"
                value={slide.subtitle || 'Recomendações técnicas homologadas para garantia da qualidade operacional.'}
                onChange={(e) => {
                  const val = e.target.value;
                  setSlidesConfig((prev) =>
                    prev.map((s, idx) => (idx === slideIdx ? { ...s, subtitle: val } : s))
                  );
                }}
                placeholder="Subtítulo da página..."
                rows={2}
              />
            ) : (
              <p className="lead">
                {slide.subtitle || 'Recomendações técnicas homologadas para garantia da qualidade operacional.'}
              </p>
            )}

            <div className="canva-callouts-list" style={{ marginTop: '24px' }}>
              {callouts.map((c, i) => (
                <div key={c.id} className="fitem" style={{ marginBottom: '14px', position: 'relative' }}>
                  <div className="fico">
                    <Info size={22} color="var(--red)" />
                  </div>
                  <div className="ftxt" style={{ flex: 1 }}>
                    {isInteractive ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <input
                            type="text"
                            className="canva-inline-head-input"
                            style={{ fontSize: '1.02rem', marginBottom: '4px', flex: 1 }}
                            value={c.title || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCallouts((prev) =>
                                prev.map((item, idx) => (idx === i ? { ...item, title: val } : item))
                              );
                            }}
                            placeholder="Título da Diretriz..."
                          />
                          <button
                            type="button"
                            className="canva-control-btn danger no-print"
                            onClick={() => setCallouts((prev) => prev.filter((_, idx) => idx !== i))}
                            title="Remover esta diretriz"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <textarea
                          className="canva-inline-lead-input light"
                          value={c.content}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCallouts((prev) =>
                              prev.map((item, idx) => (idx === i ? { ...item, content: val } : item))
                            );
                          }}
                          placeholder="Texto explicativo da norma..."
                          rows={2}
                        />
                      </>
                    ) : (
                      <>
                        <h4>{c.title}</h4>
                        <p>{c.content}</p>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {isInteractive && (
                <button
                  type="button"
                  className="canva-action-btn no-print"
                  style={{ marginTop: '8px', alignSelf: 'flex-start' }}
                  onClick={() =>
                    setCallouts((prev) => [
                      ...prev,
                      {
                        id: `callout-${Date.now()}`,
                        type: 'callout',
                        calloutType: 'warning',
                        title: 'Nova Diretriz de Segurança Operacional',
                        content: 'Descreva a orientação regulatória e de qualidade necessária.',
                      },
                    ])
                  }
                >
                  <Plus size={13} />
                  <span>Adicionar Diretriz BPF</span>
                </button>
              )}
            </div>
          </div>

          {indicators.map((ind) => renderIndicatorItem(ind, isInteractive, slideIdx))}
        </section>
      );
    }

    // TIPO 4: CHECKLIST DE HOMOLOGAÇÃO
    if (slide.slideType === 'checklist') {
      return (
        <section
          key={slide.id || `slide-${slideIdx}`}
          className={`slide ${isDark ? 'deep' : 'light'} ${isStage ? 'canva-slide-canvas' : ''}`}
          onClick={isInteractive ? () => setActiveSlideIndex(slideIdx) : undefined}
          style={{ position: 'relative' }}
        >
          <div className="inner">
            <p className="eyebrow">
              <span>CHECKLIST</span> · Homologação
            </p>

            {isInteractive ? (
              <input
                type="text"
                className="canva-inline-head-input"
                value={slide.title || 'Checklist de Auditoria Operacional'}
                onChange={(e) => {
                  const val = e.target.value;
                  setSlidesConfig((prev) =>
                    prev.map((s, idx) => (idx === slideIdx ? { ...s, title: val } : s))
                  );
                }}
                placeholder="Título do Checklist..."
              />
            ) : (
              <h2 className="head">{slide.title || 'Checklist de Auditoria Operacional'}</h2>
            )}

            {isInteractive ? (
              <textarea
                className="canva-inline-lead-input light"
                value={slide.subtitle || `Validação obrigatória de cada uma das ${steps.length} etapas cadastradas.`}
                onChange={(e) => {
                  const val = e.target.value;
                  setSlidesConfig((prev) =>
                    prev.map((s, idx) => (idx === slideIdx ? { ...s, subtitle: val } : s))
                  );
                }}
                placeholder="Subtítulo do checklist..."
                rows={2}
              />
            ) : (
              <p className="lead">
                {slide.subtitle || `Validação obrigatória de cada uma das ${steps.length} etapas cadastradas.`}
              </p>
            )}

            <div className="canva-checklist-preview" style={{ marginTop: '22px' }}>
              {steps.map((s, i) => (
                <div key={s.id} className="canva-check-row">
                  <div className="canva-check-circle">✓</div>
                  <div style={{ flex: 1 }}>
                    <strong>
                      Etapa {(i + 1).toString().padStart(2, '0')}: {s.title}
                    </strong>
                    {isInteractive ? (
                      <input
                        type="text"
                        className="canva-inline-fitem-input"
                        value={s.expectedResult || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSteps((prev) =>
                            prev.map((st, idx) => (idx === i ? { ...st, expectedResult: val } : st))
                          );
                        }}
                        placeholder="Nota de validação da etapa..."
                        style={{ marginTop: '2px', fontSize: '0.8rem' }}
                      />
                    ) : (
                      <p>{s.expectedResult || 'Validação de tela confirmada.'}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {indicators.map((ind) => renderIndicatorItem(ind, isInteractive, slideIdx))}
        </section>
      );
    }

    // TIPO 5: HOMOLOGAÇÃO & ASSINATURAS
    if (slide.slideType === 'signatures') {
      return (
        <section
          key={slide.id || `slide-${slideIdx}`}
          className={`slide deep ${isStage ? 'canva-slide-canvas' : ''}`}
          onClick={isInteractive ? () => setActiveSlideIndex(slideIdx) : undefined}
          style={{ position: 'relative' }}
        >
          <div className="inner">
            <div className="logo">
              <span className="a">Digi</span>
              <span className="b">farma</span>
            </div>
            <div className="v10-badge">HOMOLOGAÇÃO OFICIAL</div>

            {isInteractive ? (
              <input
                type="text"
                className="canva-inline-display-input"
                style={{ fontSize: '32px', marginBottom: '8px' }}
                value={slide.title || 'Controle da Qualidade & BPF'}
                onChange={(e) => {
                  const val = e.target.value;
                  setSlidesConfig((prev) =>
                    prev.map((s, idx) => (idx === slideIdx ? { ...s, title: val } : s))
                  );
                }}
                placeholder="Título da Homologação..."
              />
            ) : (
              <h1 className="display" style={{ fontSize: '32px' }}>
                {slide.title || 'Controle da Qualidade & BPF'}
              </h1>
            )}

            {isInteractive ? (
              <textarea
                className="canva-inline-lead-input"
                value={slide.subtitle || 'Procedimento validado e arquivado para fiscalização sanitária e instrução de trabalho.'}
                onChange={(e) => {
                  const val = e.target.value;
                  setSlidesConfig((prev) =>
                    prev.map((s, idx) => (idx === slideIdx ? { ...s, subtitle: val } : s))
                  );
                }}
                rows={2}
              />
            ) : (
              <p className="lead">
                {slide.subtitle || 'Procedimento validado e arquivado para fiscalização sanitária e instrução de trabalho.'}
              </p>
            )}

            <div className="print-signatures-grid" style={{ marginTop: '36px' }}>
              {/* Box 1: Elaborado */}
              <div className="print-sign-col">
                {isInteractive ? (
                  <input
                    type="text"
                    className="canva-inline-fitem-input"
                    style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.75rem', marginBottom: '4px' }}
                    value={signatures.elaboratedByTitle || 'ELABORADO POR'}
                    onChange={(e) => setSignatures((prev) => ({ ...prev, elaboratedByTitle: e.target.value }))}
                  />
                ) : (
                  <span className="print-sign-title">{signatures.elaboratedByTitle || 'ELABORADO POR'}</span>
                )}
                <div className="print-sign-line"></div>
                {isInteractive ? (
                  <input
                    type="text"
                    value={signatures.elaboratedByName || author || ''}
                    onChange={(e) => {
                      setAuthor(e.target.value);
                      setSignatures((prev) => ({ ...prev, elaboratedByName: e.target.value }));
                    }}
                    className="canva-inline-sign-input"
                    placeholder="Nome do Elaborador"
                  />
                ) : (
                  <span className="print-sign-name">
                    {signatures.elaboratedByName || author || 'Leonardo Henrique B. Trevas'}
                  </span>
                )}
                {isInteractive ? (
                  <input
                    type="text"
                    className="canva-inline-fitem-input"
                    style={{ textAlign: 'center', fontSize: '0.72rem', marginTop: '4px' }}
                    value={signatures.elaboratedByRole || 'Digifarma Sistemas'}
                    onChange={(e) => setSignatures((prev) => ({ ...prev, elaboratedByRole: e.target.value }))}
                  />
                ) : (
                  <span className="print-sign-role">{signatures.elaboratedByRole || 'Digifarma Sistemas'}</span>
                )}
              </div>

              {/* Box 2: Revisado */}
              <div className="print-sign-col">
                {isInteractive ? (
                  <input
                    type="text"
                    className="canva-inline-fitem-input"
                    style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.75rem', marginBottom: '4px' }}
                    value={signatures.reviewedByTitle || 'REVISADO POR'}
                    onChange={(e) => setSignatures((prev) => ({ ...prev, reviewedByTitle: e.target.value }))}
                  />
                ) : (
                  <span className="print-sign-title">{signatures.reviewedByTitle || 'REVISADO POR'}</span>
                )}
                <div className="print-sign-line"></div>
                {isInteractive ? (
                  <input
                    type="text"
                    value={signatures.reviewedByName || 'Garantia da Qualidade (BPF)'}
                    onChange={(e) => setSignatures((prev) => ({ ...prev, reviewedByName: e.target.value }))}
                    className="canva-inline-sign-input"
                    placeholder="Nome do Revisor"
                  />
                ) : (
                  <span className="print-sign-name">
                    {signatures.reviewedByName || 'Garantia da Qualidade (BPF)'}
                  </span>
                )}
                {isInteractive ? (
                  <input
                    type="text"
                    className="canva-inline-fitem-input"
                    style={{ textAlign: 'center', fontSize: '0.72rem', marginTop: '4px' }}
                    value={signatures.reviewedByRole || 'Controle de Procedimentos'}
                    onChange={(e) => setSignatures((prev) => ({ ...prev, reviewedByRole: e.target.value }))}
                  />
                ) : (
                  <span className="print-sign-role">{signatures.reviewedByRole || 'Controle de Procedimentos'}</span>
                )}
              </div>

              {/* Box 3: Aprovado */}
              <div className="print-sign-col">
                {isInteractive ? (
                  <input
                    type="text"
                    className="canva-inline-fitem-input"
                    style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.75rem', marginBottom: '4px' }}
                    value={signatures.approvedByTitle || 'APROVADO POR'}
                    onChange={(e) => setSignatures((prev) => ({ ...prev, approvedByTitle: e.target.value }))}
                  />
                ) : (
                  <span className="print-sign-title">{signatures.approvedByTitle || 'APROVADO POR'}</span>
                )}
                <div className="print-sign-line"></div>
                {isInteractive ? (
                  <input
                    type="text"
                    value={signatures.approvedByName || 'Leonardo Henrique B. Trevas'}
                    onChange={(e) => setSignatures((prev) => ({ ...prev, approvedByName: e.target.value }))}
                    className="canva-inline-sign-input"
                    placeholder="Nome do Aprovador"
                  />
                ) : (
                  <span className="print-sign-name">
                    {signatures.approvedByName || 'Leonardo Henrique B. Trevas'}
                  </span>
                )}
                {isInteractive ? (
                  <input
                    type="text"
                    className="canva-inline-fitem-input"
                    style={{ textAlign: 'center', fontSize: '0.72rem', marginTop: '4px' }}
                    value={signatures.approvedByRole || 'Responsável Técnico / Gestor'}
                    onChange={(e) => setSignatures((prev) => ({ ...prev, approvedByRole: e.target.value }))}
                  />
                ) : (
                  <span className="print-sign-role">{signatures.approvedByRole || 'Responsável Técnico / Gestor'}</span>
                )}
              </div>
            </div>
          </div>

          {indicators.map((ind) => renderIndicatorItem(ind, isInteractive, slideIdx))}
        </section>
      );
    }

    // TIPO 6: PÁGINA LIVRE / PERSONALIZADA
    return (
      <section
        key={slide.id || `slide-${slideIdx}`}
        className={`slide ${isDark ? 'deep' : 'light'} ${isStage ? 'canva-slide-canvas' : ''}`}
        onClick={isInteractive ? () => setActiveSlideIndex(slideIdx) : undefined}
        style={{ position: 'relative' }}
      >
        <div className="inner">
          <p className="eyebrow">
            <span>PÁGINA LIVRE</span> · Conteúdo Adicional
          </p>
          {isInteractive ? (
            <input
              type="text"
              className="canva-inline-head-input"
              value={slide.title || 'Título da Página'}
              onChange={(e) => {
                const val = e.target.value;
                setSlidesConfig((prev) =>
                  prev.map((s, idx) => (idx === slideIdx ? { ...s, title: val } : s))
                );
              }}
              placeholder="Título da Página..."
            />
          ) : (
            <h2 className="head">{slide.title || 'Página de Conteúdo Livre'}</h2>
          )}

          {isInteractive ? (
            <textarea
              className="canva-inline-lead-input light"
              value={slide.subtitle || ''}
              onChange={(e) => {
                const val = e.target.value;
                setSlidesConfig((prev) =>
                  prev.map((s, idx) => (idx === slideIdx ? { ...s, subtitle: val } : s))
                );
              }}
              placeholder="Digite o texto, orientações ou instruções desta página..."
              rows={5}
            />
          ) : (
            <p className="lead">{slide.subtitle || 'Instruções e anotações adicionais.'}</p>
          )}
        </div>

        {indicators.map((ind) => renderIndicatorItem(ind, isInteractive, slideIdx))}
      </section>
    );
  };

  // Renderiza todas as páginas no formato de impressão oficial A4 paisagem
  const renderPresentationManual = (isEditable: boolean) => {
    return (
      <div className="presentation-manual-root" id="printable-procedure">
        {slidesConfig.map((slide, idx) => renderSlideContent(slide, idx, isEditable, false))}
      </div>
    );
  };

  const getSlideTitle = (slide: SlideConfig, idx: number): string => {
    switch (slide.slideType) {
      case 'cover':
        return 'Capa Editorial';
      case 'step': {
        const sIdx = slide.stepIndex ?? 0;
        const step = steps[sIdx];
        return step?.title ? `Etapa ${(sIdx + 1).toString().padStart(2, '0')}: ${step.title.slice(0, 18)}...` : `Etapa ${(sIdx + 1).toString().padStart(2, '0')}`;
      }
      case 'callout':
        return 'Boas Práticas BPF';
      case 'checklist':
        return 'Checklist Auditoria';
      case 'signatures':
        return 'Homologação & Assinaturas';
      case 'custom':
        return slide.title || 'Página Livre';
      default:
        return `Página ${idx + 1}`;
    }
  };

  // Barra Flutuante de Propriedades do Elemento Selecionado (Modo Canva & Modo PDF)
  const renderPropertyBar = () => {
    if (!selectedIndicator) return null;
    return (
    <div className="canva-element-property-bar no-print">
                    <div className="prop-bar-label">
                      <span>
                        Propriedades: <strong>{selectedIndicator.type.toUpperCase()}</strong>
                      </span>
                    </div>
    
                    {/* ESCALA LIVRE: AUMENTAR / DIMINUIR QUALQUER RECURSO */}
                    <div className="prop-bar-group">
                      <span className="prop-group-title">Escala:</span>
                      <div className="prop-btn-group">
                        <button
                          type="button"
                          className="prop-btn-mini"
                          onClick={() => {
                            const cur = selectedIndicator.scale ?? 1.0;
                            updateSelectedIndicator({ scale: Math.max(0.3, Number((cur - 0.15).toFixed(2))) });
                          }}
                          title="Diminuir tamanho (-15%)"
                        >
                          -
                        </button>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '0 4px', minWidth: '38px', textAlign: 'center' }}>
                          {Math.round((selectedIndicator.scale ?? 1.0) * 100)}%
                        </span>
                        <button
                          type="button"
                          className="prop-btn-mini"
                          onClick={() => {
                            const cur = selectedIndicator.scale ?? 1.0;
                            updateSelectedIndicator({ scale: Math.min(3.0, Number((cur + 0.15).toFixed(2))) });
                          }}
                          title="Aumentar tamanho (+15%)"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          className="prop-btn-mini"
                          onClick={() => updateSelectedIndicator({ scale: 1.0 })}
                          title="Resetar escala para 100%"
                        >
                          100%
                        </button>
                      </div>
                    </div>
    
                    {/* Tipografia / Família de Fonte */}
                    <div className="prop-bar-group">
                      <span className="prop-group-title">Fonte:</span>
                      <select
                        className="prop-font-select"
                        value={selectedIndicator.fontFamily || 'Inter, sans-serif'}
                        onChange={(e) => updateSelectedIndicator({ fontFamily: e.target.value })}
                      >
                        <option value="Inter, sans-serif">Inter (Moderno)</option>
                        <option value="Outfit, sans-serif">Outfit (Tech)</option>
                        <option value="Roboto, sans-serif">Roboto (Clássico)</option>
                        <option value="'Playfair Display', serif">Playfair (Elegante)</option>
                        <option value="'Fira Code', monospace">Fira Code (Mono)</option>
                        <option value="'Bebas Neue', sans-serif">Bebas Neue (Manchete)</option>
                        <option value="'Nunito', sans-serif">Nunito (Arredondado)</option>
                      </select>
                    </div>
    
                    {/* Cor do Texto */}
                    <div className="prop-bar-group">
                      <span className="prop-group-title">Texto:</span>
                      <div className="prop-color-swatches">
                        {[
                          { label: 'Branco', hex: '#ffffff' },
                          { label: 'Preto', hex: '#0f172a' },
                          { label: 'Vermelho', hex: '#ef4444' },
                          { label: 'Amarelo', hex: '#f59e0b' },
                          { label: 'Verde', hex: '#10b981' },
                          { label: 'Azul', hex: '#3b82f6' },
                        ].map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            className={`prop-color-dot ${selectedIndicator.textColor === c.hex ? 'active' : ''}`}
                            style={{ backgroundColor: c.hex }}
                            onClick={() => updateSelectedIndicator({ textColor: c.hex })}
                            title={`Cor do Texto: ${c.label}`}
                          />
                        ))}
                        <div className="prop-color-input-wrapper" title="Personalizar cor do texto">
                          <input
                            type="color"
                            className="prop-color-native-input"
                            value={selectedIndicator.textColor && selectedIndicator.textColor.startsWith('#') ? selectedIndicator.textColor : '#ffffff'}
                            onChange={(e) => updateSelectedIndicator({ textColor: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
    
                    {/* Cor do Fundo da Caixa */}
                    <div className="prop-bar-group">
                      <span className="prop-group-title">Fundo:</span>
                      <div className="prop-color-swatches">
                        {[
                          { label: 'Escuro', hex: '#0f172a' },
                          { label: 'Preto', hex: '#000000' },
                          { label: 'Branco', hex: '#ffffff' },
                          { label: 'Vermelho', hex: '#ef4444' },
                          { label: 'Azul', hex: '#3b82f6' },
                          { label: 'Transparente', hex: 'transparent' },
                        ].map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            className={`prop-color-dot ${selectedIndicator.bgColor === c.hex ? 'active' : ''}`}
                            style={{
                              backgroundColor: c.hex === 'transparent' ? 'transparent' : c.hex,
                              border: c.hex === 'transparent' ? '2px dashed #94a3b8' : undefined,
                            }}
                            onClick={() => updateSelectedIndicator({ bgColor: c.hex })}
                            title={`Cor do Fundo: ${c.label}`}
                          />
                        ))}
                        <div className="prop-color-input-wrapper" title="Personalizar cor de fundo">
                          <input
                            type="color"
                            className="prop-color-native-input"
                            value={selectedIndicator.bgColor && selectedIndicator.bgColor.startsWith('#') ? selectedIndicator.bgColor : '#0f172a'}
                            onChange={(e) => updateSelectedIndicator({ bgColor: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
    
                    {/* Cor Principal / Borda / Destaque */}
                    <div className="prop-bar-group">
                      <span className="prop-group-title">Borda:</span>
                      <div className="prop-color-swatches">
                        {[
                          { label: 'Vermelho', hex: '#ef4444' },
                          { label: 'Amarelo', hex: '#f59e0b' },
                          { label: 'Verde', hex: '#10b981' },
                          { label: 'Azul', hex: '#3b82f6' },
                          { label: 'Ciano', hex: '#06b6d4' },
                          { label: 'Roxo', hex: '#a855f7' },
                          { label: 'Branco', hex: '#ffffff' },
                          { label: 'Preto', hex: '#000000' },
                        ].map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            className={`prop-color-dot ${selectedIndicator.color === c.hex ? 'active' : ''}`}
                            style={{ backgroundColor: c.hex }}
                            onClick={() => updateSelectedIndicator({ color: c.hex })}
                            title={c.label}
                          />
                        ))}
                        <div className="prop-color-input-wrapper" title="Personalizar cor principal">
                          <input
                            type="color"
                            className="prop-color-native-input"
                            value={selectedIndicator.color && selectedIndicator.color.startsWith('#') ? selectedIndicator.color : '#ef4444'}
                            onChange={(e) => updateSelectedIndicator({ color: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
    
                    {/* Opacidade / Transparência */}
                    <div className="prop-bar-group">
                      <span className="prop-group-title">Opacidade:</span>
                      <div className="prop-btn-group">
                        {[1.0, 0.75, 0.5, 0.25].map((op) => (
                          <button
                            key={op}
                            type="button"
                            className={`prop-btn-mini ${(selectedIndicator.opacity ?? 1.0) === op ? 'active' : ''}`}
                            onClick={() => updateSelectedIndicator({ opacity: op })}
                          >
                            {Math.round(op * 100)}%
                          </button>
                        ))}
                      </div>
                    </div>
    
                    {/* Brilho / Glow */}
                    <div className="prop-bar-group">
                      <span className="prop-group-title">Brilho:</span>
                      <div className="prop-btn-group">
                        {[
                          { id: 'none', label: 'Sem' },
                          { id: 'soft', label: 'Suave' },
                          { id: 'neon', label: 'Neon' },
                        ].map((g) => (
                          <button
                            key={g.id}
                            type="button"
                            className={`prop-btn-mini ${(selectedIndicator.glow ?? 'none') === g.id ? 'active' : ''}`}
                            onClick={() => updateSelectedIndicator({ glow: g.id as any })}
                          >
                            {g.label}
                          </button>
                        ))}
                      </div>
                    </div>
    
                    {/* Tamanho */}
                    <div className="prop-bar-group">
                      <span className="prop-group-title">Tam:</span>
                      <div className="prop-btn-group">
                        {(['sm', 'md', 'lg', 'xl'] as IndicatorSize[]).map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            className={`prop-btn-mini ${(selectedIndicator.size ?? 'md') === sz ? 'active' : ''}`}
                            onClick={() => updateSelectedIndicator({ size: sz })}
                          >
                            {sz.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
    
                    {/* Direção (se mãozinha ou seta) */}
                    {(selectedIndicator.type === 'hand' || selectedIndicator.type === 'arrow') && (
                      <div className="prop-bar-group">
                        <span className="prop-group-title">Direção:</span>
                        <div className="prop-btn-group">
                          {[
                            { dir: 'up', icon: '⬆️' },
                            { dir: 'right', icon: '➡️' },
                            { dir: 'down', icon: '⬇️' },
                            { dir: 'left', icon: '⬅️' },
                          ].map((d) => (
                            <button
                              key={d.dir}
                              type="button"
                              className={`prop-btn-mini ${selectedIndicator.direction === d.dir ? 'active' : ''}`}
                              onClick={() => updateSelectedIndicator({ direction: d.dir as any })}
                            >
                              {d.icon}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
    
                    {/* Estilo Vazado vs Preenchido */}
                    {(selectedIndicator.type === 'rect' || selectedIndicator.type === 'circle') && (
                      <div className="prop-bar-group">
                        <span className="prop-group-title">Preenchimento:</span>
                        <div className="prop-btn-group">
                          <button
                            type="button"
                            className={`prop-btn-mini ${(selectedIndicator.fillMode ?? 'outline') === 'outline' ? 'active' : ''}`}
                            onClick={() => updateSelectedIndicator({ fillMode: 'outline' })}
                          >
                            Vazado
                          </button>
                          <button
                            type="button"
                            className={`prop-btn-mini ${selectedIndicator.fillMode === 'filled' ? 'active' : ''}`}
                            onClick={() => updateSelectedIndicator({ fillMode: 'filled' })}
                          >
                            Preenchido
                          </button>
                        </div>
                      </div>
                    )}
    
                    {/* Edição de Texto In-Place */}
                    {(selectedIndicator.type === 'badge' ||
                      selectedIndicator.type === 'text' ||
                      selectedIndicator.type === 'dropdown') && (
                      <div className="prop-bar-group" style={{ flex: 1, minWidth: '160px' }}>
                        <input
                          type="text"
                          className="prop-text-input"
                          value={selectedIndicator.label || ''}
                          onChange={(e) => updateSelectedIndicator({ label: e.target.value })}
                          placeholder="Texto do elemento..."
                        />
                      </div>
                    )}
    
                    {/* Botão de Excluir Imediato */}
                    <div className="prop-bar-actions">
                      <button
                        type="button"
                        className="prop-btn-delete"
                        onClick={() => removeIndicator(selectedIndicator.id)}
                        title="Remover elemento da tela (ou tecle Delete)"
                      >
                        <Trash2 size={13} />
                        <span>Remover</span>
                      </button>
                      <button
                        type="button"
                        className="prop-btn-close"
                        onClick={() => setSelectedIndicatorId(null)}
                        title="Fechar propriedades"
                      >
                        ✕
                      </button>
                    </div>
    
                    {/* Gerenciador de Opções do Menu Suspenso */}
                    {selectedIndicator.type === 'dropdown' && (
                      <div className="prop-dropdown-manager">
                        <div className="prop-dropdown-manager-header">
                          <span>Opções do Menu Suspenso ({selectedIndicator.dropdownOptions?.length || 0}):</span>
                          <button
                            type="button"
                            className="btn-add-dropdown-opt"
                            onClick={() => {
                              const currentOpts = selectedIndicator.dropdownOptions || [];
                              const newOpt = {
                                id: `opt-${Date.now()}`,
                                text: `Opção ${(currentOpts.length + 1).toString().padStart(2, '0')}`,
                              };
                              updateSelectedIndicator({ dropdownOptions: [...currentOpts, newOpt] });
                            }}
                          >
                            <Plus size={11} /> Adicionar Opção
                          </button>
                        </div>
                        <div className="prop-dropdown-options-list">
                          {(selectedIndicator.dropdownOptions || []).map((opt, optIdx) => (
                            <div key={opt.id} className="prop-dropdown-option-row">
                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const updated = (selectedIndicator.dropdownOptions || []).map((o, idx) =>
                                    idx === optIdx ? { ...o, text: val } : o
                                  );
                                  updateSelectedIndicator({ dropdownOptions: updated });
                                }}
                                placeholder="Texto da opção..."
                              />
                              <button
                                type="button"
                                className="btn-remove-dropdown-opt"
                                onClick={() => {
                                  const updated = (selectedIndicator.dropdownOptions || []).filter((_, idx) => idx !== optIdx);
                                  updateSelectedIndicator({ dropdownOptions: updated });
                                }}
                                title="Remover opção"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
    );
  };

  return (
    <div className="canva-studio-root" ref={editorRootRef}>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      {/* ── ALERTA DE AJUSTES SOLICITADOS PELO REVISOR ── */}
      {initialProcedure?.status === 'ajustes_solicitados' && (
        <div className="review-alert-banner no-print" style={{ margin: '8px 16px 0', borderRadius: '8px' }}>
          <div className="review-alert-icon">⚠️</div>
          <div className="review-alert-body">
            <h4>Ajustes Solicitados pelo Revisor</h4>
            <p>{initialProcedure.rejectionReason || 'Corrija os pontos apontados pelo revisor e reenvie para aprovação.'}</p>
          </div>
        </div>
      )}

      {/* ── TOPBAR DO STUDIO (CANVA TOOLBAR) ── */}
      <header className="canva-topbar no-print">
        <div className="canva-topbar-left">
          <button
            type="button"
            className="canva-btn-back"
            onClick={onCancel}
            title="Voltar aos manuais"
          >
            <ArrowLeft size={16} />
            <span>Voltar</span>
          </button>

          <div className="canva-title-box">
            <input
              type="text"
              className="canva-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título Principal do Procedimento..."
              title="Clique para editar o título principal"
            />
            <div className="canva-meta-pills">
              <span className="canva-version-pill">
                {systemVersion === 'v10' ? 'DIGIFARMA V10' : 'DIGIFARMA CLÁSSICO'}
              </span>
              <span className="canva-path-text">{systemPath}</span>
            </div>
          </div>
        </div>

        {/* Alternador de Modos: Studio Digifarma vs Documento PDF A4 */}
        <div className="canva-mode-switcher">
          <button
            type="button"
            className={`canva-mode-btn ${editorMode === 'canva' ? 'active' : ''}`}
            onClick={() => setEditorMode('canva')}
            title="Editor Visual Interativo com Formas, Ícones e Indicadores"
          >
            <Palette size={14} />
            <span>Studio Digifarma</span>
          </button>

          <button
            type="button"
            className={`canva-mode-btn ${editorMode === 'pdf-preview' ? 'active' : ''}`}
            onClick={() => setEditorMode('pdf-preview')}
            title="Modelo Oficial de Folha A4 para Impressão e PDF"
          >
            <FileText size={14} />
            <span>Preview de Impressão</span>
          </button>
        </div>

        {/* Ações de Exportação e Salvamento */}
        <div className="canva-topbar-actions">
          <button
            type="button"
            className="canva-action-btn"
            onClick={handleExportHtml}
            title="Baixar arquivo HTML com animações da mãozinha, menus suspensos e GIFs"
          >
            <FileDown size={15} />
            <span>Exportar HTML</span>
          </button>

          <button
            type="button"
            className="canva-action-btn primary"
            onClick={handlePrintPdf}
            title="Imprimir ou salvar em PDF de alta qualidade full bleed"
          >
            <Printer size={15} />
            <span>Imprimir PDF</span>
          </button>

          <button
            type="button"
            className={`canva-action-btn save ${initialProcedure?.status === 'ajustes_solicitados' ? 'resubmit' : ''}`}
            onClick={handleSave}
            disabled={saving || uploading}
          >
            <Save size={15} />
            <span>
              {saving
                ? 'Gravando...'
                : uploading
                ? 'Enviando foto...'
                : initialProcedure?.status === 'ajustes_solicitados'
                ? 'Reenviar para Revisão'
                : 'Salvar POP'}
            </span>
          </button>
        </div>
      </header>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="canva-toast-banner no-print">
          <Sparkles size={16} color="var(--red)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── MODO 1: STUDIO VISUAL CANVA COM PAINEL DE FERRAMENTAS ── */}
      {editorMode === 'canva' && (
        <div className="canva-workspace no-print">
          {/* Barra Lateral Esquerda: Gerenciador de Páginas e Miniaturas */}
          <aside className="canva-thumbnails-rail">
            <div className="thumbnails-header" style={{ position: 'relative' }}>
              <span className="thumbnails-title">Páginas ({slidesConfig.length})</span>
              <button
                type="button"
                className="btn-add-slide-mini"
                onClick={() => setShowAddPageMenu(!showAddPageMenu)}
                title="Adicionar nova página ao procedimento"
              >
                <Plus size={14} />
                <span>Página</span>
              </button>

              {/* Menu Suspenso de Seleção de Tipo de Página */}
              {showAddPageMenu && (
                <div
                  className="page-type-selector-menu"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    zIndex: 100,
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    minWidth: '200px',
                  }}
                >
                  <button
                    type="button"
                    className="page-type-opt-btn"
                    onClick={() => addPage('step')}
                  >
                    <Sliders size={13} color="var(--red)" />
                    <span>Nova Etapa Operacional</span>
                  </button>
                  <button
                    type="button"
                    className="page-type-opt-btn"
                    onClick={() => addPage('callout')}
                  >
                    <Info size={13} color="#3b82f6" />
                    <span>Boas Práticas (BPF)</span>
                  </button>
                  <button
                    type="button"
                    className="page-type-opt-btn"
                    onClick={() => addPage('checklist')}
                  >
                    <CheckSquare size={13} color="#10b981" />
                    <span>Checklist de Validação</span>
                  </button>
                  <button
                    type="button"
                    className="page-type-opt-btn"
                    onClick={() => addPage('signatures')}
                  >
                    <Award size={13} color="#f59e0b" />
                    <span>Homologação / Assinaturas</span>
                  </button>
                  <button
                    type="button"
                    className="page-type-opt-btn"
                    onClick={() => addPage('cover')}
                  >
                    <Layers size={13} color="#a855f7" />
                    <span>Capa Editorial</span>
                  </button>
                  <button
                    type="button"
                    className="page-type-opt-btn"
                    onClick={() => addPage('custom')}
                  >
                    <FileText size={13} color="#94a3b8" />
                    <span>Página Livre</span>
                  </button>
                </div>
              )}
            </div>

            <div className="thumbnails-scroll-list">
              {slidesConfig.map((slide, idx) => {
                const isCurrentActive = idx === safeActiveSlideIndex;
                const slideTitle = getSlideTitle(slide, idx);

                return (
                  <div
                    key={slide.id || `thumb-${idx}`}
                    className={`thumb-card ${isCurrentActive ? 'active' : ''}`}
                    onClick={() => {
                      setActiveSlideIndex(idx);
                      setSelectedIndicatorId(null);
                    }}
                  >
                    <span className="thumb-num">{String(idx + 1).padStart(2, '0')}</span>
                    <div className="thumb-preview">
                      <strong style={{ fontSize: '0.78rem' }}>{slideTitle}</strong>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                        {slide.slideType.toUpperCase()}
                      </span>
                    </div>

                    {/* Ações Rápidas da Miniatura: Mover Cima / Baixo e Deletar QUALQUER página */}
                    <div className="thumb-actions-hover">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          movePage(idx, idx - 1);
                        }}
                        title="Mover para cima"
                        style={{ opacity: idx === 0 ? 0.3 : 1 }}
                      >
                        <ArrowUp size={11} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === slidesConfig.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          movePage(idx, idx + 1);
                        }}
                        title="Mover para baixo"
                        style={{ opacity: idx === slidesConfig.length - 1 ? 0.3 : 1 }}
                      >
                        <ArrowDown size={11} />
                      </button>
                      <button
                        type="button"
                        disabled={slidesConfig.length <= 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePage(idx);
                        }}
                        title="Excluir esta página"
                        style={{ opacity: slidesConfig.length <= 1 ? 0.3 : 1 }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Área Central: Visual Stage / Canvas do Slide Ativo */}
          <main className="canva-center-stage">
            {/* Barra de Ferramentas de Design do Canva (Mãozinhas, Setas, Formas, Textos, Ícones, Dropdown) */}
            <div className="canva-design-tools">
              {/* Mãozinhas */}
              <div className="tool-group">
                <span className="tool-label">Mãozinhas:</span>
                <button
                  type="button"
                  className="canva-tool-btn"
                  onClick={() => addPointingHand('up')}
                  title="Mãozinha Acima"
                >
                  <span className="emoji-tool">👆</span>
                  <span>Acima</span>
                </button>
                <button
                  type="button"
                  className="canva-tool-btn"
                  onClick={() => addPointingHand('right')}
                  title="Mãozinha Direita"
                >
                  <span className="emoji-tool">👉</span>
                  <span>Direita</span>
                </button>
                <button
                  type="button"
                  className="canva-tool-btn"
                  onClick={() => addPointingHand('down')}
                  title="Mãozinha Abaixo"
                >
                  <span className="emoji-tool">👇</span>
                  <span>Abaixo</span>
                </button>
              </div>

              {/* Setas */}
              <div className="tool-group">
                <span className="tool-label">Setas:</span>
                <button
                  type="button"
                  className="canva-tool-btn"
                  onClick={() => addArrow('right')}
                  title="Seta Direita"
                >
                  <ArrowRight size={13} color="var(--red)" />
                  <span>Direita</span>
                </button>
                <button
                  type="button"
                  className="canva-tool-btn"
                  onClick={() => addArrow('down')}
                  title="Seta Abaixo"
                >
                  <ArrowDown size={13} color="var(--red)" />
                  <span>Abaixo</span>
                </button>
              </div>

              {/* Formas Geométricas */}
              <div className="tool-group">
                <span className="tool-label">Formas:</span>
                <button
                  type="button"
                  className="canva-tool-btn"
                  onClick={() => addRectangle('outline')}
                  title="Moldura Vazada Neon"
                >
                  <Square size={13} color="var(--red)" />
                  <span>Moldura</span>
                </button>
                <button
                  type="button"
                  className="canva-tool-btn"
                  onClick={() => addRectangle('filled')}
                  title="Caixa Preenchida"
                >
                  <Square size={13} fill="var(--red)" color="var(--red)" />
                  <span>Caixa</span>
                </button>
                <button
                  type="button"
                  className="canva-tool-btn"
                  onClick={() => addCircle('outline')}
                  title="Círculo Vazado"
                >
                  <Circle size={13} color="var(--red)" />
                  <span>Círculo</span>
                </button>
                <button
                  type="button"
                  className="canva-tool-btn"
                  onClick={() => addCircle('filled')}
                  title="Bolinha Preenchida"
                >
                  <Circle size={13} fill="var(--red)" color="var(--red)" />
                  <span>Bolinha</span>
                </button>
              </div>

              {/* Textos & Badges */}
              <div className="tool-group">
                <span className="tool-label">Textos:</span>
                <button
                  type="button"
                  className="canva-tool-btn"
                  onClick={() => addBadge()}
                  title="Badge de Alerta"
                >
                  <span className="badge-sample-tag">TAG</span>
                  <span>Badge</span>
                </button>
                <button
                  type="button"
                  className="canva-tool-btn"
                  onClick={() => addTextBox()}
                  title="Caixa de Texto Livre"
                >
                  <Type size={13} />
                  <span>Texto</span>
                </button>
              </div>

              {/* Ícones */}
              <div className="tool-group">
                <span className="tool-label">Ícones:</span>
                <button
                  type="button"
                  className="canva-tool-btn"
                  onClick={() => addIcon('target')}
                  title="Ícone Alvo"
                >
                  <Target size={13} color="#f59e0b" />
                </button>
                <button
                  type="button"
                  className="canva-tool-btn"
                  onClick={() => addIcon('cursor')}
                  title="Ícone Cursor"
                >
                  <MousePointer size={13} color="#3b82f6" />
                </button>
                <button
                  type="button"
                  className="canva-tool-btn"
                  onClick={() => addIcon('alert')}
                  title="Ícone Alerta"
                >
                  <AlertTriangle size={13} color="#ef4444" />
                </button>
                <button
                  type="button"
                  className="canva-tool-btn"
                  onClick={() => addIcon('star')}
                  title="Ícone Estrela"
                >
                  <Star size={13} color="#eab308" fill="#eab308" />
                </button>
              </div>

              {/* Recursos Interativos (Dropdown, Radar, GIF) */}
              <div className="tool-group">
                <span className="tool-label">Dinâmico:</span>
                <button
                  type="button"
                  className="canva-tool-btn"
                  onClick={() => addDropdown()}
                  title="Menu Suspenso (Dropdown Interativo no HTML)"
                >
                  <ChevronDown size={13} />
                  <span>Menu Suspenso</span>
                </button>
                <button
                  type="button"
                  className="canva-tool-btn"
                  onClick={() => addSpotlightBeacon()}
                  title="Anel Radar Pulsante"
                >
                  <Circle size={13} color="var(--red)" />
                  <span>Radar</span>
                </button>
                <button
                  type="button"
                  className="canva-tool-btn"
                  onClick={() => addAnimatedGif()}
                  title="Adicionar GIF animado"
                >
                  <Sparkles size={13} color="#f59e0b" />
                  <span>GIF</span>
                </button>
              </div>

              {/* Alternar Fundo do Slide */}
              <div className="tool-group" style={{ marginLeft: 'auto' }}>
                <button
                  type="button"
                  className="canva-tool-btn"
                  onClick={toggleSlideTheme}
                  title="Alternar entre fundo Escuro e Claro"
                >
                  <Palette size={13} />
                  <span>Alternar Fundo</span>
                </button>
              </div>
            </div>

            {/* Dica de Colagem Rápida Ctrl+V e Atalho Delete */}
            <div className="canva-paste-indicator">
              <ClipboardPaste size={15} color="var(--red)" />
              <span>
                <strong>Dica Pro:</strong> Copie prints com <kbd>Win + Shift + S</kbd> e pressione <kbd>Ctrl + V</kbd> para colar direto nesta etapa. Selecione qualquer elemento e aperte <kbd>Delete</kbd> para apagar.
              </span>
            </div>

            {renderPropertyBar()}

            {/* Visual Canvas do Slide Ativo */}
            <div className="canva-slide-viewport">
              {currentSlide && renderSlideContent(currentSlide, safeActiveSlideIndex, true, true)}
            </div>
          </main>
        </div>
      )}

      {/* ── MODO 2: PREVIEW DE IMPRESSÃO DO MANUAL EM SLIDES ── */}
      {editorMode === 'pdf-preview' && (
        <div className="canva-pdf-preview-container">
          <div className="pdf-preview-hint no-print">
            <span>
              📄 <strong>Modo Preview de Impressão:</strong> Você está visualizando o layout final de impressão no padrão A4 Paisagem moderno. Todos os textos e elementos são editáveis diretamente nos slides!
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn secondary sm" onClick={handleExportHtml}>
                <FileDown size={14} /> Exportar HTML
              </button>
              <button type="button" className="btn primary sm" onClick={handlePrintPdf}>
                <Printer size={14} /> Imprimir / PDF
              </button>
            </div>
          </div>

          {selectedIndicator && (
            <div style={{ maxWidth: '1120px', margin: '0 auto 16px auto', width: '100%' }}>
              {renderPropertyBar()}
            </div>
          )}

          {renderPresentationManual(true)}
        </div>
      )}

      {/* ── DOCUMENTO OFICIAL DE IMPRESSÃO (SEMPRE MONTADO NO DOM NO FORMATO A4 OFICIAL) ── */}
      {editorMode === 'canva' && (
        <div className="canva-print-mount-offscreen">
          {renderPresentationManual(false)}
        </div>
      )}
    </div>
  );
};
