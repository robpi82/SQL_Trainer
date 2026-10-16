import type { Lesson } from '../types';

/**
 * Lektionen zum eigenen Unterricht (E.I.S. · Dezernat 512).
 * moduleId = 100 + Kurstag, damit sie sich nicht mit dem Lernpfad überschneiden.
 */
export const COURSE_LESSONS: Lesson[] = [
  {
    id: 'k02',
    moduleId: 102,
    course: { day: 2, label: 'Tag 2', sources: ['Einsatz 512-002: Ein Datenmodell für Versorgungslieferungen'] },
    title: 'Datenmodellierung mit dem ERM',
    diagram: 'lieferdb-erm',
    goals: [
      'Du erkennst in einem Lastenheft Entitäten, Attribute und Beziehungen.',
      'Du bestimmst Kardinalitäten (1:1, 1:n, n:m) mit der Satzprobe in beide Richtungen.',
      'Du löst n:m-Beziehungen über eine Zwischenentität auf und findest ihren Schlüssel.',
      'Du überführst ein ERM nach fünf Regeln in Tabellen und liest das Modell mit JOINs.',
    ],
    explanation: [
      'Bevor eine Datenbank gebaut wird, wird sie **modelliert**. Das **Entity-Relationship-Modell (ERM)** beschreibt, *worüber* Daten gespeichert werden und wie die Dinge zusammenhängen – noch ohne SQL.',
      '**Entität** (Entitätstyp): ein Ding mit eigenen Eigenschaften, über das wir mehrere Angaben speichern – Schiff, Station, Lieferung, Ware. Faustregel: Hauptwörter im Lastenheft prüfen. Hat das Wort eigene Eigenschaften, ist es eine Entität („Karteikarte“). Ist es selbst nur ein Wert, ist es ein **Attribut** („Feld auf der Karte“) – Name, Flagge, Region, Ankunftsdatum.',
      'Jede Entität braucht einen **Schlüssel**, der jedes Exemplar eindeutig macht. Meist ist das eine künstliche Nummer wie `schiff_id`, weil Namen sich ändern oder doppelt vorkommen können.',
      '**Beziehungen und Kardinalität** – die **Satzprobe in beide Richtungen**: „Ein Schiff bringt *viele* Lieferungen. Eine Lieferung kommt mit *genau einem* Schiff.“ → **1 : n**. Lautet die Antwort in beide Richtungen „viele“, ist es **n : m**; in beide Richtungen „eins“, ist es **1 : 1**.',
      '**Notationen:** In der **Chen-Notation** sind Entitäten Rechtecke, Attribute Ellipsen und Beziehungen Rauten, die Kardinalität steht als 1, n oder m an der Linie. In der **Krähenfuß-Notation** (siehe Grafik) bedeuten zwei Striche „genau eins“ und der Krähenfuß „viele“.',
      '**n : m auflösen:** Eine n:m-Beziehung kann man nicht direkt speichern. Sie wird zu einer eigenen **Zwischenentität** mit zwei 1:n-Beziehungen. Attribute, die zum *Paar* gehören, wandern dorthin: Die Menge in Kisten gehört weder nur zur Lieferung noch nur zur Ware, sondern zur **Position** „diese Ware in dieser Lieferung“.',
      '**Schlüssel der Zwischenentität:** Darf jede Ware pro Lieferung nur einmal vorkommen, ist das Paar `(lieferung_id, ware_id)` eindeutig – ein **zusammengesetzter Schlüssel**, dessen Teile zugleich Fremdschlüssel sind. Alternativ geht ein künstlicher Schlüssel `position_id` plus UNIQUE auf das Paar.',
      '**Vom Modell zur Tabelle – fünf Regeln:** 1. Entitätstyp → Tabelle. 2. Attribut → Spalte mit Datentyp. 3. Schlüsselattribut → PRIMARY KEY. 4. Beziehung 1:n → Fremdschlüssel auf der **n-Seite** (dort, wo der Krähenfuß ist). 5. Beziehung n:m → Zwischentabelle mit zwei Fremdschlüsseln. Bei **1:1** steht der Fremdschlüssel auf einer Seite und bekommt zusätzlich UNIQUE.',
      '**Die Probe mit echten Daten:** Ein Modell ist erst fertig, wenn ein echtes Beispiel hineinpasst – etwa die Lieferung der MS FIG 512 vom 3. Februar 2026 an Station CBW mit Diesel, Mehl, Kaffee und Tiefkühlware.',
    ],
    terms: [
      { term: 'Entität', definition: 'Ding mit eigenen Eigenschaften, über das mehrere Angaben gespeichert werden (wird zur Tabelle).' },
      { term: 'Attribut', definition: 'Einzelne Eigenschaft einer Entität (wird zur Spalte).' },
      { term: 'Kardinalität', definition: 'Wie viele Exemplare auf jeder Seite beteiligt sind: 1:1, 1:n oder n:m.' },
      { term: 'Satzprobe', definition: 'Die Beziehung in beiden Richtungen als Satz formulieren: „Ein A hat … B; ein B gehört zu … A.“' },
      { term: 'Zwischenentität', definition: 'Löst n:m in zwei 1:n auf; trägt Attribute des Paares (z. B. Menge).' },
      { term: 'Zusammengesetzter Schlüssel', definition: 'Primärschlüssel aus mehreren Attributen, z. B. (lieferung_id, ware_id).' },
    ],
    example: {
      db: 'lieferdb',
      tables: [
        { label: 'lieferungen – jede Lieferung zeigt auf ein Schiff und eine Station (1:n)', sql: 'SELECT * FROM lieferungen;' },
        { label: 'positionen – die aufgelöste n:m-Beziehung (Auszug)', sql: 'SELECT * FROM positionen WHERE lieferung_id IN (1, 2);' },
      ],
      sql: "SELECT l.lieferung_id, l.ankunft, s.name AS schiff, st.name AS station,\n       w.bezeichnung, p.menge_kisten\nFROM lieferungen AS l\nJOIN schiffe AS s    ON s.schiff_id = l.schiff_id\nJOIN stationen AS st ON st.station_id = l.station_id\nJOIN positionen AS p ON p.lieferung_id = l.lieferung_id\nJOIN waren AS w      ON w.ware_id = p.ware_id\nWHERE l.lieferung_id = 1;",
      note: 'Die Abfrage folgt den Linien des ERM: von der Lieferung zum Schiff und zur Station (je 1:n), über die Positionen zu den Waren (aufgelöstes n:m). Jede Linie im Modell wird zu einer JOIN-Bedingung zwischen Fremd- und Primärschlüssel.',
    },
    steps: [
      { code: 'Entitäten finden', text: 'Hauptwörter mit eigenen Eigenschaften: Schiff, Station, Lieferung, Ware.' },
      { code: 'Attribute zuordnen', text: 'Name, Flagge und Kapitän zum Schiff; Name und Region zur Station; Ankunft zur Lieferung; Bezeichnung und Einheit zur Ware.' },
      { code: 'Satzprobe', text: 'Schiff–Lieferung 1:n, Station–Lieferung 1:n, Lieferung–Ware n:m.' },
      { code: 'n:m auflösen', text: 'Die Menge gehört zum Paar → neue Entität Position mit zwei 1:n-Beziehungen.' },
      { code: 'Schlüssel', text: 'Je eine ID; bei Position das Paar (lieferung_id, ware_id).' },
      { code: 'Überführen', text: 'Fünf Tabellen; Fremdschlüssel schiff_id und station_id in lieferungen, lieferung_id und ware_id in positionen.' },
    ],
    extraSections: [
      {
        title: 'Notationen im Vergleich',
        paragraphs: [
          '- **Chen:** Rechteck = Entität, Ellipse = Attribut, Raute = Beziehung, Kardinalität als 1 / n / m an der Linie.\n- **Krähenfuß:** Kasten = Entität mit Attributliste, zwei Striche = genau eins, Kreis = optional (null), Krähenfuß = viele.\n- **In Prüfungen** wird oft verlangt, ein ERM aus einem Text zu zeichnen und anschließend die Tabellen mit Primär- und Fremdschlüsseln anzugeben.',
        ],
      },
    ],
    dialectNotes: [
      'Das ERM ist unabhängig von der Datenbank. Erst bei der Überführung entscheidet man über Datentypen und Regeln – das ist Thema von Tag 3.',
    ],
    summary: {
      merksatz: 'Entitäten werden Tabellen, Attribute Spalten. Der Fremdschlüssel steht dort, wo der Krähenfuß ist; n:m wird zur Zwischentabelle mit zusammengesetztem Schlüssel.',
      fehler: [
        'Attribute (Name, Region, Datum) als Entitäten zeichnen.',
        'Die Satzprobe nur in eine Richtung machen – dann wird n:m als 1:n übersehen.',
        'Den Fremdschlüssel auf die 1-Seite legen.',
        'Ein Attribut des Paares (Menge, Note) an eine der beiden Entitäten hängen.',
        'Mehrere Werte in ein Feld schreiben („Diesel, Mehl, Kaffee“) statt eine Zwischentabelle zu bilden.',
      ],
    },
  },

  {
    id: 'k03',
    moduleId: 103,
    course: { day: 3, label: 'Tag 3', sources: ['Pinguin-Labor Tag 3: Tabellen bauen', 'Einsatz 512-003: Bau der Lieferdatenbank'] },
    title: 'Tabellen bauen: STRICT, Constraints und Indizes',
    goals: [
      'Du schreibst CREATE TABLE mit passenden Datentypen – in SQLite und in Prüfungsschreibweise.',
      'Du baust streng: STRICT-Tabellen und Constraints, die falsche Daten abweisen.',
      'Du legst Zwischentabellen mit zusammengesetztem Schlüssel an und kennst die richtige Reihenfolge beim Anlegen und Löschen.',
      'Du beschleunigst Suchen mit CREATE INDEX und prüfst die Wirkung mit EXPLAIN QUERY PLAN.',
    ],
    explanation: [
      '**Jede Tabelle hat einen Bauplan.** SQLite bewahrt den CREATE-TABLE-Befehl in der Systemtabelle `sqlite_master` auf: `SELECT sql FROM sqlite_master WHERE name = \'lieferungen\';` zeigt ihn.',
      '**Syntax:** `CREATE TABLE name ( spalte TYP regeln, … ) STRICT;` – zwischen zwei Spalten ein Komma, nach der letzten **kein** Komma, am Ende Klammer und Semikolon. Das sind die häufigsten Fehler, im Labor wie in der Prüfung.',
      '**Datentypen in SQLite:** INTEGER, REAL, TEXT, BLOB. Normalerweise ist der Typ nur ein Wunsch: In eine INTEGER-Spalte passt auch der Text „zweiundvierzig“, und `typeof()` verrät, was wirklich gespeichert ist. **STRICT** hinter der Klammer macht den Typ zur Regel (ab SQLite 3.37). In STRICT-Tabellen sind nur INTEGER, REAL, TEXT, BLOB und ANY erlaubt – `VARCHAR(50)` oder `DECIMAL(8,2)` werden abgelehnt. Ein Text wie `\'42\'` wird in eine Zahl umgewandelt, `\'zehn\'` nicht.',
      '**Constraints sind Türsteher:** `PRIMARY KEY` (eindeutig, nie leer), `NOT NULL` (Pflicht), `UNIQUE` (jeder Wert einmal – mehrere NULL erlaubt), `CHECK (bedingung)` (muss wahr sein; NULL lässt ein CHECK durch, deshalb oft zusammen mit NOT NULL), `REFERENCES tabelle(spalte)` (Fremdschlüssel). `DEFAULT` ist kein Türsteher, sondern die Garderobe: der Wert, wenn nichts angegeben ist.',
      "**Nützliche CHECKs aus dem Unterricht:** `CHECK (length(flagge) = 2)` für Länderkürzel, `CHECK (ankunft LIKE '____-__-__')` für das Datumsformat JJJJ-MM-TT (jeder Unterstrich = genau ein Zeichen), `CHECK (einheit IN ('kg', 'Liter', 'Stück'))` für eine feste Werteliste, `CHECK (menge_kisten > 0)`. Regeln über zwei Spalten stehen als eigene Zeile am Ende: `CHECK (bis IS NULL OR bis >= von)`.",
      '**Spalten- oder Tabellenregel:** Fremdschlüssel dürfen bei der Spalte stehen (`schiff_id INTEGER NOT NULL REFERENCES schiffe(schiff_id)`) oder am Ende (`FOREIGN KEY (schiff_id) REFERENCES schiffe(schiff_id)`). Schlüssel aus zwei Spalten stehen immer am Ende: `PRIMARY KEY (lieferung_id, ware_id)`. Regeln kann man benennen: `CONSTRAINT chk_menge CHECK (menge_kisten > 0)`.',
      '**Ein Befehl gilt ganz oder gar nicht:** Ein INSERT mit zwölf Zeilen, von denen eine einen CHECK verletzt, speichert **keine** Zeile.',
      '**Reihenfolge:** Erst die Tabellen anlegen, auf die andere zeigen (schiffe, stationen, waren), dann lieferungen, dann positionen. Beim Löschen umgekehrt: `DROP TABLE schiffe` scheitert, solange Lieferungen auf Schiffe zeigen. `ALTER TABLE … ADD COLUMN / RENAME COLUMN / RENAME TO` ändert Tabellen; neue Regeln für vorhandene Spalten kann SQLite nicht nachrüsten.',
      '**Indizes:** Ein Index ist ein Register für eine Spalte. `EXPLAIN QUERY PLAN SELECT …` zeigt, wie gesucht wird: `SCAN` = jede Zeile lesen, `SEARCH … USING INDEX` = im Register nachschlagen. Primärschlüssel und UNIQUE-Spalten haben automatisch einen Index. Ein Index über `(lieferung_id, ware_id)` hilft wie ein Telefonbuch nur bei der Suche nach der **ersten** Spalte – für `WHERE ware_id = 3` braucht man einen eigenen Index. Indizes kosten Speicher und Zeit bei jedem Schreiben, deshalb nur für Spalten, nach denen oft gesucht oder verknüpft wird (typisch: Fremdschlüssel).',
    ],
    terms: [
      { term: 'STRICT', definition: 'SQLite prüft den Datentyp jedes Werts (ab Version 3.37).' },
      { term: 'Constraint', definition: 'Integritätsbedingung, die bei jedem INSERT/UPDATE geprüft wird.' },
      { term: 'sqlite_master', definition: 'Systemtabelle mit allen Tabellen, Indizes und ihren CREATE-Befehlen.' },
      { term: 'Index', definition: 'Register für eine oder mehrere Spalten; beschleunigt Suchen, kostet beim Schreiben.' },
      { term: 'EXPLAIN QUERY PLAN', definition: 'Zeigt, ob SQLite eine Tabelle durchliest (SCAN) oder nachschlägt (SEARCH).' },
    ],
    example: {
      db: 'lieferdb',
      tables: [{ label: 'Der Bauplan von positionen aus sqlite_master', sql: "SELECT name, sql FROM sqlite_master WHERE name IN ('lieferungen', 'positionen');" }],
      sql: "CREATE TABLE ausruestung (\n  geraet_id      INTEGER PRIMARY KEY,\n  bezeichnung    TEXT    NOT NULL UNIQUE,\n  anzahl         INTEGER NOT NULL DEFAULT 1 CHECK (anzahl >= 0),\n  zustand        TEXT    NOT NULL DEFAULT 'gut'\n                         CHECK (zustand IN ('gut', 'defekt', 'verloren')),\n  station_id     INTEGER REFERENCES stationen(station_id)\n) STRICT;\n\nINSERT INTO ausruestung (geraet_id, bezeichnung, anzahl, station_id) VALUES (1, 'Funkgerät', 4, 1);\nINSERT INTO ausruestung (bezeichnung, station_id) VALUES ('Fernglas', 2);\n\nSELECT * FROM ausruestung;",
      note: 'Beim Funkgerät setzt DEFAULT den Zustand „gut“. Beim Fernglas fehlt die geraet_id – eine INTEGER-PRIMARY-KEY-Spalte zählt dann selbst hoch (in MySQL: AUTO_INCREMENT, in PostgreSQL: SERIAL/IDENTITY).',
    },
    steps: [
      { code: 'geraet_id INTEGER PRIMARY KEY', text: 'Schlüssel; wird automatisch vergeben, wenn man ihn weglässt.' },
      { code: 'bezeichnung TEXT NOT NULL UNIQUE', text: 'Pflicht und eindeutig.' },
      { code: 'DEFAULT 1 CHECK (anzahl >= 0)', text: 'Standardwert und Regel kombiniert: ohne Angabe 1, nie negativ.' },
      { code: "CHECK (zustand IN ('gut', …))", text: 'Nur Werte aus einer festen Liste.' },
      { code: 'REFERENCES stationen(station_id)', text: 'Fremdschlüssel; ohne NOT NULL darf er leer bleiben.' },
      { code: ') STRICT;', text: 'Datentypen werden geprüft – „vier“ statt 4 würde abgelehnt.' },
    ],
    extraSections: [
      {
        title: 'Türsteher bei der Arbeit: ein ungültiger Wert',
        paragraphs: ['Die Tabelle waren erlaubt nur die Einheiten kg, Liter und Stück. Die Datenbank lehnt alles andere ab.'],
        db: 'lieferdb',
        sql: "INSERT INTO waren (bezeichnung, einheit) VALUES ('Palettenware', 'Palette');",
        expectError: true,
      },
      {
        title: 'Index: SCAN oder SEARCH?',
        paragraphs: ['Für `ware_id` gibt es in der Lieferdatenbank schon den Index `idx_positionen_ware`. Für `menge_kisten` gibt es keinen – dort muss SQLite jede Zeile lesen.'],
        db: 'lieferdb',
        sql: 'EXPLAIN QUERY PLAN\nSELECT * FROM positionen WHERE ware_id = 3;\n\nEXPLAIN QUERY PLAN\nSELECT * FROM positionen WHERE menge_kisten > 30;',
      },
      {
        title: 'Prüfungsecke: CREATE TABLE auf Papier',
        paragraphs: [
          'In der IHK-Prüfung schreibt man CREATE TABLE meist in **allgemeinem SQL**, nicht in SQLite – also mit `INT`, `VARCHAR(50)`, `DECIMAL(2,1)`, `DATE` und ohne STRICT. Beispiel: Teilnehmende belegen Kurse (n:m), für jede Belegung wird eine Note gespeichert:',
          '`CREATE TABLE Belegung ( TeilnehmerID INT NOT NULL, KursID INT NOT NULL, Note DECIMAL(2,1), PRIMARY KEY (TeilnehmerID, KursID), FOREIGN KEY (TeilnehmerID) REFERENCES Teilnehmer(TeilnehmerID), FOREIGN KEY (KursID) REFERENCES Kurs(KursID) );`',
          '- Komma nach der letzten Zeile vergessen? Nein – **weglassen**!\n- Schlüssel aus zwei Spalten einmal am Ende, nicht hinter jede Spalte.\n- FOREIGN KEY immer mit REFERENCES Tabelle(Spalte).\n- Jede Spalte bekommt einen Datentyp.\n- Elterntabellen zuerst anlegen.',
        ],
      },
    ],
    dialectNotes: [
      'Datentypen: ganze Zahl INTEGER (SQLite) / INT (MySQL, SQL Server); Kommazahl genau DECIMAL(8,2) bzw. NUMERIC(8,2) – SQLite hat keinen exakten Dezimaltyp; Text VARCHAR(50), in SQL Server NVARCHAR(50); Datum DATE, Datum mit Uhrzeit DATETIME (MySQL), TIMESTAMP (PostgreSQL), DATETIME2 (SQL Server); wahr/falsch BOOLEAN bzw. BIT (SQL Server), in SQLite INTEGER 0/1.',
      'SQLite versteht VARCHAR(2), hält sich aber nicht daran – in eine solche Spalte passt auch „Norwegen“. Erst STRICT oder ein CHECK mit length() sichert die Länge ab.',
      'Fremdschlüssel prüft SQLite nur mit `PRAGMA foreign_keys = ON;` (in dieser App und im Kurslabor immer an).',
      'Nachträgliche Regeln: MySQL `ALTER TABLE … MODIFY`, PostgreSQL `ALTER TABLE … ALTER COLUMN` / `ADD CONSTRAINT`. SQLite muss die Tabelle neu bauen.',
    ],
    summary: {
      merksatz: 'Bauen Sie streng: STRICT für die Typen, Constraints für die Regeln, Fremdschlüssel für die Beziehungen – und ein Index dort, wo gesucht und verknüpft wird.',
      fehler: [
        'Komma nach der letzten Spalte; Semikolon vergessen.',
        'CHECK ohne NOT NULL – NULL kommt trotzdem durch.',
        'Fremdschlüssel ohne NOT NULL bei Pflichtbeziehungen.',
        'PRIMARY KEY hinter beide Spalten schreiben statt PRIMARY KEY (a, b) am Ende.',
        'VARCHAR/DECIMAL in STRICT-Tabellen verwenden.',
        'Kindtabelle vor der Elterntabelle anlegen oder Elterntabelle zuerst löschen.',
        'Index über (a, b) anlegen und erwarten, dass er bei WHERE b = … hilft.',
      ],
    },
  },

  {
    id: 'k04',
    moduleId: 104,
    course: {
      day: 4,
      label: 'Tag 4',
      sources: ['Pinguin-Labor Tag 4: Daten ändern', 'Einsatz 512-004: Die Lieferung der MS FIG 512'],
    },
    title: 'Daten ändern, Transaktionen und der Abgleich',
    goals: [
      'Du ordnest SQL-Befehle den Gruppen DQL, DDL, DML, TCL und DCL zu.',
      'Du fügst ein, änderst und löschst Daten sicher – auch mit Ausdrücken, Unterabfragen und INSERT … SELECT.',
      'Du verstehst, was ON DELETE CASCADE und SET NULL beim Löschen bewirken.',
      'Du sicherst Änderungen mit BEGIN, COMMIT, ROLLBACK und SAVEPOINT ab und kennst ACID, Isolationsstufen und Lost Update.',
      'Du gleichst zwei Zahlenwerke mit LEFT JOIN und COALESCE ab und hältst Befunde fest.',
    ],
    explanation: [
      '**Befehlsgruppen:** DQL – `SELECT` (lesen). DDL – `CREATE`, `ALTER`, `DROP` (Struktur). DML – `INSERT`, `UPDATE`, `DELETE` (Inhalt). TCL – `BEGIN`, `COMMIT`, `ROLLBACK`, `SAVEPOINT` (Transaktionen). DCL – `GRANT`, `REVOKE` (Rechte). Manche Bücher zählen SELECT zur DML – sicher ist: CREATE ist DDL, INSERT ist DML.',
      '**INSERT:** `INSERT INTO waren (bezeichnung, einheit) VALUES (\'Reis\', \'kg\');` – immer **mit Spaltenliste**: Sie bleibt richtig, wenn die Tabelle später eine Spalte bekommt. Mehrere Zeilen in einem Befehl: Werteblöcke mit Komma trennen. Weggelassene Spalten bekommen ihren DEFAULT oder NULL; eine INTEGER-PRIMARY-KEY-Spalte zählt selbst hoch.',
      '**Fehlermeldungen lesen:** `NOT NULL constraint failed: waren.bezeichnung` nennt Regel, Tabelle und Spalte. Bei `FOREIGN KEY constraint failed` nennt SQLite die Spalte nicht – fragen Sie jede Elterntabelle einzeln, ob es den Wert gibt; die Abfrage ohne Ergebnis zeigt den kaputten Verweis.',
      '**Reihenfolge bei neuen Daten:** Erst die Elternzeile (Lieferung), dann die Kinder (Positionen) – sonst greift der Fremdschlüssel.',
      '**INSERT … SELECT:** Statt VALUES darf eine Abfrage stehen: `INSERT INTO ziel (a, b) SELECT a, b FROM quelle WHERE …;` – das Werkzeug für Umzüge, Archive und Befundtabellen. Spaltenliste vorn und Spalten der Abfrage hinten müssen in Anzahl und Reihenfolge passen; eigene Nummernkreise (IDs) lässt man weg.',
      '**UPDATE:** `UPDATE tabelle SET spalte = wert WHERE …;` – erst mit SELECT zielen, dann mit UPDATE ändern (dasselbe WHERE). Rechts vom Gleichheitszeichen darf gerechnet werden: `SET menge_kisten = menge_kisten + 2`. Wer die Schlüssel nicht kennt, holt sie mit einer Unterabfrage: `WHERE lieferung_id IN (SELECT …)`. Ohne WHERE ändert UPDATE **jede** Zeile.',
      '**DELETE und ON DELETE:** `DELETE FROM t WHERE …` entfernt ganze Zeilen (ein Feld leeren = `UPDATE … SET spalte = NULL`). Zeigen Kinder auf die Elternzeile, entscheidet die Tabellendefinition: Standard (NO ACTION/RESTRICT) lehnt das Löschen ab; `ON DELETE CASCADE` löscht die Kinder mit; `ON DELETE SET NULL` setzt den Fremdschlüssel auf NULL (die Spalte muss NULL erlauben). `TRUNCATE TABLE` (nicht in SQLite) leert eine Tabelle als DDL-Befehl und ist meist nicht rücknehmbar; `DROP TABLE` entfernt Daten und Struktur.',
      '**Transaktionen:** `BEGIN;` … `COMMIT;` (alles gilt) oder `ROLLBACK;` (nichts gilt). Ohne BEGIN legt die Datenbank um jeden einzelnen Befehl eine eigene Transaktion (Autocommit) – deshalb gilt ein Befehl immer ganz oder gar nicht. `SAVEPOINT name;` setzt eine Marke, `ROLLBACK TO name;` nimmt nur alles danach zurück (die Transaktion bleibt offen), `RELEASE name;` vergisst die Marke. Regel für den Betrieb: BEGIN, Änderung, mit SELECT kontrollieren, dann COMMIT oder ROLLBACK.',
      '**ACID:** **A**tomarität (alles oder nichts), **C**onsistency/Konsistenz (vorher und nachher sind alle Regeln erfüllt), **I**solation (parallele Transaktionen stören sich nicht), **D**auerhaftigkeit (nach COMMIT übersteht die Änderung auch einen Stromausfall).',
      '**Isolation und Lost Update:** Lesen zwei Sitzungen denselben Bestand (40), rechnen getrennt (40 − 2, 40 − 5) und schreiben nacheinander 38 und 35, ist die erste Änderung verloren – **Lost Update**. Abhilfe: in einem Befehl rechnen lassen (`SET menge = menge - 2`) oder die Zeile sperren (`SELECT … FOR UPDATE`). Isolationsstufen: READ UNCOMMITTED (alles möglich), READ COMMITTED (verhindert Dirty Read), REPEATABLE READ (verhindert zusätzlich Non-Repeatable Read), SERIALIZABLE (verhindert auch Phantom Read). Je höher, desto sicherer und desto weniger Gleichzeitigkeit.',
      '**Abgleich zweier Zahlenwerke (Einsatz 512-004):** Frachtbrief (positionen) gegen Bestandsliste (eigene Tabelle) per **LEFT JOIN** – auch Waren, die im Bestand ganz fehlen, bleiben erhalten. `COALESCE(wert, 0)` liefert den ersten Wert, der nicht NULL ist, und macht aus „fehlt“ eine rechenbare 0. Befunde schreibt man mit INSERT … SELECT in eine Tabelle, statt Zahlen abzutippen.',
    ],
    terms: [
      { term: 'DML / DDL / TCL', definition: 'Daten ändern / Struktur ändern / Transaktionen steuern.' },
      { term: 'Transaktion', definition: 'Folge von Befehlen, die ganz oder gar nicht gilt.' },
      { term: 'Autocommit', definition: 'Ohne BEGIN ist jeder einzelne Befehl seine eigene Transaktion.' },
      { term: 'SAVEPOINT', definition: 'Marke innerhalb einer Transaktion für ein teilweises ROLLBACK.' },
      { term: 'COALESCE(a, b)', definition: 'Liefert a, falls nicht NULL, sonst b.' },
      { term: 'Lost Update', definition: 'Eine Änderung geht verloren, weil zwei Sitzungen auf Basis desselben alten Werts schreiben.' },
    ],
    example: {
      db: 'lieferdb',
      tables: [{ label: 'Welche Lieferung hat noch keine Positionen?', sql: 'SELECT l.lieferung_id, l.ankunft, s.name AS schiff,\n       COUNT(p.ware_id) AS positionen\nFROM lieferungen AS l\nJOIN schiffe AS s ON s.schiff_id = l.schiff_id\nLEFT JOIN positionen AS p ON p.lieferung_id = l.lieferung_id\nGROUP BY l.lieferung_id;' }],
      sql: "BEGIN;\n\nUPDATE positionen\nSET menge_kisten = 1;          -- der Unfall: WHERE vergessen\n\nSELECT SUM(menge_kisten) AS summe_im_unfall FROM positionen;\n\nROLLBACK;                      -- das Netz greift\n\nSELECT SUM(menge_kisten) AS summe_danach FROM positionen;",
      note: 'Das Beispiel zeigt zwei Ergebnisse nacheinander; angezeigt wird hier das letzte: Nach ROLLBACK ist die ursprüngliche Summe wieder da. Probiere es in der Sandbox Schritt für Schritt aus – dort siehst du auch die Summe im Unfall (14).',
    },
    steps: [
      { code: 'BEGIN;', text: 'Das Netz aufspannen: Ab hier gilt nichts endgültig.' },
      { code: 'UPDATE positionen SET menge_kisten = 1;', text: 'Ohne WHERE: alle 14 Positionen werden geändert.' },
      { code: 'SELECT SUM(…)', text: 'Kontrolle innerhalb der Transaktion: Der Bestand ist zerstört.' },
      { code: 'ROLLBACK;', text: 'Alles seit BEGIN wird zurückgenommen.' },
      { code: 'SELECT SUM(…)', text: 'Die Summe stimmt wieder – niemand außerhalb hat den Unfall gesehen.' },
    ],
    extraSections: [
      {
        title: 'ON DELETE in Aktion: Löschen wird verweigert',
        paragraphs: ['Auf Lieferung 1 zeigen Positionen. Ohne ON-DELETE-Regel (Standard: RESTRICT bzw. NO ACTION) lehnt die Datenbank das Löschen ab.'],
        db: 'lieferdb',
        sql: 'DELETE FROM lieferungen WHERE lieferung_id = 1;',
        expectError: true,
      },
      {
        title: 'Abgleich mit LEFT JOIN und COALESCE',
        paragraphs: [
          'Der Frachtbrief der Lieferung 4 nennt Mehl, Kaffee und Tiefkühlware. Angenommen, die Station hat nur Mehl (10) und Kaffee (3) gezählt. Der LEFT JOIN behält die Tiefkühlware, COALESCE macht aus dem fehlenden Bestand eine 0.',
        ],
        db: 'lieferdb',
        sql: "CREATE TABLE zaehlung_l4 (\n  ware_id      INTEGER PRIMARY KEY REFERENCES waren(ware_id),\n  menge_kisten INTEGER NOT NULL CHECK (menge_kisten >= 0)\n) STRICT;\nINSERT INTO zaehlung_l4 (ware_id, menge_kisten) VALUES (2, 10), (3, 3);\n\nSELECT w.bezeichnung,\n       p.menge_kisten AS frachtbrief,\n       z.menge_kisten AS gezaehlt,\n       p.menge_kisten - COALESCE(z.menge_kisten, 0) AS differenz\nFROM positionen AS p\nJOIN waren AS w ON w.ware_id = p.ware_id\nLEFT JOIN zaehlung_l4 AS z ON z.ware_id = p.ware_id\nWHERE p.lieferung_id = 4\nORDER BY differenz DESC;",
      },
      {
        title: 'Prüfungsecke: Lost Update auf Papier',
        paragraphs: [
          '- Zeitpunkt 1: Sitzung A liest den Bestand 40\n- Zeitpunkt 2: Sitzung B liest ebenfalls 40\n- Zeitpunkt 3: A schreibt 40 − 2 = 38 → Bestand 38\n- Zeitpunkt 4: B schreibt 40 − 5 = 35 → Bestand 35\n- Ergebnis: 7 Kisten entnommen, Bestand zeigt nur 5 weniger. Die Änderung von A ist verloren.',
          'SQLite kennt keine Isolationsstufen als Schalter: Es lässt nur einen Schreiber zur Zeit zu, Leser sehen immer einen festgeschriebenen Stand – in der Wirkung SERIALIZABLE. Server-Datenbanken nutzen standardmäßig READ COMMITTED (PostgreSQL, Oracle, SQL Server) bzw. REPEATABLE READ (MySQL/InnoDB).',
        ],
      },
    ],
    dialectNotes: [
      'TRUNCATE TABLE gibt es in MySQL, PostgreSQL, Oracle und SQL Server, nicht in SQLite (dort `DELETE FROM t;`).',
      'Transaktionen starten: SQLite/PostgreSQL `BEGIN;`, MySQL `START TRANSACTION;`, SQL Server `BEGIN TRANSACTION;`.',
      'Zeilen sperren: `SELECT … FOR UPDATE` in PostgreSQL, Oracle und MySQL; SQLite sperrt die ganze Datenbank beim Schreiben.',
      'Bei Fremdschlüsselfehlern nennt PostgreSQL die betroffene Spalte und den Wert, SQLite nur die verletzte Regel.',
    ],
    summary: {
      merksatz: 'Erst mit SELECT zielen, dann ändern – und bei echten Daten immer im Netz: BEGIN, ändern, kontrollieren, COMMIT oder ROLLBACK.',
      fehler: [
        'INSERT ohne Spaltenliste – bricht, sobald sich die Tabelle ändert.',
        'Kinder vor der Elternzeile einfügen (Fremdschlüsselfehler).',
        'INSERT … SELECT mit `SELECT *` in eine Tabelle mit eigenem Nummernkreis (doppelte IDs).',
        'UPDATE oder DELETE ohne WHERE.',
        'Annehmen, ROLLBACK helfe nach einem Befehl ohne BEGIN – im Autocommit ist alles schon festgeschrieben.',
        'ON DELETE SET NULL auf einer NOT-NULL-Spalte.',
        'Werte im Kopf rechnen und zurückschreiben (Lost Update) statt `SET x = x - 2`.',
      ],
    },
  },
];
