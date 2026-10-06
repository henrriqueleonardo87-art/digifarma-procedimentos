import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  StickyNote,
  Plus,
  Trash2,
  Upload,
  Building,
  Search,
  X,
  Lock,
  Globe,
  ArrowLeft,
} from 'lucide-react';
import type { AppUser } from '../types/auth';

export interface Client {
  id: string;
  name: string;
  document?: string;
  phone?: string;
  city?: string;
  createdAt: string;
}

export type NoteScope = 'geral' | 'pessoal';
export type NoteStatus = 'a_fazer' | 'em_andamento' | 'concluido';
export type NotePriority = 'baixa' | 'media' | 'alta';

export interface TrainingNote {
  id: string;
  title: string;
  content: string;
  scope: NoteScope; // 'geral' ou 'pessoal'
  assignedTo: string | null; // ex: 'Leonardo', 'Icaro', 'Wallace', 'Whitalo' ou null
  author: string;
  clientId: string | null;
  clientName?: string | null;
  images: string[];
  tags: string[];
  status: NoteStatus;
  priority: NotePriority;
  createdAt: string;
  readBy: string[]; // IDs de usuários que já leram
}

interface NotesViewProps {
  currentUser?: AppUser | null;
  onBackToDashboard?: () => void;
  onNotesNotificationChange?: (count: number) => void;
}

const STORAGE_KEY_CLIENTS = 'digifarma_trainer_clients_list';
const STORAGE_KEY_NOTES = 'digifarma_trainer_notes_list';

const INITIAL_CLIENTS: Client[] = [
  { id: 'cli-1', name: 'Drogaria Santa Luzia', document: '12.345.678/0001-90', phone: '(11) 98765-4321', city: 'São Paulo - SP', createdAt: new Date().toISOString() },
  { id: 'cli-2', name: 'Farmácia Popular Centro', document: '98.765.432/0001-10', phone: '(21) 99876-5432', city: 'Rio de Janeiro - RJ', createdAt: new Date().toISOString() },
  { id: 'cli-3', name: 'Drogaria Mais Saúde', document: '45.678.901/0001-23', phone: '(31) 98888-7777', city: 'Belo Horizonte - MG', createdAt: new Date().toISOString() },
];

const INITIAL_NOTES: TrainingNote[] = [
  {
    id: 'note-1',
    title: 'Parametrização de ICMS ST e Alíquotas F7',
    content: 'Cliente teve dúvidas no cálculo da partilha entre estados. Reunião de alinhamento agendada para amanhã às 14h.',
    scope: 'geral',
    assignedTo: null,
    author: 'Leonardo',
    clientId: 'cli-1',
    clientName: 'Drogaria Santa Luzia',
    images: ['https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80'],
    tags: ['Fiscal', 'ICMS', 'Tributário'],
    status: 'em_andamento',
    priority: 'alta',
    createdAt: new Date().toISOString(),
    readBy: [],
  },
  {
    id: 'note-2',
    title: 'Verificar leitor de código de barras 2D para SNGPC',
    content: 'Configurar porta serial COM3 para o leitor Honeywell no balcão de controlados.',
    scope: 'pessoal',
    assignedTo: 'Leonardo',
    author: 'Icaro',
    clientId: 'cli-2',
    clientName: 'Farmácia Popular Centro',
    images: [],
    tags: ['SNGPC', 'Hardware', 'Balcão'],
    status: 'a_fazer',
    priority: 'media',
    createdAt: new Date().toISOString(),
    readBy: [],
  },
  {
    id: 'note-3',
    title: 'Treinamento de Fechamento de Caixa Cego concluído',
    content: 'Equipe de operadores treinada e homologada nas 4 estações de atendimento.',
    scope: 'geral',
    assignedTo: null,
    author: 'Wallace',
    clientId: 'cli-3',
    clientName: 'Drogaria Mais Saúde',
    images: [],
    tags: ['Caixa', 'Treinamento', 'Concluído'],
    status: 'concluido',
    priority: 'baixa',
    createdAt: new Date().toISOString(),
    readBy: ['Leonardo'],
  },
];

