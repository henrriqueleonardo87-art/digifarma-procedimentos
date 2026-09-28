import React, { useState } from 'react';
import {
  ArrowLeft,
  Layers,
  Database,
  Download,
  Upload,
  Plus,
  Trash2,
  Check,
  Folder,
  Copy,
  Monitor,
  Rocket,
  RefreshCw,
  FolderPlus,
  Boxes,
  Wrench,
  Package,
  Users,
  Truck,
  Settings as SettingsIcon,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import type { SystemMenu, SubmenuItem, SystemVersion, Procedure } from '../types/procedure';
import { getSavedConfig, saveConfig, testConnection } from '../lib/supabase';
import { INITIAL_PROCEDURES, DEFAULT_SYSTEM_MENUS } from '../lib/storageService';

interface SettingsViewProps {
  menus: SystemMenu[];
  procedures: Procedure[];
  activeVersion: SystemVersion | null;
  onSaveMenus: (menus: SystemMenu[]) => Promise<void>;
  onSaveProcedures: (procedures: Procedure[]) => Promise<void>;
  onClose: () => void;
  onSupabaseConnected?: () => void;
}

const AVAILABLE_ICONS = [
  { name: 'FolderPlus', label: 'Cadastros / Pastas' },
  { name: 'Boxes', label: 'Estoque / Armazém' },
  { name: 'CreditCard', label: 'Caixa / Financeiro' },
  { name: 'Package', label: 'Produtos / Medicamentos' },
  { name: 'Users', label: 'Clientes / Equipe' },
  { name: 'Truck', label: 'Fornecedores / Logística' },
  { name: 'Wrench', label: 'Utilitários / Ferramentas' },
  { name: 'Settings', label: 'Configurações' },
  { name: 'ShieldCheck', label: 'Segurança / Convênios' },
  { name: 'Database', label: 'Banco de Dados / Backup' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  menus,
  procedures,
  activeVersion,
  onSaveMenus,
  onSaveProcedures,
  onClose,
  onSupabaseConnected,
}) => {
  const [activeTab, setActiveTab] = useState<'menus' | 'supabase' | 'backup'>('menus');

  // Menus State
  const [currentMenus, setCurrentMenus] = useState<SystemMenu[]>(menus);
  const [newMenuLabel, setNewMenuLabel] = useState('');
  const [newMenuIcon, setNewMenuIcon] = useState('FolderPlus');
  const [newMenuVersion, setNewMenuVersion] = useState<SystemVersion | 'ambos'>(activeVersion || 'ambos');
  const [activeMenuForSubmenu, setActiveMenuForSubmenu] = useState<string | null>(null);
  const [newSubmenuLabel, setNewSubmenuLabel] = useState('');
  const [menuFilterVersion, setMenuFilterVersion] = useState<'todos' | SystemVersion>('todos');
  const [menuSaveMessage, setMenuSaveMessage] = useState<string | null>(null);

  // Supabase State
  const [supabaseConfig, setSupabaseConfig] = useState(getSavedConfig());
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [supabaseResult, setSupabaseResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // ==========================================
  // GESTÃO DE MÓDULOS E ROTINAS
  // ==========================================
  const handleAddMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuLabel.trim()) return;

    const id = newMenuLabel
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-');

    if (currentMenus.some((m) => m.id === id)) {
      alert('Já existe um módulo com este identificador.');
      return;
    }

    const created: SystemMenu = {
      id,
      label: newMenuLabel.trim(),
      icon: newMenuIcon,
      version: newMenuVersion,
      submenus: [],
    };

    const updated = [...currentMenus, created];
    setCurrentMenus(updated);
    setNewMenuLabel('');
    autoSaveMenus(updated);
  };

  const handleRemoveMenu = (menuId: string) => {
    if (confirm('Tem certeza de que deseja excluir este módulo e todos os procedimentos dele?')) {
      const updated = currentMenus.filter((m) => m.id !== menuId);
      setCurrentMenus(updated);
      autoSaveMenus(updated);
    }
  };

  const handleAddSubmenu = (menuId: string) => {
    if (!newSubmenuLabel.trim()) return;

    const subId = newSubmenuLabel
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-');

    const updated = currentMenus.map((m) => {
      if (m.id === menuId) {
        if (m.submenus.some((s) => s.id === subId)) {
          alert('Já existe uma rotina com este nome neste módulo.');
          return m;
        }
        const newSub: SubmenuItem = {
          id: subId,
          label: newSubmenuLabel.trim(),
        };
        return { ...m, submenus: [...m.submenus, newSub] };
      }
      return m;
    });

    setCurrentMenus(updated);
    setNewSubmenuLabel('');
    setActiveMenuForSubmenu(null);
    autoSaveMenus(updated);
  };

  const handleRemoveSubmenu = (menuId: string, subId: string) => {
    const updated = currentMenus.map((m) => {
      if (m.id === menuId) {
        return { ...m, submenus: m.submenus.filter((s) => s.id !== subId) };
      }
      return m;
    });
    setCurrentMenus(updated);
    autoSaveMenus(updated);
  };

  const autoSaveMenus = async (newMenuList: SystemMenu[]) => {
    await onSaveMenus(newMenuList);
    setMenuSaveMessage('Alterações salvas com sucesso!');
    setTimeout(() => setMenuSaveMessage(null), 2500);
  };

  // Mapeamento de ícones limpos
  const getIcon = (iconName?: string, size = 15) => {
    switch (iconName) {
      case 'FolderPlus':
        return <FolderPlus size={size} />;
      case 'Boxes':
        return <Boxes size={size} />;
      case 'Wrench':
        return <Wrench size={size} />;
      case 'Package':
        return <Package size={size} />;
      case 'Users':
        return <Users size={size} />;
      case 'Truck':
        return <Truck size={size} />;
      case 'ShieldCheck':
        return <ShieldCheck size={size} />;
      case 'Settings':
        return <SettingsIcon size={size} />;
      case 'CreditCard':
        return <CreditCard size={size} />;
      default:
        return <Folder size={size} />;
    }
  };

  // ==========================================
  // SUPABASE
  // ==========================================
  const handleSaveSupabase = async () => {
    saveConfig(supabaseConfig);
    setTestingSupabase(true);
    setSupabaseResult(null);

    const res = await testConnection();
    setTestingSupabase(false);
    setSupabaseResult(res);

    if (res.success && onSupabaseConnected) {
      onSupabaseConnected();
    }
  };

  const copySqlScript = () => {
    const sql = `-- Script de Configuração Digifarma
CREATE TABLE IF NOT EXISTS public.procedures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    category TEXT NOT NULL DEFAULT 'Geral',
    author TEXT DEFAULT 'Administrador',
    blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
    tags TEXT[] DEFAULT '{}',
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permissao Total Procedimentos" ON public.procedures FOR ALL USING (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('procedure-media', 'procedure-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Storage Acesso Publico Leitura" ON storage.objects FOR SELECT USING (bucket_id = 'procedure-media');
CREATE POLICY "Storage Acesso Publico Insercao" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'procedure-media');`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // ==========================================
  // BACKUP E RESTAURAÇÃO
  // ==========================================
  const handleExportBackup = () => {
    const backupData = {
      version: '3.0',
      exportDate: new Date().toISOString(),
      menus: currentMenus,
      procedures,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `digifarma-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.menus && Array.isArray(parsed.menus)) {
          await onSaveMenus(parsed.menus);
          setCurrentMenus(parsed.menus);
        }
        if (parsed.procedures && Array.isArray(parsed.procedures)) {
          await onSaveProcedures(parsed.procedures);
        }
        alert('Backup importado com sucesso!');
      } catch {
        alert('Arquivo de backup inválido.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefaults = async () => {
    if (confirm('Deseja restaurar os módulos e procedimentos padrão de demonstração?')) {
      await onSaveMenus(DEFAULT_SYSTEM_MENUS);
      setCurrentMenus(DEFAULT_SYSTEM_MENUS);
      await onSaveProcedures(INITIAL_PROCEDURES);
      alert('Padrões restaurados com sucesso!');
    }
  };

  const filteredMenus = currentMenus.filter((m) => {
    if (menuFilterVersion === 'todos') return true;
    return m.version === menuFilterVersion || m.version === 'ambos' || !m.version;
  });

  return (
    <div className="settings-page-container">
      {/* Topo com botão Voltar */}
      <div className="settings-nav-header">
        <button
          type="button"
          className="btn-back-clean"
          onClick={onClose}
          title="Voltar aos manuais"
        >
          <ArrowLeft size={16} />
          <span>Voltar aos Manuais</span>
        </button>

        {menuSaveMessage && (
          <div className="settings-toast-pill">
            <Check size={14} />
            <span>{menuSaveMessage}</span>
          </div>
        )}
      </div>

      <div className="settings-page-title-box">
        <h1 className="settings-page-title">Configurações do Digifarma</h1>
        <p className="settings-page-subtitle">
          Gerencie a organização dos módulos do sistema, rotinas, conexão em nuvem e backups.
        </p>
      </div>

      {/* Abas Limpas */}
      <div className="settings-tabs-clean">
        <button
          type="button"
          className={`settings-tab-item ${activeTab === 'menus' ? 'active' : ''}`}
          onClick={() => setActiveTab('menus')}
        >
          <Layers size={16} />
          <span>Módulos e Procedimentos</span>
        </button>

        <button
          type="button"
          className={`settings-tab-item ${activeTab === 'supabase' ? 'active' : ''}`}
          onClick={() => setActiveTab('supabase')}
        >
          <Database size={16} />
          <span>Conexão Nuvem / Supabase</span>
        </button>

        <button
          type="button"
          className={`settings-tab-item ${activeTab === 'backup' ? 'active' : ''}`}
          onClick={() => setActiveTab('backup')}
        >
          <Download size={16} />
          <span>Backup e Restauração</span>
        </button>
      </div>

      {/* ==============================================================
          ABA 1: GESTÃO DE MÓDULOS E ROTINAS (ORGANIZADO)
          ============================================================== */}
      {activeTab === 'menus' && (
        <div className="settings-panel-box">
          <div className="settings-panel-top">
            <div>
              <h2 className="settings-section-title">Estrutura de Módulos do Sistema</h2>
              <p className="settings-section-desc">
                Cada módulo (ex: Cadastros, Estoque, Utilitários) reúne seus respectivos procedimentos operacionais (ex: Clientes, Produtos, Notas).
              </p>
            </div>

            {/* Filtro por Versão */}
            <div className="version-filter-chips">
              <span className="filter-label">Filtrar:</span>
              <button
                type="button"
                className={`filter-chip ${menuFilterVersion === 'todos' ? 'active' : ''}`}
                onClick={() => setMenuFilterVersion('todos')}
              >
                Todos
              </button>
              <button
                type="button"
                className={`filter-chip ${menuFilterVersion === 'classico' ? 'active' : ''}`}
                onClick={() => setMenuFilterVersion('classico')}
              >
                <Monitor size={12} />
                Clássico
              </button>
              <button
                type="button"
                className={`filter-chip ${menuFilterVersion === 'v10' ? 'active' : ''}`}
                onClick={() => setMenuFilterVersion('v10')}
              >
                <Rocket size={12} />
                V10
              </button>
            </div>
          </div>

          {/* Formulário: Criar Novo Módulo */}
          <form onSubmit={handleAddMenu} className="add-module-form">
            <div className="add-module-row">
              <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                <label className="form-label">Nome do Novo Módulo</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Vendas, Financeiro, Fiscal, Delivery..."
                  value={newMenuLabel}
                  onChange={(e) => setNewMenuLabel(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ width: '200px', marginBottom: 0 }}>
                <label className="form-label">Ícone</label>
                <select
                  className="form-select"
                  value={newMenuIcon}
                  onChange={(e) => setNewMenuIcon(e.target.value)}
                >
                  {AVAILABLE_ICONS.map((i) => (
                    <option key={i.name} value={i.name}>
                      {i.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ width: '180px', marginBottom: 0 }}>
                <label className="form-label">Versão do Sistema</label>
                <select
                  className="form-select"
                  value={newMenuVersion}
                  onChange={(e) => setNewMenuVersion(e.target.value as SystemVersion | 'ambos')}
                >
                  <option value="ambos">Ambas as Versões</option>
                  <option value="classico">Digifarma Clássico</option>
                  <option value="v10">Digifarma V10</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', height: '38px' }}>
                <Plus size={15} />
                <span>Criar Módulo</span>
              </button>
            </div>
          </form>

          {/* Lista de Módulos e Rotinas */}
          <div className="modules-management-list">
            {filteredMenus.map((menu) => (
              <div key={menu.id} className="module-manage-card">
                {/* Cabeçalho do Módulo */}
                <div className="module-manage-header">
                  <div className="module-manage-info">
                    <span className="module-manage-icon">
                      {getIcon(menu.icon, 18)}
                    </span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span className="module-manage-title">{menu.label}</span>
                        <span className="version-pill-tiny">
                          {menu.version === 'v10' ? 'V10' : menu.version === 'classico' ? 'Clássico' : 'Ambos'}
                        </span>
                      </div>
                      <span className="module-manage-sub">
                        {menu.submenus.length} {menu.submenus.length === 1 ? 'procedimento cadastrado' : 'procedimentos cadastrados'}
                      </span>
                    </div>
                  </div>

                  <div className="module-manage-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }}
                      onClick={() =>
                        setActiveMenuForSubmenu(activeMenuForSubmenu === menu.id ? null : menu.id)
                      }
                    >
                      <Plus size={13} />
                      <span>+ Adicionar Rotina</span>
                    </button>

                    <button
                      type="button"
                      className="btn-icon-danger-minimal"
                      onClick={() => handleRemoveMenu(menu.id)}
                      title="Excluir este módulo"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Inline Form para adicionar rotina */}
                {activeMenuForSubmenu === menu.id && (
                  <div className="inline-add-routine-box">
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary-600)' }}>
                      Nova Rotina em "{menu.label}":
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: Clientes, Produtos, Fechamento de Caixa..."
                        value={newSubmenuLabel}
                        onChange={(e) => setNewSubmenuLabel(e.target.value)}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleAddSubmenu(menu.id)}
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setActiveMenuForSubmenu(null);
                          setNewSubmenuLabel('');
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de Rotinas / Procedimentos dentro do Módulo */}
                <div className="routines-chips-list">
                  {menu.submenus.length === 0 ? (
                    <span className="routines-empty-text">Nenhuma rotina cadastrada neste módulo.</span>
                  ) : (
                    menu.submenus.map((sub) => (
                      <div key={sub.id} className="routine-manage-pill">
                        <span className="routine-pill-label">{sub.label}</span>
                        <button
                          type="button"
                          className="btn-remove-routine"
                          onClick={() => handleRemoveSubmenu(menu.id, sub.id)}
                          title={`Remover rotina ${sub.label}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==============================================================
          ABA 2: CONEXÃO NUVEM / SUPABASE
          ============================================================== */}
      {activeTab === 'supabase' && (
        <div className="settings-panel-box">
          <h2 className="settings-section-title">Conexão com a Nuvem Supabase</h2>
          <p className="settings-section-desc">
            Sincronize todos os manuais, imagens e regras na nuvem privada da sua farmácia.
          </p>

          <div className="form-group">
            <label className="form-label">Project URL (Supabase)</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://xyzcompany.supabase.co"
              value={supabaseConfig.url}
              onChange={(e) => setSupabaseConfig({ ...supabaseConfig, url: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Anon / Public API Key</label>
            <input
              type="password"
              className="form-input"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={supabaseConfig.anonKey}
              onChange={(e) => setSupabaseConfig({ ...supabaseConfig, anonKey: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Storage Bucket de Imagens</label>
            <input
              type="text"
              className="form-input"
              placeholder="procedure-media"
              value={supabaseConfig.bucketName}
              onChange={(e) => setSupabaseConfig({ ...supabaseConfig, bucketName: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveSupabase}
              disabled={testingSupabase}
            >
              {testingSupabase ? <RefreshCw size={14} className="animate-spin" /> : <Database size={14} />}
              <span>{testingSupabase ? 'Testando Conexão...' : 'Salvar e Testar Conexão'}</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={copySqlScript}
            >
              {copiedSql ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copiedSql ? 'SQL Copiado!' : 'Copiar Script SQL'}</span>
            </button>
          </div>

          {supabaseResult && (
            <div
              className={`callout-card-minimal ${supabaseResult.success ? 'callout-success' : 'callout-danger'}`}
              style={{ marginTop: '1rem' }}
            >
              <CheckCircle2 size={16} />
              <div>{supabaseResult.message}</div>
            </div>
          )}
        </div>
      )}

      {/* ==============================================================
          ABA 3: BACKUP E RESTAURAÇÃO
          ============================================================== */}
      {activeTab === 'backup' && (
        <div className="settings-panel-box">
          <h2 className="settings-section-title">Backup e Restauração de Dados</h2>
          <p className="settings-section-desc">
            Exporte uma cópia completa dos seus manuais e rotinas ou restaure dados a qualquer momento.
          </p>

          <div className="backup-cards-grid">
            <div className="backup-action-card">
              <Download size={24} color="var(--primary-500)" />
              <h3>Exportar Backup JSON</h3>
              <p>Baixe todos os procedimentos, módulos e etapas em um arquivo seguro.</p>
              <button type="button" className="btn btn-secondary" onClick={handleExportBackup}>
                Baixar Arquivo JSON
              </button>
            </div>

            <div className="backup-action-card">
              <Upload size={24} color="#059669" />
              <h3>Importar Backup JSON</h3>
              <p>Restaure uma base de dados previamente exportada.</p>
              <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                Selecionar Arquivo
                <input
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={handleImportBackup}
                />
              </label>
            </div>

            <div className="backup-action-card">
              <RefreshCw size={24} color="#d97706" />
              <h3>Restaurar Demonstração</h3>
              <p>Restaura os manuais e módulos oficiais de fábrica do Digifarma.</p>
              <button type="button" className="btn btn-secondary" onClick={handleResetDefaults}>
                Restaurar Padrões
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
