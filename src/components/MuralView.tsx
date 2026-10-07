import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Search,
  X,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  Send,
} from 'lucide-react';
import type { AppUser } from '../types/auth';
import { playNotificationSound } from '../lib/notificationSound';

export interface MuralMarker {
  id: string;
  label: string;
  color: string; // HEX
}

export interface MuralComment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface MuralCard {
  id: string;
  columnId: string;
  title: string;
  description: string;
  author: string;
  createdAt: string;
  sharedWith: string[]; // ['Leonardo', 'Icaro', ...]
  markers: MuralMarker[];
  comments: MuralComment[];
}

export interface MuralColumn {
  id: string;
  title: string;
  color?: string;
}

interface MuralViewProps {
  currentUser?: AppUser | null;
  onBackToDashboard?: () => void;
}

const STORAGE_KEY_COLUMNS = 'digifarma_mural_columns_v2';
const STORAGE_KEY_CARDS = 'digifarma_mural_cards_v2';
const TEAM_MEMBERS = ['Leonardo', 'Icaro', 'Wallace', 'Whitalo'];

const DEFAULT_COLUMNS: MuralColumn[] = [
  { id: 'col-todo', title: 'A Fazer', color: '#64748b' },
  { id: 'col-doing', title: 'Em Andamento', color: '#3b82f6' },
  { id: 'col-done', title: 'Concluído', color: '#10b981' },
];

const PRESET_MARKER_COLORS = [
  { label: 'Urgente', color: '#ef4444' },
  { label: 'Importante', color: '#f59e0b' },
  { label: 'Homologação', color: '#8b5cf6' },
  { label: 'V10', color: '#3b82f6' },
  { label: 'Clássico', color: '#06b6d4' },
  { label: 'Validado', color: '#10b981' },
];