const ACTIVE_TEAM_MEMBERS = ['Leonardo', 'Icaro', 'Wallace', 'Whitalo'];

export const NotesView: React.FC<NotesViewProps> = ({
  currentUser,
  onBackToDashboard,
  onNotesNotificationChange,
}) => {
  const currentUserName = currentUser?.name || currentUser?.username || 'Leonardo';

  // Persistência
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CLIENTS);
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const [notes, setNotes] = useState<TrainingNote[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_NOTES);
    return saved ? JSON.parse(saved) : INITIAL_NOTES;
  });

  // Filtros
  const [activeTab, setActiveTab] = useState<'geral' | 'pessoal'>('geral');
  const [selectedClientId, setSelectedClientId] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Modais
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Form State: Nova Anotação
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteScope, setNoteScope] = useState<NoteScope>('geral');
  const [noteAssignedTo, setNoteAssignedTo] = useState<string>('nenhum');
  const [noteClientId, setNoteClientId] = useState<string>('nenhum');
  const [noteTags, setNoteTags] = useState('');
  const [noteStatus, setNoteStatus] = useState<NoteStatus>('a_fazer');
  const [notePriority, setNotePriority] = useState<NotePriority>('media');
  const [noteImages, setNoteImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State: Novo Cliente
  const [newClientName, setNewClientName] = useState('');
  const [newClientDoc, setNewClientDoc] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientCity, setNewClientCity] = useState('');

  // Salvar no localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));

    // Notificações: anotações atribuídas ao usuário atual ainda não lidas
    const unreadCount = notes.filter(
      (n) =>
        (n.scope === 'pessoal' || n.assignedTo === currentUserName) &&
        n.assignedTo === currentUserName &&
        !n.readBy.includes(currentUserName)
    ).length;

    onNotesNotificationChange?.(unreadCount);
  }, [notes, currentUserName, onNotesNotificationChange]);

  // Contagem para badges de Geral vs Pessoal
  const generalNotesCount = useMemo(() => {
    return notes.filter((n) => n.scope === 'geral').length;
  }, [notes]);

  const personalNotesCount = useMemo(() => {
    return notes.filter(
      (n) => n.scope === 'pessoal' || n.assignedTo === currentUserName || n.author === currentUserName
    ).length;
  }, [notes, currentUserName]);

  // Anotações filtradas
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      // Filtro de aba Geral vs Pessoal
      if (activeTab === 'geral') {
        if (n.scope !== 'geral') return false;
      } else {
        // Pessoal: se for escopo pessoal OU direcionado ao usuário atual OU criado por ele
        const isForMe = n.assignedTo === currentUserName;
        const isMine = n.author === currentUserName;
        const isPersonalScope = n.scope === 'pessoal';
        if (!isForMe && !isMine && !isPersonalScope) return false;
      }

      // Filtro de Cliente
      if (selectedClientId !== 'todos') {
        if (n.clientId !== selectedClientId) return false;
      }

      // Filtro de Tag
      if (selectedTag && !n.tags.includes(selectedTag)) {
        return false;
      }

      // Filtro de Busca
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesTitle = n.title.toLowerCase().includes(q);
        const matchesContent = n.content.toLowerCase().includes(q);
        const matchesClient = n.clientName?.toLowerCase().includes(q);
        const matchesTag = n.tags.some((t) => t.toLowerCase().includes(q));
        const matchesAuthor = n.author.toLowerCase().includes(q);
        if (!matchesTitle && !matchesContent && !matchesClient && !matchesTag && !matchesAuthor) {
          return false;
        }
      }

      return true;
    });
  }, [notes, activeTab, selectedClientId, selectedTag, searchTerm, currentUserName]);

  // Separar em colunas Trello
  const colTodo = useMemo(() => filteredNotes.filter((n) => n.status === 'a_fazer'), [filteredNotes]);
  const colProgress = useMemo(() => filteredNotes.filter((n) => n.status === 'em_andamento'), [filteredNotes]);
  const colDone = useMemo(() => filteredNotes.filter((n) => n.status === 'concluido'), [filteredNotes]);

  // Tags disponíveis
  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [notes]);

  // Upload de Imagens da Anotação
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setNoteImages((prev) => [...prev, dataUrl]);
      }
    };
    reader.readAsDataURL(file);
  };

  // Criar Cliente
  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    const newClient: Client = {
      id: `cli-${Date.now()}`,
      name: newClientName.trim(),
      document: newClientDoc.trim() || undefined,
      phone: newClientPhone.trim() || undefined,
      city: newClientCity.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    setClients((prev) => [newClient, ...prev]);
    setNewClientName('');
    setNewClientDoc('');
    setNewClientPhone('');
    setNewClientCity('');
    setIsClientModalOpen(false);
  };

  // Criar Anotação
  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;

    const tagsArr = noteTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const clientObj = clients.find((c) => c.id === noteClientId) || null;

    const created: TrainingNote = {
      id: `note-${Date.now()}`,
      title: noteTitle.trim(),
      content: noteContent.trim(),
      scope: noteScope,
      assignedTo: noteAssignedTo !== 'nenhum' ? noteAssignedTo : null,
      author: currentUserName,
      clientId: clientObj ? clientObj.id : null,
      clientName: clientObj ? clientObj.name : null,
      images: noteImages,
      tags: tagsArr.length > 0 ? tagsArr : ['Geral'],
      status: noteStatus,
      priority: notePriority,
      createdAt: new Date().toISOString(),
      readBy: [currentUserName],
    };

    setNotes((prev) => [created, ...prev]);
    setNoteTitle('');
    setNoteContent('');
    setNoteTags('');
    setNoteImages([]);
    setNoteAssignedTo('nenhum');
    setNoteClientId('nenhum');
    setIsNewNoteModalOpen(false);
  };

  // Mover Status do Card
  const handleMoveStatus = (noteId: string, newStatus: NoteStatus) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === noteId) {
          const readBy = Array.from(new Set([...n.readBy, currentUserName]));
          return { ...n, status: newStatus, readBy };
        }
        return n;
      })
    );
  };

  // Excluir Anotação
  const handleDeleteNote = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Deseja excluir esta anotação?')) {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    }
  };

  // Marcar como lida
  const handleMarkAsRead = (noteId: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === noteId && !n.readBy.includes(currentUserName)) {
          return { ...n, readBy: [...n.readBy, currentUserName] };
        }
        return n;
      })
    );
  };

  return (
    <div className="modules-drilldown-container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '16px 20px' }}>
      {/* Topo / Hero */}
      <div className="version-modules-hero" style={{ marginBottom: '1.5rem' }}>
        <div className="version-hero-badge" style={{ background: 'var(--red-soft)', color: 'var(--red)', borderColor: 'rgba(231, 76, 60, 0.25)' }}>
          <StickyNote size={13} />
          <span>PAINEL DO TREINADOR · ANOTAÇÕES &amp; TRELLO</span>
        </div>
        <h1 className="version-hero-title">Anotações &amp; Clientes</h1>
        <p className="version-hero-sub">
          Organização operacional com cards estilo Trello, anotações direcionadas para colegas e histórico por cliente.
        </p>

        {/* Botões de Ação Superior */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
          {onBackToDashboard && (
            <button
              type="button"
              onClick={onBackToDashboard}
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1.5px solid var(--border)',
                borderRadius: '10px',
                padding: '9px 16px',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ArrowLeft size={16} />
              <span>Início</span>
            </button>
          )}

          <button
            type="button"
            className="btn-import-pop-hero"
            onClick={() => {
              setNoteScope(activeTab);
              setIsNewNoteModalOpen(true);
            }}
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
            <Plus size={16} />
            <span>+ Nova Anotação</span>
          </button>

          <button
            type="button"
            onClick={() => setIsClientModalOpen(true)}
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
            <Building size={16} color="var(--red)" />
            <span>Gerenciar Clientes ({clients.length})</span>
          </button>
        </div>
      </div>

      {/* ── SELETOR PRINCIPAL: CARD GERAL VS CARD PESSOAL (CONFORME SOLICITADO) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        {/* Card Geral */}
        <div
          onClick={() => setActiveTab('geral')}
          style={{
            background: activeTab === 'geral' ? 'var(--red-soft)' : 'var(--bg-primary)',
            border: activeTab === 'geral' ? '2px solid var(--red)' : '1px solid var(--border)',
            borderRadius: '14px',
            padding: '16px 20px',
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            boxShadow: activeTab === 'geral' ? '0 4px 16px rgba(231, 76, 60, 0.15)' : 'var(--shadow-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: activeTab === 'geral' ? 'var(--red)' : 'var(--bg-tertiary)',
                color: activeTab === 'geral' ? '#fff' : 'var(--red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Globe size={22} />
            </div>
            <div>
              <strong style={{ fontSize: '1rem', color: 'var(--text-primary)', display: 'block' }}>
                Anotações Gerais
              </strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Compartilhadas com toda a equipe do ERP
              </span>
            </div>
          </div>

          <span
            style={{
              fontSize: '0.82rem',
              fontWeight: 800,
              background: activeTab === 'geral' ? 'var(--red)' : 'var(--bg-secondary)',
              color: activeTab === 'geral' ? '#fff' : 'var(--text-primary)',
              padding: '4px 10px',
              borderRadius: '999px',
            }}
          >
            {generalNotesCount}
          </span>
        </div>

        {/* Card Pessoal */}
        <div
          onClick={() => setActiveTab('pessoal')}
          style={{
            background: activeTab === 'pessoal' ? 'var(--red-soft)' : 'var(--bg-primary)',
            border: activeTab === 'pessoal' ? '2px solid var(--red)' : '1px solid var(--border)',
            borderRadius: '14px',
            padding: '16px 20px',
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            boxShadow: activeTab === 'pessoal' ? '0 4px 16px rgba(231, 76, 60, 0.15)' : 'var(--shadow-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: activeTab === 'pessoal' ? 'var(--red)' : 'var(--bg-tertiary)',
                color: activeTab === 'pessoal' ? '#fff' : 'var(--red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Lock size={22} />
            </div>
            <div>
              <strong style={{ fontSize: '1rem', color: 'var(--text-primary)', display: 'block' }}>
                Minhas Anotações &amp; Recados
              </strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Seu controle pessoal e notas direcionadas a você
              </span>
            </div>
          </div>

          <span
            style={{
              fontSize: '0.82rem',
              fontWeight: 800,
              background: activeTab === 'pessoal' ? 'var(--red)' : 'var(--bg-secondary)',
              color: activeTab === 'pessoal' ? '#fff' : 'var(--text-primary)',
              padding: '4px 10px',
              borderRadius: '999px',
            }}
          >
            {personalNotesCount}
          </span>
        </div>
      </div>

      {/* ── BARRA DE FILTROS: CLIENTES, BUSCA E TAGS ── */}
      <div
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 300px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            className="form-input"
            placeholder="Pesquisar anotações, clientes, palavras-chave..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', fontSize: '0.82rem', padding: '6px 10px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Seletor de Cliente */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Cliente:</span>
            <select
              className="form-select"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              style={{ fontSize: '0.8rem', padding: '5px 10px', minWidth: '160px' }}
            >
              <option value="todos">Todos os Clientes</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tag:</span>
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                style={{
                  fontSize: '0.7rem',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: selectedTag === null ? '1px solid var(--red)' : '1px solid var(--border)',
                  background: selectedTag === null ? 'var(--red)' : 'var(--bg-secondary)',
                  color: selectedTag === null ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Todas
              </button>
              {allTags.slice(0, 4).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTag(t === selectedTag ? null : t)}
                  style={{
                    fontSize: '0.7rem',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: selectedTag === t ? '1px solid var(--red)' : '1px solid var(--border)',
                    background: selectedTag === t ? 'var(--red)' : 'var(--bg-secondary)',
                    color: selectedTag === t ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  #{t}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── QUADRO ESTILO TRELLO (COLUNAS: A FAZER, EM ANDAMENTO, CONCLUÍDO) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
          gap: '16px',
          alignItems: 'flex-start',
        }}
      >
        {/* Coluna 1: A Fazer */}
        <TrelloColumn
          title="A Fazer"
          color="#ef4444"
          badgeCount={colTodo.length}
          notes={colTodo}
          currentUserName={currentUserName}
          onMove={handleMoveStatus}
          onDelete={handleDeleteNote}
          onImagePreview={setPreviewImage}
          onMarkRead={handleMarkAsRead}
        />

        {/* Coluna 2: Em Andamento */}
        <TrelloColumn
          title="Em Andamento"
          color="#f59e0b"
          badgeCount={colProgress.length}
          notes={colProgress}
          currentUserName={currentUserName}
          onMove={handleMoveStatus}
          onDelete={handleDeleteNote}
          onImagePreview={setPreviewImage}
          onMarkRead={handleMarkAsRead}
        />

        {/* Coluna 3: Concluído */}
        <TrelloColumn
          title="Concluído"
          color="#10b981"
          badgeCount={colDone.length}
          notes={colDone}
          currentUserName={currentUserName}
          onMove={handleMoveStatus}
          onDelete={handleDeleteNote}
          onImagePreview={setPreviewImage}
          onMarkRead={handleMarkAsRead}
        />
      </div>

      {/* ── MODAL: NOVA ANOTAÇÃO ── */}
      {isNewNoteModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setIsNewNoteModalOpen(false)}
        >
          <div
            style={{
              background: 'var(--bg-primary)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              padding: '24px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
              Nova Anotação de Treinamento
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
              Crie uma anotação, associe a um cliente e direcione para você ou outros colegas.
            </p>

            <form onSubmit={handleCreateNote}>
              {/* Título */}
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Título da Anotação</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Dúvida no Balcão F7, Alíquota de PIS/COFINS..."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {/* Descrição / Conteúdo */}
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Conteúdo e Detalhes</label>
                <textarea
                  rows={3}
                  className="form-input"
                  placeholder="Escreva a anotação, instruções de atendimento ou pendências..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  required
                />
              </div>

              {/* Escopo & Direcionamento */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Visibilidade</label>
                  <select
                    className="form-select"
                    value={noteScope}
                    onChange={(e) => setNoteScope(e.target.value as NoteScope)}
                  >
                    <option value="geral">Geral (Toda a Equipe)</option>
                    <option value="pessoal">Pessoal (Controle Próprio)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Direcionar para Colega</label>
                  <select
                    className="form-select"
                    value={noteAssignedTo}
                    onChange={(e) => setNoteAssignedTo(e.target.value)}
                  >
                    <option value="nenhum">Ninguém (Geral / Meu)</option>
                    {ACTIVE_TEAM_MEMBERS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cliente & Prioridade */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Cliente Vinculado</label>
                  <select
                    className="form-select"
                    value={noteClientId}
                    onChange={(e) => setNoteClientId(e.target.value)}
                  >
                    <option value="nenhum">Nenhum cliente vinculado</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Prioridade</label>
                  <select
                    className="form-select"
                    value={notePriority}
                    onChange={(e) => setNotePriority(e.target.value as NotePriority)}
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
              </div>

              {/* Tags & Status Inicial */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Tags (separadas por vírgula)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Fiscal, PDV, Estoque..."
                    value={noteTags}
                    onChange={(e) => setNoteTags(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Coluna Trello</label>
                  <select
                    className="form-select"
                    value={noteStatus}
                    onChange={(e) => setNoteStatus(e.target.value as NoteStatus)}
                  >
                    <option value="a_fazer">A Fazer</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="concluido">Concluído</option>
                  </select>
                </div>
              </div>

              {/* Anexar Imagens */}
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label className="form-label">Imagens / Prints do Atendimento</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1.5px dashed var(--red)',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--red)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Upload size={14} />
                  <span>+ Adicionar Print ou Imagem</span>
                </button>

                {noteImages.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                    {noteImages.map((img, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <img src={img} alt="Thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => setNoteImages((prev) => prev.filter((_, i) => i !== idx))}
                          style={{
                            position: 'absolute',
                            top: 2,
                            right: 2,
                            background: 'rgba(0,0,0,0.7)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            display: 'grid',
                            placeItems: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ações */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsNewNoteModalOpen(false)}
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
                    padding: '8px 20px',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Salvar Anotação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: GERENCIAR CLIENTES ── */}
      {isClientModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setIsClientModalOpen(false)}
        >
          <div
            style={{
              background: 'var(--bg-primary)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              padding: '24px',
              width: '100%',
              maxWidth: '620px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Clientes Cadastrados
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Vincule anotações a drogarias e farmácias atendidas.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsClientModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Formulário Novo Cliente */}
            <form onSubmit={handleCreateClient} style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '18px' }}>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label className="form-label">Nome da Farmácia / Drogaria</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Drogaria Boa Saúde, Farmácia Estrela..."
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <div>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="CNPJ ou Código"
                    value={newClientDoc}
                    onChange={(e) => setNewClientDoc(e.target.value)}
                    style={{ fontSize: '0.8rem' }}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Telefone / Contato"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    style={{ fontSize: '0.8rem' }}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Cidade - UF"
                    value={newClientCity}
                    onChange={(e) => setNewClientCity(e.target.value)}
                    style={{ fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  style={{
                    background: 'var(--red)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 16px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cadastrar Cliente
                </button>
              </div>
            </form>

            {/* Lista de Clientes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {clients.map((c) => {
                const notesOfClient = notes.filter((n) => n.clientId === c.id).length;
                return (
                  <div
                    key={c.id}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block' }}>
                        {c.name}
                      </strong>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {c.city || 'Sem cidade'} {c.phone ? `· ${c.phone}` : ''}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'var(--bg-tertiary)', padding: '3px 8px', borderRadius: '6px' }}>
                        {notesOfClient} anotações
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClientId(c.id);
                          setIsClientModalOpen(false);
                        }}
                        style={{
                          background: 'none',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '0.72rem',
                          color: 'var(--red)',
                          cursor: 'pointer',
                          fontWeight: 700,
                        }}
                      >
                        Filtrar Notas
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── PREVIEW DE IMAGEM AMPLIADA ── */}
      {previewImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Enlarged preview"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '10px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
          />
        </div>
      )}
    </div>
  );
};

// Subcomponente de Coluna do Quadro Trello
interface TrelloColumnProps {
  title: string;
  color: string;
  badgeCount: number;
  notes: TrainingNote[];
  currentUserName: string;
  onMove: (noteId: string, newStatus: NoteStatus) => void;
  onDelete: (noteId: string, e: React.MouseEvent) => void;
  onImagePreview: (url: string) => void;
  onMarkRead: (noteId: string) => void;
}

const TrelloColumn: React.FC<TrelloColumnProps> = ({
  title,
  color,
  badgeCount,
  notes,
  currentUserName,
  onMove,
  onDelete,
  onImagePreview,
  onMarkRead,
}) => {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        minHeight: '400px',
      }}
    >
      {/* Cabeçalho da Coluna */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
          <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{title}</strong>
        </div>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            background: 'var(--bg-primary)',
            color: 'var(--text-secondary)',
            padding: '2px 8px',
            borderRadius: '10px',
            border: '1px solid var(--border)',
          }}
        >
          {badgeCount}
        </span>
      </div>

      {/* Cards na Coluna */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
        {notes.length === 0 ? (
          <div
            style={{
              padding: '24px 12px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              border: '1px dashed var(--border)',
              borderRadius: '10px',
            }}
          >
            Nenhuma anotação nesta coluna
          </div>
        ) : (
          notes.map((note) => {
            const isAssignedToMe = note.assignedTo === currentUserName;
            const isUnread = isAssignedToMe && !note.readBy.includes(currentUserName);

            return (
              <div
                key={note.id}
                onClick={() => onMarkRead(note.id)}
                style={{
                  background: 'var(--bg-primary)',
                  border: isUnread ? '1.5px solid var(--red)' : '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  boxShadow: 'var(--shadow-subtle)',
                  transition: 'all 0.16s ease',
                  position: 'relative',
                }}
              >
                {/* Linha Superior: Tags & Prioridade */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {note.tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: '0.64rem',
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-secondary)',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          fontWeight: 600,
                        }}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '0.64rem',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        background:
                          note.priority === 'alta'
                            ? 'rgba(239, 68, 68, 0.15)'
                            : note.priority === 'media'
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(16, 185, 129, 0.15)',
                        color:
                          note.priority === 'alta'
                            ? 'var(--red)'
                            : note.priority === 'media'
                            ? '#f59e0b'
                            : '#10b981',
                      }}
                    >
                      {note.priority}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => onDelete(note.id, e)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '1px' }}
                      title="Excluir"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Cliente Vinculado */}
                {note.clientName && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <Building size={11} color="var(--red)" />
                    <span style={{ fontSize: '0.72rem', color: 'var(--red)', fontWeight: 700 }}>
                      {note.clientName}
                    </span>
                  </div>
                )}

                {/* Título & Conteúdo */}
                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {note.title}
                </h4>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {note.content}
                </p>

                {/* Miniaturas de Imagens */}
                {note.images.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    {note.images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt="Anexo"
                        onClick={(e) => {
                          e.stopPropagation();
                          onImagePreview(img);
                        }}
                        style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover', cursor: 'zoom-in', border: '1px solid var(--border)' }}
                      />
                    ))}
                  </div>
                )}

                {/* Rodapé do Card: Responsável / Atribuído */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>Por {note.author}</span>
                    {note.assignedTo && (
                      <span
                        style={{
                          background: note.assignedTo === currentUserName ? 'var(--red-soft)' : 'var(--bg-tertiary)',
                          color: note.assignedTo === currentUserName ? 'var(--red)' : 'var(--text-primary)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontWeight: 700,
                        }}
                      >
                        🎯 {note.assignedTo}
                      </span>
                    )}
                  </div>

                  {/* Botões Rápidos de Mudar Coluna */}
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {note.status !== 'a_fazer' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMove(note.id, 'a_fazer');
                        }}
                        title="Mover para A Fazer"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.65rem', padding: '1px 5px', cursor: 'pointer' }}
                      >
                        ←
                      </button>
                    )}
                    {note.status !== 'em_andamento' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMove(note.id, 'em_andamento');
                        }}
                        title="Mover para Em Andamento"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.65rem', padding: '1px 5px', cursor: 'pointer' }}
                      >
                        ⚡
                      </button>
                    )}
                    {note.status !== 'concluido' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMove(note.id, 'concluido');
                        }}
                        title="Concluir"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.65rem', padding: '1px 5px', cursor: 'pointer', color: '#10b981' }}
                      >
                        ✓
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
