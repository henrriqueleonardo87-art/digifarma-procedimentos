import React, { useState, useMemo, useEffect } from 'react';
import {
  StickyNote,
  Plus,
  Trash2,
  X,
  MessageSquare,
  Send,
  Loader2,
} from 'lucide-react';
import type { AppUser } from '../types/auth';
import { playNotificationSound } from '../lib/notificationSound';
import {
  type PublicacaoItem,
  type PublicacaoComment,
  getCachedPublicacoes,
  createPublicacao,
  updatePublicacaoComments,
  deletePublicacao,
  subscribeToPublicacoes,
  fetchTeamMembers,
  isUserTargeted,
  isUserAuthor,
} from '../lib/publicacoesService';

export type { PublicacaoItem, PublicacaoComment };

interface PublicacoesViewProps {
  currentUser?: AppUser | null;
  onBackToDashboard?: () => void;
  onNotificationChange?: (count: number) => void;
}

export const PublicacoesView: React.FC<PublicacoesViewProps> = ({
  currentUser,
  onNotificationChange,
}) => {
  const currentUserName = currentUser?.name || currentUser?.username || 'Leonardo';

  // Lista de publicações (inicia com cache e sincroniza com Supabase)
  const [publicacoes, setPublicacoes] = useState<PublicacaoItem[]>(() => getCachedPublicacoes());
  const [loading, setLoading] = useState(false);

  // Lista dinâmica de membros da equipe para o modal de destinatários
  const [teamMembers, setTeamMembers] = useState<Array<{ username: string; name: string }>>([]);

  // Filtros
  const [filterTab, setFilterTab] = useState<'all' | 'mine' | 'targeted'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal de Criação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado de novos comentários por publicação (id -> text)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [isSendingComment, setIsSendingComment] = useState<Record<string, boolean>>({});

  // Carregar membros da equipe do Supabase
  useEffect(() => {
    fetchTeamMembers().then((members) => {
      setTeamMembers(members);
    });
  }, []);

  // Assinar mudanças no Supabase (Realtime + polling automático a cada 10s)
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToPublicacoes((items) => {
      setPublicacoes(items);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Contar publicações direcionadas ao usuário ativo
  const targetedToMeCount = useMemo(() => {
    return publicacoes.filter((p) => isUserTargeted(p.targetUsers, currentUser)).length;
  }, [publicacoes, currentUser]);

  useEffect(() => {
    onNotificationChange?.(targetedToMeCount);
  }, [targetedToMeCount, onNotificationChange]);

  // Lista Filtrada
  const filteredList = useMemo(() => {
    return publicacoes.filter((p) => {
      // Filtro de aba
      if (filterTab === 'mine' && !isUserAuthor(p.author, currentUser)) return false;
      if (filterTab === 'targeted' && !isUserTargeted(p.targetUsers, currentUser)) return false;

      // Filtro de busca
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchContent = p.content.toLowerCase().includes(q);
        const matchAuthor = p.author.toLowerCase().includes(q);
        const matchTargets = p.targetUsers?.some((t) => t.toLowerCase().includes(q));
        return matchTitle || matchContent || matchAuthor || matchTargets;
      }
      return true;
    });
  }, [publicacoes, filterTab, currentUser, searchTerm]);

  // Submeter Nova Publicação
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
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

      await createPublicacao(newItem);
      setPublicacoes((prev) => [newItem, ...prev.filter((p) => p.id !== newItem.id)]);

      // Tocar som de confirmação/notificação
      playNotificationSound();

      setTitle('');
      setContent('');
      setTargetType('all');
      setSelectedTargets([]);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Erro ao criar publicação:', err);
      alert('Erro ao publicar comunicado. Verifique sua conexão.');
    } finally {
      setIsSubmitting(false);
    }
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
  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir esta publicação?')) {
      setPublicacoes((prev) => prev.filter((p) => p.id !== id));
      await deletePublicacao(id);
    }
  };

  // Adicionar Comentário
  const handleAddComment = async (pubId: string) => {
    const text = commentInputs[pubId]?.trim();
    if (!text) return;

    const pub = publicacoes.find((p) => p.id === pubId);
    if (!pub) return;

    const newComment: PublicacaoComment = {
      id: `comment-${Date.now()}`,
      author: currentUserName,
      content: text,
      createdAt: new Date().toISOString(),
    };

    const updatedComments = [...pub.comments, newComment];

    // Atualização otimista
    setPublicacoes((prev) =>
      prev.map((p) => (p.id === pubId ? { ...p, comments: updatedComments } : p))
    );
    setCommentInputs((prev) => ({ ...prev, [pubId]: '' }));
    setIsSendingComment((prev) => ({ ...prev, [pubId]: true }));

    try {
      await updatePublicacaoComments(pubId, updatedComments);
      playNotificationSound();
    } catch (err) {
      console.error('Erro ao enviar comentário:', err);
    } finally {
      setIsSendingComment((prev) => ({ ...prev, [pubId]: false }));
    }
  };

  return (
    <>
      {/* ── 1. Heading Oficial com Eyebrow, H1, Subtítulo e Capture ── */}
      <section className="heading">
        <div>
          <span className="eyebrow">COMUNICAÇÃO &amp; AVISOS</span>
          <h1 id="pageTitle">Publicações da Equipe</h1>
          <p id="pageSubtitle">
            Mural de avisos internos, comunicados gerais e direcionamentos específicos sincronizados em tempo real.
          </p>
        </div>
        <div className="capture">
          <span className="live-dot" /> Mural de avisos
          <span id="captured">
            {loading ? 'Sincronizando...' : `${publicacoes.length} publicações ativas`}
          </span>
        </div>
      </section>

      {/* ── 2. Barra Contínua de Filtros Globais (.filters) ── */}
      <section className="filters" aria-label="Filtros globais">
        <div className="filter">
          <label htmlFor="pub-filter-tab">VISUALIZAÇÃO</label>
          <select
            id="pub-filter-tab"
            value={filterTab}
            onChange={(e) => setFilterTab(e.target.value as any)}
          >
            <option value="all">Todas ({publicacoes.length})</option>
            <option value="targeted">Direcionadas a Mim ({targetedToMeCount})</option>
            <option value="mine">Minhas Publicações</option>
          </select>
        </div>

        <div className="filter store-filter" style={{ flex: 1 }}>
          <label htmlFor="pub-search">BUSCA EM PUBLICAÇÕES</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              id="pub-search"
              type="text"
              placeholder="Buscar por título, autor, menção ou conteúdo..."
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
          <span className="live-dot" /> {filteredList.length} Publicações
        </div>
      </section>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
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
            boxShadow: '0 2px 8px rgba(231, 76, 60, 0.25)',
          }}
        >
          <Plus size={16} />
          <span>Nova Publicação</span>
        </button>
      </div>

      {/* Feed de Publicações */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredList.map((pub) => {
          const isTargetedToMe = isUserTargeted(pub.targetUsers, currentUser);
          const isEveryone = !pub.targetUsers || pub.targetUsers.length === 0;
          const isAuthor = isUserAuthor(pub.author, currentUser);

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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

                {isAuthor && (
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
                    disabled={isSendingComment[pub.id]}
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
                      cursor: isSendingComment[pub.id] ? 'not-allowed' : 'pointer',
                      opacity: isSendingComment[pub.id] ? 0.7 : 1,
                    }}
                  >
                    {isSendingComment[pub.id] ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Send size={13} />
                    )}
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
                      {teamMembers.map((member) => {
                        const targetKey = member.name || member.username;
                        const isChecked =
                          selectedTargets.includes(targetKey) ||
                          selectedTargets.includes(member.username);

                        return (
                          <button
                            type="button"
                            key={member.username}
                            onClick={() => handleToggleTargetUser(targetKey)}
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
                              transition: 'all 0.12s ease',
                            }}
                          >
                            <span>{isChecked ? '✓' : '+'}</span>
                            <span>{member.name || member.username}</span>
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
                  disabled={isSubmitting}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--red)',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontSize: '0.84rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  <span>Publicar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
