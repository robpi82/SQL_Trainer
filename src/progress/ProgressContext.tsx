import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import { KEYS, load, save } from '../lib/storage';
import { emptyProgress, progressReducer, validateImport, type ProgressAction, type ProgressState } from './model';

interface Ctx {
  state: ProgressState;
  dispatch: (a: ProgressAction) => void;
  storageOk: boolean;
}

const ProgressContext = createContext<Ctx | null>(null);

function init(): ProgressState {
  const raw = load<unknown>(KEYS.progress, null);
  if (!raw) return emptyProgress();
  try {
    return validateImport(raw);
  } catch {
    return emptyProgress();
  }
}

let storageOk = true;

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer((s: ProgressState, a: ProgressAction) => progressReducer(s, a), undefined, init);
  useEffect(() => {
    storageOk = save(KEYS.progress, state);
  }, [state]);
  return <ProgressContext.Provider value={{ state, dispatch, storageOk }}>{children}</ProgressContext.Provider>;
}

export function useProgress(): Ctx {
  const c = useContext(ProgressContext);
  if (!c) throw new Error('useProgress außerhalb des ProgressProvider');
  return c;
}
