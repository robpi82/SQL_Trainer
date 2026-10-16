import { DATABASES } from './seeds';
import type { ExecResult, TableInfo } from './types';

/** Fehler, wenn eine Ausführung das Zeitlimit überschreitet oder abgebrochen wird. */
export class SqlAbortError extends Error {
  constructor(public reason: 'timeout' | 'abort') {
    super(reason === 'timeout' ? 'Zeitlimit überschritten' : 'Ausführung abgebrochen');
  }
}

/** Gemeinsame Schnittstelle – im Browser per Worker, in Tests direkt per SqlCore. */
export interface SqlBackend {
  exec(dbKey: string, dbId: string, sql: string): Promise<ExecResult>;
  reset(dbKey: string): Promise<void>;
  isolated(dbId: string, sql: string, setup?: string, after?: string): Promise<{ main: ExecResult; after?: ExecResult }>;
  schema(dbId: string): Promise<TableInfo[]>;
  workingSchema(dbKey: string, dbId: string): Promise<TableInfo[]>;
  probe(dbId: string, sql: string, probes: string[], setup?: string): Promise<{ main: ExecResult; probes: ExecResult[] }>;
}

export const TIMEOUT_MS = 5000;

type Pending = { resolve: (v: any) => void; reject: (e: unknown) => void; timer: ReturnType<typeof setTimeout> };

class WorkerClient implements SqlBackend {
  private worker!: Worker;
  private nextId = 1;
  private pending = new Map<number, Pending>();
  private listeners = new Set<() => void>();
  private busyListeners = new Set<(busy: boolean) => void>();
  private schemaCache = new Map<string, TableInfo[]>();

  constructor() {
    this.start();
  }

  private start() {
    this.worker = new Worker(new URL('./sql.worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (ev) => {
      const { id, ok, result, error } = ev.data;
      const p = this.pending.get(id);
      if (!p) return;
      clearTimeout(p.timer);
      this.pending.delete(id);
      this.emitBusy();
      ok ? p.resolve(result) : p.reject(new Error(error));
    };
    const seeds = Object.fromEntries(Object.values(DATABASES).map((d) => [d.id, d.seedSql]));
    this.call({ op: 'init', seeds }, 30000).catch(() => undefined);
  }

  /** Beendet den Worker hart (z. B. Endlosabfrage) und startet einen neuen. Arbeitsdatenbanken gehen dabei verloren. */
  restart(reason: 'timeout' | 'abort') {
    this.worker.terminate();
    for (const p of this.pending.values()) {
      clearTimeout(p.timer);
      p.reject(new SqlAbortError(reason));
    }
    this.pending.clear();
    this.emitBusy();
    this.start();
    this.listeners.forEach((l) => l());
  }

  abort() {
    if (this.pending.size > 0) this.restart('abort');
  }

  onRestart(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  onBusy(fn: (busy: boolean) => void) {
    this.busyListeners.add(fn);
    return () => {
      this.busyListeners.delete(fn);
    };
  }

  private emitBusy() {
    const busy = this.pending.size > 0;
    this.busyListeners.forEach((l) => l(busy));
  }

  private call<T>(msg: Record<string, unknown>, timeout = TIMEOUT_MS): Promise<T> {
    const id = this.nextId++;
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => this.restart('timeout'), timeout);
      this.pending.set(id, { resolve, reject, timer });
      this.emitBusy();
      this.worker.postMessage({ id, ...msg });
    });
  }

  exec(dbKey: string, dbId: string, sql: string) {
    return this.call<ExecResult>({ op: 'exec', dbKey, dbId, sql });
  }
  reset(dbKey: string) {
    return this.call<void>({ op: 'reset', dbKey });
  }
  isolated(dbId: string, sql: string, setup?: string, after?: string) {
    return this.call<{ main: ExecResult; after?: ExecResult }>({ op: 'isolated', dbId, sql, setup, after });
  }
  workingSchema(dbKey: string, dbId: string) {
    return this.call<TableInfo[]>({ op: 'workingSchema', dbKey, dbId });
  }
  probe(dbId: string, sql: string, probes: string[], setup?: string) {
    return this.call<{ main: ExecResult; probes: ExecResult[] }>({ op: 'probe', dbId, sql, probes, setup });
  }
  async schema(dbId: string) {
    const cached = this.schemaCache.get(dbId);
    if (cached) return cached;
    const s = await this.call<TableInfo[]>({ op: 'schema', dbId }, 30000);
    this.schemaCache.set(dbId, s);
    return s;
  }
}

let instance: WorkerClient | null = null;
export function sqlClient(): WorkerClient {
  if (!instance) instance = new WorkerClient();
  return instance;
}
