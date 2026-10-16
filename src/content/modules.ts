import type { ModuleInfo } from './types';

/** Lernpfad. Module mit status „geplant“ werden angezeigt, aber nicht als fertig dargestellt. */
export const MODULES: ModuleInfo[] = [
  { id: 1, title: 'Tabellen, Schlüssel und Datentypen', short: 'Grundbegriffe', status: 'verfügbar', lessonId: 'm01' },
  { id: 2, title: 'SELECT, FROM, Spaltenauswahl und Aliase', short: 'SELECT', status: 'verfügbar', lessonId: 'm02' },
  { id: 3, title: 'WHERE und Vergleichsoperatoren', short: 'WHERE', status: 'verfügbar', lessonId: 'm03' },
  { id: 4, title: 'AND, OR, NOT und Klammern', short: 'Logik', status: 'verfügbar', lessonId: 'm04' },
  { id: 5, title: 'ORDER BY, DISTINCT und LIMIT', short: 'Sortieren', status: 'verfügbar', lessonId: 'm05' },
  { id: 6, title: 'LIKE, IN, BETWEEN und NULL', short: 'Filter & NULL', status: 'verfügbar', lessonId: 'm06' },
  { id: 7, title: 'Berechnungen und Textfunktionen', short: 'Berechnungen', status: 'verfügbar', lessonId: 'm07' },
  { id: 8, title: 'Datumswerte und Datumsfunktionen', short: 'Datum', status: 'verfügbar', lessonId: 'm08' },
  { id: 9, title: 'COUNT, SUM, AVG, MIN und MAX', short: 'Aggregate', status: 'verfügbar', lessonId: 'm09' },
  { id: 10, title: 'GROUP BY und HAVING', short: 'Gruppieren', status: 'verfügbar', lessonId: 'm10' },
  { id: 11, title: 'INNER JOIN und LEFT JOIN', short: 'JOINs', status: 'verfügbar', lessonId: 'm11' },
  { id: 12, title: 'Unterabfragen: skalar, IN und EXISTS', short: 'Unterabfragen', status: 'verfügbar', lessonId: 'm12' },
  { id: 13, title: 'CASE WHEN', short: 'CASE', status: 'geplant' },
  { id: 14, title: 'INSERT, UPDATE und DELETE', short: 'Daten ändern', status: 'verfügbar', lessonId: 'm14' },
  { id: 15, title: 'CREATE TABLE, Constraints und Beziehungen', short: 'DDL', status: 'geplant' },
  { id: 16, title: 'Gemischte Analyseaufgaben und Praxisprojekte', short: 'Praxis', status: 'geplant' },
  { id: 17, title: 'Optional: CTEs (WITH) und Window Functions', short: 'Fortgeschritten', status: 'geplant' },
];
