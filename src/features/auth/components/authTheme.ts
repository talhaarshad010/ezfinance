import { useMemo } from 'react';
import { useTheme } from '../../../context/ThemeContext';

/** Colour tokens for the onboarding / auth flow (Figma: ezFinance onboarding). */
export interface AuthPalette {
  isDark: boolean;
  BG: string;
  TEXT: string;
  MUTED: string;
  /** Accent used for fills, glows, focus rings. */
  SKY: string;
  /** Accent used for link / selected text (darker in light mode for contrast). */
  LINK: string;
  EMERALD: string;
  EMERALD_TEXT: string;
  RED: string;
  LABEL: string;
  HINT: string;
  FAINT: string;
  PLACEHOLDER: string;
  ICON: string;
  /** Translucent overlay colour for strokes / fills: `INK(alpha)`. */
  INK: (alpha: number) => string;
  GLASS: string;
  GLASS_BORDER: string;
  DIVIDER: string;
  FOCUS_BORDER: string;
  FOCUS_BG: string;
  FOCUS_GLOW: string;
  REST_SHADOW: string;
  CARD: string;
  CARD_BORDER: string;
  CARD_SHADOW: string;
  MENU_BG: string;
  PRIMARY_BG: string;
  PRIMARY_TEXT: string;
  PRIMARY_SHADOW: string;
  DISABLED_BG: string;
  DISABLED_TEXT: string;
  SECONDARY_BG: string;
  SECONDARY_PRESSED: string;
  SECONDARY_BORDER: string;
  STATUS_BAR: 'light-content' | 'dark-content';
}

export const AUTH_DARK: AuthPalette = {
  isDark: true,
  BG: '#0D0D0E',
  TEXT: '#FFFFFF',
  MUTED: '#86868B',
  SKY: '#0EA5E9',
  LINK: '#0EA5E9',
  EMERALD: '#00E68A',
  EMERALD_TEXT: '#00E68A',
  RED: '#FF3B30',
  LABEL: 'rgba(255,255,255,0.55)',
  HINT: 'rgba(255,255,255,0.38)',
  FAINT: 'rgba(255,255,255,0.3)',
  PLACEHOLDER: 'rgba(255,255,255,0.28)',
  ICON: '#FFFFFF',
  INK: a => `rgba(255,255,255,${a})`,
  GLASS: 'rgba(255,255,255,0.05)',
  GLASS_BORDER: 'rgba(255,255,255,0.12)',
  DIVIDER: 'rgba(255,255,255,0.08)',
  FOCUS_BORDER: 'rgba(14,165,233,0.65)',
  FOCUS_BG: 'rgba(14,165,233,0.07)',
  FOCUS_GLOW: '0 0 0 3px rgba(14,165,233,0.16), 0 0 24px rgba(14,165,233,0.12)',
  REST_SHADOW: '0 2px 8px rgba(0,0,0,0.2)',
  CARD: 'rgba(255,255,255,0.04)',
  CARD_BORDER: 'rgba(255,255,255,0.10)',
  CARD_SHADOW: '0 16px 48px rgba(0,0,0,0.4)',
  MENU_BG: '#161618',
  PRIMARY_BG: '#FFFFFF',
  PRIMARY_TEXT: '#0D0D0E',
  PRIMARY_SHADOW: '0 4px 24px rgba(255,255,255,0.12)',
  DISABLED_BG: 'rgba(255,255,255,0.07)',
  DISABLED_TEXT: 'rgba(255,255,255,0.22)',
  SECONDARY_BG: 'rgba(255,255,255,0.07)',
  SECONDARY_PRESSED: 'rgba(255,255,255,0.11)',
  SECONDARY_BORDER: 'rgba(255,255,255,0.14)',
  STATUS_BAR: 'light-content',
};

export const AUTH_LIGHT: AuthPalette = {
  isDark: false,
  BG: '#F9FAFB',
  TEXT: '#0D0D0E',
  MUTED: '#6E6E73',
  SKY: '#0EA5E9',
  LINK: '#0284C7',
  EMERALD: '#00E68A',
  EMERALD_TEXT: '#00A86B',
  RED: '#FF3B30',
  LABEL: 'rgba(13,13,14,0.6)',
  HINT: 'rgba(13,13,14,0.5)',
  FAINT: 'rgba(13,13,14,0.45)',
  PLACEHOLDER: 'rgba(13,13,14,0.32)',
  ICON: '#0D0D0E',
  INK: a => `rgba(13,13,14,${a})`,
  GLASS: '#FFFFFF',
  GLASS_BORDER: 'rgba(13,13,14,0.10)',
  DIVIDER: 'rgba(13,13,14,0.08)',
  FOCUS_BORDER: 'rgba(14,165,233,0.65)',
  FOCUS_BG: '#FFFFFF',
  FOCUS_GLOW: '0 0 0 3px rgba(14,165,233,0.16), 0 0 24px rgba(14,165,233,0.10)',
  REST_SHADOW: '0 2px 8px rgba(13,13,14,0.04)',
  CARD: '#FFFFFF',
  CARD_BORDER: 'rgba(13,13,14,0.06)',
  CARD_SHADOW: '0 16px 48px rgba(13,13,14,0.08)',
  MENU_BG: '#FFFFFF',
  PRIMARY_BG: '#0D0D0E',
  PRIMARY_TEXT: '#FFFFFF',
  PRIMARY_SHADOW: '0 4px 24px rgba(13,13,14,0.18)',
  DISABLED_BG: 'rgba(13,13,14,0.06)',
  DISABLED_TEXT: 'rgba(13,13,14,0.28)',
  SECONDARY_BG: 'rgba(13,13,14,0.04)',
  SECONDARY_PRESSED: 'rgba(13,13,14,0.08)',
  SECONDARY_BORDER: 'rgba(13,13,14,0.10)',
  STATUS_BAR: 'dark-content',
};

/** Palette for the current app theme (light by default, dark when switched in Settings). */
export function useAuthTheme(): AuthPalette {
  const { theme } = useTheme();
  return theme.isDark ? AUTH_DARK : AUTH_LIGHT;
}

/** Palette + memoised styles built from it. `factory` must be a module-level function. */
export function useAuthStyles<T>(factory: (A: AuthPalette) => T): { A: AuthPalette; styles: T } {
  const A = useAuthTheme();
  const styles = useMemo(() => factory(A), [A, factory]);
  return { A, styles };
}

export const EASE_OUT_BEZIER: [number, number, number, number] = [0.25, 1, 0.5, 1];
