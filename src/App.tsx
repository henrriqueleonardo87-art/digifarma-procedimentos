import { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ProcedureView } from './components/ProcedureView';
import { ProcedureEditor } from './components/ProcedureEditor';
import { SupabaseModal } from './components/SupabaseModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ImageLightbox } from './components/ImageLightbox';
import { SettingsView } from './components/SettingsView';
import { DashboardView } from './components/DashboardView';
import { VersionModulesView } from './components/VersionModulesView';
import { ReviewView } from './components/ReviewView';
import { ContentsView } from './components/ContentsView';
import { ArquivosView } from './components/ArquivosView';
import { PublicacoesView } from './components/PublicacoesView';
import { MuralView } from './components/MuralView';
import { UtilitiesView } from './components/UtilitiesView';
import { LoginScreen } from './components/LoginScreen';
import { ResetPasswordModal } from './components/ResetPasswordModal';
import { NewProcedureFormatModal } from './components/NewProcedureFormatModal';
import { ImportProcedureModal } from './components/ImportProcedureModal';
import { StudioFormatSelector } from './components/StudioFormatSelector';
import {
  buildUnifiedNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type AppNotification,
} from './lib/notificationService';
import { fetchSugestoes, subscribeToSugestoes, type SugestaoItem } from './lib/sugestoesService';
import { fetchPublicacoes, type PublicacaoItem } from './lib/publicacoesService';
import type { Procedure, SystemMenu, ProcedureFormat } from './types/procedure';
import type { AppUser } from './types/auth';
import { getCurrentUser, logout as authLogout, updateUserAvatar } from './lib/authService';
import {
  fetchAllProcedures,
  saveProcedure,
  deleteProcedure,
  fetchSystemMenus,
  saveSystemMenus,
} from './lib/storageService';
import { testConnection } from './lib/supabase';
import { initThemeColor } from './lib/themeService';
import { subscribeToPublicacoes, isUserTargeted, isUserRead } from './lib/publicacoesService';
import { Loader2 } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => getCurrentUser());
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('digifarma_sidebar_collapsed') === 'true';
  });
  const [notesNotificationCount, setNotesNotificationCount] = useState<number>(0);

  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [menus, setMenus] = useState<SystemMenu[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [autoPrintActive, setAutoPrintActive] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null);

  // Controle de ativação do Editor em Configurações (Modo Repositório vs Modo Estúdio)
  const [isEditorEnabled, setIsEditorEnabled] = useState<boolean>(() => {
    return localStorage.getItem('digifarma_enable_editor') === 'true';
  });

  const handleToggleEditor = (enabled: boolean) => {
    setIsEditorEnabled(enabled);
    localStorage.setItem('digifarma_enable_editor', String(enabled));
  };

  // Modal de Importação de Procedimentos (PDF, HTML ou Ambos)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTargetProcedure, setImportTargetProcedure] = useState<Procedure | null>(null);
  const [importDefaultParams, setImportDefaultParams] = useState<{
    category?: string;
    menuId?: string;
    version?: 'v10' | 'r78';
  } | null>(null);

  const handleOpenImportModal = (
    targetOrCategory?: Procedure | string,
    defaultMenuId?: string,
    version?: 'v10' | 'r78'
  ) => {
    if (typeof targetOrCategory === 'object' && targetOrCategory !== null) {
      setImportTargetProcedure(targetOrCategory);
      setImportDefaultParams(null);
    } else {
      setImportTargetProcedure(null);
      setImportDefaultParams({
        category: typeof targetOrCategory === 'string' ? targetOrCategory : undefined,
        menuId: defaultMenuId,
        version: version || (currentView === 'r78' ? 'r78' : 'v10'),
      });
    }
    setIsImportModalOpen(true);
  };

  // Visão Ativa do Sistema: 'dashboard' | 'v10' | 'r78' | 'procedure-detail' | 'config' | 'editor'
  const [currentView, setCurrentView] = useState<string>('dashboard');

  const pendingReviewCount = procedures.filter(
    (p) => p.status === 'pendente' && p.isActive !== false
  ).length;

  const handleApproveProcedure = async (procedureId: string, reviewerName: string) => {
    const proc = procedures.find((p) => p.id === procedureId);
    if (!proc) return;
    const updated: Procedure = {
      ...proc,
      status: 'aprovado',
      isActive: true,
      reviewedBy: reviewerName,
      reviewedAt: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await saveProcedure(updated);
    setProcedures((prev) => prev.map((p) => (p.id === procedureId ? updated : p)));
  };

  const handleRequestAdjustments = async (procedureId: string, reviewerName: string, reason: string) => {
    const proc = procedures.find((p) => p.id === procedureId);
    if (!proc) return;
    const updated: Procedure = {
      ...proc,
      status: 'ajustes_solicitados',
      rejectionReason: reason,
      reviewedBy: reviewerName,
      reviewedAt: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await saveProcedure(updated);
    setProcedures((prev) => prev.map((p) => (p.id === procedureId ? updated : p)));
  };

  const handleToggleActiveProcedure = async (procedureId: string) => {
    const proc = procedures.find((p) => p.id === procedureId);
    if (!proc) return;
    const isCurrentlyActive = proc.isActive !== false;
    const updated: Procedure = {
      ...proc,
      isActive: !isCurrentlyActive,
      updated_at: new Date().toISOString(),
    };
    await saveProcedure(updated);
    setProcedures((prev) => prev.map((p) => (p.id === procedureId ? updated : p)));
  };

  const handleUnpublishProcedure = async (procedureId: string) => {
    const proc = procedures.find((p) => p.id === procedureId);
    if (!proc) return;
    const updated: Procedure = {
      ...proc,
      status: 'despublicado',
      updated_at: new Date().toISOString(),
    };
    await saveProcedure(updated);
    setProcedures((prev) => prev.map((p) => (p.id === procedureId ? updated : p)));
  };

  const handleSendToReview = async (procedureId: string) => {
    const proc = procedures.find((p) => p.id === procedureId);
    if (!proc) return;
    const updated: Procedure = {
      ...proc,
      status: 'pendente',
      updated_at: new Date().toISOString(),
    };
    await saveProcedure(updated);
    setProcedures((prev) => prev.map((p) => (p.id === procedureId ? updated : p)));
  };

  const handlePublishDirectly = async (procedureId: string) => {
    const proc = procedures.find((p) => p.id === procedureId);
    if (!proc) return;
    const updated: Procedure = {
      ...proc,
      status: 'aprovado',
      isActive: true,
      reviewedBy: currentUser?.name || 'Administrador',
      reviewedAt: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await saveProcedure(updated);
    setProcedures((prev) => prev.map((p) => (p.id === procedureId ? updated : p)));
  };

  // Estado do Menu Lateral no Mobile
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Tema Escuro / Claro
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('digifarma_theme') === 'dark';
  });

  // Supabase State
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Modal de Exclusão
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    procedure: Procedure | null;
  }>({
    isOpen: false,
    procedure: null,
  });

  // Lightbox de Imagem
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    url: string;
    caption?: string;
  }>({
    isOpen: false,
    url: '',
  });

  // Inicialização dos Dados
  const loadData = async () => {
    try {
      const [procsData, menusData] = await Promise.all([
        fetchAllProcedures(),
        fetchSystemMenus(),
      ]);
      setProcedures(procsData);
      setMenus(menusData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkConnection = async () => {
    await testConnection();
  };

  useEffect(() => {
    initThemeColor();
    loadData();
    checkConnection();
  }, []);

  // Efeito de Tema
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('digifarma_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Dados para Central Unificada de Notificações
  const [publicacoes, setPublicacoes] = useState<PublicacaoItem[]>([]);
  const [sugestoes, setSugestoes] = useState<SugestaoItem[]>([]);
  const [notificationsVersion, setNotificationsVersion] = useState(0);

  useEffect(() => {
    fetchPublicacoes().then(setPublicacoes);
    fetchSugestoes().then(setSugestoes);

    if (!currentUser) {
      setNotesNotificationCount(0);
      return;
    }

    const unsubPub = subscribeToPublicacoes((items) => {
      setPublicacoes(items);
      const count = items.filter(
        (p) => isUserTargeted(p.targetUsers, currentUser) && !isUserRead(p.readBy, currentUser, p.id)
      ).length;
      setNotesNotificationCount(count);
    });

    const unsubSug = subscribeToSugestoes((items) => {
      setSugestoes(items);
    });

    return () => {
      unsubPub();
      unsubSug();
    };
  }, [currentUser]);

  const unifiedNotifications = useMemo(() => {
    void notificationsVersion;
    return buildUnifiedNotifications({
      currentUser,
      procedures,
      publicacoes,
      sugestoes,
    });
  }, [currentUser, procedures, publicacoes, sugestoes, notificationsVersion]);

  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);
    setNotificationsVersion((v) => v + 1);

    if (notif.targetView === 'procedure-detail' && notif.targetId) {
      setActiveId(notif.targetId);
      setCurrentView('procedure-detail');
      setIsEditing(false);
    } else if (notif.targetView === 'revision') {
      setCurrentView('revision');
      setActiveId(null);
      setIsEditing(false);
    } else if (notif.targetView === 'publicacoes') {
      setCurrentView('publicacoes');
      setActiveId(null);
      setIsEditing(false);
    } else if (notif.targetView === 'mural') {
      setCurrentView('mural');
      setActiveId(null);
      setIsEditing(false);
    } else if (notif.targetView === 'utilitarios') {
      setCurrentView('utilitarios');
      setActiveId(null);
      setIsEditing(false);
    } else if (notif.targetView) {
      setCurrentView(notif.targetView);
      if (notif.targetId) setActiveId(notif.targetId);
      setIsEditing(false);
    }
  };

  const handleClearAllNotifications = () => {
    const allIds = unifiedNotifications.map((n) => n.id);
    markAllNotificationsAsRead(allIds, currentUser?.username || currentUser?.name);
    setNotificationsVersion((v) => v + 1);
  };

  // Procedimento Ativo Atual
  const activeProcedure = procedures.find((p) => p.id === activeId) || null;

  // Handlers de Navegação e Ações
  const handleSelectProcedure = (id: string, autoPrint = false) => {
    setActiveId(id);
    setAutoPrintActive(autoPrint);
    setCurrentView('procedure-detail');
    setIsEditing(false);
  };

  const handleBackFromProcedure = () => {
    if (activeProcedure) {
      const ver = activeProcedure.systemVersion;
      if (ver === 'classico' || ver === 'r78') {
        setCurrentView('r78');
      } else {
        setCurrentView('v10');
      }
    } else {
      setCurrentView('dashboard');
    }
    setActiveId(null);
    setAutoPrintActive(false);
  };

  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
  const [pendingNewProcParams, setPendingNewProcParams] = useState<{
    category?: string;
    menuId?: string;
    version?: 'v10' | 'r78';
  } | null>(null);

  const handleNewProcedure = (defaultCategory?: string, defaultMenuId?: string, forceVersion?: 'v10' | 'r78') => {
    setPendingNewProcParams({ category: defaultCategory, menuId: defaultMenuId, version: forceVersion });
    setIsFormatModalOpen(true);
  };

  const handleSelectProcedureFormat = (format: ProcedureFormat) => {
    setIsFormatModalOpen(false);
    const forceVersion = pendingNewProcParams?.version;
    const defaultCategory = pendingNewProcParams?.category;
    const defaultMenuId = pendingNewProcParams?.menuId;

    const effectiveVersion = forceVersion || (currentView === 'r78' ? 'r78' : 'v10');
    const isR78 = effectiveVersion === 'r78';
    const cat = defaultCategory || 'Vendas';
    const mId = defaultMenuId || 'vendas';
    const newProc: Procedure = {
      id: `proc-${Date.now()}`,
      title: 'Novo Procedimento Operacional Padrão',
      subtitle: 'Descrição sumária da rotina e diretrizes de conformidade BPF',
      category: cat,
      systemVersion: isR78 ? 'classico' : 'v10',
      menuId: mId,
      submenuId: 'rotina',
      systemPath: `${isR78 ? 'Digifarma Clássico' : 'Digifarma V10'} ➔ ${cat}`,
      status: 'pendente',
      author: currentUser?.name || currentUser?.username || 'Farmacêutico Responsável',
      formatType: format,
      tags: ['BPF', isR78 ? 'Clássico' : 'V10', format.toUpperCase()],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      blocks: [
        {
          id: `step-${Date.now()}-1`,
          type: 'step',
          title: 'Acesso à Rotina no Digifarma',
          content: 'Navegue pelo menu lateral e selecione o módulo correspondente.',
          instruction: 'Acesse o sistema com suas credenciais homologadas e abra o formulário principal.',
          expectedResult: 'Janela da rotina carregada em tela única com campos desbloqueados.',
          tips: 'Use a tecla F2 para busca rápida de registros.',
          warnings: 'Confirme se o turno do caixa ou o lote do produto estão abertos antes de continuar.',
          completed: false,
        },
      ],
    };
    setEditingProcedure(newProc);
    setIsEditing(true);
    setCurrentView('editor');
  };

  const handleEditProcedure = (procToEdit?: Procedure) => {
    const target = procToEdit || activeProcedure;
    if (target) {
      setEditingProcedure(target);
      setIsEditing(true);
      setCurrentView('editor');
    }
  };

  const handleSaveProcedure = async (savedProcedure: Procedure) => {
    await saveProcedure(savedProcedure);
    setProcedures((prev) => {
      const exists = prev.some((p) => p.id === savedProcedure.id);
      if (exists) {
        return prev.map((p) => (p.id === savedProcedure.id ? savedProcedure : p));
      }
      return [savedProcedure, ...prev];
    });
    setIsEditing(false);
    setEditingProcedure(null);
    setActiveId(savedProcedure.id);
    setCurrentView('procedure-detail');
  };

  const handleDeleteClick = (procToDelete?: Procedure) => {
    const target = procToDelete || activeProcedure;
    if (target) {
      setDeleteModalState({ isOpen: true, procedure: target });
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteModalState.procedure) {
      const idToDelete = deleteModalState.procedure.id;
      await deleteProcedure(idToDelete);
      setProcedures((prev) => prev.filter((p) => p.id !== idToDelete));
      setDeleteModalState({ isOpen: false, procedure: null });
      setActiveId(null);
      setCurrentView('dashboard');
    }
  };

  const handleSaveMenus = async (updatedMenus: SystemMenu[]) => {
    await saveSystemMenus(updatedMenus);
    setMenus(updatedMenus);
  };

  const handleSaveProceduresList = async (updatedProcedures: Procedure[]) => {
    setProcedures(updatedProcedures);
  };

  const handleStepCompletionToggle = async (blockId: string, completed: boolean) => {
    if (!activeProcedure) return;

    const updatedBlocks = activeProcedure.blocks.map((b) => {
      if (b.id === blockId && b.type === 'step') {
        return { ...b, completed };
      }
      return b;
    });

    const updatedProc = { ...activeProcedure, blocks: updatedBlocks };
    await handleSaveProcedure(updatedProc);
  };

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('digifarma_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleLogout = () => {
    authLogout();
    setCurrentUser(null);
  };

  const handleUpdateAvatar = async (avatarUrl: string) => {
    if (!currentUser) return;
    await updateUserAvatar(currentUser.id, avatarUrl);
    const updated = getCurrentUser();
    setCurrentUser(updated);
  };

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="app">
      {/* ── SIDEBAR FIXO / OFF-CANVAS MOBILE ── */}
      <Sidebar
        currentView={currentView}
        onChangeView={(view) => {
          setCurrentView(view);
          setActiveId(null);
          setIsEditing(false);
          setIsMobileSidebarOpen(false);
        }}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
        currentUser={currentUser}
        onLogout={handleLogout}
        pendingReviewCount={pendingReviewCount}
        notesNotificationCount={notesNotificationCount}
      />

      {/* Backdrop para fechar o menu lateral no celular ao tocar fora */}
      {isMobileSidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── CONTEÚDO PRINCIPAL (MAIN) CONFORME PADRÃO DIGIFARMA GESTOR ── */}
      <main
        className={`app-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${
          isEditing ? 'is-editing-mode editing-main' : ''
        }`}
        id="main"
      >
        {/* Barra superior (Topbar) unificada no topo de todas as páginas */}
        {!isEditing && (
          <Navbar
            currentView={currentView}
            currentUser={currentUser}
            onLogout={handleLogout}
            onUpdateAvatar={handleUpdateAvatar}
            onToggleSidebarMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            pendingReviewCount={pendingReviewCount}
            notesNotificationCount={notesNotificationCount}
            notifications={unifiedNotifications}
            onNotificationClick={handleNotificationClick}
            onClearAllNotifications={handleClearAllNotifications}
            onNavigate={(view) => {
              setCurrentView(view);
              setActiveId(null);
              setIsEditing(false);
            }}
            onOpenRevision={() => {
              setCurrentView('revision');
              setActiveId(null);
              setIsEditing(false);
            }}
            onOpenNotes={() => {
              setCurrentView('publicacoes');
              setActiveId(null);
              setIsEditing(false);
            }}
          />
        )}
          {loading ? (
            <div className="empty-state">
              <Loader2 size={36} className="animate-spin" color="var(--primary-500)" />
              <p>Carregando procedimentos do Digifarma...</p>
            </div>
          ) : currentView === 'studio' && !isEditing && !editingProcedure ? (
            <StudioFormatSelector
              onSelectFormat={(format) => {
                const newProc: Procedure = {
                  id: `proc-${Date.now()}`,
                  title: 'Novo Procedimento Operacional Padrão',
                  subtitle: 'Descrição sumária da rotina e diretrizes de conformidade BPF',
                  category: 'Cadastros',
                  systemVersion: 'v10',
                  menuId: 'cadastros',
                  submenuId: 'rotina',
                  systemPath: 'Digifarma V10 ➔ Cadastros',
                  status: 'pendente',
                  author: currentUser?.name || currentUser?.username || 'Leonardo Trevas',
                  formatType: format,
                  tags: ['BPF', 'V10', format.toUpperCase()],
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  blocks: [
                    {
                      id: `step-${Date.now()}-1`,
                      type: 'step',
                      title: 'Acesso à Rotina no Digifarma',
                      content: 'Navegue pelo menu lateral e selecione o módulo correspondente.',
                      instruction: 'Acesse o sistema com suas credenciais homologadas e abra o formulário principal.',
                      expectedResult: 'Janela da rotina carregada em tela única com campos desbloqueados.',
                      tips: 'Use a tecla F2 para busca rápida de registros.',
                      warnings: 'Confirme se o turno do caixa ou o lote do produto estão abertos antes de continuar.',
                      completed: false,
                    },
                  ],
                };
                setEditingProcedure(newProc);
                setIsEditing(true);
              }}
              onBack={() => {
                setCurrentView('dashboard');
              }}
            />
          ) : isEditing || currentView === 'studio' ? (
            <ProcedureEditor
              initialProcedure={editingProcedure}
              menus={menus}
              activeVersion="v10"
              currentUser={currentUser}
              onSave={handleSaveProcedure}
              onCancel={() => {
                setIsEditing(false);
                setEditingProcedure(null);
                setCurrentView(activeId ? 'procedure-detail' : 'dashboard');
              }}
            />
          ) : currentView === 'procedure-detail' && activeProcedure ? (
            <ProcedureView
              procedure={activeProcedure}
              menus={menus}
              onEdit={() => handleEditProcedure(activeProcedure)}
              onDelete={() => handleDeleteClick(activeProcedure)}
              onOpenImageLightbox={(url, caption) =>
                setLightboxState({ isOpen: true, url, caption })
              }
              onUpdateStepCompletion={handleStepCompletionToggle}
              onBack={handleBackFromProcedure}
              autoPrint={autoPrintActive}
              onToggleActive={() => handleToggleActiveProcedure(activeProcedure.id)}
              onUnpublish={() => handleUnpublishProcedure(activeProcedure.id)}
              onSendToReview={() => handleSendToReview(activeProcedure.id)}
              onPublish={() => handlePublishDirectly(activeProcedure.id)}
              isEditorEnabled={isEditorEnabled}
              onOpenImport={handleOpenImportModal}
            />
          ) : currentView === 'conteudos' ? (
            <ContentsView
              procedures={procedures}
              onSelectVersion={(version) => setCurrentView(version)}
              onBackToDashboard={() => setCurrentView('dashboard')}
            />
          ) : currentView === 'v10' ? (
            <VersionModulesView
              version="v10"
              procedures={procedures}
              menus={menus}
              onSelectProcedure={handleSelectProcedure}
              onBackToDashboard={() => setCurrentView('conteudos')}
              onNewProcedure={handleNewProcedure}
              onOpenConfig={() => setCurrentView('utilitarios')}
              isEditorEnabled={isEditorEnabled}
              onOpenImport={(cat, mId, ver) => handleOpenImportModal(cat, mId, ver || 'v10')}
            />
          ) : currentView === 'r78' ? (
            <VersionModulesView
              version="r78"
              procedures={procedures}
              menus={menus}
              onSelectProcedure={handleSelectProcedure}
              onBackToDashboard={() => setCurrentView('conteudos')}
              onNewProcedure={handleNewProcedure}
              onOpenConfig={() => setCurrentView('utilitarios')}
              isEditorEnabled={isEditorEnabled}
              onOpenImport={(cat, mId, ver) => handleOpenImportModal(cat, mId, ver || 'r78')}
            />
          ) : currentView === 'revision' ? (
            <ReviewView
              procedures={procedures}
              currentUser={currentUser}
              onViewProcedure={(proc) => {
                setActiveId(proc.id);
                setCurrentView('procedure-detail');
              }}
              onEditProcedure={(proc) => {
                handleEditProcedure(proc);
              }}
              onApproveProcedure={handleApproveProcedure}
              onRequestAdjustments={handleRequestAdjustments}
              isEditorEnabled={isEditorEnabled}
              onOpenImport={handleOpenImportModal}
            />
          ) : currentView === 'arquivos' || currentView === 'internal' ? (
            <ArquivosView
              currentUser={currentUser}
              onBackToDashboard={() => setCurrentView('dashboard')}
            />
          ) : currentView === 'publicacoes' || currentView === 'notes' ? (
            <PublicacoesView
              currentUser={currentUser}
              onBackToDashboard={() => setCurrentView('dashboard')}
              onNotificationChange={(count) => setNotesNotificationCount(count)}
            />
          ) : currentView === 'mural' ? (
            <MuralView
              currentUser={currentUser}
              onBackToDashboard={() => setCurrentView('dashboard')}
            />
          ) : currentView === 'utilitarios' || currentView === 'personalize' ? (
            <UtilitiesView
              menus={menus}
              onSaveMenus={handleSaveMenus}
              currentUser={currentUser}
              onBackToDashboard={() => setCurrentView('dashboard')}
            />
          ) : currentView === 'config' ? (
            <SettingsView
              menus={menus}
              procedures={procedures}
              activeVersion="v10"
              currentUser={currentUser}
              onSaveMenus={handleSaveMenus}
              onSaveProcedures={handleSaveProceduresList}
              onLogout={handleLogout}
              onClose={() => setCurrentView('dashboard')}
              onlyMenus={false}
              isEditorEnabled={isEditorEnabled}
              onToggleEditor={handleToggleEditor}
              onSupabaseConnected={() => {
                checkConnection();
                loadData();
              }}
            />
          ) : (
            <DashboardView
              procedures={procedures}
              menus={menus}
              activeVersion="v10"
              onSelectProcedure={handleSelectProcedure}
              onNewProcedure={handleNewProcedure}
              onToggleActive={handleToggleActiveProcedure}
              onUnpublish={handleUnpublishProcedure}
              onSendToReview={handleSendToReview}
              onPublish={handlePublishDirectly}
              onDelete={handleDeleteClick}
              onEdit={handleEditProcedure}
              isEditorEnabled={isEditorEnabled}
              onOpenImport={(cat, mId) => handleOpenImportModal(cat, mId)}
            />
          )}

        {/* Rodapé Oficial Digifarma */}
        {!isEditing && (
          <footer>
            <span>Digifarma · Repositório de Procedimentos e Manuais</span>
            <span id="footerMeta">v10.4 &amp; Clássico · Treinamento Operacional</span>
          </footer>
        )}
      </main>

      {/* Modal de Supabase */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConnected={() => {
          checkConnection();
          loadData();
        }}
      />

      {/* Modal de Confirmação de Exclusão */}
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        procedureTitle={deleteModalState.procedure?.title || ''}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModalState({ isOpen: false, procedure: null })}
      />

      {/* Lightbox para Imagens Ampliadas */}
      <ImageLightbox
        isOpen={lightboxState.isOpen}
        imageUrl={lightboxState.url}
        caption={lightboxState.caption}
        onClose={() => setLightboxState({ isOpen: false, url: '' })}
      />

      {/* Modal Obrigatório de Redefinição de Senha no 1º Acesso */}
      {currentUser && currentUser.must_change_password && (
        <ResetPasswordModal
          user={currentUser}
          isOpen={true}
          forced={true}
          onSuccess={() => {
            const fresh = getCurrentUser();
            setCurrentUser(fresh);
          }}
        />
      )}

      {/* Modal Voluntário de Redefinição de Senha */}
      {currentUser && !currentUser.must_change_password && (
        <ResetPasswordModal
          user={currentUser}
          isOpen={isResetPasswordOpen}
          forced={false}
          onClose={() => setIsResetPasswordOpen(false)}
          onSuccess={() => {
            setIsResetPasswordOpen(false);
            const fresh = getCurrentUser();
            setCurrentUser(fresh);
          }}
        />
      )}

      {/* Modal de Escolha de Formato do Procedimento (HTML, PDF, Ambos) */}
      <NewProcedureFormatModal
        isOpen={isFormatModalOpen}
        onClose={() => setIsFormatModalOpen(false)}
        onSelectFormat={handleSelectProcedureFormat}
        targetVersion={pendingNewProcParams?.version === 'r78' ? 'classico' : 'v10'}
      />

      {/* Modal de Importação de Procedimentos (PDF, HTML ou Ambos com Tag Seletora) */}
      <ImportProcedureModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportTargetProcedure(null);
          setImportDefaultParams(null);
        }}
        onSave={handleSaveProcedure}
        existingProcedure={importTargetProcedure}
        menus={menus}
        currentUser={currentUser}
        defaultVersion={importDefaultParams?.version}
        defaultCategory={importDefaultParams?.category}
        defaultMenuId={importDefaultParams?.menuId}
      />
    </div>
  );
}

export default App;
