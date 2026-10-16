import { useEffect, useState } from 'react';
import { sqlClient } from '../db/sqlClient';
import type { DbId } from '../db/seeds';
import type { ExecResult } from '../db/types';
import { ResultTable } from './ResultTable';
import { explainError } from '../engine/errors';

/** Führt eine Beispielabfrage auf einer frischen Kopie aus und zeigt das Ergebnis (für Lektionen). */
export function QueryPreview({ db, sql, caption, expectError }: { db: DbId; sql: string; caption?: string; expectError?: boolean }) {
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
  if (!res.ok) {
    if (expectError) {
      const e = explainError(res.error, sql);
      return (
        <div className="feedback feedback-error">
          <p>
            <strong>Die Datenbank lehnt die Anweisung ab – wie beabsichtigt.</strong>
          </p>
          {e.explanation.length > 0 && <p>{e.explanation[0]}</p>}
          <p className="orig-msg">
            Meldung der Datenbank: <code>{res.error}</code>
          </p>
        </div>
      );
    }
    return <p className="error-text">Fehler: {res.error}</p>;
  }
  const last = res.results[res.results.length - 1];
  return last ? <ResultTable result={last} caption={caption} /> : <p className="muted">Keine Ergebnistabelle ({res.changes} Zeilen geändert).</p>;
}
