import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  X,
  Layers,
  Check,
  Folder,
  ChevronRight,
} from 'lucide-react';
import type { SystemMenu, SubmenuItem } from '../types/procedure';

interface MenuManagerModalProps {
  isOpen: boolean;
  menus: SystemMenu[];
  onSaveMenus: (menus: SystemMenu[]) => Promise<void>;
  onClose: () => void;
}

const AVAILABLE_ICONS = [
  { name: 'FolderPlus', label: 'Pasta Mais' },
  { name: 'Package', label: 'Pacote' },
  { name: 'Boxes', label: 'Caixas / Estoque' },
  { name: 'Users', label: 'Usuários' },
  { name: 'Truck', label: 'Transporte' },
  { name: 'Wrench', label: 'Utilitários' },
  { name: 'Settings', label: 'Configuração' },
  { name: 'ShieldCheck', label: 'Segurança' },
  { name: 'CreditCard', label: 'Financeiro' },
  { name: 'Database', label: 'Banco de Dados' },
];

export const MenuManagerModal: React.FC<MenuManagerModalProps> = ({
  isOpen,
  menus,
  onSaveMenus,
  onClose,
}) => {
  const [currentMenus, setCurrentMenus] = useState<SystemMenu[]>(menus);
  const [newMenuLabel, setNewMenuLabel] = useState('');
  const [newMenuIcon, setNewMenuIcon] = useState('FolderPlus');
  const [activeMenuForSubmenu, setActiveMenuForSubmenu] = useState<string | null>(null);
  const [newSubmenuLabel, setNewSubmenuLabel] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  // Adicionar Menu Principal
  const handleAddMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuLabel.trim()) return;

    const id = newMenuLabel
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-');

    if (currentMenus.some((m) => m.id === id)) {
      alert('Já existe um menu com este nome.');
      return;
    }

    const created: SystemMenu = {
      id,
      label: newMenuLabel.trim(),
      icon: newMenuIcon,
      submenus: [],
    };

    setCurrentMenus([...currentMenus, created]);
    setNewMenuLabel('');
  };

  // Remover Menu Principal
  const handleRemoveMenu = (menuId: string) => {
    if (confirm('Tem certeza de que deseja excluir este menu e seus submenus?')) {
      setCurrentMenus(currentMenus.filter((m) => m.id !== menuId));
    }
  };

  // Adicionar Submenu
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
          alert('Já existe um submenu com este nome neste menu.');
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
  };

  // Remover Submenu
  const handleRemoveSubmenu = (menuId: string, subId: string) => {
    const updated = currentMenus.map((m) => {
      if (m.id === menuId) {
        return { ...m, submenus: m.submenus.filter((s) => s.id !== subId) };
      }
      return m;
    });
    setCurrentMenus(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSaveMenus(currentMenus);
    setSaving(false);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            <Layers size={20} color="var(--primary-500)" />
            Gerenciar Menus e Submenus do Sistema
          </h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Personalize a árvore de menus do sistema Digifarma. Os menus e submenus criados aqui aparecem instantaneamente na barra lateral e nas opções ao criar novos procedimentos.
          </p>

          {/* 1. Criar Novo Menu Principal */}
          <form
            onSubmit={handleAddMenu}
            className="menu-manager-add-form"
          >
            <input
              type="text"
              className="form-input"
              placeholder="Novo Menu Principal (ex: Vendas, Fiscal...)"
              value={newMenuLabel}
              onChange={(e) => setNewMenuLabel(e.target.value)}
            />
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
            <button type="submit" className="btn btn-primary btn-add-menu-submit">
              <Plus size={16} />
              Adicionar
            </button>
          </form>

          {/* 2. Árvore de Menus Existentes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            {currentMenus.map((menu) => (
              <div
                key={menu.id}
                style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-secondary)',
                  overflow: 'hidden',
                }}
              >
                {/* Cabeçalho do Menu */}
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: menu.submenus.length > 0 ? '1px solid var(--border-subtle)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700 }}>
                    <Folder size={17} color="var(--primary-500)" />
                    <span>{menu.label}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      ({menu.submenus.length} submenus)
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                      onClick={() => setActiveMenuForSubmenu(activeMenuForSubmenu === menu.id ? null : menu.id)}
                    >
                      <Plus size={13} />
                      + Submenu
                    </button>
                    <button
                      type="button"
                      className="btn-icon danger"
                      onClick={() => handleRemoveMenu(menu.id)}
                      title="Excluir este menu"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Formulário Inline de Adição de Submenu */}
                {activeMenuForSubmenu === menu.id && (
                  <div className="submenu-inline-add-form">
                    <input
                      type="text"
                      className="form-input"
                      placeholder={`Nome do submenu em ${menu.label} (ex: Clientes, Inventário)...`}
                      value={newSubmenuLabel}
                      onChange={(e) => setNewSubmenuLabel(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: '0.55rem 0.85rem' }}
                      onClick={() => handleAddSubmenu(menu.id)}
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.55rem 0.7rem' }}
                      onClick={() => {
                        setActiveMenuForSubmenu(null);
                        setNewSubmenuLabel('');
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Lista de Submenus */}
                {menu.submenus.length > 0 && (
                  <div style={{ padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {menu.submenus.map((sub) => (
                      <div
                        key={sub.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.45rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-primary)',
                          fontSize: '0.86rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                          <ChevronRight size={14} color="var(--text-muted)" />
                          <span>{sub.label}</span>
                        </div>
                        <button
                          type="button"
                          className="btn-icon danger"
                          onClick={() => handleRemoveSubmenu(menu.id, sub.id)}
                          title="Excluir este submenu"
                          style={{ padding: '2px' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Check size={16} />
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};
