import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { DEFAULT_APPEARANCE, buildPalette, type Appearance, type Palette, type ThemeMode } from './palettes';
import { makeStyles, type Styles } from './styles';

const KEY = 'nutrika.appearance';

type ThemeState = {
  colors: Palette;
  s: Styles;
  mode: ThemeMode;
  appearance: Appearance;
  setAppearance: (patch: Partial<Appearance>) => void;
};

const ThemeContext = createContext<ThemeState | null>(null);

/** Apparence choisie par l'utilisateur (style, coloris, mode), mémorisée sur l'appareil. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [appearance, setState] = useState<Appearance | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => setState({ ...DEFAULT_APPEARANCE, ...(raw ? JSON.parse(raw) : {}) }))
      .catch(() => setState(DEFAULT_APPEARANCE));
  }, []);

  const setAppearance = useCallback((patch: Partial<Appearance>) => {
    setState((prev) => {
      const next = { ...(prev ?? DEFAULT_APPEARANCE), ...patch };
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const current = appearance ?? DEFAULT_APPEARANCE;
  const mode: ThemeMode = current.mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : current.mode;
  const colors = useMemo(() => buildPalette(current.style, current.variant, mode), [current.style, current.variant, mode]);
  const s = useMemo(() => makeStyles(colors), [colors]);

  // On attend la préférence enregistrée pour éviter un flash du thème par défaut.
  if (!appearance) return null;

  return <ThemeContext.Provider value={{ colors, s, mode, appearance, setAppearance }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme doit être utilisé dans ThemeProvider');
  return ctx;
}
