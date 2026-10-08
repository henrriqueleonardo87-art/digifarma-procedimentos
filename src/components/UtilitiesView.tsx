import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Search,
  X,
  Check,
  KeyRound,
  UserPlus,
  FolderPlus,
  Boxes,
  ShoppingCart,
  CreditCard,
  FileText,
  Package,
  ShieldCheck,
  Settings as SettingsIcon,
  Truck,
  Wrench,
  Database,
  BarChart3,
  Layers,
  Lightbulb,
  MessageCircle,
  Clock,
  Lock,
  Send,
} from 'lucide-react';
import type { SystemMenu, SubmenuItem } from '../types/procedure';
import type { AppUser } from '../types/auth';
import { getLocalUsers, addUser, deleteUser, resetUserPasswordDirect } from '../lib/authService';
import {
  fetchSugestoes,
  createSugestao,
  updateSugestaoStatus,
  addSugestaoComment,
  subscribeSugestoes,
  STATUS_LABELS,
  STATUS_COLORS,
  type SugestaoItem,
} from '../lib/sugestoesService';

// Tipos para Clientes e Colaboradores
export interface PharmacyCollaborator {
  id: string;
  name: string;
  role: string; // Cargo Farmacêutico
  phone?: string;
  email?: string;
}

export interface ClientProfile {
  id: string;
  clientId: string; // Código Interno do Cliente
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  phone: string;
  notes: string;
  collaborators: PharmacyCollaborator[];
  createdAt: string;
}

const PHARMACY_ROLES = [
  'Farmacêutico(a) Responsável Técnico (RT)',
  'Farmacêutico(a) Substituto / Assistente',
  'Balconista / Atendente de Farmácia',
  'Operador(a) de Caixa',
  'Gerente de Farmácia / Loja',
  'Comprador(a) / Estoquista',
  'Entregador(a) / Delivery',
  'Auxiliar de Farmácia',
  'Outro',
];

const AVAILABLE_ICONS = [
  { name: 'FolderPlus', label: 'Cadastros e Pastas' },
  { name: 'Boxes', label: 'Estoque e Armazém' },
  { name: 'ShoppingCart', label: 'Vendas e Balcão' },
  { name: 'CreditCard', label: 'Caixa e Financeiro' },
  { name: 'FileText', label: 'Fiscal e Tributário' },
  { name: 'Package', label: 'Produtos e Itens' },
  { name: 'Users', label: 'Clientes e Equipe' },
  { name: 'ShieldCheck', label: 'SNGPC e Controlados' },
  { name: 'Settings', label: 'Configurações e Sistema' },
  { name: 'Truck', label: 'Fornecedores e Logística' },
  { name: 'Wrench', label: 'Utilitários e Manutenção' },
  { name: 'Database', label: 'Banco de Dados' },
  { name: 'BarChart3', label: 'Relatórios e Dashboards' },
  { name: 'Layers', label: 'Outros Módulos' },
];

function renderIconByName(name?: string, size = 18) {
  switch (name) {
    case 'FolderPlus': return <FolderPlus size={size} />;
    case 'Boxes': return <Boxes size={size} />;
    case 'ShoppingCart': return <ShoppingCart size={size} />;
    case 'CreditCard': return <CreditCard size={size} />;
    case 'FileText': return <FileText size={size} />;
    case 'Package': return <Package size={size} />;
    case 'Users': return <Users size={size} />;
    case 'ShieldCheck': return <ShieldCheck size={size} />;
    case 'Settings': return <SettingsIcon size={size} />;
    case 'Truck': return <Truck size={size} />;
    case 'Wrench': return <Wrench size={size} />;
    case 'Database': return <Database size={size} />;
    case 'BarChart3': return <BarChart3 size={size} />;
    default: return <Layers size={size} />;
  }
}

interface UtilitiesViewProps {
  menus: SystemMenu[];
  onSaveMenus: (menus: SystemMenu[]) => Promise<void>;
  currentUser?: AppUser | null;
  onBackToDashboard?: () => void;
}

const STORAGE_KEY_CLIENTS = 'digifarma_clients_registry_v2';

const INITIAL_CLIENTS: ClientProfile[] = [
  {
    id: 'cli-1',
    clientId: 'DF-0142',
    cnpj: '12.345.678/0001-90',
    razaoSocial: 'Drogaria Santa Luzia Ltda',
    nomeFantasia: 'Farmácia Santa Luzia - Matriz',
    phone: '(11) 98765-4321',
    notes: 'Cliente em implantação do módulo V10 Fiscal e SNGPC.',
    createdAt: new Date().toISOString(),
    collaborators: [
      {
        id: 'colab-1',
        name: 'Dra. Camila Silveira',
        role: 'Farmacêutico(a) Responsável Técnico (RT)',
        phone: '(11) 99111-2233',
        email: 'camila.rt@santaluzia.com.br',
      },
      {
        id: 'colab-2',
        name: 'Marcos Vinicius',
        role: 'Balconista / Atendente de Farmácia',
        phone: '(11) 99222-3344',
      },
      {
        id: 'colab-3',
        name: 'Patrícia Souza',
        role: 'Operador(a) de Caixa',
      },
    ],
  },
  {
    id: 'cli-2',
    clientId: 'DF-0208',
    cnpj: '98.765.432/0001-10',
    razaoSocial: 'Farmácia Popular Centro Eireli',
    nomeFantasia: 'Drogaria Centro Saúde',
    phone: '(21) 99876-5432',
    notes: 'Configurar integração de TEF com PinPad serial.',
    createdAt: new Date().toISOString(),
    collaborators: [
      {
        id: 'colab-4',
        name: 'Dr. Roberto Mendes',
        role: 'Farmacêutico(a) Responsável Técnico (RT)',
        phone: '(21) 98888-1111',
      },
      {
        id: 'colab-5',
        name: 'Ana Cláudia',
        role: 'Gerente de Farmácia / Loja',
        phone: '(21) 98777-2222',
      },
    ],
  },
];

