import type { Exercise } from '../types';
import { indexOn, state, strictOf, structureOf } from '../exercises/helpers';

/** Unterricht Tag 3: Tabellen bauen (parallel zu Pinguin-Labor Tag 3 und Einsatz 512-003) */
export const exercisesTag3: Exercise[] = [
  {
    id: 'k03-g1',
    lessonId: 'k03',
    guided: true,
    type: 'write',
    difficulty: 2,
    db: 'lieferdb',
    title: 'Die Häfen',
    prompt:
      'Die Schiffe laufen verschiedene Häfen an. Lege nach der Bauvorschrift die Tabelle `haefen` an:\n\n- `hafen_id`: ganze Zahl, Primärschlüssel\n- `name`: Text, Pflicht, jeder Name nur einmal\n- `land`: Text, Pflicht, Länderkürzel aus **genau zwei** Zeichen (z. B. CL oder NO)\n- `liegeplaetze`: ganze Zahl, Pflicht, **größer als 0**, ohne Angabe **1**\n\nDie Tabelle ist **STRICT**. Geprüft wird wie im Einsatz: korrekte Testzeilen müssen hinein, falsche müssen draußen bleiben.',
    hints: [
      'Wie bei den Schiffen im Einsatz. Neu ist eine Spalte mit DEFAULT und CHECK zugleich.',
      'Für „genau zwei Zeichen“: `CHECK (length(land) = 2)`. Regeln dürfen hintereinander stehen: `INTEGER NOT NULL DEFAULT 1 CHECK (liegeplaetze > 0)`.',
      'CREATE TABLE haefen (\n  hafen_id     INTEGER PRIMARY KEY,\n  name         TEXT    NOT NULL ___,\n  land         TEXT    NOT NULL CHECK (___),\n  liegeplaetze INTEGER NOT NULL DEFAULT ___ CHECK (___)\n) ___;',
    ],
    solution:
      'CREATE TABLE haefen (\n  hafen_id     INTEGER PRIMARY KEY,\n  name         TEXT    NOT NULL UNIQUE,\n  land         TEXT    NOT NULL CHECK (length(land) = 2),\n  liegeplaetze INTEGER NOT NULL DEFAULT 1 CHECK (liegeplaetze > 0)\n) STRICT;',
    solutionExplanation:
      'Jede Zeile der Bauvorschrift wird eine Zeile Code: Name, Typ, Regeln. `NOT NULL` bei `land` ist nötig, weil ein CHECK allein NULL durchlässt. STRICT sorgt dafür, dass „viele“ nicht als Liegeplatzzahl gespeichert wird.',
    check: state({
      stateQueries: [structureOf('haefen'), strictOf('haefen')],
      probes: [
        { label: 'vollständiger Hafen', sql: "INSERT INTO haefen (hafen_id, name, land, liegeplaetze) VALUES (1, 'Punta Arenas', 'CL', 4);", expectError: false, hint: 'Ein korrekter Hafen muss angenommen werden.' },
        { label: 'Hafen ohne Liegeplatzangabe', sql: "INSERT INTO haefen (hafen_id, name, land) VALUES (2, 'Ushuaia', 'AR');\nSELECT liegeplaetze FROM haefen WHERE hafen_id = 2;", expectError: false, hint: 'Ohne Angabe soll 1 eingetragen werden. Fehlt `DEFAULT 1`?' },
        { label: "Land 'Chile'", sql: "INSERT INTO haefen (hafen_id, name, land) VALUES (3, 'Valparaíso', 'Chile');", expectError: true, hint: 'Fehlt der CHECK mit `length(land) = 2`?' },
        { label: 'Hafen ohne Land', sql: "INSERT INTO haefen (hafen_id, name) VALUES (4, 'Grytviken');", expectError: true, hint: 'Fehlt `NOT NULL` bei `land`? Ein CHECK allein lässt NULL durch.' },
        { label: '0 Liegeplätze', sql: "INSERT INTO haefen (hafen_id, name, land, liegeplaetze) VALUES (5, 'Stanley', 'FK', 0);", expectError: true, hint: 'Fehlt `CHECK (liegeplaetze > 0)`?' },
        { label: "Liegeplätze 'viele'", sql: "INSERT INTO haefen (hafen_id, name, land, liegeplaetze) VALUES (6, 'Hobart', 'AU', 'viele');", expectError: true, hint: 'Ist die Tabelle STRICT?' },
        { label: 'doppelter Hafenname', sql: "INSERT INTO haefen (hafen_id, name, land) VALUES (1, 'Ushuaia', 'AR');\nINSERT INTO haefen (hafen_id, name, land) VALUES (2, 'Ushuaia', 'AR');", expectError: true, hint: 'Fehlt `UNIQUE` beim Namen?' },
      ],
    }),
    concepts: ['CREATE TABLE', 'Constraints', 'STRICT'],
    tests: {
      accept: ["CREATE TABLE haefen (hafen_id INTEGER, name TEXT NOT NULL, land TEXT NOT NULL, liegeplaetze INTEGER NOT NULL DEFAULT 1, PRIMARY KEY (hafen_id), UNIQUE (name), CHECK (length(land) = 2), CONSTRAINT chk_plaetze CHECK (liegeplaetze >= 1)) STRICT;"],
      reject: [
        'CREATE TABLE haefen (hafen_id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, land TEXT NOT NULL CHECK (length(land) = 2), liegeplaetze INTEGER NOT NULL DEFAULT 1 CHECK (liegeplaetze > 0));',
        'CREATE TABLE haefen (hafen_id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, land TEXT CHECK (length(land) = 2), liegeplaetze INTEGER NOT NULL DEFAULT 1 CHECK (liegeplaetze > 0)) STRICT;',
        'CREATE TABLE haefen (hafen_id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, land TEXT NOT NULL CHECK (length(land) = 2), liegeplaetze INTEGER NOT NULL CHECK (liegeplaetze > 0)) STRICT;',
      ],
    },
  },
  {
    id: 'k03-e1',
    lessonId: 'k03',
    type: 'predict',
    difficulty: 2,
    db: 'lieferdb',
    title: 'SQLite ist großzügig',
    prompt: 'Die Tabelle wird **ohne STRICT** angelegt. Was liefert die letzte Abfrage?',
    starterSql:
      "CREATE TABLE probe_locker (\n  zahl INTEGER\n);\nINSERT INTO probe_locker VALUES (42), ('zweiundvierzig'), (4.2);\nSELECT COUNT(DISTINCT typeof(zahl)) AS verschiedene_typen\nFROM probe_locker;",
    hints: ['Ohne STRICT ist der Datentyp nur ein Wunsch.', '`typeof()` zeigt den tatsächlich gespeicherten Typ.', '42 → integer, „zweiundvierzig“ → text, 4.2 → real.'],
    choices: {
      options: ['Fehlermeldung beim INSERT', 'verschiedene_typen = 1', 'verschiedene_typen = 2', 'verschiedene_typen = 3'],
      correct: 3,
      explanation:
        'Ohne STRICT nimmt SQLite jeden Wert in jede Spalte: integer, text und real – drei Typen in einer Spalte namens INTEGER. Mit `) STRICT;` würde der Text abgelehnt (cannot store TEXT value in INTEGER column).',
    },
    solution: "CREATE TABLE probe_locker (\n  zahl INTEGER\n);\nINSERT INTO probe_locker VALUES (42), ('zweiundvierzig'), (4.2);\nSELECT COUNT(DISTINCT typeof(zahl)) AS verschiedene_typen\nFROM probe_locker;",
    solutionExplanation: 'Drei verschiedene Typen – genau deshalb baut der Kurs alle neuen Tabellen mit STRICT.',
    concepts: ['STRICT'],
  },
  {
    id: 'k03-c1',
    lessonId: 'k03',
    type: 'choice',
    difficulty: 1,
    db: 'lieferdb',
    title: 'Welche Regel passt?',
    prompt: '„Die Patentnummer einer Kapitänin darf **fehlen** – aber wenn sie eingetragen ist, darf sie **nur einmal** vorkommen.“ Welcher Constraint setzt das um?',
    hints: ['Darf fehlen → kein NOT NULL.', 'Nur einmal → …', 'Wie verhält sich diese Regel bei mehreren NULL-Werten?'],
    choices: {
      options: ['NOT NULL', 'UNIQUE', 'UNIQUE NOT NULL', 'CHECK (patentnummer > 0)'],
      correct: 1,
      explanation: 'UNIQUE allein: Jeder eingetragene Wert nur einmal, mehrere NULL sind erlaubt (NULL ist kein Wert). Mit zusätzlichem NOT NULL dürfte sie nicht mehr fehlen.',
    },
    solution: '–',
    solutionExplanation: 'patentnummer TEXT UNIQUE',
    concepts: ['Constraints', 'NULL'],
  },
  {
    id: 'k03-e2',
    lessonId: 'k03',
    type: 'write',
    difficulty: 2,
    db: 'lieferdb',
    title: 'Die Kapitäne',
    prompt:
      'Setze das erweiterte Modell aus Tag 2 um. Lege die STRICT-Tabelle `kapitaene` an:\n\n- `kapitaen_id`: ganze Zahl, Primärschlüssel\n- `name`: Text, Pflicht\n- `heimathafen`: Text, optional\n- `patentnummer`: Text, optional, aber jede Nummer nur einmal',
    hints: ['Zwei optionale Spalten, eine davon eindeutig.', 'Optional = ohne NOT NULL. Eindeutig = UNIQUE.', 'CREATE TABLE kapitaene (\n  kapitaen_id  INTEGER PRIMARY KEY,\n  name         TEXT ___,\n  heimathafen  TEXT,\n  patentnummer TEXT ___\n) STRICT;'],
    solution: 'CREATE TABLE kapitaene (\n  kapitaen_id  INTEGER PRIMARY KEY,\n  name         TEXT    NOT NULL,\n  heimathafen  TEXT,\n  patentnummer TEXT    UNIQUE\n) STRICT;',
    solutionExplanation: 'Die Patentnummer ist UNIQUE ohne NOT NULL – mehrere Kapitäne ohne Patentnummer bleiben möglich, doppelte Nummern nicht.',
    check: state({
      stateQueries: [structureOf('kapitaene'), strictOf('kapitaene')],
      probes: [
        { label: 'vollständige Kapitänin', sql: "INSERT INTO kapitaene (kapitaen_id, name, heimathafen, patentnummer) VALUES (1, 'Ana Riquelme', 'Valparaíso', 'CL-4471');", expectError: false, hint: 'Ein vollständiger Datensatz muss angenommen werden.' },
        { label: 'zwei ohne Patentnummer', sql: "INSERT INTO kapitaene (kapitaen_id, name) VALUES (1, 'Imke Harms');\nINSERT INTO kapitaene (kapitaen_id, name) VALUES (2, 'Oddvar Hvalross');", expectError: false, hint: 'Die Patentnummer ist optional – ist sie mit NOT NULL definiert?' },
        { label: 'doppelte Patentnummer', sql: "INSERT INTO kapitaene (kapitaen_id, name, patentnummer) VALUES (1, 'A', 'NO-512');\nINSERT INTO kapitaene (kapitaen_id, name, patentnummer) VALUES (2, 'B', 'NO-512');", expectError: true, hint: 'Fehlt `UNIQUE` bei der Patentnummer?' },
        { label: 'ohne Name', sql: 'INSERT INTO kapitaene (kapitaen_id) VALUES (3);', expectError: true, hint: 'Fehlt `NOT NULL` beim Namen?' },
      ],
    }),
    concepts: ['CREATE TABLE', 'Constraints'],
    tests: { reject: ['CREATE TABLE kapitaene (kapitaen_id INTEGER PRIMARY KEY, name TEXT NOT NULL, heimathafen TEXT, patentnummer TEXT UNIQUE NOT NULL) STRICT;', 'CREATE TABLE kapitaene (kapitaen_id INTEGER PRIMARY KEY, name TEXT NOT NULL, heimathafen TEXT, patentnummer TEXT) STRICT;'] },
  },
  {
    id: 'k03-e3',
    lessonId: 'k03',
    type: 'complete',
    difficulty: 3,
    db: 'lieferdb',
    title: 'Die Kommandos (n:m mit Zeitraum)',
    prompt:
      'Die Tabelle `kapitaene` ist im Startcode schon angelegt. Ergänze die Zwischentabelle `kommandos`:\n\n- Fremdschlüssel auf `kapitaene` und `schiffe` (beide Pflicht)\n- `von` (Pflicht, Format JJJJ-MM-TT) und `bis` (optional)\n- Dieselbe Person kann dasselbe Schiff **mehrmals** führen, aber nicht zweimal **ab demselben Datum** → Schlüssel aus drei Spalten\n- `bis` darf nicht vor `von` liegen',
    starterSql:
      "CREATE TABLE kapitaene (\n  kapitaen_id  INTEGER PRIMARY KEY,\n  name         TEXT    NOT NULL,\n  heimathafen  TEXT,\n  patentnummer TEXT    UNIQUE\n) STRICT;\n\nCREATE TABLE kommandos (\n  kapitaen_id INTEGER NOT NULL REFERENCES ___(___),\n  schiff_id   INTEGER NOT NULL REFERENCES ___(___),\n  von         TEXT    NOT NULL CHECK (von LIKE '____-__-__'),\n  bis         TEXT,\n  PRIMARY KEY (___),\n  CHECK (___)\n) STRICT;",
    hints: [
      'Die beiden Fremdschlüssel zeigen auf die Primärschlüssel der Elterntabellen.',
      'Der Schlüssel besteht aus kapitaen_id, schiff_id und von. Datumswerte im Format JJJJ-MM-TT kann man mit >= vergleichen.',
      'PRIMARY KEY (kapitaen_id, schiff_id, von),\nCHECK (bis IS NULL OR bis >= von)',
    ],
    solution:
      "CREATE TABLE kapitaene (\n  kapitaen_id  INTEGER PRIMARY KEY,\n  name         TEXT    NOT NULL,\n  heimathafen  TEXT,\n  patentnummer TEXT    UNIQUE\n) STRICT;\n\nCREATE TABLE kommandos (\n  kapitaen_id INTEGER NOT NULL REFERENCES kapitaene(kapitaen_id),\n  schiff_id   INTEGER NOT NULL REFERENCES schiffe(schiff_id),\n  von         TEXT    NOT NULL CHECK (von LIKE '____-__-__'),\n  bis         TEXT,\n  PRIMARY KEY (kapitaen_id, schiff_id, von),\n  CHECK (bis IS NULL OR bis >= von)\n) STRICT;",
    solutionExplanation:
      'Der Schlüssel aus drei Spalten erlaubt mehrere Kommandos derselben Person auf demselben Schiff zu verschiedenen Zeiten. Die Regel über zwei Spalten steht als eigene Zeile am Ende. Übrigens: `CHECK (bis >= von)` allein würde genügen, weil ein CHECK bei NULL („unbekannt“) nicht greift – `bis IS NULL OR` macht die Absicht aber deutlicher.',
    check: state({
      stateQueries: [structureOf('kommandos'), strictOf('kommandos')],
      probes: [
        { label: 'laufendes Kommando', sql: "INSERT INTO kapitaene (kapitaen_id, name) VALUES (1, 'Imke Harms');\nINSERT INTO kommandos (kapitaen_id, schiff_id, von) VALUES (1, 1, '2024-03-01');", expectError: false, hint: 'Ein Kommando ohne Ende (bis = NULL) muss erlaubt sein.' },
        { label: 'dasselbe Schiff zweimal, andere Zeiträume', sql: "INSERT INTO kapitaene (kapitaen_id, name) VALUES (1, 'Imke Harms');\nINSERT INTO kommandos (kapitaen_id, schiff_id, von, bis) VALUES (1, 1, '2020-01-01', '2021-12-31');\nINSERT INTO kommandos (kapitaen_id, schiff_id, von) VALUES (1, 1, '2024-03-01');", expectError: false, hint: 'Gehört `von` zum Primärschlüssel?' },
        { label: 'gleiches Kommando doppelt', sql: "INSERT INTO kapitaene (kapitaen_id, name) VALUES (1, 'Imke Harms');\nINSERT INTO kommandos (kapitaen_id, schiff_id, von) VALUES (1, 1, '2024-03-01');\nINSERT INTO kommandos (kapitaen_id, schiff_id, von) VALUES (1, 1, '2024-03-01');", expectError: true, hint: 'Ist (kapitaen_id, schiff_id, von) der Primärschlüssel?' },
        { label: 'Ende vor Beginn', sql: "INSERT INTO kapitaene (kapitaen_id, name) VALUES (1, 'Imke Harms');\nINSERT INTO kommandos (kapitaen_id, schiff_id, von, bis) VALUES (1, 2, '2024-03-01', '2023-12-31');", expectError: true, hint: 'Fehlt der CHECK, der bis vor von verhindert?' },
        { label: 'unbekanntes Schiff', sql: "INSERT INTO kapitaene (kapitaen_id, name) VALUES (1, 'Imke Harms');\nINSERT INTO kommandos (kapitaen_id, schiff_id, von) VALUES (1, 99, '2024-03-01');", expectError: true, hint: 'Fehlt `REFERENCES schiffe(schiff_id)`?' },
        { label: 'unbekannte Kapitänin', sql: "INSERT INTO kommandos (kapitaen_id, schiff_id, von) VALUES (42, 1, '2024-03-01');", expectError: true, hint: 'Fehlt `REFERENCES kapitaene(kapitaen_id)`?' },
      ],
    }),
    concepts: ['CREATE TABLE', 'Fremdschlüssel', 'Beziehungen', 'Constraints'],
    tests: {
      accept: ["CREATE TABLE kapitaene (kapitaen_id INTEGER PRIMARY KEY, name TEXT NOT NULL, heimathafen TEXT, patentnummer TEXT UNIQUE) STRICT; CREATE TABLE kommandos (kapitaen_id INTEGER NOT NULL REFERENCES kapitaene(kapitaen_id), schiff_id INTEGER NOT NULL REFERENCES schiffe(schiff_id), von TEXT NOT NULL CHECK (von LIKE '____-__-__'), bis TEXT, PRIMARY KEY (kapitaen_id, schiff_id, von), CHECK (bis >= von)) STRICT;"],
      reject: ["CREATE TABLE kapitaene (kapitaen_id INTEGER PRIMARY KEY, name TEXT NOT NULL, heimathafen TEXT, patentnummer TEXT UNIQUE) STRICT; CREATE TABLE kommandos (kapitaen_id INTEGER NOT NULL REFERENCES kapitaene(kapitaen_id), schiff_id INTEGER NOT NULL REFERENCES schiffe(schiff_id), von TEXT NOT NULL CHECK (von LIKE '____-__-__'), bis TEXT, PRIMARY KEY (kapitaen_id, schiff_id), CHECK (bis IS NULL OR bis >= von)) STRICT;"],
    },
  },
  {
    id: 'k03-e4',
    lessonId: 'k03',
    type: 'fix',
    difficulty: 2,
    db: 'lieferdb',
    title: 'Inventuren streng bauen',
    prompt:
      'Für Inventuren auf den Stationen gibt es eine Bauvorschrift: Jede Inventur gehört **zwingend** zu einer Station, das Datum ist **Pflicht** und muss das Format **JJJJ-MM-TT** haben, `zaehler` (wer gezählt hat) ist optional. Der Entwurf unten ist zu locker – er nimmt Inventuren ohne Station und mit Datum „04.02.2026“ an. Korrigiere ihn.',
    starterSql: 'CREATE TABLE inventuren (\n  inventur_id INTEGER PRIMARY KEY,\n  station_id  INTEGER REFERENCES stationen(station_id),\n  datum       TEXT    NOT NULL,\n  zaehler     TEXT\n) STRICT;',
    hints: [
      'Zwei Lücken: Was macht einen Fremdschlüssel zur Pflicht? Und welche Regel prüft das Datumsformat?',
      "Ein Fremdschlüssel ohne NOT NULL darf leer bleiben. Für das Format: `CHECK (datum LIKE '____-__-__')`.",
      "CREATE TABLE inventuren (\n  inventur_id INTEGER PRIMARY KEY,\n  station_id  INTEGER ___ REFERENCES stationen(station_id),\n  datum       TEXT    NOT NULL CHECK (___),\n  zaehler     TEXT\n) STRICT;",
    ],
    solution: "CREATE TABLE inventuren (\n  inventur_id INTEGER PRIMARY KEY,\n  station_id  INTEGER NOT NULL REFERENCES stationen(station_id),\n  datum       TEXT    NOT NULL CHECK (datum LIKE '____-__-__'),\n  zaehler     TEXT\n) STRICT;",
    solutionExplanation:
      "`REFERENCES` prüft nur Werte, die vorhanden sind – NULL lässt der Fremdschlüssel durch. Deshalb macht erst `NOT NULL` die Beziehung zur Pflicht. Das LIKE-Muster `'____-__-__'` verlangt vier Zeichen, Strich, zwei Zeichen, Strich, zwei Zeichen; „04.02.2026“ passt nicht.",
    check: state({
      stateQueries: [structureOf('inventuren'), strictOf('inventuren')],
      probes: [
        { label: 'korrekte Inventur', sql: "INSERT INTO inventuren (inventur_id, station_id, datum, zaehler) VALUES (1, 1, '2026-02-04', 'Ronja Weiß');", expectError: false, hint: 'Eine korrekte Inventur muss angenommen werden.' },
        { label: 'Inventur ohne Station', sql: "INSERT INTO inventuren (inventur_id, datum) VALUES (2, '2026-02-04');", expectError: true, hint: 'Fehlt `NOT NULL` bei station_id?' },
        { label: "Datum '04.02.2026'", sql: "INSERT INTO inventuren (inventur_id, station_id, datum) VALUES (3, 1, '04.02.2026');", expectError: true, hint: "Fehlt der CHECK mit LIKE '____-__-__'?" },
        { label: 'unbekannte Station', sql: "INSERT INTO inventuren (inventur_id, station_id, datum) VALUES (4, 99, '2026-02-04');", expectError: true, hint: 'Der Fremdschlüssel auf stationen muss erhalten bleiben.' },
        { label: 'ohne Zähler', sql: "INSERT INTO inventuren (inventur_id, station_id, datum) VALUES (5, 2, '2026-02-05');", expectError: false, hint: '`zaehler` soll optional bleiben.' },
      ],
    }),
    concepts: ['Constraints', 'Fremdschlüssel'],
    tests: { reject: ["CREATE TABLE inventuren (inventur_id INTEGER PRIMARY KEY, station_id INTEGER NOT NULL REFERENCES stationen(station_id), datum TEXT NOT NULL, zaehler TEXT) STRICT;"] },
  },
  {
    id: 'k03-c2',
    lessonId: 'k03',
    type: 'choice',
    difficulty: 2,
    db: 'lieferdb',
    title: 'Ganz oder gar nicht',
    prompt:
      'Die Waage meldet zwölf Wiegungen nach. Sie werden mit **einem** `INSERT … VALUES (…), (…), …` in eine Tabelle mit `CHECK (gewicht_g BETWEEN 2000 AND 9000)` geschrieben. **Eine** Zeile hat 38000 g. Wie viele Zeilen sind danach gespeichert?',
    hints: ['Wie viele Befehle sind es?', 'Ohne BEGIN ist jeder einzelne Befehl eine eigene Transaktion.', 'Atomarität.'],
    choices: {
      options: ['11', '12', '0', '1'],
      correct: 2,
      explanation:
        'Ein Befehl gilt ganz oder gar nicht: Verletzt eine Zeile den CHECK, wird der gesamte INSERT abgelehnt – 0 Zeilen. Der Kurs-Trick: erst in eine Rohtabelle ohne Regeln schreiben, mit `WHERE gewicht_g NOT BETWEEN …` den Ausreißer finden und die gültigen Zeilen per `INSERT … SELECT` übernehmen.',
    },
    solution: '–',
    solutionExplanation: 'Atomarität: ein Befehl, alle oder keine Zeile.',
    concepts: ['Constraints', 'Transaktionen'],
  },
  {
    id: 'k03-e5',
    lessonId: 'k03',
    type: 'write',
    difficulty: 2,
    db: 'lieferdb',
    title: 'Ein Register für die Stationen',
    prompt:
      'Die Leitstelle fragt oft: „Welche Lieferungen gingen an Station X?“ – also `WHERE station_id = …` auf `lieferungen`. Lege einen Index an, damit diese Suche nachschlägt statt jede Zeile zu lesen.\n\nTipp: Prüfe vorher und nachher mit `EXPLAIN QUERY PLAN SELECT * FROM lieferungen WHERE station_id = 1;`',
    hints: [
      'Der Primärschlüssel lieferung_id hat schon einen Index – für station_id gibt es keinen.',
      '`CREATE INDEX name ON tabelle(spalte);` – der Name ist frei, üblich ist idx_tabelle_spalte.',
      'CREATE INDEX idx_lieferungen_station\nON ___(___);',
    ],
    solution: 'CREATE INDEX idx_lieferungen_station\nON lieferungen(station_id);',
    solutionExplanation:
      'Vorher zeigt EXPLAIN QUERY PLAN `SCAN lieferungen`, danach `SEARCH lieferungen USING INDEX idx_lieferungen_station (station_id=?)`. Fremdschlüssel sind gute Index-Kandidaten, weil über sie gesucht und verknüpft wird. Ein Index über (station_id, ankunft) hilft ebenfalls; einer über (ankunft, station_id) nicht.',
    check: state({ stateQueries: [indexOn('lieferungen', 'station_id')] }),
    concepts: ['Index'],
    tests: {
      accept: ['CREATE INDEX i ON lieferungen(station_id, ankunft);'],
      reject: ['CREATE INDEX i ON lieferungen(ankunft, station_id);', 'CREATE INDEX i ON positionen(lieferung_id);'],
    },
  },
  {
    id: 'k03-e6',
    lessonId: 'k03',
    type: 'predict',
    difficulty: 2,
    db: 'lieferdb',
    title: 'Was sagt der Plan?',
    prompt: 'In der Lieferdatenbank gibt es den Index `idx_positionen_ware` auf `positionen(ware_id)`. Was steht in der Spalte `detail` des Plans?',
    starterSql: 'EXPLAIN QUERY PLAN\nSELECT * FROM positionen WHERE ware_id = 3;',
    hints: ['SCAN = jede Zeile lesen, SEARCH = nachschlagen.', 'Gibt es einen Index, der mit ware_id beginnt?', 'Der Name des Index steht im Plan.'],
    choices: {
      options: [
        'SCAN positionen',
        'SEARCH positionen USING INDEX idx_positionen_ware (ware_id=?)',
        'SEARCH positionen USING INTEGER PRIMARY KEY (rowid=?)',
        'SEARCH positionen USING INDEX sqlite_autoindex_positionen_1 (lieferung_id=?)',
      ],
      correct: 1,
      explanation:
        'Der Index beginnt mit ware_id, also schlägt SQLite nach. Der automatische Index des Schlüssels (lieferung_id, ware_id) hilft hier nicht – er ist wie ein Telefonbuch zuerst nach lieferung_id sortiert. Probiere zum Vergleich `WHERE menge_kisten > 30`: Dort steht SCAN.',
    },
    solution: 'EXPLAIN QUERY PLAN\nSELECT * FROM positionen WHERE ware_id = 3;',
    solutionExplanation: 'SEARCH … USING INDEX idx_positionen_ware.',
    concepts: ['Index'],
  },
  {
    id: 'k03-c3',
    lessonId: 'k03',
    type: 'choice',
    difficulty: 2,
    db: 'lieferdb',
    title: 'Das Telefonbuch',
    prompt: 'Auf `kapitaene(name, heimathafen)` liegt ein Index. Bei welcher Abfrage hilft er **nicht**?',
    hints: ['Ein Index über zwei Spalten ist zuerst nach der ersten sortiert.', 'Telefonbuch: sortiert nach Nachname, dann Vorname.', 'Suche nur nach der zweiten Spalte …'],
    choices: {
      options: [
        "WHERE name = 'Imke Harms'",
        "WHERE name = 'Imke Harms' AND heimathafen = 'Bremerhaven'",
        "WHERE heimathafen = 'Bremerhaven'",
        'ORDER BY name',
      ],
      correct: 2,
      explanation:
        'Wie im Telefonbuch kann man nach dem Namen (und Name + Heimathafen) nachschlagen, aber nicht nur nach dem Heimathafen – dafür müsste man alle Einträge lesen. Für diese Suche braucht es einen eigenen Index, der mit heimathafen beginnt.',
    },
    solution: '–',
    solutionExplanation: 'Ein mehrspaltiger Index hilft nur, wenn die Suche bei der ersten Spalte beginnt.',
    concepts: ['Index'],
  },
  {
    id: 'k03-c4',
    lessonId: 'k03',
    type: 'choice',
    difficulty: 2,
    db: 'lieferdb',
    title: 'Abriss in der falschen Reihenfolge',
    prompt: '`DROP TABLE schiffe;` wird in der Lieferdatenbank ausgeführt. Was passiert?',
    hints: ['Welche Tabelle zeigt auf schiffe?', 'Die Datenbank lässt keine Fremdschlüssel ins Leere zeigen.', 'Probiere es in der SQL-Sandbox mit der Lieferdatenbank aus – dort lässt sich alles zurücksetzen.'],
    choices: {
      options: [
        'Die Tabelle wird gelöscht, die Lieferungen behalten ihre schiff_id',
        'Die Tabelle und alle Lieferungen werden gelöscht',
        'Abgelehnt: FOREIGN KEY constraint failed, weil Lieferungen auf Schiffe zeigen',
        'Nur die leeren Spalten werden gelöscht',
      ],
      correct: 2,
      explanation:
        'Lieferungen verweisen auf Schiffe. Beim Löschen der Tabelle würden diese Verweise ins Leere zeigen – die Datenbank lehnt ab. Abriss also von unten nach oben: erst positionen, dann lieferungen, dann schiffe. Beim Anlegen ist es umgekehrt.',
    },
    solution: '–',
    solutionExplanation: 'Elterntabellen zuerst anlegen, zuletzt löschen.',
    concepts: ['Fremdschlüssel', 'ALTER TABLE'],
  },
  {
    id: 'k03-e7',
    lessonId: 'k03',
    type: 'write',
    difficulty: 3,
    db: 'lieferdb',
    title: 'Prüfungsecke: Teilnehmende, Kurse, Belegung',
    prompt:
      'Typische IHK-Aufgabe: Eine Weiterbildungsfirma speichert, welche Teilnehmenden welche Kurse belegen, und je Belegung eine Note. Lege **drei Tabellen** an – hier ohne STRICT, so wie auf Papier, gern mit `INT`, `VARCHAR(…)` und `DECIMAL(2,1)`:\n\n1. `teilnehmer`: `teilnehmer_id` (Primärschlüssel), `name` (Pflicht)\n2. `kurse`: `kurs_id` (Primärschlüssel), `titel` (Pflicht)\n3. `belegung`: `teilnehmer_id` und `kurs_id` (Pflicht, Fremdschlüssel, gemeinsam Primärschlüssel), `note` (optional, Dezimalzahl, nur von 1.0 bis 6.0)',
    hints: [
      'Elterntabellen zuerst. Die Belegung ist die Zwischentabelle des n:m.',
      'Fremdschlüssel am Ende: `FOREIGN KEY (kurs_id) REFERENCES kurse(kurs_id)`; zusammengesetzter Schlüssel `PRIMARY KEY (teilnehmer_id, kurs_id)`.',
      'CREATE TABLE teilnehmer ( … );\nCREATE TABLE kurse ( … );\nCREATE TABLE belegung (\n  teilnehmer_id INT NOT NULL,\n  kurs_id       INT NOT NULL,\n  note          DECIMAL(2,1) CHECK (note BETWEEN 1.0 AND 6.0),\n  PRIMARY KEY (___),\n  FOREIGN KEY (teilnehmer_id) REFERENCES ___,\n  FOREIGN KEY (kurs_id) REFERENCES ___\n);',
    ],
    solution:
      'CREATE TABLE teilnehmer (\n  teilnehmer_id INT PRIMARY KEY,\n  name          VARCHAR(100) NOT NULL\n);\n\nCREATE TABLE kurse (\n  kurs_id INT PRIMARY KEY,\n  titel   VARCHAR(100) NOT NULL\n);\n\nCREATE TABLE belegung (\n  teilnehmer_id INT NOT NULL,\n  kurs_id       INT NOT NULL,\n  note          DECIMAL(2,1) CHECK (note BETWEEN 1.0 AND 6.0),\n  PRIMARY KEY (teilnehmer_id, kurs_id),\n  FOREIGN KEY (teilnehmer_id) REFERENCES teilnehmer(teilnehmer_id),\n  FOREIGN KEY (kurs_id) REFERENCES kurse(kurs_id)\n);',
    solutionExplanation:
      'Das ist Überführungsregel 5: n:m → Zwischentabelle mit zwei Fremdschlüsseln, die zusammen den Schlüssel bilden; die Note gehört zum Paar. `DECIMAL(2,1)` heißt: zwei Ziffern, eine davon nach dem Komma (z. B. 1.3). SQLite akzeptiert diese Typnamen nur ohne STRICT – in MySQL, PostgreSQL und SQL Server sind sie Standard.',
    check: state({
      stateQueries: [structureOf('teilnehmer'), structureOf('kurse'), structureOf('belegung')],
      probes: [
        { label: 'gültige Belegung', sql: "INSERT INTO teilnehmer (teilnehmer_id, name) VALUES (1, 'Rob');\nINSERT INTO kurse (kurs_id, titel) VALUES (1, 'SQL');\nINSERT INTO belegung (teilnehmer_id, kurs_id, note) VALUES (1, 1, 1.3);", expectError: false, hint: 'Eine gültige Belegung muss angenommen werden.' },
        { label: 'Belegung ohne Note', sql: "INSERT INTO teilnehmer (teilnehmer_id, name) VALUES (1, 'Rob');\nINSERT INTO kurse (kurs_id, titel) VALUES (1, 'SQL');\nINSERT INTO belegung (teilnehmer_id, kurs_id) VALUES (1, 1);", expectError: false, hint: 'Die Note ist optional.' },
        { label: 'dieselbe Belegung doppelt', sql: "INSERT INTO teilnehmer (teilnehmer_id, name) VALUES (1, 'Rob');\nINSERT INTO kurse (kurs_id, titel) VALUES (1, 'SQL');\nINSERT INTO belegung (teilnehmer_id, kurs_id) VALUES (1, 1);\nINSERT INTO belegung (teilnehmer_id, kurs_id) VALUES (1, 1);", expectError: true, hint: 'Ist (teilnehmer_id, kurs_id) der Primärschlüssel?' },
        { label: 'ein Teilnehmer, zwei Kurse', sql: "INSERT INTO teilnehmer (teilnehmer_id, name) VALUES (1, 'Rob');\nINSERT INTO kurse (kurs_id, titel) VALUES (1, 'SQL'), (2, 'Python');\nINSERT INTO belegung (teilnehmer_id, kurs_id) VALUES (1, 1), (1, 2);", expectError: false, hint: 'teilnehmer_id allein darf nicht eindeutig sein.' },
        { label: 'unbekannter Kurs', sql: "INSERT INTO teilnehmer (teilnehmer_id, name) VALUES (1, 'Rob');\nINSERT INTO belegung (teilnehmer_id, kurs_id) VALUES (1, 99);", expectError: true, hint: 'Fehlt der Fremdschlüssel auf kurse?' },
        { label: 'Note 7', sql: "INSERT INTO teilnehmer (teilnehmer_id, name) VALUES (1, 'Rob');\nINSERT INTO kurse (kurs_id, titel) VALUES (1, 'SQL');\nINSERT INTO belegung (teilnehmer_id, kurs_id, note) VALUES (1, 1, 7.0);", expectError: true, hint: 'Fehlt der CHECK für Noten von 1.0 bis 6.0?' },
      ],
    }),
    concepts: ['CREATE TABLE', 'Beziehungen', 'Fremdschlüssel'],
    tests: {
      accept: ['CREATE TABLE teilnehmer (teilnehmer_id INTEGER PRIMARY KEY, name TEXT NOT NULL) STRICT; CREATE TABLE kurse (kurs_id INTEGER PRIMARY KEY, titel TEXT NOT NULL) STRICT; CREATE TABLE belegung (teilnehmer_id INTEGER NOT NULL REFERENCES teilnehmer(teilnehmer_id), kurs_id INTEGER NOT NULL REFERENCES kurse(kurs_id), note REAL CHECK (note >= 1 AND note <= 6), PRIMARY KEY (teilnehmer_id, kurs_id)) STRICT;'],
      reject: ['CREATE TABLE teilnehmer (teilnehmer_id INT PRIMARY KEY, name VARCHAR(100) NOT NULL); CREATE TABLE kurse (kurs_id INT PRIMARY KEY, titel VARCHAR(100) NOT NULL); CREATE TABLE belegung (teilnehmer_id INT NOT NULL REFERENCES teilnehmer(teilnehmer_id), kurs_id INT NOT NULL REFERENCES kurse(kurs_id), note DECIMAL(2,1), PRIMARY KEY (teilnehmer_id, kurs_id));'],
    },
  },
];
