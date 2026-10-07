export interface ThemePalette {
  id: string;
  name: string;
  hex: string;
  primaryDark: string;
  soft: string;
  accent: string;
}

export const THEME_PALETTES: ThemePalette[] = [
  {
    id: 'red',
    name: 'Vermelho Digifarma (Padrão)',
    hex: '#e74c3c',
    primaryDark: '#c0392b',
    soft: 'rgba(231, 76, 60, 0.12)',
    accent: '#059669',
  },
  {
    id: 'blue',
    name: 'Azul Corporativo',
    hex: '#2563eb',
    primaryDark: '#1d4ed8',
    soft: 'rgba(37, 99, 235, 0.12)',
    accent: '#059669',
  },
  {
    id: 'emerald',
    name: 'Verde Farmacêutico',
    hex: '#059669',
    primaryDark: '#047857',
    soft: 'rgba(5, 150, 105, 0.12)',
    accent: '#2563eb',
  },
  {
    id: 'purple',
    name: 'Violeta / Roxo',
    hex: '#7c3aed',
    primaryDark: '#6d28d9',
    soft: 'rgba(124, 58, 237, 0.12)',
    accent: '#059669',
  },
  {
    id: 'amber',
    name: 'Âmbar Dourado',
    hex: '#d97706',
    primaryDark: '#b45309',
    soft: 'rgba(217, 119, 6, 0.12)',
    accent: '#059669',
  },
  {
    id: 'cyan',
    name: 'Ciano Oceânico',
    hex: '#0891b2',
    primaryDark: '#0e7490',
    soft: 'rgba(8, 145, 178, 0.12)',
    accent: '#059669',
  },
  {
    id: 'rose',
    name: 'Rosa Magenta',
    hex: '#e11d48',
    primaryDark: '#be123c',
    soft: 'rgba(225, 29, 72, 0.12)',
    accent: '#059669',
  },
];

const STORAGE_KEY_THEME = 'digifarma_theme_color_id';

export function getCurrentThemeColor(): string {
  return localStorage.getItem(STORAGE_KEY_THEME) || 'red';
}

export function applyThemeColor(paletteId: string): void {
  const palette = THEME_PALETTES.find((p) => p.id === paletteId) || THEME_PALETTES[0];
  localStorage.setItem(STORAGE_KEY_THEME, palette.id);

  const root = document.documentElement;
  root.style.setProperty('--red', palette.hex);
  root.style.setProperty('--red-dark', palette.primaryDark);
  root.style.setProperty('--red-soft', palette.soft);
  root.style.setProperty('--primary-500', palette.hex);
  root.style.setProperty('--primary-600', palette.primaryDark);
  root.style.setProperty('--primary-50', palette.soft);
  root.style.setProperty('--primary-100', palette.soft);
  root.style.setProperty('--primary-tint', palette.soft);
}

// Inicializar na carga da página
export function initThemeColor(): void {
  const saved = getCurrentThemeColor();
  applyThemeColor(saved);
}
