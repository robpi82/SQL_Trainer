import type { Exercise } from '../types';
import { state, structureOf } from './helpers';

export const exercisesM15: Exercise[] = [
  {
    id: 'm15-g1',
    lessonId: 'm15',
    guided: true,
    type: 'write',
    difficulty: 1,
    db: 'vertrieb',
    title: 'Eine Tabelle anlegen',
    prompt:
      'Lege die Tabelle `lieferanten` an:\n\n- `lieferant_id`: ganze Zahl, Primärschlüssel\n- `name`: Text, Pflichtfeld\n- `land`: Text, optional\n\nGeprüft werden die Struktur der Tabelle und ob die Regeln greifen – dazu fügt die Prüfung Test-Datensätze ein.',
    hints: [
      'Eine neue Tabelle braucht einen Namen und eine Liste von Spalten – jede mit Namen und Datentyp, getrennt durch Kommas.',
      'Schlüsselwörter: `CREATE TABLE name ( … )`, `INTEGER`, `TEXT`, `PRIMARY KEY`, `NOT NULL`.',
      'CREATE TABLE lieferanten (\n  lieferant_id INTEGER ___,\n  name TEXT ___,\n  land ___\n);',
    ],
    solution: 'CREATE TABLE lieferanten (\n  lieferant_id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL,\n  land TEXT\n);',
    solutionExplanation:
      'Jede Spalte bekommt Name, Datentyp und optional Regeln (Constraints). `PRIMARY KEY` macht `lieferant_id` eindeutig; in SQLite vergibt eine `INTEGER PRIMARY KEY`-Spalte sogar automatisch die nächste Nummer, wenn man sie beim INSERT weglässt. `NOT NULL` verbietet fehlende Namen. `land` ohne Regel darf NULL sein. Nach der letzten Spalte steht **kein** Komma.',
    check: state({
      stateQueries: [structureOf('lieferanten')],
      probes: [
        { label: 'gültiger Lieferant', sql: "INSERT INTO lieferanten (lieferant_id, name, land) VALUES (1, 'Techno GmbH', 'DE');", expectError: false, hint: 'Ein vollständiger Datensatz muss sich einfügen lassen.' },
        { label: 'Lieferant ohne Name', sql: "INSERT INTO lieferanten (lieferant_id, name, land) VALUES (2, NULL, 'DE');", expectError: true, hint: 'Fehlt `NOT NULL` bei `name`?' },
        { label: 'doppelte ID', sql: "INSERT INTO lieferanten (lieferant_id, name, land) VALUES (1, 'A', 'DE');\nINSERT INTO lieferanten (lieferant_id, name, land) VALUES (1, 'B', 'AT');", expectError: true, hint: 'Ist `lieferant_id` als `PRIMARY KEY` definiert?' },
        { label: 'Lieferant ohne Land', sql: "INSERT INTO lieferanten (lieferant_id, name, land) VALUES (3, 'Nordlicht AG', NULL);", expectError: false, hint: '`land` soll optional sein – also ohne `NOT NULL`.' },
      ],
    }),
    concepts: ['CREATE TABLE', 'Constraints'],
    tests: {
      accept: ['CREATE TABLE lieferanten (lieferant_id INT PRIMARY KEY NOT NULL, name VARCHAR(100) NOT NULL, land VARCHAR(2))', 'CREATE TABLE lieferanten (lieferant_id INTEGER, name TEXT NOT NULL, land TEXT, PRIMARY KEY (lieferant_id))'],
      reject: ['CREATE TABLE lieferanten (lieferant_id INTEGER PRIMARY KEY, name TEXT, land TEXT)', 'CREATE TABLE lieferanten (lieferant_id INTEGER, name TEXT NOT NULL, land TEXT)', 'CREATE TABLE lieferant (lieferant_id INTEGER PRIMARY KEY, name TEXT NOT NULL, land TEXT)'],
    },
  },
  {
    id: 'm15-e1',
    lessonId: 'm15',
    type: 'predict',
    difficulty: 2,
    db: 'vertrieb',
    title: 'UNIQUE und NULL',
    prompt: 'Die Spalte `email` ist als `UNIQUE` definiert. Es werden drei Datensätze eingefügt, zwei davon ohne E-Mail. Was liefert die letzte Abfrage?',
    starterSql:
      "CREATE TABLE newsletter (\n  abo_id INTEGER PRIMARY KEY,\n  email TEXT UNIQUE\n);\nINSERT INTO newsletter (abo_id, email) VALUES (1, 'anna@example.de');\nINSERT INTO newsletter (abo_id, email) VALUES (2, NULL);\nINSERT INTO newsletter (abo_id, email) VALUES (3, NULL);\nSELECT COUNT(*) AS anzahl FROM newsletter;",
    hints: [
      'UNIQUE verbietet doppelte Werte. Ist NULL ein Wert?',
      'Zwei NULL-Werte gelten in SQL nicht als gleich (NULL = NULL ist nicht wahr).',
      'Wenn kein INSERT scheitert, wie viele Zeilen gibt es dann?',
    ],
    choices: {
      options: ['Fehlermeldung beim dritten INSERT (doppelter Wert)', 'anzahl = 3', 'anzahl = 2', 'anzahl = 1'],
      correct: 1,
      explanation:
        'Alle drei INSERTs gelingen. UNIQUE verbietet nur doppelte **Werte** – NULL ist kein Wert, und zwei NULL gelten nicht als gleich. Deshalb dürfen beliebig viele Zeilen ohne E-Mail existieren. Soll die E-Mail Pflicht sein, braucht es zusätzlich `NOT NULL`. Achtung: SQL Server erlaubt in einer UNIQUE-Spalte nur ein einziges NULL; SQLite, PostgreSQL und MySQL erlauben mehrere.',
    },
    solution:
      "CREATE TABLE newsletter (\n  abo_id INTEGER PRIMARY KEY,\n  email TEXT UNIQUE\n);\nINSERT INTO newsletter (abo_id, email) VALUES (1, 'anna@example.de');\nINSERT INTO newsletter (abo_id, email) VALUES (2, NULL);\nINSERT INTO newsletter (abo_id, email) VALUES (3, NULL);\nSELECT COUNT(*) AS anzahl FROM newsletter;",
    solutionExplanation: 'UNIQUE + NULL: mehrere NULL sind erlaubt. Wer das verhindern will, kombiniert `UNIQUE NOT NULL`.',
    concepts: ['Constraints', 'NULL'],
  },
  {
    id: 'm15-e2',
    lessonId: 'm15',
    type: 'write',
    difficulty: 2,
    db: 'vertrieb',
    title: 'Bewertungen mit Fremdschlüssel',
    prompt:
      'Kunden sollen Produkte bewerten können. Lege die Tabelle `bewertungen` an:\n\n- `bewertung_id`: ganze Zahl, Primärschlüssel\n- `produkt_id`: ganze Zahl, Pflichtfeld, **Fremdschlüssel** auf `produkte(produkt_id)`\n- `sterne`: ganze Zahl, Pflichtfeld\n- `kommentar`: Text, optional',
    hints: [
      'Wie in der angeleiteten Übung – neu ist nur die Verbindung zur Tabelle `produkte`.',
      'Ein Fremdschlüssel wird mit `REFERENCES tabelle(spalte)` hinter der Spalte angegeben.',
      'CREATE TABLE bewertungen (\n  bewertung_id INTEGER PRIMARY KEY,\n  produkt_id INTEGER NOT NULL REFERENCES ___(___),\n  sterne ___,\n  kommentar ___\n);',
    ],
    solution: 'CREATE TABLE bewertungen (\n  bewertung_id INTEGER PRIMARY KEY,\n  produkt_id INTEGER NOT NULL REFERENCES produkte(produkt_id),\n  sterne INTEGER NOT NULL,\n  kommentar TEXT\n);',
    solutionExplanation:
      '`REFERENCES produkte(produkt_id)` sorgt dafür, dass nur Bewertungen für existierende Produkte gespeichert werden können – das ist eine 1:n-Beziehung (ein Produkt, viele Bewertungen). Alternativ kann der Fremdschlüssel am Ende stehen: `FOREIGN KEY (produkt_id) REFERENCES produkte(produkt_id)`. Wichtig: SQLite prüft Fremdschlüssel nur mit `PRAGMA foreign_keys = ON` – in dieser App ist das immer eingeschaltet.',
    check: state({
      stateQueries: [structureOf('bewertungen')],
      probes: [
        { label: 'gültige Bewertung', sql: "INSERT INTO bewertungen (bewertung_id, produkt_id, sterne, kommentar) VALUES (1, 1, 5, 'Sehr schnell');", expectError: false, hint: 'Eine Bewertung für ein vorhandenes Produkt muss erlaubt sein.' },
        { label: 'unbekanntes Produkt', sql: 'INSERT INTO bewertungen (bewertung_id, produkt_id, sterne, kommentar) VALUES (2, 999, 4, NULL);', expectError: true, hint: 'Es gibt kein Produkt 999. Fehlt `REFERENCES produkte(produkt_id)`?' },
        { label: 'Bewertung ohne Produkt', sql: 'INSERT INTO bewertungen (bewertung_id, produkt_id, sterne, kommentar) VALUES (3, NULL, 4, NULL);', expectError: true, hint: 'Fehlt `NOT NULL` bei `produkt_id`? Ein Fremdschlüssel allein erlaubt NULL.' },
        { label: 'Bewertung ohne Sterne', sql: 'INSERT INTO bewertungen (bewertung_id, produkt_id, sterne, kommentar) VALUES (4, 2, NULL, NULL);', expectError: true, hint: 'Fehlt `NOT NULL` bei `sterne`?' },
      ],
    }),
    concepts: ['CREATE TABLE', 'Fremdschlüssel'],
    tests: {
      accept: ['CREATE TABLE bewertungen (bewertung_id INTEGER PRIMARY KEY, produkt_id INTEGER NOT NULL, sterne INTEGER NOT NULL, kommentar TEXT, FOREIGN KEY (produkt_id) REFERENCES produkte(produkt_id))', 'CREATE TABLE bewertungen (bewertung_id INTEGER PRIMARY KEY, produkt_id INTEGER NOT NULL REFERENCES produkte, sterne INTEGER NOT NULL, kommentar TEXT)'],
      reject: ['CREATE TABLE bewertungen (bewertung_id INTEGER PRIMARY KEY, produkt_id INTEGER NOT NULL, sterne INTEGER NOT NULL, kommentar TEXT)', 'CREATE TABLE bewertungen (bewertung_id INTEGER PRIMARY KEY, produkt_id INTEGER REFERENCES produkte(produkt_id), sterne INTEGER NOT NULL, kommentar TEXT)'],
    },
  },
  {
    id: 'm15-e3',
    lessonId: 'm15',
    type: 'fix',
    difficulty: 2,
    db: 'vertrieb',
    title: 'Nur 1 bis 5 Sterne',
    prompt:
      'Die Tabelle `bewertungen` nimmt auch Bewertungen mit 0 oder 7 Sternen an. Ergänze die Definition so, dass nur **1 bis 5 Sterne** möglich sind. Alles andere bleibt, wie es ist.',
    starterSql: 'CREATE TABLE bewertungen (\n  bewertung_id INTEGER PRIMARY KEY,\n  produkt_id INTEGER NOT NULL REFERENCES produkte(produkt_id),\n  sterne INTEGER NOT NULL,\n  kommentar TEXT\n);',
    hints: [
      'Gesucht ist eine Regel, die den erlaubten Wertebereich einer Spalte festlegt.',
      '`CHECK (bedingung)` – die Bedingung kennst du aus WHERE, z. B. mit BETWEEN.',
      'CREATE TABLE bewertungen (\n  …\n  sterne INTEGER NOT NULL CHECK (___),\n  …\n);',
    ],
    solution: 'CREATE TABLE bewertungen (\n  bewertung_id INTEGER PRIMARY KEY,\n  produkt_id INTEGER NOT NULL REFERENCES produkte(produkt_id),\n  sterne INTEGER NOT NULL CHECK (sterne BETWEEN 1 AND 5),\n  kommentar TEXT\n);',
    solutionExplanation:
      'Ein `CHECK` lehnt jede Zeile ab, bei der die Bedingung **falsch** ist. Achtung: Ist die Bedingung „unbekannt“ (bei NULL), gilt sie als erfüllt – deshalb bleibt `NOT NULL` zusätzlich nötig. Gleichwertig: `CHECK (sterne >= 1 AND sterne <= 5)`.',
    check: state({
      stateQueries: [structureOf('bewertungen')],
      probes: [
        { label: '0 Sterne', sql: 'INSERT INTO bewertungen (bewertung_id, produkt_id, sterne) VALUES (1, 1, 0);', expectError: true, hint: 'Weniger als 1 Stern muss abgelehnt werden.' },
        { label: '6 Sterne', sql: 'INSERT INTO bewertungen (bewertung_id, produkt_id, sterne) VALUES (2, 1, 6);', expectError: true, hint: 'Mehr als 5 Sterne müssen abgelehnt werden.' },
        { label: '1 Stern', sql: 'INSERT INTO bewertungen (bewertung_id, produkt_id, sterne) VALUES (3, 1, 1);', expectError: false, hint: '1 Stern muss erlaubt sein – Grenzen einschließen.' },
        { label: '5 Sterne', sql: 'INSERT INTO bewertungen (bewertung_id, produkt_id, sterne) VALUES (4, 1, 5);', expectError: false, hint: '5 Sterne müssen erlaubt sein – Grenzen einschließen.' },
        { label: 'unbekanntes Produkt', sql: 'INSERT INTO bewertungen (bewertung_id, produkt_id, sterne) VALUES (5, 999, 3);', expectError: true, hint: 'Der Fremdschlüssel auf `produkte` muss erhalten bleiben.' },
      ],
    }),
    concepts: ['Constraints'],
    tests: {
      accept: ['CREATE TABLE bewertungen (bewertung_id INTEGER PRIMARY KEY, produkt_id INTEGER NOT NULL REFERENCES produkte(produkt_id), sterne INTEGER NOT NULL, kommentar TEXT, CHECK (sterne >= 1 AND sterne <= 5))'],
      reject: ['CREATE TABLE bewertungen (bewertung_id INTEGER PRIMARY KEY, produkt_id INTEGER NOT NULL REFERENCES produkte(produkt_id), sterne INTEGER NOT NULL CHECK (sterne > 1 AND sterne < 5), kommentar TEXT)'],
    },
  },
  {
    id: 'm15-e4',
    lessonId: 'm15',
    type: 'write',
    difficulty: 2,
    db: 'support',
    title: 'Schlagwörter mit Standardwert',
    prompt:
      'Für Tickets sollen Schlagwörter („Tags“) eingeführt werden. Lege die Tabelle `tags` an:\n\n- `tag_id`: ganze Zahl, Primärschlüssel\n- `name`: Text, Pflichtfeld, jeder Name darf nur **einmal** vorkommen\n- `farbe`: Text, Pflichtfeld mit dem **Standardwert** „grau“, falls beim Einfügen keine Farbe angegeben wird',
    hints: [
      'Zwei neue Regeln: Eindeutigkeit und ein Wert, der automatisch eingesetzt wird.',
      "`UNIQUE` und `DEFAULT 'wert'`. Regeln können hintereinander stehen: `TEXT NOT NULL UNIQUE`.",
      "CREATE TABLE tags (\n  tag_id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL ___,\n  farbe TEXT NOT NULL ___ 'grau'\n);",
    ],
    solution: "CREATE TABLE tags (\n  tag_id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL UNIQUE,\n  farbe TEXT NOT NULL DEFAULT 'grau'\n);",
    solutionExplanation:
      "`UNIQUE` verhindert doppelte Namen (anders als der Primärschlüssel kann eine Tabelle mehrere UNIQUE-Spalten haben). `DEFAULT 'grau'` wird eingesetzt, wenn die Spalte beim INSERT gar nicht genannt wird. Wird ausdrücklich `NULL` eingefügt, greift DEFAULT **nicht** – dann verhindert `NOT NULL` den leeren Wert.",
    check: state({
      stateQueries: [structureOf('tags')],
      probes: [
        { label: 'Tag ohne Farbe', sql: "INSERT INTO tags (tag_id, name) VALUES (1, 'VPN');\nSELECT farbe FROM tags WHERE tag_id = 1;", expectError: false, hint: "Wird keine Farbe angegeben, soll automatisch 'grau' eingetragen werden. Fehlt `DEFAULT 'grau'`?" },
        { label: 'doppelter Name', sql: "INSERT INTO tags (tag_id, name, farbe) VALUES (1, 'VPN', 'blau');\nINSERT INTO tags (tag_id, name, farbe) VALUES (2, 'VPN', 'rot');", expectError: true, hint: 'Fehlt `UNIQUE` bei `name`?' },
        { label: 'Tag ohne Name', sql: "INSERT INTO tags (tag_id, name, farbe) VALUES (3, NULL, 'blau');", expectError: true, hint: 'Fehlt `NOT NULL` bei `name`?' },
        { label: 'zwei verschiedene Tags', sql: "INSERT INTO tags (tag_id, name, farbe) VALUES (1, 'VPN', 'blau');\nINSERT INTO tags (tag_id, name) VALUES (2, 'Drucker');\nSELECT COUNT(*) FROM tags;", expectError: false, hint: 'Unterschiedliche Namen müssen erlaubt sein.' },
      ],
    }),
    concepts: ['CREATE TABLE', 'Constraints'],
    tests: {
      accept: ["CREATE TABLE tags (tag_id INTEGER PRIMARY KEY, name VARCHAR(50) NOT NULL, farbe VARCHAR(20) DEFAULT 'grau' NOT NULL, UNIQUE (name))"],
      reject: ["CREATE TABLE tags (tag_id INTEGER PRIMARY KEY, name TEXT NOT NULL, farbe TEXT NOT NULL DEFAULT 'grau')", 'CREATE TABLE tags (tag_id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, farbe TEXT NOT NULL)', "CREATE TABLE tags (tag_id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, farbe TEXT NOT NULL DEFAULT 'blau')"],
    },
  },
  {
    id: 'm15-e5',
    lessonId: 'm15',
    type: 'complete',
    difficulty: 1,
    db: 'forschung',
    title: 'Spalte nachträglich hinzufügen',
    prompt: 'Die Stationen sollen eine zusätzliche, optionale Text-Spalte `betreiber` bekommen. Die vorhandenen Daten müssen erhalten bleiben. Ergänze die Lücken.',
    starterSql: 'ALTER TABLE ___\nADD COLUMN ___ TEXT;',
    hints: [
      'Die Tabelle existiert schon – sie wird verändert, nicht neu angelegt.',
      '`ALTER TABLE tabelle ADD COLUMN spalte typ;`',
      'ALTER TABLE stationen\nADD COLUMN ___ TEXT;',
    ],
    solution: 'ALTER TABLE stationen\nADD COLUMN betreiber TEXT;',
    solutionExplanation:
      'ALTER TABLE ändert eine bestehende Tabelle. Die neue Spalte ist bei allen vorhandenen Zeilen NULL (oder bekommt einen DEFAULT-Wert, falls angegeben). Ein `DROP TABLE` mit anschließendem `CREATE TABLE` würde dagegen alle Daten löschen. SQLite kann mit ALTER TABLE nur wenig: Spalten hinzufügen, umbenennen und (ab 3.35) entfernen – Constraints nachträglich ändern geht nicht.',
    check: state({
      stateQueries: [structureOf('stationen'), { label: 'Daten der Tabelle stationen', sql: 'SELECT * FROM stationen ORDER BY station_id;' }],
    }),
    concepts: ['ALTER TABLE'],
    tests: { reject: ['ALTER TABLE stationen ADD COLUMN betreiber INTEGER;', 'ALTER TABLE stationen ADD COLUMN betreiber TEXT NOT NULL DEFAULT \'unbekannt\';'] },
  },
  {
    id: 'm15-e6',
    lessonId: 'm15',
    type: 'write',
    difficulty: 3,
    db: 'support',
    title: 'n:m-Beziehung mit Zwischentabelle',
    prompt:
      'Ein Ticket kann **mehrere** Tags haben, und ein Tag kann an **mehreren** Tickets hängen. Lege zwei Tabellen an:\n\n1. `tags` mit `tag_id` (ganze Zahl, Primärschlüssel) und `name` (Text, Pflichtfeld, eindeutig)\n2. `ticket_tags` mit `ticket_id` und `tag_id` (beide ganze Zahlen, Pflichtfelder, jeweils Fremdschlüssel auf `tickets` bzw. `tags`). Dieselbe Kombination aus Ticket und Tag darf nur **einmal** vorkommen.\n\nTrenne die beiden Anweisungen mit einem Semikolon.',
    hints: [
      'Die Zwischentabelle enthält nur die beiden Fremdschlüssel. Was ist hier eindeutig – eine einzelne Spalte oder die Kombination?',
      'Ein **zusammengesetzter Primärschlüssel** steht am Ende der Spaltenliste: `PRIMARY KEY (spalte1, spalte2)`.',
      'CREATE TABLE tags (\n  tag_id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL UNIQUE\n);\n\nCREATE TABLE ticket_tags (\n  ticket_id INTEGER NOT NULL REFERENCES ___(___),\n  tag_id INTEGER NOT NULL REFERENCES ___(___),\n  PRIMARY KEY (___, ___)\n);',
    ],
    solution:
      'CREATE TABLE tags (\n  tag_id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL UNIQUE\n);\n\nCREATE TABLE ticket_tags (\n  ticket_id INTEGER NOT NULL REFERENCES tickets(ticket_id),\n  tag_id INTEGER NOT NULL REFERENCES tags(tag_id),\n  PRIMARY KEY (ticket_id, tag_id)\n);',
    solutionExplanation:
      'Eine n:m-Beziehung lässt sich nicht mit einer einzelnen Fremdschlüsselspalte abbilden. Die **Zwischentabelle** `ticket_tags` enthält pro Zuordnung eine Zeile. Der zusammengesetzte Primärschlüssel `(ticket_id, tag_id)` verhindert doppelte Zuordnungen, erlaubt aber, dass dasselbe Ticket mit verschiedenen Tags und derselbe Tag mit verschiedenen Tickets vorkommt. Die Tabelle `tags` muss zuerst angelegt werden, weil `ticket_tags` auf sie verweist.',
    check: state({
      stateQueries: [structureOf('tags'), structureOf('ticket_tags')],
      probes: [
        { label: 'ein Tag an zwei Tickets', sql: "INSERT INTO tags (tag_id, name) VALUES (1, 'VPN');\nINSERT INTO ticket_tags (ticket_id, tag_id) VALUES (2, 1);\nINSERT INTO ticket_tags (ticket_id, tag_id) VALUES (11, 1);", expectError: false, hint: 'Derselbe Tag muss mehreren Tickets zugeordnet werden können – ist `tag_id` allein als Primärschlüssel oder UNIQUE definiert?' },
        { label: 'ein Ticket mit zwei Tags', sql: "INSERT INTO tags (tag_id, name) VALUES (1, 'VPN');\nINSERT INTO tags (tag_id, name) VALUES (2, 'dringend');\nINSERT INTO ticket_tags (ticket_id, tag_id) VALUES (2, 1);\nINSERT INTO ticket_tags (ticket_id, tag_id) VALUES (2, 2);", expectError: false, hint: 'Ein Ticket muss mehrere Tags haben können – ist `ticket_id` allein als Primärschlüssel oder UNIQUE definiert?' },
        { label: 'dieselbe Zuordnung doppelt', sql: "INSERT INTO tags (tag_id, name) VALUES (1, 'VPN');\nINSERT INTO ticket_tags (ticket_id, tag_id) VALUES (2, 1);\nINSERT INTO ticket_tags (ticket_id, tag_id) VALUES (2, 1);", expectError: true, hint: 'Fehlt der zusammengesetzte Primärschlüssel `PRIMARY KEY (ticket_id, tag_id)`?' },
        { label: 'unbekanntes Ticket', sql: "INSERT INTO tags (tag_id, name) VALUES (1, 'VPN');\nINSERT INTO ticket_tags (ticket_id, tag_id) VALUES (999, 1);", expectError: true, hint: 'Fehlt `REFERENCES tickets(ticket_id)`?' },
        { label: 'unbekannter Tag', sql: 'INSERT INTO ticket_tags (ticket_id, tag_id) VALUES (2, 99);', expectError: true, hint: 'Fehlt `REFERENCES tags(tag_id)`?' },
        { label: 'doppelter Tag-Name', sql: "INSERT INTO tags (tag_id, name) VALUES (1, 'VPN');\nINSERT INTO tags (tag_id, name) VALUES (2, 'VPN');", expectError: true, hint: 'Fehlt `UNIQUE` bei `tags.name`?' },
      ],
    }),
    concepts: ['CREATE TABLE', 'Fremdschlüssel', 'Beziehungen'],
    tests: {
      accept: [
        'CREATE TABLE tags (tag_id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE); CREATE TABLE ticket_tags (ticket_id INTEGER NOT NULL, tag_id INTEGER NOT NULL, PRIMARY KEY (tag_id, ticket_id), FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id), FOREIGN KEY (tag_id) REFERENCES tags(tag_id));',
      ],
      reject: [
        'CREATE TABLE tags (tag_id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE); CREATE TABLE ticket_tags (ticket_id INTEGER NOT NULL REFERENCES tickets(ticket_id), tag_id INTEGER NOT NULL REFERENCES tags(tag_id));',
        'CREATE TABLE tags (tag_id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE); CREATE TABLE ticket_tags (ticket_id INTEGER PRIMARY KEY REFERENCES tickets(ticket_id), tag_id INTEGER NOT NULL REFERENCES tags(tag_id));',
        'CREATE TABLE tags (tag_id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE); CREATE TABLE ticket_tags (ticket_id INTEGER NOT NULL, tag_id INTEGER NOT NULL, PRIMARY KEY (ticket_id, tag_id));',
      ],
    },
  },
  {
    id: 'm15-e7',
    lessonId: 'm15',
    type: 'fix',
    difficulty: 3,
    db: 'vertrieb',
    title: 'Genau eine Rechnung pro Bestellung',
    prompt:
      'Zu jeder Bestellung soll es **höchstens eine** Rechnung geben, und Rechnungen dürfen sich nur auf **existierende** Bestellungen beziehen (1:1-Beziehung). Die Tabellendefinition erlaubt aber beides nicht sicher. Korrigiere die Spalte `bestellung_id`.',
    starterSql: 'CREATE TABLE rechnungen (\n  rechnung_id INTEGER PRIMARY KEY,\n  bestellung_id INTEGER NOT NULL,\n  rechnungsdatum TEXT NOT NULL,\n  betrag REAL NOT NULL\n);',
    hints: [
      'Zwei Regeln fehlen: eine für „existiert“ und eine für „höchstens einmal“.',
      'Ein Fremdschlüssel allein ergibt 1:n. Mit zusätzlichem `UNIQUE` wird daraus 1:1.',
      'CREATE TABLE rechnungen (\n  rechnung_id INTEGER PRIMARY KEY,\n  bestellung_id INTEGER NOT NULL ___ REFERENCES ___(___),\n  rechnungsdatum TEXT NOT NULL,\n  betrag REAL NOT NULL\n);',
    ],
    solution:
      'CREATE TABLE rechnungen (\n  rechnung_id INTEGER PRIMARY KEY,\n  bestellung_id INTEGER NOT NULL UNIQUE REFERENCES bestellungen(bestellung_id),\n  rechnungsdatum TEXT NOT NULL,\n  betrag REAL NOT NULL\n);',
    solutionExplanation:
      'Der Fremdschlüssel stellt sicher, dass die Bestellung existiert. Erst `UNIQUE` begrenzt auf eine Rechnung pro Bestellung – so wird aus der 1:n- eine 1:1-Beziehung. Ohne UNIQUE könnte eine Bestellung beliebig viele Rechnungen haben.',
    check: state({
      stateQueries: [structureOf('rechnungen')],
      probes: [
        { label: 'gültige Rechnung', sql: "INSERT INTO rechnungen (rechnung_id, bestellung_id, rechnungsdatum, betrag) VALUES (1, 1, '2024-01-14', 1368.0);", expectError: false, hint: 'Eine Rechnung für eine vorhandene Bestellung muss erlaubt sein.' },
        { label: 'Rechnung für unbekannte Bestellung', sql: "INSERT INTO rechnungen (rechnung_id, bestellung_id, rechnungsdatum, betrag) VALUES (2, 999, '2024-01-14', 10.0);", expectError: true, hint: 'Fehlt `REFERENCES bestellungen(bestellung_id)`?' },
        { label: 'zweite Rechnung für dieselbe Bestellung', sql: "INSERT INTO rechnungen (rechnung_id, bestellung_id, rechnungsdatum, betrag) VALUES (1, 1, '2024-01-14', 1368.0);\nINSERT INTO rechnungen (rechnung_id, bestellung_id, rechnungsdatum, betrag) VALUES (2, 1, '2024-01-15', 1368.0);", expectError: true, hint: 'Fehlt `UNIQUE` bei `bestellung_id`?' },
        { label: 'Rechnungen für zwei Bestellungen', sql: "INSERT INTO rechnungen (rechnung_id, bestellung_id, rechnungsdatum, betrag) VALUES (1, 1, '2024-01-14', 1368.0);\nINSERT INTO rechnungen (rechnung_id, bestellung_id, rechnungsdatum, betrag) VALUES (2, 2, '2024-01-27', 629.7);", expectError: false, hint: 'Verschiedene Bestellungen müssen je eine Rechnung bekommen können.' },
      ],
    }),
    concepts: ['Fremdschlüssel', 'Constraints', 'Beziehungen'],
    tests: {
      accept: ['CREATE TABLE rechnungen (rechnung_id INTEGER PRIMARY KEY, bestellung_id INTEGER NOT NULL, rechnungsdatum TEXT NOT NULL, betrag REAL NOT NULL, UNIQUE (bestellung_id), FOREIGN KEY (bestellung_id) REFERENCES bestellungen(bestellung_id))'],
      reject: ['CREATE TABLE rechnungen (rechnung_id INTEGER PRIMARY KEY, bestellung_id INTEGER NOT NULL REFERENCES bestellungen(bestellung_id), rechnungsdatum TEXT NOT NULL, betrag REAL NOT NULL)', 'CREATE TABLE rechnungen (rechnung_id INTEGER PRIMARY KEY, bestellung_id INTEGER NOT NULL UNIQUE, rechnungsdatum TEXT NOT NULL, betrag REAL NOT NULL)'],
    },
  },
  {
    id: 'm15-e8',
    lessonId: 'm15',
    type: 'explain',
    difficulty: 2,
    db: 'support',
    title: 'Warum eine Zwischentabelle?',
    prompt:
      'Jedes Ticket hat **eine** Kategorie – dafür reicht die Spalte `tickets.kategorie_id`. Für Tags (mehrere pro Ticket, mehrere Tickets pro Tag) braucht man dagegen eine eigene Tabelle `ticket_tags`. Erkläre, warum. Was ginge schief, wenn man in `tickets` eine Spalte `tag_ids` mit Werten wie `\'1,4,7\'` anlegen würde?',
    starterSql: 'SELECT t.ticket_id, t.titel, k.name AS kategorie\nFROM tickets AS t\nLEFT JOIN kategorien AS k ON k.kategorie_id = t.kategorie_id;',
    hints: [
      'Wie viele Werte passen in ein Feld einer Zeile?',
      'Denke an Fremdschlüssel, JOINs und Abfragen wie „alle Tickets mit Tag 4“.',
      'Stichwörter: 1:n, n:m, erste Normalform, Fremdschlüssel prüfen, JOIN.',
    ],
    modelAnswer:
      'Bei **1:n** (eine Kategorie, viele Tickets) speichert die „n“-Seite einen einzelnen Fremdschlüssel – jedes Ticket verweist auf genau eine Kategorie.\n\nBei **n:m** müsste ein Ticket auf beliebig viele Tags verweisen. In ein Feld gehört aber nur **ein Wert** (erste Normalform). Eine Liste wie `\'1,4,7\'` ist nur ein Text:\n\n- Die Datenbank kann keinen Fremdschlüssel darauf prüfen – Tag 99 könnte eingetragen werden, obwohl es ihn nicht gibt.\n- JOINs mit `tags` sind nicht möglich, Abfragen wie „alle Tickets mit Tag 4“ werden umständlich und fehleranfällig (`LIKE \'%4%\'` findet auch 14).\n- Hinzufügen und Entfernen einzelner Tags erfordert Textbearbeitung.\n\nDie Zwischentabelle `ticket_tags` speichert **eine Zeile pro Zuordnung** mit zwei Fremdschlüsseln. So lassen sich Zuordnungen prüfen, verknüpfen, zählen und gezielt löschen. Ein zusammengesetzter Primärschlüssel verhindert doppelte Zuordnungen.',
    solution: 'SELECT t.ticket_id, t.titel, k.name AS kategorie\nFROM tickets AS t\nLEFT JOIN kategorien AS k ON k.kategorie_id = t.kategorie_id;',
    solutionExplanation: 'Siehe Musterantwort.',
    concepts: ['Beziehungen'],
  },
];
