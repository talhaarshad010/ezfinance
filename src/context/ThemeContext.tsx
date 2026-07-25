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
  CARD: '#0E0E10',
  MODAL: '#161619',
  TEXT: '#FFFFFF',
  MUTED: '#86868B',
  ACTIVE: '#00A3FF',
  GREEN: '#00C853',
  RED: '#D50000',
  HERO_BG: '#0E0E10',
  DOCK_BG: '#FFFFFF',
  DOCK_ICON: '#000000',
  DOCK_INACTIVE: 'rgba(0,0,0,0.35)',
  BORDER: 'rgba(255,255,255,0.07)',
  F,
};

export const LIGHT_THEME: Theme = {
  isDark: false,
  BG: '#FFFFFF',
  CARD: '#F5F5F7',
  MODAL: '#EAEAEA',
  TEXT: '#1D1D1F',
  MUTED: '#86868B',
  ACTIVE: '#0055FF',
  GREEN: '#00C853',
  RED: '#D50000',
  HERO_BG: '#1D1D1F',
  DOCK_BG: '#000000',
  DOCK_ICON: '#FFFFFF',
  DOCK_INACTIVE: 'rgba(255,255,255,0.38)',
  BORDER: 'rgba(0,0,0,0.06)',
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
