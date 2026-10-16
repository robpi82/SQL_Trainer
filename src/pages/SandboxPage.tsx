import { useEffect, useState } from 'react';
import { ErrorBox, NotesBox } from '../components/Feedback';
import { ResultTable } from '../components/ResultTable';
import { SchemaPanel, useSchema } from '../components/SchemaPanel';
import { SqlEditor } from '../components/SqlEditor';
import { DATABASES, DB_IDS, type DbId } from '../db/seeds';
import { SqlAbortError, sqlClient } from '../db/sqlClient';
import type { ExecResult } from '../db/types';
import { explainError, lintSql, type ExplainedError } from '../engine/errors';
import { KEYS, load, save } from '../lib/storage';

const DEFAULT_SQL: Record<DbId, string> = {
  vertrieb: '-- Probiere frei aus! Strg+Enter führt aus.\nSELECT * FROM kunden;',
  forschung: '-- Probiere frei aus! Strg+Enter führt aus.\nSELECT * FROM inseln;',
  support: '-- Probiere frei aus! Strg+Enter führt aus.\nSELECT * FROM tickets;',
  lieferdb: '-- Probiere frei aus! Strg+Enter führt aus.\nSELECT * FROM lieferungen;',
};

export function SandboxPage({ initialDb, initialSql }: { initialDb: string | null; initialSql: string | null }) {
  const saved = load<{ db?: DbId; sql?: Partial<Record<DbId, string>> }>(KEYS.sandbox, {});
  const [db, setDb] = useState<DbId>(() => (DB_IDS.includes(initialDb as DbId) ? (initialDb as DbId) : saved.db ?? 'vertrieb'));
  const [sqlByDb, setSqlByDb] = useState<Partial<Record<DbId, string>>>(() => ({
    ...saved.sql,
    ...(initialSql && DB_IDS.includes(initialDb as DbId) ? { [initialDb as DbId]: initialSql } : {}),
  }));
  const sql = sqlByDb[db] ?? DEFAULT_SQL[db];
  const schema = useSchema(db);
  const [busy, setBusy] = useState(false);
  const [run, setRun] = useState<(ExecResult & { ok: true }) | null>(null);
  const [err, setErr] = useState<ExplainedError | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const dbKey = `sandbox:${db}`;

  useEffect(() => {
    save(KEYS.sandbox, { db, sql: sqlByDb });
  }, [db, sqlByDb]);

  useEffect(() => {
    return sqlClient().onRestart(() => setNotice('Die SQL-Umgebung wurde neu gestartet. Die Sandbox-Datenbanken sind wieder im Ausgangszustand.'));
  }, []);

  const doRun = async () => {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    try {
      const r = await sqlClient().exec(dbKey, db, sql);
      if (r.ok) {
        setRun(r);
        setErr(null);
        setNotes(lintSql(sql, schema));
      } else {
        setRun(null);
        setErr(explainError(r.error, sql, schema));
      }
    } catch (e) {
      setRun(null);
      setErr(explainError(e instanceof SqlAbortError ? e.message : String(e), sql, schema));
    } finally {
      setBusy(false);
      setRefresh((x) => x + 1);
    }
  };

  const resetDb = async () => {
    await sqlClient().reset(dbKey);
    setRun(null);
    setErr(null);
    setRefresh((x) => x + 1);
    setNotice(`Die Datenbank „${DATABASES[db].title}“ der Sandbox wurde auf den Ausgangszustand zurückgesetzt.`);
  };

  return (
    <div className="page page-wide">
      <h1>SQL-Sandbox</h1>
      <p>
        Experimentiere frei – auch mit INSERT, UPDATE, DELETE oder CREATE TABLE. Änderungen betreffen nur die Sandbox-Kopie der gewählten Datenbank,
        nicht die Übungsaufgaben. Mit „Datenbank zurücksetzen“ ist alles wieder wie am Anfang.
      </p>
      <div className="workspace">
        <section className="ws-left">
          <div className="card ws-task">
            <label className="inline-field">
              Übungsdatenbank{' '}
              <select value={db} onChange={(e) => { setDb(e.target.value as DbId); setRun(null); setErr(null); }}>
                {DB_IDS.map((d) => (
                  <option key={d} value={d}>
                    {DATABASES[d].title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="card schema-card">
            <SchemaPanel db={db} dbKey={dbKey} refreshToken={refresh} />
          </div>
        </section>
        <section className="ws-right">
          <div className="card ws-editor">
            <div className="editor-head">
              <h3>SQL</h3>
              <span className="badge">SQL-Dialekt: SQLite</span>
            </div>
            <SqlEditor value={sql} onChange={(v) => setSqlByDb({ ...sqlByDb, [db]: v })} onRun={doRun} schema={schema} label="SQL-Editor (Sandbox)" minHeight="200px" />
            <div className="toolbar">
              <button type="button" className="btn btn-primary" onClick={doRun} disabled={busy}>
                ▶ Ausführen
              </button>
              {busy && (
                <button type="button" className="btn btn-danger" onClick={() => sqlClient().abort()}>
                  ■ Abbrechen
                </button>
              )}
              <span className="toolbar-spacer" />
              <button type="button" className="btn btn-ghost" onClick={() => setSqlByDb({ ...sqlByDb, [db]: DEFAULT_SQL[db] })}>
                Editor leeren
              </button>
              <button type="button" className="btn btn-ghost" onClick={resetDb}>
                Datenbank zurücksetzen
              </button>
            </div>
            <p className="small muted kbd-help">
              <kbd>Strg</kbd>+<kbd>Enter</kbd> Ausführen · Mehrere Anweisungen mit <code>;</code> trennen · Laufzeitlimit 5 Sekunden
            </p>
            {notice && <p className="notice" role="status">{notice}</p>}
          </div>
          {err && <ErrorBox error={err} />}
          {run && (
            <div className="card">
              <h3>Ergebnis</h3>
              <p className="small muted">
                Ausgeführt in {Math.max(1, Math.round(run.durationMs))} ms{run.changes > 0 && ` · ${run.changes} Zeile(n) geändert`}.
              </p>
              {run.results.length === 0 && <p className="muted">Keine Ergebnistabelle.</p>}
              {run.results.slice(-5).map((r, i) => (
                <ResultTable key={i} result={r} />
              ))}
              <NotesBox notes={notes} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
