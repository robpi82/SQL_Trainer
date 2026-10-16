import { useEffect, useState } from 'react';
import { sqlClient } from '../db/sqlClient';
import { DATABASES, type DbId } from '../db/seeds';
import type { ResultSet, TableInfo } from '../db/types';
import { ResultTable } from './ResultTable';

export function useSchema(db: DbId): TableInfo[] | undefined {
  const [schema, setSchema] = useState<TableInfo[]>();
  useEffect(() => {
    let alive = true;
    setSchema(undefined);
    sqlClient()
      .schema(db)
      .then((s) => alive && setSchema(s))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [db]);
  return schema;
}

/**
 * Datenbankschema mit Primär- und Fremdschlüsseln sowie Datenvorschau.
 * Mit `dbKey` zeigt die Vorschau den aktuellen Stand der Übungsdatenbank (inkl. eigener Änderungen).
 */
export function SchemaPanel({ db, dbKey, refreshToken }: { db: DbId; dbKey?: string; refreshToken?: number }) {
  const schema = useSchema(db);
  const [preview, setPreview] = useState<{ table: string; result?: ResultSet; error?: string } | null>(null);
  const info = DATABASES[db];

  const loadPreview = async (table: string) => {
    if (preview?.table === table) {
      setPreview(null);
      return;
    }
    setPreview({ table });
    const sql = `SELECT * FROM "${table}" LIMIT 100;`;
    try {
      const r = dbKey ? await sqlClient().exec(dbKey, db, sql) : (await sqlClient().isolated(db, sql)).main;
      if (r.ok) setPreview({ table, result: r.results[0] ?? { columns: [], rows: [] } });
      else setPreview({ table, error: r.error });
    } catch (e) {
      setPreview({ table, error: String(e) });
    }
  };

  // Vorschau nach Ausführen/Zurücksetzen aktualisieren
  useEffect(() => {
    if (preview?.table) {
      const t = preview.table;
      setPreview(null);
      void (async () => {
        const sql = `SELECT * FROM "${t}" LIMIT 100;`;
        const r = dbKey ? await sqlClient().exec(dbKey, db, sql) : (await sqlClient().isolated(db, sql)).main;
        if (r.ok) setPreview({ table: t, result: r.results[0] ?? { columns: [], rows: [] } });
      })().catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken]);

  if (!schema) return <p className="muted">Schema wird geladen …</p>;

  return (
    <div className="schema">
      <p className="schema-db">
        <strong>{info.title}</strong> <span className="badge">SQLite</span>
        <br />
        <span className="muted small">{info.description}</span>
      </p>
      {schema.map((t) => (
        <div key={t.name} className="schema-table">
          <div className="schema-table-head">
            <h4>
              {t.name} <span className="muted small">({t.rowCount} Zeilen)</span>
            </h4>
            <button type="button" className="btn btn-small" aria-expanded={preview?.table === t.name} onClick={() => loadPreview(t.name)}>
              {preview?.table === t.name ? 'Daten ausblenden' : 'Daten anzeigen'}
            </button>
          </div>
          {info.tableDescriptions[t.name] && <p className="small muted">{info.tableDescriptions[t.name]}</p>}
          <ul className="columns">
            {t.columns.map((c) => (
              <li key={c.name}>
                <code className={c.pk ? 'col-pk' : undefined}>{c.name}</code>
                <span className="col-type">{c.type || 'beliebig'}</span>
                {c.pk && <span className="key key-pk" title="Primärschlüssel">PK</span>}
                {c.fk && (
                  <span className="key key-fk" title={`Fremdschlüssel auf ${c.fk.table}.${c.fk.column}`}>
                    FK → {c.fk.table}.{c.fk.column}
                  </span>
                )}
                {c.notNull && !c.pk && <span className="col-nn" title="NOT NULL: Wert ist Pflicht">Pflicht</span>}
              </li>
            ))}
          </ul>
          {preview?.table === t.name && (
            <div className="schema-preview">
              {preview.error && <p className="error-text">{preview.error}</p>}
              {!preview.result && !preview.error && <p className="muted">Lädt …</p>}
              {preview.result && <ResultTable result={preview.result} caption={dbKey ? `${t.name} – aktueller Stand deiner Übungsdatenbank` : t.name} />}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
