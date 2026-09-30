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
} from '../types/procedure';
import type { AppUser } from '../types/auth';
import { uploadProcedureImage } from '../lib/supabase';
import { downloadProcedureHtml } from '../lib/htmlExporter';

interface ProcedureEditorProps {
  initialProcedure?: Procedure | null;
  menus: SystemMenu[];
  activeVersion: SystemVersion;
  currentUser?: AppUser | null;
  onSave: (procedure: Procedure) => Promise<void>;
  onCancel: () => void;
}

export const ProcedureEditor: React.FC<ProcedureEditorProps> = ({
  initialProcedure,
  menus,
  activeVersion,
  currentUser,
  onSave,
  onCancel,
}) => {
  // Modo de Exibição do Editor: 'canva' (Studio Visual) ou 'pdf-preview' (Páginas A4 Interativas)
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

  // Configurações de Slides & Indicadores (Mãozinhas, Spotlights, Cores)
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
            x: 52,
            y: 58,
            label: 'Campo Código',
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

  // Feedback de Toast e Status de Salvamento
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRootRef = useRef<HTMLDivElement>(null);

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
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            processPastedImageFile(file);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [activeSlideIndex, steps.length]);

  const processPastedImageFile = async (file: File) => {
    setUploading(true);
    showToast('Processando imagem colada...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      // Se o slide ativo for uma etapa, associa a essa etapa
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
        // mantém DataURL
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
  // 2. GESTÃO DE SLIDES, INDICADORES & FORMAS
  // ─────────────────────────────────────────────────────────────
  const currentStepIndex = activeSlideIndex === 0 ? 0 : Math.min(activeSlideIndex - 1, steps.length - 1);
  const currentStep = steps[currentStepIndex];

  // Adicionar Mãozinha Indicadora na Imagem da Etapa Ativa
  const addPointingHand = (direction: 'up' | 'down' | 'left' | 'right' = 'up') => {
    const stepIdx = currentStepIndex;
    const newIndicator: SlideIndicator = {
      id: `ind-${Date.now()}`,
      type: 'hand',
      direction,
      x: 50,
      y: 50,
      label: 'Campo de Ação',
    };

    setSlidesConfig((prev) => {
      const exists = prev.find((s) => s.stepIndex === stepIdx);
      if (exists) {
        return prev.map((s) =>
          s.stepIndex === stepIdx
            ? { ...s, indicators: [...(s.indicators || []), newIndicator] }
            : s
        );
      }
      return [
        ...prev,
        {
          id: `slide-step-${stepIdx}`,
          slideType: 'step',
          stepIndex: stepIdx,
          bgTheme: 'light',
          indicators: [newIndicator],
        },
      ];
    });

    showToast(`Mãozinha indicadora (${direction}) adicionada à tela!`);
  };

  // Adicionar Anel Pulsante (Spotlight Radar)
  const addSpotlightBeacon = () => {
    const stepIdx = currentStepIndex;
    const newIndicator: SlideIndicator = {
      id: `spot-${Date.now()}`,
      type: 'spotlight',
      x: 50,
      y: 50,
    };

    setSlidesConfig((prev) => {
      return prev.map((s) =>
        s.stepIndex === stepIdx
          ? { ...s, indicators: [...(s.indicators || []), newIndicator] }
          : s
      );
    });

    showToast('Anel pulsante adicionado sobre a interface!');
  };

  // Adicionar Badge / Tag Flutuante
  const addFloatingBadge = () => {
    const label = prompt('Digite o texto da tag ou alerta:', 'Campo Obrigatório');
    if (!label) return;

    const stepIdx = currentStepIndex;
    const newIndicator: SlideIndicator = {
      id: `badge-${Date.now()}`,
      type: 'badge',
      x: 40,
      y: 40,
      label: label.trim(),
    };

    setSlidesConfig((prev) => {
      return prev.map((s) =>
        s.stepIndex === stepIdx
          ? { ...s, indicators: [...(s.indicators || []), newIndicator] }
          : s
      );
    });
  };

  // Adicionar GIF Animado
  const addAnimatedGif = () => {
    const url = prompt(
      'Insira o link direto de um GIF demonstrativo (ex: clique, digitação, animação):',
      'https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif'
    );
    if (!url) return;

    const stepIdx = currentStepIndex;
    const newIndicator: SlideIndicator = {
      id: `gif-${Date.now()}`,
      type: 'gif',
      x: 60,
      y: 40,
      gifUrl: url.trim(),
    };

    setSlidesConfig((prev) => {
      return prev.map((s) =>
        s.stepIndex === stepIdx
          ? { ...s, indicators: [...(s.indicators || []), newIndicator] }
          : s
      );
    });

    showToast('GIF animado anexado ao passo a passo!');
  };

  // Mover / Reposicionar Indicador ao clicar na tela
  const handleShotframeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const stepIdx = currentStepIndex;
    const currentCfg = slidesConfig.find((s) => s.stepIndex === stepIdx);
    const indicators = currentCfg?.indicators || [];

    if (indicators.length > 0) {
      // Reposiciona o último indicador adicionado
      const lastIndId = indicators[indicators.length - 1].id;
      setSlidesConfig((prev) =>
        prev.map((s) =>
          s.stepIndex === stepIdx
            ? {
                ...s,
                indicators: (s.indicators || []).map((ind) =>
                  ind.id === lastIndId ? { ...ind, x, y } : ind
                ),
              }
            : s
        )
      );
    } else {
      // Se não houver, adiciona uma mãozinha onde clicou
      const newIndicator: SlideIndicator = {
        id: `ind-${Date.now()}`,
        type: 'hand',
        direction: 'up',
        x,
        y,
        label: 'Ação Aqui',
      };
      setSlidesConfig((prev) =>
        prev.map((s) =>
          s.stepIndex === stepIdx
            ? { ...s, indicators: [...(s.indicators || []), newIndicator] }
            : s
        )
      );
    }
  };

  // Remover Indicador
  const removeIndicator = (indId: string) => {
    const stepIdx = currentStepIndex;
    setSlidesConfig((prev) =>
      prev.map((s) =>
        s.stepIndex === stepIdx
          ? { ...s, indicators: (s.indicators || []).filter((i) => i.id !== indId) }
          : s
      )
    );
  };

  // Alternar Cor / Tema do Slide Ativo (Deep Escuro vs Claro)
  const toggleSlideTheme = () => {
    const stepIdx = currentStepIndex;
    setSlidesConfig((prev) =>
      prev.map((s) => {
        if (s.stepIndex === stepIdx || (activeSlideIndex === 0 && s.slideType === 'cover')) {
          const next = s.bgTheme === 'deep' || s.bgTheme === 'dark' ? 'light' : 'deep';
          return { ...s, bgTheme: next };
        }
        return s;
      })
    );
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
      alert('O procedimento deve conter pelo menos uma etapa operacional.');
      return;
    }
    const updated = steps.filter((_, idx) => idx !== indexToRemove);
    setSteps(updated);
    setActiveSlideIndex(Math.max(1, activeSlideIndex - 1));
    showToast('Etapa removida.');
  };

  const moveStep = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= steps.length) return;
    const updated = [...steps];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setSteps(updated);
    setActiveSlideIndex(toIndex + 1);
  };

  // ─────────────────────────────────────────────────────────────
  // 4. SALVAMENTO E EXPORTAÇÕES (PDF E HTML)
  // ─────────────────────────────────────────────────────────────
  const constructProcedureToSave = (): Procedure => {
    const nowIso = new Date().toISOString();
    const isNew = !initialProcedure?.id;
    const authorName = currentUser?.name || currentUser?.username || author.trim() || 'Leonardo Trevas';

    const selectedMenu = menus.find((m) => m.id === menuId);
    const categoryName = selectedMenu?.label || 'Geral';

    // Montar blocos compatíveis com o motor legado
    const blocks: ProcedureBlock[] = [];

    // Etapas e Imagens associadas
    steps.forEach((step, idx) => {
      blocks.push(step);
      if (images[idx]) {
        blocks.push({
          id: `img-${step.id}`,
          type: 'image',
          url: images[idx],
          caption: `Figura ${idx + 1}: Interface do Digifarma para ${step.title}`,
        });
      }
    });

    // Alertas
    callouts.forEach((c) => blocks.push(c));

    const currentHistory: ProcedureHistoryItem[] = Array.isArray(initialProcedure?.history)
      ? [...initialProcedure.history]
      : [];

    const newHistoryItem: ProcedureHistoryItem = {
      action: isNew ? 'create' : 'update',
      timestamp: nowIso,
      user: authorName,
      description: isNew ? 'Criação do procedimento no Studio Canva' : 'Edição visual de slides e indicadores',
      details: isNew ? 'Criação do procedimento' : 'Atualização de conteúdo e passos',
    };

    return {
      id: initialProcedure?.id || `proc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      subtitle: subtitle.trim(),
      category: categoryName,
      systemVersion,
      menuId,
      submenuId: submenuId || undefined,
      systemPath: systemPath.trim() || undefined,
      author: author.trim() || authorName,
      tags: [categoryName, systemVersion === 'v10' ? 'V10' : 'R78', 'BPF'],
      blocks,
      slidesConfig,
      is_favorite: initialProcedure?.is_favorite || false,
      created_at: initialProcedure?.created_at || nowIso,
      updated_at: nowIso,
      createdBy: initialProcedure?.createdBy || authorName,
      updatedBy: authorName,
      history: [newHistoryItem, ...currentHistory],
    };
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Informe o título do procedimento.');
      return;
    }

    setSaving(true);
    try {
      const proc = constructProcedureToSave();
      await onSave(proc);
      showToast('Procedimento salvo com sucesso!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Erro ao salvar: ${msg}`);
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
            title="Baixar arquivo HTML com animações da mãozinha e GIFs"
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
                onClick={() => setActiveSlideIndex(0)}
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
                  onClick={() => setActiveSlideIndex(idx + 1)}
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
                onClick={() => setActiveSlideIndex(steps.length + 1)}
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
                onClick={() => setActiveSlideIndex(steps.length + 2)}
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
                onClick={() => setActiveSlideIndex(steps.length + 3)}
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
            {/* Barra de Ferramentas de Design do Canva (Formas, Mãozinha, Cores, Sombra) */}
            <div className="canva-design-tools">
              <div className="tool-group">
                <span className="tool-label">Indicadores & Dinamismo:</span>
                <button
                  type="button"
                  className="canva-tool-btn"
                  onClick={() => addPointingHand('up')}
                  title="Adicionar mãozinha apontando para cima (👆)"
                >
                  <span className="emoji-tool">👆</span>
                  <span>Mãozinha Acima</span>
                </button>
                <button
                  type="button"
                  className="canva-tool-btn"
                  onClick={() => addPointingHand('right')}
                  title="Adicionar mãozinha apontando para a direita (👉)"
                >
                  <span className="emoji-tool">👉</span>
                  <span>Mãozinha Direita</span>
                </button>
                <button
                  type="button"
                  className="canva-tool-btn"
                  onClick={addSpotlightBeacon}
                  title="Adicionar anel radar pulsante no campo da tela"
                >
                  <Circle size={14} color="var(--red)" />
                  <span>Anel Radar</span>
                </button>
                <button
                  type="button"
                  className="canva-tool-btn"
                  onClick={addFloatingBadge}
                  title="Adicionar badge de aviso sobre a imagem"
                >
                  <Square size={14} />
                  <span>Badge Alerta</span>
                </button>
                <button
                  type="button"
                  className="canva-tool-btn"
                  onClick={addAnimatedGif}
                  title="Adicionar GIF animado"
                >
                  <Sparkles size={14} color="#f59e0b" />
                  <span>GIF Animado</span>
                </button>
              </div>

              <div className="tool-group" style={{ marginLeft: 'auto' }}>
                <span className="tool-label">Tema da Página:</span>
                <button
                  type="button"
                  className="canva-tool-btn"
                  onClick={toggleSlideTheme}
                  title="Alternar entre fundo Escuro e Claro"
                >
                  <Palette size={14} />
                  <span>Alternar Fundo</span>
                </button>
              </div>
            </div>

            {/* Dica de Colagem Rápida Ctrl+V */}
            <div className="canva-paste-indicator">
              <ClipboardPaste size={15} color="var(--red)" />
              <span>
                <strong>Dica Pro:</strong> Copie qualquer print screen ou imagem no computador e pressione{' '}
                <kbd>Ctrl + V</kbd> para colar direto nesta etapa!
              </span>
            </div>

            {/* Visual Canvas do Slide Ativo */}
            <div className="canva-slide-viewport">
              {/* Slide 0: Capa */}
              {activeSlideIndex === 0 && (
                <div className="slide deep canva-slide-canvas">
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
                </div>
              )}

              {/* Slides 1..N: Etapas Operacionais com Shotframe Interativo */}
              {activeSlideIndex > 0 && activeSlideIndex <= steps.length && currentStep && (
                <div className="slide light canva-slide-canvas">
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

                      {/* Shotframe com Suporte a Colar Imagem e Indicadores */}
                      <div className="shotframe">
                        <div
                          className="frame canva-interactive-frame"
                          onClick={handleShotframeClick}
                          title="Clique na imagem para mover ou posicionar o indicador / mãozinha!"
                        >
                          {images[currentStepIndex] ? (
                            <img
                              src={images[currentStepIndex]}
                              alt={currentStep.title}
                              className="canva-step-img"
                            />
                          ) : (
                            <div className="canva-placeholder-drop">
                              <ImageIcon size={38} color="var(--red)" />
                              <strong>Nenhuma imagem anexada</strong>
                              <span>Cole um print com Ctrl+V ou clique no botão abaixo</span>
                            </div>
                          )}

                          {/* Indicadores & Mãozinhas renderizadas sobre a tela */}
                          {(
                            slidesConfig.find((s) => s.stepIndex === currentStepIndex)?.indicators || []
                          ).map((ind) => {
                            if (ind.type === 'hand') {
                              const handIcon =
                                ind.direction === 'down'
                                  ? '👇'
                                  : ind.direction === 'left'
                                  ? '👈'
                                  : ind.direction === 'right'
                                  ? '👉'
                                  : '👆';
                              return (
                                <div
                                  key={ind.id}
                                  className={`pointing-hand ${ind.direction || 'up'}`}
                                  style={{ left: `${ind.x}%`, top: `${ind.y}%` }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Deseja remover esta mãozinha indicadora?')) {
                                      removeIndicator(ind.id);
                                    }
                                  }}
                                  title="Clique para remover indicador"
                                >
                                  {handIcon}
                                </div>
                              );
                            }
                            if (ind.type === 'spotlight') {
                              return (
                                <div
                                  key={ind.id}
                                  className="spotlight-beacon"
                                  style={{ left: `${ind.x}%`, top: `${ind.y}%` }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeIndicator(ind.id);
                                  }}
                                />
                              );
                            }
                            if (ind.type === 'badge') {
                              return (
                                <div
                                  key={ind.id}
                                  className="floating-badge"
                                  style={{ left: `${ind.x}%`, top: `${ind.y}%` }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeIndicator(ind.id);
                                  }}
                                >
                                  {ind.label || 'Atenção'}
                                </div>
                              );
                            }
                            if (ind.type === 'gif' && ind.gifUrl) {
                              return (
                                <img
                                  key={ind.id}
                                  src={ind.gifUrl}
                                  alt="GIF"
                                  style={{
                                    position: 'absolute',
                                    left: `${ind.x}%`,
                                    top: `${ind.y}%`,
                                    maxWidth: '90px',
                                    borderRadius: '8px',
                                    zIndex: 10,
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeIndicator(ind.id);
                                  }}
                                />
                              );
                            }
                            return null;
                          })}
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
                <div className="slide light canva-slide-canvas">
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
                </div>
              )}

              {/* Slide Checklist */}
              {activeSlideIndex === steps.length + 2 && (
                <div className="slide light canva-slide-canvas">
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
                </div>
              )}

              {/* Slide Assinaturas */}
              {activeSlideIndex === steps.length + 3 && (
                <div className="slide deep canva-slide-canvas">
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
              📄 <strong>Modo Editor de PDF Embutido:</strong> Você está visualizando o layout final de impressão. Todos os textos são editáveis diretamente nas páginas!
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

          <div className="presentation-manual-root" id="printable-procedure">
            {/* Página 1: Capa */}
            <section className="slide deep cover">
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
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => setTitle(e.currentTarget.textContent || title)}
                >
                  {title}
                </h1>
                <p
                  className="lead"
                  contentEditable
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
            </section>

            {/* Páginas 2..N: Etapas Operacionais */}
            {steps.map((step, idx) => {
              const stepNum = String(idx + 1).padStart(2, '0');
              const imgUrl = images[idx];
              const slideCfg = slidesConfig.find((s) => s.stepIndex === idx);
              const indicators = slideCfg?.indicators || [];

              return (
                <section key={step.id} className="slide light step-slide">
                  <div className="inner">
                    <p className="eyebrow">
                      <span>ETAPA {stepNum}</span> · Digifarma Treinamento
                    </p>

                    <h2
                      className="head"
                      contentEditable
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
                      contentEditable
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

                          {/* Mãozinhas no preview */}
                          {indicators.map((ind) => {
                            if (ind.type === 'hand') {
                              const handIcon =
                                ind.direction === 'down'
                                  ? '👇'
                                  : ind.direction === 'left'
                                  ? '👈'
                                  : ind.direction === 'right'
                                  ? '👉'
                                  : '👆';
                              return (
                                <div
                                  key={ind.id}
                                  className={`pointing-hand ${ind.direction || 'up'}`}
                                  style={{ left: `${ind.x}%`, top: `${ind.y}%` }}
                                >
                                  {handIcon}
                                </div>
                              );
                            }
                            if (ind.type === 'spotlight') {
                              return (
                                <div
                                  key={ind.id}
                                  className="spotlight-beacon"
                                  style={{ left: `${ind.x}%`, top: `${ind.y}%` }}
                                />
                              );
                            }
                            if (ind.type === 'badge') {
                              return (
                                <div
                                  key={ind.id}
                                  className="floating-badge"
                                  style={{ left: `${ind.x}%`, top: `${ind.y}%` }}
                                >
                                  {ind.label || 'Atenção'}
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}

            {/* Página Final: Homologação */}
            <section className="slide deep">
              <div className="inner">
                <div className="logo">
                  <span className="a">Digi</span>
                  <span className="b">farma</span>
                </div>
                <div className="v10-badge">HOMOLOGAÇÃO OFICIAL BPF</div>
                <h1 className="display" style={{ fontSize: '38px' }}>
                  Controle da Qualidade &amp; Assinaturas
                </h1>
                <p className="lead">
                  Procedimento auditado e homologado pelo Responsável Técnico e equipe de processos.
                </p>

                <div className="print-signatures-grid" style={{ marginTop: '48px' }}>
                  <div className="print-sign-col">
                    <span className="print-sign-title">ELABORADO POR</span>
                    <div className="print-sign-line"></div>
                    <span className="print-sign-name">{author}</span>
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
            </section>
          </div>
        </div>
      )}
    </div>
  );
};
