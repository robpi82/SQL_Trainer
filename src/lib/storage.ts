/** Sicherer Zugriff auf localStorage (z. B. im privaten Modus kann er fehlen). */
export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const KEYS = {
  progress: 'sql-lernapp:fortschritt:v1',
  settings: 'sql-lernapp:einstellungen:v1',
  sandbox: 'sql-lernapp:sandbox:v1',
};