export const UtilitiesView: React.FC<UtilitiesViewProps> = ({
  menus,
  onSaveMenus,
  currentUser,
  onBackToDashboard: _onBackToDashboard,
}) => {
  const [activeTab, setActiveTab] = useState<'modules' | 'clients' | 'users' | 'sugestoes'>('modules');


  // ----------------------------------------------------
  // ABA 4: SUGESTÕES DE MELHORIAS
  // ----------------------------------------------------
  const [sugestoes, setSugestoes] = useState<SugestaoItem[]>([]);
  const [selectedSugestao, setSelectedSugestao] = useState<SugestaoItem | null>(null);
  const [isNewSugestaoModalOpen, setIsNewSugestaoModalOpen] = useState(false);
  const [newSugTitle, setNewSugTitle] = useState('');
  const [newSugDesc, setNewSugDesc] = useState('');
  const [newSugCategory, setNewSugCategory] = useState('Geral');
  const [sugSearch, setSugSearch] = useState('');
  const [sugStatusFilter, setSugStatusFilter] = useState<'all' | SugestaoItem['status']>('all');
  const [newCommentText, setNewCommentText] = useState('');
  const [newTimelineStatus, setNewTimelineStatus] = useState<SugestaoItem['status']>('em_analise');
  const [newTimelineNote, setNewTimelineNote] = useState('');
  const [isSubmittingTimeline, setIsSubmittingTimeline] = useState(false);

  const isLeonardo = useMemo(() => {
    if (!currentUser) return false;
    const u = (currentUser.username || '').toLowerCase();
    const n = (currentUser.name || '').toLowerCase();
    return u === 'leonardo' || n.includes('leonardo');
  }, [currentUser]);

  useEffect(() => {
    let isMounted = true;
    fetchSugestoes().then((items: SugestaoItem[]) => {
      if (isMounted) setSugestoes(items);
    });
    const unsubscribe = subscribeSugestoes((items: SugestaoItem[]) => {
      if (isMounted) {
        setSugestoes(items);
        if (selectedSugestao) {
          const updatedTarget = items.find((s: SugestaoItem) => s.id === selectedSugestao.id);
          if (updatedTarget) setSelectedSugestao(updatedTarget);
        }
      }
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [selectedSugestao?.id]);

  const handleCreateSugestao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSugTitle.trim() || !newSugDesc.trim()) return;

    const authorName = currentUser?.name || currentUser?.username || 'Colaborador Digifarma';
    const newItem: SugestaoItem = {
      id: `sug-${Date.now()}`,
      title: newSugTitle.trim(),
      description: newSugDesc.trim(),
      category: newSugCategory,
      author: authorName,
      status: 'enviada',
      timeline: [
        {
          id: `tl-${Date.now()}`,
          status: 'enviada',
          author: authorName,
          note: 'Sugestão registrada para avaliação da equipe.',
          createdAt: new Date().toISOString(),
        },
      ],
      comments: [],
      createdAt: new Date().toISOString(),
    };

    await createSugestao(newItem);
    setSugestoes((prev) => [newItem, ...prev.filter((s) => s.id !== newItem.id)]);
    setSelectedSugestao(newItem);
    setIsNewSugestaoModalOpen(false);
    setNewSugTitle('');
    setNewSugDesc('');
    setNewSugCategory('Geral');
  };

  const handleAddComment = async (sugId: string) => {
    if (!newCommentText.trim()) return;
    const authorName = currentUser?.name || currentUser?.username || 'Equipe';
    const comment = {
      id: `c-${Date.now()}`,
      author: authorName,
      content: newCommentText.trim(),
      createdAt: new Date().toISOString(),
    };
    await addSugestaoComment(sugId, comment);
    setNewCommentText('');
    setSugestoes((prev) =>
      prev.map((s) =>
        s.id === sugId ? { ...s, comments: [...s.comments, comment] } : s
      )
    );
    if (selectedSugestao?.id === sugId) {
      setSelectedSugestao((prev) =>
        prev ? { ...prev, comments: [...prev.comments, comment] } : null
      );
    }
  };

  const handleAdvanceTimeline = async (sugId: string) => {
    if (!isLeonardo) return;
    setIsSubmittingTimeline(true);
    try {
      const authorName = currentUser?.name || 'Leonardo Trevas';
      await updateSugestaoStatus(
        sugId,
        newTimelineStatus,
        authorName,
        newTimelineNote.trim() || undefined
      );
      const updated = await fetchSugestoes();
      setSugestoes(updated);
      const found = updated.find((s) => s.id === sugId);
      if (found) setSelectedSugestao(found);
      setNewTimelineNote('');
    } finally {
      setIsSubmittingTimeline(false);
    }
  };

  const filteredSugestoes = useMemo(() => {
    return sugestoes.filter((s) => {
      const matchesSearch =
        s.title.toLowerCase().includes(sugSearch.toLowerCase()) ||
        s.description.toLowerCase().includes(sugSearch.toLowerCase()) ||
        s.author.toLowerCase().includes(sugSearch.toLowerCase());
      const matchesStatus =
        sugStatusFilter === 'all' || s.status === sugStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sugestoes, sugSearch, sugStatusFilter]);

  // ----------------------------------------------------
  // ABA 1: MÓDULOS
  // ----------------------------------------------------
  const [localMenus, setLocalMenus] = useState<SystemMenu[]>(menus);
  const [selectedVersion, setSelectedVersion] = useState<'v10' | 'classico'>('v10');
  const [editingMenu, setEditingMenu] = useState<SystemMenu | null>(null);
  const [newSubmenuTitle, setNewSubmenuTitle] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setLocalMenus(menus);
  }, [menus]);

  const versionMenus = useMemo(() => {
    return localMenus.filter(
      (m) => (m.version || 'v10') === (selectedVersion === 'classico' ? 'r78' : 'v10')
    );
  }, [localMenus, selectedVersion]);

  const handleSaveModules = async () => {
    await onSaveMenus(localMenus);
    setSaveSuccessMsg('Estrutura de módulos salva com sucesso!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleAddModule = () => {
    const newMenu: SystemMenu = {
      id: `m-${Date.now()}`,
      label: 'Novo Módulo',
      icon: 'Layers',
      version: selectedVersion === 'classico' ? 'r78' : 'v10',
      submenus: [],
    };
    const updated = [...localMenus, newMenu];
    setLocalMenus(updated);
    setEditingMenu(newMenu);
  };

  const handleDeleteModule = (id: string) => {
    if (confirm('Deseja excluir este módulo?')) {
      const updated = localMenus.filter((m) => m.id !== id);
      setLocalMenus(updated);
      if (editingMenu?.id === id) setEditingMenu(null);
    }
  };

  const handleAddSubmenu = () => {
    if (!editingMenu || !newSubmenuTitle.trim()) return;
    const newSub: SubmenuItem = {
      id: `sub-${Date.now()}`,
      label: newSubmenuTitle.trim(),
    };
    const updatedMenu = {
      ...editingMenu,
      submenus: [...(editingMenu.submenus || []), newSub],
    };
    setEditingMenu(updatedMenu);
    setLocalMenus((prev) => prev.map((m) => (m.id === updatedMenu.id ? updatedMenu : m)));
    setNewSubmenuTitle('');
  };

  const handleDeleteSubmenu = (subId: string) => {
    if (!editingMenu) return;
    const updatedMenu = {
      ...editingMenu,
      submenus: (editingMenu.submenus || []).filter((s) => s.id !== subId),
    };
    setEditingMenu(updatedMenu);
    setLocalMenus((prev) => prev.map((m) => (m.id === updatedMenu.id ? updatedMenu : m)));
  };

  // ----------------------------------------------------
  // ABA 2: CADASTRO DE CLIENTES & COLABORADORES
  // ----------------------------------------------------
  const [clients, setClients] = useState<ClientProfile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CLIENTS);
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });
  const [clientSearch, setClientSearch] = useState('');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientProfile | null>(null);

  // Form states do cliente
  const [clientCnpj, setClientCnpj] = useState('');
  const [clientRazao, setClientRazao] = useState('');
  const [clientFantasia, setClientFantasia] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientIdCode, setClientIdCode] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [clientColabs, setClientColabs] = useState<PharmacyCollaborator[]>([]);

  // Subform para adicionar colaborador
  const [colabName, setColabName] = useState('');
  const [colabRole, setColabRole] = useState(PHARMACY_ROLES[0]);
  const [colabPhone, setColabPhone] = useState('');
  const [colabEmail, setColabEmail] = useState('');

  const saveClientsList = (updated: ClientProfile[]) => {
    setClients(updated);
    localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(updated));
  };

  const handleOpenClientModal = (cli?: ClientProfile) => {
    if (cli) {
      setEditingClient(cli);
      setClientCnpj(cli.cnpj);
      setClientRazao(cli.razaoSocial);
      setClientFantasia(cli.nomeFantasia);
      setClientPhone(cli.phone);
      setClientIdCode(cli.clientId);
      setClientNotes(cli.notes);
      setClientColabs(cli.collaborators || []);
    } else {
      setEditingClient(null);
      setClientCnpj('');
      setClientRazao('');
      setClientFantasia('');
      setClientPhone('');
      setClientIdCode(`DF-${Math.floor(1000 + Math.random() * 9000)}`);
      setClientNotes('');
      setClientColabs([]);
    }
    setColabName('');
    setColabRole(PHARMACY_ROLES[0]);
    setColabPhone('');
    setColabEmail('');
    setIsClientModalOpen(true);
  };

  const handleAddColabToClient = () => {
    if (!colabName.trim()) return;
    const newColab: PharmacyCollaborator = {
      id: `colab-${Date.now()}`,
      name: colabName.trim(),
      role: colabRole,
      phone: colabPhone.trim() || undefined,
      email: colabEmail.trim() || undefined,
    };
    setClientColabs([...clientColabs, newColab]);
    setColabName('');
    setColabPhone('');
    setColabEmail('');
  };

  const handleRemoveColabFromClient = (id: string) => {
    setClientColabs(clientColabs.filter((c) => c.id !== id));
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientRazao.trim()) return;

    if (editingClient) {
      const updated = clients.map((c) =>
        c.id === editingClient.id
          ? {
              ...c,
              cnpj: clientCnpj.trim(),
              razaoSocial: clientRazao.trim(),
              nomeFantasia: clientFantasia.trim() || clientRazao.trim(),
              phone: clientPhone.trim(),
              clientId: clientIdCode.trim(),
              notes: clientNotes.trim(),
              collaborators: clientColabs,
            }
          : c
      );
      saveClientsList(updated);
    } else {
      const newCli: ClientProfile = {
        id: `cli-${Date.now()}`,
        clientId: clientIdCode.trim() || `DF-${Date.now()}`,
        cnpj: clientCnpj.trim(),
        razaoSocial: clientRazao.trim(),
        nomeFantasia: clientFantasia.trim() || clientRazao.trim(),
        phone: clientPhone.trim(),
        notes: clientNotes.trim(),
        collaborators: clientColabs,
        createdAt: new Date().toISOString(),
      };
      saveClientsList([newCli, ...clients]);
    }

    setIsClientModalOpen(false);
  };

  const handleDeleteClient = (id: string) => {
    if (confirm('Deseja excluir este cliente e seus colaboradores?')) {
      const updated = clients.filter((c) => c.id !== id);
      saveClientsList(updated);
    }
  };

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;
    const q = clientSearch.toLowerCase();
    return clients.filter(
      (c) =>
        c.razaoSocial.toLowerCase().includes(q) ||
        c.nomeFantasia.toLowerCase().includes(q) ||
        c.cnpj.includes(q) ||
        c.clientId.toLowerCase().includes(q)
    );
  }, [clients, clientSearch]);

  // ----------------------------------------------------
  // ABA 3: USUÁRIOS DO SISTEMA
  // ----------------------------------------------------
  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('Trein@mento123');
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [resetNewPass, setResetNewPass] = useState('Trein@mento123');
  const [userMsg, setUserMsg] = useState<string | null>(null);

  const loadUsers = async () => {
    const list = await getLocalUsers();
    setUsersList(list);
  };

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserUsername.trim()) return;

    await addUser({
      name: newUserName.trim(),
      username: newUserUsername.trim(),
      password: newUserPassword.trim() || 'Trein@mento123',
    });

    setUserMsg(`Usuário ${newUserName} cadastrado com sucesso!`);
    setTimeout(() => setUserMsg(null), 3000);
    setNewUserName('');
    setNewUserUsername('');
    setNewUserPassword('Trein@mento123');
    setIsUserModalOpen(false);
    loadUsers();
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (id === 'user-leonardo') {
      alert('O usuário administrador principal não pode ser excluído.');
      return;
    }
    if (confirm(`Deseja excluir o acesso do usuário ${name}?`)) {
      await deleteUser(id);
      loadUsers();
    }
  };

  const handleResetPassword = async (id: string) => {
    if (!resetNewPass.trim() || resetNewPass.trim().length < 6) {
      alert('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    await resetUserPasswordDirect(id, resetNewPass.trim());
    alert('Senha redefinida com sucesso!');
    setResettingUserId(null);
  };

  return (
    <>
      {/* ── 1. Heading Oficial com Eyebrow, H1, Subtítulo e Capture ── */}
      <section className="heading">
        <div>
          <span className="eyebrow">FERRAMENTAS &amp; GESTÃO</span>
          <h1 id="pageTitle">Utilitários do Sistema</h1>
          <p id="pageSubtitle">
            Gerencie módulos operacionais, cadastro de clientes com colaboradores e usuários do sistema.
          </p>
        </div>
        <div className="capture">
          <span className="live-dot" /> Recursos do sistema
          <span id="captured">
            {activeTab === 'modules'
              ? `${menus.length} módulos ativos`
              : activeTab === 'clients'
              ? `${clients.length} farmácias cadastradas`
              : activeTab === 'users'
              ? `${usersList.length} contas de acesso`
              : `${sugestoes.length} sugestões registradas`}
          </span>
        </div>
      </section>

      {/* ── 2. Barra Contínua de Filtros Globais (.filters) ── */}
            {/* ── 2. Cards de Navegação entre Seções de Utilitários ── */}
      <div className="util-nav-cards-grid no-print">
        <button
          type="button"
          className={`util-nav-card ${activeTab === 'modules' ? 'active' : ''}`}
          onClick={() => setActiveTab('modules')}
        >
          <div className="util-nav-card-icon">
            <Layers size={22} />
          </div>
          <div className="util-nav-card-content">
            <div className="util-nav-card-header">
              <strong className="util-nav-card-title">Módulos &amp; Rotinas</strong>
              <span className="util-nav-card-count">{menus.length}</span>
            </div>
            <p className="util-nav-card-desc">
              Organização de menus, submenus e rotinas do ERP
            </p>
          </div>
        </button>

        <button
          type="button"
          className={`util-nav-card ${activeTab === 'clients' ? 'active' : ''}`}
          onClick={() => setActiveTab('clients')}
        >
          <div className="util-nav-card-icon">
            <Boxes size={22} />
          </div>
          <div className="util-nav-card-content">
            <div className="util-nav-card-header">
              <strong className="util-nav-card-title">Cadastro de Clientes</strong>
              <span className="util-nav-card-count">{clients.length}</span>
            </div>
            <p className="util-nav-card-desc">
              Farmácias clientes e equipes de colaboradores
            </p>
          </div>
        </button>

        <button
          type="button"
          className={`util-nav-card ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <div className="util-nav-card-icon">
            <Users size={22} />
          </div>
          <div className="util-nav-card-content">
            <div className="util-nav-card-header">
              <strong className="util-nav-card-title">Usuários do Sistema</strong>
              <span className="util-nav-card-count">{usersList.length}</span>
            </div>
            <p className="util-nav-card-desc">
              Gerencie acessos, contas e senhas da equipe
            </p>
          </div>
        </button>

        <button
          type="button"
          className={`util-nav-card ${activeTab === 'sugestoes' ? 'active' : ''}`}
          onClick={() => setActiveTab('sugestoes')}
        >
          <div className="util-nav-card-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.25)' }}>
            <Lightbulb size={22} />
          </div>
          <div className="util-nav-card-content">
            <div className="util-nav-card-header">
              <strong className="util-nav-card-title">Sugestões de Melhorias</strong>
              <span className="util-nav-card-count" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#d97706' }}>{sugestoes.length}</span>
            </div>
            <p className="util-nav-card-desc">
              Propostas de melhorias, linha do tempo e aprovações
            </p>
          </div>
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* ABA 1: MÓDULOS E ROTINAS */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'modules' && (
        <div>
          {saveSuccessMsg && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#059669',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: 600,
                marginBottom: '16px',
              }}
            >
              ✓ {saveSuccessMsg}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            {/* Versão */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setSelectedVersion('v10')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: selectedVersion === 'v10' ? '1px solid var(--red)' : '1px solid var(--border)',
                  background: selectedVersion === 'v10' ? 'var(--red-soft)' : 'var(--bg-primary)',
                  color: selectedVersion === 'v10' ? 'var(--red)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                Digifarma v10
              </button>
              <button
                type="button"
                onClick={() => setSelectedVersion('classico')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: selectedVersion === 'classico' ? '1px solid var(--red)' : '1px solid var(--border)',
                  background: selectedVersion === 'classico' ? 'var(--red-soft)' : 'var(--bg-primary)',
                  color: selectedVersion === 'classico' ? 'var(--red)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                Digifarma Clássico
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleAddModule}
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
                <Plus size={15} color="var(--red)" />
                <span>+ Novo Módulo</span>
              </button>

              <button
                type="button"
                onClick={handleSaveModules}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 16px',
                  background: 'var(--red)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Check size={15} />
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
            {/* Lista de Módulos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {versionMenus.map((m) => {
                const isSelected = editingMenu?.id === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setEditingMenu(m)}
                    role="button"
                    tabIndex={0}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: isSelected ? '1.5px solid var(--red)' : '1px solid var(--border)',
                      background: isSelected ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'var(--red-soft)',
                          color: 'var(--red)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {renderIconByName(m.icon, 16)}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {m.label}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {m.submenus?.length || 0} submenus / rotinas
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteModule(m.id);
                      }}
                      title="Excluir módulo"
                      style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Painel de Edição do Módulo Selecionado */}
            {editingMenu ? (
              <div
                style={{
                  background: 'var(--bg-primary)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  padding: '20px',
                }}
              >
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 14px 0', color: 'var(--text-primary)' }}>
                  Editar Módulo: {editingMenu.label}
                </h3>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                    Nome do Módulo:
                  </label>
                  <input
                    type="text"
                    value={editingMenu.label}
                    onChange={(e) => {
                      const updated = { ...editingMenu, label: e.target.value };
                      setEditingMenu(updated);
                      setLocalMenus((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-secondary)',
                      fontSize: '0.86rem',
                    }}
                  />
                </div>

                {/* Galeria de Seleção de Ícone */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                    Ícone Representativo:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                    {AVAILABLE_ICONS.map((ico) => {
                      const isIcoActive = editingMenu.icon === ico.name;
                      return (
                        <button
                          type="button"
                          key={ico.name}
                          onClick={() => {
                            const updated = { ...editingMenu, icon: ico.name };
                            setEditingMenu(updated);
                            setLocalMenus((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
                          }}
                          title={ico.label}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '8px',
                            borderRadius: '8px',
                            border: isIcoActive ? '1.5px solid var(--red)' : '1px solid var(--border)',
                            background: isIcoActive ? 'var(--red-soft)' : 'var(--bg-secondary)',
                            color: isIcoActive ? 'var(--red)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                          }}
                        >
                          {renderIconByName(ico.name, 16)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submenus e Rotinas */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '8px' }}>
                    Submenus e Rotinas:
                  </label>

                  <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                    <input
                      type="text"
                      placeholder="Nome da rotina/submenu..."
                      value={newSubmenuTitle}
                      onChange={(e) => setNewSubmenuTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubmenu();
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-secondary)',
                        fontSize: '0.82rem',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddSubmenu}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'var(--red)',
                        color: '#fff',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      + Adicionar
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {editingMenu.submenus?.map((sub) => (
                      <div
                        key={sub.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{sub.label}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubmenu(sub.id)}
                          style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px',
                  borderRadius: '12px',
                  border: '1px dashed var(--border)',
                  color: 'var(--text-muted)',
                  fontSize: '0.86rem',
                }}
              >
                Selecione um módulo à esquerda para editar suas configurações e submenus.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* ABA 2: CADASTRO DE CLIENTES */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'clients' && (
        <div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '6px 12px',
                minWidth: '240px',
              }}
            >
              <Search size={15} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Buscar por Razão, Fantasia, CNPJ ou ID..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.84rem',
                  color: 'var(--text-primary)',
                  width: '100%',
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => handleOpenClientModal()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                background: 'var(--red)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Plus size={16} />
              <span>+ Novo Cliente</span>
            </button>
          </div>

          {/* Grid de Clientes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
            {filteredClients.map((cli) => (
              <div
                key={cli.id}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '18px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div>
                      <span
                        style={{
                          background: 'rgba(59, 130, 246, 0.12)',
                          color: '#3b82f6',
                          border: '1px solid rgba(59, 130, 246, 0.25)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                        }}
                      >
                        ID: {cli.clientId}
                      </span>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '6px 0 2px 0' }}>
                        {cli.nomeFantasia || cli.razaoSocial}
                      </h3>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {cli.razaoSocial}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenClientModal(cli)}
                        title="Editar cliente"
                        style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClient(cli.id)}
                        title="Excluir cliente"
                        style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    {cli.cnpj && <div><strong>CNPJ:</strong> {cli.cnpj}</div>}
                    {cli.phone && <div><strong>Telefone:</strong> {cli.phone}</div>}
                    {cli.notes && <div><strong>Anotações:</strong> {cli.notes}</div>}
                  </div>
                </div>

                {/* Seção de Colaboradores da Farmácia */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Colaboradores da Drogaria ({cli.collaborators?.length || 0})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {cli.collaborators?.slice(0, 3).map((colab) => (
                      <div
                        key={colab.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'var(--bg-secondary)',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                        }}
                      >
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{colab.name}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{colab.role}</span>
                      </div>
                    ))}
                    {(cli.collaborators?.length || 0) > 3 && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                        +{(cli.collaborators?.length || 0) - 3} outros...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* ABA 3: USUÁRIOS DO SISTEMA */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'users' && (
        <div>
          {userMsg && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#059669',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: 600,
                marginBottom: '16px',
              }}
            >
              ✓ {userMsg}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: '0 0 2px 0', color: 'var(--text-primary)' }}>
                Usuários com Acesso ao Site
              </h3>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Cadastre e redefina senhas de instrutores, revisores e administradores
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsUserModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                background: 'var(--red)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <UserPlus size={15} />
              <span>+ Novo Usuário</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
            {usersList.map((user) => (
              <div
                key={user.id}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'var(--red-soft)',
                      color: 'var(--red)',
                      fontSize: '1rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {(user.name || user.username).charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {user.name || user.username}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Login: <code>{user.username}</code>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setResettingUserId(user.id);
                      setResetNewPass('Trein@mento123');
                    }}
                    title="Redefinir Senha"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    <KeyRound size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteUser(user.id, user.name || user.username)}
                    title="Excluir Usuário"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Modal para Redefinir Senha */}
          {resettingUserId && (
            <div className="modal-backdrop">
              <div className="modal-box" style={{ maxWidth: '380px', padding: '20px', background: 'var(--bg-primary)', borderRadius: '14px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.96rem', fontWeight: 800 }}>Redefinir Senha de Acesso</h4>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                    Nova Senha:
                  </label>
                  <input
                    type="text"
                    value={resetNewPass}
                    onChange={(e) => setResetNewPass(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-secondary)',
                      fontSize: '0.86rem',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setResettingUserId(null)}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResetPassword(resettingUserId)}
                    style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', background: 'var(--red)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Confirmar Senha
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Criar Novo Usuário */}
          {isUserModalOpen && (
            <div className="modal-backdrop">
              <div className="modal-box" style={{ maxWidth: '420px', padding: '24px', background: 'var(--bg-primary)', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Cadastrar Novo Usuário
                  </h3>
                  <button type="button" onClick={() => setIsUserModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCreateUser}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                      Nome Completo:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Silva"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-secondary)',
                        fontSize: '0.86rem',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                      Nome de Usuário (Login):
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: carlos"
                      value={newUserUsername}
                      onChange={(e) => setNewUserUsername(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-secondary)',
                        fontSize: '0.86rem',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                      Senha Provisória:
                    </label>
                    <input
                      type="text"
                      required
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-secondary)',
                        fontSize: '0.86rem',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setIsUserModalOpen(false)}
                      style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: 'var(--red)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Cadastrar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* ABA 4: SUGESTÕES DE MELHORIAS COM LINHA DO TEMPO */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'sugestoes' && (
        <div>
          {/* Barra Superior da Aba de Sugestões */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  minWidth: '240px',
                }}
              >
                <Search size={15} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Buscar sugestões por título, autor..."
                  value={sugSearch}
                  onChange={(e) => setSugSearch(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '0.84rem',
                    color: 'var(--text-primary)',
                    width: '100%',
                  }}
                />
              </div>

              {/* Filtro por Status */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(['all', 'enviada', 'em_analise', 'aprovada', 'em_execucao', 'concluida', 'recusada'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSugStatusFilter(st)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: sugStatusFilter === st ? '1px solid var(--red)' : '1px solid var(--border)',
                      background: sugStatusFilter === st ? 'var(--red-soft)' : 'var(--bg-primary)',
                      color: sugStatusFilter === st ? 'var(--red)' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {st === 'all' ? 'Todas' : STATUS_LABELS[st]}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsNewSugestaoModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: 'var(--red)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(237, 38, 43, 0.25)',
              }}
            >
              <Lightbulb size={15} />
              <span>+ Propor Sugestão</span>
            </button>
          </div>

          {/* Layout Principal: Lista à Esquerda + Detalhes/Timeline à Direita */}
          <div style={{ display: 'grid', gridTemplateColumns: selectedSugestao ? '1.2fr 1.8fr' : '1fr', gap: '20px' }}>
            {/* Lista de Sugestões em Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredSugestoes.length === 0 ? (
                <div
                  style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    background: 'var(--bg-primary)',
                    borderRadius: '12px',
                    border: '1px dashed var(--border)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <Lightbulb size={32} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>Nenhuma sugestão encontrada.</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem' }}>Seja o primeiro a enviar uma proposta de melhoria!</p>
                </div>
              ) : (
                filteredSugestoes.map((sug) => {
                  const isSelected = selectedSugestao?.id === sug.id;
                  const statusColor = STATUS_COLORS[sug.status];
                  return (
                    <div
                      key={sug.id}
                      onClick={() => {
                        setSelectedSugestao(sug);
                        setNewTimelineStatus(sug.status);
                      }}
                      style={{
                        background: 'var(--bg-primary)',
                        border: isSelected ? '1.5px solid var(--red)' : '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 4px 14px rgba(237, 38, 43, 0.12)' : '0 1px 3px rgba(0,0,0,0.02)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: statusColor.bg,
                            color: statusColor.text,
                            border: `1px solid ${statusColor.border}`,
                          }}
                        >
                          {STATUS_LABELS[sug.status]}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {new Date(sug.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0', lineHeight: 1.35 }}>
                        {sug.title}
                      </h3>

                      <p
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                          margin: '0 0 12px 0',
                          lineHeight: 1.45,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {sug.description}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                        <span>Por: <strong>{sug.author}</strong> · {sug.category}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> {sug.timeline.length} etapas
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <MessageCircle size={12} /> {sug.comments.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Painel de Detalhes da Sugestão Selecionada */}
            {selectedSugestao && (
              <div
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '22px',
                  position: 'sticky',
                  top: '20px',
                  height: 'fit-content',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                }}
              >
                {/* Cabeçalho do Detalhe */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '2px 9px',
                          borderRadius: '999px',
                          background: STATUS_COLORS[selectedSugestao.status].bg,
                          color: STATUS_COLORS[selectedSugestao.status].text,
                          border: `1px solid ${STATUS_COLORS[selectedSugestao.status].border}`,
                        }}
                      >
                        {STATUS_LABELS[selectedSugestao.status]}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Categoria: {selectedSugestao.category}
                      </span>
                    </div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0', lineHeight: 1.3 }}>
                      {selectedSugestao.title}
                    </h2>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Enviada por <strong>{selectedSugestao.author}</strong> em {new Date(selectedSugestao.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedSugestao(null)}
                    style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                    title="Fechar painel de detalhes"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div
                  style={{
                    background: 'var(--bg-secondary)',
                    padding: '14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    fontSize: '0.86rem',
                    color: 'var(--text-primary)',
                    lineHeight: 1.5,
                    marginBottom: '20px',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selectedSugestao.description}
                </div>

                {/* ── LINHA DO TEMPO DA SUGESTÃO ── */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h3 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={15} color="var(--red)" />
                      <span>Linha do Tempo de Execução</span>
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {selectedSugestao.timeline.length} registro(s)
                    </span>
                  </div>

                  <div className="sug-timeline-container">
                    {selectedSugestao.timeline.map((step, idx) => {
                      const color = STATUS_COLORS[step.status];
                      return (
                        <div key={step.id || idx} className="sug-timeline-item">
                          <div className="sug-timeline-bullet" style={{ background: color.text, borderColor: color.bg }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                              {STATUS_LABELS[step.status]}
                            </strong>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              por <strong>{step.author}</strong> em {new Date(step.createdAt).toLocaleDateString('pt-BR')} às {new Date(step.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {step.note && (
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                              {step.note}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* CONTROLE EXCLUSIVO LEONARDO PARA AVANÇAR LINHA DO TEMPO */}
                  {isLeonardo ? (
                    <div
                      style={{
                        background: 'rgba(237, 38, 43, 0.05)',
                        border: '1px solid rgba(237, 38, 43, 0.25)',
                        borderRadius: '10px',
                        padding: '14px',
                        marginTop: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--red)', textTransform: 'uppercase' }}>
                          ⚡ Gestão da Linha do Tempo (Leonardo Trevas)
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px', marginBottom: '8px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '3px' }}>
                            Novo Status da Sugestão:
                          </label>
                          <select
                            value={newTimelineStatus}
                            onChange={(e) => setNewTimelineStatus(e.target.value as any)}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border)',
                              background: 'var(--bg-primary)',
                              fontSize: '0.8rem',
                              color: 'var(--text-primary)',
                            }}
                          >
                            <option value="enviada">1. Enviada (Aguardando)</option>
                            <option value="em_analise">2. Em Análise Técnica</option>
                            <option value="aprovada">3. Aprovada</option>
                            <option value="em_execucao">4. Em Execução / Desenvolvimento</option>
                            <option value="concluida">5. Concluída &amp; Em Produção</option>
                            <option value="recusada">6. Recusada / Inviável</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '3px' }}>
                            Nota explicativa (opcional):
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Aprovado para próxima versão..."
                            value={newTimelineNote}
                            onChange={(e) => setNewTimelineNote(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border)',
                              background: 'var(--bg-primary)',
                              fontSize: '0.8rem',
                              color: 'var(--text-primary)',
                            }}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAdvanceTimeline(selectedSugestao.id)}
                        disabled={isSubmittingTimeline}
                        style={{
                          width: '100%',
                          padding: '7px 12px',
                          background: 'var(--red)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: isSubmittingTimeline ? 'not-allowed' : 'pointer',
                          opacity: isSubmittingTimeline ? 0.7 : 1,
                        }}
                      >
                        {isSubmittingTimeline ? 'Atualizando...' : 'Atualizar Linha do Tempo da Sugestão'}
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.76rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <Lock size={14} />
                      <span>Apenas <strong>Leonardo</strong> tem permissão para alterar o status e a linha do tempo.</span>
                    </div>
                  )}
                </div>

                {/* ── COMENTÁRIOS DA EQUIPE ── */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 12px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MessageCircle size={15} color="#3b82f6" />
                    <span>Discussão &amp; Comentários ({selectedSugestao.comments.length})</span>
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px', maxHeight: '200px', overflowY: 'auto' }}>
                    {selectedSugestao.comments.length === 0 ? (
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Nenhum comentário registrado ainda. Deixe sua opinião sobre esta melhoria!
                      </p>
                    ) : (
                      selectedSugestao.comments.map((c) => (
                        <div
                          key={c.id}
                          style={{
                            background: 'var(--bg-secondary)',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                            <strong style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>{c.author}</strong>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              {new Date(c.createdAt).toLocaleDateString('pt-BR')} às {new Date(c.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {c.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Input de Novo Comentário */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Deixe um comentário sobre esta sugestão..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddComment(selectedSugestao.id);
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-secondary)',
                        fontSize: '0.82rem',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddComment(selectedSugestao.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        background: 'var(--primary-600, #2563eb)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
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
              </div>
            )}
          </div>

          {/* Modal Nova Sugestão */}
          {isNewSugestaoModalOpen && (
            <div className="modal-backdrop">
              <div
                className="modal-box"
                style={{
                  maxWidth: '520px',
                  padding: '24px',
                  background: 'var(--bg-primary)',
                  borderRadius: '16px',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Lightbulb size={18} />
                    </div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                      Propor Sugestão de Melhoria
                    </h3>
                  </div>
                  <button type="button" onClick={() => setIsNewSugestaoModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCreateSugestao}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                      Título da Sugestão:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Adicionar exportação de relatórios em Excel..."
                      value={newSugTitle}
                      onChange={(e) => setNewSugTitle(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-secondary)',
                        fontSize: '0.86rem',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                      Categoria da Melhoria:
                    </label>
                    <select
                      value={newSugCategory}
                      onChange={(e) => setNewSugCategory(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-secondary)',
                        fontSize: '0.86rem',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <option value="Interface & Visual">Interface &amp; Visual</option>
                      <option value="Módulos & POPs">Módulos &amp; Procedimentos</option>
                      <option value="Relatórios & Filtros">Relatórios &amp; Filtros</option>
                      <option value="Treinamento & Equipe">Treinamento &amp; Equipe</option>
                      <option value="Rotinas ERP Digifarma">Rotinas ERP Digifarma</option>
                      <option value="Geral">Geral</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '18px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                      Descrição detalhada da proposta:
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Explique como a melhoria facilitará a rotina de implantação, treinamento ou uso do sistema..."
                      value={newSugDesc}
                      onChange={(e) => setNewSugDesc(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-secondary)',
                        fontSize: '0.86rem',
                        color: 'var(--text-primary)',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setIsNewSugestaoModalOpen(false)}
                      style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: 'var(--red)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Registrar Sugestão
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Cadastro de Cliente & Colaboradores */}
      {isClientModalOpen && (
        <div className="modal-backdrop">
          <div
            className="modal-box"
            style={{ maxWidth: '680px', padding: '24px', background: 'var(--bg-primary)', borderRadius: '16px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {editingClient ? 'Editar Cliente' : 'Novo Cadastro de Cliente'}
              </h3>
              <button type="button" onClick={() => setIsClientModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveClient}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                    Código Cliente ID:
                  </label>
                  <input
                    type="text"
                    required
                    value={clientIdCode}
                    onChange={(e) => setClientIdCode(e.target.value)}
                    placeholder="Ex: DF-0142"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-secondary)',
                      fontSize: '0.86rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                    CNPJ da Drogaria/Farmácia:
                  </label>
                  <input
                    type="text"
                    value={clientCnpj}
                    onChange={(e) => setClientCnpj(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-secondary)',
                      fontSize: '0.86rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                  Razão Social:
                </label>
                <input
                  type="text"
                  required
                  value={clientRazao}
                  onChange={(e) => setClientRazao(e.target.value)}
                  placeholder="Ex: Drogaria Santa Luzia Ltda"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    fontSize: '0.86rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                    Nome Fantasia:
                  </label>
                  <input
                    type="text"
                    value={clientFantasia}
                    onChange={(e) => setClientFantasia(e.target.value)}
                    placeholder="Ex: Farmácia Santa Luzia"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-secondary)',
                      fontSize: '0.86rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                    Número / Telefone:
                  </label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-secondary)',
                      fontSize: '0.86rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                  Anotações do Cliente:
                </label>
                <textarea
                  rows={2}
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder="Informações técnicas, especificidades do servidor, pendências..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    fontSize: '0.86rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Sub-gestão de Colaboradores */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '18px' }}>
                <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  COLABORADORES (EQUIPE DA FARMÁCIA):
                </span>

                <div
                  style={{
                    background: 'var(--bg-secondary)',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    marginBottom: '10px',
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      placeholder="Nome do colaborador..."
                      value={colabName}
                      onChange={(e) => setColabName(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-primary)',
                        fontSize: '0.82rem',
                      }}
                    />

                    {/* Cargo Farmacêutico */}
                    <select
                      value={colabRole}
                      onChange={(e) => setColabRole(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-primary)',
                        fontSize: '0.82rem',
                      }}
                    >
                      {PHARMACY_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="WhatsApp (opcional)..."
                      value={colabPhone}
                      onChange={(e) => setColabPhone(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-primary)',
                        fontSize: '0.82rem',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddColabToClient}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'var(--red)',
                        color: '#fff',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      + Incluir Colaborador
                    </button>
                  </div>
                </div>

                {/* Lista de Colaboradores Incluídos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {clientColabs.map((colab) => (
                    <div
                      key={colab.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'var(--bg-secondary)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {colab.name}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                          ({colab.role})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveColabFromClient(colab.id)}
                        style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: 'var(--red)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
