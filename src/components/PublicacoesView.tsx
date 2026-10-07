import React, { useState, useMemo, useEffect } from 'react';
import {
  StickyNote,
  Plus,
  Trash2,
  Search,
  X,
  MessageSquare,
  Send,
} from 'lucide-react';
import type { AppUser } from '../types/auth';
import { playNotificationSound } from '../lib/notificationSound';

export interface PublicacaoComment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface PublicacaoItem {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  targetUsers: string[]; // [] = todos, ou ['Leonardo', 'Icaro', ...]
  comments: PublicacaoComment[];
}

interface PublicacoesViewProps {
  currentUser?: AppUser | null;
  onBackToDashboard?: () => void;
  onNotificationChange?: (count: number) => void;
}

const STORAGE_KEY_PUBLICACOES = 'digifarma_publicacoes_feed_list';
const TEAM_MEMBERS = ['Leonardo', 'Icaro', 'Wallace', 'Whitalo'];

const INITIAL_PUBLICACOES: PublicacaoItem[] = [
  {
    id: 'pub-1',
    title: 'Atualização nas Regras de Validação de NF-e 4.0',
    content:
      'Atenção equipe de implantação: os clientes do regime Simples Nacional agora exigem o preenchimento obrigatório do código de benefício fiscal em itens desonerados. Procedimento documentado.',
    author: 'Leonardo',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    targetUsers: [], // Todos
    comments: [
      {
        id: 'c-1',
        author: 'Icaro',
        content: 'Perfeito, já estou repassando aos operadores da Drogaria Santa Luzia.',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ],
  },
  {
    id: 'pub-2',
    title: 'Revisão Técnica Pendente do POP de Fechamento Cego',
    content:
      'Favor validar os parâmetros de sangria e conferência de lote antes da reunião de homologação com a gerência amanhã.',
    author: 'Wallace',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    targetUsers: ['Leonardo', 'Whitalo'],
    comments: [],
  },
];

export const PublicacoesView: React.FC<PublicacoesViewProps> = ({
  currentUser,
  onNotificationChange,
}) => {
  const currentUserName = currentUser?.name || currentUser?.username || 'Leonardo';

  const [publicacoes, setPublicacoes] = useState<PublicacaoItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PUBLICACOES);
    return saved ? JSON.parse(saved) : INITIAL_PUBLICACOES;
  });

  // Filtros
  const [filterTab, setFilterTab] = useState<'all' | 'mine' | 'targeted'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal de Criação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);

  // Estado de novos comentários por publicação (id -> text)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Sincronizar com LocalStorage
  const savePublicacoes = (items: PublicacaoItem[]) => {
    setPublicacoes(items);
    localStorage.setItem(STORAGE_KEY_PUBLICACOES, JSON.stringify(items));
  };

  // Contar publicações direcionadas ao usuário ativo
  const targetedToMeCount = useMemo(() => {
    return publicacoes.filter(
      (p) => p.targetUsers.length > 0 && p.targetUsers.includes(currentUserName)
    ).length;
  }, [publicacoes, currentUserName]);

  useEffect(() => {
    onNotificationChange?.(targetedToMeCount);
  }, [targetedToMeCount, onNotificationChange]);

  // Lista Filtrada
  const filteredList = useMemo(() => {
    return publicacoes.filter((p) => {
      // Filtro de aba
      if (filterTab === 'mine' && p.author !== currentUserName) return false;
      if (filterTab === 'targeted') {
        const isForMe = p.targetUsers.includes(currentUserName);
        if (!isForMe) return false;
      }

      // Filtro de busca
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchContent = p.content.toLowerCase().includes(q);
        const matchAuthor = p.author.toLowerCase().includes(q);
        return matchTitle || matchContent || matchAuthor;
      }
      return true;
    });
  }, [publicacoes, filterTab, currentUserName, searchTerm]);

  // Submeter Nova Publicação
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const targets = targetType === 'all' ? [] : selectedTargets;

    const newItem: PublicacaoItem = {
      id: `pub-${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      author: currentUserName,
      createdAt: new Date().toISOString(),
      targetUsers: targets,
      comments: [],
    };

    const updated = [newItem, ...publicacoes];
    savePublicacoes(updated);

    // Tocar som de confirmação/notificação
    playNotificationSound();

    setTitle('');
    setContent('');
    setTargetType('all');
    setSelectedTargets([]);
    setIsModalOpen(false);
  };

  // Alternar Destinatário
  const handleToggleTargetUser = (name: string) => {
    if (selectedTargets.includes(name)) {
      setSelectedTargets(selectedTargets.filter((u) => u !== name));
    } else {
      setSelectedTargets([...selectedTargets, name]);
    }
  };

  // Excluir Publicação
  const handleDelete = (id: string) => {
    if (confirm('Deseja excluir esta publicação?')) {
      const updated = publicacoes.filter((p) => p.id !== id);
      savePublicacoes(updated);
    }
  };

  // Adicionar Comentário
  const handleAddComment = (pubId: string) => {
    const text = commentInputs[pubId]?.trim();
    if (!text) return;

    const newComment: PublicacaoComment = {
      id: `comment-${Date.now()}`,
      author: currentUserName,
      content: text,
      createdAt: new Date().toISOString(),
    };

    const updated = publicacoes.map((p) => {
      if (p.id === pubId) {
        return {
          ...p,
          comments: [...p.comments, newComment],
        };
      }
      return p;
    });

    savePublicacoes(updated);
    setCommentInputs((prev) => ({ ...prev, [pubId]: '' }));
    playNotificationSound();
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px 20px 40px 20px' }}>
      {/* Barra Superior Minimalista com Filtros e Ações */}
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
        {/* Abas de Filtro Rápidas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            style={{
              border: 'none',
              background: filterTab === 'all' ? 'var(--bg-primary)' : 'transparent',
              color: filterTab === 'all' ? 'var(--red)' : 'var(--text-secondary)',
              fontWeight: filterTab === 'all' ? 700 : 500,
              padding: '6px 12px',
              borderRadius: '7px',
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: filterTab === 'all' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            Todas ({publicacoes.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('targeted')}
            style={{
              border: 'none',
              background: filterTab === 'targeted' ? 'var(--bg-primary)' : 'transparent',
              color: filterTab === 'targeted' ? 'var(--red)' : 'var(--text-secondary)',
              fontWeight: filterTab === 'targeted' ? 700 : 500,
              padding: '6px 12px',
              borderRadius: '7px',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: filterTab === 'targeted' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <span>Direcionadas a Mim</span>
            {targetedToMeCount > 0 && (
              <span
                style={{
                  background: 'var(--red)',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '1px 6px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                }}
              >
                {targetedToMeCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('mine')}
            style={{
              border: 'none',
              background: filterTab === 'mine' ? 'var(--bg-primary)' : 'transparent',
              color: filterTab === 'mine' ? 'var(--red)' : 'var(--text-secondary)',
              fontWeight: filterTab === 'mine' ? 700 : 500,
              padding: '6px 12px',
              borderRadius: '7px',
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: filterTab === 'mine' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            Minhas
          </button>
        </div>

        {/* Busca e Botão + Nova Publicação */}
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
              minWidth: '220px',
            }}
          >
            <Search size={15} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar publicações..."
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

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              background: 'var(--red)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Plus size={16} />
            <span>Nova Publicação</span>
          </button>
        </div>
      </div>

      {/* Feed de Publicações */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredList.map((pub) => {
          const isTargetedToMe = pub.targetUsers.includes(currentUserName);
          const isEveryone = pub.targetUsers.length === 0;

          return (
            <div
              key={pub.id}
              style={{
                background: 'var(--bg-primary)',
                border: isTargetedToMe ? '1.5px solid var(--red)' : '1px solid var(--border)',
                borderRadius: '14px',
                padding: '20px',
                boxShadow: isTargetedToMe
                  ? '0 6px 20px rgba(231, 76, 60, 0.08)'
                  : '0 2px 8px rgba(0,0,0,0.03)',
                position: 'relative',
              }}
            >
              {/* Topo do Card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '12px',
                  marginBottom: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Avatar do Autor */}
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'var(--red-soft)',
                      color: 'var(--red)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.92rem',
                    }}
                  >
                    {pub.author.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {pub.author}
                      </span>

                      {/* Tag de Direcionamento */}
                      {isTargetedToMe ? (
                        <span
                          style={{
                            background: 'rgba(231, 76, 60, 0.14)',
                            color: 'var(--red)',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            border: '1px solid rgba(231, 76, 60, 0.3)',
                          }}
                        >
                          🎯 Para você
                        </span>
                      ) : !isEveryone ? (
                        <span
                          style={{
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                          }}
                        >
                          👤 Para: {pub.targetUsers.join(', ')}
                        </span>
                      ) : (
                        <span
                          style={{
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#059669',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          🌐 Todos
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {new Date(pub.createdAt).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>

                {pub.author === currentUserName && (
                  <button
                    type="button"
                    onClick={() => handleDelete(pub.id)}
                    title="Excluir publicação"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--red)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              {/* Título e Conteúdo */}
              <h2
                style={{
                  fontSize: '1.08rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: '0 0 8px 0',
                  lineHeight: 1.35,
                }}
              >
                {pub.title}
              </h2>

              <p
                style={{
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap',
                  margin: '0 0 16px 0',
                }}
              >
                {pub.content}
              </p>

              {/* Thread de Comentários / Respostas */}
              <div
                style={{
                  borderTop: '1px solid var(--border)',
                  paddingTop: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  <MessageSquare size={14} />
                  <span>
                    {pub.comments.length === 0
                      ? 'Nenhum comentário ainda'
                      : `${pub.comments.length} ${pub.comments.length === 1 ? 'comentário' : 'comentários'}`}
                  </span>
                </div>

                {pub.comments.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      background: 'var(--bg-secondary)',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {c.author}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(c.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      {c.content}
                    </p>
                  </div>
                ))}

                {/* Caixa de Entrada para Responder */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <input
                    type="text"
                    placeholder="Escreva uma resposta ou comentário..."
                    value={commentInputs[pub.id] || ''}
                    onChange={(e) =>
                      setCommentInputs({ ...commentInputs, [pub.id]: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddComment(pub.id);
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
                    onClick={() => handleAddComment(pub.id)}
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
                    <span>Responder</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredList.length === 0 && (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              background: 'var(--bg-primary)',
              borderRadius: '14px',
              border: '1.5px dashed var(--border)',
            }}
          >
            <StickyNote size={38} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
              Nenhuma publicação encontrada
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
              Use o botão "Nova Publicação" para comunicar algo à equipe ou a uma pessoa específica.
            </p>
          </div>
        )}
      </div>

      {/* MODAL: Nova Publicação */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div
            className="modal-box"
            style={{ maxWidth: '580px', padding: '24px', background: 'var(--bg-primary)', borderRadius: '16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Criar Nova Publicação
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                  Título do Comunicado / Publicação:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Alinhamento de parametrização fiscal"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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

              {/* Destinatários */}
              <div style={{ marginBottom: '14px', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '8px' }}>
                  Visibilidade / Destinatários:
                </label>

                <div style={{ display: 'flex', gap: '14px', marginBottom: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="targetType"
                      checked={targetType === 'all'}
                      onChange={() => setTargetType('all')}
                    />
                    <span>Geral (Aparece para todos)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="targetType"
                      checked={targetType === 'specific'}
                      onChange={() => setTargetType('specific')}
                    />
                    <span>Pessoa(s) Específica(s)</span>
                  </label>
                </div>

                {targetType === 'specific' && (
                  <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      Selecione quem deve receber e visualizar esta notificação:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {TEAM_MEMBERS.map((member) => {
                        const isChecked = selectedTargets.includes(member);
                        return (
                          <button
                            type="button"
                            key={member}
                            onClick={() => handleToggleTargetUser(member)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: isChecked ? '1px solid var(--red)' : '1px solid var(--border)',
                              background: isChecked ? 'var(--red-soft)' : 'var(--bg-primary)',
                              color: isChecked ? 'var(--red)' : 'var(--text-secondary)',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            <span>{isChecked ? '✓' : '+'}</span>
                            <span>{member}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Conteúdo */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                  Mensagem / Detalhes:
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Escreva a mensagem ou comunicado da publicação..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
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
                  onClick={() => setIsModalOpen(false)}
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
                  Publicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
