import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  Monitor,
  Layers,
  AlertCircle,
  Loader2,
  Trash2,
  Tag,
  ShieldCheck,
  Clock,
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
  const [title, setTitle] = useState(existingProcedure?.title || '');
  const [subtitle, setSubtitle] = useState(existingProcedure?.subtitle || '');
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
          reader.onload = (event) => {
            const content = event.target?.result as string;
            resolve(content || '');
          };
          reader.onerror = (err) => reject(err);
          reader.readAsText(htmlFile);
        });
      }

      // Monta tags e caminho do sistema
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
    <div
      className="modal-backdrop import-pop-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 12, 18, 0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        zIndex: 1050,
      }}
    >
      <div
        className="import-pop-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '720px',
          padding: '1.75rem',
          boxShadow: '0 25px 65px -15px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--border)',
          animation: 'modalFadeIn 0.2s ease',
          maxHeight: '92vh',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        {/* Faixa decorativa superior vermelha institucional */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '20px',
            right: '20px',
            height: '3px',
            background: 'linear-gradient(90deg, var(--red) 0%, #ff6b6b 100%)',
            borderRadius: '0 0 4px 4px',
          }}
        />

        {/* Cabeçalho do Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', marginTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--red) 0%, var(--red-dark) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 6px 16px rgba(231, 76, 60, 0.35)',
                flexShrink: 0,
              }}
            >
              <Upload size={22} />
            </div>
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
                    background: 'var(--red-soft)',
                    color: 'var(--red)',
                    border: '1px solid rgba(231, 76, 60, 0.25)',
                  }}
                >
                  REPOSITÓRIO DIGITAL
                </span>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  • {isEditingExisting ? 'Anexar Arquivos' : 'Importar POP'}
                </span>
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                {isEditingExisting ? 'Anexar Documento ao POP' : 'Importar Procedimento Oficial'}
              </h2>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
                Disponibilize manuais em PDF e HTML diretamente no repositório da farmácia.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '7px',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            title="Fechar"
          >
            <X size={17} />
          </button>
        </div>

        {errorMessage && (
          <div
            style={{
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              borderRadius: '10px',
              padding: '11px 14px',
              color: 'var(--danger-text)',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              marginBottom: '1.25rem',
            }}
          >
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Seção 1: Dados do Procedimento */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '1.2rem',
              marginBottom: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '5px' }}>
                Título do Procedimento / POP *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Recebimento e Conferência de Mercadorias..."
                style={{
                  width: '100%',
                  background: 'var(--bg-primary)',
                  border: '1.5px solid var(--border)',
                  borderRadius: '9px',
                  padding: '9px 13px',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '5px' }}>
                Resumo / Objetivo do POP (Opcional)
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Ex: Diretrizes operacionais e boas práticas farmacêuticas para a equipe..."
                style={{
                  width: '100%',
                  background: 'var(--bg-primary)',
                  border: '1.5px solid var(--border)',
                  borderRadius: '9px',
                  padding: '9px 13px',
                  color: 'var(--text-primary)',
                  fontSize: '0.86rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '5px' }}>
                  Versão do Digifarma
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setSystemVersion('v10')}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: systemVersion === 'v10' ? '2px solid var(--red)' : '1.5px solid var(--border)',
                      background: systemVersion === 'v10' ? 'var(--red-soft)' : 'var(--bg-primary)',
                      color: systemVersion === 'v10' ? 'var(--red)' : 'var(--text-secondary)',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                    }}
                  >
                    <span>V10</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSystemVersion('classico')}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: systemVersion === 'classico' ? '2px solid var(--red)' : '1.5px solid var(--border)',
                      background: systemVersion === 'classico' ? 'var(--red-soft)' : 'var(--bg-primary)',
                      color: systemVersion === 'classico' ? 'var(--red)' : 'var(--text-secondary)',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                    }}
                  >
                    <span>Clássico</span>
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '5px' }}>
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
                    background: 'var(--bg-primary)',
                    border: '1.5px solid var(--border)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
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
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '5px' }}>
                  Elaborador / Responsável
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Nome do responsável"
                  style={{
                    width: '100%',
                    background: 'var(--bg-primary)',
                    border: '1.5px solid var(--border)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
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
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '1.2rem',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Tag size={16} color="var(--red)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Formato do Arquivo (Tag Marcada)
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Importe PDF, HTML ou ambos para o mesmo POP
              </span>
            </div>

            {/* Chips de Tags Marcadas Selecionáveis */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
              <button
                type="button"
                onClick={() => setFormatChoice('pdf')}
                style={{
                  padding: '10px 8px',
                  borderRadius: '10px',
                  border: formatChoice === 'pdf' ? '2px solid var(--red)' : '1.5px solid var(--border)',
                  background: formatChoice === 'pdf' ? 'var(--red-soft)' : 'var(--bg-primary)',
                  color: formatChoice === 'pdf' ? 'var(--red)' : 'var(--text-secondary)',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                  boxShadow: formatChoice === 'pdf' ? '0 2px 8px rgba(231, 76, 60, 0.2)' : 'none',
                }}
              >
                <FileText size={16} color="var(--red)" />
                <span>[📄 Apenas PDF]</span>
              </button>

              <button
                type="button"
                onClick={() => setFormatChoice('html')}
                style={{
                  padding: '10px 8px',
                  borderRadius: '10px',
                  border: formatChoice === 'html' ? '2px solid var(--red)' : '1.5px solid var(--border)',
                  background: formatChoice === 'html' ? 'var(--red-soft)' : 'var(--bg-primary)',
                  color: formatChoice === 'html' ? 'var(--red)' : 'var(--text-secondary)',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                  boxShadow: formatChoice === 'html' ? '0 2px 8px rgba(231, 76, 60, 0.2)' : 'none',
                }}
              >
                <Monitor size={16} color="var(--red)" />
                <span>[🌐 Apenas HTML]</span>
              </button>

              <button
                type="button"
                onClick={() => setFormatChoice('both')}
                style={{
                  padding: '10px 8px',
                  borderRadius: '10px',
                  border: formatChoice === 'both' ? '2px solid var(--red)' : '1.5px solid var(--border)',
                  background: formatChoice === 'both' ? 'var(--red-soft)' : 'var(--bg-primary)',
                  color: formatChoice === 'both' ? 'var(--red)' : 'var(--text-secondary)',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                  boxShadow: formatChoice === 'both' ? '0 2px 8px rgba(231, 76, 60, 0.2)' : 'none',
                }}
              >
                <Layers size={16} color="var(--red)" />
                <span>[✨ Ambos (PDF + HTML)]</span>
              </button>
            </div>

            {/* Inputs de Upload com Dropzone Clean */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Card de Upload do PDF */}
              {(formatChoice === 'pdf' || formatChoice === 'both') && (
                <div
                  style={{
                    border: '1.5px dashed rgba(231, 76, 60, 0.45)',
                    background: 'var(--bg-primary)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          background: 'var(--red-soft)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--red)',
                        }}
                      >
                        <FileText size={20} />
                      </div>
                      <div>
                        <strong style={{ fontSize: '0.86rem', color: 'var(--text-primary)', display: 'block' }}>
                          Arquivo PDF Oficial
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {pdfFileName
                            ? `${pdfFileName} ${pdfFileSize ? `(${(pdfFileSize / (1024 * 1024)).toFixed(2)} MB)` : ''}`
                            : 'Nenhum documento PDF selecionado ainda.'}
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
                          background: 'var(--bg-secondary)',
                          border: '1.5px solid var(--border)',
                          color: 'var(--text-primary)',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Upload size={13} color="var(--red)" />
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
                            background: 'var(--danger-bg)',
                            border: '1px solid var(--danger-border)',
                            color: 'var(--red)',
                            padding: '7px 10px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                          }}
                          title="Remover arquivo"
                        >
                          <Trash2 size={13} />
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
                    border: '1.5px dashed rgba(231, 76, 60, 0.45)',
                    background: 'var(--bg-primary)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          background: 'var(--red-soft)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--red)',
                        }}
                      >
                        <Monitor size={20} />
                      </div>
                      <div>
                        <strong style={{ fontSize: '0.86rem', color: 'var(--text-primary)', display: 'block' }}>
                          Manual HTML Interativo
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {htmlFileName
                            ? `${htmlFileName} ${htmlFileSize ? `(${(htmlFileSize / 1024).toFixed(1)} KB)` : ''}`
                            : 'Nenhum documento HTML selecionado ainda.'}
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
                          background: 'var(--bg-secondary)',
                          border: '1.5px solid var(--border)',
                          color: 'var(--text-primary)',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Upload size={13} color="var(--red)" />
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
                            background: 'var(--danger-bg)',
                            border: '1px solid var(--danger-border)',
                            color: 'var(--red)',
                            padding: '7px 10px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                          }}
                          title="Remover arquivo"
                        >
                          <Trash2 size={13} />
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
                  marginTop: '14px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Exibir inicialmente por padrão:
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveViewFormat('pdf')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      border: activeViewFormat === 'pdf' ? '2px solid var(--red)' : '1px solid var(--border)',
                      background: activeViewFormat === 'pdf' ? 'var(--red-soft)' : 'var(--bg-primary)',
                      color: activeViewFormat === 'pdf' ? 'var(--red)' : 'var(--text-secondary)',
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    [Tag PDF Inicial]
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveViewFormat('html')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      border: activeViewFormat === 'html' ? '2px solid var(--red)' : '1px solid var(--border)',
                      background: activeViewFormat === 'html' ? 'var(--red-soft)' : 'var(--bg-primary)',
                      color: activeViewFormat === 'html' ? 'var(--red)' : 'var(--text-secondary)',
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    [Tag HTML Inicial]
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
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '11px 16px',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)', display: 'block' }}>
                Status de Publicação do Manual
              </strong>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                {publishDirectly
                  ? 'Publicar diretamente no Repositório (Disponível de imediato aos colaboradores)'
                  : 'Enviar como pendente para a Central de Revisão ISO/BPF'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setPublishDirectly(!publishDirectly)}
              style={{
                background: publishDirectly ? 'var(--success-bg)' : 'var(--warning-bg)',
                border: publishDirectly ? '1px solid var(--success-border)' : '1px solid var(--warning-border)',
                color: publishDirectly ? 'var(--success-text)' : 'var(--warning-text)',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {publishDirectly ? <ShieldCheck size={14} /> : <Clock size={14} />}
              <span>{publishDirectly ? '✓ Publicado Oficial' : '⏳ Enviar p/ Revisão'}</span>
            </button>
          </div>

          {/* Rodapé de Ações */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1.5px solid var(--border)',
                color: 'var(--text-secondary)',
                padding: '9px 18px',
                borderRadius: '10px',
                fontSize: '0.84rem',
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
                background: 'linear-gradient(135deg, var(--red) 0%, var(--red-dark) 100%)',
                border: 'none',
                color: '#ffffff',
                padding: '9px 24px',
                borderRadius: '10px',
                fontSize: '0.86rem',
                fontWeight: 800,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(231, 76, 60, 0.35)',
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Importando para o Repositório...</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
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
