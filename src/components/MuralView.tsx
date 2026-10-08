import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  X,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  Send,
  Tag,
  User,
  Users,
  Paperclip,
  FileText,
  Download,
  Check,
  Clock,
  Maximize2,
  Edit2,
} from 'lucide-react';
import type { AppUser } from '../types/auth';
import { playNotificationSound } from '../lib/notificationSound';
import type {
  MuralCard,
  MuralColumn,
  MuralMarker,
  MuralComment,
} from '../lib/muralService';
import {
  fetchMuralCards,
  saveAllMuralCards,
  subscribeToMuralCards,
  DEFAULT_COLUMNS,
  INITIAL_CARDS,
} from '../lib/muralService';
import { fetchTeamMembers } from '../lib/publicacoesService';
import { getLocalUsers } from '../lib/authService';

interface MuralViewProps {
  currentUser?: AppUser | null;
  onBackToDashboard?: () => void;
}

const STORAGE_KEY_COLUMNS = 'digifarma_mural_columns_v2';
const STORAGE_KEY_CARDS = 'digifarma_mural_cards_v2';
const STORAGE_KEY_CUSTOM_MARKERS = 'digifarma_mural_custom_markers';

const DEFAULT_MARKERS: MuralMarker[] = [
  { id: 'm-urgent', label: 'Urgente', color: '#ef4444' },
  { id: 'm-important', label: 'Importante', color: '#f59e0b' },
  { id: 'm-homolog', label: 'Homologação', color: '#8b5cf6' },
  { id: 'm-v10', label: 'V10', color: '#3b82f6' },
  { id: 'm-classic', label: 'Clássico', color: '#06b6d4' },
  { id: 'm-valid', label: 'Validado', color: '#10b981' },
  { id: 'm-fiscal', label: 'Fiscal', color: '#ec4899' },
  { id: 'm-train', label: 'Treinamento', color: '#14b8a6' },
];

const PRESET_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#64748b', // Slate
];

