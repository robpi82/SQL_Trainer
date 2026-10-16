import type { DbId } from '../db/seeds';

export interface ReferenceEntry {
  id: string;
  title: string;
  category: string;
  syntax: string;
  explanation: string;
  example: string;
  db: DbId;
  mistakes: string[];
  dialect?: string;
  moduleId?: number;
}

/** Durchsuchbares SQL-Nachschlagewerk (SQLite). */
export const REFERENCE: ReferenceEntry[] = [
  {
    id: 'select', title: 'SELECT … FROM', category: 'Grundlagen', moduleId: 2, db: 'vertrieb',
    syntax: 'SELECT spalte1, spalte2\nFROM tabelle;',
    explanation: 'Liest Daten aus einer Tabelle. `*` wählt alle Spalten.',
    example: 'SELECT vorname, nachname FROM kunden;',
    mistakes: ['Komma nach der letzten Spalte vor FROM.', 'Fehlendes Komma zwischen Spalten – das zweite Wort wird zum Alias.'],
  },
  {
    id: 'alias', title: 'AS (Alias)', category: 'Grundlagen', moduleId: 2, db: 'vertrieb',
    syntax: 'SELECT ausdruck AS neuer_name\nFROM tabelle AS t;',
    explanation: 'Gibt einer Spalte oder Tabelle einen anderen Namen im Ergebnis bzw. in der Abfrage. Ändert keine Daten.',
    example: 'SELECT p.name AS produkt, p.preis * 1.19 AS brutto\nFROM produkte AS p;',
    mistakes: ['Alias mit Leerzeichen ohne Anführungszeichen.', 'Alias in einfache Anführungszeichen setzen – das ist dann ein Text.'],
    dialect: 'SQL Server: [Name mit Leerzeichen], MySQL: `Backticks`.',
  },
  {
    id: 'where', title: 'WHERE', category: 'Filtern', moduleId: 3, db: 'vertrieb',
    syntax: 'SELECT …\nFROM tabelle\nWHERE bedingung;',
    explanation: 'Behält nur Zeilen, für die die Bedingung wahr ist. Wird vor GROUP BY und SELECT verarbeitet.',
    example: "SELECT name, preis FROM produkte WHERE preis < 50;",
    mistakes: ['Aggregatfunktionen in WHERE (→ HAVING verwenden).', 'Texte ohne einfache Anführungszeichen.'],
  },
  {
    id: 'vergleich', title: 'Vergleichsoperatoren', category: 'Filtern', moduleId: 3, db: 'vertrieb',
    syntax: '=   <>   !=   <   >   <=   >=',
    explanation: 'Vergleichen Zahlen, Texte und ISO-Datumswerte. Ergebnis: wahr, falsch oder – bei NULL – unbekannt.',
    example: "SELECT * FROM bestellungen WHERE status <> 'geliefert';",
    mistakes: ['`= NULL` statt `IS NULL`.', 'Groß-/Kleinschreibung: `=` unterscheidet in SQLite.'],
  },
  {
    id: 'andornot', title: 'AND, OR, NOT', category: 'Filtern', moduleId: 4, db: 'support',
    syntax: 'WHERE (a OR b) AND NOT c',
    explanation: 'Verknüpft Bedingungen. Vorrang: NOT vor AND vor OR. Klammern legen die Reihenfolge fest.',
    example: "SELECT * FROM tickets\nWHERE (prioritaet = 'hoch' OR kategorie_id = 3)\n  AND status <> 'geschlossen';",
    mistakes: ['Fehlende Klammern bei AND/OR-Kombinationen.', 'AND statt OR für „Hamburg und Köln“.'],
  },
  {
    id: 'orderby', title: 'ORDER BY', category: 'Sortieren & Begrenzen', moduleId: 5, db: 'vertrieb',
    syntax: 'ORDER BY spalte1 [ASC|DESC], spalte2 [ASC|DESC]',
    explanation: 'Sortiert das Ergebnis. ASC (aufsteigend) ist Standard. Weitere Kriterien greifen bei Gleichstand.',
    example: 'SELECT name, preis FROM produkte ORDER BY preis DESC, name;',
    mistakes: ['DESC gilt nur für die Spalte direkt davor.', 'Ohne ORDER BY ist die Reihenfolge nicht garantiert.'],
    dialect: 'NULL steht in SQLite/MySQL vorne, in PostgreSQL hinten (NULLS FIRST/LAST).',
  },
  {
    id: 'distinct', title: 'DISTINCT', category: 'Sortieren & Begrenzen', moduleId: 5, db: 'vertrieb',
    syntax: 'SELECT DISTINCT spalte1, spalte2 FROM tabelle;',
    explanation: 'Entfernt doppelte Zeilen aus dem Ergebnis – bezogen auf alle ausgewählten Spalten. NULL-Werte gelten dabei als gleich.',
    example: 'SELECT DISTINCT stadt FROM kunden ORDER BY stadt;',
    mistakes: ['DISTINCT als „Funktion“ für eine einzelne Spalte missverstehen.', 'DISTINCT nutzen, um eine JOIN-Vervielfachung zu verstecken, statt die Ursache zu verstehen.'],
  },
  {
    id: 'limit', title: 'LIMIT / OFFSET', category: 'Sortieren & Begrenzen', moduleId: 5, db: 'vertrieb',
    syntax: 'LIMIT anzahl [OFFSET überspringen]',
    explanation: 'Begrenzt die Anzahl der Ergebniszeilen. Steht ganz am Ende.',
    example: 'SELECT name, preis FROM produkte ORDER BY preis DESC LIMIT 3;',
    mistakes: ['LIMIT ohne ORDER BY.'],
    dialect: 'SQL Server: SELECT TOP 3 … bzw. OFFSET 0 ROWS FETCH NEXT 3 ROWS ONLY.',
  },
  {
    id: 'like', title: 'LIKE', category: 'Filtern', moduleId: 6, db: 'vertrieb',
    syntax: "spalte LIKE 'muster'   -- % = beliebig viele Zeichen, _ = genau ein Zeichen",
    explanation: 'Mustervergleich für Texte. In SQLite für A–Z nicht case-sensitiv.',
    example: "SELECT name FROM produkte WHERE name LIKE 'Laptop%';",
    mistakes: ['% vergessen.', "Zu breite Muster ('%berlin%' trifft auch 'Berlinchen')."],
    dialect: 'PostgreSQL: LIKE ist case-sensitiv, ILIKE nicht.',
  },
  {
    id: 'in', title: 'IN', category: 'Filtern', moduleId: 6, db: 'vertrieb',
    syntax: "spalte IN (wert1, wert2, …)\nspalte IN (SELECT …)",
    explanation: 'Prüft, ob ein Wert in einer Liste oder im Ergebnis einer Unterabfrage vorkommt.',
    example: "SELECT * FROM kunden WHERE stadt IN ('Hamburg', 'Köln');",
    mistakes: ['NOT IN mit einer Liste, die NULL enthält, liefert keine Zeilen.'],
  },
  {
    id: 'between', title: 'BETWEEN', category: 'Filtern', moduleId: 6, db: 'forschung',
    syntax: 'spalte BETWEEN untergrenze AND obergrenze',
    explanation: 'Bereichsprüfung inklusive beider Grenzen.',
    example: "SELECT * FROM beobachtungen WHERE datum BETWEEN '2024-04-01' AND '2024-05-31';",
    mistakes: ["Bei Zeitstempeln: '2024-05-31 14:00' liegt NICHT zwischen … AND '2024-05-31'.", 'Grenzen vertauscht (BETWEEN 100 AND 50 liefert nichts).'],
  },
  {
    id: 'null', title: 'IS NULL / IS NOT NULL', category: 'Filtern', moduleId: 6, db: 'vertrieb',
    syntax: 'spalte IS NULL\nspalte IS NOT NULL',
    explanation: "Findet fehlende bzw. vorhandene Werte. NULL ist kein Wert – weder 0 noch ''.",
    example: "SELECT * FROM kunden WHERE email IS NULL OR email = '';",
    mistakes: ['`= NULL` ist nie wahr.', "NULL und leere Zeichenkette verwechseln."],
  },
  {
    id: 'coalesce', title: 'COALESCE / IFNULL', category: 'Funktionen', db: 'vertrieb',
    syntax: 'COALESCE(wert1, wert2, …)\nIFNULL(wert, ersatz)',
    explanation: 'Liefert den ersten Wert, der nicht NULL ist. Nützlich, um NULL für die Anzeige oder Berechnung zu ersetzen.',
    example: "SELECT name, COALESCE(kategorie, 'ohne Kategorie') AS kategorie FROM produkte;",
    mistakes: ['NULL durch 0 ersetzen, obwohl „unbekannt“ fachlich etwas anderes bedeutet.'],
    dialect: 'SQL Server: ISNULL(a, b), Oracle: NVL(a, b). COALESCE funktioniert überall.',
  },
  {
    id: 'arithmetik', title: 'Rechnen: + - * / %', category: 'Funktionen', moduleId: 7, db: 'vertrieb',
    syntax: 'ausdruck * ausdruck\nROUND(wert, stellen)\nCAST(wert AS REAL)',
    explanation: 'Berechnungen je Zeile. Ganzzahl / Ganzzahl ergibt eine Ganzzahl. % ist der Rest der Division.',
    example: 'SELECT position_id, menge * einzelpreis AS wert, 7 / 2 AS ganz, 7 / 2.0 AS dezimal\nFROM bestellpositionen LIMIT 3;',
    mistakes: ['Ganzzahldivision übersehen.', 'Rechnen mit NULL ergibt NULL.', 'Komma statt Punkt als Dezimaltrennzeichen.'],
  },
  {
    id: 'text', title: 'Textfunktionen', category: 'Funktionen', moduleId: 7, db: 'vertrieb',
    syntax: "a || b\nLOWER(t)  UPPER(t)  TRIM(t)  LENGTH(t)\nSUBSTR(t, start, länge)  REPLACE(t, alt, neu)  INSTR(t, such)",
    explanation: 'Verketten und Bearbeiten von Texten. Funktionen lassen sich verschachteln (innen zuerst).',
    example: "SELECT vorname || ' ' || nachname AS name,\n       UPPER(SUBSTR(nachname, 1, 3)) AS kuerzel,\n       LENGTH(stadt) AS laenge\nFROM kunden;",
    mistakes: ['LOWER/UPPER wandeln in SQLite keine Umlaute um.', '|| mit NULL ergibt NULL.'],
    dialect: 'MySQL: CONCAT(a, b); SQL Server: a + b, LEN statt LENGTH, SUBSTRING statt SUBSTR.',
  },
  {
    id: 'datum', title: 'Datumsfunktionen', category: 'Funktionen', moduleId: 8, db: 'support',
    syntax: "date(d, '+7 days')   date('now')\nstrftime('%Y-%m', d)\njulianday(ende) - julianday(start)",
    explanation: 'SQLite speichert Datumswerte als ISO-Text. strftime formatiert/extrahiert (Ergebnis: Text), date rechnet, julianday liefert Tageszahlen für Differenzen.',
    example: "SELECT ticket_id,\n       strftime('%Y-%m', erstellt_am) AS monat,\n       (julianday(geloest_am) - julianday(erstellt_am)) * 24 AS stunden\nFROM tickets;",
    mistakes: ["strftime('%Y', d) = 2024 (Zahl statt Text '2024').", 'Datumswerte direkt subtrahieren.'],
    dialect: 'MySQL: YEAR(), DATEDIFF(); PostgreSQL: EXTRACT(), d1 - d2; SQL Server: DATEPART(), DATEDIFF(day, a, b).',
  },
  {
    id: 'count', title: 'COUNT', category: 'Aggregate', moduleId: 9, db: 'vertrieb',
    syntax: 'COUNT(*)  COUNT(spalte)  COUNT(DISTINCT spalte)',
    explanation: 'COUNT(*) zählt Zeilen, COUNT(spalte) Werte ungleich NULL, COUNT(DISTINCT spalte) unterschiedliche Werte.',
    example: 'SELECT COUNT(*) AS alle, COUNT(email) AS mit_email, COUNT(DISTINCT stadt) AS staedte\nFROM kunden;',
    mistakes: ['COUNT(*) nach LEFT JOIN zählt auch die NULL-Zeilen.', 'COUNT nach JOIN zählt vervielfachte Zeilen.'],
  },
  {
    id: 'sumavg', title: 'SUM, AVG, MIN, MAX', category: 'Aggregate', moduleId: 9, db: 'vertrieb',
    syntax: 'SUM(x)  AVG(x)  MIN(x)  MAX(x)',
    explanation: 'Fassen viele Werte zusammen und ignorieren NULL. Ohne GROUP BY entsteht genau eine Ergebniszeile.',
    example: 'SELECT SUM(menge * einzelpreis) AS umsatz, ROUND(AVG(einzelpreis), 2) AS schnitt\nFROM bestellpositionen;',
    mistakes: ['SUM(x)/COUNT(*) statt AVG(x) bei NULL-Werten.', 'Aggregat in WHERE.'],
  },
  {
    id: 'groupby', title: 'GROUP BY', category: 'Aggregate', moduleId: 10, db: 'vertrieb',
    syntax: 'SELECT gruppe, AGGREGAT(…)\nFROM …\nGROUP BY gruppe;',
    explanation: 'Bildet Gruppen gleicher Werte; Aggregate werden je Gruppe berechnet. NULL bildet eine eigene Gruppe.',
    example: 'SELECT status, COUNT(*) AS anzahl FROM bestellungen GROUP BY status;',
    mistakes: ['Nicht gruppierte, nicht aggregierte Spalten in SELECT (SQLite erlaubt es, liefert aber Zufallswerte).', 'Nach Namen statt IDs gruppieren.'],
  },
  {
    id: 'having', title: 'HAVING', category: 'Aggregate', moduleId: 10, db: 'support',
    syntax: 'GROUP BY gruppe\nHAVING AGGREGAT(…) bedingung',
    explanation: 'Filtert Gruppen nach dem Gruppieren. WHERE filtert Zeilen davor.',
    example: 'SELECT kategorie_id, COUNT(*) AS anzahl\nFROM tickets\nGROUP BY kategorie_id\nHAVING COUNT(*) > 3;',
    mistakes: ['Zeilenbedingungen in HAVING statt WHERE.', 'HAVING vor GROUP BY schreiben.'],
  },
  {
    id: 'innerjoin', title: 'INNER JOIN', category: 'Verknüpfen', moduleId: 11, db: 'vertrieb',
    syntax: 'FROM a\nINNER JOIN b ON b.fk = a.pk',
    explanation: 'Verbindet Zeilen, die die ON-Bedingung erfüllen. Zeilen ohne Partner fallen weg.',
    example: 'SELECT b.bestellung_id, k.nachname\nFROM bestellungen AS b\nJOIN kunden AS k ON k.kunde_id = b.kunde_id;',
    mistakes: ['Falsche Spalten verknüpft.', 'ON vergessen (kartesisches Produkt).', 'Mehrdeutige Spaltennamen ohne Alias.'],
  },
  {
    id: 'leftjoin', title: 'LEFT JOIN', category: 'Verknüpfen', moduleId: 11, db: 'vertrieb',
    syntax: 'FROM a\nLEFT JOIN b ON b.fk = a.pk [AND weitere_bedingung]',
    explanation: 'Behält alle Zeilen der linken Tabelle; fehlende Partner werden mit NULL aufgefüllt.',
    example: 'SELECT k.vorname, b.bestellung_id\nFROM kunden AS k\nLEFT JOIN bestellungen AS b ON b.kunde_id = k.kunde_id\nWHERE b.bestellung_id IS NULL;',
    mistakes: ['Filter auf die rechte Tabelle in WHERE macht den LEFT JOIN zum INNER JOIN.', 'COUNT(*) statt COUNT(b.id).'],
  },
  {
    id: 'subquery', title: 'Unterabfrage (skalar)', category: 'Unterabfragen', moduleId: 12, db: 'vertrieb',
    syntax: 'WHERE spalte > (SELECT AGGREGAT(…) FROM …)',
    explanation: 'Eine Unterabfrage, die genau einen Wert liefert, kann wie eine Konstante verwendet werden.',
    example: 'SELECT name, preis FROM produkte\nWHERE preis > (SELECT AVG(preis) FROM produkte);',
    mistakes: ['Unterabfrage liefert mehrere Zeilen (SQLite nimmt still die erste, andere DBs melden Fehler).'],
  },
  {
    id: 'exists', title: 'EXISTS / NOT EXISTS', category: 'Unterabfragen', moduleId: 12, db: 'vertrieb',
    syntax: 'WHERE [NOT] EXISTS (\n  SELECT 1 FROM b WHERE b.fk = a.pk\n)',
    explanation: 'Wahr, wenn die (meist korrelierte) Unterabfrage mindestens eine Zeile liefert. Robust gegenüber NULL.',
    example: 'SELECT p.name FROM produkte AS p\nWHERE NOT EXISTS (SELECT 1 FROM bestellpositionen AS bp WHERE bp.produkt_id = p.produkt_id);',
    mistakes: ['Bezug zur äußeren Tabelle vergessen.'],
  },
  {
    id: 'case', title: 'CASE WHEN', category: 'Funktionen', moduleId: 13, db: 'vertrieb',
    syntax: "CASE\n  WHEN bedingung1 THEN ergebnis1\n  WHEN bedingung2 THEN ergebnis2\n  ELSE ergebnis_sonst\nEND",
    explanation: 'Fallunterscheidung innerhalb einer Abfrage. Die erste zutreffende Bedingung gewinnt. (Ausführliche Lektion geplant.)',
    example: "SELECT name, preis,\n  CASE WHEN preis >= 500 THEN 'teuer'\n       WHEN preis >= 50 THEN 'mittel'\n       ELSE 'günstig' END AS preisklasse\nFROM produkte;",
    mistakes: ['END vergessen.', 'Reihenfolge der WHEN-Zweige: die erste wahre Bedingung zählt.'],
  },
  {
    id: 'insert', title: 'INSERT', category: 'Daten ändern', moduleId: 14, db: 'vertrieb',
    syntax: 'INSERT INTO tabelle (spalte1, spalte2)\nVALUES (wert1, wert2);',
    explanation: 'Fügt eine (oder mehrere, durch Komma getrennte) Zeilen ein.',
    example: "INSERT INTO produkte (produkt_id, name, kategorie, preis, lagerbestand)\nVALUES (13, 'Laptoptasche', 'Zubehör', 39.00, 40);",
    mistakes: ['Werte in anderer Reihenfolge als die Spalten.', 'Primärschlüssel doppelt (UNIQUE constraint failed).'],
  },
  {
    id: 'update', title: 'UPDATE', category: 'Daten ändern', moduleId: 14, db: 'vertrieb',
    syntax: 'UPDATE tabelle\nSET spalte1 = wert1, spalte2 = wert2\nWHERE bedingung;',
    explanation: 'Ändert alle Zeilen, die die Bedingung erfüllen.',
    example: 'UPDATE produkte SET lagerbestand = lagerbestand + 20 WHERE produkt_id = 10;',
    mistakes: ['WHERE vergessen – alle Zeilen werden geändert!', 'SET a = 1 AND b = 2 statt SET a = 1, b = 2.'],
  },
  {
    id: 'delete', title: 'DELETE', category: 'Daten ändern', moduleId: 14, db: 'support',
    syntax: 'DELETE FROM tabelle\nWHERE bedingung;',
    explanation: 'Löscht alle Zeilen, die die Bedingung erfüllen.',
    example: 'DELETE FROM statusereignisse WHERE ticket_id = 15;',
    mistakes: ['WHERE vergessen – die Tabelle ist danach leer!', 'Zeilen löschen, auf die noch Fremdschlüssel verweisen.'],
  },
  {
    id: 'createtable', title: 'CREATE TABLE', category: 'Tabellen anlegen', moduleId: 15, db: 'vertrieb',
    syntax: 'CREATE TABLE name (\n  id INTEGER PRIMARY KEY,\n  spalte TEXT NOT NULL,\n  fk_id INTEGER REFERENCES andere(id)\n);',
    explanation: 'Legt eine neue Tabelle mit Spalten, Datentypen und Constraints an. (Ausführliche Lektion geplant.)',
    example: "CREATE TABLE lieferanten (\n  lieferant_id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL UNIQUE,\n  land TEXT DEFAULT 'DE'\n);\nSELECT * FROM lieferanten;",
    mistakes: ['Komma nach der letzten Spaltendefinition.', 'Fremdschlüssel auf nicht existierende Tabelle.'],
    dialect: 'SQLite ist bei Datentypen sehr flexibel (Type Affinity). Andere Datenbanken erzwingen VARCHAR(n), DECIMAL(p,s), DATE usw.',
  },
  {
    id: 'reihenfolge', title: 'Schreib- vs. Verarbeitungsreihenfolge', category: 'Grundlagen', db: 'vertrieb',
    syntax: 'Geschrieben:  SELECT – FROM – JOIN – WHERE – GROUP BY – HAVING – ORDER BY – LIMIT\nVerarbeitet:  FROM/JOIN – WHERE – GROUP BY – HAVING – SELECT – DISTINCT – ORDER BY – LIMIT',
    explanation: 'Die Datenbank verarbeitet SELECT erst nach dem Filtern und Gruppieren. Deshalb sind Spaltenaliase in ORDER BY nutzbar, in WHERE (standardmäßig) nicht, und Aggregate gehören in HAVING statt WHERE.',
    example: "SELECT kunde_id, COUNT(*) AS anzahl\nFROM bestellungen\nWHERE status <> 'storniert'\nGROUP BY kunde_id\nHAVING COUNT(*) >= 2\nORDER BY anzahl DESC;",
    mistakes: ['Aggregate in WHERE.', 'Klauseln in falscher Reihenfolge schreiben (z. B. WHERE nach GROUP BY).'],
  },
];
