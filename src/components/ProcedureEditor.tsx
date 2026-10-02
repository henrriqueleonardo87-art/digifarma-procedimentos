import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Smile,
  Shapes,
  Search,
  X as XIcon,
  GripVertical,
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
  SignatureColumn,
  OperationalItem,
  ChecklistItem,
  SlideStatItem,
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
  // ── RASCUNHO AUTOMÁTICO (PERSISTÊNCIA NO LOCALSTORAGE) ──
  const draftStorageKey = `digifarma_draft_${initialProcedure?.id || 'new'}`;
  const savedDraft = useMemo(() => {
    try {
      const raw = localStorage.getItem(draftStorageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [draftStorageKey]);

  const [menuId] = useState(
    savedDraft?.menuId || initialProcedure?.menuId || (menus[0]?.id || 'cadastros')
  );
  const [submenuId] = useState(initialProcedure?.submenuId || '');
  const [author] = useState(
    savedDraft?.author || initialProcedure?.author || currentUser?.name || currentUser?.username || 'Leonardo Trevas'
  );

  // Estatísticas Customizáveis da Capa Editorial
  const defaultCoverStats: SlideStatItem[] = [
    { id: 'stat-1', number: '1', unit: 'etapa', label: 'Roteiro operacional documentado' },
    { id: 'stat-2', number: '100', unit: '%', label: 'Conformidade com Boas Práticas (BPF)' },
    { id: 'stat-3', number: menus.find((m) => m.id === (savedDraft?.menuId || initialProcedure?.menuId || 'cadastros'))?.label || 'Cadastros', unit: '', label: 'Módulo integrado do sistema' },
    { id: 'stat-4', number: author || 'Farmacêutico Responsável', unit: '', label: 'Responsável técnico / elaboração' },
  ];
  const [coverStats, setCoverStats] = useState<SlideStatItem[]>(
    savedDraft?.coverStats || initialProcedure?.coverStats || defaultCoverStats
  );

  // Critérios Customizáveis do Checklist de Homologação
  const defaultChecklistItems: ChecklistItem[] = [
    { id: 'chk-1', title: 'Validação da Abertura de Tela & Módulo', note: 'Formulário carregado sem erros e com dados sincronizados.', checked: true },
    { id: 'chk-2', title: 'Conferência de Campos Fiscais e Alíquotas', note: 'Tributação e parâmetros cadastrais homologados.', checked: true },
    { id: 'chk-3', title: 'Gravação e Confirmação de Registro', note: 'Registro persistido e dados validados nas regras BPF.', checked: true },
    { id: 'chk-4', title: 'Rastreabilidade e Dupla Checagem Farmacêutica', note: 'Auditoria de conformidade sanitária aprovada.', checked: true },
  ];
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(
    savedDraft?.checklistItems || initialProcedure?.checklistItems || defaultChecklistItems
  );

  // Modais de Recursos Centralizados e Expansíveis (Formas, Emojis, Ícones, Dinâmicos)
  const [activeResourceModal, setActiveResourceModal] = useState<'shapes' | 'emojis' | 'icons' | 'dynamic' | 'hands' | null>(null);
  const [iconSearchQuery, setIconSearchQuery] = useState('');
  const [emojiCategory, setEmojiCategory] = useState<'operacoes' | 'status' | 'farmacia' | 'setas'>('operacoes');
  const [isDraftRestored, setIsDraftRestored] = useState(Boolean(savedDraft));

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

  // Metadados da Última Página de Homologação Oficial (Edição Total: Badge, Título, Subtítulo, Data e Visibilidade)
  const [signaturesMeta, setSignaturesMeta] = useState(() => ({
    badge: initialProcedure?.signatures?.badge || 'HOMOLOGAÇÃO OFICIAL',
    title: initialProcedure?.signatures?.title || 'Controle da Qualidade & BPF',
    subtitle: initialProcedure?.signatures?.subtitle || 'Procedimento validado e arquivado para fiscalização sanitária e instrução de trabalho.',
    validationDate: initialProcedure?.signatures?.validationDate || `Data de Homologação: ${new Date().toLocaleDateString('pt-BR')}`,
    hideBadge: !!initialProcedure?.signatures?.hideBadge,
    hideTitle: !!initialProcedure?.signatures?.hideTitle,
    hideSubtitle: !!initialProcedure?.signatures?.hideSubtitle,
    hideDate: !!initialProcedure?.signatures?.hideDate,
  }));

  // Colunas de Assinatura Dinâmicas (Adicionar, Excluir, Reordenar, Editar cargos e nomes)
  const [signatureColumns, setSignatureColumns] = useState<SignatureColumn[]>(() => {
    if (initialProcedure?.signatures?.columns && initialProcedure.signatures.columns.length > 0) {
      return initialProcedure.signatures.columns;
    }
    return [
      {
        id: 'sig-col-1',
        title: initialProcedure?.signatures?.elaboratedByTitle || 'ELABORADO POR',
        name: initialProcedure?.signatures?.elaboratedByName || initialProcedure?.author || author || 'Leonardo Henrique B. Trevas',
        role: initialProcedure?.signatures?.elaboratedByRole || 'Digifarma Sistemas',
        date: new Date().toLocaleDateString('pt-BR'),
      },
      {
        id: 'sig-col-2',
        title: initialProcedure?.signatures?.reviewedByTitle || 'REVISADO POR',
        name: initialProcedure?.signatures?.reviewedByName || 'Garantia da Qualidade (BPF)',
        role: initialProcedure?.signatures?.reviewedByRole || 'Controle de Procedimentos',
        date: new Date().toLocaleDateString('pt-BR'),
      },
      {
        id: 'sig-col-3',
        title: initialProcedure?.signatures?.approvedByTitle || 'APROVADO POR',
        name: initialProcedure?.signatures?.approvedByName || 'Leonardo Henrique B. Trevas',
        role: initialProcedure?.signatures?.approvedByRole || 'Responsável Técnico / Gestor',
        date: new Date().toLocaleDateString('pt-BR'),
      },
    ];
  });

  // Reordenação e Visibilidade dos Elementos da Capa Editorial
  const [coverOrder, setCoverOrder] = useState<string[]>(['badge', 'title', 'subtitle', 'slogan', 'stats']);
  const [coverMeta, setCoverMeta] = useState(() => ({
    badge: systemVersion === 'v10' ? 'DIGIFARMA V10' : 'DIGIFARMA CLÁSSICO',
    hideBadge: false,
    hideTitle: false,
    hideSubtitle: false,
    hideSlogan: false,
    hideStats: false,
  }));

  // Sistema Universal de Estilização de Textos Ativos
  const [activeTextTarget, setActiveTextTarget] = useState<string | null>(null);
  const [textStyles, setTextStyles] = useState<{ [targetId: string]: React.CSSProperties }>({});

  const moveCoverElement = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= coverOrder.length) return;
    const nextOrder = [...coverOrder];
    const temp = nextOrder[index];
    nextOrder[index] = nextOrder[targetIndex];
    nextOrder[targetIndex] = temp;
    setCoverOrder(nextOrder);
  };

  // Estado Universal de Drag and Drop para Reordenação pelo Mouse
  const [dndItem, setDndItem] = useState<{ type: string; index: number } | null>(null);
  const [dndOver, setDndOver] = useState<{ type: string; index: number } | null>(null);

  const [slidesConfig, setSlidesConfig] = useState<SlideConfig[]>(initializeSlides);

  // Slide Ativo no Modo Canva (0..N-1)
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Efeito de Salvamento Automático do Rascunho (Não perde se mudar de tela)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const draftPayload = {
          title,
          subtitle,
          systemVersion,
          menuId,
          author,
          steps,
          images,
          callouts,
          coverStats,
          checklistItems,
          signatures,
          signaturesMeta,
          signatureColumns,
          coverOrder,
          coverMeta,
          textStyles,
          slidesConfig,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(draftStorageKey, JSON.stringify(draftPayload));
      } catch (err) {
        console.warn('Erro ao salvar rascunho automático:', err);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [
    title,
    subtitle,
    systemVersion,
    menuId,
    author,
    steps,
    images,
    callouts,
    coverStats,
    checklistItems,
    signatures,
    signaturesMeta,
    signatureColumns,
    coverOrder,
    coverMeta,
    textStyles,
    slidesConfig,
    draftStorageKey,
  ]);

  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem(draftStorageKey);
      setIsDraftRestored(false);
      showToast('Rascunho descartado! Recarregando dados originais...');
      setTimeout(() => window.location.reload(), 300);
    } catch (e) {
      console.error(e);
    }
  };

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

  const updateIndicatorField = (indId: string, updates: Partial<SlideIndicator>, slideIdx?: number) => {
    const targetIdx = typeof slideIdx === 'number' ? slideIdx : safeActiveSlideIndex;
    setSlidesConfig((prev) =>
      prev.map((slide, idx) =>
        idx === targetIdx
          ? {
              ...slide,
              indicators: (slide.indicators || []).map((ind) =>
                ind.id === indId ? { ...ind, ...updates } : ind
              ),
            }
          : slide
      )
    );
  };

  const updateActiveStyle = (styleUpdates: {
    fontFamily?: string;
    isBold?: boolean;
    isItalic?: boolean;
    isUnderline?: boolean;
    textAlign?: 'left' | 'center' | 'right';
    textColor?: string;
    bgColor?: string;
    borderColor?: string;
    scaleDelta?: number;
  }) => {
    // 1. Se houver um indicador visual selecionado, aplica nele
    if (selectedIndicatorId) {
      const cur = (slidesConfig[safeActiveSlideIndex]?.indicators || []).find((i) => i.id === selectedIndicatorId);
      if (cur) {
        const updates: Partial<SlideIndicator> = {};
        if (styleUpdates.fontFamily !== undefined) updates.fontFamily = styleUpdates.fontFamily;
        if (styleUpdates.isBold !== undefined) updates.isBold = styleUpdates.isBold;
        if (styleUpdates.isItalic !== undefined) updates.isItalic = styleUpdates.isItalic;
        if (styleUpdates.isUnderline !== undefined) updates.isUnderline = styleUpdates.isUnderline;
        if (styleUpdates.textAlign !== undefined) updates.textAlign = styleUpdates.textAlign;
        if (styleUpdates.textColor !== undefined) updates.textColor = styleUpdates.textColor;
        if (styleUpdates.bgColor !== undefined) updates.bgColor = styleUpdates.bgColor;
        if (styleUpdates.borderColor !== undefined) updates.color = styleUpdates.borderColor;
        if (styleUpdates.scaleDelta !== undefined) {
          const curScale = cur.scale ?? 1.0;
          updates.scale = Math.max(0.3, Math.min(3.0, Number((curScale + styleUpdates.scaleDelta).toFixed(2))));
        }
        updateSelectedIndicator(updates);
      }
    }

    // 2. Se houver um campo de texto ativo (Capa, Homologação, Título de Etapa, etc.)
    if (activeTextTarget) {
      setTextStyles((prev) => {
        const current = prev[activeTextTarget] || {};
        const next: React.CSSProperties = { ...current };

        if (styleUpdates.fontFamily !== undefined) next.fontFamily = styleUpdates.fontFamily;
        if (styleUpdates.isBold !== undefined) next.fontWeight = styleUpdates.isBold ? 800 : 400;
        if (styleUpdates.isItalic !== undefined) next.fontStyle = styleUpdates.isItalic ? 'italic' : 'normal';
        if (styleUpdates.isUnderline !== undefined) next.textDecoration = styleUpdates.isUnderline ? 'underline' : 'none';
        if (styleUpdates.textAlign !== undefined) next.textAlign = styleUpdates.textAlign;
        if (styleUpdates.textColor !== undefined) next.color = styleUpdates.textColor;
        if (styleUpdates.bgColor !== undefined) next.backgroundColor = styleUpdates.bgColor;
        if (styleUpdates.scaleDelta !== undefined) {
          const curSize = parseFloat(String(current.fontSize || '16'));
          const newSize = Math.max(10, Math.min(64, curSize + (styleUpdates.scaleDelta > 0 ? 2 : -2)));
          next.fontSize = `${newSize}px`;
        }
        return { ...prev, [activeTextTarget]: next };
      });
    }
  };

  const addTextBox = () => {
    const newTextIndicator: SlideIndicator = {
      id: `txt-${Date.now()}`,
      type: 'text',
      x: 50,
      y: 50,
      label: 'Novo Texto Editável...',
      color: '#38bdf8',
      bgColor: 'rgba(15, 23, 42, 0.92)',
      textColor: '#ffffff',
      fontFamily: 'Inter, sans-serif',
      isBold: false,
      textAlign: 'left',
      size: 'md',
      scale: 1.0,
    };

    setSlidesConfig((prev) =>
      prev.map((slide, idx) =>
        idx === safeActiveSlideIndex
          ? {
              ...slide,
              indicators: [...(slide.indicators || []), newTextIndicator],
            }
          : slide
      )
    );
    setSelectedIndicatorId(newTextIndicator.id);
    setActiveTextTarget(`ind-txt-${newTextIndicator.id}`);
    showToast('Caixa de texto adicionada! Digite e formate livremente.');
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

  // Emojis e Símbolos
  const addEmoji = (emojiChar: string, label = '') => {
    const newId = `emoji-${Date.now()}`;
    pushIndicator(
      {
        id: newId,
        type: 'emoji',
        emojiChar,
        label,
        x: 50,
        y: 50,
        size: 'md',
        scale: 1.0,
      },
      `Emoji (${emojiChar}) adicionado à página atual!`
    );
  };

  // Formas Customizadas (Pílula, Linha, Balão de fala, etc)
  const addCustomShape = (
    shapeType: 'rect' | 'circle' | 'pill' | 'line' | 'speech-bubble',
    fillMode: IndicatorFillMode = 'outline',
    color = '#ef4444',
    label = ''
  ) => {
    const newId = `shape-${Date.now()}`;
    pushIndicator(
      {
        id: newId,
        type: 'shape',
        shapeType,
        fillMode,
        color,
        bgColor: fillMode === 'filled' ? color : 'transparent',
        textColor: '#ffffff',
        label,
        x: 50,
        y: 50,
        size: 'md',
        scale: 1.0,
      },
      `Forma geométrica (${shapeType}) adicionada!`
    );
  };

  // Carimbo Oficial Homologado
  const addStamp = (label = 'HOMOLOGADO BPF', color = '#10b981') => {
    const newId = `stamp-${Date.now()}`;
    pushIndicator(
      {
        id: newId,
        type: 'stamp',
        label,
        color,
        textColor: color,
        bgColor: 'rgba(15, 23, 42, 0.85)',
        fontFamily: "'Bebas Neue', Impact, sans-serif",
        x: 50,
        y: 50,
        size: 'md',
        scale: 1.0,
      },
      `Carimbo oficial (${label}) adicionado!`
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

  // Redimensionamento Suave de Indicadores pelo Arraste do Mouse (4 Alças nos Cantos)
  const handleIndicatorResizeMouseDown = (
    e: React.MouseEvent,
    indId: string,
    corner: 'nw' | 'ne' | 'sw' | 'se',
    initialScale: number,
    slideIdx?: number
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const targetSlideIdx = typeof slideIdx === 'number' ? slideIdx : safeActiveSlideIndex;

    const onMouseMove = (moveEvent: MouseEvent) => {
      let deltaX = moveEvent.clientX - startX;
      let deltaY = moveEvent.clientY - startY;

      if (corner === 'nw') {
        deltaX = -deltaX;
        deltaY = -deltaY;
      } else if (corner === 'ne') {
        deltaY = -deltaY;
      } else if (corner === 'sw') {
        deltaX = -deltaX;
      }

      const avgDelta = (deltaX + deltaY) / 2;
      const newScale = Math.max(0.2, Math.min(4.0, Number((initialScale + avgDelta / 100).toFixed(2))));

      setSlidesConfig((prev) =>
        prev.map((slide, idx) =>
          idx === targetSlideIdx
            ? {
                ...slide,
                indicators: (slide.indicators || []).map((ind) =>
                  ind.id === indId ? { ...ind, scale: newScale } : ind
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

  // Redimensionamento Livre da Largura da Imagem pelo Arraste do Mouse
  const handleShotframeResizeMouseDown = (e: React.MouseEvent, targetStepIdx: number) => {
    e.stopPropagation();
    e.preventDefault();

    const splitterEl = e.currentTarget as HTMLElement;
    const splitContainer = splitterEl.closest('.feature-split') as HTMLElement;
    if (!splitContainer) return;

    const containerRect = splitContainer.getBoundingClientRect();

    const onMouseMove = (moveEvent: MouseEvent) => {
      const widthPx = containerRect.right - moveEvent.clientX;
      let percent = Math.round((widthPx / containerRect.width) * 100);
      percent = Math.max(25, Math.min(85, percent));

      setSteps((prev) =>
        prev.map((s, idx) => (idx === targetStepIdx ? { ...s, imageWidth: `${percent}%` } : s))
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
      signatures: {
        ...signatures,
        badge: signaturesMeta.badge,
        title: signaturesMeta.title,
        subtitle: signaturesMeta.subtitle,
        validationDate: signaturesMeta.validationDate,
        hideBadge: signaturesMeta.hideBadge,
        hideTitle: signaturesMeta.hideTitle,
        hideSubtitle: signaturesMeta.hideSubtitle,
        hideDate: signaturesMeta.hideDate,
        columns: signatureColumns,
        elaboratedByTitle: signatureColumns[0]?.title || signatures.elaboratedByTitle,
        elaboratedByName: signatureColumns[0]?.name || signatures.elaboratedByName,
        elaboratedByRole: signatureColumns[0]?.role || signatures.elaboratedByRole,
        reviewedByTitle: signatureColumns[1]?.title || signatures.reviewedByTitle,
        reviewedByName: signatureColumns[1]?.name || signatures.reviewedByName,
        reviewedByRole: signatureColumns[1]?.role || signatures.reviewedByRole,
        approvedByTitle: signatureColumns[2]?.title || signatures.approvedByTitle,
        approvedByName: signatureColumns[2]?.name || signatures.approvedByName,
        approvedByRole: signatureColumns[2]?.role || signatures.approvedByRole,
      },
      coverStats,
      checklistItems,
      created_at: initialProcedure?.created_at || nowIso,
      updated_at: nowIso,
    };
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const proc = constructProcedureToSave();
      await onSave(proc);
      try { localStorage.removeItem(draftStorageKey); } catch {} 
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
        } else if (ind.type === 'emoji') {
      const sz = size === 'sm' ? '1.5rem' : size === 'lg' ? '2.8rem' : size === 'xl' ? '3.8rem' : '2.2rem';
      content = (
        <div
          style={{
            fontSize: sz,
            lineHeight: 1,
            opacity,
            filter: glowStyle ? `drop-shadow(${glowStyle})` : undefined,
          }}
        >
          {ind.emojiChar || '⭐'}
        </div>
      );
    } else if (ind.type === 'stamp') {
      content = (
        <div
          style={{
            border: `3px solid ${color}`,
            borderRadius: '8px',
            padding: '6px 14px',
            color: ind.textColor || color,
            fontFamily: ind.fontFamily || "'Bebas Neue', Impact, sans-serif",
            fontSize: size === 'sm' ? '1rem' : size === 'lg' ? '1.5rem' : '1.25rem',
            fontWeight: 900,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            opacity,
            transform: 'rotate(-8deg)',
            boxShadow: glowStyle || '0 4px 14px rgba(0,0,0,0.4)',
            backgroundColor: ind.bgColor || 'rgba(15, 23, 42, 0.6)',
          }}
        >
          {ind.label || 'HOMOLOGADO BPF'}
        </div>
      );
    } else if (ind.type === 'shape') {
      const isFilled = ind.fillMode === 'filled';
      const st = ind.shapeType || 'rect';
      if (st === 'pill') {
        content = (
          <div
            style={{
              padding: '6px 16px',
              borderRadius: '999px',
              border: `2px solid ${color}`,
              backgroundColor: isFilled ? (ind.bgColor || color) : 'transparent',
              color: ind.textColor || '#ffffff',
              fontFamily: ind.fontFamily || 'inherit',
              fontWeight: 800,
              fontSize: '0.85rem',
              boxShadow: glowStyle,
              opacity,
            }}
          >
            {ind.label || 'Destaque'}
          </div>
        );
      } else if (st === 'line') {
        content = (
          <div
            style={{
              width: size === 'sm' ? '80px' : size === 'lg' ? '220px' : '140px',
              height: '4px',
              backgroundColor: color,
              borderRadius: '2px',
              boxShadow: glowStyle,
              opacity,
            }}
          />
        );
      } else if (st === 'speech-bubble') {
        content = (
          <div
            style={{
              position: 'relative',
              padding: '8px 14px',
              backgroundColor: ind.bgColor || 'rgba(15, 23, 42, 0.95)',
              border: `2px solid ${color}`,
              borderRadius: '12px',
              color: ind.textColor || '#ffffff',
              fontFamily: ind.fontFamily || 'inherit',
              fontSize: '0.86rem',
              fontWeight: 700,
              boxShadow: glowStyle || '0 4px 16px rgba(0,0,0,0.5)',
              opacity,
            }}
          >
            {ind.label || 'Atenção aqui!'}
          </div>
        );
      } else {
        const w = size === 'sm' ? 80 : size === 'lg' ? 160 : 120;
        const h = size === 'sm' ? 40 : size === 'lg' ? 80 : 60;
        content = (
          <div
            style={{
              width: `${w}px`,
              height: `${h}px`,
              border: `3px solid ${color}`,
              backgroundColor: isFilled ? (ind.bgColor || color) : 'transparent',
              borderRadius: st === 'circle' ? '50%' : '8px',
              boxShadow: glowStyle,
              opacity,
            }}
          />
        );
      }
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
            fontWeight: ind.isBold ? 800 : 700,
            fontStyle: ind.isItalic ? 'italic' : 'normal',
            textDecoration: ind.isUnderline ? 'underline' : 'none',
            textAlign: ind.textAlign || 'left',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: size === 'sm' ? '0.75rem' : size === 'lg' ? '1.05rem' : size === 'xl' ? '1.25rem' : '0.86rem',
            opacity,
            boxShadow: glowStyle || '0 4px 12px rgba(0,0,0,0.5)',
            minWidth: '120px',
            maxWidth: '360px',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.3,
            cursor: isInteractive ? 'text' : 'default',
          }}
          onClick={(e) => {
            if (isInteractive) {
              e.stopPropagation();
              setSelectedIndicatorId(ind.id);
              setActiveTextTarget(`ind-txt-${ind.id}`);
            }
          }}
        >
          {isInteractive ? (
            <textarea
              className="canva-inline-txt-input"
              value={ind.label || ''}
              onChange={(e) => updateIndicatorField(ind.id, { label: e.target.value }, slideIdx)}
              placeholder="Digite o texto..."
              rows={Math.max(1, (ind.label || '').split('\n').length)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                color: 'inherit',
                fontFamily: 'inherit',
                fontWeight: 'inherit',
                fontStyle: 'inherit',
                textDecoration: 'inherit',
                textAlign: 'inherit',
                fontSize: 'inherit',
                padding: 0,
                margin: 0,
              }}
            />
          ) : (
            ind.label || 'Texto Informativo'
          )}
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
        {/* Alças de Redimensionamento Interativo nos 4 cantos com o Mouse */}
        {isSelected && isInteractive && (
          <>
            <div
              className="canva-resize-handle nw no-print"
              title="Clique e arraste com o mouse para redimensionar"
              onMouseDown={(e) => handleIndicatorResizeMouseDown(e, ind.id, 'nw', scale, slideIdx)}
            />
            <div
              className="canva-resize-handle ne no-print"
              title="Clique e arraste com o mouse para redimensionar"
              onMouseDown={(e) => handleIndicatorResizeMouseDown(e, ind.id, 'ne', scale, slideIdx)}
            />
            <div
              className="canva-resize-handle sw no-print"
              title="Clique e arraste com o mouse para redimensionar"
              onMouseDown={(e) => handleIndicatorResizeMouseDown(e, ind.id, 'sw', scale, slideIdx)}
            />
            <div
              className="canva-resize-handle se no-print"
              title="Clique e arraste com o mouse para redimensionar"
              onMouseDown={(e) => handleIndicatorResizeMouseDown(e, ind.id, 'se', scale, slideIdx)}
            />
          </>
        )}

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

            {/* Barra de Restauração de Elementos da Capa */}
            {isInteractive && (coverMeta.hideBadge || coverMeta.hideTitle || coverMeta.hideSubtitle || coverMeta.hideSlogan || coverMeta.hideStats) && (
              <div className="canva-restore-pill-bar no-print" style={{ marginBottom: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Restaurar na Capa:</span>
                {coverMeta.hideBadge && (
                  <button
                    type="button"
                    className="canva-restore-pill"
                    onClick={() => setCoverMeta(prev => ({ ...prev, hideBadge: false }))}
                    style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#93c5fd', borderRadius: '4px', padding: '2px 8px', fontSize: '0.7rem', cursor: 'pointer' }}
                  >
                    + Badge Versão
                  </button>
                )}
                {coverMeta.hideTitle && (
                  <button
                    type="button"
                    className="canva-restore-pill"
                    onClick={() => setCoverMeta(prev => ({ ...prev, hideTitle: false }))}
                    style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#93c5fd', borderRadius: '4px', padding: '2px 8px', fontSize: '0.7rem', cursor: 'pointer' }}
                  >
                    + Título Principal
                  </button>
                )}
                {coverMeta.hideSubtitle && (
                  <button
                    type="button"
                    className="canva-restore-pill"
                    onClick={() => setCoverMeta(prev => ({ ...prev, hideSubtitle: false }))}
                    style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#93c5fd', borderRadius: '4px', padding: '2px 8px', fontSize: '0.7rem', cursor: 'pointer' }}
                  >
                    + Subtítulo / Resumo
                  </button>
                )}
                {coverMeta.hideSlogan && (
                  <button
                    type="button"
                    className="canva-restore-pill"
                    onClick={() => setCoverMeta(prev => ({ ...prev, hideSlogan: false }))}
                    style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#93c5fd', borderRadius: '4px', padding: '2px 8px', fontSize: '0.7rem', cursor: 'pointer' }}
                  >
                    + Slogan / BPF
                  </button>
                )}
                {coverMeta.hideStats && (
                  <button
                    type="button"
                    className="canva-restore-pill"
                    onClick={() => setCoverMeta(prev => ({ ...prev, hideStats: false }))}
                    style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#93c5fd', borderRadius: '4px', padding: '2px 8px', fontSize: '0.7rem', cursor: 'pointer' }}
                  >
                    + Métricas / Estatísticas
                  </button>
                )}
              </div>
            )}

            {/* Renderização Ordenada e Reconfigurável dos Elementos da Capa */}
            {coverOrder.map((sectionKey, pos) => {
              const isDraggingSection = dndItem?.type === 'cover-order' && dndItem.index === pos;
              const isOverSection = dndOver?.type === 'cover-order' && dndOver.index === pos;

              const sectionDndProps = isInteractive ? {
                draggable: true,
                onDragStart: (e: React.DragEvent) => {
                  e.dataTransfer.setData('text/plain', String(pos));
                  e.dataTransfer.effectAllowed = 'move';
                  setDndItem({ type: 'cover-order', index: pos });
                },
                onDragOver: (e: React.DragEvent) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dndOver?.type !== 'cover-order' || dndOver.index !== pos) {
                    setDndOver({ type: 'cover-order', index: pos });
                  }
                },
                onDragLeave: () => {
                  if (dndOver?.type === 'cover-order' && dndOver.index === pos) {
                    setDndOver(null);
                  }
                },
                onDrop: (e: React.DragEvent) => {
                  e.preventDefault();
                  if (dndItem?.type === 'cover-order' && dndItem.index !== pos) {
                    const from = dndItem.index;
                    const to = pos;
                    const updated = [...coverOrder];
                    const [moved] = updated.splice(from, 1);
                    updated.splice(to, 0, moved);
                    setCoverOrder(updated);
                  }
                  setDndItem(null);
                  setDndOver(null);
                },
                onDragEnd: () => {
                  setDndItem(null);
                  setDndOver(null);
                },
              } : {};

              if (sectionKey === 'badge' && !coverMeta.hideBadge) {
                return (
                  <div
                    key="cover-badge"
                    className={`cover-section-item ${isDraggingSection ? 'canva-dnd-dragging' : ''} ${isOverSection ? 'canva-dnd-over' : ''}`}
                    style={{ position: 'relative', marginBottom: '8px' }}
                    {...sectionDndProps}
                  >
                    {isInteractive ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div
                          className="canva-control-btn grip no-print"
                          title="Segure e arraste com o mouse para reordenar"
                          style={{ cursor: 'grab' }}
                        >
                          <GripVertical size={11} />
                        </div>
                        <div
                          className="v10-badge"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSystemVersion(systemVersion === 'v10' ? 'classico' : 'v10');
                          }}
                          title="Clique para alternar versão (Digifarma V10 / Digifarma Clássico)"
                          style={{ cursor: 'pointer', userSelect: 'none', ...textStyles['cover-badge'] }}
                        >
                          {systemVersion === 'v10' ? 'DIGIFARMA V10' : 'DIGIFARMA CLÁSSICO'}
                        </div>
                        <button
                          type="button"
                          className="canva-control-btn no-print"
                          disabled={pos === 0}
                          onClick={() => moveCoverElement(pos, 'up')}
                          title="Mover para cima"
                          style={{ opacity: pos === 0 ? 0.3 : 1 }}
                        >
                          <ArrowUp size={11} />
                        </button>
                        <button
                          type="button"
                          className="canva-control-btn no-print"
                          disabled={pos === coverOrder.length - 1}
                          onClick={() => moveCoverElement(pos, 'down')}
                          title="Mover para baixo"
                          style={{ opacity: pos === coverOrder.length - 1 ? 0.3 : 1 }}
                        >
                          <ArrowDown size={11} />
                        </button>
                        <button
                          type="button"
                          className="canva-control-btn danger no-print"
                          title="Excluir badge da capa"
                          onClick={() => setCoverMeta(prev => ({ ...prev, hideBadge: true }))}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="v10-badge" style={textStyles['cover-badge']}>
                        {systemVersion === 'v10' ? 'DIGIFARMA V10' : 'DIGIFARMA CLÁSSICO'}
                      </div>
                    )}
                  </div>
                );
              }

              if (sectionKey === 'title' && !coverMeta.hideTitle) {
                return (
                  <div
                    key="cover-title"
                    className={`cover-section-item ${isDraggingSection ? 'canva-dnd-dragging' : ''} ${isOverSection ? 'canva-dnd-over' : ''}`}
                    style={{ position: 'relative', marginBottom: '8px' }}
                    {...sectionDndProps}
                  >
                    {isInteractive ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          className="canva-control-btn grip no-print"
                          title="Segure e arraste com o mouse para reordenar"
                          style={{ cursor: 'grab' }}
                        >
                          <GripVertical size={11} />
                        </div>
                        <input
                          type="text"
                          className="canva-inline-display-input"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          onFocus={() => setActiveTextTarget('cover-title')}
                          style={{ flex: 1, ...textStyles['cover-title'] }}
                          placeholder="Título Principal do Manual..."
                        />
                        <button
                          type="button"
                          className="canva-control-btn no-print"
                          title="Diminuir fonte (A-)"
                          onClick={() => updateActiveStyle({ scaleDelta: -2 })}
                        >
                          <Minus size={11} />
                        </button>
                        <button
                          type="button"
                          className="canva-control-btn no-print"
                          title="Aumentar fonte (A+)"
                          onClick={() => updateActiveStyle({ scaleDelta: 2 })}
                        >
                          <Plus size={11} />
                        </button>
                        <button
                          type="button"
                          className="canva-control-btn no-print"
                          disabled={pos === 0}
                          onClick={() => moveCoverElement(pos, 'up')}
                          title="Mover para cima"
                          style={{ opacity: pos === 0 ? 0.3 : 1 }}
                        >
                          <ArrowUp size={11} />
                        </button>
                        <button
                          type="button"
                          className="canva-control-btn no-print"
                          disabled={pos === coverOrder.length - 1}
                          onClick={() => moveCoverElement(pos, 'down')}
                          title="Mover para baixo"
                          style={{ opacity: pos === coverOrder.length - 1 ? 0.3 : 1 }}
                        >
                          <ArrowDown size={11} />
                        </button>
                        <button
                          type="button"
                          className="canva-control-btn danger no-print"
                          title="Excluir título da capa"
                          onClick={() => setCoverMeta(prev => ({ ...prev, hideTitle: true }))}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <h1 className="display" style={textStyles['cover-title']}>{title}</h1>
                    )}
                  </div>
                );
              }

              if (sectionKey === 'subtitle' && !coverMeta.hideSubtitle) {
                return (
                  <div
                    key="cover-subtitle"
                    className={`cover-section-item ${isDraggingSection ? 'canva-dnd-dragging' : ''} ${isOverSection ? 'canva-dnd-over' : ''}`}
                    style={{ position: 'relative', marginBottom: '8px' }}
                    {...sectionDndProps}
                  >
                    {isInteractive ? (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <div
                          className="canva-control-btn grip no-print"
                          title="Segure e arraste com o mouse para reordenar"
                          style={{ cursor: 'grab', marginTop: '4px' }}
                        >
                          <GripVertical size={11} />
                        </div>
                        <textarea
                          className="canva-inline-lead-input"
                          value={subtitle}
                          onChange={(e) => setSubtitle(e.target.value)}
                          onFocus={() => setActiveTextTarget('cover-subtitle')}
                          style={{ flex: 1, ...textStyles['cover-subtitle'] }}
                          placeholder="Subtítulo ou resumo operacional da rotina..."
                          rows={2}
                        />
                        <button
                          type="button"
                          className="canva-control-btn no-print"
                          title="Diminuir fonte (A-)"
                          onClick={() => updateActiveStyle({ scaleDelta: -2 })}
                        >
                          <Minus size={11} />
                        </button>
                        <button
                          type="button"
                          className="canva-control-btn no-print"
                          title="Aumentar fonte (A+)"
                          onClick={() => updateActiveStyle({ scaleDelta: 2 })}
                        >
                          <Plus size={11} />
                        </button>
                        <button
                          type="button"
                          className="canva-control-btn no-print"
                          disabled={pos === 0}
                          onClick={() => moveCoverElement(pos, 'up')}
                          title="Mover para cima"
                          style={{ opacity: pos === 0 ? 0.3 : 1 }}
                        >
                          <ArrowUp size={11} />
                        </button>
                        <button
                          type="button"
                          className="canva-control-btn no-print"
                          disabled={pos === coverOrder.length - 1}
                          onClick={() => moveCoverElement(pos, 'down')}
                          title="Mover para baixo"
                          style={{ opacity: pos === coverOrder.length - 1 ? 0.3 : 1 }}
                        >
                          <ArrowDown size={11} />
                        </button>
                        <button
                          type="button"
                          className="canva-control-btn danger no-print"
                          title="Excluir subtítulo da capa"
                          onClick={() => setCoverMeta(prev => ({ ...prev, hideSubtitle: true }))}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <p className="lead" style={textStyles['cover-subtitle']}>{subtitle}</p>
                    )}
                  </div>
                );
              }

              if (sectionKey === 'slogan' && !coverMeta.hideSlogan) {
                return (
                  <div
                    key="cover-slogan"
                    className={`cover-section-item ${isDraggingSection ? 'canva-dnd-dragging' : ''} ${isOverSection ? 'canva-dnd-over' : ''}`}
                    style={{ position: 'relative', marginTop: '8px' }}
                    {...sectionDndProps}
                  >
                    {isInteractive ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          className="canva-control-btn grip no-print"
                          title="Segure e arraste com o mouse para reordenar"
                          style={{ cursor: 'grab' }}
                        >
                          <GripVertical size={11} />
                        </div>
                        <input
                          type="text"
                          className="canva-inline-fitem-input"
                          style={{ flex: 1, fontSize: '0.82rem', color: '#94a3b8', ...textStyles['cover-slogan'] }}
                          value={signatures.slogan || ''}
                          onChange={(e) => setSignatures((prev) => ({ ...prev, slogan: e.target.value }))}
                          onFocus={() => setActiveTextTarget('cover-slogan')}
                          placeholder="Slogan / Certificação BPF (Ex: Digitalmente fácil · Homologado ISO 9001)..."
                        />
                        <button
                          type="button"
                          className="canva-control-btn no-print"
                          disabled={pos === 0}
                          onClick={() => moveCoverElement(pos, 'up')}
                          title="Mover para cima"
                          style={{ opacity: pos === 0 ? 0.3 : 1 }}
                        >
                          <ArrowUp size={11} />
                        </button>
                        <button
                          type="button"
                          className="canva-control-btn no-print"
                          disabled={pos === coverOrder.length - 1}
                          onClick={() => moveCoverElement(pos, 'down')}
                          title="Mover para baixo"
                          style={{ opacity: pos === coverOrder.length - 1 ? 0.3 : 1 }}
                        >
                          <ArrowDown size={11} />
                        </button>
                        <button
                          type="button"
                          className="canva-control-btn danger no-print"
                          title="Excluir slogan da capa"
                          onClick={() => setCoverMeta(prev => ({ ...prev, hideSlogan: true }))}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="slogan muted" style={{ marginTop: '8px', ...textStyles['cover-slogan'] }}>
                        {signatures.slogan || 'Digitalmente fácil · Homologado ISO 9001 & Boas Práticas Farmacêuticas'}
                      </div>
                    )}
                  </div>
                );
              }

              if (sectionKey === 'stats' && !coverMeta.hideStats) {
                return (
                  <div
                    key="cover-stats"
                    className={`cover-section-item ${isDraggingSection ? 'canva-dnd-dragging' : ''} ${isOverSection ? 'canva-dnd-over' : ''}`}
                    style={{ position: 'relative', marginTop: '24px' }}
                    {...sectionDndProps}
                  >
                    {isInteractive && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <div
                          className="canva-control-btn grip no-print"
                          title="Segure e arraste com o mouse para reordenar"
                          style={{ cursor: 'grab' }}
                        >
                          <GripVertical size={11} />
                        </div>
                        <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700 }}>Bloco de Métricas:</span>
                        <button
                          type="button"
                          className="canva-control-btn no-print"
                          disabled={pos === 0}
                          onClick={() => moveCoverElement(pos, 'up')}
                          title="Mover para cima"
                          style={{ opacity: pos === 0 ? 0.3 : 1 }}
                        >
                          <ArrowUp size={11} />
                        </button>
                        <button
                          type="button"
                          className="canva-control-btn no-print"
                          disabled={pos === coverOrder.length - 1}
                          onClick={() => moveCoverElement(pos, 'down')}
                          title="Mover para baixo"
                          style={{ opacity: pos === coverOrder.length - 1 ? 0.3 : 1 }}
                        >
                          <ArrowDown size={11} />
                        </button>
                        <button
                          type="button"
                          className="canva-control-btn danger no-print"
                          title="Excluir bloco de métricas"
                          onClick={() => setCoverMeta(prev => ({ ...prev, hideStats: true }))}
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    <div className="stats">
                      {coverStats.map((st, sIndex) => {
                        const isDraggingStat = dndItem?.type === 'cover-stat' && dndItem.index === sIndex;
                        const isOverStat = dndOver?.type === 'cover-stat' && dndOver.index === sIndex;

                        return (
                          <div
                            key={st.id}
                            className={`stat canva-stat-card-editable ${isDraggingStat ? 'canva-dnd-dragging' : ''} ${isOverStat ? 'canva-dnd-over' : ''}`}
                            style={{ position: 'relative' }}
                            draggable={isInteractive}
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', String(sIndex));
                              e.dataTransfer.effectAllowed = 'move';
                              setDndItem({ type: 'cover-stat', index: sIndex });
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                              if (dndOver?.type !== 'cover-stat' || dndOver.index !== sIndex) {
                                setDndOver({ type: 'cover-stat', index: sIndex });
                              }
                            }}
                            onDragLeave={() => {
                              if (dndOver?.type === 'cover-stat' && dndOver.index === sIndex) {
                                setDndOver(null);
                              }
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (dndItem?.type === 'cover-stat' && dndItem.index !== sIndex) {
                                const updated = [...coverStats];
                                const [moved] = updated.splice(dndItem.index, 1);
                                updated.splice(sIndex, 0, moved);
                                setCoverStats(updated);
                              }
                              setDndItem(null);
                              setDndOver(null);
                            }}
                            onDragEnd={() => {
                              setDndItem(null);
                              setDndOver(null);
                            }}
                          >
                            {isInteractive && (
                              <div style={{ position: 'absolute', top: '4px', right: '4px', display: 'flex', gap: '2px', zIndex: 10 }}>
                                <div
                                  className="item-delete-btn grip no-print"
                                  title="Segure e arraste com o mouse para reposicionar"
                                  style={{ cursor: 'grab' }}
                                >
                                  <GripVertical size={11} />
                                </div>
                                <button
                                  type="button"
                                  className="item-delete-btn no-print"
                                  disabled={sIndex === 0}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (sIndex > 0) {
                                      const updated = [...coverStats];
                                      const temp = updated[sIndex];
                                      updated[sIndex] = updated[sIndex - 1];
                                      updated[sIndex - 1] = temp;
                                      setCoverStats(updated);
                                    }
                                  }}
                                  title="Mover para a esquerda"
                                  style={{ opacity: sIndex === 0 ? 0.3 : 1 }}
                                >
                                  ←
                                </button>
                                <button
                                  type="button"
                                  className="item-delete-btn no-print"
                                  disabled={sIndex === coverStats.length - 1}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (sIndex < coverStats.length - 1) {
                                      const updated = [...coverStats];
                                      const temp = updated[sIndex];
                                      updated[sIndex] = updated[sIndex + 1];
                                      updated[sIndex + 1] = temp;
                                      setCoverStats(updated);
                                    }
                                  }}
                                  title="Mover para a direita"
                                  style={{ opacity: sIndex === coverStats.length - 1 ? 0.3 : 1 }}
                                >
                                  →
                                </button>
                                <button
                                  type="button"
                                  className="item-delete-btn no-print"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCoverStats((prev) => prev.filter((_, i) => i !== sIndex));
                                  }}
                                  title="Excluir este bloco de estatística"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          <div className="stat-inputs-row">
                            {isInteractive ? (
                              <>
                                <input
                                  type="text"
                                  className="stat-num-input"
                                  value={st.number}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setCoverStats((prev) =>
                                      prev.map((item, i) => (i === sIndex ? { ...item, number: val } : item))
                                    );
                                  }}
                                  placeholder="100"
                                />
                                <input
                                  type="text"
                                  className="stat-unit-input"
                                  value={st.unit || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setCoverStats((prev) =>
                                      prev.map((item, i) => (i === sIndex ? { ...item, unit: val } : item))
                                    );
                                  }}
                                  placeholder="%"
                                />
                              </>
                            ) : (
                              <div className="n">
                                {st.number}
                                {st.unit ? <small>{st.unit}</small> : null}
                              </div>
                            )}
                          </div>
                          {isInteractive ? (
                            <input
                              type="text"
                              className="stat-label-input"
                              value={st.label}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCoverStats((prev) =>
                                  prev.map((item, i) => (i === sIndex ? { ...item, label: val } : item))
                                );
                              }}
                              placeholder="Descrição da métrica..."
                            />
                          ) : (
                            <div className="l">{st.label}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                    {isInteractive && (
                      <button
                        type="button"
                        className="btn-add-stat-mini no-print"
                        style={{ marginTop: '10px' }}
                        onClick={() =>
                          setCoverStats((prev) => [
                            ...prev,
                            {
                              id: `stat-${Date.now()}`,
                              number: '1',
                              unit: 'x',
                              label: 'Nova Métrica / Indicador',
                            },
                          ])
                        }
                      >
                        <Plus size={13} />
                        <span>Adicionar Métrica / Estatística</span>
                      </button>
                    )}
                  </div>
                );
              }

              return null;
            })}
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

            {/* Itens Operacionais Dinâmicos & Customizáveis */}
            {(() => {
              const defaultOps: OperationalItem[] = [
                { id: `op-${stepIdx}-1`, icon: '✓', title: 'Resultado Esperado', content: step.expectedResult || 'Registro processado e confirmado.', text: step.expectedResult || 'Registro processado e confirmado.', type: 'success' },
                { id: `op-${stepIdx}-2`, icon: '💡', title: 'Dica de Agilidade', content: step.tips || 'Atalho F2 para busca rápida.', text: step.tips || 'Atalho F2 para busca rápida.', type: 'tip' },
                { id: `op-${stepIdx}-3`, icon: '⚠️', title: 'Ponto Crítico', content: step.warnings || 'Valide a numeração do lote.', text: step.warnings || 'Valide a numeração do lote.', type: 'warning' },
              ];
              const currentOps: OperationalItem[] = step.operationalItems && step.operationalItems.length > 0
                ? step.operationalItems
                : defaultOps;

              const updateStepOps = (newOps: OperationalItem[]) => {
                setSteps((prev) =>
                  prev.map((s, idx) => {
                    if (idx !== stepIdx) return s;
                    const res = newOps.find((o) => o.type === 'success' || o.title.toLowerCase().includes('resultado'))?.content || '';
                    const tip = newOps.find((o) => o.type === 'tip' || o.title.toLowerCase().includes('dica'))?.content || '';
                    const wrn = newOps.find((o) => o.type === 'warning' || o.title.toLowerCase().includes('crítico') || o.title.toLowerCase().includes('critico'))?.content || '';
                    return {
                      ...s,
                      operationalItems: newOps,
                      expectedResult: res,
                      tips: tip,
                      warnings: wrn,
                    };
                  })
                );
              };

              return (
                <div className="feature-split">
                  <div className="feature-left">
                    {currentOps.map((op, opIndex) => {
                      const isDraggingThis = dndItem?.type === 'step-op' && dndItem.index === opIndex;
                      const isOverThis = dndOver?.type === 'step-op' && dndOver.index === opIndex;

                      return (
                        <div
                          key={op.id}
                          className={`fitem ${op.type === 'warning' ? 'warning' : ''} ${isDraggingThis ? 'canva-dnd-dragging' : ''} ${isOverThis ? 'canva-dnd-over' : ''}`}
                          style={{ position: 'relative' }}
                          draggable={isInteractive}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', String(opIndex));
                            e.dataTransfer.effectAllowed = 'move';
                            setDndItem({ type: 'step-op', index: opIndex });
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            if (dndOver?.type !== 'step-op' || dndOver.index !== opIndex) {
                              setDndOver({ type: 'step-op', index: opIndex });
                            }
                          }}
                          onDragLeave={() => {
                            if (dndOver?.type === 'step-op' && dndOver.index === opIndex) {
                              setDndOver(null);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (dndItem?.type === 'step-op' && dndItem.index !== opIndex) {
                              const updated = [...currentOps];
                              const [moved] = updated.splice(dndItem.index, 1);
                              updated.splice(opIndex, 0, moved);
                              updateStepOps(updated);
                            }
                            setDndItem(null);
                            setDndOver(null);
                          }}
                          onDragEnd={() => {
                            setDndItem(null);
                            setDndOver(null);
                          }}
                        >
                          {isInteractive && (
                            <div style={{ position: 'absolute', top: '4px', right: '4px', display: 'flex', gap: '2px', zIndex: 10 }}>
                              <div
                                className="item-delete-btn grip no-print"
                                title="Segure e arraste com o mouse para reordenar"
                                style={{ cursor: 'grab' }}
                              >
                                <GripVertical size={11} />
                              </div>
                              <button
                                type="button"
                                className="item-delete-btn no-print"
                                disabled={opIndex === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (opIndex > 0) {
                                    const updated = [...currentOps];
                                    const temp = updated[opIndex];
                                    updated[opIndex] = updated[opIndex - 1];
                                    updated[opIndex - 1] = temp;
                                    updateStepOps(updated);
                                  }
                                }}
                                title="Mover item para cima"
                                style={{ opacity: opIndex === 0 ? 0.3 : 1 }}
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                className="item-delete-btn no-print"
                                disabled={opIndex === currentOps.length - 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (opIndex < currentOps.length - 1) {
                                    const updated = [...currentOps];
                                    const temp = updated[opIndex];
                                    updated[opIndex] = updated[opIndex + 1];
                                    updated[opIndex + 1] = temp;
                                    updateStepOps(updated);
                                  }
                                }}
                                title="Mover item para baixo"
                                style={{ opacity: opIndex === currentOps.length - 1 ? 0.3 : 1 }}
                              >
                                ↓
                              </button>
                              <button
                                type="button"
                                className="item-delete-btn no-print"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updated = currentOps.filter((_, i) => i !== opIndex);
                                  updateStepOps(updated);
                                }}
                                title="Excluir este item operacional"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                          <div
                            className="fico"
                            style={
                              op.type === 'warning'
                                ? { backgroundColor: 'rgba(245, 158, 11, 0.16)', color: '#d97706' }
                                : undefined
                            }
                          >
                            {isInteractive ? (
                              <input
                                type="text"
                                value={op.icon || '✓'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const updated = currentOps.map((item, i) => (i === opIndex ? { ...item, icon: val } : item));
                                  updateStepOps(updated);
                                }}
                                style={{
                                  width: '28px',
                                  textAlign: 'center',
                                  background: 'transparent',
                                  border: 'none',
                                  fontWeight: 800,
                                  fontSize: '1rem',
                                  color: 'inherit',
                                  outline: 'none',
                                }}
                                title="Clique para editar o ícone/emoji"
                              />
                            ) : (
                              <span>{op.icon || '✓'}</span>
                            )}
                          </div>
                          <div className="ftxt" style={{ flex: 1, paddingRight: isInteractive ? '74px' : '0' }}>
                            {isInteractive ? (
                              <>
                                <input
                                  type="text"
                                  className="canva-inline-head-input"
                                  style={{
                                    fontSize: '0.92rem',
                                    fontWeight: 800,
                                    marginBottom: '3px',
                                    color: op.type === 'warning' ? '#d97706' : undefined,
                                  }}
                                  value={op.title}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const updated = currentOps.map((item, i) => (i === opIndex ? { ...item, title: val } : item));
                                    updateStepOps(updated);
                                  }}
                                  placeholder="Título do item..."
                                />
                                <input
                                  type="text"
                                  className="canva-inline-fitem-input"
                                  value={op.text || op.content || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const updated = currentOps.map((item, i) => (i === opIndex ? { ...item, text: val, content: val } : item));
                                    updateStepOps(updated);
                                  }}
                                  placeholder="Instrução ou resultado..."
                                />
                              </>
                            ) : (
                              <>
                                <h4 style={op.type === 'warning' ? { color: '#d97706' } : undefined}>{op.title}</h4>
                                <p>{op.text || op.content}</p>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {isInteractive && (
                      <button
                        type="button"
                        className="canva-action-btn no-print"
                        style={{ marginTop: '8px', alignSelf: 'flex-start' }}
                        onClick={() => {
                          const newOp: OperationalItem = {
                            id: `op-${Date.now()}`,
                            icon: '📌',
                            title: 'Nova Instrução Operacional',
                            content: 'Descreva a validação, regra ou dica correspondente.',
                            text: 'Descreva a validação, regra ou dica correspondente.',
                            type: 'info',
                          };
                          updateStepOps([...currentOps, newOp]);
                        }}
                      >
                        <Plus size={13} />
                        <span>Adicionar Item Operacional</span>
                      </button>
                    )}
                  </div>

                  {/* Divisor / Alça de Arraste com o Mouse para Redimensionar a Imagem Livremente */}
                  {isInteractive && (
                    <div
                      className="canva-shotframe-splitter no-print"
                      title="Clique e arraste com o mouse para redimensionar a largura da imagem livremente"
                      onMouseDown={(e) => handleShotframeResizeMouseDown(e, stepIdx)}
                    >
                      <div className="splitter-thumb">
                        <GripVertical size={14} />
                      </div>
                    </div>
                  )}

                  {/* Shotframe da Etapa com controle de largura (50%, 65%, 80%, 100% ou arraste livre) */}
                  <div
                    className="shotframe"
                    style={{
                      flex: step.imageWidth ? `0 0 ${step.imageWidth}` : undefined,
                      maxWidth: step.imageWidth || undefined,
                      width: step.imageWidth || undefined,
                    }}
                  >
                    {isInteractive && (
                      <div className="canva-shotframe-size-bar no-print">
                        <span>Largura da Imagem:</span>
                        {(['50%', '65%', '80%', '100%'] as const).map((w) => (
                          <button
                            key={w}
                            type="button"
                            className={`btn-size-preset ${(step.imageWidth || '65%') === w ? 'active' : ''}`}
                            onClick={() => {
                              setSteps((prev) =>
                                prev.map((s, idx) => (idx === stepIdx ? { ...s, imageWidth: w } : s))
                              );
                            }}
                          >
                            {w}
                          </button>
                        ))}
                        {/* Slider contínuo de largura pelo mouse */}
                        <div className="shotframe-slider-wrap" title="Arraste para redimensionar com o mouse">
                          <input
                            type="range"
                            min="25"
                            max="85"
                            value={parseInt(step.imageWidth || '65', 10) || 65}
                            onChange={(e) => {
                              const val = `${e.target.value}%`;
                              setSteps((prev) =>
                                prev.map((s, idx) => (idx === stepIdx ? { ...s, imageWidth: val } : s))
                              );
                            }}
                            className="shotframe-range-slider"
                          />
                          <span className="shotframe-percent-badge">{step.imageWidth || '65%'}</span>
                        </div>
                      </div>
                    )}

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
              );
            })()}
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
              {checklistItems.map((chk, i) => {
                const isDraggingThis = dndItem?.type === 'chk-item' && dndItem.index === i;
                const isOverThis = dndOver?.type === 'chk-item' && dndOver.index === i;

                return (
                  <div
                    key={chk.id}
                    className={`canva-check-row ${isDraggingThis ? 'canva-dnd-dragging' : ''} ${isOverThis ? 'canva-dnd-over' : ''}`}
                    style={{ position: 'relative' }}
                    draggable={isInteractive}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', String(i));
                      e.dataTransfer.effectAllowed = 'move';
                      setDndItem({ type: 'chk-item', index: i });
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dndOver?.type !== 'chk-item' || dndOver.index !== i) {
                        setDndOver({ type: 'chk-item', index: i });
                      }
                    }}
                    onDragLeave={() => {
                      if (dndOver?.type === 'chk-item' && dndOver.index === i) {
                        setDndOver(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dndItem?.type === 'chk-item' && dndItem.index !== i) {
                        const updated = [...checklistItems];
                        const [moved] = updated.splice(dndItem.index, 1);
                        updated.splice(i, 0, moved);
                        setChecklistItems(updated);
                      }
                      setDndItem(null);
                      setDndOver(null);
                    }}
                    onDragEnd={() => {
                      setDndItem(null);
                      setDndOver(null);
                    }}
                  >
                    {isInteractive && (
                      <div style={{ position: 'absolute', top: '4px', right: '4px', display: 'flex', gap: '2px', zIndex: 10 }}>
                        <div
                          className="item-delete-btn grip no-print"
                          title="Segure e arraste com o mouse para reordenar"
                          style={{ cursor: 'grab' }}
                        >
                          <GripVertical size={11} />
                        </div>
                        <button
                          type="button"
                          className="item-delete-btn no-print"
                          disabled={i === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (i > 0) {
                              const updated = [...checklistItems];
                              const temp = updated[i];
                              updated[i] = updated[i - 1];
                              updated[i - 1] = temp;
                              setChecklistItems(updated);
                            }
                          }}
                          title="Mover critério para cima"
                          style={{ opacity: i === 0 ? 0.3 : 1 }}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="item-delete-btn no-print"
                          disabled={i === checklistItems.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (i < checklistItems.length - 1) {
                              const updated = [...checklistItems];
                              const temp = updated[i];
                              updated[i] = updated[i + 1];
                              updated[i + 1] = temp;
                              setChecklistItems(updated);
                            }
                          }}
                          title="Mover critério para baixo"
                          style={{ opacity: i === checklistItems.length - 1 ? 0.3 : 1 }}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="item-delete-btn no-print"
                          onClick={(e) => {
                            e.stopPropagation();
                            setChecklistItems((prev) => prev.filter((_, idx) => idx !== i));
                          }}
                          title="Excluir este critério de homologação"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    <div className="canva-check-circle">✓</div>
                    <div style={{ flex: 1, paddingRight: isInteractive ? '74px' : '0' }}>
                    {isInteractive ? (
                      <>
                        <input
                          type="text"
                          className="canva-inline-head-input"
                          style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '2px' }}
                          value={chk.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setChecklistItems((prev) =>
                              prev.map((item, idx) => (idx === i ? { ...item, title: val } : item))
                            );
                          }}
                          placeholder="Critério de homologação..."
                        />
                        <input
                          type="text"
                          className="canva-inline-fitem-input"
                          value={chk.note || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setChecklistItems((prev) =>
                              prev.map((item, idx) => (idx === i ? { ...item, note: val } : item))
                            );
                          }}
                          placeholder="Nota explicativa ou validação de conformidade..."
                          style={{ fontSize: '0.8rem' }}
                        />
                      </>
                    ) : (
                      <>
                        <strong>{chk.title}</strong>
                        {chk.note && <p>{chk.note}</p>}
                      </>
                    )}
                  </div>
                </div>
              );
            })}

              {isInteractive && (
                <button
                  type="button"
                  className="canva-action-btn no-print"
                  style={{ marginTop: '12px' }}
                  onClick={() =>
                    setChecklistItems((prev) => [
                      ...prev,
                      {
                        id: `chk-${Date.now()}`,
                        title: `Item ${(prev.length + 1).toString().padStart(2, '0')}: Validação Operacional`,
                        note: 'Conformidade conferida com o manual e normas BPF.',
                        checked: true,
                      },
                    ])
                  }
                >
                  <Plus size={13} />
                  <span>Adicionar Item ao Checklist</span>
                </button>
              )}
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

            {/* Barra de Restauração de Elementos Homologados Ocultados */}
            {isInteractive && (signaturesMeta.hideBadge || signaturesMeta.hideTitle || signaturesMeta.hideSubtitle || signaturesMeta.hideDate) && (
              <div className="canva-restore-pill-bar no-print" style={{ marginBottom: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Restaurar Elementos:</span>
                {signaturesMeta.hideBadge && (
                  <button
                    type="button"
                    className="canva-restore-pill"
                    onClick={() => setSignaturesMeta(prev => ({ ...prev, hideBadge: false }))}
                    style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#93c5fd', borderRadius: '4px', padding: '2px 8px', fontSize: '0.7rem', cursor: 'pointer' }}
                  >
                    + Badge Homologação
                  </button>
                )}
                {signaturesMeta.hideTitle && (
                  <button
                    type="button"
                    className="canva-restore-pill"
                    onClick={() => setSignaturesMeta(prev => ({ ...prev, hideTitle: false }))}
                    style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#93c5fd', borderRadius: '4px', padding: '2px 8px', fontSize: '0.7rem', cursor: 'pointer' }}
                  >
                    + Título
                  </button>
                )}
                {signaturesMeta.hideSubtitle && (
                  <button
                    type="button"
                    className="canva-restore-pill"
                    onClick={() => setSignaturesMeta(prev => ({ ...prev, hideSubtitle: false }))}
                    style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#93c5fd', borderRadius: '4px', padding: '2px 8px', fontSize: '0.7rem', cursor: 'pointer' }}
                  >
                    + Subtítulo
                  </button>
                )}
                {signaturesMeta.hideDate && (
                  <button
                    type="button"
                    className="canva-restore-pill"
                    onClick={() => setSignaturesMeta(prev => ({ ...prev, hideDate: false }))}
                    style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#93c5fd', borderRadius: '4px', padding: '2px 8px', fontSize: '0.7rem', cursor: 'pointer' }}
                  >
                    + Data de Homologação
                  </button>
                )}
              </div>
            )}

            {/* Badge de Homologação */}
            {!signaturesMeta.hideBadge && (
              <div style={{ display: 'inline-block', marginBottom: '8px', position: 'relative' }}>
                {isInteractive ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="text"
                      className="v10-badge"
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        color: 'var(--red)',
                        cursor: 'text',
                        padding: '4px 10px',
                        outline: 'none',
                        borderRadius: '999px',
                        fontWeight: 800,
                        ...textStyles['sig-badge'],
                      }}
                      value={signaturesMeta.badge}
                      onChange={(e) => setSignaturesMeta(prev => ({ ...prev, badge: e.target.value }))}
                      onFocus={() => setActiveTextTarget('sig-badge')}
                      placeholder="HOMOLOGAÇÃO OFICIAL"
                    />
                    <button
                      type="button"
                      className="canva-control-btn no-print"
                      title="Diminuir fonte (A-)"
                      onClick={() => updateActiveStyle({ scaleDelta: -2 })}
                    >
                      <Minus size={11} />
                    </button>
                    <button
                      type="button"
                      className="canva-control-btn no-print"
                      title="Aumentar fonte (A+)"
                      onClick={() => updateActiveStyle({ scaleDelta: 2 })}
                    >
                      <Plus size={11} />
                    </button>
                    <button
                      type="button"
                      className="canva-control-btn danger no-print"
                      title="Excluir este badge"
                      onClick={() => setSignaturesMeta(prev => ({ ...prev, hideBadge: true }))}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="v10-badge" style={textStyles['sig-badge']}>
                    {signaturesMeta.badge}
                  </div>
                )}
              </div>
            )}

            {/* Título Principal */}
            {!signaturesMeta.hideTitle && (
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                {isInteractive ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="text"
                      className="canva-inline-display-input"
                      style={{ fontSize: '32px', flex: 1, ...textStyles['sig-title'] }}
                      value={signaturesMeta.title}
                      onChange={(e) => setSignaturesMeta(prev => ({ ...prev, title: e.target.value }))}
                      onFocus={() => setActiveTextTarget('sig-title')}
                      placeholder="Título da Homologação..."
                    />
                    <button
                      type="button"
                      className="canva-control-btn no-print"
                      title="Diminuir fonte (A-)"
                      onClick={() => updateActiveStyle({ scaleDelta: -2 })}
                    >
                      <Minus size={11} />
                    </button>
                    <button
                      type="button"
                      className="canva-control-btn no-print"
                      title="Aumentar fonte (A+)"
                      onClick={() => updateActiveStyle({ scaleDelta: 2 })}
                    >
                      <Plus size={11} />
                    </button>
                    <button
                      type="button"
                      className="canva-control-btn danger no-print"
                      title="Excluir este título"
                      onClick={() => setSignaturesMeta(prev => ({ ...prev, hideTitle: true }))}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <h1 className="display" style={{ fontSize: '32px', ...textStyles['sig-title'] }}>
                    {signaturesMeta.title}
                  </h1>
                )}
              </div>
            )}

            {/* Subtítulo / Instrução Regulamentar */}
            {!signaturesMeta.hideSubtitle && (
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                {isInteractive ? (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <textarea
                      className="canva-inline-lead-input"
                      style={{ flex: 1, ...textStyles['sig-subtitle'] }}
                      value={signaturesMeta.subtitle}
                      onChange={(e) => setSignaturesMeta(prev => ({ ...prev, subtitle: e.target.value }))}
                      onFocus={() => setActiveTextTarget('sig-subtitle')}
                      placeholder="Procedimento validado e arquivado para fiscalização..."
                      rows={2}
                    />
                    <button
                      type="button"
                      className="canva-control-btn no-print"
                      title="Diminuir fonte (A-)"
                      onClick={() => updateActiveStyle({ scaleDelta: -2 })}
                    >
                      <Minus size={11} />
                    </button>
                    <button
                      type="button"
                      className="canva-control-btn no-print"
                      title="Aumentar fonte (A+)"
                      onClick={() => updateActiveStyle({ scaleDelta: 2 })}
                    >
                      <Plus size={11} />
                    </button>
                    <button
                      type="button"
                      className="canva-control-btn danger no-print"
                      title="Excluir este subtítulo"
                      onClick={() => setSignaturesMeta(prev => ({ ...prev, hideSubtitle: true }))}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <p className="lead" style={textStyles['sig-subtitle']}>
                    {signaturesMeta.subtitle}
                  </p>
                )}
              </div>
            )}

            {/* Data de Homologação */}
            {!signaturesMeta.hideDate && (
              <div style={{ position: 'relative', marginBottom: '14px' }}>
                {isInteractive ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="text"
                      className="canva-inline-fitem-input"
                      style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 600, width: '320px', ...textStyles['sig-date'] }}
                      value={signaturesMeta.validationDate}
                      onChange={(e) => setSignaturesMeta(prev => ({ ...prev, validationDate: e.target.value }))}
                      onFocus={() => setActiveTextTarget('sig-date')}
                      placeholder="Data de Homologação: 02/10/2026..."
                    />
                    <button
                      type="button"
                      className="canva-control-btn danger no-print"
                      title="Excluir campo de data"
                      onClick={() => setSignaturesMeta(prev => ({ ...prev, hideDate: true }))}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <p className="lead muted" style={{ fontSize: '0.82rem', color: '#10b981', ...textStyles['sig-date'] }}>
                    {signaturesMeta.validationDate}
                  </p>
                )}
              </div>
            )}

            {/* Grid Dinâmico de Assinaturas (Elaborado, Revisado, Aprovado, RT, etc.) */}
            <div
              className="print-signatures-grid"
              style={{
                marginTop: '28px',
                gridTemplateColumns: `repeat(${signatureColumns.length || 1}, 1fr)`,
                gap: '16px',
              }}
            >
              {signatureColumns.map((col, colIdx) => {
                const isDraggingThis = dndItem?.type === 'signature-col' && dndItem.index === colIdx;
                const isOverThis = dndOver?.type === 'signature-col' && dndOver.index === colIdx;

                return (
                  <div
                    key={col.id}
                    className={`print-sign-col canva-sign-col-editable ${isDraggingThis ? 'canva-dnd-dragging' : ''} ${isOverThis ? 'canva-dnd-over' : ''}`}
                    style={{ position: 'relative' }}
                    draggable={isInteractive}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', String(colIdx));
                      e.dataTransfer.effectAllowed = 'move';
                      setDndItem({ type: 'signature-col', index: colIdx });
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dndOver?.type !== 'signature-col' || dndOver.index !== colIdx) {
                        setDndOver({ type: 'signature-col', index: colIdx });
                      }
                    }}
                    onDragLeave={() => {
                      if (dndOver?.type === 'signature-col' && dndOver.index === colIdx) {
                        setDndOver(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dndItem?.type === 'signature-col' && dndItem.index !== colIdx) {
                        const updated = [...signatureColumns];
                        const [moved] = updated.splice(dndItem.index, 1);
                        updated.splice(colIdx, 0, moved);
                        setSignatureColumns(updated);
                      }
                      setDndItem(null);
                      setDndOver(null);
                    }}
                    onDragEnd={() => {
                      setDndItem(null);
                      setDndOver(null);
                    }}
                  >
                    {isInteractive && (
                      <div className="sign-col-actions-bar no-print" style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '6px' }}>
                        <div
                          className="canva-control-btn grip no-print"
                          title="Segure e arraste com o mouse para reordenar"
                          style={{ cursor: 'grab' }}
                        >
                          <GripVertical size={11} />
                        </div>
                        <button
                          type="button"
                          className="canva-control-btn"
                          disabled={colIdx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (colIdx > 0) {
                              const updated = [...signatureColumns];
                              const temp = updated[colIdx];
                              updated[colIdx] = updated[colIdx - 1];
                              updated[colIdx - 1] = temp;
                              setSignatureColumns(updated);
                            }
                          }}
                          title="Mover assinatura para a esquerda"
                          style={{ opacity: colIdx === 0 ? 0.3 : 1 }}
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          className="canva-control-btn"
                          disabled={colIdx === signatureColumns.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (colIdx < signatureColumns.length - 1) {
                              const updated = [...signatureColumns];
                              const temp = updated[colIdx];
                              updated[colIdx] = updated[colIdx + 1];
                              updated[colIdx + 1] = temp;
                              setSignatureColumns(updated);
                            }
                          }}
                          title="Mover assinatura para a direita"
                          style={{ opacity: colIdx === signatureColumns.length - 1 ? 0.3 : 1 }}
                        >
                          →
                        </button>
                        <button
                          type="button"
                          className="canva-control-btn danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSignatureColumns(prev => prev.filter((_, i) => i !== colIdx));
                          }}
                          title="Excluir este bloco de assinatura"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                  {isInteractive ? (
                    <input
                      type="text"
                      className="canva-inline-fitem-input"
                      style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.75rem', marginBottom: '4px' }}
                      value={col.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSignatureColumns(prev => prev.map((item, i) => i === colIdx ? { ...item, title: val } : item));
                      }}
                      placeholder="Título (Ex: RESPONSÁVEL TÉCNICO)"
                    />
                  ) : (
                    <span className="print-sign-title">{col.title}</span>
                  )}

                  <div className="print-sign-line" />

                  {isInteractive ? (
                    <input
                      type="text"
                      className="canva-inline-sign-input"
                      value={col.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSignatureColumns(prev => prev.map((item, i) => i === colIdx ? { ...item, name: val } : item));
                      }}
                      placeholder="Nome do Profissional"
                    />
                  ) : (
                    <span className="print-sign-name">{col.name}</span>
                  )}

                  {isInteractive ? (
                    <input
                      type="text"
                      className="canva-inline-fitem-input"
                      style={{ textAlign: 'center', fontSize: '0.72rem', marginTop: '4px' }}
                      value={col.role}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSignatureColumns(prev => prev.map((item, i) => i === colIdx ? { ...item, role: val } : item));
                      }}
                      placeholder="Cargo / CRF / Função"
                    />
                  ) : (
                    <span className="print-sign-role">{col.role}</span>
                  )}

                  {isInteractive ? (
                    <input
                      type="text"
                      className="canva-inline-fitem-input"
                      style={{ textAlign: 'center', fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}
                      value={col.date || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSignatureColumns(prev => prev.map((item, i) => i === colIdx ? { ...item, date: val } : item));
                      }}
                      placeholder="Data (Ex: 02/10/2026)"
                    />
                  ) : (
                    col.date && (
                      <span className="print-sign-date" style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px', display: 'block', textAlign: 'center' }}>
                        {col.date}
                      </span>
                    )
                  )}
                </div>
              );
            })}
            </div>

            {/* Botão Adicionar Assinatura / Validação */}
            {isInteractive && (
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn-add-stat-mini no-print"
                  onClick={() => {
                    setSignatureColumns(prev => [
                      ...prev,
                      {
                        id: `col-${Date.now()}`,
                        title: 'RESPONSÁVEL TÉCNICO',
                        name: currentUser?.name || 'Nome do Profissional',
                        role: 'Farmacêutico / Fiscalização CRF',
                        date: new Date().toLocaleDateString('pt-BR'),
                      },
                    ]);
                  }}
                  title="Adicionar nova coluna de assinatura na página de homologação"
                >
                  <Plus size={13} />
                  <span>Adicionar Assinatura / Validação</span>
                </button>
              </div>
            )}

            {/* Rodapé da Empresa e Slogan */}
            <div className="contact" style={{ marginTop: '36px', textAlign: 'center' }}>
              {isInteractive ? (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="canva-inline-fitem-input"
                    style={{ width: '220px', textAlign: 'center', fontWeight: 700 }}
                    value={signatures.companyName || ''}
                    onChange={(e) => setSignatures(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Digifarma Sistemas LTDA"
                  />
                  <span style={{ color: '#64748b' }}>·</span>
                  <input
                    type="text"
                    className="canva-inline-fitem-input"
                    style={{ width: '320px', textAlign: 'center', color: '#94a3b8' }}
                    value={signatures.slogan || ''}
                    onChange={(e) => setSignatures(prev => ({ ...prev, slogan: e.target.value }))}
                    placeholder="Slogan / Certificação..."
                  />
                </div>
              ) : (
                <>
                  <b>{signatures.companyName || 'Digifarma Sistemas LTDA'}</b> · {signatures.slogan || 'Digitalmente fácil · Homologado ISO 9001'}
                </>
              )}
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
              {isDraftRestored && (
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  title="Clique para descartar alterações auto-salvas e voltar ao procedimento original"
                  style={{
                    background: 'rgba(59, 130, 246, 0.18)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    color: '#60a5fa',
                    borderRadius: '4px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    cursor: 'pointer',
                  }}
                >
                  Rascunho Ativo (✕ Descartar)
                </button>
              )}
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
                const isDraggingThis = dndItem?.type === 'slide' && dndItem.index === idx;
                const isOverThis = dndOver?.type === 'slide' && dndOver.index === idx;

                return (
                  <div
                    key={slide.id || `thumb-${idx}`}
                    className={`thumb-card ${isCurrentActive ? 'active' : ''} ${isDraggingThis ? 'canva-dnd-dragging' : ''} ${isOverThis ? 'canva-dnd-over' : ''}`}
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', String(idx));
                      e.dataTransfer.effectAllowed = 'move';
                      setDndItem({ type: 'slide', index: idx });
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dndOver?.type !== 'slide' || dndOver.index !== idx) {
                        setDndOver({ type: 'slide', index: idx });
                      }
                    }}
                    onDragLeave={() => {
                      if (dndOver?.type === 'slide' && dndOver.index === idx) {
                        setDndOver(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dndItem?.type === 'slide' && dndItem.index !== idx) {
                        movePage(dndItem.index, idx);
                        setActiveSlideIndex(idx);
                      }
                      setDndItem(null);
                      setDndOver(null);
                    }}
                    onDragEnd={() => {
                      setDndItem(null);
                      setDndOver(null);
                    }}
                    onClick={() => {
                      setActiveSlideIndex(idx);
                      setSelectedIndicatorId(null);
                    }}
                    title="Clique para editar ou arraste com o mouse para reordenar"
                  >
                    <div className="thumb-grip-handle no-print" title="Segure e arraste para reordenar">
                      <GripVertical size={12} />
                    </div>
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
            {/* ── BARRA DE FORMATAÇÃO RICA DO STUDIO DIGIFARMA (ESTILO GOOGLE DOCS / PPT) ── */}
            <div className="canva-doc-toolbar no-print">
              {/* Botão de Adicionar Caixa de Texto Livre */}
              <div className="toolbar-group">
                <button
                  type="button"
                  className="toolbar-btn primary"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={addTextBox}
                  title="Inserir Caixa de Texto Livre e Editável (Arraste e formate como quiser)"
                  style={{
                    background: 'rgba(56, 189, 248, 0.18)',
                    borderColor: 'rgba(56, 189, 248, 0.5)',
                    color: '#38bdf8',
                    fontWeight: 700,
                  }}
                >
                  <Type size={14} color="#38bdf8" />
                  <span>＋ Caixa de Texto</span>
                </button>
              </div>

              <div className="toolbar-divider" />

              {/* Botões Centrais de Recursos (Abrem Modais / Gavetas Limpas) */}
              <div className="toolbar-group">
                <button
                  type="button"
                  className={`toolbar-btn ${activeResourceModal === 'shapes' ? 'active' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setActiveResourceModal('shapes')}
                  title="Abrir Galeria de Formas e Setas"
                >
                  <Shapes size={14} color="#38bdf8" />
                  <span>Formas &amp; Setas</span>
                </button>

                <button
                  type="button"
                  className={`toolbar-btn ${activeResourceModal === 'emojis' ? 'active' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setActiveResourceModal('emojis')}
                  title="Abrir Galeria de Emojis e Símbolos Farmacêuticos"
                >
                  <Smile size={14} color="#facc15" />
                  <span>Emojis</span>
                </button>

                <button
                  type="button"
                  className={`toolbar-btn ${activeResourceModal === 'icons' ? 'active' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setActiveResourceModal('icons')}
                  title="Abrir Ícones do Sistema"
                >
                  <Sparkles size={14} color="#a855f7" />
                  <span>Ícones</span>
                </button>

                <button
                  type="button"
                  className={`toolbar-btn ${activeResourceModal === 'dynamic' ? 'active' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setActiveResourceModal('dynamic')}
                  title="Abrir Recursos Dinâmicos (Dropdowns, Radar, Carimbo, GIFs)"
                >
                  <Zap size={14} color="#f97316" />
                  <span>Dinâmicos</span>
                </button>

                <button
                  type="button"
                  className={`toolbar-btn ${activeResourceModal === 'hands' ? 'active' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setActiveResourceModal('hands')}
                  title="Mãozinhas Indicadoras"
                >
                  <span style={{ fontSize: '1rem' }}>👆</span>
                  <span>Mãozinhas</span>
                </button>
              </div>

              <div className="toolbar-divider" />

              {/* Controles Tipográficos Estilo Word / Docs */}
              <div className="toolbar-group">
                {/* Fonte */}
                <select
                  className="toolbar-select"
                  value={selectedIndicator?.fontFamily || (activeTextTarget ? (textStyles[activeTextTarget]?.fontFamily as string) : 'Inter, sans-serif') || 'Inter, sans-serif'}
                  onMouseDown={(e) => e.stopPropagation()}
                  onChange={(e) => updateActiveStyle({ fontFamily: e.target.value })}
                  title="Família da Fonte"
                >
                  <option value="Inter, sans-serif">Inter (Moderno)</option>
                  <option value="Outfit, sans-serif">Outfit (Tech)</option>
                  <option value="Roboto, sans-serif">Roboto (Clássico)</option>
                  <option value="'Playfair Display', serif">Playfair (Elegante)</option>
                  <option value="'Fira Code', monospace">Fira Code (Mono)</option>
                  <option value="'Bebas Neue', Impact, sans-serif">Bebas Neue (Manchete)</option>
                  <option value="'Nunito', sans-serif">Nunito (Arredondado)</option>
                </select>

                {/* Negrito / Itálico / Sublinhado */}
                <button
                  type="button"
                  className={`toolbar-btn ${selectedIndicator?.isBold || (activeTextTarget && textStyles[activeTextTarget]?.fontWeight === 800) ? 'active' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    const isCurrentlyBold = selectedIndicator?.isBold || (activeTextTarget && textStyles[activeTextTarget]?.fontWeight === 800);
                    updateActiveStyle({ isBold: !isCurrentlyBold });
                  }}
                  title="Negrito"
                >
                  <Bold size={13} />
                </button>
                <button
                  type="button"
                  className={`toolbar-btn ${selectedIndicator?.isItalic || (activeTextTarget && textStyles[activeTextTarget]?.fontStyle === 'italic') ? 'active' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    const isCurrentlyItalic = selectedIndicator?.isItalic || (activeTextTarget && textStyles[activeTextTarget]?.fontStyle === 'italic');
                    updateActiveStyle({ isItalic: !isCurrentlyItalic });
                  }}
                  title="Itálico"
                >
                  <Italic size={13} />
                </button>
                <button
                  type="button"
                  className={`toolbar-btn ${selectedIndicator?.isUnderline || (activeTextTarget && textStyles[activeTextTarget]?.textDecoration === 'underline') ? 'active' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    const isCurrentlyUnderline = selectedIndicator?.isUnderline || (activeTextTarget && textStyles[activeTextTarget]?.textDecoration === 'underline');
                    updateActiveStyle({ isUnderline: !isCurrentlyUnderline });
                  }}
                  title="Sublinhado"
                >
                  <Underline size={13} />
                </button>
              </div>

              <div className="toolbar-divider" />

              {/* Alinhamento de Texto */}
              <div className="toolbar-group">
                <button
                  type="button"
                  className={`toolbar-btn ${selectedIndicator?.textAlign === 'left' || (activeTextTarget && textStyles[activeTextTarget]?.textAlign === 'left') ? 'active' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => updateActiveStyle({ textAlign: 'left' })}
                  title="Alinhar à Esquerda"
                >
                  <AlignLeft size={13} />
                </button>
                <button
                  type="button"
                  className={`toolbar-btn ${(!selectedIndicator?.textAlign || selectedIndicator?.textAlign === 'center' || (activeTextTarget && textStyles[activeTextTarget]?.textAlign === 'center')) ? 'active' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => updateActiveStyle({ textAlign: 'center' })}
                  title="Centralizar"
                >
                  <AlignCenter size={13} />
                </button>
                <button
                  type="button"
                  className={`toolbar-btn ${selectedIndicator?.textAlign === 'right' || (activeTextTarget && textStyles[activeTextTarget]?.textAlign === 'right') ? 'active' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => updateActiveStyle({ textAlign: 'right' })}
                  title="Alinhar à Direita"
                >
                  <AlignRight size={13} />
                </button>
              </div>

              <div className="toolbar-divider" />

              {/* Cores: Texto, Fundo, Borda */}
              <div className="toolbar-group">
                <div
                  className="toolbar-color-btn"
                  title="Cor do Texto"
                  style={{ backgroundColor: selectedIndicator?.textColor || (activeTextTarget ? (textStyles[activeTextTarget]?.color as string) : '#ffffff') || '#ffffff' }}
                >
                  <Type size={12} color="#000" />
                  <input
                    type="color"
                    value={
                      selectedIndicator?.textColor && selectedIndicator.textColor.startsWith('#')
                        ? selectedIndicator.textColor
                        : activeTextTarget && textStyles[activeTextTarget]?.color && String(textStyles[activeTextTarget]?.color).startsWith('#')
                        ? String(textStyles[activeTextTarget]?.color)
                        : '#ffffff'
                    }
                    onChange={(e) => updateActiveStyle({ textColor: e.target.value })}
                  />
                </div>

                <div
                  className="toolbar-color-btn"
                  title="Cor de Fundo / Destaque"
                  style={{ backgroundColor: selectedIndicator?.bgColor || (activeTextTarget ? (textStyles[activeTextTarget]?.backgroundColor as string) : '#0f172a') || '#0f172a' }}
                >
                  <div style={{ width: '8px', height: '8px', border: '1px solid #fff', borderRadius: '2px' }} />
                  <input
                    type="color"
                    value={
                      selectedIndicator?.bgColor && selectedIndicator.bgColor.startsWith('#')
                        ? selectedIndicator.bgColor
                        : activeTextTarget && textStyles[activeTextTarget]?.backgroundColor && String(textStyles[activeTextTarget]?.backgroundColor).startsWith('#')
                        ? String(textStyles[activeTextTarget]?.backgroundColor)
                        : '#0f172a'
                    }
                    onChange={(e) => updateActiveStyle({ bgColor: e.target.value })}
                  />
                </div>

                <div
                  className="toolbar-color-btn"
                  title="Cor da Borda / Contorno"
                  style={{ backgroundColor: selectedIndicator?.color || '#ef4444' }}
                >
                  <input
                    type="color"
                    value={selectedIndicator?.color && selectedIndicator.color.startsWith('#') ? selectedIndicator.color : '#ef4444'}
                    onChange={(e) => updateActiveStyle({ borderColor: e.target.value })}
                  />
                </div>
              </div>

              <div className="toolbar-divider" />

              {/* Escala */}
              <div className="toolbar-group">
                <button
                  type="button"
                  className="toolbar-btn"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => updateActiveStyle({ scaleDelta: -0.15 })}
                  title="Diminuir Tamanho / Escala (-)"
                >
                  <Minus size={12} />
                </button>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, minWidth: '40px', textAlign: 'center', color: '#cbd5e1' }}>
                  {selectedIndicator
                    ? `${Math.round((selectedIndicator.scale ?? 1.0) * 100)}%`
                    : activeTextTarget && textStyles[activeTextTarget]?.fontSize
                    ? textStyles[activeTextTarget]?.fontSize
                    : '100%'}
                </span>
                <button
                  type="button"
                  className="toolbar-btn"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => updateActiveStyle({ scaleDelta: 0.15 })}
                  title="Aumentar Tamanho / Escala (+)"
                >
                  <Plus size={12} />
                </button>
              </div>

              {/* Botão de Excluir Elemento Selecionado */}
              {selectedIndicator && (
                <div className="toolbar-group" style={{ marginLeft: '4px' }}>
                  <button
                    type="button"
                    className="toolbar-btn danger"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => removeIndicator(selectedIndicator.id)}
                    title="Excluir Elemento Selecionado (Atalho: Delete)"
                  >
                    <Trash2 size={13} />
                    <span>Excluir</span>
                  </button>
                </div>
              )}

              {/* Alternar Fundo do Slide */}
              <div className="toolbar-group" style={{ marginLeft: 'auto' }}>
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={toggleSlideTheme}
                  title="Alternar fundo do slide (Escuro / Claro)"
                >
                  <Palette size={13} />
                  <span>Alternar Fundo</span>
                </button>
              </div>
            </div>

            {/* ── MODAIS CENTRALIZADOS DE RECURSOS (FORMAS, EMOJIS, ÍCONES, DINÂMICOS, MÃOZINHAS) ── */}
            {activeResourceModal && (
              <div
                className="canva-resource-modal-backdrop"
                onClick={() => setActiveResourceModal(null)}
              >
                <div
                  className="canva-resource-modal"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="canva-resource-modal-header">
                    <h3>
                      {activeResourceModal === 'shapes' && <><Shapes size={18} color="#38bdf8" /> Galeria de Formas &amp; Setas</>}
                      {activeResourceModal === 'emojis' && <><Smile size={18} color="#facc15" /> Emojis &amp; Símbolos Operacionais</>}
                      {activeResourceModal === 'icons' && <><Sparkles size={18} color="#a855f7" /> Ícones do Sistema Digifarma</>}
                      {activeResourceModal === 'dynamic' && <><Zap size={18} color="#f97316" /> Recursos Dinâmicos &amp; Homologação</>}
                      {activeResourceModal === 'hands' && <><span>👆</span> Mãozinhas Indicadoras</>}
                    </h3>
                    <button
                      type="button"
                      className="canva-resource-modal-close"
                      onClick={() => setActiveResourceModal(null)}
                      title="Fechar"
                    >
                      <XIcon size={18} />
                    </button>
                  </div>

                  <div className="canva-resource-modal-body">
                    {/* MODAL 1: FORMAS & SETAS */}
                    {activeResourceModal === 'shapes' && (
                      <div className="resource-items-grid">
                        <div className="resource-item-card" onClick={() => { addRectangle('outline'); setActiveResourceModal(null); }}>
                          <div className="item-preview">
                            <div style={{ width: '48px', height: '28px', border: '2px solid #ef4444', borderRadius: '4px' }} />
                          </div>
                          <span className="item-label">Moldura Neon</span>
                        </div>
                        <div className="resource-item-card" onClick={() => { addRectangle('filled'); setActiveResourceModal(null); }}>
                          <div className="item-preview">
                            <div style={{ width: '48px', height: '28px', background: 'rgba(239,68,68,0.75)', border: '2px solid #ef4444', borderRadius: '4px' }} />
                          </div>
                          <span className="item-label">Caixa Preenchida</span>
                        </div>
                        <div className="resource-item-card" onClick={() => { addCustomShape('pill', 'filled', '#ef4444', 'Tag Destaque'); setActiveResourceModal(null); }}>
                          <div className="item-preview">
                            <div style={{ padding: '3px 10px', background: '#ef4444', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 800 }}>Pílula</div>
                          </div>
                          <span className="item-label">Pílula / Tag</span>
                        </div>
                        <div className="resource-item-card" onClick={() => { addCircle('outline'); setActiveResourceModal(null); }}>
                          <div className="item-preview">
                            <div style={{ width: '32px', height: '32px', border: '2px solid #ef4444', borderRadius: '50%' }} />
                          </div>
                          <span className="item-label">Círculo Vazado</span>
                        </div>
                        <div className="resource-item-card" onClick={() => { addCircle('filled'); setActiveResourceModal(null); }}>
                          <div className="item-preview">
                            <div style={{ width: '32px', height: '32px', background: '#ef4444', borderRadius: '50%' }} />
                          </div>
                          <span className="item-label">Bolinha Marcador</span>
                        </div>
                        <div className="resource-item-card" onClick={() => { addCustomShape('line', 'filled', '#ef4444'); setActiveResourceModal(null); }}>
                          <div className="item-preview">
                            <div style={{ width: '54px', height: '4px', background: '#ef4444', borderRadius: '2px' }} />
                          </div>
                          <span className="item-label">Linha Divisória</span>
                        </div>
                        <div className="resource-item-card" onClick={() => { addCustomShape('speech-bubble', 'filled', '#ef4444', 'Atenção aqui!'); setActiveResourceModal(null); }}>
                          <div className="item-preview">
                            <div style={{ padding: '4px 8px', background: '#1e293b', border: '1.5px solid #ef4444', borderRadius: '6px', fontSize: '0.68rem' }}>Balão 💬</div>
                          </div>
                          <span className="item-label">Balão de Fala</span>
                        </div>
                        <div className="resource-item-card" onClick={() => { addArrow('right'); setActiveResourceModal(null); }}>
                          <div className="item-preview">
                            <ArrowRight size={24} color="#ef4444" />
                          </div>
                          <span className="item-label">Seta Direita</span>
                        </div>
                        <div className="resource-item-card" onClick={() => { addArrow('down'); setActiveResourceModal(null); }}>
                          <div className="item-preview">
                            <ArrowDown size={24} color="#ef4444" />
                          </div>
                          <span className="item-label">Seta Abaixo</span>
                        </div>
                        <div className="resource-item-card" onClick={() => { addArrow('up'); setActiveResourceModal(null); }}>
                          <div className="item-preview">
                            <ArrowUp size={24} color="#ef4444" />
                          </div>
                          <span className="item-label">Seta Acima</span>
                        </div>
                        <div className="resource-item-card" onClick={() => { addArrow('left'); setActiveResourceModal(null); }}>
                          <div className="item-preview">
                            <ArrowLeft size={24} color="#ef4444" />
                          </div>
                          <span className="item-label">Seta Esquerda</span>
                        </div>
                        <div className="resource-item-card" onClick={() => { addTextBox(); setActiveResourceModal(null); }}>
                          <div className="item-preview">
                            <Type size={22} color="#38bdf8" />
                          </div>
                          <span className="item-label">Caixa de Texto</span>
                        </div>
                        <div className="resource-item-card" onClick={() => { addBadge(); setActiveResourceModal(null); }}>
                          <div className="item-preview">
                            <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.68rem', padding: '2px 8px', borderRadius: '999px', fontWeight: 800 }}>TAG</span>
                          </div>
                          <span className="item-label">Badge de Alerta</span>
                        </div>
                      </div>
                    )}

                    {/* MODAL 2: EMOJIS & SÍMBOLOS */}
                    {activeResourceModal === 'emojis' && (
                      <div>
                        <div className="resource-category-tabs">
                          <button
                            type="button"
                            className={`resource-cat-tab ${emojiCategory === 'operacoes' ? 'active' : ''}`}
                            onClick={() => setEmojiCategory('operacoes')}
                          >
                            Operações &amp; Sistema
                          </button>
                          <button
                            type="button"
                            className={`resource-cat-tab ${emojiCategory === 'status' ? 'active' : ''}`}
                            onClick={() => setEmojiCategory('status')}
                          >
                            Status &amp; Alertas
                          </button>
                          <button
                            type="button"
                            className={`resource-cat-tab ${emojiCategory === 'farmacia' ? 'active' : ''}`}
                            onClick={() => setEmojiCategory('farmacia')}
                          >
                            Farmácia &amp; BPF
                          </button>
                          <button
                            type="button"
                            className={`resource-cat-tab ${emojiCategory === 'setas' ? 'active' : ''}`}
                            onClick={() => setEmojiCategory('setas')}
                          >
                            Setas &amp; Números
                          </button>
                        </div>

                        <div className="resource-items-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))' }}>
                          {(emojiCategory === 'operacoes' ? [
                            '💊', '💉', '🩺', '🧪', '🔬', '📋', '📦', '🛒', '🏷️', '🏢',
                            '💻', '🖥️', '🖨️', '📱', '📊', '📈', '📄', '📁', '🔍', '🔎',
                            '⌨️', '🖱️', '💾', '⚙️', '📂', '📑', '🧾', '💰', '💳', '💵'
                          ] : emojiCategory === 'status' ? [
                            '✅', '⚠️', '❌', '🚨', '💡', '⚡', '🛑', '⛔', '🔔', '🔒',
                            '🔑', '🛡️', '⭐', '🌟', '🎯', '📌', '🏆', '💯', 'ℹ️', '❓',
                            '🟢', '🟡', '🔴', '🔵', '🟣', '🟠', '✔️', '✖️', '❗️', '❕'
                          ] : emojiCategory === 'farmacia' ? [
                            '💊', '🩺', '🧪', '🧤', '😷', '🧼', '🌡️', '🏥', '⚕️', '📝',
                            '📅', '⏰', '✍️', '🤝', '💼', '⚖️', '🏷️', '📦', '🚚', '🔐',
                            '🧬', '🩸', '🩹', '🩻', '🧴', '🧾', '🔬', '🚑', '📊', '🥇'
                          ] : [
                            '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '🔄', '🔀', '⏩', '⏪',
                            '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟',
                            '👉', '👈', '👆', '👇', '🎯', '📍', '🚩', '🏁', '🔺', '🔻'
                          ]).map((em) => (
                            <div
                              key={em}
                              className="resource-item-card"
                              onClick={() => {
                                addEmoji(em);
                                setActiveResourceModal(null);
                              }}
                              style={{ padding: '10px 4px' }}
                            >
                              <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>{em}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* MODAL 3: ÍCONES DO SISTEMA */}
                    {activeResourceModal === 'icons' && (
                      <div>
                        <div style={{ marginBottom: '14px', position: 'relative' }}>
                          <input
                            type="text"
                            placeholder="Buscar ícone (ex: alvo, check, alerta, cursor, estrela)..."
                            value={iconSearchQuery}
                            onChange={(e) => setIconSearchQuery(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px 14px 10px 36px',
                              background: '#1e293b',
                              border: '1px solid #334155',
                              borderRadius: '8px',
                              color: '#fff',
                              fontSize: '0.85rem',
                              outline: 'none',
                            }}
                          />
                          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                        </div>

                        <div className="resource-items-grid">
                          {[
                            { name: 'target' as IndicatorIconName, label: 'Alvo', icon: <Target size={22} color="#f59e0b" /> },
                            { name: 'cursor' as IndicatorIconName, label: 'Cursor', icon: <MousePointer size={22} color="#3b82f6" /> },
                            { name: 'alert' as IndicatorIconName, label: 'Alerta', icon: <AlertTriangle size={22} color="#ef4444" /> },
                            { name: 'star' as IndicatorIconName, label: 'Estrela', icon: <Star size={22} color="#eab308" fill="#eab308" /> },
                            { name: 'check' as IndicatorIconName, label: 'Conferido', icon: <Check size={22} color="#10b981" /> },
                            { name: 'info' as IndicatorIconName, label: 'Informação', icon: <Info size={22} color="#38bdf8" /> },
                            { name: 'bolt' as IndicatorIconName, label: 'Raio / Ação', icon: <Zap size={22} color="#f59e0b" fill="#f59e0b" /> },
                            { name: 'forbidden' as IndicatorIconName, label: 'Proibido', icon: <Ban size={22} color="#ef4444" /> },
                            { name: 'lock' as IndicatorIconName, label: 'Segurança', icon: <Lock size={22} color="#10b981" /> },
                          ]
                            .filter((item) => !iconSearchQuery || item.label.toLowerCase().includes(iconSearchQuery.toLowerCase()))
                            .map((item) => (
                              <div
                                key={item.name}
                                className="resource-item-card"
                                onClick={() => {
                                  addIcon(item.name);
                                  setActiveResourceModal(null);
                                }}
                              >
                                <div className="item-preview">{item.icon}</div>
                                <span className="item-label">{item.label}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* MODAL 4: DINÂMICOS & HOMOLOGAÇÃO */}
                    {activeResourceModal === 'dynamic' && (
                      <div className="resource-items-grid">
                        <div className="resource-item-card" onClick={() => { addDropdown(); setActiveResourceModal(null); }}>
                          <div className="item-preview">
                            <ChevronDown size={24} color="#38bdf8" />
                          </div>
                          <span className="item-label">Menu Suspenso</span>
                        </div>
                        <div className="resource-item-card" onClick={() => { addSpotlightBeacon(); setActiveResourceModal(null); }}>
                          <div className="item-preview">
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #ef4444', background: 'rgba(239,68,68,0.3)' }} />
                          </div>
                          <span className="item-label">Radar Sonar</span>
                        </div>
                        <div className="resource-item-card" onClick={() => { addStamp('HOMOLOGADO BPF', '#10b981'); setActiveResourceModal(null); }}>
                          <div className="item-preview">
                            <Award size={24} color="#10b981" />
                          </div>
                          <span className="item-label">Carimbo BPF</span>
                        </div>
                        <div className="resource-item-card" onClick={() => { addStamp('AUDITADO QUALIDADE', '#3b82f6'); setActiveResourceModal(null); }}>
                          <div className="item-preview">
                            <CheckSquare size={24} color="#3b82f6" />
                          </div>
                          <span className="item-label">Carimbo Auditoria</span>
                        </div>
                        <div className="resource-item-card" onClick={() => { addAnimatedGif(); setActiveResourceModal(null); }}>
                          <div className="item-preview">
                            <Sparkles size={24} color="#f59e0b" />
                          </div>
                          <span className="item-label">GIF Animado</span>
                        </div>
                      </div>
                    )}

                    {/* MODAL 5: MÃOZINHAS INDICADORAS */}
                    {activeResourceModal === 'hands' && (
                      <div className="resource-items-grid">
                        <div className="resource-item-card" onClick={() => { addPointingHand('up', '#ef4444'); setActiveResourceModal(null); }}>
                          <div className="item-preview"><span style={{ fontSize: '2rem' }}>👆</span></div>
                          <span className="item-label">Apontar Acima</span>
                        </div>
                        <div className="resource-item-card" onClick={() => { addPointingHand('right', '#ef4444'); setActiveResourceModal(null); }}>
                          <div className="item-preview"><span style={{ fontSize: '2rem' }}>👉</span></div>
                          <span className="item-label">Apontar Direita</span>
                        </div>
                        <div className="resource-item-card" onClick={() => { addPointingHand('down', '#ef4444'); setActiveResourceModal(null); }}>
                          <div className="item-preview"><span style={{ fontSize: '2rem' }}>👇</span></div>
                          <span className="item-label">Apontar Abaixo</span>
                        </div>
                        <div className="resource-item-card" onClick={() => { addPointingHand('left', '#ef4444'); setActiveResourceModal(null); }}>
                          <div className="item-preview"><span style={{ fontSize: '2rem' }}>👈</span></div>
                          <span className="item-label">Apontar Esquerda</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

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
