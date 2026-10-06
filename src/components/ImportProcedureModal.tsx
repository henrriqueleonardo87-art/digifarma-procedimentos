import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  Monitor,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Tag,
} from 'lucide-react';
import type { Procedure, SystemMenu, SystemVersion, ProcedureFormat } from '../types/procedure';
import type { AppUser } from '../types/auth';
import { uploadProcedureDocument } from '../lib/supabase';

interface ImportProcedureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (procedure: Procedure) => Promise<void>;
  existingProcedure?: Procedure | null;
  menus: SystemMenu[];
  currentUser?: AppUser | null;
  defaultVersion?: 'v10' | 'r78';
  defaultCategory?: string;
  defaultMenuId?: string;
}

export const ImportProcedureModal: React.FC<ImportProcedureModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingProcedure,
  menus,
  currentUser,
  defaultVersion,
  defaultCategory,
  defaultMenuId,
}) => {
  if (!isOpen) return null;

  const isEditingExisting = !!existingProcedure;

  // Estados dos Dados Cadastrais
  const [title, setTitle] = useState(
    existingProcedure?.title || ''
  );
  const [subtitle, setSubtitle] = useState(
    existingProcedure?.subtitle || ''
  );
  const [systemVersion, setSystemVersion] = useState<SystemVersion>(
    existingProcedure?.systemVersion === 'classico' || defaultVersion === 'r78'
      ? 'classico'
      : 'v10'
  );
  const [category, setCategory] = useState(
    existingProcedure?.category || defaultCategory || (menus[0]?.label || 'Geral')
  );
  const [menuId, setMenuId] = useState(
    existingProcedure?.menuId || defaultMenuId || (menus[0]?.id || 'geral')
  );
  const [author, setAuthor] = useState(
    existingProcedure?.author || currentUser?.name || currentUser?.username || 'Farmacêutico Responsável'
  );
  const [publishDirectly, setPublishDirectly] = useState(
    existingProcedure ? existingProcedure.status === 'aprovado' : true
  );

  // Formato Selecionado com Tags Marcadas
  const [formatChoice, setFormatChoice] = useState<ProcedureFormat>(
    existingProcedure?.formatType || 'both'
  );
  const [activeViewFormat, setActiveViewFormat] = useState<'pdf' | 'html'>(
    existingProcedure?.activeViewFormat || 'pdf'
  );

  // Estados de Arquivo PDF
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>(
    existingProcedure?.pdfFileName || ''
  );
  const [pdfFileSize, setPdfFileSize] = useState<number | undefined>(
    existingProcedure?.pdfFileSize
  );
  const [existingPdfUrl, setExistingPdfUrl] = useState<string | undefined>(
    existingProcedure?.pdfFileUrl
  );

  // Estados de Arquivo HTML
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [htmlFileName, setHtmlFileName] = useState<string>(
    existingProcedure?.htmlFileName || ''
  );
  const [htmlFileSize, setHtmlFileSize] = useState<number | undefined>(
    existingProcedure?.htmlFileSize
  );
  const [existingHtmlData, setExistingHtmlData] = useState<string | undefined>(
    existingProcedure?.htmlFileData
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refs de Input Oculto
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const htmlInputRef = useRef<HTMLInputElement>(null);

  // Handlers de Upload de Arquivos
  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setErrorMessage('Por favor, selecione um arquivo no formato PDF (.pdf).');
        return;
      }
      setPdfFile(file);
      setPdfFileName(file.name);
      setPdfFileSize(file.size);
      setErrorMessage(null);
    }
  };

  const handleHtmlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const lower = file.name.toLowerCase();
      if (!lower.endsWith('.html') && !lower.endsWith('.htm')) {
        setErrorMessage('Por favor, selecione um arquivo no formato HTML (.html, .htm).');
        return;
      }
      setHtmlFile(file);
      setHtmlFileName(file.name);
      setHtmlFileSize(file.size);
      setErrorMessage(null);
    }
  };

  // Submissão do Formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Informe o título do procedimento.');
      return;
    }

    // Validações de acordo com a escolha de formato
    const hasPdf = !!pdfFile || !!existingPdfUrl;
    const hasHtml = !!htmlFile || !!existingHtmlData;

    if (formatChoice === 'pdf' && !hasPdf) {
      setErrorMessage('Selecione um arquivo PDF para importar.');
      return;
    }
    if (formatChoice === 'html' && !hasHtml) {
      setErrorMessage('Selecione um arquivo HTML para importar.');
      return;
    }
    if (formatChoice === 'both' && !hasPdf && !hasHtml) {
      setErrorMessage('Para importar ambos, selecione ao menos um arquivo PDF ou HTML.');
      return;
    }

    setIsSubmitting(true);

    try {
      const procId = existingProcedure?.id || `proc-import-${Date.now()}`;
      let finalPdfUrl = existingPdfUrl;
      let finalHtmlData = existingHtmlData;

      // Upload ou leitura do PDF
      if (pdfFile) {
        finalPdfUrl = await uploadProcedureDocument(pdfFile, procId);
      }

      // Leitura do arquivo HTML
      if (htmlFile) {
        finalHtmlData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Falha ao ler arquivo HTML'));
          reader.readAsText(htmlFile);
        });
      }

      // Construção das tags do repositório
      const tagsList: string[] = [
        'Repositório',
        systemVersion === 'classico' ? 'Clássico' : 'V10',
        category,
      ];
      if (hasPdf || pdfFile) tagsList.push('PDF');
      if (hasHtml || htmlFile) tagsList.push('HTML');

      const pathStr = `${systemVersion === 'classico' ? 'Digifarma Clássico' : 'Digifarma V10'} ➔ ${category}`;

      const updatedProcedure: Procedure = {
        ...(existingProcedure || {}),
        id: procId,
        title: title.trim(),
        subtitle: subtitle.trim() || 'Manual operacional arquivado no repositório digital',
        category,
        systemVersion,
        menuId,
        systemPath: pathStr,
        author,
        status: publishDirectly ? 'aprovado' : 'pendente',
        isActive: existingProcedure ? existingProcedure.isActive !== false : true,
        formatType: formatChoice,
        pdfFileUrl: formatChoice !== 'html' ? finalPdfUrl : undefined,
        pdfFileName: formatChoice !== 'html' ? pdfFileName : undefined,
        pdfFileSize: formatChoice !== 'html' ? pdfFileSize : undefined,
        htmlFileData: formatChoice !== 'pdf' ? finalHtmlData : undefined,
        htmlFileName: formatChoice !== 'pdf' ? htmlFileName : undefined,
        htmlFileSize: formatChoice !== 'pdf' ? htmlFileSize : undefined,
        activeViewFormat: formatChoice === 'both' ? activeViewFormat : (formatChoice as 'pdf' | 'html'),
        tags: Array.from(new Set([...(existingProcedure?.tags || []), ...tagsList])),
        blocks: existingProcedure?.blocks || [
          {
            id: `block-${Date.now()}-1`,
            type: 'heading',
            content: title.trim(),
          },
          {
            id: `block-${Date.now()}-2`,
            type: 'text',
            content: subtitle.trim() || 'Procedimento homologado e importado para o acervo digital da farmácia.',
          },
        ],
        updated_at: new Date().toISOString(),
        created_at: existingProcedure?.created_at || new Date().toISOString(),
      };

      await onSave(updatedProcedure);
      onClose();
    } catch (err: unknown) {
      console.error('Erro na importação do procedimento:', err);
      const msg = err instanceof Error ? err.message : 'Falha ao processar arquivos.';
      setErrorMessage(`Erro ao importar: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop import-pop-backdrop" onClick={onClose}>
      <div
        className="import-pop-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#13161f',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '740px',
          padding: '1.6rem',
          boxShadow: '0 30px 70px -15px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          animation: 'modalFadeIn 0.2s ease',
          color: '#f8fafc',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        {/* Cabeçalho do Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              >
                Repositório de POPs
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                • {isEditingExisting ? 'Anexar / Atualizar Arquivos' : 'Importação Direta'}
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
              {isEditingExisting ? 'Anexar Documento ao Procedimento' : 'Importar Procedimento para o Repositório'}
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
              Cadastre e disponibilize manuais operacionais em PDF e HTML diretamente no repositório.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#1e2433',
              border: '1px solid #334155',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {errorMessage && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '8px',
              padding: '10px 12px',
              color: '#fca5a5',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '1rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Seção 1: Dados do Procedimento */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                Título do Procedimento / Rotina *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Recebimento e Conferência de Mercadorias..."
                style={{
                  width: '100%',
                  background: '#191f2d',
                  border: '1px solid #2d374d',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                Subtítulo / Descrição Sumária
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Ex: Instrução de trabalho padrão para checagem de lotes e XML..."
                style={{
                  width: '100%',
                  background: '#191f2d',
                  border: '1px solid #2d374d',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                  Versão do Sistema Digifarma
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setSystemVersion('v10')}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: systemVersion === 'v10' ? '1.5px solid var(--red)' : '1px solid #2d374d',
                      background: systemVersion === 'v10' ? 'rgba(239, 68, 68, 0.15)' : '#191f2d',
                      color: systemVersion === 'v10' ? '#ffffff' : '#94a3b8',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>Digifarma V10</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSystemVersion('classico')}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: systemVersion === 'classico' ? '1.5px solid #38bdf8' : '1px solid #2d374d',
                      background: systemVersion === 'classico' ? 'rgba(56, 189, 248, 0.15)' : '#191f2d',
                      color: systemVersion === 'classico' ? '#ffffff' : '#94a3b8',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>Digifarma Clássico</span>
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                  Módulo / Categoria
                </label>
                <select
                  value={menuId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    setMenuId(selId);
                    const found = menus.find((m) => m.id === selId);
                    if (found) setCategory(found.label);
                  }}
                  style={{
                    width: '100%',
                    background: '#191f2d',
                    border: '1px solid #2d374d',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  {menus.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                  Elaborador / Responsável
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Nome do responsável"
                  style={{
                    width: '100%',
                    background: '#191f2d',
                    border: '1px solid #2d374d',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Seletor de Formato com Tags Marcadas */}
          <div
            style={{
              background: '#181e2b',
              border: '1px solid #283347',
              borderRadius: '12px',
              padding: '1.1rem',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tag size={15} color="#38bdf8" />
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff' }}>
                  Formato do Arquivo no Repositório (Tag Marcada)
                </span>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                Selecione o tipo de mídia deste procedimento
              </span>
            </div>

            {/* Tags Marcadas Selecionáveis */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
              <button
                type="button"
                onClick={() => setFormatChoice('pdf')}
                style={{
                  padding: '9px 8px',
                  borderRadius: '8px',
                  border: formatChoice === 'pdf' ? '2px solid #ef4444' : '1px solid #2d374d',
                  background: formatChoice === 'pdf' ? 'rgba(239, 68, 68, 0.18)' : '#191f2d',
                  color: formatChoice === 'pdf' ? '#fca5a5' : '#94a3b8',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <FileText size={15} color="#ef4444" />
                <span>[📄 Apenas PDF]</span>
              </button>

              <button
                type="button"
                onClick={() => setFormatChoice('html')}
                style={{
                  padding: '9px 8px',
                  borderRadius: '8px',
                  border: formatChoice === 'html' ? '2px solid #3b82f6' : '1px solid #2d374d',
                  background: formatChoice === 'html' ? 'rgba(59, 130, 246, 0.18)' : '#191f2d',
                  color: formatChoice === 'html' ? '#93c5fd' : '#94a3b8',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Monitor size={15} color="#3b82f6" />
                <span>[🌐 Apenas HTML]</span>
              </button>

              <button
                type="button"
                onClick={() => setFormatChoice('both')}
                style={{
                  padding: '9px 8px',
                  borderRadius: '8px',
                  border: formatChoice === 'both' ? '2px solid #10b981' : '1px solid #2d374d',
                  background: formatChoice === 'both' ? 'rgba(16, 185, 129, 0.18)' : '#191f2d',
                  color: formatChoice === 'both' ? '#6ee7b7' : '#94a3b8',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                <Layers size={15} color="#10b981" />
                <span>[✨ Ambos (PDF + HTML)]</span>
              </button>
            </div>

            {/* Inputs de Upload conforme a escolha */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Card de Upload do PDF */}
              {(formatChoice === 'pdf' || formatChoice === 'both') && (
                <div
                  style={{
                    border: '1px dashed #ef4444',
                    background: 'rgba(239, 68, 68, 0.05)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={20} color="#ef4444" />
                      <div>
                        <strong style={{ fontSize: '0.84rem', color: '#ffffff', display: 'block' }}>
                          Arquivo PDF Oficial
                        </strong>
                        <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                          {pdfFileName
                            ? `${pdfFileName} ${pdfFileSize ? `(${(pdfFileSize / (1024 * 1024)).toFixed(2)} MB)` : ''}`
                            : 'Nenhum PDF selecionado'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        ref={pdfInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handlePdfChange}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => pdfInputRef.current?.click()}
                        style={{
                          background: '#283144',
                          border: '1px solid #3b4760',
                          color: '#ffffff',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Upload size={12} />
                        <span>{pdfFileName ? 'Substituir PDF' : 'Selecionar .PDF'}</span>
                      </button>
                      {pdfFileName && (
                        <button
                          type="button"
                          onClick={() => {
                            setPdfFile(null);
                            setPdfFileName('');
                            setPdfFileSize(undefined);
                            setExistingPdfUrl(undefined);
                          }}
                          style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid #ef4444',
                            color: '#ef4444',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                          title="Remover arquivo"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Card de Upload do HTML */}
              {(formatChoice === 'html' || formatChoice === 'both') && (
                <div
                  style={{
                    border: '1px dashed #3b82f6',
                    background: 'rgba(59, 130, 246, 0.05)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Monitor size={20} color="#3b82f6" />
                      <div>
                        <strong style={{ fontSize: '0.84rem', color: '#ffffff', display: 'block' }}>
                          Manual HTML Interativo
                        </strong>
                        <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                          {htmlFileName
                            ? `${htmlFileName} ${htmlFileSize ? `(${(htmlFileSize / 1024).toFixed(1)} KB)` : ''}`
                            : 'Nenhum HTML selecionado'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        ref={htmlInputRef}
                        type="file"
                        accept=".html,.htm,text/html"
                        onChange={handleHtmlChange}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => htmlInputRef.current?.click()}
                        style={{
                          background: '#283144',
                          border: '1px solid #3b4760',
                          color: '#ffffff',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Upload size={12} />
                        <span>{htmlFileName ? 'Substituir HTML' : 'Selecionar .HTML'}</span>
                      </button>
                      {htmlFileName && (
                        <button
                          type="button"
                          onClick={() => {
                            setHtmlFile(null);
                            setHtmlFileName('');
                            setHtmlFileSize(undefined);
                            setExistingHtmlData(undefined);
                          }}
                          style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid #ef4444',
                            color: '#ef4444',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                          title="Remover arquivo"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Escolha da Tag Marcada Primária quando Ambos */}
            {formatChoice === 'both' && (
              <div
                style={{
                  marginTop: '12px',
                  paddingTop: '10px',
                  borderTop: '1px solid #283347',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '0.76rem', color: '#cbd5e1' }}>
                  Tag Padrão ao Abrir no Repositório:
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveViewFormat('pdf')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: activeViewFormat === 'pdf' ? '1.5px solid #ef4444' : '1px solid #334155',
                      background: activeViewFormat === 'pdf' ? 'rgba(239, 68, 68, 0.25)' : '#1e2433',
                      color: activeViewFormat === 'pdf' ? '#ffffff' : '#94a3b8',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    [Tag PDF Ativa]
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveViewFormat('html')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: activeViewFormat === 'html' ? '1.5px solid #3b82f6' : '1px solid #334155',
                      background: activeViewFormat === 'html' ? 'rgba(59, 130, 246, 0.25)' : '#1e2433',
                      color: activeViewFormat === 'html' ? '#ffffff' : '#94a3b8',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    [Tag HTML Ativa]
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Opção de Publicação Imediata vs Revisão */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#191f2d',
              border: '1px solid #2d374d',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '1.25rem',
            }}
          >
            <div>
              <strong style={{ fontSize: '0.82rem', color: '#ffffff', display: 'block' }}>
                Status de Homologação
              </strong>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                {publishDirectly
                  ? 'Publicar imediatamente no Repositório (Disponível a todos os usuários)'
                  : 'Enviar como pendente para a Central de Revisão'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setPublishDirectly(!publishDirectly)}
              style={{
                background: publishDirectly ? 'rgba(16, 185, 129, 0.18)' : 'rgba(245, 158, 11, 0.18)',
                border: publishDirectly ? '1px solid #10b981' : '1px solid #f59e0b',
                color: publishDirectly ? '#34d399' : '#fbbf24',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.76rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CheckCircle2 size={13} />
              <span>{publishDirectly ? 'Publicado' : 'Para Revisão'}</span>
            </button>
          </div>

          {/* Rodapé de Ações */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #283347', paddingTop: '1rem' }}>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              style={{
                background: '#1e2433',
                border: '1px solid #334155',
                color: '#94a3b8',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                background: 'var(--red)',
                border: 'none',
                color: '#ffffff',
                padding: '8px 20px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="spin-animate" />
                  <span>Importando para o Repositório...</span>
                </>
              ) : (
                <>
                  <Upload size={14} />
                  <span>Salvar no Repositório</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
