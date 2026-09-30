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
import { ProcedimentosListView } from './components/ProcedimentosListView';
import { AgendaView } from './components/AgendaView';
import { RelatoriosView } from './components/RelatoriosView';
import { IaConsultorView } from './components/IaConsultorView';
import { AiChatWidget } from './components/AiChatWidget';
import type { Procedure, SystemMenu, SystemVersion } from './types/procedure';
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
    return getSavedSystemVersion() || 'v10';
  });

  // Visão Ativa do Sistema (Padrão LH Group)
  const [currentView, setCurrentView] = useState<string>('dashboard');

  // Tema Escuro / Claro
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('digifarma_theme') === 'dark';
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
    setCurrentView('dashboard');
    setActiveId(null);
    setIsEditing(false);
  };

  const activeProcedure = procedures.find((p) => p.id === activeId) || null;

  // Ações de Navegação
  const handleSelectProcedure = (id: string) => {
    setActiveId(id);
    setCurrentView('procedure-detail');
    setIsEditing(false);
    setEditingProcedure(null);
  };

  const handleBackFromProcedure = () => {
    setActiveId(null);
    setCurrentView('dashboard');
  };

  const handleNewProcedure = () => {
    setEditingProcedure(null);
    setIsEditing(true);
    setCurrentView('editor');
  };

  const handleEditProcedure = () => {
    if (activeProcedure) {
      setEditingProcedure(activeProcedure);
      setIsEditing(true);
      setCurrentView('editor');
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
    setCurrentView('procedure-detail');
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
      setProcedures((prev) => prev.filter((p) => p.id !== idToDelete));
      setDeleteModalState({ isOpen: false, procedure: null });
      setActiveId(null);
      setCurrentView('procedimentos');
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

  return (
    <div className="app">
      {/* ── SIDEBAR FIXO À ESQUERDA (PADRÃO LH GROUP) ── */}
      <Sidebar
        menus={menus}
        procedures={procedures}
        activeVersion={activeVersion || 'v10'}
        activeId={activeId}
        currentView={currentView}
        onChangeView={(view) => {
          if (view === 'v10') {
            setActiveVersion('v10');
            saveSystemVersion('v10');
            setCurrentView('procedimentos');
          } else if (view === 'classico') {
            setActiveVersion('classico');
            saveSystemVersion('classico');
            setCurrentView('procedimentos');
          } else {
            setCurrentView(view);
          }
          setActiveId(null);
          setIsEditing(false);
        }}
        onSelectProcedure={handleSelectProcedure}
        onNewProcedure={handleNewProcedure}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* ── CONTEÚDO PRINCIPAL À DIREITA COM GLOBAL HEADER ── */}
      <div className="app-content">
        <Navbar
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          isSupabaseConnected={isSupabaseConnected}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          onOpenSettings={() => setCurrentView('config')}
          onNewProcedure={handleNewProcedure}
          activeVersion={activeVersion}
          onChangeVersion={handleSelectVersion}
          onReturnToVersionSelect={() => setCurrentView('dashboard')}
          procedures={procedures}
          onSelectProcedure={handleSelectProcedure}
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
              activeVersion={activeVersion || 'v10'}
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
              onEdit={handleEditProcedure}
              onDelete={handleDeleteClick}
              onOpenImageLightbox={(url, caption) =>
                setLightboxState({ isOpen: true, url, caption })
              }
              onUpdateStepCompletion={handleStepCompletionToggle}
              onBack={handleBackFromProcedure}
            />
          ) : currentView === 'procedimentos' ? (
            <ProcedimentosListView
              procedures={procedures}
              menus={menus}
              activeVersion={activeVersion || 'v10'}
              onSelectProcedure={handleSelectProcedure}
              onNewProcedure={handleNewProcedure}
              onEditProcedure={(proc) => {
                setEditingProcedure(proc);
                setIsEditing(true);
                setCurrentView('editor');
              }}
              onDeleteProcedure={(proc) => {
                setDeleteModalState({ isOpen: true, procedure: proc });
              }}
            />
          ) : currentView === 'ia' ? (
            <IaConsultorView
              procedures={procedures}
              activeVersion={activeVersion || 'v10'}
              onSelectProcedure={handleSelectProcedure}
            />
          ) : currentView === 'agenda' ? (
            <AgendaView />
          ) : currentView === 'relatorios' ? (
            <RelatoriosView procedures={procedures} menus={menus} />
          ) : currentView === 'config' ? (
            <SettingsView
              menus={menus}
              procedures={procedures}
              activeVersion={activeVersion || 'v10'}
              onSaveMenus={handleSaveMenus}
              onSaveProcedures={handleSaveProceduresList}
              onClose={() => setCurrentView('dashboard')}
              onSupabaseConnected={() => {
                checkConnection();
                loadData();
              }}
            />
          ) : (
            <DashboardView
              procedures={procedures}
              menus={menus}
              activeVersion={activeVersion || 'v10'}
              onSelectProcedure={handleSelectProcedure}
              onNewProcedure={handleNewProcedure}
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
