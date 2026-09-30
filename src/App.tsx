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
  const [autoPrintActive, setAutoPrintActive] = useState<boolean>(false);
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

  const handleSelectVersion = (version: SystemVersion) => {
    setActiveVersion(version);
    saveSystemVersion(version);
    setCurrentView('procedimentos');
    setActiveId(null);
    setIsEditing(false);
  };

  const handleBackFromProcedure = () => {
    setActiveId(null);
    setAutoPrintActive(false);
    setCurrentView('procedimentos');
  };

  const handleNewProcedure = () => {
    const newProc: Procedure = {
      id: `proc-${Date.now()}`,
      title: 'Novo Procedimento Operacional Padrão',
      subtitle: 'Descrição sumária da rotina e diretrizes BPF',
      category: 'Cadastros',
      systemVersion: activeVersion || 'v10',
      menuId: 'cadastros',
      submenuId: 'produtos',
      systemPath: `${activeVersion === 'v10' ? 'Digifarma V10' : 'Digifarma Clássico'} ➔ Cadastros ➔ Produtos`,
      author: 'Farmacêutico Responsável',
      tags: ['BPF', activeVersion === 'v10' ? 'V10' : 'Clássico'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      blocks: [
        {
          id: `step-${Date.now()}-1`,
          type: 'step',
          content: 'Acessar o módulo correspondente e conferir os dados cadastrais antes de validar a operação.',
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
          onReturnToVersionSelect={() => {
            setCurrentView('procedimentos');
            setActiveId(null);
          }}
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
              autoPrint={autoPrintActive}
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
              onChangeVersion={handleSelectVersion}
            />
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
              onNavigateToVersion={handleSelectVersion}
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
    </div>
  );
}

export default App;
