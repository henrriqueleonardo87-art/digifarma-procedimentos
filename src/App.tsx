import { useState, useEffect } from 'react';
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
import { LoginScreen } from './components/LoginScreen';
import { ResetPasswordModal } from './components/ResetPasswordModal';
import type { Procedure, SystemMenu } from './types/procedure';
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
import { Loader2 } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => getCurrentUser());
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('digifarma_sidebar_collapsed') === 'true';
  });

  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [menus, setMenus] = useState<SystemMenu[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [autoPrintActive, setAutoPrintActive] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null);

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
    loadData();
    checkConnection();
  }, []);

  // Efeito de Tema
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('digifarma_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

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

  const handleNewProcedure = (defaultCategory?: string, defaultMenuId?: string, forceVersion?: 'v10' | 'r78') => {
    const effectiveVersion = forceVersion || (currentView === 'r78' ? 'r78' : 'v10');
    const isR78 = effectiveVersion === 'r78';
    const cat = defaultCategory || 'Vendas';
    const mId = defaultMenuId || 'vendas';
    const newProc: Procedure = {
      id: `proc-${Date.now()}`,
      title: 'Novo Procedimento Operacional Padrão',
      subtitle: 'Descrição sumária da rotina e diretrizes BPF',
      category: cat,
      systemVersion: isR78 ? 'classico' : 'v10',
      menuId: mId,
      submenuId: 'rotina',
      systemPath: `${isR78 ? 'Digifarma Clássico' : 'Digifarma V10'} ➔ ${cat}`,
      status: 'pendente',
      author: 'Farmacêutico Responsável',
      tags: ['BPF', isR78 ? 'Clássico' : 'V10'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      blocks: [
        {
          id: `step-${Date.now()}-1`,
          type: 'step',
          content: 'Acessar o módulo correspondente e conferir os dados antes de validar a operação.',
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
      />

      {/* Backdrop para fechar o menu lateral no celular ao tocar fora */}
      {isMobileSidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── CONTEÚDO PRINCIPAL À DIREITA COM GLOBAL HEADER "OLÁ, PESSOA" ── */}
      <div className={`app-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Navbar
          currentUser={currentUser}
          onLogout={handleLogout}
          onUpdateAvatar={handleUpdateAvatar}
          onToggleSidebarMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          pendingReviewCount={pendingReviewCount}
          onOpenRevision={() => {
            setCurrentView('revision');
            setActiveId(null);
            setIsEditing(false);
          }}
        />

        <main className="main" id="main">
          {loading ? (
            <div className="empty-state">
              <Loader2 size={36} className="animate-spin" color="var(--primary-500)" />
              <p>Carregando procedimentos do Digifarma...</p>
            </div>
          ) : isEditing ? (
            <ProcedureEditor
              initialProcedure={editingProcedure}
              menus={menus}
              activeVersion={currentView === 'r78' ? 'classico' : 'v10'}
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
            />
          ) : currentView === 'v10' ? (
            <VersionModulesView
              version="v10"
              procedures={procedures}
              menus={menus}
              onSelectProcedure={handleSelectProcedure}
              onBackToDashboard={() => setCurrentView('dashboard')}
              onNewProcedure={handleNewProcedure}
              onOpenConfig={() => setCurrentView('personalize')}
            />
          ) : currentView === 'r78' ? (
            <VersionModulesView
              version="r78"
              procedures={procedures}
              menus={menus}
              onSelectProcedure={handleSelectProcedure}
              onBackToDashboard={() => setCurrentView('dashboard')}
              onNewProcedure={handleNewProcedure}
              onOpenConfig={() => setCurrentView('personalize')}
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
            />
          ) : currentView === 'personalize' ? (
            <SettingsView
              menus={menus}
              procedures={procedures}
              activeVersion="v10"
              currentUser={currentUser}
              onSaveMenus={handleSaveMenus}
              onSaveProcedures={handleSaveProceduresList}
              onLogout={handleLogout}
              onClose={() => setCurrentView('dashboard')}
              onlyMenus={true}
              onSupabaseConnected={() => {
                checkConnection();
                loadData();
              }}
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
            />
          )}
        </main>
      </div>

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
    </div>
  );
}

export default App;
