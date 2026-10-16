import type { Database, SqlJsStatic } from 'sql.js';
import type { ExecResult, ResultSet, SqlValue, TableInfo } from './types';

/**
 * Plattformunabhängiger Kern der SQL-Ausführung.
 * Wird im Web Worker verwendet und in den automatischen Tests direkt unter Node.
 */
export class SqlCore {
  private seedSql = new Map<string, string>();
  private seedBytes = new Map<string, Uint8Array>();
  /** Arbeitsdatenbanken je Übung/Sandbox – jede ist vollständig isoliert. */
  private working = new Map<string, Database>();

  constructor(private SQL: SqlJsStatic) {}

  setSeeds(seeds: Record<string, string>) {
    for (const [id, sql] of Object.entries(seeds)) {
      if (this.seedSql.get(id) !== sql) {
        this.seedSql.set(id, sql);
        this.seedBytes.delete(id);
      }
    }
  }

  private bytesFor(dbId: string): Uint8Array {
    let bytes = this.seedBytes.get(dbId);
    if (!bytes) {
      const sql = this.seedSql.get(dbId);
      if (sql === undefined) throw new Error(`Unbekannte Übungsdatenbank: ${dbId}`);
      const db = new this.SQL.Database();
      db.exec('PRAGMA foreign_keys = ON;');
      db.exec(sql);
      bytes = db.export();
      db.close();
      this.seedBytes.set(dbId, bytes);
    }
    return bytes;
  }

  /** Erzeugt eine frische, unabhängige Kopie der Ausgangsdatenbank. */
  fresh(dbId: string): Database {
    const db = new this.SQL.Database(this.bytesFor(dbId));
    db.exec('PRAGMA foreign_keys = ON;');
    return db;
  }

  private run(db: Database, sql: string): ExecResult {
    const t0 = now();
    try {
      const before = totalChanges(db);
      // iterateStatements statt exec: So bleiben auch leere Ergebnisse (0 Zeilen) mit Spaltennamen erhalten.
      const results: ResultSet[] = [];
      for (const stmt of db.iterateStatements(sql)) {
        const columns = stmt.getColumnNames();
        const rows: SqlValue[][] = [];
        while (stmt.step()) rows.push(stmt.get().map(toSqlValue));
        if (columns.length > 0) results.push({ columns, rows });
      }
      const after = totalChanges(db);
      return { ok: true, results, changes: after - before, durationMs: now() - t0 };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e), durationMs: now() - t0 };
    }
  }

  /** Führt SQL auf der Arbeitsdatenbank `dbKey` aus (Änderungen bleiben bis zum Zurücksetzen erhalten). */
  exec(dbKey: string, dbId: string, sql: string): ExecResult {
    let db = this.working.get(dbKey);
    if (!db) {
      db = this.fresh(dbId);
      this.working.set(dbKey, db);
    }
    return this.run(db, sql);
  }

  reset(dbKey: string) {
    const db = this.working.get(dbKey);
    if (db) db.close();
    this.working.delete(dbKey);
  }

  /**
   * Führt SQL auf einer frischen Kopie aus: optional zuerst `setup` (zusätzliche Testdaten),
   * dann `sql` und danach `after` (z. B. eine Abfrage des entstandenen Tabellenzustands).
   */
  isolated(dbId: string, sql: string, setup?: string, after?: string): { main: ExecResult; after?: ExecResult } {
    const db = this.fresh(dbId);
    try {
      if (setup) {
        const s = this.run(db, setup);
        if (!s.ok) throw new Error(`Interner Fehler in Testdaten: ${s.error}`);
      }
      const main = this.run(db, sql);
      const afterRes = after !== undefined ? this.run(db, after) : undefined;
      return { main, after: afterRes };
    } finally {
      db.close();
    }
  }

  schema(dbId: string): TableInfo[] {
    const db = this.fresh(dbId);
    try {
      const tables = db
        .exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid")[0]
        ?.values.map((v) => String(v[0])) ?? [];
      return tables.map((t) => {
        const cols = db.exec(`PRAGMA table_info("${t}")`)[0]?.values ?? [];
        const fks = db.exec(`PRAGMA foreign_key_list("${t}")`)[0]?.values ?? [];
        // foreign_key_list: id, seq, table, from, to, on_update, on_delete, match
        const fkMap = new Map(fks.map((f) => [String(f[3]), { table: String(f[2]), column: String(f[4]) }]));
        const count = Number(db.exec(`SELECT COUNT(*) FROM "${t}"`)[0].values[0][0]);
        return {
          name: t,
          rowCount: count,
          // table_info: cid, name, type, notnull, dflt_value, pk
          columns: cols.map((c) => ({
            name: String(c[1]),
            type: String(c[2]),
            notNull: Number(c[3]) === 1 || Number(c[5]) > 0,
            pk: Number(c[5]) > 0,
            fk: fkMap.get(String(c[1])),
          })),
        };
      });
    } finally {
      db.close();
    }
  }
}

function totalChanges(db: Database): number {
  return Number(db.exec('SELECT total_changes()')[0].values[0][0]);
}

function toSqlValue(v: unknown): SqlValue {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' || typeof v === 'string') return v;
  if (v instanceof Uint8Array) return `[BLOB, ${v.length} Bytes]`;
  return String(v);
}

function now() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}
