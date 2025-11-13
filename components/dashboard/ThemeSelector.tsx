import React, { useState } from 'react';
import { MoonIcon, SunIcon, PaletteIcon } from '../icons/IconDefs';

export type DashboardTheme = 'dark' | 'light' | 'auto' | 'custom';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

interface ThemeSelectorProps {
  currentTheme: DashboardTheme;
  onThemeChange: (theme: DashboardTheme) => void;
  customColors?: Partial<ThemeColors>;
  onCustomColorsChange?: (colors: Partial<ThemeColors>) => void;
}

const defaultDarkColors: ThemeColors = {
  primary: '#3b82f6',
  secondary: '#6366f1',
  accent: '#8b5cf6',
  background: '#0f172a',
  surface: '#1e293b',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  border: '#334155',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

const defaultLightColors: ThemeColors = {
  primary: '#3b82f6',
  secondary: '#6366f1',
  accent: '#8b5cf6',
  background: '#ffffff',
  surface: '#f8fafc',
  text: '#0f172a',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onThemeChange,
  customColors = {},
  onCustomColorsChange,
}) => {
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [editingColors, setEditingColors] = useState<Partial<ThemeColors>>(customColors);

  const themes: Array<{ id: DashboardTheme; name: string; icon: typeof MoonIcon; description: string }> = [
    { id: 'dark', name: 'Dark', icon: MoonIcon, description: 'Dark theme optimized for low-light environments' },
    { id: 'light', name: 'Light', icon: SunIcon, description: 'Light theme for bright environments' },
    { id: 'auto', name: 'Auto', icon: SunIcon, description: 'Automatically switch based on system preferences' },
    { id: 'custom', name: 'Custom', icon: PaletteIcon, description: 'Customize your own color scheme' },
  ];

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    const updated = { ...editingColors, [key]: value };
    setEditingColors(updated);
  };

  const applyCustomColors = () => {
    if (onCustomColorsChange) {
      onCustomColorsChange(editingColors);
      onThemeChange('custom');
      setShowCustomizer(false);
    }
  };

  const resetToDefault = () => {
    const defaults = currentTheme === 'light' ? defaultLightColors : defaultDarkColors;
    setEditingColors(defaults);
  };

  return (
    <div className="relative">
      <div className="bg-brand-800/30 border border-brand-700/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-brand-100">Dashboard Theme</h3>
          <button
            onClick={() => setShowCustomizer(!showCustomizer)}
            className="text-sm text-brand-400 hover:text-brand-300 transition-colors"
          >
            {showCustomizer ? 'Hide' : 'Show'} Customizer
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {themes.map((theme) => {
            const Icon = theme.icon;
            return (
              <button
                key={theme.id}
                onClick={() => {
                  onThemeChange(theme.id);
                  if (theme.id === 'custom') {
                    setShowCustomizer(true);
                  }
                }}
                className={`
                  p-4 rounded-lg border-2 transition-all
                  ${currentTheme === theme.id
                    ? 'border-brand-500 bg-brand-500/10'
                    : 'border-brand-700/50 bg-brand-800/20 hover:border-brand-600'
                  }
                `}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="w-5 h-5 text-brand-300" />
                  <span className="font-medium text-brand-100">{theme.name}</span>
                </div>
                <p className="text-xs text-brand-400 text-left">{theme.description}</p>
              </button>
            );
          })}
        </div>

        {showCustomizer && (
          <div className="mt-4 pt-4 border-t border-brand-700/50">
            <h4 className="text-sm font-semibold text-brand-100 mb-3">Custom Colors</h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {Object.entries(currentTheme === 'light' ? defaultLightColors : defaultDarkColors).map(([key, defaultValue]) => (
                <div key={key}>
                  <label className="block text-xs text-brand-400 mb-1 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingColors[key as keyof ThemeColors] || defaultValue}
                      onChange={(e) => handleColorChange(key as keyof ThemeColors, e.target.value)}
                      className="w-12 h-8 rounded border border-brand-700/50 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editingColors[key as keyof ThemeColors] || defaultValue}
                      onChange={(e) => handleColorChange(key as keyof ThemeColors, e.target.value)}
                      className="flex-1 px-2 py-1 text-xs bg-brand-900/50 border border-brand-700/50 rounded text-brand-100 font-mono"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={applyCustomColors}
                className="flex-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors"
              >
                Apply Custom Theme
              </button>
              <button
                onClick={resetToDefault}
                className="px-4 py-2 bg-brand-800/50 hover:bg-brand-700/50 text-brand-200 rounded-lg font-medium transition-colors"
              >
                Reset
              </button>
            </div>

            <div className="mt-4 p-3 bg-brand-900/50 rounded-lg border border-brand-700/50">
              <p className="text-xs text-brand-400 mb-2">Preview:</p>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(editingColors).slice(0, 8).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div
                      className="w-full h-8 rounded mb-1 border border-brand-700/50"
                      style={{ backgroundColor: value }}
                    />
                    <span className="text-xs text-brand-500 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-brand-700/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-brand-400">Current Theme:</span>
            <span className="font-medium text-brand-100 capitalize">{currentTheme}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-brand-400">Auto-save:</span>
            <span className="text-brand-300">Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export function applyTheme(theme: DashboardTheme, customColors?: Partial<ThemeColors>) {
  const root = document.documentElement;
  
  let colors: ThemeColors;
  
  if (theme === 'custom' && customColors) {
    const baseColors = defaultDarkColors;
    colors = { ...baseColors, ...customColors };
  } else if (theme === 'light') {
    colors = defaultLightColors;
  } else if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    colors = prefersDark ? defaultDarkColors : defaultLightColors;
  } else {
    colors = defaultDarkColors;
  }

  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--theme-${key}`, value);
  });

  root.setAttribute('data-theme', theme);
}

export function getSystemTheme(): 'dark' | 'light' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
}

export function saveThemePreference(theme: DashboardTheme, customColors?: Partial<ThemeColors>) {
  localStorage.setItem('dashboard-theme', theme);
  if (customColors) {
    localStorage.setItem('dashboard-theme-colors', JSON.stringify(customColors));
  }
}

export function loadThemePreference(): { theme: DashboardTheme; customColors?: Partial<ThemeColors> } {
  const theme = (localStorage.getItem('dashboard-theme') as DashboardTheme) || 'dark';
  const customColorsStr = localStorage.getItem('dashboard-theme-colors');
  const customColors = customColorsStr ? JSON.parse(customColorsStr) : undefined;
  return { theme, customColors };
}