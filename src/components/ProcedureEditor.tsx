import React, { useState } from 'react';
import {
  Save,
  ArrowLeft,
  Heading,
  AlignLeft,
  Image as ImageIcon,
  AlertTriangle,
  CheckSquare,
  ArrowUp,
  ArrowDown,
  Trash2,
  Copy,
  Upload,
  Link as LinkIcon,
  Loader2,
  FileText,
  Tag,
  User,
  Building2,
  Monitor,
  Navigation,
  AlertCircle,
} from 'lucide-react';
import type {
  Procedure,
  ProcedureBlock,
  HeadingBlock,
  TextBlock,
  ImageBlock,
  CalloutBlock,
  StepBlock,
  BlockType,
  CalloutVariant,
  SystemMenu,
  SystemVersion,
} from '../types/procedure';
import { uploadProcedureImage } from '../lib/supabase';

interface ProcedureEditorProps {
  initialProcedure?: Procedure | null;
  menus: SystemMenu[];
  activeVersion: SystemVersion;
  onSave: (procedure: Procedure) => Promise<void>;
  onCancel: () => void;
}

export const ProcedureEditor: React.FC<ProcedureEditorProps> = ({
  initialProcedure,
  menus,
  activeVersion,
  onSave,
  onCancel,
}) => {
  const [title, setTitle] = useState(initialProcedure?.title || '');
  const [subtitle, setSubtitle] = useState(initialProcedure?.subtitle || '');
  const [systemPath, setSystemPath] = useState(initialProcedure?.systemPath || '');
  const [systemVersion, setSystemVersion] = useState<SystemVersion | 'ambos'>(
    initialProcedure?.systemVersion || activeVersion
  );
  const [menuId, setMenuId] = useState(initialProcedure?.menuId || (menus[0]?.id || 'cadastros'));
  const [submenuId, setSubmenuId] = useState(initialProcedure?.submenuId || '');
  const category = initialProcedure?.category || 'Cadastros';
  const [author, setAuthor] = useState(initialProcedure?.author || 'Farmacêutico Responsável');
  const [tagsInput, setTagsInput] = useState(initialProcedure?.tags?.join(', ') || '');
  const [blocks, setBlocks] = useState<ProcedureBlock[]>(
    initialProcedure?.blocks && initialProcedure.blocks.length > 0
      ? initialProcedure.blocks
      : [
          {
            id: `b-${Date.now()}-1`,
            type: 'heading',
            content: '1. Acesso à Rotina no Digifarma',
          } as HeadingBlock,
          {
            id: `b-${Date.now()}-2`,
            type: 'text',
            content: 'Descreva detalhadamente o primeiro passo operacional que o colaborador deve realizar...',
          } as TextBlock,
        ]
  );

  const [saving, setSaving] = useState(false);
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Adição de Blocos
  const addBlock = (type: BlockType, afterIndex?: number) => {
    const id = `block-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    let newBlock: ProcedureBlock;

    switch (type) {
      case 'heading':
        newBlock = { id, type: 'heading', content: '', level: 2 };
        break;
      case 'text':
        newBlock = { id, type: 'text', content: '' };
        break;
      case 'image':
        newBlock = { id, type: 'image', url: '', caption: '', altText: '' };
        break;
      case 'callout':
        newBlock = { id, type: 'callout', calloutType: 'info', content: '', title: 'Informação Importante' };
        break;
      case 'step':
        newBlock = { id, type: 'step', content: '', completed: false };
        break;
      default:
        return;
    }

    if (typeof afterIndex === 'number' && afterIndex >= 0) {
      const updated = [...blocks];
      updated.splice(afterIndex + 1, 0, newBlock);
      setBlocks(updated);
    } else {
      setBlocks((prev) => [...prev, newBlock]);
    }
  };

  const updateBlock = (id: string, updates: Partial<ProcedureBlock>) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id === id) {
          return { ...block, ...updates } as ProcedureBlock;
        }
        return block;
      })
    );
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    const updated = [...blocks];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setBlocks(updated);
  };

  const duplicateBlock = (block: ProcedureBlock, index: number) => {
    const duplicated: ProcedureBlock = {
      ...block,
      id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    const updated = [...blocks];
    updated.splice(index + 1, 0, duplicated);
    setBlocks(updated);
  };

  // Carregar Modelos Prontos no Padrão Digifarma V10
  const loadTemplate = (templateKey: 'f7' | 'cliente360' | 'caixaCego' | 'recebimento' | 'controlados') => {
    if (blocks.length > 2) {
      const confirmReplace = window.confirm(
        'Deseja carregar este modelo pronto? O conteúdo atual dos passos será substituído pela estrutura do modelo.'
      );
      if (!confirmReplace) return;
    }

    if (templateKey === 'f7') {
      setTitle('Consulta F7 Inteligente, Pesquisa por Sintoma (IA) e Bula Completa');
      setSubtitle('Procedimento de atendimento no balcão usando o F7 inteligente: pesquisa por necessidade com IA (Ctrl+Enter), equivalente genérico com máxima economia e conferência de bula');
      setSystemPath('Digifarma V10 ➔ Balcão / PDV ➔ Tabela de Preços (F7) ➔ Pesquisa IA (Ctrl+Enter)');
      setSystemVersion('v10');
      setAuthor('Farmacêutico RT / Coordenação de Atendimento');
      setTagsInput('V10, F7, Tabela de Preços, Inteligência Artificial, Genéricos, Bula');
      setBlocks([
        { id: `h-${Date.now()}-1`, type: 'heading', content: '1. Abertura da Tabela de Preços F7 no Balcão', level: 2 },
        { id: `t-${Date.now()}-2`, type: 'text', content: 'No balcão ou caixa, pressione F7. O sistema exibe simultaneamente a foto do medicamento, valor da última compra, PMC e a coluna tabloide de ofertas.' },
        { id: `c-${Date.now()}-3`, type: 'callout', calloutType: 'info', title: 'Pesquisa por Sintoma com IA (Ctrl + Enter)', content: 'Quando o cliente não souber o nome do medicamento, tecle Ctrl + Enter e descreva o sintoma. A IA sugere as substâncias e medicamentos ideais.' },
        { id: `i-${Date.now()}-4`, type: 'image', url: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=1200&q=80', caption: 'Figura 1: Tabela F7 com foto do produto e equivalentes genéricos de máxima economia' },
        { id: `h-${Date.now()}-5`, type: 'heading', content: '2. Apresentação do Genérico com Máxima Economia', level: 2 },
        { id: `t-${Date.now()}-6`, type: 'text', content: 'Verifique a indicação de porcentagem de economia (ex: "Até 65% de economia") e apresente a alternativa mais econômica para o cliente.' },
        { id: `c-${Date.now()}-7`, type: 'callout', calloutType: 'success', title: 'Bula Completa Integrada (Ctrl + B)', content: 'Pressione Ctrl + B para exibir na hora a posologia, modo de usar e contraindicações sem sair do balcão.' },
        { id: `s-${Date.now()}-8`, type: 'step', content: 'Validar com o cliente a dosagem e apresentação recomendada (gotas, comprimidos ou xarope).' },
        { id: `s-${Date.now()}-9`, type: 'step', content: 'Pressionar Enter para carregar o produto selecionado diretamente na pré-venda do caixa.' },
      ]);
    } else if (templateKey === 'cliente360') {
      setTitle('Painel 360º do Cliente, Histórico de Compras e Programa de Fidelidade');
      setSubtitle('Como utilizar a visão unificada 360º do cliente: consulta de pontos, saldo de cashback, ticket médio e perfil por estrelas');
      setSystemPath('Digifarma V10 ➔ Cadastros ➔ Clientes ➔ Painel 360º (Ctrl + Espaço)');
      setSystemVersion('v10');
      setAuthor('Gestão de Relacionamento & Fidelidade');
      setTagsInput('V10, Clientes, Fidelidade, Cashback, CRM, 360º');
      setBlocks([
        { id: `h-${Date.now()}-1`, type: 'heading', content: '1. Localização Instantânea via Busca Global (Ctrl + Espaço)', level: 2 },
        { id: `t-${Date.now()}-2`, type: 'text', content: 'Pressione o atalho global Ctrl + Espaço em qualquer tela do Digifarma V10 e digite o nome, CPF ou celular do cliente para abrir o Painel 360º.' },
        { id: `c-${Date.now()}-3`, type: 'callout', calloutType: 'success', title: 'Fidelidade Ativa no Balcão', content: 'O saldo acumulado de pontos e o cashback em reais aparecem logo abaixo da foto do cliente, permitindo resgate imediato de prêmios ou desconto.' },
        { id: `i-${Date.now()}-4`, type: 'image', url: 'https://images.unsplash.com/photo-1556742049-0a67e5574f73?auto=format&fit=crop&w=1200&q=80', caption: 'Figura 1: Visão 360º com histórico de compras, frequência e estrelas do cliente' },
        { id: `h-${Date.now()}-5`, type: 'heading', content: '2. Histórico de Compras e Alerta de Clientes em Risco', level: 2 },
        { id: `t-${Date.now()}-6`, type: 'text', content: 'Analise a frequência de compras e os produtos habituais do cliente. Clientes 4 ou 5 estrelas devem receber tratamento preferencial.' },
        { id: `s-${Date.now()}-7`, type: 'step', content: 'Conferir se o cliente possui compras a prazo em aberto ou convênio empresarial ativo.' },
        { id: `s-${Date.now()}-8`, type: 'step', content: 'Oferecer o resgate do cashback acumulado para abater no pagamento da compra.' },
      ]);
    } else if (templateKey === 'caixaCego') {
      setTitle('Fechamento de Caixa Cego e Alçadas de Segurança do Gestor');
      setSubtitle('Procedimento de segurança para conferência cega do operador de caixa e ocultação de custos e estoques no balcão');
      setSystemPath('Digifarma V10 ➔ Caixa & Financeiro ➔ Fechamento Cego de Turno');
      setSystemVersion('v10');
      setAuthor('Gestão Financeira & Prevenção de Perdas');
      setTagsInput('V10, Caixa Cego, Segurança, Auditoria, Prevenção de Perdas');
      setBlocks([
        { id: `h-${Date.now()}-1`, type: 'heading', content: '1. Execução do Fechamento Cego pelo Operador', level: 2 },
        { id: `t-${Date.now()}-2`, type: 'text', content: 'Ao encerrar o turno, o operador realiza a contagem física das cédulas, moedas, cartões e PIX. Digita no sistema apenas os valores apurados, sem ver o saldo esperado pelo sistema.' },
        { id: `c-${Date.now()}-3`, type: 'callout', calloutType: 'warning', title: 'Conferência Honesta e Prevenção de Fraudes', content: 'O fechamento cego impede que o operador ajuste valores ou oculte sobras/faltas de caixa durante o encerramento do turno.' },
        { id: `h-${Date.now()}-4`, type: 'heading', content: '2. Conferência e Aprovação Exclusiva do Gestor', level: 2 },
        { id: `t-${Date.now()}-5`, type: 'text', content: 'O gestor acessa o Painel de Caixas com sua senha master, visualiza a conciliação completa entre o saldo do sistema e a contagem física do operador, e valida as divergências.' },
        { id: `s-${Date.now()}-6`, type: 'step', content: 'Verificar se todas as sangrias e suprimentos do dia foram homologados com comprovante assinado.' },
        { id: `s-${Date.now()}-7`, type: 'step', content: 'Emitir o Termo de Encerramento do Caixa e arquivar junto ao envelope numerado do malote.' },
      ]);
    } else if (templateKey === 'recebimento') {
      setTitle('Entrada de Nota Fiscal por Importação de XML e Conferência de Lotes');
      setSubtitle('Importação do arquivo XML da distribuidora, amarração de produtos, conferência cega de validade e armazenamento PVPS');
      setSystemPath('Digifarma ➔ Estoque ➔ Entrada de Notas ➔ Importar XML');
      setSystemVersion('ambos');
      setAuthor('Equipe de Logística & Estoque');
      setTagsInput('Estoque, Conferência, Boas Práticas, XML, PVPS');
      setBlocks([
        { id: `h-${Date.now()}-1`, type: 'heading', content: '1. Recepção da Carga e Importação do XML', level: 2 },
        { id: `t-${Date.now()}-2`, type: 'text', content: 'Importe o arquivo XML ou informe a chave de acesso de 44 dígitos da DANFE para carregar os produtos, quantidades e preços de custo.' },
        { id: `c-${Date.now()}-3`, type: 'callout', calloutType: 'warning', title: 'Conferência Cega Obrigatória', content: 'Abra as caixas físicas na área de triagem limpa. Valide número de lote e validade (mínimo de 12 meses exigido).' },
        { id: `i-${Date.now()}-4`, type: 'image', url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80', caption: 'Figura 1: Triagem de volumes físicos e conferência dos lotes das caixas recebidas' },
        { id: `h-${Date.now()}-5`, type: 'heading', content: '2. Armazenamento e Norma PVPS', level: 2 },
        { id: `t-${Date.now()}-6`, type: 'text', content: 'Guarde os produtos nas prateleiras organizados pelo método PVPS (Primeiro que Vence, Primeiro que Sai).' },
        { id: `s-${Date.now()}-7`, type: 'step', content: 'Checar se as margens de lucro foram recalculadas com base no novo custo da nota.' },
        { id: `s-${Date.now()}-8`, type: 'step', content: 'Finalizar a conciliação do estoque e alimentar o contas a pagar.' },
      ]);
    }
  };

  // Upload de Imagem
  const handleImageFileChange = async (blockId: string, file: File) => {
    try {
      setUploadingBlockId(blockId);
      const url = await uploadProcedureImage(file);
      updateBlock(blockId, { url });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Falha no upload: ${msg}. Você também pode colar uma URL pública direta.`);
    } finally {
      setUploadingBlockId(null);
    }
  };

  // Salvar
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('O título principal do procedimento é obrigatório.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const selectedMenu = menus.find((m) => m.id === menuId);
    const categoryName = selectedMenu?.label || category || 'Geral';

    const procedureToSave: Procedure = {
      id: initialProcedure?.id || `proc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      subtitle: subtitle.trim(),
      category: categoryName,
      systemVersion,
      menuId,
      submenuId: submenuId || undefined,
      systemPath: systemPath.trim() || undefined,
      author: author.trim() || 'Administrador',
      tags,
      blocks,
      is_favorite: initialProcedure?.is_favorite || false,
      created_at: initialProcedure?.created_at,
    };

    try {
      await onSave(procedureToSave);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Erro ao salvar: ${msg}`);
      setSaving(false);
    }
  };

  const selectedMenuObj = menus.find((m) => m.id === menuId);

  return (
    <form className="editor-container no-print" onSubmit={handleSave}>
      {/* Barra de Ações Superior com Botão de Voltar */}
      <div className="editor-nav-header">
        <button
          type="button"
          className="btn-back-clean"
          onClick={onCancel}
          disabled={saving}
          title="Voltar aos manuais sem salvar"
        >
          <ArrowLeft size={16} />
          <span>Voltar aos Manuais</span>
        </button>

        <div className="editor-header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={saving}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{saving ? 'Gravando...' : 'Salvar Manual'}</span>
          </button>
        </div>
      </div>

      <div className="editor-title-box">
        <h1 className="editor-page-title">
          {initialProcedure ? 'Editar Procedimento' : 'Novo Procedimento Operacional'}
        </h1>
        <p className="editor-page-subtitle">
          Preencha o título, o caminho no sistema e adicione os passos com imagens e orientações.
        </p>
      </div>

      {errorMsg && (
        <div className="callout-card-minimal callout-danger" style={{ marginBottom: '1.25rem' }}>
          <AlertCircle size={18} />
          <div>{errorMsg}</div>
        </div>
      )}

      {/* Painel de Metadados Principais */}
      <div className="editor-form-card">
        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label className="form-label">
              <FileText size={14} color="var(--primary-500)" />
              Título do Procedimento *
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Cadastro de Medicamentos e Código de Barras (EAN)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ width: '220px' }}>
            <label className="form-label">
              <Monitor size={14} color="var(--primary-500)" />
              Versão do Digifarma
            </label>
            <select
              className="form-select"
              value={systemVersion}
              onChange={(e) => setSystemVersion(e.target.value as SystemVersion | 'ambos')}
            >
              <option value="classico">Digifarma Clássico (Desktop)</option>
              <option value="v10">Digifarma V10 (Web/Cloud)</option>
              <option value="ambos">Ambas as Versões</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            <AlignLeft size={14} color="var(--text-muted)" />
            Subtítulo / Objetivo da Rotina
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Ex: Instruções para cadastro de código EAN, parametrização tributária e controle de lotes"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <Navigation size={14} color="var(--primary-500)" />
            Caminho no Sistema (Como o operador chega nesta tela)
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Ex: Menu Principal ➔ Cadastros ➔ Produtos ➔ Incluir Novo (F2)"
            value={systemPath}
            onChange={(e) => setSystemPath(e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              <Building2 size={14} color="var(--primary-500)" />
              Módulo do Sistema (Menu Principal)
            </label>
            <select
              className="form-select"
              value={menuId}
              onChange={(e) => {
                setMenuId(e.target.value);
                setSubmenuId('');
              }}
            >
              {menus.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Building2 size={14} color="var(--text-muted)" />
              Item / Tela do Módulo
            </label>
            <select
              className="form-select"
              value={submenuId}
              onChange={(e) => setSubmenuId(e.target.value)}
            >
              <option value="">(Selecione a rotina)</option>
              {selectedMenuObj?.submenus.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              <User size={14} color="var(--text-muted)" />
              Responsável / Autor
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Farmacêutico Responsável"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Tag size={14} color="var(--text-muted)" />
              Tags de Busca
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="EAN, Lote, XML, Fiscal"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Modelos Prontos V10 */}
      <div className="card-v10" style={{ marginBottom: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <p className="eyebrow" style={{ marginBottom: '8px' }}>
          <span className="num">MODELOS V10</span>
          <span>ESTRUTURAS PRONTAS NO PADRÃO OFICIAL DIGIFARMA</span>
        </p>
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0 }}>
          Carregue com 1 clique a estrutura completa com subtítulos, fotos, bulas e alertas operacionais:
        </p>
        <div className="pillrow" style={{ marginTop: '10px' }}>
          <button
            type="button"
            className="pill"
            onClick={() => loadTemplate('f7')}
            title="Carregar roteiro de F7 com IA e Bula"
          >
            <span>💊 F7 Tabela de Preços (IA + Bula)</span>
          </button>
          <button
            type="button"
            className="pill"
            onClick={() => loadTemplate('cliente360')}
            title="Carregar roteiro do Painel 360º do Cliente"
          >
            <span>⭐ Painel 360º (Fidelidade + Cashback)</span>
          </button>
          <button
            type="button"
            className="pill"
            onClick={() => loadTemplate('caixaCego')}
            title="Carregar roteiro de Fechamento Cego de Caixa"
          >
            <span>🔒 Caixa Cego & Controle do Gestor</span>
          </button>
          <button
            type="button"
            className="pill"
            onClick={() => loadTemplate('recebimento')}
            title="Carregar roteiro de Entrada de Nota e Lotes PVPS"
          >
            <span>📦 Recebimento & Conferência DANFE</span>
          </button>
        </div>
      </div>

      {/* Lista Sequencial de Blocos */}
      <div className="editor-blocks-header">
        <h2 className="editor-section-title">
          Etapas e Conteúdo do Passo a Passo ({blocks.length})
        </h2>
        <span className="editor-section-desc">
          Adicione quantos textos, subtítulos e imagens forem necessários. Você pode reordenar a qualquer momento.
        </span>
      </div>

      <div className="editor-blocks-list">
        {blocks.map((block, index) => {
          const isFirst = index === 0;
          const isLast = index === blocks.length - 1;

          return (
            <div key={block.id} className="editor-block-card">
              {/* Barra de Título e Ações do Bloco */}
              <div className="block-card-header">
                <div className="block-type-pill">
                  <span className="block-index">#{index + 1}</span>
                  {block.type === 'heading' && (
                    <>
                      <Heading size={14} color="var(--primary-500)" />
                      <span>Subtítulo / Etapa</span>
                    </>
                  )}
                  {block.type === 'text' && (
                    <>
                      <AlignLeft size={14} color="#059669" />
                      <span>Texto Operacional</span>
                    </>
                  )}
                  {block.type === 'image' && (
                    <>
                      <ImageIcon size={14} color="#7c3aed" />
                      <span>Captura de Tela / Imagem</span>
                    </>
                  )}
                  {block.type === 'callout' && (
                    <>
                      <AlertTriangle size={14} color="#d97706" />
                      <span>Alerta / Dica</span>
                    </>
                  )}
                  {block.type === 'step' && (
                    <>
                      <CheckSquare size={14} color="#0284c7" />
                      <span>Checklist / Verificação</span>
                    </>
                  )}
                </div>

                <div className="block-action-buttons">
                  <button
                    type="button"
                    className="btn-icon-block"
                    onClick={() => moveBlock(index, 'up')}
                    disabled={isFirst}
                    title="Mover para cima"
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    className="btn-icon-block"
                    onClick={() => moveBlock(index, 'down')}
                    disabled={isLast}
                    title="Mover para baixo"
                  >
                    <ArrowDown size={15} />
                  </button>
                  <button
                    type="button"
                    className="btn-icon-block"
                    onClick={() => duplicateBlock(block, index)}
                    title="Duplicar este bloco"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn-icon-block danger"
                    onClick={() => removeBlock(block.id)}
                    title="Remover este bloco"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Conteúdo do Bloco */}
              <div className="block-card-body">
                {/* 1. Subtítulo */}
                {block.type === 'heading' && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <input
                      type="text"
                      className="form-input block-heading-input"
                      placeholder="Ex: 2. Bipagem do Código EAN e Consulta Anvisa"
                      value={(block as HeadingBlock).content}
                      onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                    />
                  </div>
                )}

                {/* 2. Texto Operacional */}
                {block.type === 'text' && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <textarea
                      rows={4}
                      className="form-textarea"
                      placeholder="Descreva claramente o que o usuário deve fazer, teclas de atalho e campos a preencher..."
                      value={(block as TextBlock).content}
                      onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                    />
                  </div>
                )}

                {/* 3. Imagem */}
                {block.type === 'image' && (
                  <div className="block-image-inputs">
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div className="image-url-box" style={{ flex: 1, position: 'relative' }}>
                        <LinkIcon size={14} className="image-link-icon" />
                        <input
                          type="url"
                          className="form-input"
                          style={{ paddingLeft: '2rem' }}
                          placeholder="Cole a URL direta da imagem (ou envie do seu computador)"
                          value={(block as ImageBlock).url}
                          onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                        />
                      </div>

                      <label className="btn-upload-file">
                        {uploadingBlockId === block.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Upload size={14} />
                        )}
                        <span>{uploadingBlockId === block.id ? 'Enviando...' : 'Enviar Foto'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageFileChange(block.id, file);
                          }}
                        />
                      </label>
                    </div>

                    <input
                      type="text"
                      className="form-input"
                      placeholder="Legenda da imagem (ex: Figura 1: Tela de importação de XML no Digifarma)"
                      value={(block as ImageBlock).caption || ''}
                      onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                    />

                    {(block as ImageBlock).url && (
                      <div className="block-image-preview">
                        <img
                          src={(block as ImageBlock).url}
                          alt="Pré-visualização"
                          className="preview-img"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Alerta / Dica */}
                {block.type === 'callout' && (
                  <div className="block-callout-inputs">
                    <div className="form-row" style={{ marginBottom: '0.5rem' }}>
                      <div className="form-group" style={{ width: '180px', marginBottom: 0 }}>
                        <select
                          className="form-select"
                          value={(block as CalloutBlock).calloutType || 'info'}
                          onChange={(e) =>
                            updateBlock(block.id, { calloutType: e.target.value as CalloutVariant })
                          }
                        >
                          <option value="info">Informação</option>
                          <option value="warning">Atenção</option>
                          <option value="success">Dica / Sucesso</option>
                          <option value="danger">Proibido / Perigo</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Título do Alerta (Ex: Conferência Cega Obrigatória)"
                          value={(block as CalloutBlock).title || ''}
                          onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                        />
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      className="form-textarea"
                      placeholder="Texto do aviso ou dica operacional..."
                      value={(block as CalloutBlock).content}
                      onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                    />
                  </div>
                )}

                {/* 5. Item de Checklist */}
                {block.type === 'step' && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Verificar se a data de validade está legível antes de armazenar na prateleira"
                      value={(block as StepBlock).content}
                      onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Painel de Adicionar Blocos */}
      <div className="editor-add-block-panel">
        <span className="add-block-prompt">Adicionar novo bloco ao procedimento:</span>
        <div className="add-block-buttons-row">
          <button type="button" className="btn-add-block-item" onClick={() => addBlock('heading')}>
            <Heading size={15} color="var(--primary-500)" />
            <span>+ Subtítulo</span>
          </button>
          <button type="button" className="btn-add-block-item" onClick={() => addBlock('text')}>
            <AlignLeft size={15} color="#059669" />
            <span>+ Texto</span>
          </button>
          <button type="button" className="btn-add-block-item" onClick={() => addBlock('image')}>
            <ImageIcon size={15} color="#7c3aed" />
            <span>+ Imagem</span>
          </button>
          <button type="button" className="btn-add-block-item" onClick={() => addBlock('callout')}>
            <AlertTriangle size={15} color="#d97706" />
            <span>+ Alerta / Dica</span>
          </button>
          <button type="button" className="btn-add-block-item" onClick={() => addBlock('step')}>
            <CheckSquare size={15} color="#0284c7" />
            <span>+ Checklist</span>
          </button>
        </div>
      </div>

      {/* Barra Inferior de Gravação */}
      <div className="editor-footer-bar">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={saving}
        >
          Cancelar
        </button>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          <span>{saving ? 'Gravando...' : 'Salvar Procedimento'}</span>
        </button>
      </div>
    </form>
  );
};
