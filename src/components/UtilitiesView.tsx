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
} from 'lucide-react';
import type { SystemMenu, SubmenuItem } from '../types/procedure';
import type { AppUser } from '../types/auth';
import { getLocalUsers, addUser, deleteUser, resetUserPasswordDirect } from '../lib/authService';

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
}) => {
  const [activeTab, setActiveTab] = useState<'modules' | 'clients' | 'users'>('modules');

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
              : `${usersList.length} contas de acesso`}
          </span>
        </div>
      </section>

      {/* ── 2. Barra Contínua de Filtros Globais (.filters) ── */}
      <section className="filters" aria-label="Filtros globais">
        <div className="filter">
          <label htmlFor="util-tab-select">SEÇÃO DE UTILITÁRIOS</label>
          <select
            id="util-tab-select"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as any)}
          >
            <option value="modules">Módulos do Sistema ({menus.length})</option>
            <option value="clients">Cadastro de Clientes ({clients.length})</option>
            <option value="users">Usuários do Sistema ({usersList.length})</option>
          </select>
        </div>

        <div className="status" style={{ marginLeft: 'auto' }}>
          <span className="live-dot" />{' '}
          {activeTab === 'modules'
            ? `${menus.length} Módulos`
            : activeTab === 'clients'
            ? `${clients.length} Clientes`
            : `${usersList.length} Usuários`}
        </div>
      </section>

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
