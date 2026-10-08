import React, { useState, useMemo, useEffect } from 'react';
import {
  StickyNote,
  Plus,
  Trash2,
  X,
  MessageSquare,
  Send,
  Loader2,
  Paperclip,
  FileText,
  Eye,
  Download,
  Users,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { AppUser } from '../types/auth';
import { playNotificationSound } from '../lib/notificationSound';
import {
  type PublicacaoItem,
  type PublicacaoComment,
  type PublicacaoAttachment,
  getCachedPublicacoes,
  createPublicacao,
  updatePublicacaoComments,
  deletePublicacao,
  subscribeToPublicacoes,
  fetchTeamMembers,
  isUserTargeted,
  isUserAuthor,
  isUserRead,
  markPublicacaoAsRead,
} from '../lib/publicacoesService';

export type { PublicacaoItem, PublicacaoComment, PublicacaoAttachment };

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
  const [filterTab, setFilterTab] = useState<'all' | 'mine' | 'targeted' | 'unread'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [periodPreset, setPeriodPreset] = useState<
    'all' | 'today' | 'yesterday' | '7days' | '15days' | '30days' | 'thisMonth' | 'lastMonth' | 'custom'
  >('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Modal de Criação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [attachment, setAttachment] = useState<PublicacaoAttachment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado de novos comentários por publicação (id -> text)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [isSendingComment, setIsSendingComment] = useState<Record<string, boolean>>({});

  // Lightbox modal para imagem anexada
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Modal de confirmação para excluir publicação (In-app, sem confirm do navegador)
  const [pubToDelete, setPubToDelete] = useState<PublicacaoItem | null>(null);
  const [isDeletingPub, setIsDeletingPub] = useState(false);

  // Estado de comentários expandidos por publicação (id -> boolean)
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  const toggleComments = (pubId: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [pubId]: !prev[pubId],
    }));
  };

  // Estado de membros que visualizaram (expandido ao clicar)
  const [expandedSeen, setExpandedSeen] = useState<Record<string, boolean>>({});

  const toggleSeen = (pubId: string) => {
    setExpandedSeen((prev) => ({
      ...prev,
      [pubId]: !prev[pubId],
    }));
  };

  // Paginação: limite de 10 publicações por vez
  const [visibleCount, setVisibleCount] = useState<number>(10);

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
      const sorted = [...items].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setPublicacoes(sorted);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Contar publicações direcionadas ao usuário ativo que ainda não foram lidas
  const unreadTargetedCount = useMemo(() => {
    return publicacoes.filter(
      (p) => isUserTargeted(p.targetUsers, currentUser) && !isUserRead(p.readBy, currentUser, p.id)
    ).length;
  }, [publicacoes, currentUser]);

  useEffect(() => {
    onNotificationChange?.(unreadTargetedCount);
  }, [unreadTargetedCount, onNotificationChange]);

  // Lista Filtrada (ordenada estritamente da mais recente para a mais antiga)
  const filteredList = useMemo(() => {
    return publicacoes
      .filter((p) => {
        // Filtro de aba
        if (filterTab === 'mine' && !isUserAuthor(p.author, currentUser)) return false;
        if (filterTab === 'targeted' && !isUserTargeted(p.targetUsers, currentUser)) return false;
        if (filterTab === 'unread') {
          const hasRead = isUserRead(p.readBy, currentUser, p.id);
          if (hasRead) return false;
        }

        // Filtro de período
        if (periodPreset !== 'all') {
          const pubDate = new Date(p.createdAt);
          const now = new Date();

          if (periodPreset === 'today') {
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            if (pubDate < todayStart) return false;
          } else if (periodPreset === 'yesterday') {
            const yestStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
            const yestEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
            if (pubDate < yestStart || pubDate > yestEnd) return false;
          } else if (periodPreset === '7days') {
            const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (pubDate < d7) return false;
          } else if (periodPreset === '15days') {
            const d15 = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
            if (pubDate < d15) return false;
          } else if (periodPreset === '30days') {
            const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (pubDate < d30) return false;
          } else if (periodPreset === 'thisMonth') {
            const mStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            if (pubDate < mStart) return false;
          } else if (periodPreset === 'lastMonth') {
            const lmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
            const lmEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            if (pubDate < lmStart || pubDate > lmEnd) return false;
          } else if (periodPreset === 'custom') {
            if (customStartDate) {
              const [sY, sM, sD] = customStartDate.split('-').map(Number);
              const start = new Date(sY, sM - 1, sD, 0, 0, 0, 0);
              if (pubDate < start) return false;
            }
            if (customEndDate) {
              const [eY, eM, eD] = customEndDate.split('-').map(Number);
              const end = new Date(eY, eM - 1, eD, 23, 59, 59, 999);
              if (pubDate > end) return false;
            }
          }
        }

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
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [publicacoes, filterTab, currentUser, searchTerm, periodPreset, customStartDate, customEndDate]);

  // Se a busca ou filtro mudar, o usuário pediu:
  // "Exceto se eu usar a parte de busca ou filtro"
  const isFilteringOrSearching =
    searchTerm.trim() !== '' ||
    filterTab !== 'all' ||
    periodPreset !== 'all';

  const displayedList = useMemo(() => {
    if (isFilteringOrSearching) {
      return filteredList;
    }
    return filteredList.slice(0, visibleCount);
  }, [filteredList, isFilteringOrSearching, visibleCount]);

  const hasMore = !isFilteringOrSearching && filteredList.length > visibleCount;

  // Upload de Anexo
  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isImage = file.type.startsWith('image/');

    if (!isPdf && !isImage) {
      alert('Selecione apenas arquivos de imagem (PNG, JPG) ou documentos PDF.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setAttachment({
          name: file.name,
          type: isPdf ? 'pdf' : 'image',
          url: result,
          size: file.size,
        });
      }
    };
    reader.readAsDataURL(file);
  };

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
        readBy: [currentUserName],
        attachment: attachment || null,
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
      setAttachment(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Erro ao criar publicação:', err);
      alert('Erro ao publicar comunicado. Verifique sua conexão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirmar Leitura / Visto
  const handleConfirmRead = async (pubId: string) => {
    const pub = publicacoes.find((p) => p.id === pubId);
    if (!pub) return;

    const existing = pub.readBy || [];
    if (isUserRead(existing, currentUser, pubId)) return;

    // Atualização otimista
    const updatedReadBy = [...existing, currentUserName];
    setPublicacoes((prev) =>
      prev.map((p) => (p.id === pubId ? { ...p, readBy: updatedReadBy } : p))
    );

    playNotificationSound();
    await markPublicacaoAsRead(pubId, currentUserName, currentUser);
  };

  // Alternar Destinatário
  const handleToggleTargetUser = (name: string) => {
    if (selectedTargets.includes(name)) {
      setSelectedTargets(selectedTargets.filter((u) => u !== name));
    } else {
      setSelectedTargets([...selectedTargets, name]);
    }
  };

  // Disparar confirmação de exclusão pelo modal do próprio site (sem confirm do Google)
  const handleDeleteClick = (pub: PublicacaoItem) => {
    setPubToDelete(pub);
  };

  // Confirmar exclusão permanentemente
  const handleConfirmDelete = async () => {
    if (!pubToDelete) return;
    setIsDeletingPub(true);
    try {
      const id = pubToDelete.id;
      setPublicacoes((prev) => prev.filter((p) => p.id !== id));
      await deletePublicacao(id);
      playNotificationSound();
      setPubToDelete(null);
    } catch (err) {
      console.error('Erro ao excluir publicação:', err);
    } finally {
      setIsDeletingPub(false);
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
    setExpandedComments((prev) => ({ ...prev, [pubId]: true }));
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
    <div style={{ maxWidth: '1440px', width: '100%', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Barra de Ações Superior: Novo Recado */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px', marginBottom: '14px' }}>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            background: 'var(--red)',
            border: 'none',
            borderRadius: '9px',
            color: '#ffffff',
            fontSize: '0.86rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 3px 12px rgba(237, 38, 43, 0.28)',
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <Plus size={17} />
          <span>Novo Recado</span>
        </button>
      </div>

      {/* ── Barra Contínua de Filtros Globais (.filters) ── */}
      <section className="filters" aria-label="Filtros globais" style={{ marginTop: '0', marginBottom: '20px' }}>
        <div className="filter">
          <label htmlFor="pub-filter-tab">VISUALIZAÇÃO</label>
          <select
            id="pub-filter-tab"
            value={filterTab}
            onChange={(e) => setFilterTab(e.target.value as any)}
          >
            <option value="all">Todos ({publicacoes.length})</option>
            <option value="unread">Não Lidos por Mim</option>
            <option value="targeted">Direcionados a Mim</option>
            <option value="mine">Meus Recados</option>
          </select>
        </div>

        {/* Filtro por Período */}
        <div className="filter">
          <label htmlFor="pub-filter-period">PERÍODO</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <select
              id="pub-filter-period"
              value={periodPreset}
              onChange={(e) => setPeriodPreset(e.target.value as any)}
            >
              <option value="all">Todo o período</option>
              <option value="today">Hoje</option>
              <option value="yesterday">Ontem</option>
              <option value="7days">Últimos 7 dias</option>
              <option value="15days">Últimos 15 dias</option>
              <option value="30days">Últimos 30 dias</option>
              <option value="thisMonth">Este mês</option>
              <option value="lastMonth">Mês anterior</option>
              <option value="custom">Personalizado...</option>
            </select>
            {periodPreset !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  setPeriodPreset('all');
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                title="Limpar filtro de período"
                style={{
                  border: 'none',
                  background: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  fontSize: '11px',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Datas personalizadas quando "Personalizado..." for selecionado */}
        {periodPreset === 'custom' && (
          <>
            <div className="filter" style={{ minWidth: '135px' }}>
              <label htmlFor="pub-date-start">DATA INÍCIO</label>
              <input
                id="pub-date-start"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                style={{ cursor: 'pointer' }}
              />
            </div>
            <div className="filter" style={{ minWidth: '135px' }}>
              <label htmlFor="pub-date-end">DATA FIM</label>
              <input
                id="pub-date-end"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                style={{ cursor: 'pointer' }}
              />
            </div>
          </>
        )}

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
          <span className="live-dot" /> {loading ? 'Sincronizando...' : `${filteredList.length} ${filteredList.length === 1 ? 'Recado' : 'Recados'}`}
        </div>
      </section>

      {/* Feed de Recados Amplo e Espaçoso */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {displayedList.map((pub) => {
          const isTargetedToMe = isUserTargeted(pub.targetUsers, currentUser);
          const isEveryone = !pub.targetUsers || pub.targetUsers.length === 0;
          const isAuthor = isUserAuthor(pub.author, currentUser);
          const hasRead = isUserRead(pub.readBy, currentUser, pub.id);
          const readCount = (pub.readBy || []).length;

          return (
            <div
              key={pub.id}
              style={{
                background: 'var(--bg-primary)',
                border: isTargetedToMe
                  ? '1px solid #94a3b8'
                  : !hasRead
                  ? '1.5px solid var(--red)'
                  : '1px solid var(--border)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: isTargetedToMe
                  ? '0 2px 10px rgba(100, 116, 139, 0.06)'
                  : !hasRead
                  ? '0 8px 24px rgba(237, 38, 43, 0.09)'
                  : '0 2px 10px rgba(0,0,0,0.03)',
                position: 'relative',
                transition: 'all 0.18s ease',
              }}
            >
              {/* Topo do Card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  marginBottom: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Bolinha pulsante clicável na parte superior esquerda para confirmar visto */}
                  {!hasRead && (
                    <button
                      type="button"
                      onClick={() => handleConfirmRead(pub.id)}
                      title="Não lido · Clique para confirmar visualização"
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '4px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        transition: 'transform 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: isTargetedToMe ? '#94a3b8' : 'var(--red)',
                          boxShadow: isTargetedToMe ? '0 0 6px rgba(148, 163, 184, 0.5)' : '0 0 8px var(--red)',
                          display: 'inline-block',
                          animation: 'pulse-dot 1.4s infinite ease-in-out',
                        }}
                      />
                    </button>
                  )}

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
                      fontSize: '0.94rem',
                      flexShrink: 0,
                    }}
                  >
                    {pub.author.charAt(0).toUpperCase()}
                  </div>

                  {/* Nome do autor + tag de direcionamento */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {pub.author}
                    </span>

                    {/* Tag de Direcionamento */}
                    {isTargetedToMe ? (
                      <span
                        style={{
                          background: 'rgba(148, 163, 184, 0.12)',
                          color: 'var(--text-secondary)',
                          fontSize: '0.70rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '5px',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                        }}
                      >
                        🎯 Para você
                      </span>
                    ) : !isEveryone ? (
                      <span
                        style={{
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)',
                          fontSize: '0.70rem',
                          fontWeight: 600,
                          padding: '2px 7px',
                          borderRadius: '5px',
                          border: '1px solid var(--border)',
                        }}
                      >
                        👤 Para: {pub.targetUsers.join(', ')}
                      </span>
                    ) : (
                      <span
                        style={{
                          background: 'rgba(16, 185, 129, 0.08)',
                          color: '#059669',
                          fontSize: '0.70rem',
                          fontWeight: 600,
                          padding: '2px 7px',
                          borderRadius: '5px',
                        }}
                      >
                        🌐 Todos
                      </span>
                    )}
                  </div>
                </div>

                {/* Parte Superior Direita: Data de postagem (com segundos) e botão de excluir */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '0.76rem',
                      color: 'var(--text-muted)',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {new Date(pub.createdAt).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>

                  {isAuthor && (
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(pub)}
                      title="Excluir publicação"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--red)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Título e Conteúdo da Publicação */}
              <h2
                style={{
                  fontSize: '1.16rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: '0 0 10px 0',
                  lineHeight: 1.35,
                }}
              >
                {pub.title}
              </h2>

              <p
                style={{
                  fontSize: '0.94rem',
                  lineHeight: 1.65,
                  color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap',
                  margin: '0 0 16px 0',
                }}
              >
                {pub.content}
              </p>

              {/* Anexo de Imagem ou PDF */}
              {pub.attachment && (
                <div style={{ marginBottom: '16px' }}>
                  {pub.attachment.type === 'image' ? (
                    <div
                      style={{
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-secondary)',
                        maxWidth: '560px',
                        cursor: 'pointer',
                      }}
                      onClick={() => setLightboxUrl(pub.attachment?.url || null)}
                      title="Clique para ampliar a imagem"
                    >
                      <img
                        src={pub.attachment.url}
                        alt={pub.attachment.name}
                        style={{
                          width: '100%',
                          maxHeight: '380px',
                          objectFit: 'contain',
                          display: 'block',
                        }}
                      />
                      <div
                        style={{
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderTop: '1px solid var(--border-subtle)',
                          fontSize: '0.78rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>🖼 {pub.attachment.name}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--red)' }}>
                          <Eye size={12} /> Clique para ampliar
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 18px',
                        borderRadius: '10px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: 'rgba(237, 38, 43, 0.12)',
                          color: 'var(--red)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <FileText size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {pub.attachment.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Documento PDF Oficial Anexo
                        </div>
                      </div>
                      <a
                        href={pub.attachment.url}
                        download={pub.attachment.name}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          background: 'var(--red)',
                          color: '#fff',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          textDecoration: 'none',
                          marginLeft: '12px',
                        }}
                      >
                        <Download size={13} />
                        <span>Abrir / Baixar PDF</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Rodapé: Comentários à esquerda e Visto por X à direita */}
              <div
                style={{
                  borderTop: '1px solid var(--border)',
                  paddingTop: '12px',
                }}
              >
                {/* Linha de Ações */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  {/* Botão de Expansão / Resumo de Comentários */}
                  <button
                    type="button"
                    onClick={() => toggleComments(pub.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '5px 10px',
                      borderRadius: '7px',
                      background: expandedComments[pub.id] ? 'var(--bg-secondary)' : 'transparent',
                      border: expandedComments[pub.id] ? '1px solid var(--border)' : '1px solid transparent',
                      color: pub.comments.length > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontSize: '0.80rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                    onMouseLeave={(e) => {
                      if (!expandedComments[pub.id]) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <MessageSquare size={14} color={pub.comments.length > 0 ? '#3b82f6' : 'var(--text-muted)'} />
                    <span>
                      {pub.comments.length === 0
                        ? 'Deixar um comentário'
                        : `${pub.comments.length} ${pub.comments.length === 1 ? 'comentário' : 'comentários'}`}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      {expandedComments[pub.id] ? (
                        <>
                          <span>Recolher</span>
                          <ChevronUp size={12} />
                        </>
                      ) : (
                        <>
                          <span>{pub.comments.length > 0 ? 'Ver todos' : 'Escrever'}</span>
                          <ChevronDown size={12} />
                        </>
                      )}
                    </span>
                  </button>

                  {/* Visto por X de forma minimalista, sem negrito, no canto inferior direito */}
                  <button
                    type="button"
                    onClick={() => toggleSeen(pub.id)}
                    title="Clique para ver quem visualizou esta publicação"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'none',
                      border: 'none',
                      padding: '4px 6px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 400,
                      color: 'var(--text-muted)',
                      transition: 'color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    <Users size={13} style={{ opacity: 0.65 }} />
                    <span>
                      Visto por {readCount} {readCount === 1 ? 'membro' : 'membros'}
                    </span>
                  </button>
                </div>

                {/* Popover / Balão Minimalista exibindo quem visualizou ao clicar */}
                {expandedSeen[pub.id] && (
                  <div
                    style={{
                      marginTop: '8px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.74rem',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <span>
                      <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Visualizado por:</strong>{' '}
                      {pub.readBy && pub.readBy.length > 0
                        ? pub.readBy.join(', ')
                        : 'Nenhum membro confirmou visualização ainda.'}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleSeen(pub.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '11px',
                        padding: '2px 4px',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Conteúdo dos Comentários (Apenas quando expandido) */}
                {expandedComments[pub.id] && (
                  <div
                    style={{
                      marginTop: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    {pub.comments.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          background: 'var(--bg-secondary)',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {c.author}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {new Date(c.createdAt).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
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
                          padding: '10px 14px',
                          borderRadius: '9px',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-secondary)',
                          fontSize: '0.86rem',
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
                          gap: '6px',
                          padding: '10px 18px',
                          borderRadius: '9px',
                          border: 'none',
                          background: 'var(--red)',
                          color: '#fff',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          cursor: isSendingComment[pub.id] ? 'not-allowed' : 'pointer',
                          opacity: isSendingComment[pub.id] ? 0.7 : 1,
                        }}
                      >
                        {isSendingComment[pub.id] ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Send size={14} />
                        )}
                        <span>Responder</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

                {/* Botão Ver Mais (+10) */}
        {hasMore && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 10)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 24px',
                borderRadius: '10px',
                background: 'var(--bg-primary)',
                border: '1.5px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--red)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <ChevronDown size={16} />
              <span>Ver mais publicações (+10) · Exibindo {displayedList.length} de {filteredList.length}</span>
            </button>
          </div>
        )}

        {filteredList.length === 0 && (
          <div
            style={{
              padding: '70px 20px',
              textAlign: 'center',
              background: 'var(--bg-primary)',
              borderRadius: '16px',
              border: '1.5px dashed var(--border)',
            }}
          >
            <StickyNote size={42} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
              Nenhuma publicação encontrada
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0 }}>
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
            style={{
              maxWidth: '680px',
              width: '90%',
              padding: '28px',
              background: 'var(--bg-primary)',
              borderRadius: '18px',
              border: '1px solid var(--border)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.22)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.14rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Criar Nova Publicação
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              {/* Título */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px' }}>
                  Título do Comunicado / Publicação:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Alinhamento de parametrização fiscal na NFe 4.0"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '9px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              {/* Destinatários: Padrão "Todos" limpo */}
              <div
                style={{
                  marginBottom: '14px',
                  background: 'var(--bg-secondary)',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                }}
              >
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '8px' }}>
                  Visibilidade / Destinatários:
                </label>

                <div style={{ display: 'flex', gap: '18px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', cursor: 'pointer', fontWeight: 600 }}>
                    <input
                      type="radio"
                      name="targetType"
                      checked={targetType === 'all'}
                      onChange={() => setTargetType('all')}
                    />
                    <span>Geral (Todos visualizam)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', cursor: 'pointer', fontWeight: 600 }}>
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
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                      Selecione quem receberá o aviso direcionado:
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
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: isChecked ? '1.5px solid var(--red)' : '1px solid var(--border)',
                              background: isChecked ? 'var(--red-soft)' : 'var(--bg-primary)',
                              color: isChecked ? 'var(--red)' : 'var(--text-secondary)',
                              fontSize: '0.8rem',
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

              {/* Mensagem */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px' }}>
                  Mensagem / Detalhes:
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Escreva a mensagem ou comunicado da publicação..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '9px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    fontFamily: 'inherit',
                    lineHeight: 1.55,
                  }}
                />
              </div>

              {/* Anexo de Imagem ou PDF */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px' }}>
                  Anexo Opcional (Imagem ou PDF):
                </label>
                {attachment ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                      {attachment.type === 'image' ? '🖼' : '📄'}
                      <span style={{ fontWeight: 700 }}>{attachment.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachment(null)}
                      style={{ border: 'none', background: 'transparent', color: 'var(--red)', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}
                    >
                      Remover anexo
                    </button>
                  </div>
                ) : (
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px dashed var(--border-strong)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                    }}
                  >
                    <Paperclip size={14} />
                    <span>Anexar Imagem ou Arquivo PDF</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleAttachmentChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '9px',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.86rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '9px 22px',
                    borderRadius: '9px',
                    border: 'none',
                    background: 'var(--red)',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontSize: '0.86rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  <span>Publicar Comunicado</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox para Imagens Anexadas */}
      {lightboxUrl && (
        <div
          className="modal-backdrop"
          onClick={() => setLightboxUrl(null)}
          style={{ zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img
              src={lightboxUrl}
              alt="Ampliado"
              style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '12px', objectFit: 'contain' }}
            />
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              ✕ Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Excluir Publicação (In-App, nativo do site, sem diálogo do Google) */}
      {pubToDelete && (
        <div
          className="review-modal-backdrop"
          onClick={() => !isDeletingPub && setPubToDelete(null)}
          style={{ zIndex: 10000 }}
        >
          <div
            className="review-modal-card"
            style={{ maxWidth: '490px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="review-modal-header" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="review-modal-title-row" style={{ gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--red)',
                  }}
                >
                  <Trash2 size={18} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Excluir Publicação
                </h3>
              </div>
              <button
                type="button"
                className="review-modal-close"
                onClick={() => !isDeletingPub && setPubToDelete(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            <div className="review-modal-body" style={{ padding: '20px' }}>
              <p style={{ margin: '0 0 14px 0', fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                Tem certeza de que deseja excluir permanentemente esta publicação do mural?
              </p>

              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '9px',
                  padding: '12px 14px',
                  marginBottom: '14px',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.94rem', color: 'var(--text-primary)', marginBottom: '5px' }}>
                  {pubToDelete.title}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Por <strong>{pubToDelete.author}</strong> • {new Date(pubToDelete.createdAt).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
              </div>

              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                ⚠️ Esta operação é irreversível. Todos os comentários e confirmações de leitura vinculados também serão excluídos.
              </p>
            </div>

            <div
              className="review-modal-footer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '10px',
                padding: '14px 20px',
                borderTop: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
              }}
            >
              <button
                type="button"
                className="btn-modal-cancel"
                disabled={isDeletingPub}
                onClick={() => setPubToDelete(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: isDeletingPub ? 'not-allowed' : 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingPub}
                onClick={handleConfirmDelete}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 18px',
                  borderRadius: '6px',
                  background: 'var(--red)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: isDeletingPub ? 'not-allowed' : 'pointer',
                  opacity: isDeletingPub ? 0.7 : 1,
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                }}
              >
                {isDeletingPub ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                <span>{isDeletingPub ? 'Excluindo...' : 'Sim, Excluir Publicação'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
