/// <reference lib="webworker" />
import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { SqlCore } from './sqlCore';

type Req =
  | { id: number; op: 'init'; seeds: Record<string, string> }
  | { id: number; op: 'exec'; dbKey: string; dbId: string; sql: string }
  | { id: number; op: 'reset'; dbKey: string }
  | { id: number; op: 'isolated'; dbId: string; sql: string; setup?: string; after?: string }
  | { id: number; op: 'schema'; dbId: string };

const corePromise = initSqlJs({ locateFile: () => wasmUrl }).then((SQL) => new SqlCore(SQL));

self.onmessage = async (ev: MessageEvent<Req>) => {
  const req = ev.data;
  try {
    const core = await corePromise;
    let result: unknown;
    switch (req.op) {
      case 'init':
        core.setSeeds(req.seeds);
        result = true;
        break;
      case 'exec':
        result = core.exec(req.dbKey, req.dbId, req.sql);
        break;
      case 'reset':
        core.reset(req.dbKey);
        result = true;
        break;
      case 'isolated':
        result = core.isolated(req.dbId, req.sql, req.setup, req.after);
        break;
      case 'schema':
        result = core.schema(req.dbId);
        break;
    }
    (self as unknown as Worker).postMessage({ id: req.id, ok: true, result });
  } catch (e) {
    (self as unknown as Worker).postMessage({ id: req.id, ok: false, error: e instanceof Error ? e.message : String(e) });
  }
};
