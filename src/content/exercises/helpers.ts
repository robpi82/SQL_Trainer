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

/** Prüft, ob eine Tabelle als STRICT angelegt wurde (SQLite ab 3.37). */
export const strictOf = (table: string) => ({
  label: `${table} ist STRICT`,
  sql: `SELECT COUNT(*) AS strict_tabelle FROM pragma_table_list WHERE name = '${table}' AND strict = 1;`,
  hint: `Die Tabelle ${table} soll eine STRICT-Tabelle sein: Schreibe STRICT hinter die schließende Klammer, also „) STRICT;“.`,
});

/** Prüft, ob es einen Index gibt, dessen erste Spalte `column` ist (Telefonbuch-Prinzip). */
export const indexOn = (table: string, column: string) => ({
  label: `Index auf ${table}.${column}`,
  sql: `SELECT COUNT(*) > 0 AS index_vorhanden
FROM pragma_index_list('${table}') AS il
WHERE (SELECT ii.name FROM pragma_index_info(il.name) AS ii WHERE ii.seqno = 0) = '${column}';`,
  hint: `Es gibt keinen Index, der mit der Spalte ${column} beginnt. Ein Index über (andere_spalte, ${column}) hilft bei der Suche nur nach ${column} nicht – wie ein Telefonbuch, das nach Nachnamen sortiert ist.`,
});
