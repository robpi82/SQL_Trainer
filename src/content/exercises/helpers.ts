import type { QueryCheck, StateCheck } from '../types';

/** Prüfung über den Vergleich des Abfrageergebnisses */
export const q = (o: Omit<QueryCheck, 'kind'> = {}): QueryCheck => ({ kind: 'query', ...o });

/** Prüfung über den entstandenen Datenbankzustand (für INSERT/UPDATE/DELETE) */
export const state = (o: Omit<StateCheck, 'kind'>): StateCheck => ({ kind: 'state', ...o });

/**
 * Abfrage der Tabellenstruktur für die Zustandsprüfung von CREATE/ALTER TABLE.
 * Datentypen werden nach den SQLite-Regeln (Type Affinity) zusammengefasst, damit z. B.
 * VARCHAR(100) und TEXT bzw. INT und INTEGER als gleichwertig gelten.
 * Eine Primärschlüsselspalte gilt immer als Pflichtfeld.
 */
export const structureOf = (table: string) => ({
  label: `Struktur der Tabelle ${table}`,
  sql: `SELECT lower(name) AS spalte,
       CASE
         WHEN upper(type) LIKE '%INT%' THEN 'ganze Zahl'
         WHEN upper(type) LIKE '%CHAR%' OR upper(type) LIKE '%TEXT%' OR upper(type) LIKE '%CLOB%' OR upper(type) LIKE '%DATE%' OR upper(type) LIKE '%TIME%' THEN 'Text'
         WHEN type = '' OR upper(type) LIKE '%BLOB%' THEN 'ohne Typ'
         ELSE 'Dezimalzahl'
       END AS datentyp,
       CASE WHEN pk > 0 THEN 1 ELSE "notnull" END AS pflicht,
       CASE WHEN pk > 0 THEN 1 ELSE 0 END AS primaerschluessel
FROM pragma_table_info('${table}');`,
});
