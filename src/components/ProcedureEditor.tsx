import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Printer,
  Eye,
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
} from '../types/procedure';
import type { AppUser } from '../types/auth';
import { uploadProcedureImage } from '../lib/supabase';
import { downloadProcedureHtml } from '../lib/htmlExporter';

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
      ? 45
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
  const [editorMode, setEditorMode] = useState<'canva' | 'pdf-preview'>('canva');

  // Metadados Gerais
  const [title, setTitle] = useState(initialProcedure?.title || 'Novo Procedimento Operacional Padrão');
  const [subtitle, setSubtitle] = useState(
    initialProcedure?.subtitle || 'Procedimento Operacional Padrão e Roteiro de Treinamento do Digifarma ERP'
  );
  const [systemPath] = useState(
    initialProcedure?.systemPath || 'Digifarma V10 ➔ Treinamento Operacional'
  );
  const [systemVersion] = useState<SystemVersion | 'ambos'>(
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

  // Imagens associadas às etapas
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

  // Configurações de Slides & Indicadores (Mãozinhas, Spotlights, Setas, Formas, Cores)
  const [slidesConfig, setSlidesConfig] = useState<SlideConfig[]>(
    initialProcedure?.slidesConfig || [
      { id: 'slide-cover', slideType: 'cover', bgTheme: 'deep' },
      {
        id: 'slide-step-0',
        slideType: 'step',
        stepIndex: 0,
        bgTheme: 'light',
        indicators: [
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
        ],
      },
      { id: 'slide-bpf', slideType: 'callout', bgTheme: 'light' },
      { id: 'slide-checklist', slideType: 'checklist', bgTheme: 'light' },
      { id: 'slide-signatures', slideType: 'signatures', bgTheme: 'deep' },
    ]
  );

  // Slide Ativo no Modo Canva (0 = Capa, 1..N = Etapas, N+1 = BPF, N+2 = Checklist, N+3 = Assinaturas)
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

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
  }, [activeSlideIndex, steps.length]);

  const processPastedImageFile = async (file: File) => {
    setUploading(true);
    showToast('Processando print screen / imagem...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const stepIdx = activeSlideIndex === 0 ? 0 : Math.min(activeSlideIndex - 1, steps.length - 1);
      setImages((prev) => ({ ...prev, [stepIdx]: dataUrl }));

      showToast(`Imagem anexada com sucesso à Etapa ${(stepIdx + 1).toString().padStart(2, '0')}!`);
      setUploading(false);

      // Upload assíncrono para o Supabase Storage se disponível
      try {
        const publicUrl = await uploadProcedureImage(file);
        if (publicUrl) {
          setImages((prev) => ({ ...prev, [stepIdx]: publicUrl }));
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
  // ─────────────────────────────────────────────────────────────
  // 2. GESTÃO DE INDICADORES, FORMAS, ARRASTE & PROPRIEDADES (VINCULADO AO SLIDE ATIVO!)
  // ─────────────────────────────────────────────────────────────
  const currentStepIndex = activeSlideIndex === 0 ? 0 : Math.min(activeSlideIndex - 1, steps.length - 1);
  const currentStep = steps[currentStepIndex];

  // Helper universal para obter as configurações do slide atual (0=Capa, 1..N=Etapas, N+1=BPF, N+2=Checklist, N+3=Assinaturas)
  const getSlideConfigForIndex = (slideIdx: number): SlideConfig | undefined => {
    if (slideIdx === 0) {
      return slidesConfig.find((s) => s.slideType === 'cover' || s.id === 'slide-cover');
    }
    if (slideIdx <= steps.length) {
      const stepIdx = slideIdx - 1;
      return slidesConfig.find((s) => s.stepIndex === stepIdx || s.id === `slide-step-${stepIdx}`);
    }
    if (slideIdx === steps.length + 1) {
      return slidesConfig.find((s) => s.slideType === 'callout' || s.id === 'slide-bpf');
    }
    if (slideIdx === steps.length + 2) {
      return slidesConfig.find((s) => s.slideType === 'checklist' || s.id === 'slide-checklist');
    }
    return slidesConfig.find((s) => s.slideType === 'signatures' || s.id === 'slide-signatures');
  };

  const getIndicatorsForSlideIndex = (slideIdx: number): SlideIndicator[] => {
    const cfg = getSlideConfigForIndex(slideIdx);
    return cfg?.indicators || [];
  };

  const updateIndicatorsForSlideIndex = (
    slideIdx: number,
    updater: (current: SlideIndicator[]) => SlideIndicator[]
  ) => {
    const isCover = slideIdx === 0;
    const isStep = slideIdx >= 1 && slideIdx <= steps.length;
    const isBpf = slideIdx === steps.length + 1;
    const isChecklist = slideIdx === steps.length + 2;
    const isSignatures = slideIdx === steps.length + 3;

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

    const slideType = isCover
      ? 'cover'
      : isStep
      ? 'step'
      : isBpf
      ? 'callout'
      : isChecklist
      ? 'checklist'
      : 'signatures';

    setSlidesConfig((prev) => {
      const existingIdx = prev.findIndex((s) => {
        if (isCover) return s.slideType === 'cover' || s.id === 'slide-cover';
        if (isStep) return s.stepIndex === stepIdx || s.id === `slide-step-${stepIdx}`;
        if (isBpf) return s.slideType === 'callout' || s.id === 'slide-bpf';
        if (isChecklist) return s.slideType === 'checklist' || s.id === 'slide-checklist';
        if (isSignatures) return s.slideType === 'signatures' || s.id === 'slide-signatures';
        return false;
      });

      if (existingIdx !== -1) {
        const copy = [...prev];
        copy[existingIdx] = {
          ...copy[existingIdx],
          indicators: updater(copy[existingIdx].indicators || []),
        };
        return copy;
      } else {
        return [
          ...prev,
          {
            id: targetId,
            slideType,
            stepIndex: stepIdx,
            bgTheme: isCover || isSignatures ? 'deep' : 'light',
            indicators: updater([]),
          },
        ];
      }
    });
  };

  // Adicionar Indicador com auto-seleção e vinculação DIRETA ao slide selecionado
  const pushIndicator = (indicator: SlideIndicator, toastMsg?: string) => {
    updateIndicatorsForSlideIndex(activeSlideIndex, (list) => [...list, indicator]);
    setSelectedIndicatorId(indicator.id);
    if (toastMsg) showToast(toastMsg);
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
      },
      `Mãozinha indicadora (${direction}) adicionada ao slide atual!`
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
      },
      fillMode === 'outline' ? 'Círculo vazado adicionado!' : 'Bolinha destacada adicionada!'
    );
  };

  // Badges (Zero prompts: cria e abre na barra de propriedades)
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
      },
      'Badge criada! Edite o texto e a cor na barra acima.'
    );
  };

  // Caixa de Texto Livre com Fonte e Cores customizáveis
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
      },
      `Ícone (${iconName}) adicionado!`
    );
  };

  // Menu Suspenso Interativo Completo com Opções Customizáveis
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
      },
      'Radar sonar pulsante adicionado!'
    );
  };

  // GIF Animado (com preset instantâneo ou link)
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
      },
      'GIF animado anexado!'
    );
  };

  // Atualizar indicador selecionado no slide ativo
  const updateSelectedIndicator = (updates: Partial<SlideIndicator>) => {
    if (!selectedIndicatorId) return;
    updateIndicatorsForSlideIndex(activeSlideIndex, (list) =>
      list.map((ind) => (ind.id === selectedIndicatorId ? { ...ind, ...updates } : ind))
    );
  };

  // Remover indicador (com feedback in-site, zero confirm de navegador)
  const removeIndicator = (indId: string) => {
    updateIndicatorsForSlideIndex(activeSlideIndex, (list) => list.filter((i) => i.id !== indId));
    if (selectedIndicatorId === indId) {
      setSelectedIndicatorId(null);
    }
    showToast('Elemento removido.');
  };

  // Arraste Suave de Indicadores pelo Mouse (Drag & Drop na Tela)
  const handleIndicatorMouseDown = (e: React.MouseEvent, indId: string) => {
    e.stopPropagation();
    setSelectedIndicatorId(indId);

    const frame = shotframeRef.current;
    if (!frame) return;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const rect = frame.getBoundingClientRect();
      const x = Math.max(2, Math.min(98, Math.round(((moveEvent.clientX - rect.left) / rect.width) * 100)));
      const y = Math.max(2, Math.min(98, Math.round(((moveEvent.clientY - rect.top) / rect.height) * 100)));

      updateIndicatorsForSlideIndex(activeSlideIndex, (list) =>
        list.map((ind) => (ind.id === indId ? { ...ind, x, y } : ind))
      );
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Clique no Shotframe para Desmarcar ou Reposicionar
  const handleShotframeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    if (selectedIndicatorId) {
      // Reposiciona o elemento selecionado no ponto clicado
      updateSelectedIndicator({ x, y });
    }
  };

  // Alternar Cor / Tema do Slide Ativo (Deep Escuro vs Claro)
  const toggleSlideTheme = () => {
    setSlidesConfig((prev) => {
      const isCover = activeSlideIndex === 0;
      const isStep = activeSlideIndex >= 1 && activeSlideIndex <= steps.length;
      const stepIdx = isStep ? activeSlideIndex - 1 : undefined;

      return prev.map((s) => {
        const matches =
          (isCover && (s.slideType === 'cover' || s.id === 'slide-cover')) ||
          (isStep && (s.stepIndex === stepIdx || s.id === `slide-step-${stepIdx}`)) ||
          (activeSlideIndex === steps.length + 1 && (s.slideType === 'callout' || s.id === 'slide-bpf')) ||
          (activeSlideIndex === steps.length + 2 && (s.slideType === 'checklist' || s.id === 'slide-checklist')) ||
          (activeSlideIndex === steps.length + 3 && (s.slideType === 'signatures' || s.id === 'slide-signatures'));

        if (matches) {
          const next = s.bgTheme === 'deep' || s.bgTheme === 'dark' ? 'light' : 'deep';
          return { ...s, bgTheme: next };
        }
        return s;
      });
    });
  };

  // ─────────────────────────────────────────────────────────────
  // 3. GESTÃO DE ETAPAS (ADICIONAR / REMOVER / REORDENAR)
  // ─────────────────────────────────────────────────────────────
  const addStep = () => {
    const newStepNum = steps.length + 1;
    const newStep: StepBlock = {
      id: `step-${Date.now()}-${newStepNum}`,
      type: 'step',
      title: `Nova Etapa ${newStepNum}: Roteiro Operacional`,
      content: 'Instrução do passo a passo no sistema Digifarma.',
      instruction: 'Descreva a validação necessária e os botões que devem ser acionados nesta etapa.',
      expectedResult: 'Registro processado e confirmado com sucesso no banco de dados.',
      tips: 'Atalho ou dica operacional para maior agilidade.',
      completed: false,
    };

    setSteps([...steps, newStep]);
    setSlidesConfig([
      ...slidesConfig,
      {
        id: `slide-step-${steps.length}`,
        slideType: 'step',
        stepIndex: steps.length,
        bgTheme: 'light',
        indicators: [],
      },
    ]);
    setActiveSlideIndex(steps.length + 1);
    showToast(`Etapa ${newStepNum} criada!`);
  };

  const removeStep = (indexToRemove: number) => {
    if (steps.length <= 1) {
      showToast('O procedimento deve conter pelo menos uma etapa operacional.');
      return;
    }
    const updated = steps.filter((_, idx) => idx !== indexToRemove);
    setSteps(updated);

    const updatedImgs: Record<number, string> = {};
    Object.entries(images).forEach(([k, v]) => {
      const idx = Number(k);
      if (idx < indexToRemove) updatedImgs[idx] = v;
      else if (idx > indexToRemove) updatedImgs[idx - 1] = v;
    });
    setImages(updatedImgs);

    if (activeSlideIndex > updated.length) {
      setActiveSlideIndex(updated.length);
    }
    showToast('Etapa excluída.');
  };

  const moveStep = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= steps.length) return;
    const updated = [...steps];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setSteps(updated);

    const remappedImgs: Record<number, string> = {};
    if (images[fromIdx]) remappedImgs[toIdx] = images[fromIdx];
    if (images[toIdx]) remappedImgs[fromIdx] = images[toIdx];
    Object.entries(images).forEach(([k, v]) => {
      const n = Number(k);
      if (n !== fromIdx && n !== toIdx) remappedImgs[n] = v;
    });
    setImages(remappedImgs);

    setActiveSlideIndex(toIdx + 1);
  };

  // ─────────────────────────────────────────────────────────────
  // 4. PERSISTÊNCIA, EXPORTAÇÃO DUPLA & IMPRESSÃO
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
    const historyItem: ProcedureHistoryItem = {
      id: `hist-${Date.now()}`,
      action: initialProcedure ? 'update' : 'create',
      timestamp: nowIso,
      user: currentUser?.name || currentUser?.username || 'Leonardo Trevas',
      description: initialProcedure
        ? `Atualização completa via Studio Canva por ${currentUser?.name || 'Gestor'}`
        : `Elaboração e homologação via Studio Canva por ${currentUser?.name || 'Gestor'}`,
    };

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
      updatedBy: currentUser?.name || currentUser?.username || 'Leonardo Trevas',
      history: [historyItem, ...(initialProcedure?.history || [])],
      tags: [systemVersion === 'v10' ? 'Digifarma V10' : 'Digifarma R78', systemCategory, 'BPF'],
      blocks,
      slidesConfig,
      created_at: initialProcedure?.created_at || nowIso,
      updated_at: nowIso,
    };
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const proc = constructProcedureToSave();
      await onSave(proc);
      showToast('Procedimento salvo com sucesso!');
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

  const handlePrintPdf = () => {
    const originalTitle = document.title;
    document.title = '';
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1200);
  };

  const totalSlidesCount = 1 + steps.length + 3;

  // Elemento atualmente selecionado para a barra flutuante de propriedades
  const activeSlideIndicators = getIndicatorsForSlideIndex(activeSlideIndex);
  const selectedIndicator = activeSlideIndicators.find((i) => i.id === selectedIndicatorId);

  // ─────────────────────────────────────────────────────────────
  // 5. RENDERIZADOR UNIVERSAL DE INDICADORES (STAGE & PRINT)
  // ─────────────────────────────────────────────────────────────
  const renderIndicatorItem = (
    ind: SlideIndicator,
    isInteractive: boolean = false
  ) => {
    const isSelected = selectedIndicatorId === ind.id;
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
          transform: 'translate(-50%, -50%)',
          cursor: isInteractive ? 'grab' : 'default',
          zIndex: isSelected ? 35 : 20,
          userSelect: 'none',
        }}
        onMouseDown={isInteractive ? (e) => handleIndicatorMouseDown(e, ind.id) : undefined}
        onClick={isInteractive ? (e) => {
          e.stopPropagation();
          setSelectedIndicatorId(ind.id);
        } : undefined}
      >
        {/* Botão de exclusão "X" diretamente no elemento para remoção imediata */}
        {isInteractive && (
          <button
            type="button"
            className="indicator-corner-delete-btn no-print"
            onClick={(e) => {
              e.stopPropagation();
              removeIndicator(ind.id);
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
  // 6. RENDERIZADOR DO DOCUMENTO OFICIAL A4 (PREVIEW & PRINT)
  // ─────────────────────────────────────────────────────────────
  const renderPresentationManual = (isEditable: boolean) => {
    return (
      <div className="presentation-manual-root" id="printable-procedure">
        {/* Página 1: Capa Editorial */}
        <section className="slide deep cover" style={{ position: 'relative' }}>
          <div className="inner">
            <div className="logo">
              <span className="a">Digi</span>
              <span className="b">farma</span>
            </div>
            <div className="v10-badge">
              {systemVersion === 'v10' ? 'DIGIFARMA V10' : 'DIGIFARMA R78'}
            </div>
            <h1
              className="display"
              contentEditable={isEditable}
              suppressContentEditableWarning
              onBlur={(e) => setTitle(e.currentTarget.textContent || title)}
            >
              {title}
            </h1>
            <p
              className="lead"
              contentEditable={isEditable}
              suppressContentEditableWarning
              onBlur={(e) => setSubtitle(e.currentTarget.textContent || subtitle)}
            >
              {subtitle}
            </p>

            <div className="stats">
              <div className="stat">
                <div className="n">{steps.length}<small>etapas</small></div>
                <div className="l">Roteiro operacional documentado</div>
              </div>
              <div className="stat">
                <div className="n">100<small>%</small></div>
                <div className="l">Conformidade com Boas Práticas (BPF)</div>
              </div>
              <div className="stat">
                <div className="n">{menus.find((m) => m.id === menuId)?.label || 'Cadastros'}</div>
                <div className="l">Módulo integrado do sistema</div>
              </div>
              <div className="stat">
                <div className="n">{author}</div>
                <div className="l">Responsável técnico / elaboração</div>
              </div>
            </div>
          </div>

          {/* Renderização de todos os indicadores adicionados na Capa */}
          {getIndicatorsForSlideIndex(0).map((ind) => renderIndicatorItem(ind, isEditable))}
        </section>

        {/* Páginas 2..N: Etapas Operacionais com Shotframes e Formas */}
        {steps.map((step, idx) => {
          const stepNum = String(idx + 1).padStart(2, '0');
          const imgUrl = images[idx];
          const indicators = getIndicatorsForSlideIndex(idx + 1);
          const slideCfg = getSlideConfigForIndex(idx + 1);
          const isDark = slideCfg?.bgTheme === 'deep' || slideCfg?.bgTheme === 'dark';

          return (
            <section key={step.id} className={`slide ${isDark ? 'deep' : 'light'} step-slide`}>
              <div className="inner">
                <p className="eyebrow">
                  <span>ETAPA {stepNum}</span> · Digifarma Treinamento
                </p>

                <h2
                  className="head"
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const val = e.currentTarget.textContent || step.title;
                    setSteps((prev) =>
                      prev.map((s, sIdx) => (sIdx === idx ? { ...s, title: val } : s))
                    );
                  }}
                >
                  {step.title}
                </h2>

                <p
                  className="lead"
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const val = e.currentTarget.textContent || step.instruction || step.content || '';
                    setSteps((prev) =>
                      prev.map((s, sIdx) =>
                        sIdx === idx ? { ...s, instruction: val, content: val } : s
                      )
                    );
                  }}
                >
                  {step.instruction || step.content}
                </p>

                <div className="feature-split">
                  <div className="feature-left">
                    {step.expectedResult && (
                      <div className="fitem">
                        <div className="fico">✓</div>
                        <div className="ftxt">
                          <h4>Resultado Esperado</h4>
                          <p>{step.expectedResult}</p>
                        </div>
                      </div>
                    )}

                    {step.tips && (
                      <div className="fitem">
                        <div className="fico">💡</div>
                        <div className="ftxt">
                          <h4>Dica de Agilidade</h4>
                          <p>{step.tips}</p>
                        </div>
                      </div>
                    )}

                    {step.warnings && (
                      <div className="fitem warning">
                        <div className="fico">⚠️</div>
                        <div className="ftxt">
                          <h4 style={{ color: '#d97706' }}>Ponto Crítico</h4>
                          <p>{step.warnings}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="shotframe">
                    <div className="frame">
                      {imgUrl ? (
                        <img src={imgUrl} alt={step.title} />
                      ) : (
                        <div style={{ color: '#94a3b8', padding: '36px', textAlign: 'center' }}>
                          Captura de Tela do Digifarma
                        </div>
                      )}

                      {/* Renderização de todos os indicadores na folha oficial */}
                      {indicators.map((ind) => renderIndicatorItem(ind, isEditable))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })}

        {/* Página BPF / Diretrizes */}
        <section className="slide light" style={{ position: 'relative' }}>
          <div className="inner">
            <p className="eyebrow">
              <span>BPF</span> · Boas Práticas &amp; Diretrizes
            </p>
            <h2 className="head">Orientações de Segurança &amp; Auditoria</h2>
            <p className="lead">
              Recomendações técnicas homologadas para garantia da qualidade operacional.
            </p>

            <div style={{ marginTop: '28px' }}>
              {callouts.map((c, cIdx) => (
                <div key={c.id} className="fitem" style={{ marginBottom: '16px' }}>
                  <div className="fico">
                    <Info size={22} color="var(--red)" />
                  </div>
                  <div className="ftxt">
                    <h4
                      contentEditable={isEditable}
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const val = e.currentTarget.textContent || c.title || '';
                        setCallouts((prev) =>
                          prev.map((item, idx) => (idx === cIdx ? { ...item, title: val } : item))
                        );
                      }}
                    >
                      {c.title}
                    </h4>
                    <p
                      contentEditable={isEditable}
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const val = e.currentTarget.textContent || c.content;
                        setCallouts((prev) =>
                          prev.map((item, idx) => (idx === cIdx ? { ...item, content: val } : item))
                        );
                      }}
                    >
                      {c.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Renderização de todos os indicadores no slide BPF */}
          {getIndicatorsForSlideIndex(steps.length + 1).map((ind) => renderIndicatorItem(ind, isEditable))}
        </section>

        {/* Página Checklist */}
        <section className="slide light" style={{ position: 'relative' }}>
          <div className="inner">
            <p className="eyebrow">
              <span>CHECKLIST</span> · Homologação
            </p>
            <h2 className="head">Checklist de Auditoria Operacional</h2>
            <p className="lead">
              Validação obrigatória de cada uma das {steps.length} etapas cadastradas.
            </p>

            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {steps.map((s, i) => (
                <div key={s.id} className="canva-check-row">
                  <div className="canva-check-circle">✓</div>
                  <div>
                    <strong>
                      Etapa {(i + 1).toString().padStart(2, '0')}: {s.title}
                    </strong>
                    <p>{s.expectedResult || 'Validação de tela confirmada.'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Renderização de todos os indicadores no slide Checklist */}
          {getIndicatorsForSlideIndex(steps.length + 2).map((ind) => renderIndicatorItem(ind, isEditable))}
        </section>

        {/* Página Final: Homologação & Assinaturas */}
        <section className="slide deep" style={{ position: 'relative' }}>
          <div className="inner">
            <div className="logo">
              <span className="a">Digi</span>
              <span className="b">farma</span>
            </div>
            <div className="v10-badge">HOMOLOGAÇÃO OFICIAL</div>
            <h1 className="display" style={{ fontSize: '38px' }}>
              Controle da Qualidade &amp; BPF
            </h1>
            <p className="lead">
              Procedimento validado e arquivado para fiscalização sanitária e instrução de trabalho.
            </p>

            <div className="print-signatures-grid" style={{ marginTop: '48px' }}>
              <div className="print-sign-col">
                <span className="print-sign-title">ELABORADO POR</span>
                <div className="print-sign-line"></div>
                <span
                  className="print-sign-name"
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(e) => setAuthor(e.currentTarget.textContent || author)}
                >
                  {author}
                </span>
                <span className="print-sign-role">Digifarma Sistemas</span>
              </div>

              <div className="print-sign-col">
                <span className="print-sign-title">REVISADO POR</span>
                <div className="print-sign-line"></div>
                <span className="print-sign-name">Garantia da Qualidade (BPF)</span>
                <span className="print-sign-role">Controle de Procedimentos</span>
              </div>

              <div className="print-sign-col">
                <span className="print-sign-title">APROVADO POR</span>
                <div className="print-sign-line"></div>
                <span className="print-sign-name">Leonardo Henrique B. Trevas</span>
                <span className="print-sign-role">Responsável Técnico / Gestor</span>
              </div>
            </div>
          </div>

          {/* Renderização de todos os indicadores no slide Assinaturas */}
          {getIndicatorsForSlideIndex(steps.length + 3).map((ind) => renderIndicatorItem(ind, isEditable))}
        </section>
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
                {systemVersion === 'v10' ? 'DIGIFARMA V10' : 'DIGIFARMA R78'}
              </span>
              <span className="canva-path-text">{systemPath}</span>
            </div>
          </div>
        </div>

        {/* Alternador de Modos: Studio Canva vs PDF Embutido */}
        <div className="canva-mode-switcher">
          <button
            type="button"
            className={`canva-mode-btn ${editorMode === 'canva' ? 'active' : ''}`}
            onClick={() => setEditorMode('canva')}
          >
            <Palette size={14} />
            <span>Studio Canva</span>
          </button>

          <button
            type="button"
            className={`canva-mode-btn ${editorMode === 'pdf-preview' ? 'active' : ''}`}
            onClick={() => setEditorMode('pdf-preview')}
          >
            <Eye size={14} />
            <span>Editor de PDF Embutido</span>
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
            className="canva-action-btn save"
            onClick={handleSave}
            disabled={saving || uploading}
          >
            <Save size={15} />
            <span>{saving ? 'Gravando...' : uploading ? 'Enviando foto...' : 'Salvar POP'}</span>
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
          {/* Barra Lateral Esquerda: Miniaturas dos Slides (Thumbnails) */}
          <aside className="canva-thumbnails-rail">
            <div className="thumbnails-header">
              <span className="thumbnails-title">Slides ({totalSlidesCount})</span>
              <button
                type="button"
                className="btn-add-slide-mini"
                onClick={addStep}
                title="Adicionar nova etapa operacional"
              >
                <Plus size={14} />
                <span>Etapa</span>
              </button>
            </div>

            <div className="thumbnails-scroll-list">
              {/* Slide 0: Capa */}
              <div
                className={`thumb-card ${activeSlideIndex === 0 ? 'active' : ''}`}
                onClick={() => {
                  setActiveSlideIndex(0);
                  setSelectedIndicatorId(null);
                }}
              >
                <span className="thumb-num">01</span>
                <div className="thumb-preview cover-preview">
                  <strong>Capa Editorial</strong>
                  <span>{title.slice(0, 32)}...</span>
                </div>
              </div>

              {/* Slides 1..N: Etapas */}
              {steps.map((step, idx) => (
                <div
                  key={step.id}
                  className={`thumb-card ${activeSlideIndex === idx + 1 ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSlideIndex(idx + 1);
                    setSelectedIndicatorId(null);
                  }}
                >
                  <span className="thumb-num">{String(idx + 2).padStart(2, '0')}</span>
                  <div className="thumb-preview">
                    <strong>Etapa {(idx + 1).toString().padStart(2, '0')}</strong>
                    <span>{step.title || 'Sem título'}</span>
                    {images[idx] && <span className="thumb-badge-img">Tela</span>}
                  </div>
                  <div className="thumb-actions-hover">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveStep(idx, idx - 1);
                      }}
                      title="Mover para cima"
                    >
                      <ArrowUp size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveStep(idx, idx + 1);
                      }}
                      title="Mover para baixo"
                    >
                      <ArrowDown size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeStep(idx);
                      }}
                      title="Excluir etapa"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Slide BPF */}
              <div
                className={`thumb-card ${activeSlideIndex === steps.length + 1 ? 'active' : ''}`}
                onClick={() => {
                  setActiveSlideIndex(steps.length + 1);
                  setSelectedIndicatorId(null);
                }}
              >
                <span className="thumb-num">{String(steps.length + 2).padStart(2, '0')}</span>
                <div className="thumb-preview">
                  <strong>Boas Práticas BPF</strong>
                  <span>Alertas e Diretrizes</span>
                </div>
              </div>

              {/* Slide Checklist */}
              <div
                className={`thumb-card ${activeSlideIndex === steps.length + 2 ? 'active' : ''}`}
                onClick={() => {
                  setActiveSlideIndex(steps.length + 2);
                  setSelectedIndicatorId(null);
                }}
              >
                <span className="thumb-num">{String(steps.length + 3).padStart(2, '0')}</span>
                <div className="thumb-preview">
                  <strong>Checklist</strong>
                  <span>Auditoria Operacional</span>
                </div>
              </div>

              {/* Slide Assinaturas */}
              <div
                className={`thumb-card ${activeSlideIndex === steps.length + 3 ? 'active' : ''}`}
                onClick={() => {
                  setActiveSlideIndex(steps.length + 3);
                  setSelectedIndicatorId(null);
                }}
              >
                <span className="thumb-num">{String(steps.length + 4).padStart(2, '0')}</span>
                <div className="thumb-preview cover-preview">
                  <strong>Homologação</strong>
                  <span>Controle & Assinaturas</span>
                </div>
              </div>
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

            {/* Dica de Colagem Rápida Ctrl+V */}
            <div className="canva-paste-indicator">
              <ClipboardPaste size={15} color="var(--red)" />
              <span>
                <strong>Dica Pro:</strong> Copie qualquer print com <kbd>Win + Shift + S</kbd> e pressione{' '}
                <kbd>Ctrl + V</kbd> para colar direto nesta etapa! Arraste elementos livremente com o mouse.
              </span>
            </div>

            {/* ── BARRA FLUTUANTE DE PROPRIEDADES DO ELEMENTO SELECIONADO (IN-SITE, ZERO POPUPS) ── */}
            {selectedIndicator && (
              <div className="canva-element-property-bar no-print">
                <div className="prop-bar-label">
                  <span>
                    Propriedades: <strong>{selectedIndicator.type.toUpperCase()}</strong>
                  </span>
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

                {/* Estilo Vazado vs Preenchido (se rect ou circle) */}
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

                {/* Edição de Texto In-Place (para badge, text, dropdown) */}
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

                {/* Botão de Excluir Imediato (zero popups de navegador!) */}
                <div className="prop-bar-actions">
                  <button
                    type="button"
                    className="prop-btn-delete"
                    onClick={() => removeIndicator(selectedIndicator.id)}
                    title="Remover elemento da tela"
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

                {/* Gerenciador Completo de Opções do Menu Suspenso */}
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
            )}

            {/* Visual Canvas do Slide Ativo */}
            <div className="canva-slide-viewport">
              {/* Slide 0: Capa */}
              {activeSlideIndex === 0 && (
                <div
                  className="slide deep canva-slide-canvas"
                  ref={shotframeRef}
                  onClick={handleShotframeClick}
                  style={{ position: 'relative' }}
                >
                  <div className="inner">
                    <div className="logo">
                      <span className="a">Digi</span>
                      <span className="b">farma</span>
                    </div>

                    <div className="v10-badge">
                      {systemVersion === 'v10' ? 'DIGIFARMA V10' : 'DIGIFARMA R78'}
                    </div>

                    <input
                      type="text"
                      className="canva-inline-display-input"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Título Principal do Manual..."
                    />

                    <textarea
                      className="canva-inline-lead-input"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="Subtítulo ou resumo operacional da rotina..."
                      rows={2}
                    />

                    <div className="stats" style={{ marginTop: '36px' }}>
                      <div className="stat">
                        <div className="n">{steps.length || 1}<small>etapas</small></div>
                        <div className="l">Roteiro operacional documentado</div>
                      </div>
                      <div className="stat">
                        <div className="n">100<small>%</small></div>
                        <div className="l">Conformidade BPF &amp; Qualidade</div>
                      </div>
                      <div className="stat">
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
                        <div className="l">Módulo integrado do sistema</div>
                      </div>
                      <div className="stat">
                        <input
                          type="text"
                          value={author}
                          onChange={(e) => setAuthor(e.target.value)}
                          className="canva-inline-author-input"
                          placeholder="Autor / Responsável"
                        />
                        <div className="l">Responsável técnico / elaboração</div>
                      </div>
                    </div>
                  </div>

                  {/* Renderização de todos os indicadores no Canvas da Capa */}
                  {activeSlideIndicators.map((ind) => renderIndicatorItem(ind, true))}
                </div>
              )}

              {/* Slides 1..N: Etapas Operacionais com Shotframe Interativo */}
              {activeSlideIndex > 0 && activeSlideIndex <= steps.length && currentStep && (
                <div
                  className={`slide ${
                    slidesConfig.find((s) => s.stepIndex === currentStepIndex)?.bgTheme === 'deep'
                      ? 'deep'
                      : 'light'
                  } canva-slide-canvas`}
                >
                  <div className="inner">
                    <p className="eyebrow">
                      <span>ETAPA {String(currentStepIndex + 1).padStart(2, '0')}</span> · Roteiro Passo a Passo
                    </p>

                    <input
                      type="text"
                      className="canva-inline-head-input"
                      value={currentStep.title || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSteps((prev) =>
                          prev.map((s, idx) => (idx === currentStepIndex ? { ...s, title: val } : s))
                        );
                      }}
                      placeholder="Título da Etapa (ex: Acesso e Consulta de Lotes)..."
                    />

                    <textarea
                      className="canva-inline-lead-input light"
                      value={currentStep.instruction || currentStep.content}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSteps((prev) =>
                          prev.map((s, idx) =>
                            idx === currentStepIndex ? { ...s, instruction: val, content: val } : s
                          )
                        );
                      }}
                      placeholder="Instrução passo a passo detalhada para o operador..."
                      rows={2}
                    />

                    <div className="feature-split">
                      <div className="feature-left">
                        {/* Resultado Esperado */}
                        <div className="fitem">
                          <div className="fico">✓</div>
                          <div className="ftxt" style={{ flex: 1 }}>
                            <h4>Resultado Esperado</h4>
                            <input
                              type="text"
                              className="canva-inline-fitem-input"
                              value={currentStep.expectedResult || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSteps((prev) =>
                                  prev.map((s, idx) =>
                                    idx === currentStepIndex ? { ...s, expectedResult: val } : s
                                  )
                                );
                              }}
                              placeholder="O que deve acontecer após executar este passo..."
                            />
                          </div>
                        </div>

                        {/* Dica de Agilidade */}
                        <div className="fitem">
                          <div className="fico">💡</div>
                          <div className="ftxt" style={{ flex: 1 }}>
                            <h4>Dica de Agilidade</h4>
                            <input
                              type="text"
                              className="canva-inline-fitem-input"
                              value={currentStep.tips || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSteps((prev) =>
                                  prev.map((s, idx) =>
                                    idx === currentStepIndex ? { ...s, tips: val } : s
                                  )
                                );
                              }}
                              placeholder="Atalhos do teclado ou recomendações práticas..."
                            />
                          </div>
                        </div>

                        {/* Alerta Ponto Crítico */}
                        <div className="fitem warning">
                          <div className="fico">⚠️</div>
                          <div className="ftxt" style={{ flex: 1 }}>
                            <h4 style={{ color: '#d97706' }}>Ponto Crítico</h4>
                            <input
                              type="text"
                              className="canva-inline-fitem-input"
                              value={currentStep.warnings || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSteps((prev) =>
                                  prev.map((s, idx) =>
                                    idx === currentStepIndex ? { ...s, warnings: val } : s
                                  )
                                );
                              }}
                              placeholder="Atenção especial para evitar erros fiscais ou de caixa..."
                            />
                          </div>
                        </div>
                      </div>

                      {/* Shotframe com Suporte a Colar Imagem, Drag & Drop e Indicadores */}
                      <div className="shotframe">
                        <div
                          className="frame canva-interactive-frame"
                          ref={shotframeRef}
                          onClick={handleShotframeClick}
                          title="Clique na imagem para posicionar ou desmarcar. Arraste qualquer forma com o mouse!"
                        >
                          {images[currentStepIndex] ? (
                            <img
                              src={images[currentStepIndex]}
                              alt={currentStep.title}
                              className="canva-step-img"
                              draggable={false}
                            />
                          ) : (
                            <div className="canva-placeholder-drop">
                              <ImageIcon size={38} color="var(--red)" />
                              <strong>Nenhuma imagem anexada</strong>
                              <span>Cole um print com Ctrl+V ou clique no botão abaixo</span>
                            </div>
                          )}

                          {/* Renderização de todos os indicadores no Canvas do Studio */}
                          {activeSlideIndicators.map((ind) => renderIndicatorItem(ind, true))}
                        </div>

                        {/* Barra de Ações Rápidas da Imagem */}
                        <div className="shotframe-toolbar-bottom">
                          <button
                            type="button"
                            className="btn-shot-action"
                            onClick={() => handleManualUploadClick(currentStepIndex)}
                          >
                            <Upload size={13} />
                            <span>Importar Arquivo</span>
                          </button>

                          {images[currentStepIndex] && (
                            <button
                              type="button"
                              className="btn-shot-action danger"
                              onClick={() => {
                                setImages((prev) => {
                                  const copy = { ...prev };
                                  delete copy[currentStepIndex];
                                  return copy;
                                });
                              }}
                            >
                              <Trash2 size={13} />
                              <span>Remover Foto</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Slide BPF / Orientações */}
              {activeSlideIndex === steps.length + 1 && (
                <div
                  className="slide light canva-slide-canvas"
                  ref={shotframeRef}
                  onClick={handleShotframeClick}
                  style={{ position: 'relative' }}
                >
                  <div className="inner">
                    <p className="eyebrow">
                      <span>BPF</span> · Boas Práticas &amp; Diretrizes
                    </p>
                    <h2 className="head">Orientações de Segurança &amp; Auditoria</h2>
                    <p className="lead">
                      Recomendações técnicas homologadas para garantia da qualidade operacional.
                    </p>

                    <div className="canva-callouts-list" style={{ marginTop: '28px' }}>
                      {callouts.map((c, i) => (
                        <div key={c.id} className="fitem" style={{ marginBottom: '16px' }}>
                          <div className="fico">
                            <Info size={22} color="var(--red)" />
                          </div>
                          <div className="ftxt" style={{ flex: 1 }}>
                            <input
                              type="text"
                              className="canva-inline-head-input"
                              style={{ fontSize: '1.05rem', marginBottom: '4px' }}
                              value={c.title || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCallouts((prev) =>
                                  prev.map((item, idx) => (idx === i ? { ...item, title: val } : item))
                                );
                              }}
                              placeholder="Título da Diretriz..."
                            />
                            <textarea
                              className="canva-inline-lead-input light"
                              value={c.content}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCallouts((prev) =>
                                  prev.map((item, idx) => (idx === i ? { ...item, content: val } : item))
                                );
                              }}
                              placeholder="Texto explicativo da norma sanitária ou de controle..."
                              rows={2}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Renderização de todos os indicadores no Canvas do BPF */}
                  {activeSlideIndicators.map((ind) => renderIndicatorItem(ind, true))}
                </div>
              )}

              {/* Slide Checklist */}
              {activeSlideIndex === steps.length + 2 && (
                <div
                  className="slide light canva-slide-canvas"
                  ref={shotframeRef}
                  onClick={handleShotframeClick}
                  style={{ position: 'relative' }}
                >
                  <div className="inner">
                    <p className="eyebrow">
                      <span>CHECKLIST</span> · Homologação
                    </p>
                    <h2 className="head">Checklist de Auditoria Operacional</h2>
                    <p className="lead">
                      Validação obrigatória de cada uma das {steps.length} etapas cadastradas.
                    </p>

                    <div className="canva-checklist-preview" style={{ marginTop: '24px' }}>
                      {steps.map((s, i) => (
                        <div key={s.id} className="canva-check-row">
                          <div className="canva-check-circle">✓</div>
                          <div>
                            <strong>
                              Etapa {(i + 1).toString().padStart(2, '0')}: {s.title}
                            </strong>
                            <p>{s.expectedResult || 'Validação de tela confirmada.'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Renderização de todos os indicadores no Canvas do Checklist */}
                  {activeSlideIndicators.map((ind) => renderIndicatorItem(ind, true))}
                </div>
              )}

              {/* Slide Assinaturas */}
              {activeSlideIndex === steps.length + 3 && (
                <div
                  className="slide deep canva-slide-canvas"
                  ref={shotframeRef}
                  onClick={handleShotframeClick}
                  style={{ position: 'relative' }}
                >
                  <div className="inner">
                    <div className="logo">
                      <span className="a">Digi</span>
                      <span className="b">farma</span>
                    </div>
                    <div className="v10-badge">HOMOLOGAÇÃO OFICIAL</div>
                    <h1 className="display" style={{ fontSize: '38px' }}>
                      Controle da Qualidade &amp; BPF
                    </h1>
                    <p className="lead">
                      Procedimento validado e arquivado para fiscalização sanitária e instrução de trabalho.
                    </p>

                    <div className="print-signatures-grid" style={{ marginTop: '48px' }}>
                      <div className="print-sign-col">
                        <span className="print-sign-title">ELABORADO POR</span>
                        <div className="print-sign-line"></div>
                        <input
                          type="text"
                          value={author}
                          onChange={(e) => setAuthor(e.target.value)}
                          className="canva-inline-sign-input"
                          placeholder="Nome do Elaborador"
                        />
                        <span className="print-sign-role">Digifarma Sistemas</span>
                      </div>

                      <div className="print-sign-col">
                        <span className="print-sign-title">REVISADO POR</span>
                        <div className="print-sign-line"></div>
                        <span className="print-sign-name">Garantia da Qualidade (BPF)</span>
                        <span className="print-sign-role">Controle de Procedimentos</span>
                      </div>

                      <div className="print-sign-col">
                        <span className="print-sign-title">APROVADO POR</span>
                        <div className="print-sign-line"></div>
                        <span className="print-sign-name">Leonardo Henrique B. Trevas</span>
                        <span className="print-sign-role">Responsável Técnico / Gestor</span>
                      </div>
                    </div>
                  </div>

                  {/* Renderização de todos os indicadores no Canvas de Assinaturas */}
                  {activeSlideIndicators.map((ind) => renderIndicatorItem(ind, true))}
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {/* ── MODO 2: EDITOR DE PDF EMBUTIDO (PÁGINAS A4 REAIS EM TEMPO REAL) ── */}
      {editorMode === 'pdf-preview' && (
        <div className="canva-pdf-preview-container">
          <div className="pdf-preview-hint no-print">
            <span>
              📄 <strong>Modo Editor de PDF Embutido:</strong> Você está visualizando o layout final de impressão em folhas A4 reais. Todos os textos são editáveis diretamente nas páginas!
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

          {renderPresentationManual(true)}
        </div>
      )}

      {/* ── DOCUMENTO OFICIAL DE IMPRESSÃO (SEMPRE MONTADO NO DOM PARA IMPRIMIR DE QUALQUER MODO) ── */}
      {editorMode === 'canva' && (
        <div className="canva-print-mount-offscreen">
          {renderPresentationManual(false)}
        </div>
      )}
    </div>
  );
};