const INITIAL_CARDS: MuralCard[] = [
  {
    id: 'card-1',
    columnId: 'col-todo',
    title: 'Parametrizar leitor serial de código de barras 2D',
    description: 'Configurar a leitura correta do DataMatrix do SNGPC nos caixas da Drogaria Central.',
    author: 'Leonardo',
    createdAt: new Date().toISOString(),
    sharedWith: ['Icaro', 'Wallace'],
    markers: [{ id: 'm-1', label: 'Urgente', color: '#ef4444' }],
    comments: [
      {
        id: 'c-1',
        author: 'Icaro',
        content: 'Já baixei os drivers da Honeywell para testar na máquina de testes.',
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'card-2',
    columnId: 'col-doing',
    title: 'Treinamento de Fechamento de Caixa Cego',
    description: 'Capacitar as novas operadoras no fluxo de sangria e relatório de conferência cega.',
    author: 'Wallace',
    createdAt: new Date().toISOString(),
    sharedWith: ['Leonardo'],
    markers: [{ id: 'm-2', label: 'V10', color: '#3b82f6' }],
    comments: [],
  },
  {
    id: 'card-3',
    columnId: 'col-done',
    title: 'Validação da Importação de XML de Medicamentos Controlados',
    description: 'Etapa homologada e validada de acordo com o padrão ANVISA.',
    author: 'Whitalo',
    createdAt: new Date().toISOString(),
    sharedWith: ['Leonardo', 'Whitalo'],
    markers: [{ id: 'm-3', label: 'Validado', color: '#10b981' }],
    comments: [],
  },
];

export const MuralView: React.FC<MuralViewProps> = ({
  currentUser,
}) => {
  const currentUserName = currentUser?.name || currentUser?.username || 'Leonardo';

  // Colunas e Cartões
  const [columns, setColumns] = useState<MuralColumn[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_COLUMNS);
    return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
  });

  const [cards, setCards] = useState<MuralCard[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CARDS);
    return saved ? JSON.parse(saved) : INITIAL_CARDS;
  });

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMember, setFilterMember] = useState<'all' | 'mine' | 'shared'>('all');

  // Modal: Nova Coluna
  const [isNewColOpen, setIsNewColOpen] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');

  // Modal: Novo Cartão
  const [isNewCardOpen, setIsNewCardOpen] = useState(false);
  const [targetColumnId, setTargetColumnId] = useState<string>('col-todo');
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDesc, setNewCardDesc] = useState('');
  const [newCardShared, setNewCardShared] = useState<string[]>([]);
  const [newCardMarkers, setNewCardMarkers] = useState<MuralMarker[]>([]);

  // Modal: Detalhes do Cartão Ativo
  const [activeCard, setActiveCard] = useState<MuralCard | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  // Sincronização LocalStorage
  const saveColumns = (newCols: MuralColumn[]) => {
    setColumns(newCols);
    localStorage.setItem(STORAGE_KEY_COLUMNS, JSON.stringify(newCols));
  };

  const saveCards = (newCards: MuralCard[]) => {
    setCards(newCards);
    localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(newCards));
  };

  // Cartões Filtrados
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      // Filtro de membro
      if (filterMember === 'mine' && card.author !== currentUserName) return false;
      if (filterMember === 'shared') {
        const isShared = card.sharedWith.includes(currentUserName);
        if (!isShared) return false;
      }

      // Filtro de busca
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = card.title.toLowerCase().includes(q);
        const matchDesc = card.description.toLowerCase().includes(q);
        const matchMarkers = card.markers.some((m) => m.label.toLowerCase().includes(q));
        return matchTitle || matchDesc || matchMarkers;
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
      createdAt: new Date().toISOString(),
      sharedWith: newCardShared,
      markers: newCardMarkers,
      comments: [],
    };

    saveCards([...cards, newCard]);
    playNotificationSound();

    setNewCardTitle('');
    setNewCardDesc('');
    setNewCardShared([]);
    setNewCardMarkers([]);
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

  // Adicionar Comentário no Cartão Ativo
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
    if (confirm('Deseja excluir este cartão?')) {
      const rem = cards.filter((c) => c.id !== cardId);
      saveCards(rem);
      if (activeCard?.id === cardId) {
        setActiveCard(null);
      }
    }
  };

  // Alternar Marcador no Cartão Ativo
  const handleToggleMarkerOnActive = (markerPreset: { label: string; color: string }) => {
    if (!activeCard) return;

    const exists = activeCard.markers.some((m) => m.label === markerPreset.label);
    let newMarkers: MuralMarker[];

    if (exists) {
      newMarkers = activeCard.markers.filter((m) => m.label !== markerPreset.label);
    } else {
      newMarkers = [
        ...activeCard.markers,
        { id: `m-${Date.now()}`, label: markerPreset.label, color: markerPreset.color },
      ];
    }

    const updated = cards.map((c) =>
      c.id === activeCard.id ? { ...c, markers: newMarkers } : c
    );
    saveCards(updated);
    setActiveCard({ ...activeCard, markers: newMarkers });
  };

  // Alternar Membro Compartilhado no Cartão Ativo
  const handleToggleSharedOnActive = (memberName: string) => {
    if (!activeCard) return;

    const exists = activeCard.sharedWith.includes(memberName);
    let newShared: string[];

    if (exists) {
      newShared = activeCard.sharedWith.filter((m) => m !== memberName);
    } else {
      newShared = [...activeCard.sharedWith, memberName];
    }

    const updated = cards.map((c) =>
      c.id === activeCard.id ? { ...c, sharedWith: newShared } : c
    );
    saveCards(updated);
    setActiveCard({ ...activeCard, sharedWith: newShared });
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px 20px 40px 20px' }}>
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
        {/* Filtros de Membro */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => setFilterMember('all')}
            style={{
              border: 'none',
              background: filterMember === 'all' ? 'var(--bg-primary)' : 'transparent',
              color: filterMember === 'all' ? 'var(--red)' : 'var(--text-secondary)',
              fontWeight: filterMember === 'all' ? 700 : 500,
              padding: '6px 12px',
              borderRadius: '7px',
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: filterMember === 'all' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            Todos os Cartões
          </button>

          <button
            type="button"
            onClick={() => setFilterMember('mine')}
            style={{
              border: 'none',
              background: filterMember === 'mine' ? 'var(--bg-primary)' : 'transparent',
              color: filterMember === 'mine' ? 'var(--red)' : 'var(--text-secondary)',
              fontWeight: filterMember === 'mine' ? 700 : 500,
              padding: '6px 12px',
              borderRadius: '7px',
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: filterMember === 'mine' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            Meus Cartões
          </button>

          <button
            type="button"
            onClick={() => setFilterMember('shared')}
            style={{
              border: 'none',
              background: filterMember === 'shared' ? 'var(--bg-primary)' : 'transparent',
              color: filterMember === 'shared' ? 'var(--red)' : 'var(--text-secondary)',
              fontWeight: filterMember === 'shared' ? 700 : 500,
              padding: '6px 12px',
              borderRadius: '7px',
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: filterMember === 'shared' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            Compartilhados Comigo
          </button>
        </div>

        {/* Busca e Botões de Ação */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '6px 12px',
              minWidth: '200px',
            }}
          >
            <Search size={15} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar no Mural..."
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

          {/* + Nova Coluna */}
          <button
            type="button"
            onClick={() => setIsNewColOpen(true)}
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
            <Plus size={15} color="var(--primary-500)" />
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
            <Plus size={16} />
            <span>Novo Cartão</span>
          </button>
        </div>
      </div>

      {/* Kanban Board Colunas */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          overflowX: 'auto',
          paddingBottom: '20px',
          alignItems: 'flex-start',
        }}
      >
        {columns.map((col, colIdx) => {
          const colCards = filteredCards.filter((c) => c.columnId === col.id);

          return (
            <div
              key={col.id}
              style={{
                flex: '0 0 320px',
                minWidth: '280px',
                background: 'var(--bg-secondary)',
                borderRadius: '14px',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: 'calc(100vh - 160px)',
              }}
            >
              {/* Topo da Coluna */}
              <div
                style={{
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {col.title}
                  </span>
                  <span
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      padding: '1px 7px',
                      borderRadius: '10px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: 'var(--text-muted)',
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
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
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
                        padding: '4px',
                        borderRadius: '4px',
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
                }}
              >
                {colCards.map((card) => {
                  return (
                    <div
                      key={card.id}
                      onClick={() => setActiveCard(card)}
                      role="button"
                      tabIndex={0}
                      style={{
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--red)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)';
                      }}
                    >
                      {/* Marcadores Coloridos */}
                      {card.markers.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                          {card.markers.map((m) => (
                            <span
                              key={m.id}
                              style={{
                                background: `${m.color}1a`,
                                color: m.color,
                                border: `1px solid ${m.color}40`,
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
                          margin: '0 0 6px 0',
                          lineHeight: 1.35,
                        }}
                      >
                        {card.title}
                      </h4>

                      {card.description && (
                        <p
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-secondary)',
                            margin: '0 0 10px 0',
                            lineHeight: 1.4,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {card.description}
                        </p>
                      )}

                      {/* Rodapé do Cartão */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '8px',
                          borderTop: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {/* Membros / Compartilhados */}
                          <div style={{ display: 'flex', alignItems: 'center' }}>
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
                              }}
                              title={`Criado por ${card.author}`}
                            >
                              {card.author.charAt(0)}
                            </div>
                            {card.sharedWith.length > 0 && (
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  color: 'var(--text-muted)',
                                  marginLeft: '4px',
                                }}
                                title={`Compartilhado com: ${card.sharedWith.join(', ')}`}
                              >
                                +{card.sharedWith.length}
                              </span>
                            )}
                          </div>

                          {/* Comentários count */}
                          {card.comments.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              <MessageSquare size={12} />
                              <span>{card.comments.length}</span>
                            </div>
                          )}
                        </div>

                        {/* Botões Rápidos de Mover Coluna */}
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
                              }}
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
                              }}
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
                      padding: '24px 12px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '0.78rem',
                      border: '1px dashed var(--border)',
                      borderRadius: '8px',
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

      {/* MODAL: Nova Coluna */}
      {isNewColOpen && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: '380px', padding: '20px', background: 'var(--bg-primary)', borderRadius: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Nova Coluna no Mural
              </h3>
              <button type="button" onClick={() => setIsNewColOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateColumn}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
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
                  Criar Coluna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Novo Cartão */}
      {isNewCardOpen && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: '540px', padding: '24px', background: 'var(--bg-primary)', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Novo Cartão de Atividade
              </h3>
              <button type="button" onClick={() => setIsNewCardOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCard}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                  Coluna Inicial:
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
                  }}
                >
                  {columns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                  Título da Atividade:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Validar rotina de inventário fiscal"
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
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

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                  Descrição / Detalhes:
                </label>
                <textarea
                  rows={4}
                  placeholder="Informações complementares sobre a atividade..."
                  value={newCardDesc}
                  onChange={(e) => setNewCardDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.86rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Compartilhar com membros da equipe */}
              <div style={{ marginBottom: '16px', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                  Compartilhar para aparecer no perfil de:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {TEAM_MEMBERS.map((member) => {
                    const isChecked = newCardShared.includes(member);
                    return (
                      <button
                        type="button"
                        key={member}
                        onClick={() => {
                          if (isChecked) {
                            setNewCardShared(newCardShared.filter((m) => m !== member));
                          } else {
                            setNewCardShared([...newCardShared, member]);
                          }
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: isChecked ? '1px solid var(--red)' : '1px solid var(--border)',
                          background: isChecked ? 'var(--red-soft)' : 'var(--bg-primary)',
                          color: isChecked ? 'var(--red)' : 'var(--text-secondary)',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {isChecked ? '✓ ' : '+ '}
                        {member}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsNewCardOpen(false)}
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
                  Criar Cartão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Detalhes do Cartão (Acessar, Marcadores, Membros, Comentários) */}
      {activeCard && (
        <div className="modal-backdrop">
          <div
            className="modal-box"
            style={{ maxWidth: '640px', padding: '24px', background: 'var(--bg-primary)', borderRadius: '16px', maxHeight: '88vh', overflowY: 'auto' }}
          >
            {/* Topo do Modal */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                  {activeCard.title}
                </h3>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Criado por {activeCard.author} em {new Date(activeCard.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveCard(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Mover Coluna */}
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Coluna:
              </span>
              <select
                value={activeCard.columnId}
                onChange={(e) => {
                  const newCol = e.target.value;
                  const updated = cards.map((c) =>
                    c.id === activeCard.id ? { ...c, columnId: newCol } : c
                  );
                  saveCards(updated);
                  setActiveCard({ ...activeCard, columnId: newCol });
                }}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  fontSize: '0.82rem',
                  color: 'var(--text-primary)',
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

            {/* Marcadores Coloridos */}
            <div style={{ marginBottom: '16px' }}>
              <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                MARCADORES DESTAQUE:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {PRESET_MARKER_COLORS.map((preset) => {
                  const isActive = activeCard.markers.some((m) => m.label === preset.label);
                  return (
                    <button
                      type="button"
                      key={preset.label}
                      onClick={() => handleToggleMarkerOnActive(preset)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: `1.5px solid ${preset.color}`,
                        background: isActive ? preset.color : 'transparent',
                        color: isActive ? '#fff' : preset.color,
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
            </div>

            {/* Compartilhamento / Membros */}
            <div style={{ marginBottom: '16px' }}>
              <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                COMPARTILHADO COM (ATIVIDADE VISÍVEL PARA):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {TEAM_MEMBERS.map((member) => {
                  const isShared = activeCard.sharedWith.includes(member);
                  return (
                    <button
                      type="button"
                      key={member}
                      onClick={() => handleToggleSharedOnActive(member)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: isShared ? '1px solid var(--red)' : '1px solid var(--border)',
                        background: isShared ? 'var(--red-soft)' : 'var(--bg-secondary)',
                        color: isShared ? 'var(--red)' : 'var(--text-secondary)',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {isShared ? '✓ ' : '+ '}
                      {member}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Descrição */}
            {activeCard.description && (
              <div style={{ marginBottom: '20px', background: 'var(--bg-secondary)', padding: '14px', borderRadius: '10px' }}>
                <span style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  DESCRIÇÃO DA TAREFA:
                </span>
                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {activeCard.description}
                </p>
              </div>
            )}

            {/* Comentários Thread */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <MessageSquare size={15} color="var(--red)" />
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Comentários e Andamento ({activeCard.comments.length})
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                {activeCard.comments.map((comm) => (
                  <div
                    key={comm.id}
                    style={{
                      background: 'var(--bg-secondary)',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {comm.author}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {new Date(comm.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {comm.content}
                    </p>
                  </div>
                ))}
              </div>

              {/* Input de Comentário */}
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
                    background: 'var(--bg-secondary)',
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
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--red)',
                    color: '#fff',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Send size={13} />
                  <span>Enviar</span>
                </button>
              </div>
            </div>

            {/* Ações Finais */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
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
                  fontSize: '0.8rem',
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
                  padding: '7px 16px',
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
