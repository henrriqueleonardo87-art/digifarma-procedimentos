import React, { useState, useMemo, useRef } from 'react';
import {
  Folder,
  FolderPlus,
  Upload,
  FileText,
  Trash2,
  ChevronRight,
  Search,
  ArrowLeft,
  X,
  File,
  FileSpreadsheet,
  Image as ImageIcon,
  Download,
  Edit2,
} from 'lucide-react';
import type { AppUser } from '../types/auth';

export interface ExplorerFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}

export interface ExplorerItem {
  id: string;
  folderId: string | null;
  type: 'file' | 'image' | 'pdf' | 'note';
  title: string;
  contentOrUrl: string; // Base64 / URL ou texto da anotação
  author: string;
  createdAt: string;
  size?: string;
}

interface ArquivosViewProps {
  currentUser?: AppUser | null;
  onBackToDashboard?: () => void;
}

const STORAGE_KEY_FOLDERS = 'digifarma_explorer_folders';
const STORAGE_KEY_ITEMS = 'digifarma_explorer_items';

const INITIAL_FOLDERS: ExplorerFolder[] = [
  { id: 'f-1', name: 'Telas do ERP', parentId: null, createdAt: new Date().toISOString() },
  { id: 'f-2', name: 'Fluxos de Trabalho', parentId: null, createdAt: new Date().toISOString() },
  { id: 'f-3', name: 'Erros e Soluções', parentId: null, createdAt: new Date().toISOString() },
  { id: 'f-sub-1', name: 'Módulo Caixa', parentId: 'f-1', createdAt: new Date().toISOString() },
];

const INITIAL_ITEMS: ExplorerItem[] = [
  {
    id: 'it-1',
    folderId: 'f-sub-1',
    type: 'note',
    title: 'Procedimento de Sangria e Fechamento Cego',
    contentOrUrl: 'Passo 1: Abrir o PDV pelo atalho F2.\nPasso 2: Digitar a senha de supervisor caso exigido.\nPasso 3: Conferir dinheiro em espécie sem olhar o total do sistema.',
    author: 'Leonardo',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'it-2',
    folderId: 'f-2',
    type: 'note',
    title: 'Checklist de Atendimento no Balcão',
    contentOrUrl: '1. Saudação cordial ao cliente.\n2. Consulta do CPF no convênio.\n3. Verificação de estoque e validade do medicamento.',
    author: 'Icaro',
    createdAt: new Date().toISOString(),
  },
];

