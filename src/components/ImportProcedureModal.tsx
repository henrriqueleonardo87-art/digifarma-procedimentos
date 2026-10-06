import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  Monitor,
  AlertCircle,
  Loader2,
  Trash2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
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

  // Estados principais e essenciais
  const [title, setTitle] = useState(existingProcedure?.title || '');
  const [systemVersion, setSystemVersion] = useState<SystemVersion>(
    existingProcedure?.systemVersion === 'classico' || defaultVersion === 'r78'
      ? 'classico'
      : 'v10'
  );
  const [menuId, setMenuId] = useState(
    existingProcedure?.menuId || defaultMenuId || (menus[0]?.id || 'geral')
  );
  const [category, setCategory] = useState(
    existingProcedure?.category || defaultCategory || (menus[0]?.label || 'Geral')
  );

  // Arquivo PDF
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>(existingProcedure?.pdfFileName || '');
  const [pdfFileSize, setPdfFileSize] = useState<number | undefined>(existingProcedure?.pdfFileSize);
  const [existingPdfUrl, setExistingPdfUrl] = useState<string | undefined>(existingProcedure?.pdfFileUrl);

  // Arquivo HTML
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [htmlFileName, setHtmlFileName] = useState<string>(existingProcedure?.htmlFileName || '');
  const [htmlFileSize, setHtmlFileSize] = useState<number | undefined>(existingProcedure?.htmlFileSize);
  const [existingHtmlData, setExistingHtmlData] = useState<string | undefined>(existingProcedure?.htmlFileData);

  // Visualização padrão caso ambos estejam anexados
  const [activeViewFormat, setActiveViewFormat] = useState<'pdf' | 'html'>(
    existingProcedure?.activeViewFormat || 'pdf'
  );

  // Opções Avançadas (recolhidas por padrão para manter a tela limpa e minimalista)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [subtitle, setSubtitle] = useState(existingProcedure?.subtitle || '');
  const [author, setAuthor] = useState(
    existingProcedure?.author || currentUser?.name || currentUser?.username || 'Farmacêutico Responsável'
  );
  const [publishDirectly, setPublishDirectly] = useState(
    existingProcedure ? existingProcedure.status === 'aprovado' : true
  );

  // Mostrar segundo anexo opcional
  const [showSecondUpload, setShowSecondUpload] = useState(
    !!(existingProcedure?.pdfFileUrl && existingProcedure?.htmlFileData)
  );

  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const secondaryFileInputRef = useRef<HTMLInputElement>(null);

  // Função para limpar e formatar o nome do arquivo para virar o título
  const cleanTitleFromFileName = (fileName: string) => {
    const raw = fileName.replace(/\.[^/.]+$/, '');
    return raw
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Processa arquivo principal (detecta se é PDF ou HTML)
  const handlePrimaryFile = (file: File) => {
    const nameLower = file.name.toLowerCase();
    if (nameLower.endsWith('.pdf')) {
      setPdfFile(file);
      setPdfFileName(file.name);
      setPdfFileSize(file.size);
      if (!title) setTitle(cleanTitleFromFileName(file.name));
      setErrorMessage(null);
    } else if (nameLower.endsWith('.html') || nameLower.endsWith('.htm')) {
      setHtmlFile(file);
      setHtmlFileName(file.name);
      setHtmlFileSize(file.size);
      if (!title) setTitle(cleanTitleFromFileName(file.name));
      setErrorMessage(null);
    } else {
      setErrorMessage('Formato inválido. Por favor, envie um arquivo em PDF (.pdf) ou HTML (.html).');
    }
  };

  // Processa arquivo secundário/complementar
  const handleSecondaryFile = (file: File) => {
    const nameLower = file.name.toLowerCase();
    if (nameLower.endsWith('.pdf')) {
      setPdfFile(file);
      setPdfFileName(file.name);
      setPdfFileSize(file.size);
      setErrorMessage(null);
    } else if (nameLower.endsWith('.html') || nameLower.endsWith('.htm')) {
      setHtmlFile(file);
      setHtmlFileName(file.name);
      setHtmlFileSize(file.size);
      setErrorMessage(null);
    } else {
      setErrorMessage('Por favor, selecione um arquivo complementar em PDF ou HTML.');
    }
  };

  const hasPdf = !!pdfFile || !!existingPdfUrl;
  const hasHtml = !!htmlFile || !!existingHtmlData;
  const hasAnyFile = hasPdf || hasHtml;

  // Submissão do Formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Informe o título do procedimento.');
      return;
    }

    if (!hasPdf && !hasHtml) {
      setErrorMessage('Selecione ao menos um arquivo PDF ou HTML para importar.');
      return;
    }

    setIsSubmitting(true);

    try {
      const procId = existingProcedure?.id || `proc-import-${Date.now()}`;
      let finalPdfUrl = existingPdfUrl;
      let finalHtmlData = existingHtmlData;

      // Upload do PDF caso tenha arquivo novo
      if (pdfFile) {
        finalPdfUrl = await uploadProcedureDocument(pdfFile, procId);
      }

      // Leitura do HTML
      if (htmlFile) {
        finalHtmlData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const content = event.target?.result as string;
            resolve(content || '');
          };
          reader.onerror = (err) => reject(err);
          reader.readAsText(htmlFile);
        });
      }

      // Determinação automática do tipo de formato
      let formatChoice: ProcedureFormat = 'pdf';
      if (hasPdf && hasHtml) {
        formatChoice = 'both';
      } else if (hasHtml) {
        formatChoice = 'html';
      }

      const tagsList: string[] = ['POP', 'Repositório'];
      if (formatChoice === 'pdf' || formatChoice === 'both') tagsList.push('PDF');
      if (formatChoice === 'html' || formatChoice === 'both') tagsList.push('HTML');
      tagsList.push(systemVersion === 'v10' ? 'V10' : 'Clássico');

      const pathStr = `${systemVersion === 'v10' ? 'Digifarma V10' : 'Digifarma Clássico'} ➔ ${category}`;

      const updatedProcedure: Procedure = {
        ...(existingProcedure || {}),
        id: procId,
        title: title.trim(),
        subtitle: subtitle.trim() || 'Manual operacional arquivado no repositório digital',
        category,
        systemVersion,
        menuId,
        systemPath: pathStr,
        author: author.trim() || 'Farmacêutico Responsável',
        status: publishDirectly ? 'aprovado' : 'pendente',
        isActive: existingProcedure ? existingProcedure.isActive !== false : true,
        formatType: formatChoice,
        pdfFileUrl: hasPdf ? finalPdfUrl : undefined,
        pdfFileName: hasPdf ? pdfFileName : undefined,
        pdfFileSize: hasPdf ? pdfFileSize : undefined,
        htmlFileData: hasHtml ? finalHtmlData : undefined,
        htmlFileName: hasHtml ? htmlFileName : undefined,
        htmlFileSize: hasHtml ? htmlFileSize : undefined,
        activeViewFormat: formatChoice === 'both' ? activeViewFormat : (hasPdf ? 'pdf' : 'html'),
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
      console.error('Erro na importação:', err);
      const msg = err instanceof Error ? err.message : 'Falha ao processar arquivos.';
      setErrorMessage(`Erro ao importar: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        zIndex: 1100,
      }}
    >
      <div
        className="import-pop-modal-clean"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.25), 0 0 0 1px var(--border)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Barra superior de destaque em Vermelho Marca */}
        <div style={{ height: '4px', background: 'var(--red)', width: '100%' }} />

        {/* Cabeçalho Minimalista */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem 1rem',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--red-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--red)',
              }}
            >
              <Upload size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                {isEditingExisting ? 'Atualizar Documentos' : 'Importar POP'}
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                PDF ou HTML para o repositório
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo do Formulário */}
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {errorMessage && (
            <div
              style={{
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: 'var(--danger-text)',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. DROPZONE INTELIGENTE E MINIMALISTA */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Arquivo do Procedimento (PDF ou HTML)
            </label>

            {!hasAnyFile ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) handlePrimaryFile(f);
                }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: isDragging ? '2px dashed var(--red)' : '1.5px dashed var(--border-strong)',
                  background: isDragging ? 'var(--red-soft)' : 'var(--bg-secondary)',
                  borderRadius: '14px',
                  padding: '28px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'var(--bg-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--red)',
                    boxShadow: 'var(--shadow-subtle)',
                  }}
                >
                  <Upload size={20} />
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Arraste ou clique para selecionar seu POP
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Suporta arquivos oficiais em formato <strong>.PDF</strong> ou <strong>.HTML</strong>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.html,.htm"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handlePrimaryFile(f);
                  }}
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              /* Card de Arquivo Selecionado */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Arquivo PDF */}
                {hasPdf && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg-secondary)',
                      border: '1.5px solid var(--border)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'var(--red-soft)',
                          color: 'var(--red)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <FileText size={17} />
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {pdfFileName || 'Documento PDF'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          PDF {pdfFileSize ? `• ${(pdfFileSize / (1024 * 1024)).toFixed(2)} MB` : ''}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPdfFile(null);
                        setPdfFileName('');
                        setPdfFileSize(undefined);
                        setExistingPdfUrl(undefined);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '6px',
                      }}
                      title="Remover arquivo"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}

                {/* Arquivo HTML */}
                {hasHtml && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg-secondary)',
                      border: '1.5px solid var(--border)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(59, 130, 246, 0.12)',
                          color: '#2563eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Monitor size={17} />
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {htmlFileName || 'Documento HTML'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          HTML {htmlFileSize ? `• ${(htmlFileSize / 1024).toFixed(1)} KB` : ''}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setHtmlFile(null);
                        setHtmlFileName('');
                        setHtmlFileSize(undefined);
                        setExistingHtmlData(undefined);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '6px',
                      }}
                      title="Remover arquivo"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}

                {/* Botão sutil para adicionar o outro formato se ainda não tiver */}
                {(!hasPdf || !hasHtml) && (
                  <div>
                    {!showSecondUpload ? (
                      <button
                        type="button"
                        onClick={() => setShowSecondUpload(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--red)',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: '4px 0',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        + Anexar também versão complementar ({!hasPdf ? 'PDF' : 'HTML'})
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <input
                          ref={secondaryFileInputRef}
                          type="file"
                          accept={!hasPdf ? '.pdf' : '.html,.htm'}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleSecondaryFile(f);
                          }}
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          onClick={() => secondaryFileInputRef.current?.click()}
                          style={{
                            background: 'var(--bg-secondary)',
                            border: '1px dashed var(--border-strong)',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                          }}
                        >
                          Selecionar arquivo {!hasPdf ? '.PDF' : '.HTML'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Se ambos estiverem presentes, controle de visualização padrão */}
                {hasPdf && hasHtml && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '0.74rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Visualização inicial:</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setActiveViewFormat('pdf')}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: 'none',
                          background: activeViewFormat === 'pdf' ? 'var(--red)' : 'transparent',
                          color: activeViewFormat === 'pdf' ? '#ffffff' : 'var(--text-secondary)',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                        }}
                      >
                        PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveViewFormat('html')}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: 'none',
                          background: activeViewFormat === 'html' ? 'var(--red)' : 'transparent',
                          color: activeViewFormat === 'html' ? '#ffffff' : 'var(--text-secondary)',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                        }}
                      >
                        HTML
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. TÍTULO DO PROCEDIMENTO */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Título do Procedimento *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Recebimento e Conferência de Mercadorias..."
              style={{
                width: '100%',
                background: 'var(--bg-secondary)',
                border: '1.5px solid var(--border)',
                borderRadius: '10px',
                padding: '9px 12px',
                color: 'var(--text-primary)',
                fontSize: '0.86rem',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease',
              }}
            />
          </div>

          {/* 3. DESTINO: VERSÃO E MÓDULO */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Versão
              </label>
              <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', padding: '3px', borderRadius: '10px', border: '1.5px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setSystemVersion('v10')}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: '7px',
                    border: 'none',
                    background: systemVersion === 'v10' ? 'var(--red)' : 'transparent',
                    color: systemVersion === 'v10' ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: 800,
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  V10
                </button>
                <button
                  type="button"
                  onClick={() => setSystemVersion('classico')}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: '7px',
                    border: 'none',
                    background: systemVersion === 'classico' ? 'var(--red)' : 'transparent',
                    color: systemVersion === 'classico' ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: 800,
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Clássico
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Módulo
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
                  background: 'var(--bg-secondary)',
                  border: '1.5px solid var(--border)',
                  borderRadius: '10px',
                  padding: '8.5px 10px',
                  color: 'var(--text-primary)',
                  fontSize: '0.84rem',
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
          </div>

          {/* 4. OPÇÕES AVANÇADAS RECOLHÍVEIS (NÃO POLUEM A TELA) */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 0',
              }}
            >
              <span>Opções avançadas (Autor, Resumo, Status)</span>
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showAdvanced && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px', padding: '10px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '3px' }}>
                    Responsável / Elaborador
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Nome do responsável"
                    style={{
                      width: '100%',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '3px' }}>
                    Resumo / Objetivo
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Breve descrição do POP..."
                    style={{
                      width: '100%',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Publicar imediatamente:
                  </span>
                  <button
                    type="button"
                    onClick={() => setPublishDirectly(!publishDirectly)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      background: publishDirectly ? 'var(--success-bg)' : 'var(--bg-primary)',
                      color: publishDirectly ? 'var(--success-text)' : 'var(--text-secondary)',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {publishDirectly ? '✓ Publicado' : '⏳ Enviar p/ Revisão'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RODAPÉ DE AÇÃO */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                padding: '8px 16px',
                borderRadius: '9px',
                fontSize: '0.82rem',
                fontWeight: 700,
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
                borderRadius: '9px',
                fontSize: '0.84rem',
                fontWeight: 800,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 3px 10px rgba(231, 76, 60, 0.35)',
                transition: 'all 0.15s ease',
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Importando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>Importar Procedimento</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
