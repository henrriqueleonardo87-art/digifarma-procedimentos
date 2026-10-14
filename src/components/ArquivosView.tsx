import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Folder,
  FolderPlus,
  Upload,
  FileText,
  Trash2,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  RefreshCw,
  X,
  File,
  FileSpreadsheet,
  Image as ImageIcon,
  Download,
  Edit2,
  Share2,
  Globe,
  Users,
  Lock,
  Search,
  Grid,
  List,
  Plus,
  Check,
  Code,
  Eye,
  Laptop,
} from 'lucide-react';
import type { AppUser } from '../types/auth';
import {
  type ExplorerFolder,
  type ExplorerItem,
  fetchExplorerFolders,
  fetchExplorerItems,
  saveExplorerFolder,
  deleteExplorerFolder,
  saveExplorerItem,
  deleteExplorerItem,
  subscribeToExplorer,
} from '../lib/explorerService';
import { fetchTeamMembers, isUserTargeted } from '../lib/publicacoesService';

export type { ExplorerFolder, ExplorerItem };

interface ArquivosViewProps {
  currentUser?: AppUser | null;
  onBackToDashboard?: () => void;
}

export const ArquivosView: React.FC<ArquivosViewProps> = ({ currentUser }) => {
  const currentUserName = currentUser?.name || currentUser?.username || 'Equipe Digifarma';

  // Pastas e Itens
  const [folders, setFolders] = useState<ExplorerFolder[]>([]);
  const [items, setItems] = useState<ExplorerItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<Array<{ username: string; name: string }>>([]);

  // Navegação e Histórico estilo Windows Explorer
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [history, setHistory] = useState<(string | null)[]>([null]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Busca e visualização
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'icons' | 'details'>('icons');
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'shared_with_me' | 'my_private' | 'notes'>('all');

  // Seleção de itens (estilo Explorer)
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'folder' | 'item' | null>(null);

  // Pastas expandidas no painel esquerdo (TreeView)
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // Modais
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Modal de Criação de Documento HTML
  const [isHtmlModalOpen, setIsHtmlModalOpen] = useState(false);
  const [htmlDocTitle, setHtmlDocTitle] = useState('');
  const [htmlDocContent, setHtmlDocContent] = useState('');

  // Modal de Compartilhamento
  const [shareTarget, setShareTarget] = useState<{
    type: 'folder' | 'item';
    id: string;
    title: string;
    sharedType: 'everyone' | 'restricted' | 'private';
    sharedWith: string[];
    author: string;
  } | null>(null);
  const [shareTypeDraft, setShareTypeDraft] = useState<'everyone' | 'restricted' | 'private'>('everyone');
  const [selectedMembersDraft, setSelectedMembersDraft] = useState<string[]>([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');

  // Modal de Pré-visualização
  const [viewingItem, setViewingItem] = useState<ExplorerItem | null>(null);

  // Drag & Drop
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [dragFeedback, setDragFeedback] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const explorerContainerRef = useRef<HTMLDivElement>(null);

  // Carregar dados
  const loadData = useCallback(async () => {
    try {
      const [loadedFolders, loadedItems, members] = await Promise.all([
        fetchExplorerFolders(),
        fetchExplorerItems(),
        fetchTeamMembers(),
      ]);
      setFolders(loadedFolders);
      setItems(loadedItems);
      setTeamMembers(members);
    } catch (err) {
      console.warn('Erro ao sincronizar arquivos:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToExplorer(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

  // Navegar para uma pasta e registrar no histórico
  const navigateToFolder = (folderId: string | null) => {
    if (folderId === currentFolderId) return;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(folderId);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentFolderId(folderId);
    setSelectedId(null);
    setSelectedType(null);
    setSearchTerm('');
  };

  const handleGoBack = () => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      setCurrentFolderId(history[nextIndex]);
      setSelectedId(null);
    }
  };

  const handleGoForward = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setCurrentFolderId(history[nextIndex]);
      setSelectedId(null);
    }
  };

  const handleGoUp = () => {
    if (!currentFolderId) return;
    const current = folders.find((f) => f.id === currentFolderId);
    navigateToFolder(current?.parentId || null);
  };

  // Breadcrumbs
  const breadcrumbs = useMemo(() => {
    const chain: { id: string | null; name: string }[] = [{ id: null, name: 'Este Computador' }];
    if (!currentFolderId) return chain;

    const stack: { id: string; name: string }[] = [];
    let curr: string | null = currentFolderId;
    while (curr) {
      const f = folders.find((item) => item.id === curr);
      if (f) {
        stack.unshift({ id: f.id, name: f.name });
        curr = f.parentId;
      } else {
        break;
      }
    }
    return [...chain, ...stack];
  }, [currentFolderId, folders]);

  // Checagem de visibilidade com base no compartilhamento
  const isAccessible = useCallback(
    (itemOrFolder: { author?: string; sharedType?: string; sharedWith?: string[] }) => {
      // O autor sempre tem acesso total
      if (itemOrFolder.author && itemOrFolder.author.toLowerCase() === currentUserName.toLowerCase()) {
        return true;
      }
      const sType = itemOrFolder.sharedType || 'everyone';
      if (sType === 'everyone') return true;
      if (sType === 'private') return false;
      if (sType === 'restricted') {
        return isUserTargeted(itemOrFolder.sharedWith || [], currentUser);
      }
      return true;
    },
    [currentUser, currentUserName]
  );

  // Pastas visíveis e filtradas
  const visibleFolders = useMemo(() => {
    let list = folders.filter(isAccessible);

    if (activeFilterTab === 'shared_with_me') {
      list = list.filter(
        (f) =>
          f.author?.toLowerCase() !== currentUserName.toLowerCase() &&
          (f.sharedType === 'everyone' || isUserTargeted(f.sharedWith || [], currentUser))
      );
    } else if (activeFilterTab === 'my_private') {
      list = list.filter(
        (f) =>
          f.author?.toLowerCase() === currentUserName.toLowerCase() &&
          f.sharedType === 'private'
      );
    } else if (activeFilterTab === 'notes') {
      return []; // na aba de notas foca apenas nos arquivos de anotação
    }

    if (searchTerm.trim()) {
      return list.filter((f) => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (activeFilterTab !== 'all') {
      return list;
    }

    return list.filter((f) => f.parentId === currentFolderId);
  }, [folders, isAccessible, activeFilterTab, searchTerm, currentFolderId, currentUserName, currentUser]);

  // Itens visíveis e filtrados
  const visibleItems = useMemo(() => {
    let list = items.filter(isAccessible);

    if (activeFilterTab === 'shared_with_me') {
      list = list.filter(
        (it) =>
          it.author?.toLowerCase() !== currentUserName.toLowerCase() &&
          (it.sharedType === 'everyone' || isUserTargeted(it.sharedWith || [], currentUser))
      );
    } else if (activeFilterTab === 'my_private') {
      list = list.filter(
        (it) =>
          it.author?.toLowerCase() === currentUserName.toLowerCase() &&
          it.sharedType === 'private'
      );
    } else if (activeFilterTab === 'notes') {
      list = list.filter((it) => it.type === 'note');
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return list.filter(
        (it) => it.title.toLowerCase().includes(q) || it.contentOrUrl.toLowerCase().includes(q)
      );
    }

    if (activeFilterTab !== 'all') {
      return list;
    }

    return list.filter((it) => it.folderId === currentFolderId);
  }, [items, isAccessible, activeFilterTab, searchTerm, currentFolderId, currentUserName, currentUser]);

  // Contagem de itens de uma pasta
  const getFolderItemCount = (folderId: string) => {
    const subF = folders.filter((f) => f.parentId === folderId && isAccessible(f)).length;
    const itF = items.filter((i) => i.folderId === folderId && isAccessible(i)).length;
    return subF + itF;
  };

  // Toggle expansão de pasta no TreeView
  const toggleFolderExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  // Processar arquivos (usado por Drag & Drop, File Input e Ctrl+V Paste)
  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const filesArray = Array.from(fileList);
      if (filesArray.length === 0) return;

      setDragFeedback(`Salvando ${filesArray.length} arquivo(s)...`);

      for (const file of filesArray) {
        const isImg = file.type.startsWith('image/');
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        const isHtml =
          file.type === 'text/html' ||
          file.name.toLowerCase().endsWith('.html') ||
          file.name.toLowerCase().endsWith('.htm');

        const reader = new FileReader();

        await new Promise<void>((resolve) => {
          reader.onload = async (event) => {
            const content = event.target?.result as string;
            if (!content) {
              resolve();
              return;
            }

            const itemType: ExplorerItem['type'] = isImg
              ? 'image'
              : isPdf
              ? 'pdf'
              : isHtml
              ? 'html'
              : 'file';

            const newItem: ExplorerItem = {
              id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              folderId: currentFolderId,
              type: itemType,
              title: file.name,
              contentOrUrl: content,
              author: currentUserName,
              createdAt: new Date().toISOString(),
              size: `${(file.size / 1024).toFixed(1)} KB`,
              sharedType: 'everyone',
              sharedWith: [],
            };

            setItems((prev) => [newItem, ...prev]);
            await saveExplorerItem(newItem);
            resolve();
          };

          if (isHtml || file.type.startsWith('text/')) {
            reader.readAsText(file);
          } else {
            reader.readAsDataURL(file);
          }
        });
      }

      setDragFeedback(null);
    },
    [currentFolderId, currentUserName]
  );

  // Escuta de Clipboard Paste (Ctrl + V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Ignora se estiver digitando em um input ou textarea ativo
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        e.preventDefault();
        processFiles(e.clipboardData.files);
      } else if (e.clipboardData) {
        // Se colar texto formatado em HTML
        const text = e.clipboardData.getData('text');
        if (text && (text.includes('<!DOCTYPE html>') || text.includes('<html') || text.includes('</div>'))) {
          e.preventDefault();
          const newItem: ExplorerItem = {
            id: `item-${Date.now()}-html`,
            folderId: currentFolderId,
            type: 'html',
            title: `Documento_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.html`,
            contentOrUrl: text,
            author: currentUserName,
            createdAt: new Date().toISOString(),
            size: `${(text.length / 1024).toFixed(1)} KB`,
            sharedType: 'everyone',
            sharedWith: [],
          };
          setItems((prev) => [newItem, ...prev]);
          saveExplorerItem(newItem);
          setDragFeedback('Documento HTML colado com sucesso!');
          setTimeout(() => setDragFeedback(null), 3000);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [processFiles, currentFolderId, currentUserName]);

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!explorerContainerRef.current?.contains(e.relatedTarget as Node)) {
      setIsDraggingOver(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  // Criar nova pasta
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const newFolder: ExplorerFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      parentId: newFolderParentId ?? currentFolderId,
      createdAt: new Date().toISOString(),
      author: currentUserName,
      sharedType: 'everyone',
      sharedWith: [],
    };

    setFolders((prev) => [...prev, newFolder]);
    setNewFolderName('');
    setNewFolderParentId(null);
    setIsNewFolderOpen(false);
    await saveExplorerFolder(newFolder);
  };

  // Excluir pasta
  const handleDeleteFolder = async (folderId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (confirm('Deseja excluir esta pasta e todos os seus itens?')) {
      setFolders((prev) => prev.filter((f) => f.id !== folderId && f.parentId !== folderId));
      setItems((prev) => prev.filter((it) => it.folderId !== folderId));
      if (currentFolderId === folderId) {
        setCurrentFolderId(null);
      }
      setSelectedId(null);
      await deleteExplorerFolder(folderId);
    }
  };

  // Salvar anotação
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;

    if (editingNoteId) {
      const existing = items.find((it) => it.id === editingNoteId);
      const updated: ExplorerItem = {
        ...(existing || {
          id: editingNoteId,
          folderId: currentFolderId,
          type: 'note',
          createdAt: new Date().toISOString(),
          author: currentUserName,
        }),
        id: editingNoteId,
        folderId: existing?.folderId || currentFolderId,
        type: 'note',
        title: noteTitle.trim(),
        contentOrUrl: noteContent.trim(),
        author: existing?.author || currentUserName,
        createdAt: existing?.createdAt || new Date().toISOString(),
      };
      setItems((prev) => prev.map((it) => (it.id === editingNoteId ? updated : it)));
      await saveExplorerItem(updated);
    } else {
      const newNote: ExplorerItem = {
        id: `note-${Date.now()}`,
        folderId: currentFolderId,
        type: 'note',
        title: noteTitle.trim(),
        contentOrUrl: noteContent.trim(),
        author: currentUserName,
        createdAt: new Date().toISOString(),
        sharedType: 'everyone',
        sharedWith: [],
      };
      setItems((prev) => [newNote, ...prev]);
      await saveExplorerItem(newNote);
    }

    setNoteTitle('');
    setNoteContent('');
    setEditingNoteId(null);
    setIsNoteModalOpen(false);
  };

  // Salvar Documento HTML
  const handleSaveHtmlDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!htmlDocTitle.trim()) return;

    const formattedTitle = htmlDocTitle.trim().endsWith('.html')
      ? htmlDocTitle.trim()
      : `${htmlDocTitle.trim()}.html`;

    const newHtmlItem: ExplorerItem = {
      id: `html-${Date.now()}`,
      folderId: currentFolderId,
      type: 'html',
      title: formattedTitle,
      contentOrUrl: htmlDocContent.trim() || '<!-- Documento HTML Digifarma -->\n<h1>Novo Procedimento</h1>',
      author: currentUserName,
      createdAt: new Date().toISOString(),
      size: `${((htmlDocContent.length || 50) / 1024).toFixed(1)} KB`,
      sharedType: 'everyone',
      sharedWith: [],
    };

    setItems((prev) => [newHtmlItem, ...prev]);
    await saveExplorerItem(newHtmlItem);

    setHtmlDocTitle('');
    setHtmlDocContent('');
    setIsHtmlModalOpen(false);
  };

  // Excluir item
  const handleDeleteItem = async (itemId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (confirm('Deseja excluir este item permanentemente?')) {
      setItems((prev) => prev.filter((it) => it.id !== itemId));
      if (viewingItem?.id === itemId) setViewingItem(null);
      setSelectedId(null);
      await deleteExplorerItem(itemId);
    }
  };

  // Abrir Compartilhamento
  const openShareModal = (
    type: 'folder' | 'item',
    id: string,
    title: string,
    sharedType: 'everyone' | 'restricted' | 'private' = 'everyone',
    sharedWith: string[] = [],
    author: string = currentUserName,
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();
    setShareTarget({ type, id, title, sharedType, sharedWith, author });
    setShareTypeDraft(sharedType);
    setSelectedMembersDraft(sharedWith || []);
    setMemberSearchTerm('');
  };

  // Salvar Compartilhamento
  const handleSaveShare = async () => {
    if (!shareTarget) return;

    if (shareTarget.type === 'folder') {
      const folder = folders.find((f) => f.id === shareTarget.id);
      if (folder) {
        const updated: ExplorerFolder = {
          ...folder,
          sharedType: shareTypeDraft,
          sharedWith: shareTypeDraft === 'restricted' ? selectedMembersDraft : [],
        };
        setFolders((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
        await saveExplorerFolder(updated);
      }
    } else {
      const item = items.find((i) => i.id === shareTarget.id);
      if (item) {
        const updated: ExplorerItem = {
          ...item,
          sharedType: shareTypeDraft,
          sharedWith: shareTypeDraft === 'restricted' ? selectedMembersDraft : [],
        };
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        await saveExplorerItem(updated);
      }
    }

    setShareTarget(null);
  };

  // Renderizar ícone correspondente ao item
  const renderItemIcon = (type: ExplorerItem['type'], size = 24) => {
    switch (type) {
      case 'pdf':
        return <File size={size} color="#ef4444" />;
      case 'html':
        return <Code size={size} color="#f97316" />;
      case 'image':
        return <ImageIcon size={size} color="#3b82f6" />;
      case 'note':
        return <FileText size={size} color="#f59e0b" />;
      case 'file':
      default:
        return <FileSpreadsheet size={size} color="#10b981" />;
    }
  };

  // Renderizar tag de compartilhamento
  const renderShareBadge = (
    sharedType: 'everyone' | 'restricted' | 'private' = 'everyone',
    sharedWith: string[] = []
  ) => {
    if (sharedType === 'private') {
      return (
        <span
          title="Privado: Apenas você pode ver"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 600,
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#ef4444',
          }}
        >
          <Lock size={10} /> Privado
        </span>
      );
    }
    if (sharedType === 'restricted') {
      return (
        <span
          title={`Compartilhado com: ${sharedWith.join(', ') || 'pessoas selecionadas'}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 600,
            background: 'rgba(59, 130, 246, 0.12)',
            color: '#3b82f6',
          }}
        >
          <Users size={10} /> {sharedWith.length || 1} pessoas
        </span>
      );
    }
    return (
      <span
        title="Compartilhado com toda a equipe Digifarma"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: 600,
          background: 'rgba(16, 185, 129, 0.12)',
          color: '#10b981',
        }}
      >
        <Globe size={10} /> Todos
      </span>
    );
  };

  // Componente recursivo para renderizar a árvore de pastas no painel esquerdo
  const renderFolderTreeNode = (folder: ExplorerFolder, depth = 0) => {
    const subFolders = folders.filter((f) => f.parentId === folder.id && isAccessible(f));
    const isExpanded = !!expandedFolders[folder.id];
    const isSelected = currentFolderId === folder.id;

    return (
      <div key={folder.id} style={{ paddingLeft: `${depth * 12}px` }}>
        <div
          onClick={() => navigateToFolder(folder.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 8px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: isSelected ? 700 : 500,
            background: isSelected ? 'var(--red-soft, rgba(239,68,68,0.1))' : 'transparent',
            color: isSelected ? 'var(--red, #ef4444)' : 'var(--text-primary)',
            transition: 'background 0.1s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
            {subFolders.length > 0 ? (
              <span
                onClick={(e) => toggleFolderExpand(folder.id, e)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px',
                  color: 'var(--text-muted)',
                }}
              >
                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </span>
            ) : (
              <span style={{ width: '16px' }} />
            )}
            <Folder size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
            <span
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={folder.name}
            >
              {folder.name}
            </span>
          </div>

          <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '4px' }}>
            {getFolderItemCount(folder.id)}
          </span>
        </div>

        {isExpanded && subFolders.length > 0 && (
          <div>{subFolders.map((sub) => renderFolderTreeNode(sub, depth + 1))}</div>
        )}
      </div>
    );
  };

  const rootFolders = useMemo(
    () => folders.filter((f) => f.parentId === null && isAccessible(f)),
    [folders, isAccessible]
  );

  return (
    <div
      ref={explorerContainerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
        minHeight: '85vh',
      }}
    >
      {/* Overlay translúcido de Drag & Drop no estilo Windows Explorer */}
      {isDraggingOver && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(59, 130, 246, 0.15)',
            backdropFilter: 'blur(3px)',
            border: '2px dashed #3b82f6',
            borderRadius: '14px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <Upload size={48} color="#3b82f6" style={{ marginBottom: '12px', animation: 'bounce 1s infinite' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e40af', margin: '0 0 4px 0' }}>
            Solte os arquivos para salvar
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#1e3a8a', margin: 0 }}>
            PDF, HTML, imagens, documentos ou planilhas nesta pasta
          </p>
        </div>
      )}

      {/* Toast Feedback */}
      {dragFeedback && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'var(--card-bg, #1e293b)',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            zIndex: 10000,
            fontSize: '0.86rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Check size={16} color="#10b981" />
          <span>{dragFeedback}</span>
        </div>
      )}

      {/* ── 1. Heading Oficial ── */}
      <section className="heading" style={{ marginBottom: 0 }}>
        <div>
          <span className="eyebrow">ARQUIVOS &amp; DOCUMENTOS</span>
          <h1 id="pageTitle" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Laptop size={22} color="var(--primary-500, #3b82f6)" />
            Explorador de Arquivos
          </h1>
          <p id="pageSubtitle">
            Gerencie pastas, documentos, HTMLs, PDFs e compartilhe com a equipe ou pessoas específicas.
          </p>
        </div>
        <div className="capture">
          <span className="live-dot" /> Sincronizado
          <span id="captured">{items.length} arquivos · {folders.length} pastas</span>
        </div>
      </section>

      {/* ── 2. Windows Explorer Ribbon / Toolbar Superior ── */}
      <div
        style={{
          background: 'var(--bg-primary, #ffffff)',
          border: '1px solid var(--border, #e2e8f0)',
          borderRadius: '12px',
          padding: '8px 12px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        }}
      >
        {/* Ações da Esquerda (Novo, Upload, Compartilhar, Excluir) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* + Nova Pasta */}
          <button
            type="button"
            onClick={() => {
              setNewFolderName('');
              setNewFolderParentId(currentFolderId);
              setIsNewFolderOpen(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border, #cbd5e1)',
              background: 'var(--bg-secondary, #f8fafc)',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <FolderPlus size={15} color="#f59e0b" />
            <span>Nova Pasta</span>
          </button>

          {/* + Enviar Arquivos */}
          <input
            type="file"
            ref={fileInputRef}
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files) processFiles(e.target.files);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border, #cbd5e1)',
              background: 'var(--bg-secondary, #f8fafc)',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Upload size={15} color="#3b82f6" />
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
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border, #cbd5e1)',
              background: 'var(--bg-secondary, #f8fafc)',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <FileText size={15} color="#f59e0b" />
            <span>Anotação</span>
          </button>

          {/* + Novo Documento HTML */}
          <button
            type="button"
            onClick={() => {
              setHtmlDocTitle('');
              setHtmlDocContent('');
              setIsHtmlModalOpen(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border, #cbd5e1)',
              background: 'var(--bg-secondary, #f8fafc)',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Code size={15} color="#f97316" />
            <span>Criar HTML</span>
          </button>

          {/* Compartilhar Selecionado (se houver seleção ativa) */}
          {selectedId && (
            <button
              type="button"
              onClick={() => {
                if (selectedType === 'folder') {
                  const f = folders.find((fol) => fol.id === selectedId);
                  if (f) openShareModal('folder', f.id, f.name, f.sharedType, f.sharedWith, f.author);
                } else if (selectedType === 'item') {
                  const it = items.find((item) => item.id === selectedId);
                  if (it) openShareModal('item', it.id, it.title, it.sharedType, it.sharedWith, it.author);
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #3b82f6',
                background: 'rgba(59, 130, 246, 0.08)',
                color: '#2563eb',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Share2 size={15} />
              <span>Compartilhar</span>
            </button>
          )}

          {/* Excluir Selecionado */}
          {selectedId && (
            <button
              type="button"
              onClick={() => {
                if (selectedType === 'folder') {
                  handleDeleteFolder(selectedId);
                } else if (selectedType === 'item') {
                  handleDeleteItem(selectedId);
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #ef4444',
                background: 'rgba(239, 68, 68, 0.08)',
                color: '#dc2626',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Trash2 size={14} />
              <span>Excluir</span>
            </button>
          )}
        </div>

        {/* Visualização: Ícones vs Detalhes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            onClick={() => setViewMode('icons')}
            title="Visualização em Grade de Ícones"
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: 'none',
              background: viewMode === 'icons' ? 'var(--red-soft, rgba(239,68,68,0.1))' : 'transparent',
              color: viewMode === 'icons' ? 'var(--red, #ef4444)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Grid size={16} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('details')}
            title="Visualização em Lista de Detalhes"
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: 'none',
              background: viewMode === 'details' ? 'var(--red-soft, rgba(239,68,68,0.1))' : 'transparent',
              color: viewMode === 'details' ? 'var(--red, #ef4444)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* ── 3. Barra de Navegação & Endereço estilo Windows 11 Explorer ── */}
      <div
        style={{
          background: 'var(--bg-primary, #ffffff)',
          border: '1px solid var(--border, #e2e8f0)',
          borderRadius: '10px',
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {/* Controles de Navegação */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <button
            type="button"
            onClick={handleGoBack}
            disabled={historyIndex <= 0}
            title="Voltar (Alt + Esquerda)"
            style={{
              border: 'none',
              background: 'transparent',
              padding: '6px',
              borderRadius: '6px',
              cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer',
              color: historyIndex <= 0 ? 'var(--border, #cbd5e1)' : 'var(--text-primary)',
            }}
          >
            <ArrowLeft size={16} />
          </button>

          <button
            type="button"
            onClick={handleGoForward}
            disabled={historyIndex >= history.length - 1}
            title="Avançar (Alt + Direita)"
            style={{
              border: 'none',
              background: 'transparent',
              padding: '6px',
              borderRadius: '6px',
              cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer',
              color: historyIndex >= history.length - 1 ? 'var(--border, #cbd5e1)' : 'var(--text-primary)',
            }}
          >
            <ArrowRight size={16} />
          </button>

          <button
            type="button"
            onClick={handleGoUp}
            disabled={!currentFolderId}
            title="Nível Acima"
            style={{
              border: 'none',
              background: 'transparent',
              padding: '6px',
              borderRadius: '6px',
              cursor: !currentFolderId ? 'not-allowed' : 'pointer',
              color: !currentFolderId ? 'var(--border, #cbd5e1)' : 'var(--text-primary)',
            }}
          >
            <ArrowUp size={16} />
          </button>

          <button
            type="button"
            onClick={loadData}
            title="Atualizar pasta (F5)"
            style={{
              border: 'none',
              background: 'transparent',
              padding: '6px',
              borderRadius: '6px',
              cursor: 'pointer',
              color: 'var(--text-primary)',
            }}
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {/* Barra de Endereço (Breadcrumb Bar estilo Windows 11) */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-secondary, #f8fafc)',
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: '6px',
            padding: '4px 10px',
            overflowX: 'auto',
            gap: '4px',
          }}
        >
          <Folder size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.id || 'root'}>
                <button
                  type="button"
                  onClick={() => navigateToFolder(crumb.id)}
                  style={{
                    border: 'none',
                    background: isLast ? 'rgba(0,0,0,0.05)' : 'transparent',
                    color: isLast ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: isLast ? 700 : 500,
                    fontSize: '0.8rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {crumb.name}
                </button>
                {!isLast && <ChevronRight size={12} color="var(--text-muted, #94a3b8)" />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Caixa de Pesquisa do Explorer */}
        <div
          style={{
            position: 'relative',
            minWidth: '220px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Search
            size={14}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }}
          />
          <input
            type="text"
            placeholder="Pesquisar arquivos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 28px 6px 30px',
              borderRadius: '6px',
              border: '1px solid var(--border, #e2e8f0)',
              background: 'var(--bg-secondary, #f8fafc)',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
            }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '8px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '2px',
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ── 4. Layout Dividido: Painel Esquerdo (Navegação) + Painel Direito (Conteúdo) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: '14px',
          alignItems: 'start',
        }}
      >
        {/* PAINEL ESQUERDO: Acesso Rápido & Árvore de Pastas */}
        <div
          style={{
            background: 'var(--bg-primary, #ffffff)',
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          }}
        >
          {/* Seção Acesso Rápido */}
          <div>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: 'var(--text-muted)',
                letterSpacing: '0.05em',
                marginBottom: '8px',
                textTransform: 'uppercase',
              }}
            >
              Acesso Rápido
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {/* Todos os Arquivos (Raiz) */}
              <div
                onClick={() => {
                  setActiveFilterTab('all');
                  navigateToFolder(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: activeFilterTab === 'all' && currentFolderId === null ? 700 : 500,
                  background:
                    activeFilterTab === 'all' && currentFolderId === null
                      ? 'var(--red-soft, rgba(239,68,68,0.1))'
                      : 'transparent',
                  color:
                    activeFilterTab === 'all' && currentFolderId === null
                      ? 'var(--red, #ef4444)'
                      : 'var(--text-primary)',
                }}
              >
                <Folder size={16} color="#f59e0b" />
                <span>Todos os Arquivos</span>
              </div>

              {/* Compartilhados Comigo */}
              <div
                onClick={() => {
                  setActiveFilterTab('shared_with_me');
                  setSelectedId(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: activeFilterTab === 'shared_with_me' ? 700 : 500,
                  background:
                    activeFilterTab === 'shared_with_me'
                      ? 'var(--red-soft, rgba(239,68,68,0.1))'
                      : 'transparent',
                  color:
                    activeFilterTab === 'shared_with_me' ? 'var(--red, #ef4444)' : 'var(--text-primary)',
                }}
              >
                <Users size={16} color="#3b82f6" />
                <span>Compartilhados</span>
              </div>

              {/* Meus Arquivos Privados */}
              <div
                onClick={() => {
                  setActiveFilterTab('my_private');
                  setSelectedId(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: activeFilterTab === 'my_private' ? 700 : 500,
                  background:
                    activeFilterTab === 'my_private'
                      ? 'var(--red-soft, rgba(239,68,68,0.1))'
                      : 'transparent',
                  color:
                    activeFilterTab === 'my_private' ? 'var(--red, #ef4444)' : 'var(--text-primary)',
                }}
              >
                <Lock size={16} color="#ef4444" />
                <span>Meus Privados</span>
              </div>

              {/* Anotações & Manuais */}
              <div
                onClick={() => {
                  setActiveFilterTab('notes');
                  setSelectedId(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: activeFilterTab === 'notes' ? 700 : 500,
                  background:
                    activeFilterTab === 'notes'
                      ? 'var(--red-soft, rgba(239,68,68,0.1))'
                      : 'transparent',
                  color: activeFilterTab === 'notes' ? 'var(--red, #ef4444)' : 'var(--text-primary)',
                }}
              >
                <FileText size={16} color="#10b981" />
                <span>Anotações</span>
              </div>
            </div>
          </div>

          {/* Seção Árvore de Pastas */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Pastas
              </div>

              <button
                type="button"
                onClick={() => {
                  setNewFolderName('');
                  setNewFolderParentId(null);
                  setIsNewFolderOpen(true);
                }}
                title="Criar Pasta na Raiz"
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '2px',
                }}
              >
                <Plus size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '340px', overflowY: 'auto' }}>
              {rootFolders.map((rootF) => renderFolderTreeNode(rootF, 0))}
              {rootFolders.length === 0 && (
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', padding: '6px 8px' }}>
                  Nenhuma pasta na raiz
                </div>
              )}
            </div>
          </div>

          {/* Dica de Atalho */}
          <div
            style={{
              padding: '10px',
              background: 'var(--bg-secondary, #f8fafc)',
              borderRadius: '8px',
              fontSize: '0.74rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
              border: '1px dashed var(--border, #e2e8f0)',
            }}
          >
            💡 <strong>Dica Rápida:</strong> Você pode arrastar arquivos para a janela ou colar imagens e documentos com <strong>Ctrl + V</strong> a qualquer momento!
          </div>
        </div>

        {/* PAINEL DIREITO: Área de Conteúdo de Pastas e Arquivos */}
        <div
          style={{
            background: 'var(--bg-primary, #ffffff)',
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: '12px',
            padding: '16px',
            minHeight: '480px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          }}
        >
          {/* MODO GRADE: ÍCONES GRANDES */}
          {viewMode === 'icons' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Pastas */}
              {visibleFolders.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '10px',
                    }}
                  >
                    Pastas ({visibleFolders.length})
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                      gap: '12px',
                    }}
                  >
                    {visibleFolders.map((folder) => {
                      const count = getFolderItemCount(folder.id);
                      const isSelected = selectedId === folder.id;

                      return (
                        <div
                          key={folder.id}
                          onClick={() => {
                            setSelectedId(folder.id);
                            setSelectedType('folder');
                          }}
                          onDoubleClick={() => navigateToFolder(folder.id)}
                          role="button"
                          tabIndex={0}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: isSelected
                              ? 'rgba(59, 130, 246, 0.08)'
                              : 'var(--bg-secondary, #f8fafc)',
                            border: isSelected
                              ? '1.5px solid #3b82f6'
                              : '1px solid var(--border, #e2e8f0)',
                            borderRadius: '10px',
                            padding: '12px 14px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                            <Folder size={26} color="#f59e0b" style={{ flexShrink: 0 }} />
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
                                title={folder.name}
                              >
                                {folder.name}
                              </div>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  marginTop: '2px',
                                }}
                              >
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  {count} {count === 1 ? 'item' : 'itens'}
                                </span>
                                {renderShareBadge(folder.sharedType, folder.sharedWith)}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              type="button"
                              onClick={(e) =>
                                openShareModal(
                                  'folder',
                                  folder.id,
                                  folder.name,
                                  folder.sharedType,
                                  folder.sharedWith,
                                  folder.author,
                                  e
                                )
                              }
                              title="Compartilhar pasta"
                              style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                padding: '4px',
                                color: 'var(--text-muted)',
                              }}
                            >
                              <Share2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteFolder(folder.id, e)}
                              title="Excluir pasta"
                              style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                padding: '4px',
                                color: 'var(--text-muted)',
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Arquivos e Documentos */}
              {visibleItems.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '10px',
                    }}
                  >
                    Arquivos e Anotações ({visibleItems.length})
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                      gap: '12px',
                    }}
                  >
                    {visibleItems.map((item) => {
                      const isSelected = selectedId === item.id;
                      const isNote = item.type === 'note';

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSelectedId(item.id);
                            setSelectedType('item');
                          }}
                          onDoubleClick={() => setViewingItem(item)}
                          role="button"
                          tabIndex={0}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            background: isSelected
                              ? 'rgba(59, 130, 246, 0.08)'
                              : 'var(--bg-secondary, #f8fafc)',
                            border: isSelected
                              ? '1.5px solid #3b82f6'
                              : '1px solid var(--border, #e2e8f0)',
                            borderRadius: '10px',
                            padding: '12px 14px',
                            cursor: 'pointer',
                            minHeight: '100px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                background: 'var(--bg-primary, #ffffff)',
                                border: '1px solid var(--border, #e2e8f0)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {renderItemIcon(item.type, 20)}
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
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {item.author} · {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                              </div>
                              <div style={{ marginTop: '4px' }}>
                                {renderShareBadge(item.sharedType, item.sharedWith)}
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingTop: '8px',
                              marginTop: '8px',
                              borderTop: '1px solid var(--border, #e2e8f0)',
                              fontSize: '0.72rem',
                              color: 'var(--text-muted)',
                            }}
                          >
                            <span>{isNote ? 'Anotação interna' : item.size || 'Arquivo'}</span>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingItem(item);
                                }}
                                title="Visualizar"
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                  padding: '2px',
                                  color: 'var(--text-muted)',
                                }}
                              >
                                <Eye size={13} />
                              </button>

                              <button
                                type="button"
                                onClick={(e) =>
                                  openShareModal(
                                    'item',
                                    item.id,
                                    item.title,
                                    item.sharedType,
                                    item.sharedWith,
                                    item.author,
                                    e
                                  )
                                }
                                title="Compartilhar arquivo"
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                  padding: '2px',
                                  color: 'var(--text-muted)',
                                }}
                              >
                                <Share2 size={13} />
                              </button>

                              {isNote && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingNoteId(item.id);
                                    setNoteTitle(item.title);
                                    setNoteContent(item.contentOrUrl);
                                    setIsNoteModalOpen(true);
                                  }}
                                  title="Editar anotação"
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    padding: '2px',
                                    color: 'var(--text-muted)',
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
                                  cursor: 'pointer',
                                  padding: '2px',
                                  color: 'var(--text-muted)',
                                }}
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
            </div>
          ) : (
            /* MODO DETALHES: TABELA LISTA ESTILO WINDOWS EXPLORER */
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid var(--border, #e2e8f0)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px', color: 'var(--text-muted)', fontWeight: 700 }}>Nome</th>
                    <th style={{ padding: '8px 10px', color: 'var(--text-muted)', fontWeight: 700 }}>Modificado</th>
                    <th style={{ padding: '8px 10px', color: 'var(--text-muted)', fontWeight: 700 }}>Tipo</th>
                    <th style={{ padding: '8px 10px', color: 'var(--text-muted)', fontWeight: 700 }}>Tamanho</th>
                    <th style={{ padding: '8px 10px', color: 'var(--text-muted)', fontWeight: 700 }}>Acesso</th>
                    <th style={{ padding: '8px 10px', color: 'var(--text-muted)', fontWeight: 700 }}>Autor</th>
                    <th style={{ padding: '8px 10px', color: 'var(--text-muted)', textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Pastas */}
                  {visibleFolders.map((folder) => {
                    const isSelected = selectedId === folder.id;
                    return (
                      <tr
                        key={folder.id}
                        onClick={() => {
                          setSelectedId(folder.id);
                          setSelectedType('folder');
                        }}
                        onDoubleClick={() => navigateToFolder(folder.id)}
                        style={{
                          borderBottom: '1px solid var(--border, #f1f5f9)',
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Folder size={18} color="#f59e0b" />
                            <span>{folder.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                          {new Date(folder.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>Pasta de arquivos</td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                          {getFolderItemCount(folder.id)} itens
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          {renderShareBadge(folder.sharedType, folder.sharedWith)}
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                          {folder.author || 'Equipe Digifarma'}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={(e) =>
                              openShareModal(
                                'folder',
                                folder.id,
                                folder.name,
                                folder.sharedType,
                                folder.sharedWith,
                                folder.author,
                                e
                              )
                            }
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px 4px' }}
                            title="Compartilhar"
                          >
                            <Share2 size={13} color="var(--text-muted)" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteFolder(folder.id, e)}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px 4px' }}
                            title="Excluir"
                          >
                            <Trash2 size={13} color="var(--text-muted)" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Itens */}
                  {visibleItems.map((item) => {
                    const isSelected = selectedId === item.id;
                    const typeLabel =
                      item.type === 'pdf'
                        ? 'Documento PDF'
                        : item.type === 'html'
                        ? 'Página Web HTML'
                        : item.type === 'image'
                        ? 'Imagem'
                        : item.type === 'note'
                        ? 'Anotação Interna'
                        : 'Planilha / Documento';

                    return (
                      <tr
                        key={item.id}
                        onClick={() => {
                          setSelectedId(item.id);
                          setSelectedType('item');
                        }}
                        onDoubleClick={() => setViewingItem(item)}
                        style={{
                          borderBottom: '1px solid var(--border, #f1f5f9)',
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {renderItemIcon(item.type, 16)}
                            <span>{item.title}</span>
                          </div>
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                          {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>{typeLabel}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                          {item.type === 'note' ? '—' : item.size || '—'}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          {renderShareBadge(item.sharedType, item.sharedWith)}
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>{item.author}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingItem(item);
                            }}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px 4px' }}
                            title="Visualizar"
                          >
                            <Eye size={13} color="var(--text-muted)" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) =>
                              openShareModal(
                                'item',
                                item.id,
                                item.title,
                                item.sharedType,
                                item.sharedWith,
                                item.author,
                                e
                              )
                            }
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px 4px' }}
                            title="Compartilhar"
                          >
                            <Share2 size={13} color="var(--text-muted)" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteItem(item.id, e)}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px 4px' }}
                            title="Excluir"
                          >
                            <Trash2 size={13} color="var(--text-muted)" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Estado Vazio */}
          {visibleFolders.length === 0 && visibleItems.length === 0 && (
            <div
              style={{
                padding: '60px 20px',
                textAlign: 'center',
                background: 'var(--bg-secondary, #f8fafc)',
                borderRadius: '12px',
                border: '1.5px dashed var(--border, #cbd5e1)',
                marginTop: '12px',
              }}
            >
              <Folder size={44} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                Esta pasta está vazia
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
                Arraste arquivos aqui, aperte Ctrl + V para colar ou utilize a barra de ferramentas no topo.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'var(--red, #ef4444)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                <Upload size={15} />
                <span>Enviar Arquivos Agora</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL: Compartilhamento ── */}
      {shareTarget && (
        <div className="modal-backdrop">
          <div
            className="modal-box"
            style={{
              maxWidth: '460px',
              padding: '24px',
              background: 'var(--bg-primary, #ffffff)',
              borderRadius: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Share2 size={18} color="#3b82f6" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Compartilhar {shareTarget.type === 'folder' ? 'Pasta' : 'Arquivo'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShareTarget(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: 0, marginBottom: '16px' }}>
              Defina quem pode acessar e visualizar <strong>{shareTarget.title}</strong>:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {/* Opção 1: Todos */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border:
                    shareTypeDraft === 'everyone'
                      ? '1.5px solid #10b981'
                      : '1px solid var(--border, #e2e8f0)',
                  background:
                    shareTypeDraft === 'everyone'
                      ? 'rgba(16, 185, 129, 0.08)'
                      : 'var(--bg-secondary, #f8fafc)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="shareType"
                  checked={shareTypeDraft === 'everyone'}
                  onChange={() => setShareTypeDraft('everyone')}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    🌍 Todos da Equipe Digifarma
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    Qualquer usuário com acesso ao sistema pode ver e abrir este item.
                  </div>
                </div>
              </label>

              {/* Opção 2: Pessoas Específicas */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border:
                    shareTypeDraft === 'restricted'
                      ? '1.5px solid #3b82f6'
                      : '1px solid var(--border, #e2e8f0)',
                  background:
                    shareTypeDraft === 'restricted'
                      ? 'rgba(59, 130, 246, 0.08)'
                      : 'var(--bg-secondary, #f8fafc)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="shareType"
                  checked={shareTypeDraft === 'restricted'}
                  onChange={() => setShareTypeDraft('restricted')}
                  style={{ marginTop: '3px' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    👥 Pessoas Específicas
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Apenas membros selecionados terão permissão de acesso.
                  </div>

                  {shareTypeDraft === 'restricted' && (
                    <div style={{ marginTop: '8px' }}>
                      <input
                        type="text"
                        placeholder="Buscar membro..."
                        value={memberSearchTerm}
                        onChange={(e) => setMemberSearchTerm(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border, #cbd5e1)',
                          background: 'var(--bg-primary, #ffffff)',
                          fontSize: '0.78rem',
                          marginBottom: '8px',
                        }}
                      />

                      <div
                        style={{
                          maxHeight: '140px',
                          overflowY: 'auto',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          padding: '4px',
                          background: 'var(--bg-primary, #ffffff)',
                          borderRadius: '6px',
                          border: '1px solid var(--border, #e2e8f0)',
                        }}
                      >
                        {teamMembers
                          .filter((m) =>
                            m.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
                            m.username.toLowerCase().includes(memberSearchTerm.toLowerCase())
                          )
                          .map((member) => {
                            const isChecked = selectedMembersDraft.some(
                              (u) =>
                                u.toLowerCase() === member.username.toLowerCase() ||
                                u.toLowerCase() === member.name.toLowerCase()
                            );
                            return (
                              <label
                                key={member.username}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  background: isChecked ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedMembersDraft((prev) => [...prev, member.name]);
                                    } else {
                                      setSelectedMembersDraft((prev) =>
                                        prev.filter(
                                          (u) =>
                                            u.toLowerCase() !== member.username.toLowerCase() &&
                                            u.toLowerCase() !== member.name.toLowerCase()
                                        )
                                      );
                                    }
                                  }}
                                />
                                <span>{member.name}</span>
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </label>

              {/* Opção 3: Privado */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border:
                    shareTypeDraft === 'private'
                      ? '1.5px solid #ef4444'
                      : '1px solid var(--border, #e2e8f0)',
                  background:
                    shareTypeDraft === 'private'
                      ? 'rgba(239, 68, 68, 0.08)'
                      : 'var(--bg-secondary, #f8fafc)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="shareType"
                  checked={shareTypeDraft === 'private'}
                  onChange={() => setShareTypeDraft('private')}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    🔒 Somente Eu (Privado)
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    Ficará oculto para todos os outros membros e visível apenas para você.
                  </div>
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShareTarget(null)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border, #cbd5e1)',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveShare}
                style={{
                  padding: '7px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--red, #ef4444)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                Salvar Permissões
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Nova Pasta ── */}
      {isNewFolderOpen && (
        <div className="modal-backdrop">
          <div
            className="modal-box"
            style={{ maxWidth: '400px', padding: '20px', background: 'var(--bg-primary, #ffffff)', borderRadius: '14px' }}
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
                  placeholder="Ex: Treinamentos e Manuais"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #cbd5e1)',
                    background: 'var(--bg-secondary, #f8fafc)',
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
                    border: '1px solid var(--border, #cbd5e1)',
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
                    background: 'var(--red, #ef4444)',
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

      {/* ── MODAL: Anotação ── */}
      {isNoteModalOpen && (
        <div className="modal-backdrop">
          <div
            className="modal-box"
            style={{ maxWidth: '580px', padding: '24px', background: 'var(--bg-primary, #ffffff)', borderRadius: '16px' }}
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
                  placeholder="Ex: Instruções de Fechamento de Caixa"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #cbd5e1)',
                    background: 'var(--bg-secondary, #f8fafc)',
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
                  placeholder="Escreva anotações, passos operacionais e observações..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #cbd5e1)',
                    background: 'var(--bg-secondary, #f8fafc)',
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
                    border: '1px solid var(--border, #cbd5e1)',
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
                    background: 'var(--red, #ef4444)',
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

      {/* ── MODAL: Criar Documento HTML ── */}
      {isHtmlModalOpen && (
        <div className="modal-backdrop">
          <div
            className="modal-box"
            style={{ maxWidth: '640px', padding: '24px', background: 'var(--bg-primary, #ffffff)', borderRadius: '16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Code size={20} color="#f97316" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Novo Documento HTML
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHtmlModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveHtmlDoc}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Nome do Arquivo HTML:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: manual_procedimento_v10.html"
                  value={htmlDocTitle}
                  onChange={(e) => setHtmlDocTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #cbd5e1)',
                    background: 'var(--bg-secondary, #f8fafc)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Código HTML / Conteúdo:
                </label>
                <textarea
                  rows={9}
                  placeholder="<!DOCTYPE html>&#10;<html>&#10;<body>&#10;  <h1>Título do Procedimento</h1>&#10;  <p>Descrição dos passos...</p>&#10;</body>&#10;</html>"
                  value={htmlDocContent}
                  onChange={(e) => setHtmlDocContent(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #cbd5e1)',
                    background: 'var(--bg-secondary, #f8fafc)',
                    color: 'var(--text-primary)',
                    fontSize: '0.84rem',
                    fontFamily: 'monospace',
                    lineHeight: 1.4,
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsHtmlModalOpen(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #cbd5e1)',
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
                    background: 'var(--red, #ef4444)',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.84rem',
                  }}
                >
                  Salvar Arquivo HTML
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Visualizar Item (PDF, HTML, Imagem, Anotação, Arquivo) ── */}
      {viewingItem && (
        <div className="modal-backdrop">
          <div
            className="modal-box"
            style={{
              maxWidth: viewingItem.type === 'pdf' || viewingItem.type === 'html' ? '920px' : '720px',
              padding: '24px',
              background: 'var(--bg-primary, #ffffff)',
              borderRadius: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {renderItemIcon(viewingItem.type, 22)}
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 2px 0', color: 'var(--text-primary)' }}>
                    {viewingItem.title}
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Por {viewingItem.author} · {new Date(viewingItem.createdAt).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Renderização Específica */}
            {viewingItem.type === 'pdf' ? (
              <div style={{ marginBottom: '16px' }}>
                <iframe
                  src={viewingItem.contentOrUrl}
                  title={viewingItem.title}
                  style={{
                    width: '100%',
                    height: '65vh',
                    borderRadius: '10px',
                    border: '1px solid var(--border, #cbd5e1)',
                  }}
                />
              </div>
            ) : viewingItem.type === 'html' ? (
              <div style={{ marginBottom: '16px' }}>
                <iframe
                  srcDoc={viewingItem.contentOrUrl}
                  title={viewingItem.title}
                  sandbox="allow-scripts"
                  style={{
                    width: '100%',
                    height: '65vh',
                    borderRadius: '10px',
                    border: '1px solid var(--border, #cbd5e1)',
                    background: '#ffffff',
                  }}
                />
              </div>
            ) : viewingItem.type === 'image' ? (
              <div style={{ textAlign: 'center', maxHeight: '70vh', overflow: 'auto', marginBottom: '16px' }}>
                <img
                  src={viewingItem.contentOrUrl}
                  alt={viewingItem.title}
                  style={{ maxWidth: '100%', maxHeight: '65vh', borderRadius: '10px', objectFit: 'contain' }}
                />
              </div>
            ) : viewingItem.type === 'note' ? (
              <div
                style={{
                  background: 'var(--bg-secondary, #f8fafc)',
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
                <FileSpreadsheet size={48} color="#10b981" style={{ margin: '0 auto 12px auto' }} />
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  Arquivo pronto para consulta e download local.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              {viewingItem.contentOrUrl.startsWith('data:') && (
                <a
                  href={viewingItem.contentOrUrl}
                  download={viewingItem.title}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    background: 'var(--red, #ef4444)',
                    color: '#fff',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                  }}
                >
                  <Download size={14} />
                  <span>Baixar Arquivo</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border, #cbd5e1)',
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
