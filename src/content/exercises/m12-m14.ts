import type { Exercise } from '../types';
import { q, state } from './helpers';

export const exercisesM12toM14: Exercise[] = [
  /* ---------------- Modul 12: Unterabfragen ---------------- */
  {
    id: 'm12-g1',
    lessonId: 'm12',
    guided: true,
    type: 'write',
    difficulty: 1,
    db: 'vertrieb',
    title: 'Teurer als der Durchschnitt',
    prompt: 'Zeige Name und Preis aller Produkte, die **teurer als der Durchschnittspreis** aller Produkte sind. Der Durchschnitt soll **nicht** von Hand eingetragen, sondern in der Abfrage berechnet werden.',
    expectedColumns: ['name', 'preis'],
    hints: [
      'Zwei Schritte: Durchschnitt berechnen, dann damit vergleichen. Beide Schritte passen in eine Abfrage.',
      'Eine Unterabfrage in Klammern, die genau einen Wert liefert, kann wie eine Zahl verwendet werden: `WHERE preis > (SELECT …)`.',
      'SELECT name, preis\nFROM produkte\nWHERE preis > (SELECT ___(preis) FROM ___);',
    ],
    solution: 'SELECT name, preis\nFROM produkte\nWHERE preis > (SELECT AVG(preis) FROM produkte);',
    solutionExplanation:
      'Die innere Abfrage wird zuerst ausgewertet und liefert einen einzigen Wert (skalare Unterabfrage, hier ca. 273,68). Die äußere Abfrage vergleicht jeden Preis damit. Ändern sich die Daten, passt sich das Ergebnis automatisch an – mit einer fest eingetragenen Zahl nicht.',
    check: q({ variants: [{ description: 'Ein zusätzliches sehr teures Produkt (verändert den Durchschnitt).', setup: "INSERT INTO produkte VALUES (13, 'Server Rack', 'Hardware', 9999.0, 1);" }] }),
    concepts: ['Unterabfragen'],
    tests: { reject: ['SELECT name, preis FROM produkte WHERE preis > 273.68', 'SELECT name, preis FROM produkte WHERE preis > 280'] },
  },
  {
    id: 'm12-e1',
    lessonId: 'm12',
    type: 'write',
    difficulty: 1,
    db: 'support',
    title: 'Tickets einer Kategorie über ihren Namen',
    prompt: "Zeige `ticket_id` und `titel` aller Tickets der Kategorie mit dem **Namen** „Netzwerk“. Die `kategorie_id` sollst du **nicht** selbst nachschlagen und eintragen – die Abfrage soll sie anhand des Namens finden.",
    expectedColumns: ['ticket_id', 'titel'],
    hints: [
      'Der Name steht in `kategorien`, die Tickets in `tickets`. Die Verbindung ist `kategorie_id`.',
      "Unterabfrage: `WHERE kategorie_id = (SELECT kategorie_id FROM kategorien WHERE name = '…')` – oder `IN (…)`. Ein JOIN geht auch.",
      "SELECT ticket_id, titel\nFROM tickets\nWHERE kategorie_id IN (SELECT ___ FROM kategorien WHERE ___);",
    ],
    solution: "SELECT ticket_id, titel\nFROM tickets\nWHERE kategorie_id IN (SELECT kategorie_id FROM kategorien WHERE name = 'Netzwerk');",
    solutionExplanation:
      'Die Unterabfrage ermittelt die ID der Kategorie „Netzwerk“; die äußere Abfrage nutzt sie als Filter. Ein JOIN mit `WHERE k.name = \'Netzwerk\'` ist ebenso richtig. Fest eingetragene IDs brechen, sobald sich die Daten ändern.',
    check: q({
      variants: [
        {
          description: 'Die Kategorie „Netzwerk“ hat in diesen Testdaten die ID 30 statt 3.',
          setup: 'PRAGMA foreign_keys = OFF; UPDATE kategorien SET kategorie_id = 30 WHERE kategorie_id = 3; UPDATE tickets SET kategorie_id = 30 WHERE kategorie_id = 3; PRAGMA foreign_keys = ON;',
        },
      ],
    }),
    concepts: ['Unterabfragen', 'IN'],
    tests: {
      accept: ["SELECT t.ticket_id, t.titel FROM tickets t JOIN kategorien k ON k.kategorie_id = t.kategorie_id WHERE k.name = 'Netzwerk'", "SELECT ticket_id, titel FROM tickets WHERE kategorie_id = (SELECT kategorie_id FROM kategorien WHERE name = 'Netzwerk')"],
      reject: ['SELECT ticket_id, titel FROM tickets WHERE kategorie_id = 3'],
    },
  },
  {
    id: 'm12-e2',
    lessonId: 'm12',
    type: 'write',
    difficulty: 2,
    db: 'forschung',
    title: 'Inseln ohne Beobachtungen im Juni',
    prompt:
      'Welche Inseln haben **keine Beobachtungen im Juni 2024** (01.06. bis 30.06.2024)? Zeige den `name` der Insel.\n\nBeachte: Beobachtungen sind Stationen zugeordnet, Stationen den Inseln. Inseln ganz ohne Station haben natürlich auch keine Beobachtungen.',
    expectedColumns: ['name'],
    hints: [
      'Ermittle zuerst die IDs der Inseln, auf denen im Juni beobachtet wurde. Gesucht sind alle anderen Inseln.',
      '`WHERE insel_id NOT IN (SELECT … FROM stationen JOIN beobachtungen … WHERE datum BETWEEN …)` – oder `NOT EXISTS`.',
      "SELECT name\nFROM inseln\nWHERE insel_id NOT IN (\n  SELECT s.insel_id\n  FROM stationen AS s\n  JOIN beobachtungen AS b ON ___\n  WHERE b.datum BETWEEN '___' AND '___'\n);",
    ],
    solution:
      "SELECT name\nFROM inseln\nWHERE insel_id NOT IN (\n  SELECT s.insel_id\n  FROM stationen AS s\n  JOIN beobachtungen AS b ON b.station_id = s.station_id\n  WHERE b.datum BETWEEN '2024-06-01' AND '2024-06-30'\n);",
    solutionExplanation:
      'Die Unterabfrage liefert die Inseln **mit** Juni-Beobachtungen (eine Liste mit mehreren Werten, daher IN statt =). NOT IN kehrt das um. Inseln ohne Station tauchen in der Unterabfrage gar nicht auf und sind deshalb korrekt im Ergebnis. Achtung: NOT IN funktioniert nur zuverlässig, wenn die Unterabfrage kein NULL liefert – `insel_id` ist hier NOT NULL.',
    check: q({ variants: [{ description: 'Eine zusätzliche Juni-Beobachtung auf Amrum (Station 7).', setup: "INSERT INTO beobachtungen VALUES (25, 7, 6, '2024-06-18', 'Austernfischer', 22, NULL);" }] }),
    concepts: ['Unterabfragen', 'IN', 'JOIN'],
    tests: {
      accept: [
        "SELECT i.name FROM inseln i WHERE NOT EXISTS (SELECT 1 FROM stationen s JOIN beobachtungen b ON b.station_id = s.station_id WHERE s.insel_id = i.insel_id AND b.datum LIKE '2024-06%')",
        "SELECT i.name FROM inseln i LEFT JOIN stationen s ON s.insel_id = i.insel_id LEFT JOIN beobachtungen b ON b.station_id = s.station_id AND b.datum BETWEEN '2024-06-01' AND '2024-06-30' GROUP BY i.insel_id, i.name HAVING COUNT(b.beobachtung_id) = 0",
      ],
      reject: ["SELECT name FROM inseln WHERE name IN ('Amrum', 'Hiddensee', 'Spiekeroog', 'Neuwerk')", "SELECT DISTINCT i.name FROM inseln i JOIN stationen s ON s.insel_id = i.insel_id JOIN beobachtungen b ON b.station_id = s.station_id WHERE b.datum NOT BETWEEN '2024-06-01' AND '2024-06-30'"],
    },
  },
  {
    id: 'm12-e3',
    lessonId: 'm12',
    type: 'write',
    difficulty: 2,
    db: 'vertrieb',
    title: 'Kunden mit offenen Bestellungen',
    prompt: "Welche Kunden haben **mindestens eine Bestellung mit dem Status „offen“**? Zeige `vorname` und `nachname` – jeden Kunden **nur einmal**.",
    expectedColumns: ['vorname', 'nachname'],
    hints: [
      'Für jeden Kunden lautet die Frage: Gibt es (mindestens) eine passende Bestellung?',
      '`WHERE EXISTS (SELECT 1 FROM bestellungen AS b WHERE b.kunde_id = k.kunde_id AND …)` – oder `kunde_id IN (…)`.',
      "SELECT k.vorname, k.nachname\nFROM kunden AS k\nWHERE EXISTS (\n  SELECT 1 FROM bestellungen AS b\n  WHERE b.kunde_id = ___ AND b.status = '___'\n);",
    ],
    solution: "SELECT k.vorname, k.nachname\nFROM kunden AS k\nWHERE EXISTS (\n  SELECT 1 FROM bestellungen AS b\n  WHERE b.kunde_id = k.kunde_id AND b.status = 'offen'\n);",
    solutionExplanation:
      'EXISTS prüft nur, ob die Unterabfrage mindestens eine Zeile liefert – was sie liefert (`SELECT 1`), ist egal. Die Unterabfrage ist **korreliert**: Sie bezieht sich über `k.kunde_id` auf die aktuelle Zeile der äußeren Abfrage. Ein JOIN würde Kunden mit mehreren offenen Bestellungen mehrfach zeigen (dann bräuchte man DISTINCT).',
    check: q({ variants: [{ description: 'Kunde 9 hat eine zweite offene Bestellung.', setup: "INSERT INTO bestellungen VALUES (19, 9, 2, '2024-06-28', 'offen', NULL);" }] }),
    concepts: ['Unterabfragen', 'EXISTS'],
    tests: {
      accept: ["SELECT vorname, nachname FROM kunden WHERE kunde_id IN (SELECT kunde_id FROM bestellungen WHERE status = 'offen')", "SELECT DISTINCT k.vorname, k.nachname FROM kunden k JOIN bestellungen b ON b.kunde_id = k.kunde_id WHERE b.status = 'offen'"],
      reject: ["SELECT k.vorname, k.nachname FROM kunden k JOIN bestellungen b ON b.kunde_id = k.kunde_id WHERE b.status = 'offen'"],
    },
  },
  {
    id: 'm12-e4',
    lessonId: 'm12',
    type: 'write',
    difficulty: 3,
    db: 'support',
    title: 'Zielzeit überschritten',
    prompt:
      '**Kennzahl:** Ein Ticket überschreitet seine Zielzeit, wenn seine Bearbeitungsdauer (Stunden zwischen `erstellt_am` und `geloest_am`) **größer** ist als `ziel_stunden` seiner Kategorie. Nur gelöste Tickets können die Zielzeit überschreiten.\n\nZeige `ticket_id`, `titel` und `dauer_stunden` (auf 1 Nachkommastelle gerundet) aller Tickets, die ihre Zielzeit überschreiten.\n\n**Die Spaltennamen werden geprüft.**',
    expectedColumns: ['ticket_id', 'titel', 'dauer_stunden'],
    hints: [
      'Jedes Ticket muss mit der Zielzeit **seiner eigenen** Kategorie verglichen werden.',
      'Entweder JOIN mit `kategorien` oder eine korrelierte Unterabfrage: `(SELECT ziel_stunden FROM kategorien AS k WHERE k.kategorie_id = t.kategorie_id)`.',
      'SELECT t.ticket_id, t.titel,\n       ROUND((julianday(t.geloest_am) - julianday(t.erstellt_am)) * 24, 1) AS dauer_stunden\nFROM tickets AS t\nWHERE (julianday(t.geloest_am) - julianday(t.erstellt_am)) * 24 >\n      (SELECT ___ FROM kategorien AS k WHERE ___);',
    ],
    solution:
      'SELECT t.ticket_id, t.titel,\n       ROUND((julianday(t.geloest_am) - julianday(t.erstellt_am)) * 24, 1) AS dauer_stunden\nFROM tickets AS t\nWHERE (julianday(t.geloest_am) - julianday(t.erstellt_am)) * 24 >\n      (SELECT k.ziel_stunden FROM kategorien AS k WHERE k.kategorie_id = t.kategorie_id);',
    solutionExplanation:
      'Die korrelierte Unterabfrage liefert für jedes Ticket die Zielzeit seiner Kategorie. Ungelöste Tickets fallen automatisch heraus: Ihre Dauer ist NULL, und ein Vergleich mit NULL ist nie wahr. Ebenso richtig ist ein JOIN mit `kategorien` und `WHERE dauer > k.ziel_stunden`.',
    check: q({ columnNames: true, variants: [{ description: 'Die Zielzeit für Hardware beträgt 100 statt 48 Stunden.', setup: 'UPDATE kategorien SET ziel_stunden = 100 WHERE kategorie_id = 1;' }] }),
    concepts: ['Unterabfragen', 'Datum', 'JOIN'],
    tests: {
      accept: ['SELECT t.ticket_id, t.titel, ROUND((julianday(t.geloest_am) - julianday(t.erstellt_am)) * 24, 1) AS dauer_stunden FROM tickets t JOIN kategorien k ON k.kategorie_id = t.kategorie_id WHERE (julianday(t.geloest_am) - julianday(t.erstellt_am)) * 24 > k.ziel_stunden'],
      reject: ['SELECT t.ticket_id, t.titel, ROUND((julianday(t.geloest_am) - julianday(t.erstellt_am)) * 24, 1) AS dauer_stunden FROM tickets t WHERE (julianday(t.geloest_am) - julianday(t.erstellt_am)) * 24 > 8', 'SELECT t.ticket_id, t.titel, ROUND((julianday(t.geloest_am) - julianday(t.erstellt_am)) * 24, 1) AS dauer_stunden FROM tickets t WHERE t.ticket_id IN (2, 4, 5, 6, 12, 13, 16)'],
    },
  },
  {
    id: 'm12-e5',
    lessonId: 'm12',
    type: 'fix',
    difficulty: 3,
    db: 'support',
    title: 'NOT IN und NULL',
    prompt: 'Gesucht sind Bearbeitende, denen **kein einziges Ticket** zugewiesen ist. Die Abfrage läuft fehlerfrei, liefert aber **keine** Zeile – obwohl Lars Engel kein Ticket hat. Korrigiere sie.',
    starterSql: 'SELECT name\nFROM bearbeitende\nWHERE bearbeiter_id NOT IN (SELECT bearbeiter_id FROM tickets);',
    expectedColumns: ['name'],
    hints: [
      'Führe nur die Unterabfrage aus. Fällt dir ein besonderer Wert in der Liste auf?',
      '`x NOT IN (1, 2, NULL)` bedeutet `x <> 1 AND x <> 2 AND x <> NULL`. Der letzte Vergleich ist nie wahr.',
      'SELECT name\nFROM bearbeitende\nWHERE bearbeiter_id NOT IN (\n  SELECT bearbeiter_id FROM tickets WHERE ___\n);',
    ],
    solution: 'SELECT name\nFROM bearbeitende\nWHERE bearbeiter_id NOT IN (\n  SELECT bearbeiter_id FROM tickets WHERE bearbeiter_id IS NOT NULL\n);',
    solutionExplanation:
      'Die Unterabfrage liefert auch NULL (nicht zugewiesene Tickets). Für Lars ergibt `5 <> NULL` „unbekannt“, damit ist die gesamte NOT-IN-Bedingung nicht wahr. Lösung: NULL in der Unterabfrage ausschließen – oder `NOT EXISTS` verwenden, das dieses Problem nicht hat.',
    check: q({ variants: [{ description: 'Eine zusätzliche aktive Bearbeiterin ohne Tickets.', setup: "INSERT INTO bearbeitende VALUES (6, 'Pia Lang', '1st Level', 1);" }] }),
    concepts: ['Unterabfragen', 'NULL', 'NOT IN & NULL'],
    tests: {
      accept: ['SELECT b.name FROM bearbeitende b WHERE NOT EXISTS (SELECT 1 FROM tickets t WHERE t.bearbeiter_id = b.bearbeiter_id)', 'SELECT b.name FROM bearbeitende b LEFT JOIN tickets t ON t.bearbeiter_id = b.bearbeiter_id WHERE t.ticket_id IS NULL'],
      reject: ['SELECT name FROM bearbeitende WHERE bearbeiter_id NOT IN (SELECT bearbeiter_id FROM tickets)', 'SELECT name FROM bearbeitende WHERE aktiv = 0'],
    },
  },
  {
    id: 'm12-e6',
    lessonId: 'm12',
    type: 'predict',
    difficulty: 3,
    db: 'vertrieb',
    title: 'Skalare Unterabfrage mit mehreren Zeilen',
    prompt: 'Es gibt zwei Software-Produkte (99,00 € und 39,90 €). Die Unterabfrage liefert also **zwei** Zeilen. Was passiert in **SQLite**?',
    starterSql: "SELECT name, preis\nFROM produkte\nWHERE preis = (SELECT preis FROM produkte WHERE kategorie = 'Software');",
    hints: [
      'Mit `=` erwartet man genau einen Vergleichswert.',
      'Viele Datenbanksysteme melden hier einen Fehler. SQLite ist großzügiger …',
      'SQLite verwendet bei einer skalaren Unterabfrage einfach die erste gelieferte Zeile.',
    ],
    choices: {
      options: [
        'Fehlermeldung: Unterabfrage liefert mehr als eine Zeile',
        'Nur „Office-Paket Jahreslizenz“ (die erste Zeile der Unterabfrage wird verwendet)',
        'Beide Software-Produkte',
        'Keine Zeile',
      ],
      correct: 1,
      explanation:
        'SQLite meldet keinen Fehler, sondern nimmt still den ersten Wert der Unterabfrage (99,00). PostgreSQL, SQL Server und MySQL brechen dagegen mit einem Fehler ab („more than one row returned by a subquery“). Richtig ist hier `WHERE preis IN (SELECT …)` – damit werden beide Produkte gefunden. Verlass dich nie auf das Verhalten von SQLite!',
    },
    solution: "SELECT name, preis\nFROM produkte\nWHERE preis IN (SELECT preis FROM produkte WHERE kategorie = 'Software');",
    solutionExplanation: 'Liefert eine Unterabfrage mehrere Werte, verwende IN (oder EXISTS) statt =.',
    concepts: ['Unterabfragen', 'IN'],
  },
  {
    id: 'm12-e7',
    lessonId: 'm12',
    type: 'write',
    difficulty: 3,
    db: 'vertrieb',
    title: 'Ladenhüter mit NOT EXISTS',
    prompt: 'Welche Produkte wurden **noch nie bestellt**? Zeige `produkt_id` und `name`. Verwende möglichst `NOT EXISTS`.',
    expectedColumns: ['produkt_id', 'name'],
    hints: [
      'Für jedes Produkt: Gibt es eine Bestellposition mit dieser `produkt_id`?',
      '`WHERE NOT EXISTS (SELECT 1 FROM bestellpositionen AS bp WHERE bp.produkt_id = p.produkt_id)`',
      'SELECT p.produkt_id, p.name\nFROM produkte AS p\nWHERE NOT EXISTS (\n  SELECT 1 FROM ___ AS bp\n  WHERE ___ = ___\n);',
    ],
    solution: 'SELECT p.produkt_id, p.name\nFROM produkte AS p\nWHERE NOT EXISTS (\n  SELECT 1 FROM bestellpositionen AS bp\n  WHERE bp.produkt_id = p.produkt_id\n);',
    solutionExplanation: 'NOT EXISTS ist wahr, wenn die korrelierte Unterabfrage keine Zeile findet. Gleichwertig: LEFT JOIN + `IS NULL` oder NOT IN (hier sicher, da `produkt_id` in Bestellpositionen nie NULL ist).',
    check: q({ variants: [{ description: 'Ein neues, noch nie bestelltes Produkt.', setup: "INSERT INTO produkte VALUES (13, 'Laptoptasche', 'Zubehör', 39.0, 40);" }] }),
    concepts: ['EXISTS', 'Unterabfragen'],
    tests: {
      accept: ['SELECT p.produkt_id, p.name FROM produkte p LEFT JOIN bestellpositionen bp ON bp.produkt_id = p.produkt_id WHERE bp.position_id IS NULL', 'SELECT produkt_id, name FROM produkte WHERE produkt_id NOT IN (SELECT produkt_id FROM bestellpositionen)'],
      reject: ['SELECT produkt_id, name FROM produkte WHERE produkt_id IN (10, 12)'],
    },
  },

  /* ---------------- Modul 14: INSERT, UPDATE, DELETE ---------------- */
  {
    id: 'm14-g1',
    lessonId: 'm14',
    guided: true,
    type: 'write',
    difficulty: 1,
    db: 'vertrieb',
    title: 'Ein Produkt einfügen',
    prompt:
      "Füge ein neues Produkt ein: `produkt_id` 13, Name „Laptoptasche“, Kategorie „Zubehör“, Preis 39.00, Lagerbestand 40.\n\nGeprüft wird der **Inhalt der Tabelle** nach deiner Anweisung. Mit „Ausführen“ änderst du deine Übungsdatenbank – mit „Zurücksetzen“ stellst du sie wieder her.",
    hints: [
      'Neue Zeilen fügt man mit INSERT ein. Gib die Spalten und die Werte in derselben Reihenfolge an.',
      '`INSERT INTO tabelle (spalte1, spalte2, …) VALUES (wert1, wert2, …);`',
      "INSERT INTO produkte (produkt_id, name, kategorie, preis, lagerbestand)\nVALUES (13, '___', '___', ___, ___);",
    ],
    solution: "INSERT INTO produkte (produkt_id, name, kategorie, preis, lagerbestand)\nVALUES (13, 'Laptoptasche', 'Zubehör', 39.00, 40);",
    solutionExplanation:
      'Die Spaltenliste macht die Anweisung robust und lesbar: Werte werden der Reihe nach den genannten Spalten zugeordnet. Texte in einfache Anführungszeichen, Zahlen ohne. Mit „Ausführen“ und anschließend `SELECT * FROM produkte;` kannst du dir das Ergebnis ansehen.',
    check: state({ stateQueries: [{ label: 'Tabelle produkte', sql: 'SELECT * FROM produkte ORDER BY produkt_id;' }] }),
    concepts: ['INSERT'],
    tests: {
      accept: ["INSERT INTO produkte VALUES (13, 'Laptoptasche', 'Zubehör', 39, 40);"],
      reject: ["INSERT INTO produkte VALUES (13, 'Laptoptasche', 'Zubehör', 39, 4);", "INSERT INTO produkte (produkt_id, name, preis) VALUES (13, 'Laptoptasche', 39);"],
    },
  },
  {
    id: 'm14-e1',
    lessonId: 'm14',
    type: 'write',
    difficulty: 1,
    db: 'vertrieb',
    title: 'Lagerbestand erhöhen',
    prompt: 'Es wurden **20 Webcams** (produkt_id 10) geliefert. Erhöhe den Lagerbestand dieses Produkts um 20. Alle anderen Produkte müssen unverändert bleiben.',
    hints: [
      'Der neue Wert ergibt sich aus dem alten Wert plus 20.',
      '`UPDATE tabelle SET spalte = spalte + 20 WHERE …;` – vergiss die WHERE-Bedingung nicht!',
      'UPDATE produkte\nSET lagerbestand = ___\nWHERE ___;',
    ],
    solution: 'UPDATE produkte\nSET lagerbestand = lagerbestand + 20\nWHERE produkt_id = 10;',
    solutionExplanation:
      '`SET lagerbestand = lagerbestand + 20` rechnet mit dem bisherigen Wert. Die WHERE-Bedingung über den Primärschlüssel stellt sicher, dass genau eine Zeile geändert wird. **Ohne WHERE würden alle Produkte geändert!**',
    check: state({ stateQueries: [{ label: 'Tabelle produkte', sql: 'SELECT * FROM produkte ORDER BY produkt_id;' }] }),
    concepts: ['UPDATE', 'UPDATE/DELETE ohne WHERE'],
    tests: {
      accept: ['UPDATE produkte SET lagerbestand = 25 WHERE produkt_id = 10', "UPDATE produkte SET lagerbestand = lagerbestand + 20 WHERE name = 'Webcam HD'"],
      reject: ['UPDATE produkte SET lagerbestand = lagerbestand + 20', 'UPDATE produkte SET lagerbestand = 20 WHERE produkt_id = 10'],
    },
  },
  {
    id: 'm14-e2',
    lessonId: 'm14',
    type: 'write',
    difficulty: 2,
    db: 'vertrieb',
    title: 'Preise einer Kategorie anpassen',
    prompt: 'Erhöhe die Preise aller Produkte der Kategorie **„Zubehör“** um **10 %** und runde auf 2 Nachkommastellen.',
    hints: [
      'Eine Anweisung kann mehrere Zeilen gleichzeitig ändern – welche, bestimmt WHERE.',
      '`SET preis = ROUND(preis * 1.10, 2) WHERE kategorie = …`',
      "UPDATE produkte\nSET preis = ROUND(___, 2)\nWHERE kategorie = '___';",
    ],
    solution: "UPDATE produkte\nSET preis = ROUND(preis * 1.10, 2)\nWHERE kategorie = 'Zubehör';",
    solutionExplanation: 'Für jede Zeile, die die WHERE-Bedingung erfüllt, wird der neue Preis aus dem alten berechnet. Tipp aus der Praxis: Vor einem UPDATE die WHERE-Bedingung mit einem SELECT testen.',
    check: state({
      stateQueries: [{ label: 'Tabelle produkte', sql: 'SELECT * FROM produkte ORDER BY produkt_id;' }],
      variants: [{ description: 'Ein zusätzliches Zubehör-Produkt.', setup: "INSERT INTO produkte VALUES (13, 'Laptoptasche', 'Zubehör', 39.0, 40);" }],
    }),
    concepts: ['UPDATE', 'Berechnungen'],
    tests: {
      accept: ["UPDATE produkte SET preis = ROUND(preis + preis * 0.1, 2) WHERE kategorie = 'Zubehör'"],
      reject: ['UPDATE produkte SET preis = ROUND(preis * 1.10, 2)', 'UPDATE produkte SET preis = ROUND(preis * 1.10, 2) WHERE produkt_id IN (4, 5, 6, 9, 10)', "UPDATE produkte SET preis = preis * 10 WHERE kategorie = 'Zubehör'"],
    },
  },
  {
    id: 'm14-e3',
    lessonId: 'm14',
    type: 'write',
    difficulty: 2,
    db: 'support',
    title: 'Statusereignisse löschen',
    prompt: 'Ticket 15 wurde versehentlich angelegt. Lösche als ersten Schritt **alle Statusereignisse von Ticket 15**. Andere Ereignisse dürfen nicht gelöscht werden.',
    hints: [
      'Zuerst überlegen: Welche Zeilen sollen weg? Das kannst du vorher mit SELECT prüfen.',
      '`DELETE FROM tabelle WHERE …;`',
      'DELETE FROM statusereignisse\nWHERE ___;',
    ],
    solution: 'DELETE FROM statusereignisse\nWHERE ticket_id = 15;',
    solutionExplanation:
      'DELETE entfernt alle Zeilen, die die WHERE-Bedingung erfüllen. Das Ticket selbst kann man erst löschen, wenn keine Ereignisse mehr darauf verweisen – sonst verletzt man den Fremdschlüssel (FOREIGN KEY constraint failed).',
    check: state({ stateQueries: [{ label: 'Tabelle statusereignisse', sql: 'SELECT * FROM statusereignisse ORDER BY ereignis_id;' }] }),
    concepts: ['DELETE', 'UPDATE/DELETE ohne WHERE'],
    tests: { accept: ['DELETE FROM statusereignisse WHERE ereignis_id = 38'], reject: ['DELETE FROM statusereignisse', 'DELETE FROM statusereignisse WHERE ticket_id = 14'] },
  },
  {
    id: 'm14-e4',
    lessonId: 'm14',
    type: 'fix',
    difficulty: 3,
    db: 'vertrieb',
    title: 'Gefährliches DELETE',
    prompt:
      'Es sollen nur die Bestellpositionen **stornierter Bestellungen** gelöscht werden. Die vorbereitete Anweisung würde jedoch **alle** Positionen löschen. Korrigiere sie, sodass die stornierten Bestellungen über ihren Status gefunden werden (nicht über fest eingetragene IDs).',
    starterSql: 'DELETE FROM bestellpositionen;',
    hints: [
      'Was fehlt einem DELETE, das nur bestimmte Zeilen treffen soll?',
      'Der Status steht nicht in `bestellpositionen`, sondern in `bestellungen`. Eine Unterabfrage mit IN hilft.',
      "DELETE FROM bestellpositionen\nWHERE bestellung_id IN (\n  SELECT ___ FROM bestellungen WHERE ___\n);",
    ],
    solution: "DELETE FROM bestellpositionen\nWHERE bestellung_id IN (\n  SELECT bestellung_id FROM bestellungen WHERE status = 'storniert'\n);",
    solutionExplanation:
      'Die Unterabfrage ermittelt die IDs der stornierten Bestellungen; DELETE löscht nur deren Positionen. Ohne WHERE wären alle 30 Positionen weg – in einer echten Datenbank ohne Sicherung ein ernstes Problem. Tipp: Erst `SELECT * FROM bestellpositionen WHERE …` ausführen, dann SELECT * durch DELETE ersetzen.',
    check: state({
      stateQueries: [{ label: 'Tabelle bestellpositionen', sql: 'SELECT * FROM bestellpositionen ORDER BY position_id;' }],
      variants: [{ description: 'Bestellung 12 ist in diesen Testdaten ebenfalls storniert.', setup: "UPDATE bestellungen SET status = 'storniert' WHERE bestellung_id = 12;" }],
    }),
    concepts: ['DELETE', 'Unterabfragen', 'UPDATE/DELETE ohne WHERE'],
    tests: {
      accept: ["DELETE FROM bestellpositionen WHERE EXISTS (SELECT 1 FROM bestellungen b WHERE b.bestellung_id = bestellpositionen.bestellung_id AND b.status = 'storniert')"],
      reject: ['DELETE FROM bestellpositionen', 'DELETE FROM bestellpositionen WHERE bestellung_id IN (7, 17)'],
    },
  },
  {
    id: 'm14-e5',
    lessonId: 'm14',
    type: 'write',
    difficulty: 3,
    db: 'support',
    title: 'Ticket zuweisen und protokollieren',
    prompt:
      "Ticket 8 wird **Kim Richter** (`bearbeiter_id` 1) zugewiesen. Schreibe **zwei Anweisungen**:\n\n1. Setze bei Ticket 8 `bearbeiter_id` auf 1 und `status` auf „in Bearbeitung“.\n2. Füge ein Statusereignis hinzu: `ereignis_id` 46, Ticket 8, Status „in Bearbeitung“, Zeitpunkt „2024-10-03 09:00“, `bearbeiter_id` 1.\n\nTrenne die Anweisungen mit einem Semikolon.",
    hints: [
      'Ein UPDATE kann mehrere Spalten auf einmal setzen. Danach folgt ein INSERT.',
      '`UPDATE … SET a = …, b = … WHERE …;` und `INSERT INTO … (…) VALUES (…);`',
      "UPDATE tickets\nSET bearbeiter_id = ___, status = '___'\nWHERE ticket_id = ___;\n\nINSERT INTO statusereignisse (ereignis_id, ticket_id, status, zeitpunkt, bearbeiter_id)\nVALUES (___);",
    ],
    solution:
      "UPDATE tickets\nSET bearbeiter_id = 1, status = 'in Bearbeitung'\nWHERE ticket_id = 8;\n\nINSERT INTO statusereignisse (ereignis_id, ticket_id, status, zeitpunkt, bearbeiter_id)\nVALUES (46, 8, 'in Bearbeitung', '2024-10-03 09:00', 1);",
    solutionExplanation:
      'Mehrere Spaltenzuweisungen werden in SET durch Komma getrennt (nicht mit AND!). `SET a = 1 AND b = 2` wäre ein logischer Ausdruck und würde a auf 0 oder 1 setzen. In echten Systemen fasst man solche zusammengehörenden Änderungen in einer Transaktion zusammen (BEGIN … COMMIT).',
    check: state({
      stateQueries: [
        { label: 'Tabelle tickets', sql: 'SELECT * FROM tickets ORDER BY ticket_id;' },
        { label: 'Tabelle statusereignisse', sql: 'SELECT * FROM statusereignisse ORDER BY ereignis_id;' },
      ],
    }),
    concepts: ['UPDATE', 'INSERT'],
    tests: {
      reject: [
        "UPDATE tickets SET bearbeiter_id = 1 AND status = 'in Bearbeitung' WHERE ticket_id = 8; INSERT INTO statusereignisse VALUES (46, 8, 'in Bearbeitung', '2024-10-03 09:00', 1);",
        "UPDATE tickets SET bearbeiter_id = 1, status = 'in Bearbeitung' WHERE ticket_id = 8;",
      ],
    },
  },
];
