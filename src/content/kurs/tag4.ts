import type { Exercise } from '../types';
import { q, state, structureOf } from '../exercises/helpers';

/** Bestandsliste der Station Sturmvogel zu Lieferung 2 – Ausgangspunkt für den Übungsfall (parallel zu Einsatz 512-004) */
const KONTROLLE_L2 =
  "CREATE TABLE kontrolle_l2 (\n  ware_id      INTEGER PRIMARY KEY REFERENCES waren(ware_id),\n  menge_kisten INTEGER NOT NULL CHECK (menge_kisten >= 0)\n) STRICT;\n\nINSERT INTO kontrolle_l2 (ware_id, menge_kisten) VALUES (1, 50);";

const POS = { label: 'Tabelle positionen', sql: 'SELECT * FROM positionen ORDER BY lieferung_id, ware_id;' };

/** Unterricht Tag 4: Daten ändern (parallel zu Pinguin-Labor Tag 4 und Einsatz 512-004) */
export const exercisesTag4: Exercise[] = [
  {
    id: 'k04-g1',
    lessonId: 'k04',
    guided: true,
    type: 'write',
    difficulty: 1,
    db: 'lieferdb',
    title: 'Zwei neue Waren in einem Befehl',
    prompt:
      'Die Station hat **Frischobst** und **Trinkwasser** (in Liter) nachgefordert. Lege beide Waren mit **einem** INSERT an.\n\n- Gib die Spaltenliste an.\n- Lass die `ware_id` weg – SQLite vergibt sie selbst.\n- Beim Frischobst soll der Standardwert der Einheit (kg) greifen: Nenne dort keine Einheit.\n\nTipp: Weil eine Spalte für eine Zeile wegfällt, brauchst du hier zwei getrennte INSERT-Befehle **oder** du gibst bei beiden die Einheit an – mit `\'kg\'` beim Frischobst. Beides wird akzeptiert.',
    hints: [
      'INSERT INTO tabelle (spalten) VALUES (…), (…); legt mehrere Zeilen an.',
      "Werteblöcke mit Komma trennen: `VALUES ('Frischobst', 'kg'), ('Trinkwasser', 'Liter')`.",
      "INSERT INTO waren (bezeichnung, einheit) VALUES\n  ('___', 'kg'),\n  ('___', '___');",
    ],
    solution: "INSERT INTO waren (bezeichnung, einheit) VALUES\n  ('Frischobst', 'kg'),\n  ('Trinkwasser', 'Liter');",
    solutionExplanation:
      "Ein Befehl, zwei Zeilen – und beide gelten nur gemeinsam. Die `ware_id` vergibt SQLite (6 und 7), weil sie INTEGER PRIMARY KEY ist. Wer `INSERT INTO waren (bezeichnung) VALUES ('Frischobst');` schreibt, bekommt über DEFAULT ebenfalls 'kg'.",
    check: state({ stateQueries: [{ label: 'Tabelle waren', sql: 'SELECT bezeichnung, einheit FROM waren ORDER BY bezeichnung;' }] }),
    concepts: ['INSERT'],
    tests: {
      accept: ["INSERT INTO waren (bezeichnung) VALUES ('Frischobst'); INSERT INTO waren (bezeichnung, einheit) VALUES ('Trinkwasser', 'Liter');"],
      reject: ["INSERT INTO waren (bezeichnung) VALUES ('Frischobst'), ('Trinkwasser');"],
    },
  },
  {
    id: 'k04-c1',
    lessonId: 'k04',
    type: 'choice',
    difficulty: 1,
    db: 'lieferdb',
    title: 'Welche Befehlsgruppe?',
    prompt: 'Zu welcher Gruppe gehören `BEGIN`, `COMMIT`, `ROLLBACK` und `SAVEPOINT`?',
    hints: ['DQL liest, DDL baut, DML ändert Inhalte …', 'Diese Befehle bündeln andere Befehle.', 'T wie Transaktion.'],
    choices: {
      options: ['DDL – Data Definition Language', 'DML – Data Manipulation Language', 'TCL – Transaction Control Language', 'DCL – Data Control Language'],
      correct: 2,
      explanation: 'TCL steuert Transaktionen. DDL: CREATE, ALTER, DROP. DML: INSERT, UPDATE, DELETE. DCL: GRANT, REVOKE (Rechte, Tag 6). DQL: SELECT.',
    },
    solution: '–',
    solutionExplanation: 'TCL.',
    concepts: ['Transaktionen'],
  },
  {
    id: 'k04-c2',
    lessonId: 'k04',
    type: 'choice',
    difficulty: 2,
    db: 'lieferdb',
    title: 'Leeren, löschen, abreißen',
    prompt: 'Welcher Befehl leert eine Tabelle vollständig, gehört zur **DDL** und lässt sich in den meisten Datenbanken **nicht** zurücknehmen?',
    hints: ['DELETE ist DML.', 'DROP entfernt auch die Struktur.', 'SQLite kennt ihn nicht, MySQL, PostgreSQL und SQL Server schon.'],
    choices: {
      options: ['DELETE FROM positionen;', 'TRUNCATE TABLE positionen;', 'DROP TABLE positionen;', 'UPDATE positionen SET menge_kisten = NULL;'],
      correct: 1,
      explanation:
        'TRUNCATE leert die Tabelle schnell, die Struktur bleibt; er zählt zur DDL und ist meist nicht rücknehmbar. `DELETE FROM t;` (DML) entfernt ebenfalls alle Zeilen, lässt sich aber in einer Transaktion zurücknehmen. DROP entfernt Daten und Tabelle. Das UPDATE würde hier am NOT NULL scheitern.',
    },
    solution: '–',
    solutionExplanation: 'TRUNCATE TABLE – DDL, meist nicht rücknehmbar.',
    concepts: ['DELETE'],
  },
  {
    id: 'k04-e1',
    lessonId: 'k04',
    type: 'write',
    difficulty: 2,
    db: 'lieferdb',
    title: 'Eine neue Lieferung buchen',
    prompt:
      'Die **MS Albatros** (schiff_id 1) kommt am **2026-03-10** an **Station Eisvogel** (station_id 2) an. Lege die Lieferung mit der Nummer **7** an und buche ihren Frachtbrief: **Diesel 25**, **Mehl 5**, **Kaffee 2** Kisten.\n\nAchte auf die Reihenfolge der Befehle.',
    hints: [
      'Zwei Tabellen sind betroffen. Welche muss zuerst gefüllt werden, damit der Fremdschlüssel nicht greift?',
      'Erst die Elternzeile in `lieferungen`, dann die Kinder in `positionen` (ware_id: Diesel 1, Mehl 2, Kaffee 3).',
      "INSERT INTO lieferungen (lieferung_id, ankunft, schiff_id, station_id)\nVALUES (7, '___', ___, ___);\n\nINSERT INTO positionen (lieferung_id, ware_id, menge_kisten) VALUES\n  (7, 1, ___),\n  (7, 2, ___),\n  (7, 3, ___);",
    ],
    solution:
      "INSERT INTO lieferungen (lieferung_id, ankunft, schiff_id, station_id)\nVALUES (7, '2026-03-10', 1, 2);\n\nINSERT INTO positionen (lieferung_id, ware_id, menge_kisten) VALUES\n  (7, 1, 25),\n  (7, 2, 5),\n  (7, 3, 2);",
    solutionExplanation:
      'Positionen verweisen auf die Lieferung. Gibt es Lieferung 7 noch nicht, meldet SQLite `FOREIGN KEY constraint failed`. Deshalb: Elternzeile zuerst. Bei echten Daten würde man beide Befehle in eine Transaktion (BEGIN … COMMIT) setzen, damit nie eine Lieferung ohne Positionen übrig bleibt.',
    check: state({ stateQueries: [{ label: 'Tabelle lieferungen', sql: 'SELECT * FROM lieferungen ORDER BY lieferung_id;' }, POS] }),
    concepts: ['INSERT', 'Fremdschlüssel'],
    tests: {
      accept: ["BEGIN; INSERT INTO lieferungen VALUES (7, '2026-03-10', 1, 2); INSERT INTO positionen VALUES (7, 3, 2), (7, 2, 5), (7, 1, 25); COMMIT;"],
      reject: ["INSERT INTO lieferungen (lieferung_id, ankunft, schiff_id, station_id) VALUES (7, '10.03.2026', 1, 2);"],
    },
  },
  {
    id: 'k04-e2',
    lessonId: 'k04',
    type: 'predict',
    difficulty: 2,
    db: 'lieferdb',
    title: 'Wie viele Zeilen?',
    prompt:
      'An Station CBW (station_id 1) gingen die Lieferungen 1, 4, 5 und 6. Lieferung 5 hat noch keine Positionen, die anderen je drei. Wie viele Zeilen ändert dieser Befehl?',
    starterSql: 'UPDATE positionen\nSET menge_kisten = menge_kisten + 1\nWHERE lieferung_id IN (\n  SELECT lieferung_id\n  FROM lieferungen\n  WHERE station_id = 1\n);',
    hints: ['Geändert werden Zeilen in positionen, nicht in lieferungen.', 'Welche Lieferungen liefert die Unterabfrage?', '3 + 3 + 0 + 3'],
    choices: {
      options: ['4 Zeilen', '9 Zeilen', '12 Zeilen', '14 Zeilen'],
      correct: 1,
      explanation:
        'Die Unterabfrage liefert die Lieferungen 1, 4, 5 und 6. Davon haben 1, 4 und 6 je drei Positionen, Lieferung 5 keine – 9 Zeilen. Die Zahl in der Rückmeldung nach einem UPDATE ist deine Kontrolle: Erwartet hattest du sie vorher mit einem SELECT mit demselben WHERE.',
    },
    solution: 'UPDATE positionen\nSET menge_kisten = menge_kisten + 1\nWHERE lieferung_id IN (\n  SELECT lieferung_id\n  FROM lieferungen\n  WHERE station_id = 1\n);',
    solutionExplanation: '9 Zeilen.',
    concepts: ['UPDATE', 'Unterabfragen'],
  },
  {
    id: 'k04-e3',
    lessonId: 'k04',
    type: 'write',
    difficulty: 1,
    db: 'lieferdb',
    title: 'Eine Korrektur',
    prompt: 'Die Leitstelle meldet: In **Lieferung 3** waren es nicht 8, sondern **10 Kisten Mehl** (ware_id 2). Korrigiere genau diese eine Position.',
    hints: ['Erst mit SELECT zielen, dann mit UPDATE ändern – dasselbe WHERE.', 'Die Position ist durch das Paar (lieferung_id, ware_id) eindeutig.', 'UPDATE positionen\nSET menge_kisten = ___\nWHERE lieferung_id = ___ AND ware_id = ___;'],
    solution: 'UPDATE positionen\nSET menge_kisten = 10\nWHERE lieferung_id = 3 AND ware_id = 2;',
    solutionExplanation: 'Der zusammengesetzte Schlüssel bestimmt genau eine Zeile. Fehlt eine der beiden Bedingungen, ändert der Befehl zu viel – z. B. alles Mehl in allen Lieferungen.',
    check: state({ stateQueries: [POS] }),
    concepts: ['UPDATE', 'UPDATE/DELETE ohne WHERE'],
    tests: {
      accept: ['UPDATE positionen SET menge_kisten = menge_kisten + 2 WHERE lieferung_id = 3 AND ware_id = 2;'],
      reject: ['UPDATE positionen SET menge_kisten = 10 WHERE ware_id = 2;', 'UPDATE positionen SET menge_kisten = 10 WHERE lieferung_id = 3;'],
    },
  },
  {
    id: 'k04-e4',
    lessonId: 'k04',
    type: 'write',
    difficulty: 3,
    db: 'lieferdb',
    title: 'Nachlieferung Diesel für Station CBW',
    prompt:
      'Für **alle Lieferungen an Station CBW** wird beim **Diesel** nachträglich je **5 Kisten** mehr verbucht. Schreibe **einen** UPDATE-Befehl. Die IDs sollst du **nicht** selbst nachschlagen – die Ware findest du über ihre Bezeichnung, die Lieferungen über den Namen der Station.',
    hints: [
      'Zwei Bedingungen: die richtige Ware und die richtigen Lieferungen. Beide Schlüssel holt je eine Unterabfrage.',
      "`ware_id = (SELECT ware_id FROM waren WHERE bezeichnung = 'Diesel')` und `lieferung_id IN (SELECT … FROM lieferungen JOIN stationen … WHERE name = 'Station CBW')`.",
      "UPDATE positionen\nSET menge_kisten = menge_kisten + 5\nWHERE ware_id = (SELECT ware_id FROM waren WHERE bezeichnung = '___')\n  AND lieferung_id IN (\n    SELECT l.lieferung_id\n    FROM lieferungen AS l\n    JOIN stationen AS s ON ___\n    WHERE s.name = '___'\n  );",
    ],
    solution:
      "UPDATE positionen\nSET menge_kisten = menge_kisten + 5\nWHERE ware_id = (SELECT ware_id FROM waren WHERE bezeichnung = 'Diesel')\n  AND lieferung_id IN (\n    SELECT l.lieferung_id\n    FROM lieferungen AS l\n    JOIN stationen AS s ON s.station_id = l.station_id\n    WHERE s.name = 'Station CBW'\n  );",
    solutionExplanation:
      'Die Technik aus Tag 1 (Unterabfragen) – nur in einem UPDATE statt einem SELECT. Betroffen sind die Diesel-Positionen der Lieferungen 1 und 6. Mit fest eingetragenen IDs wäre der Befehl falsch, sobald eine neue Lieferung an CBW hinzukommt.',
    check: state({
      stateQueries: [POS],
      variants: [{ description: 'Eine zusätzliche Lieferung 7 an Station CBW mit 20 Kisten Diesel.', setup: "INSERT INTO lieferungen VALUES (7, '2026-03-20', 2, 1); INSERT INTO positionen VALUES (7, 1, 20);" }],
    }),
    concepts: ['UPDATE', 'Unterabfragen'],
    tests: {
      accept: ["UPDATE positionen SET menge_kisten = menge_kisten + 5 WHERE ware_id IN (SELECT ware_id FROM waren WHERE bezeichnung = 'Diesel') AND lieferung_id IN (SELECT lieferung_id FROM lieferungen WHERE station_id = (SELECT station_id FROM stationen WHERE name = 'Station CBW'));"],
      reject: ['UPDATE positionen SET menge_kisten = menge_kisten + 5 WHERE ware_id = 1 AND lieferung_id IN (1, 6);', "UPDATE positionen SET menge_kisten = menge_kisten + 5 WHERE ware_id = (SELECT ware_id FROM waren WHERE bezeichnung = 'Diesel');"],
    },
  },
  {
    id: 'k04-e5',
    lessonId: 'k04',
    type: 'write',
    difficulty: 2,
    db: 'lieferdb',
    title: 'INSERT … SELECT: das Archiv 2025',
    prompt:
      'Die Archivtabelle ist im Startcode schon vorbereitet. Übernimm mit **einem** `INSERT … SELECT` alle Lieferungen, deren Ankunft **im Jahr 2025** liegt. Die Lieferungen selbst bleiben unverändert.',
    starterSql:
      "CREATE TABLE archiv_2025 (\n  lieferung_id INTEGER PRIMARY KEY,\n  ankunft      TEXT    NOT NULL,\n  schiff_id    INTEGER NOT NULL,\n  station_id   INTEGER NOT NULL\n) STRICT;\n\n-- Dein INSERT … SELECT:\n",
    hints: [
      'Statt VALUES steht hinter INSERT INTO eine Abfrage.',
      "Die Spalten der Abfrage müssen in Anzahl und Reihenfolge zur Spaltenliste passen. Jahr 2025: `ankunft LIKE '2025-%'` oder ein Bereich.",
      "INSERT INTO archiv_2025 (lieferung_id, ankunft, schiff_id, station_id)\nSELECT lieferung_id, ankunft, schiff_id, station_id\nFROM lieferungen\nWHERE ___;",
    ],
    solution:
      "CREATE TABLE archiv_2025 (\n  lieferung_id INTEGER PRIMARY KEY,\n  ankunft      TEXT    NOT NULL,\n  schiff_id    INTEGER NOT NULL,\n  station_id   INTEGER NOT NULL\n) STRICT;\n\nINSERT INTO archiv_2025 (lieferung_id, ankunft, schiff_id, station_id)\nSELECT lieferung_id, ankunft, schiff_id, station_id\nFROM lieferungen\nWHERE ankunft LIKE '2025-%';",
    solutionExplanation:
      'INSERT … SELECT ist das Werkzeug für Umzüge und Archive. Hier passen die Nummern, weil das Archiv dieselben IDs übernehmen soll. Hat die Zieltabelle einen eigenen Nummernkreis, lässt man die ID weg – sonst gibt es doppelte Schlüssel (wie bei wiegungen_nachtrag im Kurs). SELECT liest nur: Die Quelltabelle bleibt unverändert.',
    check: state({
      stateQueries: [{ label: 'Tabelle archiv_2025', sql: 'SELECT * FROM archiv_2025 ORDER BY lieferung_id;' }, { label: 'Tabelle lieferungen', sql: 'SELECT * FROM lieferungen ORDER BY lieferung_id;' }],
      variants: [{ description: 'Eine zusätzliche Lieferung vom 30.12.2025.', setup: "INSERT INTO lieferungen VALUES (7, '2025-12-30', 3, 2);" }],
    }),
    concepts: ['INSERT', 'INSERT … SELECT'],
    tests: {
      accept: ["CREATE TABLE archiv_2025 (lieferung_id INTEGER PRIMARY KEY, ankunft TEXT NOT NULL, schiff_id INTEGER NOT NULL, station_id INTEGER NOT NULL) STRICT; INSERT INTO archiv_2025 SELECT * FROM lieferungen WHERE strftime('%Y', ankunft) = '2025';"],
      reject: [
        "CREATE TABLE archiv_2025 (lieferung_id INTEGER PRIMARY KEY, ankunft TEXT NOT NULL, schiff_id INTEGER NOT NULL, station_id INTEGER NOT NULL) STRICT; INSERT INTO archiv_2025 SELECT * FROM lieferungen WHERE lieferung_id IN (1, 2, 3);",
        "CREATE TABLE archiv_2025 (lieferung_id INTEGER PRIMARY KEY, ankunft TEXT NOT NULL, schiff_id INTEGER NOT NULL, station_id INTEGER NOT NULL) STRICT; INSERT INTO archiv_2025 SELECT * FROM lieferungen WHERE ankunft LIKE '2025-%'; DELETE FROM lieferungen WHERE ankunft LIKE '2025-%' AND lieferung_id NOT IN (SELECT lieferung_id FROM positionen);",
      ],
    },
  },
  {
    id: 'k04-e6',
    lessonId: 'k04',
    type: 'write',
    difficulty: 3,
    db: 'lieferdb',
    title: 'ON DELETE CASCADE: Notizen zu Lieferungen',
    prompt:
      'Zu Lieferungen sollen Notizen gespeichert werden. Wird eine Lieferung gelöscht, sollen ihre Notizen **automatisch mitgelöscht** werden. Lege die STRICT-Tabelle `notizen` an:\n\n- `notiz_id`: ganze Zahl, Primärschlüssel\n- `lieferung_id`: ganze Zahl, Pflicht, Fremdschlüssel auf `lieferungen` – mit der passenden ON-DELETE-Regel\n- `text`: Text, Pflicht',
    hints: [
      'Die ON-DELETE-Regel steht direkt hinter REFERENCES.',
      'Mitlöschen heißt CASCADE.',
      'CREATE TABLE notizen (\n  notiz_id     INTEGER PRIMARY KEY,\n  lieferung_id INTEGER NOT NULL REFERENCES lieferungen(lieferung_id) ON DELETE ___,\n  text         TEXT    NOT NULL\n) STRICT;',
    ],
    solution: 'CREATE TABLE notizen (\n  notiz_id     INTEGER PRIMARY KEY,\n  lieferung_id INTEGER NOT NULL REFERENCES lieferungen(lieferung_id) ON DELETE CASCADE,\n  text         TEXT    NOT NULL\n) STRICT;',
    solutionExplanation:
      'Ohne Regel (NO ACTION/RESTRICT) würde das Löschen einer Lieferung mit Notizen abgelehnt. CASCADE löscht die Notizen mit – sinnvoll für Teile, die ohne das Ganze bedeutungslos sind. Für Belege wie Positionen ist RESTRICT meist die bessere Wahl: CASCADE räumt über mehrere Stufen ganze Bäume ab, ohne dass man es dem DELETE ansieht.',
    check: state({
      stateQueries: [structureOf('notizen')],
      probes: [
        { label: 'Notiz zu Lieferung 5 anlegen, Lieferung 5 löschen', sql: "INSERT INTO notizen (notiz_id, lieferung_id, text) VALUES (1, 5, 'Positionsliste fehlt');\nDELETE FROM lieferungen WHERE lieferung_id = 5;\nSELECT COUNT(*) AS restliche_notizen FROM notizen;", expectError: false, hint: 'Beim Löschen der Lieferung sollen ihre Notizen mitgelöscht werden. Fehlt `ON DELETE CASCADE`?' },
        { label: 'Notiz ohne Lieferung', sql: "INSERT INTO notizen (notiz_id, text) VALUES (2, 'lose Notiz');", expectError: true, hint: 'Fehlt `NOT NULL` bei lieferung_id?' },
        { label: 'Notiz zu unbekannter Lieferung', sql: "INSERT INTO notizen (notiz_id, lieferung_id, text) VALUES (3, 99, 'x');", expectError: true, hint: 'Fehlt `REFERENCES lieferungen(lieferung_id)`?' },
      ],
    }),
    concepts: ['Fremdschlüssel', 'DELETE', 'CREATE TABLE'],
    tests: {
      reject: [
        'CREATE TABLE notizen (notiz_id INTEGER PRIMARY KEY, lieferung_id INTEGER NOT NULL REFERENCES lieferungen(lieferung_id), text TEXT NOT NULL) STRICT;',
        'CREATE TABLE notizen (notiz_id INTEGER PRIMARY KEY, lieferung_id INTEGER REFERENCES lieferungen(lieferung_id) ON DELETE SET NULL, text TEXT NOT NULL) STRICT;',
      ],
    },
  },
  {
    id: 'k04-c3',
    lessonId: 'k04',
    type: 'choice',
    difficulty: 2,
    db: 'lieferdb',
    title: 'ON DELETE SET NULL',
    prompt: 'Eine Tabelle `geraete` hat `station_id INTEGER REFERENCES stationen(station_id) ON DELETE SET NULL`. Was passiert beim Löschen einer Station – und was muss für die Spalte gelten?',
    hints: ['SET NULL setzt den Verweis auf NULL.', 'Was passiert, wenn die Spalte NULL verbietet?', 'Die Kinder bleiben erhalten.'],
    choices: {
      options: [
        'Die Geräte werden mitgelöscht; die Spalte muss NOT NULL sein',
        'Die Geräte bleiben, station_id wird NULL; die Spalte darf kein NOT NULL haben',
        'Das Löschen wird immer abgelehnt',
        'station_id wird auf 0 gesetzt',
      ],
      correct: 1,
      explanation:
        'SET NULL behält die Kinder und löst nur die Zuordnung. Das geht nur, wenn die Spalte NULL erlaubt – mit NOT NULL würde das Löschen scheitern. Passend für lose Zuordnungen (ein Gerät kann vorübergehend keiner Station gehören).',
    },
    solution: '–',
    solutionExplanation: 'Kinder bleiben, Verweis wird NULL – Spalte muss NULL erlauben.',
    concepts: ['Fremdschlüssel', 'DELETE'],
  },
  {
    id: 'k04-e7',
    lessonId: 'k04',
    type: 'predict',
    difficulty: 2,
    db: 'lieferdb',
    title: 'Das vergessene WHERE, gerettet',
    prompt: 'Die Positionen enthalten zusammen 246 Kisten. Was liefert die letzte Abfrage?',
    starterSql: 'BEGIN;\nUPDATE positionen SET menge_kisten = 1;\nROLLBACK;\nSELECT SUM(menge_kisten) AS summe FROM positionen;',
    hints: ['Was nimmt ROLLBACK zurück?', 'Alles seit BEGIN.', 'Innerhalb der Transaktion wäre die Summe 14 gewesen.'],
    choices: {
      options: ['14', '246', '0', 'Fehlermeldung'],
      correct: 1,
      explanation: 'ROLLBACK nimmt alles seit BEGIN zurück – der Bestand ist wieder bei 246. Ohne BEGIN wäre das UPDATE sofort festgeschrieben (Autocommit) und ROLLBACK würde mit „no transaction is active“ ins Leere laufen.',
    },
    solution: 'BEGIN;\nUPDATE positionen SET menge_kisten = 1;\nROLLBACK;\nSELECT SUM(menge_kisten) AS summe FROM positionen;',
    solutionExplanation: '246 – das Netz hat gehalten.',
    concepts: ['Transaktionen'],
  },
  {
    id: 'k04-e8',
    lessonId: 'k04',
    type: 'predict',
    difficulty: 3,
    db: 'lieferdb',
    title: 'SAVEPOINT',
    prompt: 'Im Warenstamm stehen 5 Waren. Wie viele sind es nach diesem Ablauf?',
    starterSql:
      "BEGIN;\nINSERT INTO waren (bezeichnung) VALUES ('Streusalz');\nSAVEPOINT nach_streusalz;\nINSERT INTO waren (bezeichnung) VALUES ('Schneeschaufel');\nROLLBACK TO nach_streusalz;\nCOMMIT;\nSELECT COUNT(*) AS waren FROM waren;",
    hints: ['ROLLBACK TO nimmt nur zurück, was nach der Marke kam.', 'Die Transaktion bleibt nach ROLLBACK TO offen.', 'COMMIT schreibt fest, was übrig ist.'],
    choices: {
      options: ['5', '6', '7', 'Fehlermeldung'],
      correct: 1,
      explanation: 'Das Streusalz lag vor der Marke und bleibt, die Schneeschaufel wird zurückgenommen. COMMIT schreibt das Streusalz fest: 6 Waren. (Führst du die Abfrage ein zweites Mal aus, scheitert sie am UNIQUE des Streusalzes – dann die Datenbank zurücksetzen.)',
    },
    solution: "BEGIN;\nINSERT INTO waren (bezeichnung) VALUES ('Streusalz');\nSAVEPOINT nach_streusalz;\nINSERT INTO waren (bezeichnung) VALUES ('Schneeschaufel');\nROLLBACK TO nach_streusalz;\nCOMMIT;\nSELECT COUNT(*) AS waren FROM waren;",
    solutionExplanation: '6 Waren.',
    concepts: ['Transaktionen'],
  },
  {
    id: 'k04-c4',
    lessonId: 'k04',
    type: 'choice',
    difficulty: 1,
    db: 'lieferdb',
    title: 'ACID',
    prompt: 'Nach `COMMIT` fällt der Strom aus. Nach dem Neustart ist die Buchung trotzdem vorhanden. Welche ACID-Eigenschaft sichert das zu?',
    hints: ['A, C, I, D – welche handelt vom Überleben nach dem Festschreiben?', 'Englisch: Durability.', 'D'],
    choices: {
      options: ['Atomarität', 'Konsistenz', 'Isolation', 'Dauerhaftigkeit'],
      correct: 3,
      explanation: 'Dauerhaftigkeit (Durability): Was mit COMMIT bestätigt wurde, bleibt erhalten. Atomarität = alles oder nichts; Konsistenz = alle Regeln erfüllt; Isolation = parallele Transaktionen stören sich nicht.',
    },
    solution: '–',
    solutionExplanation: 'Dauerhaftigkeit.',
    concepts: ['Transaktionen'],
  },
  {
    id: 'k04-c5',
    lessonId: 'k04',
    type: 'choice',
    difficulty: 3,
    db: 'lieferdb',
    title: 'Lost Update vermeiden',
    prompt:
      'Zwei Forschende entnehmen gleichzeitig Kisten aus derselben Position: A liest 40 und schreibt 38, B liest ebenfalls 40 und schreibt 35. Der Bestand zeigt 35 statt 33. Welcher Befehl verhindert das am einfachsten?',
    hints: ['Das Problem: Beide rechnen mit einem alten, selbst gelesenen Wert.', 'Lass die Datenbank lesen und rechnen – in einem Schritt.', 'Rechts vom Gleichheitszeichen darf die Spalte selbst stehen.'],
    choices: {
      options: [
        'UPDATE positionen SET menge_kisten = 38 WHERE …',
        'UPDATE positionen SET menge_kisten = menge_kisten - 2 WHERE …',
        'Vorher zweimal SELECT ausführen',
        'Die Isolationsstufe READ UNCOMMITTED wählen',
      ],
      correct: 1,
      explanation:
        '`SET menge_kisten = menge_kisten - 2` lässt die Datenbank den aktuellen Wert unter Sperre lesen und ändern – keine Änderung geht verloren. Alternativ sperrt man die Zeile bis zum Ende der Transaktion (`SELECT … FOR UPDATE` in PostgreSQL, Oracle, MySQL). READ UNCOMMITTED macht alles nur schlimmer.',
    },
    solution: '–',
    solutionExplanation: 'In einem Befehl rechnen lassen.',
    concepts: ['Transaktionen'],
  },
  {
    id: 'k04-c6',
    lessonId: 'k04',
    type: 'choice',
    difficulty: 3,
    db: 'lieferdb',
    title: 'Isolationsstufen',
    prompt: 'Welche Isolationsstufe verhindert **Dirty Reads** und **Non-Repeatable Reads**, lässt aber **Phantom Reads** noch zu?',
    hints: ['Die Stufen von schwach nach stark: READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, SERIALIZABLE.', 'Jede Stufe verhindert ein Phänomen mehr.', 'Erst SERIALIZABLE verhindert auch Phantome.'],
    choices: {
      options: ['READ UNCOMMITTED', 'READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE'],
      correct: 2,
      explanation:
        'REPEATABLE READ: Einmal gelesene Zeilen ändern sich in der Transaktion nicht mehr, neu eingefügte Zeilen („Phantome“) können aber auftauchen. MySQL/InnoDB verwendet diese Stufe standardmäßig, PostgreSQL, Oracle und SQL Server READ COMMITTED.',
    },
    solution: '–',
    solutionExplanation: 'REPEATABLE READ.',
    concepts: ['Transaktionen'],
  },

  /* ---------- Übungsfall parallel zu Einsatz 512-004: Lieferung 2 an Station Sturmvogel ---------- */
  {
    id: 'k04-f1',
    lessonId: 'k04',
    type: 'write',
    difficulty: 2,
    db: 'lieferdb',
    title: 'Übungsfall 1: Die Bestandsliste erfassen',
    prompt:
      '**Übungsfall Station Sturmvogel.** Lieferung 2 (MS Estrella Austral, 2. Dezember 2025) brachte laut Frachtbrief 55 Kisten Diesel und 20 Kisten Tiefkühlware. Die Station hat danach selbst gezählt: **Diesel 50 Kisten**. Tiefkühlware steht **nicht** auf ihrer Liste.\n\nLege die STRICT-Tabelle `kontrolle_l2` an – `ware_id` (Primärschlüssel und Fremdschlüssel auf `waren`), `menge_kisten` (Pflicht, nicht negativ) – und trage die Bestandsliste ein. Was nicht auf der Liste steht, kommt nicht in die Tabelle.',
    hints: [
      'Wie die Tabelle kontrollbestand im Einsatz: ein Primärschlüssel, der zugleich Fremdschlüssel ist.',
      '`ware_id INTEGER PRIMARY KEY REFERENCES waren(ware_id)`, `menge_kisten INTEGER NOT NULL CHECK (menge_kisten >= 0)`. Diesel hat die ware_id 1.',
      'CREATE TABLE kontrolle_l2 (\n  ware_id      INTEGER PRIMARY KEY REFERENCES ___(___),\n  menge_kisten INTEGER NOT NULL CHECK (___)\n) STRICT;\n\nINSERT INTO kontrolle_l2 (ware_id, menge_kisten) VALUES (___, ___);',
    ],
    solution: KONTROLLE_L2,
    solutionExplanation:
      'Die Liste wird genau so erfasst, wie sie ist – auch das Fehlen der Tiefkühlware ist ein Befund. Würde man „Tiefkühlware 0“ eintragen, ginge die Information verloren, dass sie gar nicht gezählt wurde.',
    check: state({
      stateQueries: [structureOf('kontrolle_l2'), { label: 'Inhalt von kontrolle_l2', sql: 'SELECT * FROM kontrolle_l2 ORDER BY ware_id;' }],
      probes: [
        { label: 'unbekannte Ware', sql: 'INSERT INTO kontrolle_l2 (ware_id, menge_kisten) VALUES (99, 1);', expectError: true, hint: 'Fehlt der Fremdschlüssel auf waren?' },
        { label: 'negative Menge', sql: 'INSERT INTO kontrolle_l2 (ware_id, menge_kisten) VALUES (4, -1);', expectError: true, hint: 'Fehlt `CHECK (menge_kisten >= 0)`?' },
      ],
    }),
    concepts: ['CREATE TABLE', 'INSERT'],
    tests: { reject: [KONTROLLE_L2.replace('(1, 50)', '(1, 50), (4, 0)')] },
  },
  {
    id: 'k04-f2',
    lessonId: 'k04',
    type: 'write',
    difficulty: 3,
    db: 'lieferdb',
    title: 'Übungsfall 2: Der Abgleich',
    prompt:
      'Die Bestandsliste ist im Startcode schon angelegt. Gleiche sie mit dem Frachtbrief von **Lieferung 2** ab: Zeige `bezeichnung`, `frachtbrief` (Kisten laut Positionen), `bestand` (laut Liste, NULL wenn nicht gezählt) und `differenz` (frachtbrief minus bestand, fehlender Bestand zählt als 0). Größte Differenz zuerst.\n\n**Spaltennamen und Reihenfolge werden geprüft.**',
    starterSql: KONTROLLE_L2 + '\n\n-- Dein Abgleich:\n',
    expectedColumns: ['bezeichnung', 'frachtbrief', 'bestand', 'differenz'],
    hints: [
      'Ausgangspunkt sind die Positionen der Lieferung – jede Position soll erscheinen, auch wenn sie im Bestand fehlt.',
      '`LEFT JOIN kontrolle_l2` und `COALESCE(k.menge_kisten, 0)` für die Rechnung.',
      'SELECT w.bezeichnung,\n       p.menge_kisten AS frachtbrief,\n       k.menge_kisten AS bestand,\n       p.menge_kisten - COALESCE(___, 0) AS differenz\nFROM positionen AS p\nJOIN waren AS w ON w.ware_id = p.ware_id\nLEFT JOIN kontrolle_l2 AS k ON ___\nWHERE p.lieferung_id = ___\nORDER BY differenz DESC;',
    ],
    solution:
      KONTROLLE_L2 +
      '\n\nSELECT w.bezeichnung,\n       p.menge_kisten AS frachtbrief,\n       k.menge_kisten AS bestand,\n       p.menge_kisten - COALESCE(k.menge_kisten, 0) AS differenz\nFROM positionen AS p\nJOIN waren AS w ON w.ware_id = p.ware_id\nLEFT JOIN kontrolle_l2 AS k ON k.ware_id = p.ware_id\nWHERE p.lieferung_id = 2\nORDER BY differenz DESC;',
    solutionExplanation:
      'Ergebnis: Tiefkühlware 20 / NULL / 20 und Diesel 55 / 50 / 5. Mit INNER JOIN fiele die Tiefkühlware weg – genau die Ware, die komplett fehlt. Ohne COALESCE wäre ihre Differenz NULL (Rechnen mit NULL ergibt NULL). In Summe fehlen 25 von 75 Kisten.',
    check: q({ columnNames: true, orderMatters: true }),
    concepts: ['LEFT JOIN', 'NULL', 'Analyse'],
    tests: {
      reject: [
        KONTROLLE_L2 + '\nSELECT w.bezeichnung, p.menge_kisten AS frachtbrief, k.menge_kisten AS bestand, p.menge_kisten - k.menge_kisten AS differenz FROM positionen p JOIN waren w ON w.ware_id = p.ware_id LEFT JOIN kontrolle_l2 k ON k.ware_id = p.ware_id WHERE p.lieferung_id = 2 ORDER BY differenz DESC;',
        KONTROLLE_L2 + '\nSELECT w.bezeichnung, p.menge_kisten AS frachtbrief, k.menge_kisten AS bestand, p.menge_kisten - COALESCE(k.menge_kisten, 0) AS differenz FROM positionen p JOIN waren w ON w.ware_id = p.ware_id JOIN kontrolle_l2 k ON k.ware_id = p.ware_id WHERE p.lieferung_id = 2 ORDER BY differenz DESC;',
      ],
    },
  },
  {
    id: 'k04-f3',
    lessonId: 'k04',
    type: 'write',
    difficulty: 3,
    db: 'lieferdb',
    title: 'Übungsfall 3: Den Befund festhalten',
    prompt:
      'Ein Ergebnis auf dem Bildschirm ist kein Befund. Die Tabelle `befunde_l2` ist im Startcode vorbereitet. Fülle sie mit **INSERT … SELECT** direkt aus dem Abgleich: je abweichender Ware eine Zeile mit `ware_id` und `differenz`. Waren ohne Abweichung kommen nicht hinein. Keine Zahlen abtippen!',
    starterSql:
      KONTROLLE_L2 + '\n\nCREATE TABLE befunde_l2 (\n  ware_id   INTEGER PRIMARY KEY REFERENCES waren(ware_id),\n  differenz INTEGER NOT NULL\n) STRICT;\n\n-- Dein INSERT … SELECT:\n',
    hints: [
      'Die Abfrage aus Übungsfall 2 liefert schon alles – nur mit ware_id statt Bezeichnung und ohne Sortierung.',
      'Nur Abweichungen: Die Differenz-Bedingung gehört in WHERE (dort kann man den Alias nicht sicher verwenden – den Ausdruck wiederholen).',
      'INSERT INTO befunde_l2 (ware_id, differenz)\nSELECT p.ware_id,\n       p.menge_kisten - COALESCE(k.menge_kisten, 0)\nFROM positionen AS p\nLEFT JOIN kontrolle_l2 AS k ON k.ware_id = p.ware_id\nWHERE p.lieferung_id = 2\n  AND ___ <> 0;',
    ],
    solution:
      KONTROLLE_L2 +
      '\n\nCREATE TABLE befunde_l2 (\n  ware_id   INTEGER PRIMARY KEY REFERENCES waren(ware_id),\n  differenz INTEGER NOT NULL\n) STRICT;\n\nINSERT INTO befunde_l2 (ware_id, differenz)\nSELECT p.ware_id,\n       p.menge_kisten - COALESCE(k.menge_kisten, 0)\nFROM positionen AS p\nLEFT JOIN kontrolle_l2 AS k ON k.ware_id = p.ware_id\nWHERE p.lieferung_id = 2\n  AND p.menge_kisten - COALESCE(k.menge_kisten, 0) <> 0;',
    solutionExplanation:
      'Aus den Daten gerechnet statt abgetippt – die häufigste Fehlerquelle in einer Akte entfällt. Der Befund (Diesel 5, Tiefkühlware 20) ist jetzt Teil der Datenbank und lässt sich weiterverarbeiten. Variiere zum Test die Zählung in `kontrolle_l2` (z. B. Diesel 55): Dann enthält der Befund nur noch die Tiefkühlware.',
    check: state({
      stateQueries: [{ label: 'Tabelle befunde_l2', sql: 'SELECT * FROM befunde_l2 ORDER BY ware_id;' }],
    }),
    concepts: ['INSERT … SELECT', 'LEFT JOIN', 'NULL'],
    tests: {
      reject: [
        KONTROLLE_L2 + '\nCREATE TABLE befunde_l2 (ware_id INTEGER PRIMARY KEY REFERENCES waren(ware_id), differenz INTEGER NOT NULL) STRICT;\nINSERT INTO befunde_l2 (ware_id, differenz) SELECT p.ware_id, p.menge_kisten - k.menge_kisten FROM positionen p JOIN kontrolle_l2 k ON k.ware_id = p.ware_id WHERE p.lieferung_id = 2 AND p.menge_kisten - k.menge_kisten <> 0;',
      ],
    },
  },
  {
    id: 'k04-f4',
    lessonId: 'k04',
    type: 'explain',
    difficulty: 3,
    db: 'lieferdb',
    title: 'Übungsfall 4: Die Lücke in der Akte',
    prompt:
      'Mit einem einzigen `DELETE FROM positionen WHERE lieferung_id = 2 AND ware_id = 4;` sähe der Frachtbrief von Lieferung 2 plötzlich aus wie die Zählung der Station (ohne Tiefkühlware). Angenommen, so ein Befehl ist wirklich gelaufen: Was müsste eine Datenbank **mitschreiben**, damit man das später noch feststellen kann? Nenne mindestens **zwei Dinge**, die die Lieferdatenbank bisher nicht hat, und wie man sie umsetzen könnte.',
    starterSql: 'BEGIN;\nDELETE FROM positionen WHERE lieferung_id = 2 AND ware_id = 4;\nSELECT SUM(menge_kisten) AS summe_lieferung_2 FROM positionen WHERE lieferung_id = 2;\nROLLBACK;',
    hints: [
      'Führe die Rekonstruktion aus: Was bleibt in der Tabelle von der gelöschten Zeile übrig?',
      'Wer? Wann? Was genau? – und wer durfte das überhaupt?',
      'Stichwörter: Protokoll-/Audittabelle, Trigger, Zeitstempel, Benutzer, Rechte (GRANT/REVOKE), „weiches Löschen“.',
    ],
    modelAnswer:
      'Ein DELETE hinterlässt in der Tabelle **keine Spur** – die Zeile ist weg, die Summe wirkt stimmig. Nachweisbar wird so ein Vorgang nur, wenn die Datenbank mitschreibt:\n\n- **Wer** etwas geändert hat (Benutzer bzw. Rolle) und **wann** (Zeitstempel) – z. B. in einer **Protokoll-/Audittabelle**, die bei jedem INSERT, UPDATE und DELETE automatisch gefüllt wird (in SQL über **Trigger**, in Server-Datenbanken auch über eingebaute Audit-Funktionen).\n- **Was** geändert wurde: der alte und der neue Wert der Zeile (bei DELETE die gelöschte Zeile vollständig).\n- **Rechte**: Nicht jeder darf löschen. Mit **GRANT/REVOKE** (DCL, Tag 6) erhalten z. B. Stationen nur Lese- und Einfügerechte auf Positionen.\n- Alternativ **weiches Löschen**: statt DELETE eine Spalte `geloescht_am` setzen, sodass Datensätze nie verschwinden.\n\nDie Rekonstruktion in einer Transaktion mit ROLLBACK zeigt, was ein Vorgang anrichten würde, ohne Beweise zu verändern.',
    solution: 'BEGIN;\nDELETE FROM positionen WHERE lieferung_id = 2 AND ware_id = 4;\nSELECT SUM(menge_kisten) AS summe_lieferung_2 FROM positionen WHERE lieferung_id = 2;\nROLLBACK;',
    solutionExplanation: 'Siehe Musterantwort.',
    concepts: ['Transaktionen', 'DELETE'],
  },
];