export const MuralView: React.FC<MuralViewProps> = ({ currentUser }) => {
  const currentUserName = currentUser?.name || currentUser?.username || 'Leonardo';

  // 1. Membros da Equipe Dinâmicos (Supabase + Local + Padrões)
  const [teamMembers, setTeamMembers] = useState<Array<{ username: string; name: string }>>([
    { username: 'Leonardo', name: 'Leonardo' },
    { username: 'Icaro', name: 'Icaro' },
    { username: 'Wallace', name: 'Wallace' },
    { username: 'Whitalo', name: 'Whitalo' },
  ]);

  useEffect(() => {
    async function loadTeam() {
      try {
        const [supabaseUsers, localUsers] = await Promise.all([
          fetchTeamMembers(),
          getLocalUsers(),
        ]);

        const map = new Map<string, { username: string; name: string }>();

        // Padrões
        [
          { username: 'Leonardo', name: 'Leonardo' },
          { username: 'Icaro', name: 'Icaro' },
          { username: 'Wallace', name: 'Wallace' },
          { username: 'Whitalo', name: 'Whitalo' },
        ].forEach((u) => map.set(u.username.toLowerCase(), u));

        // Locais
        localUsers.forEach((u) => {
          if (u.username) {
            map.set(u.username.toLowerCase(), {
              username: u.username,
              name: u.name || u.username,
            });
          }
        });

        // Supabase
        supabaseUsers.forEach((u) => {
          if (u.username) {
            map.set(u.username.toLowerCase(), {
              username: u.username,
              name: u.name || u.username,
            });
          }
        });

        setTeamMembers(Array.from(map.values()));
      } catch (err) {
        console.warn('Erro ao carregar membros da equipe para o Kanban:', err);
      }
    }
    loadTeam();
  }, []);

  // 2. Colunas e Cartões
  const [columns, setColumns] = useState<MuralColumn[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_COLUMNS);
    return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
  });

  const [cards, setCards] = useState<MuralCard[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CARDS);
    return saved ? JSON.parse(saved) : INITIAL_CARDS;
  });

  // 3. Marcadores Disponíveis
  const [availableMarkers, setAvailableMarkers] = useState<MuralMarker[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_MARKERS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // fallback
      }
    }
    return DEFAULT_MARKERS;
  });

  // 4. Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMember, setFilterMember] = useState<'all' | 'mine' | 'shared'>('all');

  // 5. Modal: Nova Coluna
  const [isNewColOpen, setIsNewColOpen] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');

  // 6. Modal: Novo Cartão
  const [isNewCardOpen, setIsNewCardOpen] = useState(false);
  const [targetColumnId, setTargetColumnId] = useState<string>('col-todo');
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDesc, setNewCardDesc] = useState('');
  const [newCardAssignee, setNewCardAssignee] = useState<string>('');
  const [newCardShared, setNewCardShared] = useState<string[]>([]);
  const [newCardMarkers, setNewCardMarkers] = useState<MuralMarker[]>([]);
  const [newCardAttachment, setNewCardAttachment] = useState<MuralCard['attachment']>(null);

  // Popovers na criação
  const [showMarkerPicker, setShowMarkerPicker] = useState(false);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);
  const [showSharePicker, setShowSharePicker] = useState(false);

  // Criação de novo marcador customizado
  const [isCreatingCustomMarker, setIsCreatingCustomMarker] = useState(false);
  const [customMarkerLabel, setCustomMarkerLabel] = useState('');
  const [customMarkerColor, setCustomMarkerColor] = useState('#ef4444');

  // 7. Modal: Detalhes do Cartão Ativo
  const [activeCard, setActiveCard] = useState<MuralCard | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  
  // Controle de edição sob demanda nos cartões criados
  const [isEditingCardMarkers, setIsEditingCardMarkers] = useState(false);
  const [isEditingCardShared, setIsEditingCardShared] = useState(false);
  const [activeCardMarkerCreating, setActiveCardMarkerCreating] = useState(false);

  // 8. Lightbox para visualização de imagem
  const [lightboxImg, setLightboxImg] = useState<{ url: string; title: string } | null>(null);

  // Refs de arquivo
  const newCardFileInputRef = useRef<HTMLInputElement | null>(null);
  const activeCardFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchMuralCards().then((fetched) => {
      if (fetched && fetched.length > 0) {
        setCards(fetched);
      }
    });
    const unsub = subscribeToMuralCards((updatedCards) => {
      setCards(updatedCards);
    });
    return unsub;
  }, []);

  // Sincronização LocalStorage e Supabase
  const saveColumns = (newCols: MuralColumn[]) => {
    setColumns(newCols);
    localStorage.setItem(STORAGE_KEY_COLUMNS, JSON.stringify(newCols));
  };

  const saveCards = (newCards: MuralCard[]) => {
    setCards(newCards);
    saveAllMuralCards(newCards);
  };

  const saveCustomMarkers = (markers: MuralMarker[]) => {
    setAvailableMarkers(markers);
    localStorage.setItem(STORAGE_KEY_CUSTOM_MARKERS, JSON.stringify(markers));
  };

  // Helper para criar novo marcador
  const handleCreateNewMarker = (target: 'newCard' | 'activeCard') => {
    if (!customMarkerLabel.trim()) return;
    const newMarker: MuralMarker = {
      id: `m-${Date.now()}`,
      label: customMarkerLabel.trim(),
      color: customMarkerColor,
    };

    const updated = [...availableMarkers, newMarker];
    saveCustomMarkers(updated);

    if (target === 'newCard') {
      if (!newCardMarkers.some((m) => m.label.toLowerCase() === newMarker.label.toLowerCase())) {
        setNewCardMarkers([...newCardMarkers, newMarker]);
      }
      setIsCreatingCustomMarker(false);
    } else if (target === 'activeCard' && activeCard) {
      if (!activeCard.markers.some((m) => m.label.toLowerCase() === newMarker.label.toLowerCase())) {
        const nextMarkers = [...activeCard.markers, newMarker];
        const nextCard = { ...activeCard, markers: nextMarkers };
        setActiveCard(nextCard);
        saveCards(cards.map((c) => (c.id === nextCard.id ? nextCard : c)));
      }
      setActiveCardMarkerCreating(false);
    }

    setCustomMarkerLabel('');
    setCustomMarkerColor('#ef4444');
  };

  // Upload de Arquivo
  const handleFileUpload = (
    file: File,
    onSuccess: (attachment: NonNullable<MuralCard['attachment']>) => void
  ) => {
    if (file.size > 15 * 1024 * 1024) {
      alert('O arquivo selecionado deve ter menos de 15MB.');
      return;
    }
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isImage && !isPdf) {
      alert('Formato não suportado. Por favor, anexe uma imagem (PNG, JPG, WEBP) ou PDF.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      const attachment: NonNullable<MuralCard['attachment']> = {
        name: file.name,
        url,
        type: isImage ? 'image' : 'pdf',
        size: file.size,
      };
      onSuccess(attachment);
    };
    reader.readAsDataURL(file);
  };

  // Cartões Filtrados
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      // Filtro de membro
      if (filterMember === 'mine' && card.author !== currentUserName && card.assignee !== currentUserName) {
        return false;
      }
      if (filterMember === 'shared') {
        const isShared = card.sharedWith.includes(currentUserName);
        const isAssigned = card.assignee === currentUserName;
        if (!isShared && !isAssigned) return false;
      }

      // Filtro de busca
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = card.title.toLowerCase().includes(q);
        const matchDesc = card.description.toLowerCase().includes(q);
        const matchAuthor = card.author.toLowerCase().includes(q);
        const matchAssignee = card.assignee?.toLowerCase().includes(q);
        const matchMarkers = card.markers.some((m) => m.label.toLowerCase().includes(q));
        return matchTitle || matchDesc || matchAuthor || matchAssignee || matchMarkers;
      }
      return true;
    });
  }, [cards, filterMember, currentUserName, searchTerm]);

  // Criar Coluna
  const handleCreateColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;

    const newCol: MuralColumn = {
      id: `col-${Date.now()}`,
      title: newColTitle.trim(),
      color: '#64748b',
    };

    saveColumns([...columns, newCol]);
    setNewColTitle('');
    setIsNewColOpen(false);
  };

  // Excluir Coluna
  const handleDeleteColumn = (colId: string) => {
    if (confirm('Deseja excluir esta coluna e seus cartões?')) {
      const remCols = columns.filter((c) => c.id !== colId);
      const remCards = cards.filter((c) => c.columnId !== colId);
      saveColumns(remCols);
      saveCards(remCards);
    }
  };

  // Criar Cartão
  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;

    const newCard: MuralCard = {
      id: `card-${Date.now()}`,
      columnId: targetColumnId,
      title: newCardTitle.trim(),
      description: newCardDesc.trim(),
      author: currentUserName,
      assignee: newCardAssignee.trim() || undefined,
      createdAt: new Date().toISOString(),
      sharedWith: newCardShared,
      markers: newCardMarkers,
      attachment: newCardAttachment,
      comments: [],
    };

    saveCards([...cards, newCard]);
    playNotificationSound();

    // Reset formulário
    setNewCardTitle('');
    setNewCardDesc('');
    setNewCardAssignee('');
    setNewCardShared([]);
    setNewCardMarkers([]);
    setNewCardAttachment(null);
    setShowMarkerPicker(false);
    setShowAssigneePicker(false);
    setShowSharePicker(false);
    setIsNewCardOpen(false);
  };

  // Mover Cartão para Próxima/Anterior Coluna
  const handleMoveCard = (cardId: string, direction: 'prev' | 'next', e: React.MouseEvent) => {
    e.stopPropagation();
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    const currentIdx = columns.findIndex((c) => c.id === card.columnId);
    if (currentIdx === -1) return;

    const newIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
    if (newIdx < 0 || newIdx >= columns.length) return;

    const updated = cards.map((c) =>
      c.id === cardId ? { ...c, columnId: columns[newIdx].id } : c
    );
    saveCards(updated);
  };

  // Adicionar Comentário no Cartão Ativo (com segundos)
  const handleAddCommentToCard = (cardId: string) => {
    if (!newCommentText.trim()) return;

    const comment: MuralComment = {
      id: `comment-${Date.now()}`,
      author: currentUserName,
      content: newCommentText.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedCards = cards.map((c) => {
      if (c.id === cardId) {
        return {
          ...c,
          comments: [...c.comments, comment],
        };
      }
      return c;
    });

    saveCards(updatedCards);
    if (activeCard && activeCard.id === cardId) {
      setActiveCard({
        ...activeCard,
        comments: [...activeCard.comments, comment],
      });
    }
    setNewCommentText('');
    playNotificationSound();
  };

  // Excluir Cartão
  const handleDeleteCard = (cardId: string) => {
    if (confirm('Deseja excluir este cartão permanentemente?')) {
      const rem = cards.filter((c) => c.id !== cardId);
      saveCards(rem);
      if (activeCard?.id === cardId) {
        setActiveCard(null);
      }
    }
  };

  // Helpers de formatação
  const formatDateTimeWithSeconds = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      {/* ── 1. Heading Oficial com Eyebrow, H1, Subtítulo e Capture ── */}
      <section className="heading">
        <div>
          <span className="eyebrow">EQUIPE &amp; PROJETOS</span>
          <h1 id="pageTitle">Quadro Kanban</h1>
          <p id="pageSubtitle">
            Acompanhamento ágil de tarefas, implantações e rotinas de suporte da equipe.
          </p>
        </div>
        <div className="capture">
          <span className="live-dot" /> Quadro Kanban
          <span id="captured">{cards.length} cartões no quadro</span>
        </div>
      </section>

      {/* ── 2. Barra de Filtros Globais ── */}
      <section className="filters" aria-label="Filtros globais">
        <div className="filter">
          <label htmlFor="kanban-filter-member">FILTRO DE MEMBRO</label>
          <select
            id="kanban-filter-member"
            value={filterMember}
            onChange={(e) => setFilterMember(e.target.value as any)}
          >
            <option value="all">Todos os Cartões</option>
            <option value="mine">Meus Cartões / Atribuídos a Mim</option>
            <option value="shared">Compartilhados Comigo</option>
          </select>
        </div>

        <div className="filter store-filter" style={{ flex: 1 }}>
          <label htmlFor="kanban-search">BUSCA NO KANBAN</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              id="kanban-search"
              type="text"
              placeholder="Buscar por título, descrição, responsável ou marcador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  border: 'none',
                  background: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  fontSize: '11px',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="status">
          <span className="live-dot" /> {filteredCards.length} Atividades
        </div>
      </section>

      {/* ── 3. Barra de Ações do Kanban ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              fontWeight: 600,
            }}
          >
            Colunas ativas: <strong style={{ color: 'var(--text-primary)' }}>{columns.length}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* + Nova Coluna */}
          <button
            type="button"
            onClick={() => setIsNewColOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Plus size={15} color="var(--red)" />
            <span>Nova Coluna</span>
          </button>

          {/* + Novo Cartão */}
          <button
            type="button"
            onClick={() => {
              setTargetColumnId(columns[0]?.id || 'col-todo');
              setIsNewCardOpen(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'var(--red)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            <Plus size={16} />
            <span>Novo Cartão</span>
          </button>
        </div>
      </div>

      {/* ── 4. Kanban Board Colunas (Cinza Suave e Harmonioso) ── */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          overflowX: 'auto',
          paddingBottom: '24px',
          alignItems: 'flex-start',
        }}
      >
        {columns.map((col, colIdx) => {
          const colCards = filteredCards.filter((c) => c.columnId === col.id);

          // Cor de destaque da coluna
          const colAccentColor =
            col.id === 'col-todo'
              ? '#64748b'
              : col.id === 'col-doing'
              ? '#3b82f6'
              : col.id === 'col-done'
              ? '#10b981'
              : col.color || '#8b5cf6';

          return (
            <div
              key={col.id}
              style={{
                flex: '0 0 330px',
                minWidth: '290px',
                background: 'var(--bg-secondary)',
                borderRadius: '14px',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: 'calc(100vh - 170px)',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              }}
            >
              {/* Topo da Coluna Limpo, Claro e com Alto Contraste */}
              <div
                style={{
                  background: 'var(--bg-primary)',
                  borderBottom: '1px solid var(--border)',
                  borderTop: `3px solid ${colAccentColor}`,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: colAccentColor,
                      display: 'inline-block',
                      boxShadow: `0 0 6px ${colAccentColor}66`,
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.94rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {col.title}
                  </span>
                  <span
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      padding: '1px 8px',
                      borderRadius: '12px',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {colCards.length}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetColumnId(col.id);
                      setIsNewCardOpen(true);
                    }}
                    title="Adicionar cartão nesta coluna"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: '5px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'color 0.15s, background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--text-primary)';
                      e.currentTarget.style.background = 'var(--bg-secondary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <Plus size={15} />
                  </button>

                  {columns.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteColumn(col.id)}
                      title="Excluir coluna"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '5px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--red)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Lista de Cartões da Coluna */}
              <div
                style={{
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  overflowY: 'auto',
                  flex: 1,
                  background: 'var(--bg-secondary)',
                }}
              >
                {colCards.map((card) => {
                  const primaryMarkerColor = card.markers[0]?.color || colAccentColor;

                  return (
                    <div
                      key={card.id}
                      onClick={() => {
                        setActiveCard(card);
                        setIsEditingCardMarkers(false);
                        setIsEditingCardShared(false);
                      }}
                      role="button"
                      tabIndex={0}
                      style={{
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                        borderLeft: `4px solid ${primaryMarkerColor}`,
                        borderRadius: '10px',
                        padding: '12px 14px 10px 14px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 14px rgba(0, 0, 0, 0.08)';
                        e.currentTarget.style.borderColor = 'var(--line)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.04)';
                        e.currentTarget.style.borderColor = 'var(--border)';
                      }}
                    >
                      {/* Marcadores Coloridos do Cartão */}
                      {card.markers.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                          {card.markers.map((m) => (
                            <span
                              key={m.id}
                              style={{
                                background: `${m.color}1a`,
                                color: m.color,
                                border: `1px solid ${m.color}55`,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontSize: '0.68rem',
                                fontWeight: 800,
                              }}
                            >
                              {m.label}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Título do Cartão */}
                      <h4
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          margin: '0 0 5px 0',
                          lineHeight: 1.35,
                        }}
                      >
                        {card.title}
                      </h4>

                      {/* Snippet da Descrição */}
                      {card.description && (
                        <p
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-secondary)',
                            margin: '0 0 8px 0',
                            lineHeight: 1.45,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {card.description}
                        </p>
                      )}

                      {/* Anexo Indicador */}
                      {card.attachment && (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            padding: '2px 7px',
                            borderRadius: '5px',
                            fontSize: '0.70rem',
                            color: 'var(--primary-500, #38bdf8)',
                            marginBottom: '8px',
                            fontWeight: 600,
                          }}
                        >
                          <Paperclip size={11} />
                          <span
                            style={{
                              maxWidth: '180px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {card.attachment.name}
                          </span>
                        </div>
                      )}

                      {/* Rodapé do Cartão */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '8px',
                          borderTop: '1px solid var(--border-subtle, var(--border))',
                          marginTop: '4px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {/* Responsável ou Autor */}
                          {card.assignee ? (
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border)',
                                padding: '2px 7px',
                                borderRadius: '12px',
                                fontSize: '0.70rem',
                                color: 'var(--text-primary)',
                                fontWeight: 700,
                              }}
                              title={`Atribuído para: ${card.assignee}`}
                            >
                              <User size={10} color="var(--primary-500, #38bdf8)" />
                              <span>{card.assignee}</span>
                            </div>
                          ) : (
                            <div
                              style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: 'var(--red-soft)',
                                color: 'var(--red)',
                                fontSize: '0.66rem',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                              }}
                              title={`Criado por ${card.author}`}
                            >
                              {card.author.charAt(0).toUpperCase()}
                            </div>
                          )}

                          {/* Membros Compartilhados */}
                          {card.sharedWith.length > 0 && (
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '0.68rem',
                                color: 'var(--text-muted)',
                                background: 'var(--bg-secondary)',
                                padding: '1px 5px',
                                borderRadius: '4px',
                              }}
                              title={`Compartilhado com: ${card.sharedWith.join(', ')}`}
                            >
                              <Users size={11} />
                              <span>+{card.sharedWith.length}</span>
                            </div>
                          )}

                          {/* Contador de Comentários */}
                          {card.comments.length > 0 && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '0.70rem',
                                color: 'var(--text-muted)',
                              }}
                            >
                              <MessageSquare size={12} />
                              <span>{card.comments.length}</span>
                            </div>
                          )}
                        </div>

                        {/* Botões de Mover Coluna */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          {colIdx > 0 && (
                            <button
                              type="button"
                              onClick={(e) => handleMoveCard(card.id, 'prev', e)}
                              title="Mover para coluna anterior"
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '2px 4px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                            >
                              <ArrowLeft size={13} />
                            </button>
                          )}
                          {colIdx < columns.length - 1 && (
                            <button
                              type="button"
                              onClick={(e) => handleMoveCard(card.id, 'next', e)}
                              title="Mover para próxima coluna"
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '2px 4px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                            >
                              <ArrowRight size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {colCards.length === 0 && (
                  <div
                    style={{
                      padding: '26px 12px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '0.78rem',
                      border: '1px dashed var(--border)',
                      borderRadius: '8px',
                      background: 'transparent',
                    }}
                  >
                    Nenhum cartão nesta coluna
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 5. MODAL: Nova Coluna ── */}
      {isNewColOpen && (
        <div className="modal-backdrop">
          <div
            className="modal-box"
            style={{
              maxWidth: '380px',
              padding: '22px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
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
              <h3 style={{ fontSize: '1.02rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Nova Coluna no Kanban
              </h3>
              <button
                type="button"
                onClick={() => setIsNewColOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateColumn}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Título da Coluna:
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ex: Em Homologação, Bloqueado..."
                  value={newColTitle}
                  onChange={(e) => setNewColTitle(e.target.value)}
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
                  onClick={() => setIsNewColOpen(false)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
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
                  Criar Coluna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 6. MODAL: Novo Cartão (Interface Limpa com Botões de Ícones) ── */}
      {isNewCardOpen && (
        <div className="modal-backdrop">
          <div
            className="modal-box"
            style={{
              maxWidth: '560px',
              padding: '24px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
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
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--red)',
                  }}
                >
                  <Plus size={16} />
                </div>
                <h3 style={{ fontSize: '1.08rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Novo Cartão Kanban
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewCardOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCard}>
              {/* Coluna Inicial */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  COLUNA DO QUADRO:
                </label>
                <select
                  value={targetColumnId}
                  onChange={(e) => setTargetColumnId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                  }}
                >
                  {columns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Título da Atividade */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  TÍTULO DO CARTÃO *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ex: Parametrizar leitor de código de barras na Farmácia Central"
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.90rem',
                    fontWeight: 600,
                  }}
                />
              </div>

              {/* Descrição */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  DESCRIÇÃO DA TAREFA:
                </label>
                <textarea
                  rows={3}
                  placeholder="Descreva detalhes, orientações ou procedimentos necessários..."
                  value={newCardDesc}
                  onChange={(e) => setNewCardDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.86rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* BARRA DE BOTÕES DE ÍCONES (Marcador, Atribuir, Compartilhar, Anexo) */}
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    ADICIONAR AO CARTÃO:
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Clique nos ícones para personalizar
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Ícone Marcador */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMarkerPicker(!showMarkerPicker);
                      setShowAssigneePicker(false);
                      setShowSharePicker(false);
                    }}
                    title="Adicionar Marcador"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: showMarkerPicker ? '1px solid #ef4444' : '1px solid var(--border)',
                      background: showMarkerPicker ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-primary)',
                      color: showMarkerPicker ? '#ef4444' : 'var(--text-primary)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Tag size={14} />
                    <span>Marcadores</span>
                  </button>

                  {/* Ícone Atribuir Responsável ("deixar um cartão para ele") */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssigneePicker(!showAssigneePicker);
                      setShowMarkerPicker(false);
                      setShowSharePicker(false);
                    }}
                    title="Atribuir Responsável"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: showAssigneePicker ? '1px solid #38bdf8' : '1px solid var(--border)',
                      background: showAssigneePicker ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-primary)',
                      color: showAssigneePicker ? '#38bdf8' : 'var(--text-primary)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <User size={14} />
                    <span>Responsável</span>
                  </button>

                  {/* Ícone Compartilhar com Equipe */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowSharePicker(!showSharePicker);
                      setShowMarkerPicker(false);
                      setShowAssigneePicker(false);
                    }}
                    title="Compartilhar com membros da equipe"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: showSharePicker ? '1px solid #10b981' : '1px solid var(--border)',
                      background: showSharePicker ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-primary)',
                      color: showSharePicker ? '#10b981' : 'var(--text-primary)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Users size={14} />
                    <span>Compartilhar</span>
                  </button>

                  {/* Ícone Anexo */}
                  <input
                    ref={newCardFileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file, (attachment) => {
                          setNewCardAttachment(attachment);
                        });
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => newCardFileInputRef.current?.click()}
                    title="Anexar arquivo (Imagem ou PDF)"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: newCardAttachment ? '1px solid #a855f7' : '1px solid var(--border)',
                      background: newCardAttachment ? 'rgba(168, 85, 247, 0.15)' : 'var(--bg-primary)',
                      color: newCardAttachment ? '#a855f7' : 'var(--text-primary)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Paperclip size={14} />
                    <span>Anexo</span>
                  </button>
                </div>

                {/* POPOVER: Marcadores */}
                {showMarkerPicker && (
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '12px',
                      background: 'var(--bg-primary)',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        SELECIONE OS MARCADORES:
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsCreatingCustomMarker(!isCreatingCustomMarker)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--primary-500, #38bdf8)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Plus size={12} />
                        <span>Novo Marcador</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: isCreatingCustomMarker ? '10px' : 0 }}>
                      {availableMarkers.map((m) => {
                        const isSelected = newCardMarkers.some((x) => x.label === m.label);
                        return (
                          <button
                            type="button"
                            key={m.id}
                            onClick={() => {
                              if (isSelected) {
                                setNewCardMarkers(newCardMarkers.filter((x) => x.label !== m.label));
                              } else {
                                setNewCardMarkers([...newCardMarkers, m]);
                              }
                            }}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              border: `1.5px solid ${m.color}`,
                              background: isSelected ? m.color : 'transparent',
                              color: isSelected ? '#ffffff' : m.color,
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {isSelected ? '✓ ' : '+ '}
                            {m.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Criar Marcador com Cor Customizada */}
                    {isCreatingCustomMarker && (
                      <div
                        style={{
                          marginTop: '8px',
                          padding: '10px',
                          background: 'var(--bg-secondary)',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                          <input
                            type="text"
                            placeholder="Nome do novo marcador..."
                            value={customMarkerLabel}
                            onChange={(e) => setCustomMarkerLabel(e.target.value)}
                            style={{
                              flex: 1,
                              padding: '5px 8px',
                              borderRadius: '4px',
                              border: '1px solid var(--border)',
                              background: 'var(--bg-primary)',
                              color: 'var(--text-primary)',
                              fontSize: '0.78rem',
                            }}
                          />
                          <input
                            type="color"
                            value={customMarkerColor}
                            onChange={(e) => setCustomMarkerColor(e.target.value)}
                            style={{
                              width: '32px',
                              height: '28px',
                              padding: '1px',
                              borderRadius: '4px',
                              border: '1px solid var(--border)',
                              cursor: 'pointer',
                              background: 'transparent',
                            }}
                            title="Escolher cor personalizada"
                          />
                          <button
                            type="button"
                            onClick={() => handleCreateNewMarker('newCard')}
                            style={{
                              padding: '5px 10px',
                              background: 'var(--red)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Criar
                          </button>
                        </div>
                        {/* Paleta rápida de cores */}
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>Paleta:</span>
                          {PRESET_COLORS.map((hex) => (
                            <span
                              key={hex}
                              onClick={() => setCustomMarkerColor(hex)}
                              style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                background: hex,
                                cursor: 'pointer',
                                border: customMarkerColor === hex ? '2px solid #ffffff' : '1px solid transparent',
                                display: 'inline-block',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* POPOVER: Atribuir Responsável ("deixar um cartão para ele") */}
                {showAssigneePicker && (
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '12px',
                      background: 'var(--bg-primary)',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      ESCOLHA O RESPONSÁVEL (DEIXAR CARTÃO PARA):
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setNewCardAssignee('')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: !newCardAssignee ? '1px solid #38bdf8' : '1px solid var(--border)',
                          background: !newCardAssignee ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-secondary)',
                          color: !newCardAssignee ? '#38bdf8' : 'var(--text-muted)',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Nenhum
                      </button>
                      {teamMembers.map((member) => {
                        const isAssigned = newCardAssignee === member.username || newCardAssignee === member.name;
                        return (
                          <button
                            type="button"
                            key={member.username}
                            onClick={() => setNewCardAssignee(member.name || member.username)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: isAssigned ? '1px solid #38bdf8' : '1px solid var(--border)',
                              background: isAssigned ? 'rgba(56, 189, 248, 0.2)' : 'var(--bg-secondary)',
                              color: isAssigned ? 'var(--text-primary)' : 'var(--text-secondary)',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            <span
                              style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                background: '#38bdf8',
                                color: '#0d131f',
                                fontSize: '0.62rem',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {(member.name || member.username).charAt(0).toUpperCase()}
                            </span>
                            <span>{member.name || member.username}</span>
                            {isAssigned && <Check size={12} color="#38bdf8" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* POPOVER: Compartilhar com Equipe */}
                {showSharePicker && (
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '12px',
                      background: 'var(--bg-primary)',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      COMPARTILHAR PARA VISUALIZAÇÃO COM:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {teamMembers.map((member) => {
                        const memberKey = member.name || member.username;
                        const isShared = newCardShared.includes(memberKey);
                        return (
                          <button
                            type="button"
                            key={member.username}
                            onClick={() => {
                              if (isShared) {
                                setNewCardShared(newCardShared.filter((m) => m !== memberKey));
                              } else {
                                setNewCardShared([...newCardShared, memberKey]);
                              }
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: isShared ? '1px solid #10b981' : '1px solid var(--border)',
                              background: isShared ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-secondary)',
                              color: isShared ? 'var(--text-primary)' : 'var(--text-secondary)',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            <span>{isShared ? '✓ ' : '+ '}</span>
                            <span>{memberKey}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* CHIPS DE ITENS SELECIONADOS */}
                {(newCardAssignee || newCardShared.length > 0 || newCardMarkers.length > 0 || newCardAttachment) && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      marginTop: '10px',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--border-subtle, var(--border))',
                    }}
                  >
                    {/* Chip de Responsável */}
                    {newCardAssignee && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid #38bdf8',
                          color: '#38bdf8',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                        }}
                      >
                        <User size={10} />
                        <span>Para: {newCardAssignee}</span>
                        <button
                          type="button"
                          onClick={() => setNewCardAssignee('')}
                          style={{ border: 'none', background: 'transparent', color: '#38bdf8', cursor: 'pointer', padding: 0 }}
                        >
                          ✕
                        </button>
                      </span>
                    )}

                    {/* Chips de Compartilhados */}
                    {newCardShared.map((sh) => (
                      <span
                        key={sh}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid #10b981',
                          color: '#10b981',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                        }}
                      >
                        <Users size={10} />
                        <span>{sh}</span>
                        <button
                          type="button"
                          onClick={() => setNewCardShared(newCardShared.filter((m) => m !== sh))}
                          style={{ border: 'none', background: 'transparent', color: '#10b981', cursor: 'pointer', padding: 0 }}
                        >
                          ✕
                        </button>
                      </span>
                    ))}

                    {/* Chips de Marcadores */}
                    {newCardMarkers.map((m) => (
                      <span
                        key={m.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: `${m.color}22`,
                          border: `1px solid ${m.color}`,
                          color: m.color,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                        }}
                      >
                        <span>{m.label}</span>
                        <button
                          type="button"
                          onClick={() => setNewCardMarkers(newCardMarkers.filter((x) => x.label !== m.label))}
                          style={{ border: 'none', background: 'transparent', color: m.color, cursor: 'pointer', padding: 0 }}
                        >
                          ✕
                        </button>
                      </span>
                    ))}

                    {/* Chip de Anexo */}
                    {newCardAttachment && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'rgba(168, 85, 247, 0.15)',
                          border: '1px solid #a855f7',
                          color: '#a855f7',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                        }}
                      >
                        <Paperclip size={10} />
                        <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {newCardAttachment.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setNewCardAttachment(null)}
                          style={{ border: 'none', background: 'transparent', color: '#a855f7', cursor: 'pointer', padding: 0 }}
                        >
                          ✕
                        </button>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Botões do Rodapé */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsNewCardOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--red)',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.84rem',
                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
                  }}
                >
                  Criar Cartão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 7. MODAL: Detalhes do Cartão (Exibe apenas Marcadores Selecionados) ── */}
      {activeCard && (
        <div className="modal-backdrop">
          <div
            className="modal-box"
            style={{
              maxWidth: '660px',
              padding: '24px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
            }}
          >
            {/* Topo do Modal com Caixa de Destaque */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <h3
                    style={{
                      fontSize: '1.20rem',
                      fontWeight: 800,
                      margin: '0 0 6px 0',
                      color: 'var(--text-primary)',
                      lineHeight: 1.3,
                    }}
                  >
                    {activeCard.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <User size={12} color="var(--primary-500, #38bdf8)" />
                      Criado por <strong style={{ color: 'var(--text-primary)' }}>{activeCard.author}</strong>
                    </span>
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      {formatDateTimeWithSeconds(activeCard.createdAt)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveCard(null)}
                  style={{
                    border: 'none',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Mudar Coluna */}
              <div
                style={{
                  marginTop: '12px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-subtle, var(--border))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  COLUNA ATUAL:
                </span>
                <select
                  value={activeCard.columnId}
                  onChange={(e) => {
                    const newCol = e.target.value;
                    const nextCard = { ...activeCard, columnId: newCol };
                    setActiveCard(nextCard);
                    saveCards(cards.map((c) => (c.id === nextCard.id ? nextCard : c)));
                  }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-primary)',
                    fontSize: '0.80rem',
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                  }}
                >
                  {columns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SEÇÃO 1: Responsável ("deixar um cartão para ele") e Compartilhamento */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={15} color="#38bdf8" />
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
                    RESPONSÁVEL PELA TAREFA:
                  </span>
                </div>
              </div>

              {/* Responsável selecionado */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const nextCard = { ...activeCard, assignee: undefined };
                    setActiveCard(nextCard);
                    saveCards(cards.map((c) => (c.id === nextCard.id ? nextCard : c)));
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: !activeCard.assignee ? '1.5px solid #38bdf8' : '1px solid var(--border)',
                    background: !activeCard.assignee ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-primary)',
                    color: !activeCard.assignee ? '#38bdf8' : 'var(--text-muted)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Nenhum Responsável
                </button>

                {teamMembers.map((member) => {
                  const memberName = member.name || member.username;
                  const isAssigned = activeCard.assignee === memberName;
                  return (
                    <button
                      type="button"
                      key={member.username}
                      onClick={() => {
                        const nextCard = { ...activeCard, assignee: memberName };
                        setActiveCard(nextCard);
                        saveCards(cards.map((c) => (c.id === nextCard.id ? nextCard : c)));
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: isAssigned ? '1.5px solid #38bdf8' : '1px solid var(--border)',
                        background: isAssigned ? 'rgba(56, 189, 248, 0.2)' : 'var(--bg-primary)',
                        color: isAssigned ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <span
                        style={{
                          width: '15px',
                          height: '15px',
                          borderRadius: '50%',
                          background: '#38bdf8',
                          color: '#0d131f',
                          fontSize: '0.60rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {memberName.charAt(0).toUpperCase()}
                      </span>
                      <span>{memberName}</span>
                      {isAssigned && <Check size={12} color="#38bdf8" />}
                    </button>
                  );
                })}
              </div>

              {/* Compartilhado com - Exibe limpo e permite editar sob demanda */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={14} color="#10b981" />
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    COMPARTILHADO COM ({activeCard.sharedWith.length}):
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingCardShared(!isEditingCardShared)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  {isEditingCardShared ? 'Concluir' : 'Editar Compartilhamento'}
                </button>
              </div>

              {/* Modo Visualização (Apenas os compartilhados) */}
              {!isEditingCardShared && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {activeCard.sharedWith.length > 0 ? (
                    activeCard.sharedWith.map((member) => (
                      <span
                        key={member}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 9px',
                          borderRadius: '6px',
                          border: '1px solid #10b981',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#10b981',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                        }}
                      >
                        <Users size={11} />
                        <span>{member}</span>
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Nenhum membro adicional compartilhado.
                    </span>
                  )}
                </div>
              )}

              {/* Modo Edição de Compartilhamento */}
              {isEditingCardShared && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {teamMembers.map((member) => {
                    const memberName = member.name || member.username;
                    const isShared = activeCard.sharedWith.includes(memberName);
                    return (
                      <button
                        type="button"
                        key={member.username}
                        onClick={() => {
                          const newShared = isShared
                            ? activeCard.sharedWith.filter((m) => m !== memberName)
                            : [...activeCard.sharedWith, memberName];
                          const nextCard = { ...activeCard, sharedWith: newShared };
                          setActiveCard(nextCard);
                          saveCards(cards.map((c) => (c.id === nextCard.id ? nextCard : c)));
                        }}
                        style={{
                          padding: '4px 9px',
                          borderRadius: '6px',
                          border: isShared ? '1px solid #10b981' : '1px solid var(--border)',
                          background: isShared ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-primary)',
                          color: isShared ? 'var(--text-primary)' : 'var(--text-muted)',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {isShared ? '✓ ' : '+ '}
                        {memberName}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SEÇÃO 2: Marcadores Destaque (EXIBE SOMENTE OS SELECIONADOS NO CARTÃO) */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Tag size={15} color="#f59e0b" />
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
                    MARCADORES DO CARTÃO ({activeCard.markers.length}):
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isEditingCardMarkers ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingCardMarkers(false);
                        setActiveCardMarkerCreating(false);
                      }}
                      style={{
                        padding: '3px 10px',
                        background: 'var(--red)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '5px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Concluir
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingCardMarkers(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                      }}
                    >
                      <Edit2 size={12} color="var(--red)" />
                      <span>Editar Marcadores</span>
                    </button>
                  )}
                </div>
              </div>

              {/* MODO PADRÃO: Exibe SOMENTE os marcadores selecionados para este cartão! */}
              {!isEditingCardMarkers && (
                <div>
                  {activeCard.markers.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {activeCard.markers.map((m) => (
                        <span
                          key={m.id}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: `1.5px solid ${m.color}`,
                            background: `${m.color}22`,
                            color: m.color,
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {m.label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Nenhum marcador selecionado para este cartão.{' '}
                      <button
                        type="button"
                        onClick={() => setIsEditingCardMarkers(true)}
                        style={{
                          border: 'none',
                          background: 'none',
                          color: 'var(--primary-500, #38bdf8)',
                          cursor: 'pointer',
                          padding: 0,
                          textDecoration: 'underline',
                          fontWeight: 600,
                        }}
                      >
                        Clique aqui para adicionar
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* MODO EDIÇÃO: Exibe a lista completa de opções para marcar/desmarcar */}
              {isEditingCardMarkers && (
                <div>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Selecione ou desmarque marcadores clicando abaixo:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                    {availableMarkers.map((preset) => {
                      const isActive = activeCard.markers.some((m) => m.label === preset.label);
                      return (
                        <button
                          type="button"
                          key={preset.id}
                          onClick={() => {
                            const newMarkers = isActive
                              ? activeCard.markers.filter((m) => m.label !== preset.label)
                              : [...activeCard.markers, preset];
                            const nextCard = { ...activeCard, markers: newMarkers };
                            setActiveCard(nextCard);
                            saveCards(cards.map((c) => (c.id === nextCard.id ? nextCard : c)));
                          }}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: `1.5px solid ${preset.color}`,
                            background: isActive ? preset.color : 'transparent',
                            color: isActive ? '#ffffff' : preset.color,
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {isActive ? '✓ ' : '+ '}
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Criador de Marcador dentro do Detalhe */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        Criar novo marcador personalizado:
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveCardMarkerCreating(!activeCardMarkerCreating)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--primary-500, #38bdf8)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {activeCardMarkerCreating ? 'Fechar' : '+ Novo'}
                      </button>
                    </div>

                    {activeCardMarkerCreating && (
                      <div
                        style={{
                          padding: '10px',
                          background: 'var(--bg-primary)',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                          <input
                            type="text"
                            placeholder="Nome do novo marcador..."
                            value={customMarkerLabel}
                            onChange={(e) => setCustomMarkerLabel(e.target.value)}
                            style={{
                              flex: 1,
                              padding: '5px 8px',
                              borderRadius: '4px',
                              border: '1px solid var(--border)',
                              background: 'var(--bg-secondary)',
                              color: 'var(--text-primary)',
                              fontSize: '0.78rem',
                            }}
                          />
                          <input
                            type="color"
                            value={customMarkerColor}
                            onChange={(e) => setCustomMarkerColor(e.target.value)}
                            style={{
                              width: '32px',
                              height: '28px',
                              padding: '1px',
                              borderRadius: '4px',
                              border: '1px solid var(--border)',
                              cursor: 'pointer',
                              background: 'transparent',
                            }}
                            title="Escolher cor personalizada"
                          />
                          <button
                            type="button"
                            onClick={() => handleCreateNewMarker('activeCard')}
                            style={{
                              padding: '5px 12px',
                              background: 'var(--red)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Criar
                          </button>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>Paleta:</span>
                          {PRESET_COLORS.map((hex) => (
                            <span
                              key={hex}
                              onClick={() => setCustomMarkerColor(hex)}
                              style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                background: hex,
                                cursor: 'pointer',
                                border: customMarkerColor === hex ? '2px solid #ffffff' : '1px solid transparent',
                                display: 'inline-block',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* SEÇÃO 3: Descrição da Tarefa */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '14px',
              }}
            >
              <span style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                DESCRIÇÃO DA TAREFA:
              </span>
              {activeCard.description ? (
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.86rem',
                    color: 'var(--text-primary)',
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {activeCard.description}
                </p>
              ) : (
                <span style={{ fontSize: '0.80rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Nenhuma descrição informada.
                </span>
              )}
            </div>

            {/* SEÇÃO 4: Arquivo Anexo */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Paperclip size={15} color="#a855f7" />
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    ARQUIVO ANEXO:
                  </span>
                </div>

                <input
                  ref={activeCardFileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file, (attachment) => {
                        const nextCard = { ...activeCard, attachment };
                        setActiveCard(nextCard);
                        saveCards(cards.map((c) => (c.id === nextCard.id ? nextCard : c)));
                      });
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={() => activeCardFileInputRef.current?.click()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    border: 'none',
                    background: 'transparent',
                    color: '#a855f7',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={13} />
                  <span>{activeCard.attachment ? 'Substituir Anexo' : 'Anexar Arquivo'}</span>
                </button>
              </div>

              {activeCard.attachment ? (
                <div
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {activeCard.attachment.type === 'image' ? (
                      <div
                        onClick={() =>
                          setLightboxImg({
                            url: activeCard.attachment!.url,
                            title: activeCard.attachment!.name,
                          })
                        }
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: '1px solid var(--border)',
                          flexShrink: 0,
                        }}
                        title="Clique para ampliar"
                      >
                        <img
                          src={activeCard.attachment.url}
                          alt={activeCard.attachment.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '6px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#ef4444',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          flexShrink: 0,
                        }}
                      >
                        <FileText size={20} />
                      </div>
                    )}

                    <div>
                      <span style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {activeCard.attachment.name}
                      </span>
                      <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                        {formatFileSize(activeCard.attachment.size)} • {activeCard.attachment.type.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {activeCard.attachment.type === 'image' ? (
                      <button
                        type="button"
                        onClick={() =>
                          setLightboxImg({
                            url: activeCard.attachment!.url,
                            title: activeCard.attachment!.name,
                          })
                        }
                        title="Visualizar em tamanho real"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Maximize2 size={13} />
                        <span>Ver</span>
                      </button>
                    ) : (
                      <a
                        href={activeCard.attachment.url}
                        download={activeCard.attachment.name}
                        title="Baixar arquivo PDF"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        <Download size={13} />
                        <span>Baixar</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        const nextCard = { ...activeCard, attachment: null };
                        setActiveCard(nextCard);
                        saveCards(cards.map((c) => (c.id === nextCard.id ? nextCard : c)));
                      }}
                      title="Excluir anexo"
                      style={{
                        padding: '6px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--red)',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: '14px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.78rem',
                    border: '1px dashed var(--border)',
                    borderRadius: '8px',
                    background: 'var(--bg-primary)',
                  }}
                >
                  Nenhum arquivo anexado neste cartão.
                </div>
              )}
            </div>

            {/* SEÇÃO 5: Comentários Thread (Ordenados com Segundos) */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <MessageSquare size={16} color="var(--red)" />
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Comentários e Histórico ({activeCard.comments.length})
                </span>
              </div>

              {/* Lista de Comentários */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {activeCard.comments.map((comm) => (
                  <div
                    key={comm.id}
                    style={{
                      background: 'var(--bg-primary)',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle, var(--border))',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.80rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {comm.author}
                      </span>
                      <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                        {formatDateTimeWithSeconds(comm.createdAt)}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      {comm.content}
                    </p>
                  </div>
                ))}

                {activeCard.comments.length === 0 && (
                  <div
                    style={{
                      padding: '16px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '0.78rem',
                    }}
                  >
                    Ainda não há comentários neste cartão. Seja o primeiro a registrar o andamento!
                  </div>
                )}
              </div>

              {/* Input de Novo Comentário */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Escrever comentário no cartão..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCommentToCard(activeCard.id);
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-primary)',
                    fontSize: '0.84rem',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleAddCommentToCard(activeCard.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--red)',
                    color: '#fff',
                    fontSize: '0.80rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Send size={13} />
                  <span>Enviar</span>
                </button>
              </div>
            </div>

            {/* Ações Finais do Modal */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '8px',
              }}
            >
              <button
                type="button"
                onClick={() => handleDeleteCard(activeCard.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--red)',
                  fontSize: '0.80rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={14} />
                <span>Excluir Cartão</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCard(null)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 8. LIGHTBOX: Visualizador de Imagem Ampliada ── */}
      {lightboxImg && (
        <div
          className="modal-backdrop"
          onClick={() => setLightboxImg(null)}
          style={{ zIndex: 9999, background: 'rgba(0,0,0,0.85)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
                color: '#ffffff',
              }}
            >
              <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>{lightboxImg.title}</span>
              <button
                type="button"
                onClick={() => setLightboxImg(null)}
                style={{
                  border: 'none',
                  background: 'rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <img
              src={lightboxImg.url}
              alt={lightboxImg.title}
              style={{
                maxWidth: '100%',
                maxHeight: '82vh',
                borderRadius: '8px',
                objectFit: 'contain',
                boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};
