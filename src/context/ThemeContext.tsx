import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Theme {
  isDark: boolean;
  BG: string;
  CARD: string;
  MODAL: string;
  TEXT: string;
  MUTED: string;
  ACTIVE: string;
  GREEN: string;
  RED: string;
  HERO_BG: string;
  DOCK_BG: string;
  DOCK_ICON: string;
  DOCK_INACTIVE: string;
  BORDER: string;
  F: string;
}

const F = 'System';

export const DARK_THEME: Theme = {
  isDark: true,
  BG: '#000000',
  CARD: '#18181B',
  MODAL: '#222226',
  TEXT: '#FFFFFF',
  MUTED: '#A0A0A8',
  ACTIVE: '#00A3FF',
  GREEN: '#00C853',
  RED: '#D50000',
  HERO_BG: '#222228',
  DOCK_BG: '#FFFFFF',
  DOCK_ICON: '#000000',
  DOCK_INACTIVE: 'rgba(0,0,0,0.35)',
  BORDER: 'rgba(255,255,255,0.09)',
  F,
};

export const LIGHT_THEME: Theme = {
  isDark: false,
  BG: '#FFFFFF',
  CARD: '#F2F2F7',
  MODAL: '#E5E5EA',
  TEXT: '#1D1D1F',
  MUTED: '#5C5C62',
  ACTIVE: '#0055FF',
  GREEN: '#00C853',
  RED: '#D50000',
  HERO_BG: '#000000',
  DOCK_BG: '#000000',
  DOCK_ICON: '#FFFFFF',
  DOCK_INACTIVE: 'rgba(255,255,255,0.38)',
  BORDER: 'rgba(0,0,0,0.08)',
  F,
};

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
  setTheme: (isDark: boolean) => void;
}

const ThemeCtx = createContext<ThemeCtx>({
  theme: LIGHT_THEME,
  toggle: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  return (
    <ThemeCtx.Provider
      value={{
        theme: isDark ? DARK_THEME : LIGHT_THEME,
        toggle: () => setIsDark(d => !d),
        setTheme: (dark: boolean) => setIsDark(dark),
      }}
    >
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeCtx);
}
