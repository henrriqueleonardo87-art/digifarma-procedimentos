import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ProcedureView } from './components/ProcedureView';
import { ProcedureEditor } from './components/ProcedureEditor';
import { SupabaseModal } from './components/SupabaseModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ImageLightbox } from './components/ImageLightbox';
import { VersionSelectScreen } from './components/VersionSelectScreen';
import { SettingsView } from './components/SettingsView';
import { DashboardView } from './components/DashboardView';
import { AiChatWidget } from './components/AiChatWidget';
import type { Procedure, StepBlock, SystemMenu, SystemVersion } from './types/procedure';
import {
  fetchAllProcedures,
  saveProcedure,
  deleteProcedure,
  fetchSystemMenus,
  saveSystemMenus,
  getSavedSystemVersion,
  saveSystemVersion,
} from './lib/storageService';
import { testConnection } from './lib/supabase';
import { Loader2 } from 'lucide-react';

export function App() {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [menus, setMenus] = useState<SystemMenu[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null);

  // Versão Ativa do Sistema (Digifarma Clássico vs V10)
  const [activeVersion, setActiveVersion] = useState<SystemVersion | null>(() => {
    return getSavedSystemVersion();
  });

  // Visualização do Dashboard Principal com Métricas
  const [isDashboard, setIsDashboard] = useState<boolean>(true);

  // Tela de Configurações Aberta
  const [isConfiguring, setIsConfiguring] = useState(false);

  // Tema Escuro / Claro
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('digifarma_theme') === 'dark';
  });

  // Estado do Sidebar Colapsado (Mini Rail com Ícones)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('digifarma_sidebar_collapsed') === 'true';
  });

  // Supabase State
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
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

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');

  // Inicialização
  const loadData = async () => {
    try {
      const [procsData, menusData] = await Promise.all([
        fetchAllProcedures(),
        fetchSystemMenus(),
      ]);
      setProcedures(procsData);
      setMenus(menusData);

      if (procsData.length > 0 && !activeId) {
        setActiveId(procsData[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkConnection = async () => {
    const res = await testConnection();
    setIsSupabaseConnected(res.success);
  };

  useEffect(() => {
    loadData();
    checkConnection();
  }, []);

  // Efeito de Tema
  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('digifarma_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('digifarma_theme', 'light');
    }
  }, [darkMode]);

  // Alternar Versão (Clássico / V10)
  const handleSelectVersion = (version: SystemVersion) => {
    setActiveVersion(version);
    saveSystemVersion(version);
    setIsDashboard(true);
    setActiveId(null);
    setIsEditing(false);
    setIsConfiguring(false);
  };

  const handleOpenDashboard = () => {
    setIsDashboard(true);
    setActiveId(null);
    setIsEditing(false);
    setIsConfiguring(false);
  };

  // Efeito de Collapse do Sidebar
  const handleToggleSidebarCollapse = () => {
    const next = !isSidebarCollapsed;
    setIsSidebarCollapsed(next);
    localStorage.setItem('digifarma_sidebar_collapsed', String(next));
  };

  const activeProcedure = procedures.find((p) => p.id === activeId) || null;

  // Ações de Navegação
  const handleSelectProcedure = (id: string) => {
    setActiveId(id);
    setIsDashboard(false);
    setIsEditing(false);
    setEditingProcedure(null);
    setIsConfiguring(false);
  };

  const handleNewProcedure = () => {
    setEditingProcedure(null);
    setIsEditing(true);
    setIsConfiguring(false);
  };

  const handleEditProcedure = () => {
    if (activeProcedure) {
      setEditingProcedure(activeProcedure);
      setIsEditing(true);
      setIsConfiguring(false);
    }
  };

  const handleSaveProcedure = async (procToSave: Procedure) => {
    const saved = await saveProcedure(procToSave);
    setProcedures((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    setActiveId(saved.id);
    setIsEditing(false);
    setEditingProcedure(null);
  };

  const handleDeleteClick = () => {
    if (activeProcedure) {
      setDeleteModalState({
        isOpen: true,
        procedure: activeProcedure,
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteModalState.procedure) {
      const idToDelete = deleteModalState.procedure.id;
      await deleteProcedure(idToDelete);
      const remaining = procedures.filter((p) => p.id !== idToDelete);
      setProcedures(remaining);
      setActiveId(remaining.length > 0 ? remaining[0].id : null);
      setDeleteModalState({ isOpen: false, procedure: null });
      setIsEditing(false);
    }
  };

  const handleStepCompletionToggle = async (blockId: string, completed: boolean) => {
    if (!activeProcedure) return;

    const updatedBlocks = activeProcedure.blocks.map((block) => {
      if (block.id === blockId && block.type === 'step') {
        return { ...(block as StepBlock), completed };
      }
      return block;
    });

    const updatedProc: Procedure = {
      ...activeProcedure,
      blocks: updatedBlocks,
    };

    setProcedures((prev) =>
      prev.map((p) => (p.id === updatedProc.id ? updatedProc : p))
    );
    await saveProcedure(updatedProc);
  };

  const handleSaveMenus = async (newMenus: SystemMenu[]) => {
    setMenus(newMenus);
    await saveSystemMenus(newMenus);
  };

  const handleSaveProceduresList = async (newList: Procedure[]) => {
    setProcedures(newList);
    localStorage.setItem('digifarma_local_procedures', JSON.stringify(newList));
  };

  // ==============================================================
  // RENDERIZAÇÃO: SE NENHUMA VERSÃO ESTIVER SELECIONADA
  // EXIBE OS 2 CARDS INICIAIS (Digifarma Clássico vs V10)
  // ==============================================================
  if (!activeVersion) {
    if (isConfiguring) {
      return (
        <div className="app-container">
          <Navbar
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode(!darkMode)}
            isSupabaseConnected={isSupabaseConnected}
            onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
            onOpenSettings={() => setIsConfiguring(true)}
            onNewProcedure={handleNewProcedure}
            activeVersion={null}
            onChangeVersion={handleSelectVersion}
            onReturnToVersionSelect={() => setActiveVersion(null)}
          />
          <main className="content-area expanded-view" style={{ padding: '1.5rem', overflowY: 'auto' }}>
            <SettingsView
              menus={menus}
              procedures={procedures}
              activeVersion={null}
              onSaveMenus={handleSaveMenus}
              onSaveProcedures={handleSaveProceduresList}
              onClose={() => setIsConfiguring(false)}
              onSupabaseConnected={() => {
                checkConnection();
                loadData();
              }}
            />
          </main>
          <SupabaseModal
            isOpen={isSupabaseModalOpen}
            onClose={() => setIsSupabaseModalOpen(false)}
            onConnected={() => {
              checkConnection();
              loadData();
            }}
          />
        </div>
      );
    }

    return (
      <div className="app-container">
        <Navbar
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          isSupabaseConnected={isSupabaseConnected}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          onOpenSettings={() => setIsConfiguring(true)}
          onNewProcedure={handleNewProcedure}
          activeVersion={null}
          onChangeVersion={handleSelectVersion}
          onReturnToVersionSelect={() => setActiveVersion(null)}
        />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <VersionSelectScreen
            procedures={procedures}
            onSelectVersion={handleSelectVersion}
          />
        </main>
        <SupabaseModal
          isOpen={isSupabaseModalOpen}
          onClose={() => setIsSupabaseModalOpen(false)}
          onConnected={() => {
            checkConnection();
            loadData();
          }}
        />
      </div>
    );
  }

  // ==============================================================
  // RENDERIZAÇÃO PRINCIPAL DO SITE (VERSÃO ESPECÍFICA ATIVA)
  // ==============================================================
  return (
    <div className="app-container">
      {/* Top Navigation */}
      <Navbar
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        isSupabaseConnected={isSupabaseConnected}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenSettings={() => setIsConfiguring(true)}
        onNewProcedure={handleNewProcedure}
        activeVersion={activeVersion}
        onChangeVersion={handleSelectVersion}
        onReturnToVersionSelect={() => setActiveVersion(null)}
        procedures={procedures}
        onSelectProcedure={handleSelectProcedure}
      />

      <div className="app-main">
        {/* Painel Lateral Filtrado pela Versão */}
        <Sidebar
          menus={menus}
          procedures={procedures}
          activeVersion={activeVersion}
          activeId={activeId}
          isDashboardActive={isDashboard}
          onOpenDashboard={handleOpenDashboard}
          onSelectProcedure={handleSelectProcedure}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebarCollapse}
          onOpenSettings={() => setIsConfiguring(true)}
          onNewProcedure={handleNewProcedure}
        />

        {/* Área Central / Conteúdo, Editor, Dashboard ou Configurações */}
        <main className={`content-area ${isSidebarCollapsed ? 'expanded-view' : ''}`}>
          {isConfiguring ? (
            <SettingsView
              menus={menus}
              procedures={procedures}
              activeVersion={activeVersion}
              onSaveMenus={handleSaveMenus}
              onSaveProcedures={handleSaveProceduresList}
              onClose={() => setIsConfiguring(false)}
              onSupabaseConnected={() => {
                checkConnection();
                loadData();
              }}
            />
          ) : loading ? (
            <div className="empty-state">
              <Loader2 size={36} className="animate-spin" color="var(--primary-500)" />
              <p>Carregando procedimentos do Digifarma...</p>
            </div>
          ) : isEditing ? (
            <ProcedureEditor
              initialProcedure={editingProcedure}
              menus={menus}
              activeVersion={activeVersion}
              onSave={handleSaveProcedure}
              onCancel={() => {
                setIsEditing(false);
                setEditingProcedure(null);
              }}
            />
          ) : isDashboard || !activeProcedure ? (
            <DashboardView
              procedures={procedures}
              menus={menus}
              activeVersion={activeVersion}
              onSelectProcedure={handleSelectProcedure}
              onNewProcedure={handleNewProcedure}
            />
          ) : (
            <ProcedureView
              procedure={activeProcedure}
              menus={menus}
              onEdit={handleEditProcedure}
              onDelete={handleDeleteClick}
              onOpenImageLightbox={(url, caption) =>
                setLightboxState({ isOpen: true, url, caption })
              }
              onUpdateStepCompletion={handleStepCompletionToggle}
            />
          )}
        </main>
      </div>

      {/* Assistente Flutuante IA Leo (Padrão LH Group) */}
      <AiChatWidget
        procedures={procedures}
        activeVersion={activeVersion || 'v10'}
        onSelectProcedure={handleSelectProcedure}
      />

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
    </div>
  );
}

export default App;
