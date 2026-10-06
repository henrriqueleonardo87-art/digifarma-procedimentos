import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Folder,
  FolderPlus,
  Upload,
  Trash2,
  ArrowLeft,
  ChevronRight,
  MessageSquare,
  Pin,
  X,
  Search,
} from 'lucide-react';
import type { AppUser } from '../types/auth';

export interface InternalAnnotation {
  id: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  text: string;
  author: string;
  createdAt: string;
}

export interface InternalComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface InternalFileItem {
  id: string;
  folderId: string | null;
  title: string;
  description?: string;
  imageUrl: string;
  tags: string[];
  responsible: string;
  createdAt: string;
  annotations: InternalAnnotation[];
  comments: InternalComment[];
}

export interface InternalFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}

export interface InternalNotice {
  id: string;
  title: string;
  message: string;
  author: string;
  date: string;
  urgent: boolean;
}

interface InternalFilesViewProps {
  currentUser?: AppUser | null;
  onBackToDashboard: () => void;
}

const STORAGE_KEY_FILES = 'digifarma_internal_files_list';
const STORAGE_KEY_FOLDERS = 'digifarma_internal_folders_list';
const STORAGE_KEY_NOTICES = 'digifarma_internal_notices_list';

// Dados iniciais de demonstração
const INITIAL_FOLDERS: InternalFolder[] = [
  { id: 'f-telas', name: 'Telas do ERP Digifarma', parentId: null, createdAt: new Date().toISOString() },
  { id: 'f-fluxos', name: 'Fluxogramas de Atendimento', parentId: null, createdAt: new Date().toISOString() },
  { id: 'f-erros', name: 'Casos e Mensagens de Erro', parentId: null, createdAt: new Date().toISOString() },
];

