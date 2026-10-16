import { createContext, useContext, useEffect, useState } from 'react';
import { KEYS, load, save } from './storage';

/** weltraum = Space-Academy-Design (Standard); system/hell/dunkel = klassisches, ruhiges Design */
export type ThemeSetting = 'weltraum' | 'system' | 'hell' | 'dunkel';

/** Version der Einstellungen: Ab Version 2 ist „weltraum“ der Standard. */
const SETTINGS_VERSION = 2;

function systemDark() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

function initialSetting(): ThemeSetting {
  const s = load<{ theme?: ThemeSetting; v?: number }>(KEYS.settings, {});
  // Ältere Einstellungen stammen aus der Zeit vor dem neuen Design → einmalig auf Weltraum umstellen.
  if (s.v !== SETTINGS_VERSION) return 'weltraum';
  return s.theme ?? 'weltraum';
}

export function useTheme() {
  const [setting, setSetting] = useState<ThemeSetting>(initialSetting);
  const [sysDark, setSysDark] = useState(systemDark);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const on = () => setSysDark(mq.matches);
    mq?.addEventListener('change', on);
    return () => mq?.removeEventListener('change', on);
  }, []);
  const space = setting === 'weltraum';
  const dark = space || setting === 'dunkel' || (setting === 'system' && sysDark);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.documentElement.dataset.design = space ? 'space' : 'classic';
    save(KEYS.settings, { ...load(KEYS.settings, {}), theme: setting, v: SETTINGS_VERSION });
  }, [dark, space, setting]);
  return { setting, setSetting, dark, space };
}

export const DarkContext = createContext(false);
export const useDark = () => useContext(DarkContext);
export const SpaceContext = createContext(false);
export const useSpace = () => useContext(SpaceContext);
