import type { Exercise } from '../types';
import { q } from './helpers';

export const exercisesM13: Exercise[] = [
  {
    id: 'm13-g1',
    lessonId: 'm13',
    guided: true,
    type: 'write',
    difficulty: 1,
    db: 'vertrieb',
    title: 'Preisklassen bilden',
    prompt:
      'Ordne jedem Produkt eine Preisklasse zu. Zeige `name`, `preis` und eine neue Spalte `preisklasse` mit diesen Regeln:\n\n- ab 500 Euro: „teuer“\n- ab 50 Euro: „mittel“\n- sonst: „günstig“\n\n**Die Spaltennamen werden geprüft.**',
    expectedColumns: ['name', 'preis', 'preisklasse'],
    hints: [
      'Für jede Zeile soll abhängig vom Preis ein anderer Text erscheinen. Prüfe die teuerste Klasse zuerst.',
      'Schlüsselwörter: `CASE WHEN bedingung THEN wert … ELSE wert END AS name`.',
      "SELECT name, preis,\n       CASE\n         WHEN preis >= ___ THEN 'teuer'\n         WHEN preis >= ___ THEN '___'\n         ELSE '___'\n       END AS preisklasse\nFROM produkte;",
    ],
    solution:
      "SELECT name, preis,\n       CASE\n         WHEN preis >= 500 THEN 'teuer'\n         WHEN preis >= 50 THEN 'mittel'\n         ELSE 'günstig'\n       END AS preisklasse\nFROM produkte;",
    solutionExplanation:
      'CASE prüft die WHEN-Bedingungen von oben nach unten und nimmt den Wert der **ersten** zutreffenden. Ein Laptop für 1299 € erfüllt zwar auch `preis >= 50`, landet aber schon beim ersten WHEN. Trifft nichts zu, greift ELSE. `END AS preisklasse` schließt den Ausdruck ab und benennt die Spalte.',
    check: q({ columnNames: true }),
    concepts: ['CASE WHEN'],
    tests: {
      accept: ["SELECT name, preis, CASE WHEN preis < 50 THEN 'günstig' WHEN preis < 500 THEN 'mittel' ELSE 'teuer' END AS preisklasse FROM produkte"],
      reject: [
        "SELECT name, preis, CASE WHEN preis >= 50 THEN 'mittel' WHEN preis >= 500 THEN 'teuer' ELSE 'günstig' END AS preisklasse FROM produkte",
        "SELECT name, preis, CASE WHEN preis > 500 THEN 'teuer' WHEN preis > 50 THEN 'mittel' END AS preisklasse FROM produkte",
      ],
    },
  },
  {
    id: 'm13-e1',
    lessonId: 'm13',
    type: 'write',
    difficulty: 1,
    db: 'support',
    title: 'Prioritäten als Zahl',
    prompt:
      'Für eine Auswertung sollen Prioritäten als Zahl vorliegen. Zeige `ticket_id`, `prioritaet` und die Spalte `prio_stufe`: „hoch“ → 1, „mittel“ → 2, „niedrig“ → 3.\n\n**Die Spaltennamen werden geprüft.**',
    expectedColumns: ['ticket_id', 'prioritaet', 'prio_stufe'],
    hints: [
      'Es wird immer dieselbe Spalte auf Gleichheit mit festen Werten geprüft.',
      "Dafür gibt es die Kurzform: `CASE spalte WHEN 'wert1' THEN … WHEN 'wert2' THEN … END`.",
      "SELECT ticket_id, prioritaet,\n       CASE prioritaet\n         WHEN 'hoch' THEN ___\n         WHEN ___ THEN 2\n         WHEN ___ THEN ___\n       END AS prio_stufe\nFROM tickets;",
    ],
    solution: "SELECT ticket_id, prioritaet,\n       CASE prioritaet\n         WHEN 'hoch' THEN 1\n         WHEN 'mittel' THEN 2\n         WHEN 'niedrig' THEN 3\n       END AS prio_stufe\nFROM tickets;",
    solutionExplanation:
      "Die **einfache Form** `CASE spalte WHEN wert THEN …` vergleicht die Spalte nacheinander mit den Werten. Sie ist kürzer, kann aber nur auf Gleichheit prüfen. Die gleichwertige **allgemeine Form** wäre `CASE WHEN prioritaet = 'hoch' THEN 1 …`. Die Zahlen schreibt man ohne Anführungszeichen, damit eine echte Zahl entsteht.",
    check: q({ columnNames: true }),
    concepts: ['CASE WHEN'],
    tests: {
      accept: ["SELECT ticket_id, prioritaet, CASE WHEN prioritaet = 'hoch' THEN 1 WHEN prioritaet = 'mittel' THEN 2 ELSE 3 END AS prio_stufe FROM tickets"],
      reject: ["SELECT ticket_id, prioritaet, CASE prioritaet WHEN 'hoch' THEN 3 WHEN 'mittel' THEN 2 WHEN 'niedrig' THEN 1 END AS prio_stufe FROM tickets"],
    },
  },
  {
    id: 'm13-e2',
    lessonId: 'm13',
    type: 'predict',
    difficulty: 2,
    db: 'vertrieb',
    title: 'Reihenfolge der WHEN-Zweige',
    prompt: 'Das Produkt mit der `produkt_id` 1 kostet 1299 €. Was steht in der Spalte `klasse`?',
    starterSql:
      "SELECT name, preis,\n       CASE\n         WHEN preis >= 50 THEN 'mittel'\n         WHEN preis >= 500 THEN 'teuer'\n         ELSE 'günstig'\n       END AS klasse\nFROM produkte\nWHERE produkt_id = 1;",
    hints: [
      'In welcher Reihenfolge werden die WHEN-Bedingungen geprüft?',
      'CASE hört bei der ersten zutreffenden Bedingung auf.',
      'Ist `1299 >= 50` wahr?',
    ],
    choices: {
      options: ['teuer', 'mittel', 'günstig', 'teuer und mittel (zwei Zeilen)'],
      correct: 1,
      explanation:
        "CASE prüft von oben nach unten und nimmt die **erste** wahre Bedingung. `1299 >= 50` ist wahr, also „mittel“ – der Zweig für „teuer“ wird nie erreicht. Bei Bereichen deshalb immer von der strengsten Bedingung (größter Grenzwert) zur schwächsten ordnen. CASE liefert pro Zeile genau einen Wert, nie mehrere Zeilen.",
    },
    solution:
      "SELECT name, preis,\n       CASE\n         WHEN preis >= 500 THEN 'teuer'\n         WHEN preis >= 50 THEN 'mittel'\n         ELSE 'günstig'\n       END AS klasse\nFROM produkte\nWHERE produkt_id = 1;",
    solutionExplanation: 'Mit vertauschten WHEN-Zweigen (500 vor 50) erhält der Laptop korrekt „teuer“.',
    concepts: ['CASE WHEN'],
  },
  {
    id: 'm13-e3',
    lessonId: 'm13',
    type: 'fix',
    difficulty: 2,
    db: 'vertrieb',
    title: 'CASE und NULL',
    prompt:
      "Jeder Kunde soll einen E-Mail-Status bekommen: „fehlt“ bei NULL, „leer“ bei einer leeren Zeichenkette, sonst „vorhanden“. Die Abfrage läuft, aber Clara Fischer und Hannah Schulz (ohne E-Mail) bekommen fälschlich „vorhanden“. Korrigiere sie.\n\n**Die Spaltennamen werden geprüft.**",
    starterSql:
      "SELECT kunde_id,\n       CASE\n         WHEN email = NULL THEN 'fehlt'\n         WHEN email = '' THEN 'leer'\n         ELSE 'vorhanden'\n       END AS email_status\nFROM kunden;",
    expectedColumns: ['kunde_id', 'email_status'],
    hints: [
      'Welche der drei Bedingungen funktioniert nicht – und warum?',
      'Auch innerhalb von CASE ist `= NULL` nie wahr. Verwende den Operator aus Modul 6.',
      "SELECT kunde_id,\n       CASE\n         WHEN email ___ THEN 'fehlt'\n         WHEN email = '' THEN 'leer'\n         ELSE 'vorhanden'\n       END AS email_status\nFROM kunden;",
    ],
    solution:
      "SELECT kunde_id,\n       CASE\n         WHEN email IS NULL THEN 'fehlt'\n         WHEN email = '' THEN 'leer'\n         ELSE 'vorhanden'\n       END AS email_status\nFROM kunden;",
    solutionExplanation:
      "`email = NULL` ergibt „unbekannt“, also nie wahr. Bei NULL trifft deshalb auch `email = ''` nicht zu, und es landet im ELSE-Zweig. Mit `IS NULL` wird der fehlende Wert erkannt. Achtung bei der einfachen Form: `CASE email WHEN NULL THEN …` funktioniert aus demselben Grund nicht.",
    check: q({ columnNames: true }),
    concepts: ['CASE WHEN', 'NULL'],
    tests: {
      reject: ["SELECT kunde_id, CASE email WHEN NULL THEN 'fehlt' WHEN '' THEN 'leer' ELSE 'vorhanden' END AS email_status FROM kunden"],
    },
  },
  {
    id: 'm13-e4',
    lessonId: 'm13',
    type: 'write',
    difficulty: 2,
    db: 'forschung',
    title: 'Beobachtungen einordnen',
    prompt:
      'Ordne jede Beobachtung nach der gezählten Anzahl ein. Zeige `beobachtung_id`, `art`, `anzahl` und die Spalte `einordnung`:\n\n- Anzahl nicht erfasst (NULL): „nicht gezählt“\n- mindestens 100: „Kolonie“\n- mindestens 10: „Gruppe“\n- sonst: „Einzelsichtung“\n\n**Die Spaltennamen werden geprüft.**',
    expectedColumns: ['beobachtung_id', 'art', 'anzahl', 'einordnung'],
    hints: [
      'Was würde mit den NULL-Zeilen passieren, wenn du sie nicht ausdrücklich behandelst?',
      'Prüfe `IS NULL` als ersten WHEN-Zweig, danach die Grenzen von groß nach klein.',
      "SELECT beobachtung_id, art, anzahl,\n       CASE\n         WHEN anzahl ___ THEN 'nicht gezählt'\n         WHEN anzahl >= ___ THEN 'Kolonie'\n         WHEN ___ THEN 'Gruppe'\n         ELSE 'Einzelsichtung'\n       END AS einordnung\nFROM beobachtungen;",
    ],
    solution:
      "SELECT beobachtung_id, art, anzahl,\n       CASE\n         WHEN anzahl IS NULL THEN 'nicht gezählt'\n         WHEN anzahl >= 100 THEN 'Kolonie'\n         WHEN anzahl >= 10 THEN 'Gruppe'\n         ELSE 'Einzelsichtung'\n       END AS einordnung\nFROM beobachtungen;",
    solutionExplanation:
      'Ohne den ersten Zweig würden die beiden Strandhafer-Beobachtungen (anzahl NULL) im ELSE landen und als „Einzelsichtung“ gelten – fachlich falsch. Bei CASE mit ELSE muss man NULL immer bewusst behandeln.',
    check: q({ columnNames: true }),
    concepts: ['CASE WHEN', 'NULL'],
    tests: {
      reject: ["SELECT beobachtung_id, art, anzahl, CASE WHEN anzahl >= 100 THEN 'Kolonie' WHEN anzahl >= 10 THEN 'Gruppe' ELSE 'Einzelsichtung' END AS einordnung FROM beobachtungen"],
    },
  },
  {
    id: 'm13-e5',
    lessonId: 'm13',
    type: 'complete',
    difficulty: 2,
    db: 'support',
    title: 'Fachlich sortieren',
    prompt:
      'Alle Tickets sollen in der Reihenfolge des Bearbeitungsprozesses erscheinen: zuerst „offen“, dann „in Bearbeitung“, dann „gelöst“, zuletzt „geschlossen“. Innerhalb eines Status kommt das älteste Ticket zuerst.\n\nAlphabetisch sortiert stünde „gelöst“ vorne – das passt nicht zum Prozess. Ergänze die Lücken.\n\n**Die Reihenfolge wird geprüft.**',
    starterSql:
      "SELECT ticket_id, titel, status, erstellt_am\nFROM tickets\nORDER BY CASE status\n           WHEN 'offen' THEN 1\n           WHEN 'in Bearbeitung' THEN ___\n           WHEN ___ THEN 3\n           ELSE ___\n         END,\n         ___;",
    expectedColumns: ['ticket_id', 'titel', 'status', 'erstellt_am'],
    hints: [
      'CASE darf auch in ORDER BY stehen. Es liefert eine Rangzahl, die nur zum Sortieren dient und nicht angezeigt wird.',
      'Kleinere Zahlen stehen beim aufsteigenden Sortieren vorne. Das zweite Sortierkriterium ist das Erstellungsdatum.',
      "… ORDER BY CASE status\n           WHEN 'offen' THEN 1\n           WHEN 'in Bearbeitung' THEN 2\n           WHEN 'gelöst' THEN 3\n           ELSE 4\n         END,\n         erstellt_am;",
    ],
    solution:
      "SELECT ticket_id, titel, status, erstellt_am\nFROM tickets\nORDER BY CASE status\n           WHEN 'offen' THEN 1\n           WHEN 'in Bearbeitung' THEN 2\n           WHEN 'gelöst' THEN 3\n           ELSE 4\n         END,\n         erstellt_am;",
    solutionExplanation:
      'Texte werden alphabetisch sortiert – das passt selten zur fachlichen Reihenfolge. Der CASE-Ausdruck in ORDER BY übersetzt jeden Status in eine Rangzahl, nach der sortiert wird. Die Zahl taucht im Ergebnis nicht auf, weil sie nicht in SELECT steht.',
    check: q({ orderMatters: true }),
    concepts: ['CASE WHEN', 'ORDER BY'],
    tests: {
      reject: [
        'SELECT ticket_id, titel, status, erstellt_am FROM tickets ORDER BY status, erstellt_am',
        "SELECT ticket_id, titel, status, erstellt_am FROM tickets ORDER BY CASE status WHEN 'offen' THEN 1 WHEN 'in Bearbeitung' THEN 2 WHEN 'gelöst' THEN 3 ELSE 4 END, erstellt_am DESC",
      ],
    },
  },
  {
    id: 'm13-e6',
    lessonId: 'm13',
    type: 'write',
    difficulty: 3,
    db: 'vertrieb',
    title: 'Bestellstatus je Kunde zählen',
    prompt:
      'Erstelle eine Übersicht je Kunde (`kunde_id`, nur Kunden mit Bestellungen) mit vier Zahlen:\n\n- `gesamt`: alle Bestellungen\n- `in_arbeit`: Status „offen“ oder „versendet“\n- `geliefert`: Status „geliefert“\n- `storniert`: Status „storniert“\n\n**Die Spaltennamen werden geprüft.**',
    expectedColumns: ['kunde_id', 'gesamt', 'in_arbeit', 'geliefert', 'storniert'],
    hints: [
      'Eine Zeile je Kunde → GROUP BY. Für jede Teilzahl sollen nur bestimmte Zeilen der Gruppe zählen.',
      '„Bedingtes Zählen“: `SUM(CASE WHEN bedingung THEN 1 ELSE 0 END)` addiert für jede passende Zeile eine 1.',
      "SELECT kunde_id,\n       COUNT(*) AS gesamt,\n       SUM(CASE WHEN status IN (___) THEN 1 ELSE 0 END) AS in_arbeit,\n       SUM(CASE WHEN ___ THEN 1 ELSE 0 END) AS geliefert,\n       ___ AS storniert\nFROM bestellungen\nGROUP BY kunde_id;",
    ],
    solution:
      "SELECT kunde_id,\n       COUNT(*) AS gesamt,\n       SUM(CASE WHEN status IN ('offen', 'versendet') THEN 1 ELSE 0 END) AS in_arbeit,\n       SUM(CASE WHEN status = 'geliefert' THEN 1 ELSE 0 END) AS geliefert,\n       SUM(CASE WHEN status = 'storniert' THEN 1 ELSE 0 END) AS storniert\nFROM bestellungen\nGROUP BY kunde_id;",
    solutionExplanation:
      "Für jede Zeile der Gruppe liefert der CASE-Ausdruck 1 oder 0; SUM addiert die Einsen. So entstehen mehrere Teilzählungen in einer einzigen Abfrage – ohne mehrere WHERE-Bedingungen. Gleichwertig: `COUNT(CASE WHEN … THEN 1 END)`, denn ohne ELSE entsteht NULL, und COUNT ignoriert NULL. Wichtig ist `ELSE 0` bei SUM: Hätte ein Kunde gar keine passende Bestellung, käme ohne ELSE NULL statt 0 heraus.",
    check: q({
      columnNames: true,
      variants: [{ description: 'Zwei zusätzliche Bestellungen von Kunde 8.', setup: "INSERT INTO bestellungen VALUES (19, 8, 2, '2024-07-01', 'storniert', NULL); INSERT INTO bestellungen VALUES (20, 8, 2, '2024-07-02', 'versendet', NULL);" }],
    }),
    concepts: ['CASE WHEN', 'GROUP BY', 'Aggregate'],
    tests: {
      accept: [
        "SELECT kunde_id, COUNT(*) AS gesamt, COUNT(CASE WHEN status IN ('offen', 'versendet') THEN 1 END) AS in_arbeit, COUNT(CASE WHEN status = 'geliefert' THEN 1 END) AS geliefert, COUNT(CASE WHEN status = 'storniert' THEN 1 END) AS storniert FROM bestellungen GROUP BY kunde_id",
        "SELECT kunde_id, COUNT(*) AS gesamt, SUM(status IN ('offen', 'versendet')) AS in_arbeit, SUM(status = 'geliefert') AS geliefert, SUM(status = 'storniert') AS storniert FROM bestellungen GROUP BY kunde_id",
      ],
      reject: [
        "SELECT kunde_id, COUNT(*) AS gesamt, SUM(CASE WHEN status IN ('offen', 'versendet') THEN 1 END) AS in_arbeit, SUM(CASE WHEN status = 'geliefert' THEN 1 END) AS geliefert, SUM(CASE WHEN status = 'storniert' THEN 1 END) AS storniert FROM bestellungen GROUP BY kunde_id",
        "SELECT kunde_id, COUNT(*) AS gesamt, COUNT(CASE WHEN status IN ('offen', 'versendet') THEN 1 ELSE 0 END) AS in_arbeit, COUNT(CASE WHEN status = 'geliefert' THEN 1 ELSE 0 END) AS geliefert, COUNT(CASE WHEN status = 'storniert' THEN 1 ELSE 0 END) AS storniert FROM bestellungen GROUP BY kunde_id",
      ],
    },
  },
  {
    id: 'm13-e7',
    lessonId: 'm13',
    type: 'write',
    difficulty: 3,
    db: 'support',
    title: 'SLA-Status je Ticket',
    prompt:
      '**Kennzahl SLA-Status** für **jedes** Ticket (auch Tickets ohne Kategorie):\n\n- „offen“, wenn `geloest_am` NULL ist\n- „eingehalten“, wenn die Bearbeitungsdauer in Stunden (Modul 8) höchstens `ziel_stunden` der Kategorie beträgt\n- „überschritten“ sonst\n\nZeige `ticket_id` und `sla_status`.\n\n**Die Spaltennamen werden geprüft.**',
    expectedColumns: ['ticket_id', 'sla_status'],
    hints: [
      'Die Zielzeit steht in `kategorien`. Welcher JOIN behält auch Tickets ohne Kategorie?',
      'LEFT JOIN + CASE. Prüfe den Fall „offen“ zuerst, weil die Dauer dann NULL ist.',
      "SELECT t.ticket_id,\n       CASE\n         WHEN t.geloest_am IS NULL THEN 'offen'\n         WHEN (julianday(t.geloest_am) - julianday(t.erstellt_am)) * 24 <= ___ THEN 'eingehalten'\n         ELSE 'überschritten'\n       END AS sla_status\nFROM tickets AS t\n___ JOIN kategorien AS k ON ___;",
    ],
    solution:
      "SELECT t.ticket_id,\n       CASE\n         WHEN t.geloest_am IS NULL THEN 'offen'\n         WHEN (julianday(t.geloest_am) - julianday(t.erstellt_am)) * 24 <= k.ziel_stunden THEN 'eingehalten'\n         ELSE 'überschritten'\n       END AS sla_status\nFROM tickets AS t\nLEFT JOIN kategorien AS k ON k.kategorie_id = t.kategorie_id;",
    solutionExplanation:
      'Der LEFT JOIN behält Ticket 15 ohne Kategorie; ein INNER JOIN ließe es verschwinden. Die Reihenfolge der WHEN-Zweige ist entscheidend: Für ungelöste Tickets ist die Dauer NULL, der Vergleich `NULL <= ziel` also nie wahr – ohne den ersten Zweig landeten offene Tickets fälschlich bei „überschritten“.',
    check: q({ columnNames: true, variants: [{ description: 'Die Zielzeit für Hardware beträgt 100 statt 48 Stunden.', setup: 'UPDATE kategorien SET ziel_stunden = 100 WHERE kategorie_id = 1;' }] }),
    concepts: ['CASE WHEN', 'LEFT JOIN', 'Datum', 'NULL'],
    tests: {
      reject: [
        "SELECT t.ticket_id, CASE WHEN t.geloest_am IS NULL THEN 'offen' WHEN (julianday(t.geloest_am) - julianday(t.erstellt_am)) * 24 <= k.ziel_stunden THEN 'eingehalten' ELSE 'überschritten' END AS sla_status FROM tickets t JOIN kategorien k ON k.kategorie_id = t.kategorie_id",
        "SELECT t.ticket_id, CASE WHEN (julianday(t.geloest_am) - julianday(t.erstellt_am)) * 24 <= k.ziel_stunden THEN 'eingehalten' ELSE 'überschritten' END AS sla_status FROM tickets t LEFT JOIN kategorien k ON k.kategorie_id = t.kategorie_id",
      ],
    },
  },
  {
    id: 'm13-e8',
    lessonId: 'm13',
    type: 'explain',
    difficulty: 2,
    db: 'vertrieb',
    title: 'Fehlendes ELSE',
    prompt:
      'In dieser Abfrage fehlt der ELSE-Zweig. Führe sie aus und erkläre: Welchen Wert bekommen die günstigen Produkte – und warum? Wann ist ein fehlendes ELSE gewollt, wann ein Fehler?',
    starterSql: "SELECT name, preis,\n       CASE\n         WHEN preis >= 500 THEN 'teuer'\n         WHEN preis >= 50 THEN 'mittel'\n       END AS klasse\nFROM produkte;",
    hints: [
      'Sieh dir die Zeilen mit einem Preis unter 50 € an.',
      'Was liefert ein CASE-Ausdruck, wenn keine Bedingung zutrifft und nichts anderes angegeben ist?',
      'Denke an bedingtes Zählen mit COUNT: Dort ist dieses Verhalten nützlich.',
    ],
    modelAnswer:
      'Trifft keine WHEN-Bedingung zu und fehlt ELSE, liefert CASE **NULL**. Die Produkte unter 50 € (z. B. Maus, Tastatur, Druckerpapier) haben deshalb in `klasse` den Wert NULL.\n\nMeist ist das ein **Fehler**: Die Zeile wird dann bei `WHERE klasse = …` nie gefunden, beim Gruppieren entsteht eine NULL-Gruppe, und in Berichten fehlt die Beschriftung. Deshalb gibt man in der Regel einen ELSE-Zweig an – notfalls `ELSE \'unbekannt\'`.\n\n**Gewollt** ist das fehlende ELSE z. B. beim bedingten Zählen mit `COUNT(CASE WHEN … THEN 1 END)`: Nicht passende Zeilen werden zu NULL und von COUNT ignoriert.',
    solution: "SELECT name, preis,\n       CASE\n         WHEN preis >= 500 THEN 'teuer'\n         WHEN preis >= 50 THEN 'mittel'\n         ELSE 'günstig'\n       END AS klasse\nFROM produkte;",
    solutionExplanation: 'Siehe Musterantwort.',
    concepts: ['CASE WHEN', 'NULL'],
  },
];
