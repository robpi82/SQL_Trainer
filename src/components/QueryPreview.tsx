import { useEffect, useState } from 'react';
import { sqlClient } from '../db/sqlClient';
import type { DbId } from '../db/seeds';
import type { ExecResult } from '../db/types';
import { ResultTable } from './ResultTable';

/** Führt eine Beispielabfrage auf einer frischen Kopie aus und zeigt das Ergebnis (für Lektionen). */
export function QueryPreview({ db, sql, caption }: { db: DbId; sql: string; caption?: string }) {
  const [res, setRes] = useState<ExecResult | null>(null);
  useEffect(() => {
    let alive = true;
    sqlClient()
      .isolated(db, sql)
      .then((r) => alive && setRes(r.main))
      .catch((e) => alive && setRes({ ok: false, error: String(e), durationMs: 0 }));
    return () => {
      alive = false;
    };
  }, [db, sql]);
  if (!res) return <p className="muted">Wird ausgeführt …</p>;
  if (!res.ok) return <p className="error-text">Fehler: {res.error}</p>;
  const last = res.results[res.results.length - 1];
  return last ? <ResultTable result={last} caption={caption} /> : <p className="muted">Keine Ergebnistabelle ({res.changes} Zeilen geändert).</p>;
}