const INITIAL_FILES: InternalFileItem[] = [
  {
    id: 'item-1',
    folderId: 'f-telas',
    title: 'Tela de Fechamento de Caixa Cego',
    description: 'Layout oficial da rotina de conferência cega e sangria de valores.',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1000&q=80',
    tags: ['Caixa', 'Financeiro', 'Fechamento'],
    responsible: 'Leonardo',
    createdAt: new Date().toISOString(),
    annotations: [
      {
        id: 'ann-1',
        x: 32,
        y: 40,
        text: 'Conferir se o operador digitou o valor total em dinheiro antes de confirmar sangria.',
        author: 'Leonardo',
        createdAt: new Date().toISOString(),
      },
    ],
    comments: [
      {
        id: 'comm-1',
        author: 'Icaro',
        text: 'Excelente anotação. Ajuda muito os novos operadores.',
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'item-2',
    folderId: 'f-fluxos',
    title: 'Fluxo de Recebimento de Notas XML',
    description: 'Etapas de importação automática do manifesto de documentos fiscais.',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80',
    tags: ['Estoque', 'XML', 'Entradas'],
    responsible: 'Wallace',
    createdAt: new Date().toISOString(),
    annotations: [],
    comments: [],
  },
];

const INITIAL_NOTICES: InternalNotice[] = [
  {
    id: 'notice-1',
    title: 'Atualização do PDV v10 - Lançamento na Sexta',
    message: 'Favor validar as anotações das telas de venda antes de liberar o treinamento aos clientes.',
    author: 'Leonardo',
    date: new Date().toLocaleDateString('pt-BR'),
    urgent: true,
  },
  {
    id: 'notice-2',
    title: 'Padronização de Prints',
    message: 'Ao subir novos prints internos, utilize resolução mínima de 1280x720 para legibilidade.',
    author: 'Equipe de Treinamento',
    date: new Date().toLocaleDateString('pt-BR'),
    urgent: false,
  },
];

export const InternalFilesView: React.FC<InternalFilesViewProps> = ({
  currentUser,
  onBackToDashboard,
}) => {
  const currentUserName = currentUser?.name || currentUser?.username || 'Leonardo';

  // Estados locais sincronizados
  const [folders, setFolders] = useState<InternalFolder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_FOLDERS);
    return saved ? JSON.parse(saved) : INITIAL_FOLDERS;
  });

  const [files, setFiles] = useState<InternalFileItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_FILES);
    return saved ? JSON.parse(saved) : INITIAL_FILES;
  });

  const [notices, setNotices] = useState<InternalNotice[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_NOTICES);
    return saved ? JSON.parse(saved) : INITIAL_NOTICES;
  });

  // Navegação por pastas
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Modais
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTitle, setImportTitle] = useState('');
  const [importDesc, setImportDesc] = useState('');
  const [importTags, setImportTags] = useState('');
  const [importImageUrl, setImportImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal de Detalhe e Anotação na Imagem
  const [activeItem, setActiveItem] = useState<InternalFileItem | null>(null);
  const [isAddingPin, setIsAddingPin] = useState(false);
  const [newPinNote, setNewPinNote] = useState('');
  const [pendingPinCoords, setPendingPinCoords] = useState<{ x: number; y: number } | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  // Mural de Recados Toggle
  const [isMuralOpen, setIsMuralOpen] = useState(false);
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeMessage, setNewNoticeMessage] = useState('');
  const [newNoticeUrgent, setNewNoticeUrgent] = useState(false);

  // Efeitos de persistência
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_NOTICES, JSON.stringify(notices));
  }, [notices]);

  // Pasta ativa e breadcrumb
  const currentFolder = useMemo(() => {
    return folders.find((f) => f.id === currentFolderId) || null;
  }, [folders, currentFolderId]);

  const folderBreadcrumb = useMemo(() => {
    const crumbs: InternalFolder[] = [];
    let curr = currentFolder;
    while (curr) {
      crumbs.unshift(curr);
      curr = folders.find((f) => f.id === curr?.parentId) || null;
    }
    return crumbs;
  }, [folders, currentFolder]);

  // Pastas filhas da pasta atual
  const visibleFolders = useMemo(() => {
    return folders.filter((f) => f.parentId === currentFolderId);
  }, [folders, currentFolderId]);

  // Arquivos visíveis
  const visibleFiles = useMemo(() => {
    let result = files.filter((f) => f.folderId === currentFolderId);
    if (selectedTag) {
      result = result.filter((f) => f.tags.includes(selectedTag));
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.description?.toLowerCase().includes(q) ||
          f.responsible.toLowerCase().includes(q) ||
          f.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [files, currentFolderId, selectedTag, searchTerm]);

  // Tags disponíveis
  const allTags = useMemo(() => {
    const set = new Set<string>();
    files.forEach((f) => f.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [files]);

  // Ações de Pasta
  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const newFolder: InternalFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      parentId: currentFolderId,
      createdAt: new Date().toISOString(),
    };
    setFolders((prev) => [...prev, newFolder]);
    setNewFolderName('');
    setIsNewFolderModalOpen(false);
  };

  const handleDeleteFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Deseja excluir esta pasta e desvincular os arquivos dela?')) {
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      setFiles((prev) =>
        prev.map((file) => (file.folderId === folderId ? { ...file, folderId: null } : file))
      );
      if (currentFolderId === folderId) {
        setCurrentFolderId(null);
      }
    }
  };

  // Ações de Importar Imagem
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImportImageUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importTitle.trim() || !importImageUrl) return;

    const tagsArray = importTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newItem: InternalFileItem = {
      id: `file-${Date.now()}`,
      folderId: currentFolderId,
      title: importTitle.trim(),
      description: importDesc.trim(),
      imageUrl: importImageUrl,
      tags: tagsArray.length > 0 ? tagsArray : ['Interno'],
      responsible: currentUserName,
      createdAt: new Date().toISOString(),
      annotations: [],
      comments: [],
    };

    setFiles((prev) => [newItem, ...prev]);
    setImportTitle('');
    setImportDesc('');
    setImportTags('');
    setImportImageUrl('');
    setIsImportModalOpen(false);
  };

  const handleDeleteFile = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Deseja excluir este item interno?')) {
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      if (activeItem?.id === fileId) {
        setActiveItem(null);
      }
    }
  };

  // Anotações na Imagem
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingPin) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setPendingPinCoords({ x, y });
  };

  const handleSavePin = () => {
    if (!activeItem || !pendingPinCoords || !newPinNote.trim()) return;
    const newAnnotation: InternalAnnotation = {
      id: `ann-${Date.now()}`,
      x: pendingPinCoords.x,
      y: pendingPinCoords.y,
      text: newPinNote.trim(),
      author: currentUserName,
      createdAt: new Date().toISOString(),
    };

    const updatedItem = {
      ...activeItem,
      annotations: [...activeItem.annotations, newAnnotation],
    };

    setActiveItem(updatedItem);
    setFiles((prev) => prev.map((f) => (f.id === activeItem.id ? updatedItem : f)));
    setNewPinNote('');
    setPendingPinCoords(null);
    setIsAddingPin(false);
  };

  const handleDeleteAnnotation = (annId: string) => {
    if (!activeItem) return;
    const updatedItem = {
      ...activeItem,
      annotations: activeItem.annotations.filter((a) => a.id !== annId),
    };
    setActiveItem(updatedItem);
    setFiles((prev) => prev.map((f) => (f.id === activeItem.id ? updatedItem : f)));
  };

  const handleAddComment = () => {
    if (!activeItem || !newCommentText.trim()) return;
    const comment: InternalComment = {
      id: `comm-${Date.now()}`,
      author: currentUserName,
      text: newCommentText.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedItem = {
      ...activeItem,
      comments: [...activeItem.comments, comment],
    };

    setActiveItem(updatedItem);
    setFiles((prev) => prev.map((f) => (f.id === activeItem.id ? updatedItem : f)));
    setNewCommentText('');
  };

  // Mural de Recados
  const handleAddNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle.trim() || !newNoticeMessage.trim()) return;
    const notice: InternalNotice = {
      id: `notice-${Date.now()}`,
      title: newNoticeTitle.trim(),
      message: newNoticeMessage.trim(),
      author: currentUserName,
      date: new Date().toLocaleDateString('pt-BR'),
      urgent: newNoticeUrgent,
    };
    setNotices((prev) => [notice, ...prev]);
    setNewNoticeTitle('');
    setNewNoticeMessage('');
    setNewNoticeUrgent(false);
  };

  const handleDeleteNotice = (id: string) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="modules-drilldown-container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '16px 20px' }}>
      {/* Topo / Hero */}
      <div className="version-modules-hero" style={{ marginBottom: '1.5rem' }}>
        <div className="version-hero-badge" style={{ background: 'var(--red-soft)', color: 'var(--red)', borderColor: 'rgba(231, 76, 60, 0.25)' }}>
          <Folder size={13} />
          <span>ÁREA INTERNA DO TREINADOR</span>
        </div>
        <h1 className="version-hero-title">Interno &amp; Fluxos</h1>
        <p className="version-hero-sub">
          Pastas, telas operacionais, anotações interativas em imagens e mural de recados exclusivo da equipe.
        </p>

        {/* Barra de Ações Rápidas */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-import-pop-hero"
            onClick={() => setIsImportModalOpen(true)}
            style={{
              background: 'linear-gradient(135deg, var(--red) 0%, var(--red-dark) 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '9px 20px',
              fontSize: '0.86rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(231, 76, 60, 0.35)',
            }}
          >
            <Upload size={16} />
            <span>Importar Imagem Interna</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewFolderModalOpen(true)}
            style={{
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1.5px solid var(--border)',
              borderRadius: '10px',
              padding: '9px 18px',
              fontSize: '0.86rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <FolderPlus size={16} color="var(--red)" />
            <span>+ Nova Pasta</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMuralOpen(true)}
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '9px 18px',
              fontSize: '0.86rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <MessageSquare size={16} color="var(--red)" />
            <span>Mural de Recados ({notices.length})</span>
          </button>
        </div>

        {/* Busca e Filtros */}
        <div className="version-search-wrap" style={{ marginTop: '20px' }}>
          <Search size={16} className="version-search-ic" />
          <input
            type="text"
            className="version-search-input"
            placeholder="Pesquisar por título, responsável, observação ou tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button type="button" className="version-search-clear" onClick={() => setSearchTerm('')}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Breadcrumb de Navegação de Pastas */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '10px 16px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '0.86rem' }}>
          <button
            type="button"
            onClick={onBackToDashboard}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--red)',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <ArrowLeft size={14} />
            <span>Início</span>
          </button>
          <span style={{ color: 'var(--text-muted)' }}>/</span>

          <button
            type="button"
            onClick={() => setCurrentFolderId(null)}
            style={{
              background: 'none',
              border: 'none',
              color: currentFolderId ? 'var(--text-secondary)' : 'var(--text-primary)',
              fontWeight: currentFolderId ? 600 : 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Folder size={15} />
            <span>Raiz</span>
          </button>

          {folderBreadcrumb.map((f, idx) => (
            <React.Fragment key={f.id}>
              <span style={{ color: 'var(--text-muted)' }}>/</span>
              <button
                type="button"
                onClick={() => setCurrentFolderId(f.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: idx === folderBreadcrumb.length - 1 ? 'var(--text-primary)' : 'var(--red)',
                  fontWeight: idx === folderBreadcrumb.length - 1 ? 800 : 600,
                  cursor: 'pointer',
                }}
              >
                {f.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {currentFolderId && (
          <button
            type="button"
            onClick={() => {
              const parent = folders.find((f) => f.id === currentFolderId)?.parentId || null;
              setCurrentFolderId(parent);
            }}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '0.78rem',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <ArrowLeft size={13} />
            <span>Voltar Pasta</span>
          </button>
        )}
      </div>

      {/* Grade de Pastas */}
      {visibleFolders.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
            Pastas ({visibleFolders.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
            {visibleFolders.map((fol) => {
              const countInFolder = files.filter((f) => f.folderId === fol.id).length;
              return (
                <div
                  key={fol.id}
                  onClick={() => setCurrentFolderId(fol.id)}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    boxShadow: 'var(--shadow-subtle)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--red)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: 'var(--red-soft)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--red)',
                        flexShrink: 0,
                      }}
                    >
                      <Folder size={18} />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {fol.name}
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {countInFolder} {countInFolder === 1 ? 'item' : 'itens'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteFolder(fol.id, e)}
                    title="Excluir pasta"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Seção de Arquivos / Imagens */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Imagens &amp; Fluxos ({visibleFiles.length})
          </h3>

          {allTags.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Tags:</span>
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                style={{
                  fontSize: '0.7rem',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: selectedTag === null ? '1px solid var(--red)' : '1px solid var(--border)',
                  background: selectedTag === null ? 'var(--red)' : 'var(--bg-primary)',
                  color: selectedTag === null ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Todas
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                  style={{
                    fontSize: '0.7rem',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: selectedTag === tag ? '1px solid var(--red)' : '1px solid var(--border)',
                    background: selectedTag === tag ? 'var(--red)' : 'var(--bg-primary)',
                    color: selectedTag === tag ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grade de Cards de Imagens Internas */}
        <div className="image-cards-grid">
          {/* Card Importar Rápido */}
          <div
            className="image-card-item image-card-import-item"
            onClick={() => setIsImportModalOpen(true)}
            role="button"
            tabIndex={0}
            style={{
              background: 'var(--bg-secondary)',
              border: '1.5px dashed var(--red)',
            }}
          >
            <div className="image-card-icon-center" style={{ color: 'var(--red)', background: 'var(--red-soft)' }}>
              <Upload size={24} />
            </div>
            <h3 className="image-card-title">Nova Imagem</h3>
            <p className="image-card-subtitle">Importar print, fluxo ou tela do sistema</p>
            <span className="image-card-count-badge" style={{ background: 'var(--red)', color: '#fff' }}>
              + Importar Imagem
            </span>
          </div>

          {/* Cards de Itens */}
          {visibleFiles.map((file) => (
            <div
              key={file.id}
              className="image-card-item proc-card-clean"
              onClick={() => setActiveItem(file)}
              role="button"
              tabIndex={0}
              style={{
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              {/* Miniatura da Imagem */}
              <div
                style={{
                  width: '100%',
                  height: '110px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: 'var(--bg-secondary)',
                  marginBottom: '10px',
                  position: 'relative',
                }}
              >
                <img
                  src={file.imageUrl}
                  alt={file.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {file.annotations.length > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '6px',
                      right: '6px',
                      background: 'rgba(231, 76, 60, 0.9)',
                      color: '#fff',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Pin size={10} />
                    {file.annotations.length} notas
                  </span>
                )}
              </div>

              <div className="proc-clean-top-bar" style={{ marginBottom: '4px' }}>
                <span className="proc-reviewer-tag" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                  👤 {file.responsible}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleDeleteFile(file.id, e)}
                  title="Excluir item"
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <h3 className="image-card-title" style={{ fontSize: '0.92rem', minHeight: '2.4rem', textAlign: 'left', justifyContent: 'flex-start' }}>
                {file.title}
              </h3>

              <p className="image-card-subtitle-clean" style={{ marginBottom: '8px' }}>
                {file.description || 'Sem descrição cadastrada.'}
              </p>

              {/* Tags */}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {file.tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: '0.65rem',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-secondary)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 600,
                    }}
                  >
                    #{t}
                  </span>
                ))}
              </div>

              {/* Rodapé do Card */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {file.comments.length} comentários
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--red)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span>Abrir</span>
                  <ChevronRight size={13} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL / INSPECTOR DE IMAGEM COM ANOTAÇÕES & COMENTÁRIOS */}
      {activeItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setActiveItem(null)}
        >
          <div
            style={{
              background: 'var(--bg-primary)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              width: '100%',
              maxWidth: '1080px',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Topo do Modal */}
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-secondary)',
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {activeItem.title}
                </h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Responsável: <strong>{activeItem.responsible}</strong> · {activeItem.annotations.length} anotações registradas
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddingPin(!isAddingPin)}
                  style={{
                    background: isAddingPin ? 'var(--red)' : 'var(--bg-primary)',
                    color: isAddingPin ? '#fff' : 'var(--text-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Pin size={14} />
                  <span>{isAddingPin ? 'Clique na imagem...' : '+ Anotar na Imagem'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveItem(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Conteúdo: Imagem com Pins + Painel Lateral */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: 'row', flexWrap: 'wrap' }}>
              {/* Lado Esquerdo: Imagem com Marcadores */}
              <div
                style={{
                  flex: '2 1 500px',
                  background: '#090d16',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  padding: '16px',
                  overflow: 'auto',
                }}
              >
                <div
                  style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', cursor: isAddingPin ? 'crosshair' : 'default' }}
                  onClick={handleImageClick}
                >
                  <img
                    src={activeItem.imageUrl}
                    alt={activeItem.title}
                    style={{ maxHeight: '65vh', maxWidth: '100%', borderRadius: '8px', display: 'block' }}
                  />

                  {/* Pins Existentes */}
                  {activeItem.annotations.map((ann, idx) => (
                    <div
                      key={ann.id}
                      style={{
                        position: 'absolute',
                        left: `${ann.x}%`,
                        top: `${ann.y}%`,
                        transform: 'translate(-50%, -50%)',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'var(--red)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.72rem',
                        fontWeight: 900,
                        border: '2px solid #fff',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                        cursor: 'pointer',
                        zIndex: 10,
                      }}
                      title={`${ann.author}: ${ann.text}`}
                    >
                      {idx + 1}
                    </div>
                  ))}

                  {/* Pin Pendente de Confirmação */}
                  {pendingPinCoords && (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${pendingPinCoords.x}%`,
                        top: `${pendingPinCoords.y}%`,
                        transform: 'translate(-50%, -50%)',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#3b82f6',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 900,
                        border: '2px solid #fff',
                        boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.4)',
                        zIndex: 20,
                      }}
                    >
                      ?
                    </div>
                  )}
                </div>
              </div>

              {/* Lado Direito: Anotações & Comentários */}
              <div
                style={{
                  flex: '1 1 320px',
                  background: 'var(--bg-primary)',
                  borderLeft: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '70vh',
                  overflowY: 'auto',
                  padding: '16px',
                }}
              >
                {/* Formulário para novo Pin pendente */}
                {pendingPinCoords && (
                  <div
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1.5px solid var(--red)',
                      borderRadius: '10px',
                      padding: '12px',
                      marginBottom: '14px',
                    }}
                  >
                    <strong style={{ fontSize: '0.82rem', color: 'var(--red)', display: 'block', marginBottom: '6px' }}>
                      Nova anotação no ponto selecionado:
                    </strong>
                    <textarea
                      rows={2}
                      className="form-input"
                      placeholder="Descreva a instrução ou detalhe deste ponto..."
                      value={newPinNote}
                      onChange={(e) => setNewPinNote(e.target.value)}
                      style={{ width: '100%', marginBottom: '8px', fontSize: '0.82rem' }}
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => setPendingPinCoords(null)}
                        style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 10px', fontSize: '0.74rem', cursor: 'pointer' }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSavePin}
                        style={{ background: 'var(--red)', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Salvar Anotação
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de Anotações */}
                <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
                  Pontos Anotados ({activeItem.annotations.length})
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
                  {activeItem.annotations.length === 0 ? (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Nenhuma anotação nesta imagem ainda. Clique em "+ Anotar na Imagem" para marcar um ponto.
                    </span>
                  ) : (
                    activeItem.annotations.map((ann, idx) => (
                      <div
                        key={ann.id}
                        style={{
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          padding: '10px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px',
                        }}
                      >
                        <span
                          style={{
                            background: 'var(--red)',
                            color: '#fff',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          {idx + 1}
                        </span>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                            {ann.text}
                          </p>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            Por: {ann.author}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteAnnotation(ann.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                          title="Remover anotação"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Seção de Comentários / Discussão */}
                <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
                  Comentários da Equipe ({activeItem.comments.length})
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto', marginBottom: '12px' }}>
                  {activeItem.comments.map((comm) => (
                    <div
                      key={comm.id}
                      style={{
                        background: 'var(--bg-tertiary)',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        fontSize: '0.78rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <strong style={{ color: 'var(--red)' }}>{comm.author}</strong>
                        <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                          {new Date(comm.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p style={{ margin: 0, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        {comm.text}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Input de Novo Comentário */}
                <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Adicionar comentário..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddComment();
                    }}
                    style={{ flex: 1, fontSize: '0.8rem', padding: '6px 10px' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddComment}
                    style={{
                      background: 'var(--red)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0 12px',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR NOVA PASTA */}
      {isNewFolderModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setIsNewFolderModalOpen(false)}
        >
          <div
            style={{
              background: 'var(--bg-primary)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              padding: '24px',
              width: '100%',
              maxWidth: '420px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
              Nova Pasta Interna
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
              {currentFolder ? `Criar subpasta dentro de "${currentFolder.name}"` : 'Criar pasta na raiz interna.'}
            </p>

            <form onSubmit={handleCreateFolder}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Nome da Pasta</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Treinamento PDV, SNGPC, Entradas XML..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsNewFolderModalOpen(false)}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'var(--red)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Criar Pasta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IMPORTAR IMAGEM INTERNA */}
      {isImportModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setIsImportModalOpen(false)}
        >
          <div
            style={{
              background: 'var(--bg-primary)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              padding: '24px',
              width: '100%',
              maxWidth: '520px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
              Importar Imagem Interna
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
              Suba capturas de tela, esquemas e fluxos operacionais para anotações da equipe.
            </p>

            <form onSubmit={handleCreateFile}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Título da Imagem / Tela</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Tela de Recebimento de Mercadorias..."
                  value={importTitle}
                  onChange={(e) => setImportTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Descrição Sumária</label>
                <textarea
                  rows={2}
                  className="form-input"
                  placeholder="Explique o contexto ou a finalidade desta tela..."
                  value={importDesc}
                  onChange={(e) => setImportDesc(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Caixa, Fiscal, Vendas, Erro..."
                  value={importTags}
                  onChange={(e) => setImportTags(e.target.value)}
                />
              </div>

              {/* Upload ou URL da Imagem */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Arquivo de Imagem</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1.5px dashed var(--red)',
                      borderRadius: '8px',
                      padding: '10px',
                      color: 'var(--red)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Upload size={15} />
                    <span>Selecionar Imagem do Computador</span>
                  </button>
                </div>

                <input
                  type="text"
                  className="form-input"
                  placeholder="Ou cole a URL direta da imagem (https://...)"
                  value={importImageUrl.startsWith('data:') ? 'Arquivo selecionado via upload local' : importImageUrl}
                  onChange={(e) => setImportImageUrl(e.target.value)}
                />
              </div>

              {/* Preview */}
              {importImageUrl && (
                <div style={{ maxHeight: '160px', overflow: 'hidden', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--border)' }}>
                  <img src={importImageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!importTitle.trim() || !importImageUrl}
                  style={{
                    background: 'var(--red)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 20px',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    opacity: !importTitle.trim() || !importImageUrl ? 0.5 : 1,
                  }}
                >
                  Salvar Imagem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL / DRAWER: MURAL DE RECADOS */}
      {isMuralOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setIsMuralOpen(false)}
        >
          <div
            style={{
              background: 'var(--bg-primary)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              padding: '24px',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Mural de Recados Internos
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Comunicações e avisos rápidos para toda a equipe de treinamento.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMuralOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Criar Novo Recado */}
            <form onSubmit={handleAddNotice} style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '18px' }}>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Título do recado..."
                  value={newNoticeTitle}
                  onChange={(e) => setNewNoticeTitle(e.target.value)}
                  required
                  style={{ fontSize: '0.84rem' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '10px' }}>
                <textarea
                  rows={2}
                  className="form-input"
                  placeholder="Mensagem do recado..."
                  value={newNoticeMessage}
                  onChange={(e) => setNewNoticeMessage(e.target.value)}
                  required
                  style={{ fontSize: '0.82rem' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newNoticeUrgent}
                    onChange={(e) => setNewNoticeUrgent(e.target.checked)}
                  />
                  <span>Marcar como importante</span>
                </label>

                <button
                  type="submit"
                  style={{
                    background: 'var(--red)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 16px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Publicar Recado
                </button>
              </div>
            </form>

            {/* Lista de Recados */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {notices.map((n) => (
                <div
                  key={n.id}
                  style={{
                    background: n.urgent ? 'var(--red-soft)' : 'var(--bg-secondary)',
                    border: n.urgent ? '1.5px solid var(--red)' : '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {n.urgent && (
                        <span style={{ fontSize: '0.66rem', fontWeight: 800, background: 'var(--red)', color: '#fff', padding: '1px 6px', borderRadius: '4px' }}>
                          URGENTE
                        </span>
                      )}
                      <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{n.title}</strong>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteNotice(n.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                      title="Excluir recado"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <p style={{ margin: '0 0 6px 0', fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                    {n.message}
                  </p>

                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Por {n.author} · {n.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