export const ArquivosView: React.FC<ArquivosViewProps> = ({
  currentUser,
}) => {
  const currentUserName = currentUser?.name || currentUser?.username || 'Equipe Digifarma';

  // Pastas e Itens persistentes
  const [folders, setFolders] = useState<ExplorerFolder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_FOLDERS);
    return saved ? JSON.parse(saved) : INITIAL_FOLDERS;
  });

  const [items, setItems] = useState<ExplorerItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ITEMS);
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });

  // Pasta atual navegada (null = raiz)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modais
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const [viewingItem, setViewingItem] = useState<ExplorerItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar LocalStorage
  const saveFolders = (newFolders: ExplorerFolder[]) => {
    setFolders(newFolders);
    localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify(newFolders));
  };

  const saveItems = (newItems: ExplorerItem[]) => {
    setItems(newItems);
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(newItems));
  };

  // Breadcrumbs da navegação
  const breadcrumbs = useMemo(() => {
    const crumbs: { id: string | null; name: string }[] = [{ id: null, name: 'Arquivos' }];
    let curr = currentFolderId;
    const chain: { id: string; name: string }[] = [];
    while (curr) {
      const f = folders.find((item) => item.id === curr);
      if (f) {
        chain.unshift({ id: f.id, name: f.name });
        curr = f.parentId;
      } else {
        break;
      }
    }
    return [...crumbs, ...chain];
  }, [currentFolderId, folders]);

  // Pastas e Itens da visualização atual
  const currentFolders = useMemo(() => {
    if (searchTerm.trim()) {
      return folders.filter((f) => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return folders.filter((f) => f.parentId === currentFolderId);
  }, [folders, currentFolderId, searchTerm]);

  const currentItems = useMemo(() => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return items.filter(
        (it) => it.title.toLowerCase().includes(q) || it.contentOrUrl.toLowerCase().includes(q)
      );
    }
    return items.filter((it) => it.folderId === currentFolderId);
  }, [items, currentFolderId, searchTerm]);

  // Contagem de itens dentro de uma pasta (recursiva ou direta)
  const getFolderItemCount = (folderId: string) => {
    const subFolderCount = folders.filter((f) => f.parentId === folderId).length;
    const fileCount = items.filter((i) => i.folderId === folderId).length;
    return subFolderCount + fileCount;
  };

  // Criar nova pasta
  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const newFolder: ExplorerFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      parentId: currentFolderId,
      createdAt: new Date().toISOString(),
    };
    saveFolders([...folders, newFolder]);
    setNewFolderName('');
    setIsNewFolderOpen(false);
  };

  // Excluir pasta (e cascata de itens)
  const handleDeleteFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Deseja excluir esta pasta e seu conteúdo interno?')) {
      const remainingFolders = folders.filter((f) => f.id !== folderId && f.parentId !== folderId);
      const remainingItems = items.filter((it) => it.folderId !== folderId);
      saveFolders(remainingFolders);
      saveItems(remainingItems);
      if (currentFolderId === folderId) {
        setCurrentFolderId(null);
      }
    }
  };

  // Upload de arquivos
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      const isImg = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';

      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (!result) return;

        const newItem: ExplorerItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          folderId: currentFolderId,
          type: isImg ? 'image' : isPdf ? 'pdf' : 'file',
          title: file.name,
          contentOrUrl: result,
          author: currentUserName,
          createdAt: new Date().toISOString(),
          size: `${(file.size / 1024).toFixed(1)} KB`,
        };
        saveItems([...items, newItem]);
      };

      if (isImg || isPdf || file.type.startsWith('text/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsDataURL(file);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Salvar Anotação (Nova ou Editada)
  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;

    if (editingNoteId) {
      const updated = items.map((it) =>
        it.id === editingNoteId
          ? { ...it, title: noteTitle.trim(), contentOrUrl: noteContent.trim() }
          : it
      );
      saveItems(updated);
    } else {
      const newNote: ExplorerItem = {
        id: `note-${Date.now()}`,
        folderId: currentFolderId,
        type: 'note',
        title: noteTitle.trim(),
        contentOrUrl: noteContent.trim(),
        author: currentUserName,
        createdAt: new Date().toISOString(),
      };
      saveItems([...items, newNote]);
    }

    setNoteTitle('');
    setNoteContent('');
    setEditingNoteId(null);
    setIsNoteModalOpen(false);
  };

  const handleOpenEditNote = (note: ExplorerItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.contentOrUrl);
    setIsNoteModalOpen(true);
  };

  const handleDeleteItem = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Deseja excluir este item?')) {
      const remaining = items.filter((it) => it.id !== itemId);
      saveItems(remaining);
      if (viewingItem?.id === itemId) {
        setViewingItem(null);
      }
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 20px 40px 20px' }}>
      {/* Barra de Ações Superior Minimalista */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border)',
          marginBottom: '20px',
        }}
      >
        {/* Breadcrumb Navegável Estilo Explorer */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
          {currentFolderId && (
            <button
              type="button"
              onClick={() => {
                const currentFolder = folders.find((f) => f.id === currentFolderId);
                setCurrentFolderId(currentFolder?.parentId || null);
              }}
              title="Voltar pasta anterior"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-primary)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={16} />
            </button>
          )}

          <nav style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.id || 'root'}>
                  <button
                    type="button"
                    onClick={() => setCurrentFolderId(crumb.id)}
                    style={{
                      border: 'none',
                      background: isLast ? 'var(--red-soft)' : 'transparent',
                      color: isLast ? 'var(--red)' : 'var(--text-secondary)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontWeight: isLast ? 700 : 500,
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                    }}
                  >
                    {crumb.name}
                  </button>
                  {!isLast && <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Busca e Botões de Ação Diretos */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          {/* Campo de Busca Rápida (sem tags) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '6px 12px',
              minWidth: '220px',
            }}
          >
            <Search size={15} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar arquivos ou pastas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.84rem',
                color: 'var(--text-primary)',
                width: '100%',
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* + Nova Pasta */}
          <button
            type="button"
            onClick={() => {
              setNewFolderName('');
              setIsNewFolderOpen(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <FolderPlus size={15} color="var(--amber)" />
            <span>Nova Pasta</span>
          </button>

          {/* + Enviar Arquivo */}
          <input
            type="file"
            ref={fileInputRef}
            multiple
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Upload size={15} color="var(--primary-500)" />
            <span>Enviar Arquivo</span>
          </button>

          {/* + Nova Anotação */}
          <button
            type="button"
            onClick={() => {
              setEditingNoteId(null);
              setNoteTitle('');
              setNoteContent('');
              setIsNoteModalOpen(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              background: 'var(--red)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <FileText size={15} />
            <span>Nova Anotação</span>
          </button>
        </div>
      </div>

      {/* Grid de Pastas e Itens (Windows Explorer Style) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Seção de Pastas */}
        {currentFolders.length > 0 && (
          <div>
            <div
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-muted)',
                marginBottom: '10px',
              }}
            >
              Pastas ({currentFolders.length})
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '12px',
              }}
            >
              {currentFolders.map((folder) => {
                const count = getFolderItemCount(folder.id);
                return (
                  <div
                    key={folder.id}
                    onClick={() => {
                      setSearchTerm('');
                      setCurrentFolderId(folder.id);
                    }}
                    role="button"
                    tabIndex={0}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--red)';
                      e.currentTarget.style.background = 'var(--bg-secondary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.background = 'var(--bg-primary)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                      <Folder size={22} color="#f59e0b" style={{ flexShrink: 0 }} />
                      <div style={{ overflow: 'hidden' }}>
                        <div
                          style={{
                            fontSize: '0.86rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {folder.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {count} {count === 1 ? 'item' : 'itens'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteFolder(folder.id, e)}
                      title="Excluir pasta"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--red)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Seção de Arquivos e Anotações */}
        {currentItems.length > 0 && (
          <div>
            <div
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-muted)',
                marginBottom: '10px',
              }}
            >
              Arquivos e Anotações ({currentItems.length})
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '12px',
              }}
            >
              {currentItems.map((item) => {
                const isNote = item.type === 'note';
                const isImg = item.type === 'image';
                const isPdf = item.type === 'pdf';

                return (
                  <div
                    key={item.id}
                    onClick={() => setViewingItem(item)}
                    role="button"
                    tabIndex={0}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      minHeight: '90px',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--red)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: isNote
                            ? 'var(--red-soft)'
                            : isImg
                            ? 'rgba(59, 130, 246, 0.12)'
                            : 'rgba(16, 185, 129, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {isNote ? (
                          <FileText size={16} color="var(--red)" />
                        ) : isImg ? (
                          <ImageIcon size={16} color="#3b82f6" />
                        ) : isPdf ? (
                          <File size={16} color="#ef4444" />
                        ) : (
                          <FileSpreadsheet size={16} color="#10b981" />
                        )}
                      </div>

                      <div style={{ overflow: 'hidden', flex: 1 }}>
                        <div
                          style={{
                            fontSize: '0.86rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={item.title}
                        >
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {item.author} · {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '6px',
                        borderTop: '1px solid var(--border-subtle)',
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <span>{isNote ? 'Anotação interna' : item.size || 'Arquivo'}</span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isNote && (
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditNote(item, e)}
                            title="Editar anotação"
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              padding: '2px',
                            }}
                          >
                            <Edit2 size={13} />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleDeleteItem(item.id, e)}
                          title="Excluir"
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '2px',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--red)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Estado Vazio */}
        {currentFolders.length === 0 && currentItems.length === 0 && (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              background: 'var(--bg-primary)',
              borderRadius: '14px',
              border: '1.5px dashed var(--border)',
            }}
          >
            <Folder size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
              Esta pasta está vazia
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
              Adicione subpastas, arquivos ou crie uma anotação diretamente através dos botões no topo.
            </p>
          </div>
        )}
      </div>

      {/* MODAL: Nova Pasta */}
      {isNewFolderOpen && (
        <div className="modal-backdrop">
          <div
            className="modal-box"
            style={{ maxWidth: '400px', padding: '20px', background: 'var(--bg-primary)', borderRadius: '14px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Criar Nova Pasta
              </h3>
              <button
                type="button"
                onClick={() => setIsNewFolderOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateFolder}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Nome da Pasta:
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ex: Telas de Cadastro"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.86rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsNewFolderOpen(false)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '7px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--red)',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                  }}
                >
                  Criar Pasta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Criar / Editar Anotação Direta */}
      {isNoteModalOpen && (
        <div className="modal-backdrop">
          <div
            className="modal-box"
            style={{ maxWidth: '580px', padding: '24px', background: 'var(--bg-primary)', borderRadius: '16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {editingNoteId ? 'Editar Anotação' : 'Nova Anotação'}
              </h3>
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNote}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Título da Anotação:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Instruções de Fechamento de Turno"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Conteúdo da Anotação:
                </label>
                <textarea
                  rows={8}
                  placeholder="Escreva as anotações, passos e observações técnicas..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.86rem',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.84rem',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--red)',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.84rem',
                  }}
                >
                  Salvar Anotação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Visualizar Item (Arquivo, Imagem ou Anotação) */}
      {viewingItem && (
        <div className="modal-backdrop">
          <div
            className="modal-box"
            style={{
              maxWidth: viewingItem.type === 'image' ? '800px' : '620px',
              padding: '24px',
              background: 'var(--bg-primary)',
              borderRadius: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                  {viewingItem.title}
                </h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Por {viewingItem.author} em {new Date(viewingItem.createdAt).toLocaleString('pt-BR')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Conteúdo específico */}
            {viewingItem.type === 'image' ? (
              <div style={{ textAlign: 'center', maxHeight: '70vh', overflow: 'auto', marginBottom: '16px' }}>
                <img
                  src={viewingItem.contentOrUrl}
                  alt={viewingItem.title}
                  style={{ maxWidth: '100%', borderRadius: '10px' }}
                />
              </div>
            ) : viewingItem.type === 'note' ? (
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  padding: '16px',
                  borderRadius: '10px',
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  color: 'var(--text-primary)',
                  maxHeight: '60vh',
                  overflow: 'auto',
                  marginBottom: '16px',
                }}
              >
                {viewingItem.contentOrUrl}
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', marginBottom: '16px' }}>
                <File size={48} color="var(--primary-500)" style={{ margin: '0 auto 12px auto' }} />
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  Arquivo pronto para download ou consulta externa.
                </p>
                <a
                  href={viewingItem.contentOrUrl}
                  download={viewingItem.title}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: 'var(--red)',
                    color: '#fff',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                  }}
                >
                  <Download size={15} />
                  <span>Baixar Arquivo</span>
                </a>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
