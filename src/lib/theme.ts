import { useEffect, useState } from 'react';
import { KEYS, load, save } from './storage';

export type ThemeSetting = 'system' | 'hell' | 'dunkel';

function systemDark() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

export function useTheme() {
  const [setting, setSetting] = useState<ThemeSetting>(() => load<{ theme?: ThemeSetting }>(KEYS.settings, {}).theme ?? 'system');
  const [sysDark, setSysDark] = useState(systemDark);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const on = () => setSysDark(mq.matches);
    mq?.addEventListener('change', on);
    return () => mq?.removeEventListener('change', on);
  }, []);
  const dark = setting === 'dunkel' || (setting === 'system' && sysDark);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    save(KEYS.settings, { ...load(KEYS.settings, {}), theme: setting });
  }, [dark, setting]);
  return { setting, setSetting, dark };
}

import { createContext, useContext } from 'react';
export const DarkContext = createContext(false);
export const useDark = () => useContext(DarkContext);
