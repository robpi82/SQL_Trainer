import type { Exercise } from '../types';
import { q } from '../exercises/helpers';

/** Unterricht Tag 2: Datenmodellierung mit dem ERM (parallel zu Einsatz 512-002) */
export const exercisesTag2: Exercise[] = [
  {
    id: 'k02-g1',
    lessonId: 'k02',
    guided: true,
    type: 'write',
    difficulty: 1,
    db: 'lieferdb',
    title: 'Das Modell lesen: Inhalt einer Lieferung',
    prompt:
      'Im ERM ist die n:m-Beziehung zwischen Lieferung und Ware über die Zwischenentität **Position** aufgelöst. Lies das Modell mit SQL: Welche Waren stecken in **Lieferung 1** und wie viele Kisten jeweils? Zeige `bezeichnung` und `menge_kisten`.',
    expectedColumns: ['bezeichnung', 'menge_kisten'],
    hints: [
      'Die Menge steht in der Zwischentabelle `positionen`, die Bezeichnung in `waren`. Welche Linie im ERM verbindet die beiden?',
      'JOIN über den Fremdschlüssel `positionen.ware_id` auf den Primärschlüssel `waren.ware_id`, dann WHERE auf die Lieferung.',
      'SELECT w.bezeichnung, p.menge_kisten\nFROM positionen AS p\nJOIN waren AS w ON ___ = ___\nWHERE p.lieferung_id = ___;',
    ],
    solution: 'SELECT w.bezeichnung, p.menge_kisten\nFROM positionen AS p\nJOIN waren AS w ON w.ware_id = p.ware_id\nWHERE p.lieferung_id = 1;',
    solutionExplanation:
      'Jede Linie im ERM wird zu einer JOIN-Bedingung „Fremdschlüssel = Primärschlüssel“. Die Zwischentabelle `positionen` enthält pro Paar (Lieferung, Ware) eine Zeile mit der Menge – genau das Attribut, das zu keiner der beiden Entitäten allein gehört.',
    check: q(),
    concepts: ['ERM', 'JOIN'],
    tests: { reject: ['SELECT w.bezeichnung, p.menge_kisten FROM positionen p JOIN waren w ON w.ware_id = p.lieferung_id WHERE p.lieferung_id = 1'] },
  },
  {
    id: 'k02-c1',
    lessonId: 'k02',
    type: 'choice',
    difficulty: 1,
    db: 'lieferdb',
    title: 'Entität oder Attribut?',
    prompt: 'Im Lastenheft steht: „Für eine Station speichern wir den Namen und die Region.“ Was ist **Region** im ERM?',
    hints: [
      'Hat „Region“ eigene Eigenschaften, über die wir etwas speichern?',
      'Entität = Karteikarte mit mehreren Feldern, Attribut = ein Feld auf der Karte.',
      'Die Region ist ein einzelner Wert, der eine Station beschreibt.',
    ],
    choices: {
      options: ['Eine Entität', 'Ein Attribut der Station', 'Eine Beziehung zwischen Station und Lieferung', 'Ein Primärschlüssel'],
      correct: 1,
      explanation:
        'Die Region ist ein einzelner Wert, der die Station beschreibt – ein Attribut. Erst wenn wir über Regionen selbst mehrere Angaben speichern wollten (z. B. Fläche, zuständige Behörde), würde daraus eine eigene Entität.',
    },
    solution: '–',
    solutionExplanation: 'Region ist ein Attribut der Entität Station.',
    concepts: ['ERM'],
  },
  {
    id: 'k02-c2',
    lessonId: 'k02',
    type: 'choice',
    difficulty: 2,
    db: 'lieferdb',
    title: 'Kapitäne und Schiffe',
    prompt:
      'Erweiterung des Modells: „Eine Kapitänin fährt im Lauf der Jahre **mehrere Schiffe**. Ein Schiff hat nacheinander **mehrere Kapitäne**.“ Welche Kardinalität hat die Beziehung Kapitän – Schiff?',
    hints: [
      'Satzprobe in beide Richtungen formulieren.',
      'Eine Kapitänin → wie viele Schiffe? Ein Schiff → wie viele Kapitäne?',
      'Zweimal „viele“ ergibt …',
    ],
    choices: {
      options: ['1 : 1', '1 : n', 'n : m', 'Gar keine Beziehung – der Kapitän ist ein Attribut'],
      correct: 2,
      explanation:
        'In beide Richtungen „viele“ → n:m. Damit reicht das Attribut `kapitaen` beim Schiff nicht mehr: Es entsteht eine Entität Kapitän und eine Zwischentabelle (z. B. `kommandos`) mit von/bis-Datum – genau die Aufgabe „Für Schnelle“ aus dem Einsatz.',
    },
    solution: '–',
    solutionExplanation: 'n:m – Auflösung über eine Zwischentabelle kommandos(kapitaen_id, schiff_id, von, bis).',
    concepts: ['ERM', 'Beziehungen'],
  },
  {
    id: 'k02-c3',
    lessonId: 'k02',
    type: 'choice',
    difficulty: 2,
    db: 'lieferdb',
    title: 'Eine Leitung pro Station',
    prompt:
      '„Jede Station hat **genau eine** Leiterin oder einen Leiter. Eine Person leitet **höchstens eine** Station.“ Wie wird diese Beziehung in Tabellen umgesetzt?',
    hints: [
      'Satzprobe: eins zu eins.',
      'Bei 1:1 steht der Fremdschlüssel auf einer Seite. Was verhindert, dass dieselbe Person zweimal eingetragen wird?',
      'Fremdschlüssel plus eine Regel, die jeden Wert nur einmal erlaubt.',
    ],
    choices: {
      options: [
        'Zwischentabelle mit zwei Fremdschlüsseln',
        'Fremdschlüssel leitung_id in stationen mit UNIQUE',
        'Fremdschlüssel station_id in stationen',
        'Beide Tabellen bekommen denselben Primärschlüssel ohne Fremdschlüssel',
      ],
      correct: 1,
      explanation:
        'Eine 1:1-Beziehung wird wie 1:n umgesetzt – plus UNIQUE auf dem Fremdschlüssel. So kann jede Person höchstens einmal als Leitung eingetragen werden. In der Pinguin-Station ist das die Tabelle `logger` mit `ring_id TEXT NOT NULL UNIQUE`.',
    },
    solution: '–',
    solutionExplanation: '1:1 = Fremdschlüssel auf einer Seite + UNIQUE (bei Pflichtbeziehung zusätzlich NOT NULL).',
    concepts: ['ERM', 'Beziehungen'],
  },
  {
    id: 'k02-c4',
    lessonId: 'k02',
    type: 'choice',
    difficulty: 2,
    db: 'lieferdb',
    title: 'Wohin mit der Note?',
    prompt:
      'Eine Weiterbildungsfirma speichert, welche Teilnehmenden welche Kurse belegen. Für **jede Belegung** gibt es eine Note. Wohin gehört das Attribut „Note“?',
    hints: [
      'Hat ein Teilnehmer immer dieselbe Note – in jedem Kurs?',
      'Hat ein Kurs für alle Teilnehmenden dieselbe Note?',
      'Die Note hängt am Paar – wie die Menge in der Position.',
    ],
    choices: {
      options: ['Zum Teilnehmer', 'Zum Kurs', 'In die Zwischentabelle Belegung', 'In eine eigene Tabelle Noten ohne Fremdschlüssel'],
      correct: 2,
      explanation:
        'Teilnehmer – Kurs ist n:m, die Note gehört zum Paar „dieser Teilnehmer in diesem Kurs“. Sie steht deshalb in der Zwischentabelle Belegung – genau wie `menge_kisten` in `positionen`. Das ist eine klassische Prüfungsaufgabe.',
    },
    solution: '–',
    solutionExplanation: 'Belegung(TeilnehmerID, KursID, Note) mit zusammengesetztem Schlüssel (TeilnehmerID, KursID).',
    concepts: ['ERM', 'Beziehungen'],
  },
  {
    id: 'k02-c5',
    lessonId: 'k02',
    type: 'choice',
    difficulty: 3,
    db: 'lieferdb',
    title: 'Wenn eine Ware mehrfach vorkommt',
    prompt:
      'Neue Anforderung: Tiefkühlware kommt in **verschiedenen Chargen** mit eigenem Haltbarkeitsdatum. Dieselbe Ware kann deshalb in **einer** Lieferung **mehrmals** vorkommen. Reicht der Schlüssel `(lieferung_id, ware_id)` der Position noch?',
    hints: [
      'Ein Primärschlüssel muss jede Zeile eindeutig machen.',
      'Zwei Chargen Tiefkühlware in Lieferung 2 hätten dasselbe Paar (2, 4).',
      'Man braucht entweder ein drittes Schlüsselattribut oder einen künstlichen Schlüssel.',
    ],
    choices: {
      options: [
        'Ja, das Paar bleibt eindeutig',
        'Nein – z. B. (lieferung_id, ware_id, charge) oder eine eigene position_id als Schlüssel',
        'Nein – ware_id allein als Schlüssel',
        'Man lässt den Primärschlüssel einfach weg',
      ],
      correct: 1,
      explanation:
        'Kommt dieselbe Ware mehrmals pro Lieferung vor, wiederholt sich das Paar. Entweder wird die Charge Teil des Schlüssels oder die Position bekommt einen künstlichen Schlüssel `position_id` (dann ggf. UNIQUE auf (lieferung_id, ware_id, charge)). Die Wahl des Schlüssels folgt immer aus den fachlichen Regeln.',
    },
    solution: '–',
    solutionExplanation: 'Schlüssel aus den Fachregeln ableiten: Was macht eine Zeile eindeutig?',
    concepts: ['ERM', 'Schlüssel'],
  },
  {
    id: 'k02-c6',
    lessonId: 'k02',
    type: 'choice',
    difficulty: 1,
    db: 'lieferdb',
    title: 'Krähenfuß lesen',
    prompt: 'Im Krähenfuß-Diagramm (siehe Lektion) hat die Linie zwischen Schiff und Lieferung **zwei Striche am Schiff** und einen **Krähenfuß an der Lieferung**. Was bedeutet das – und wo steht der Fremdschlüssel?',
    hints: ['Zwei Striche = genau eins, Krähenfuß = viele.', 'Der Fremdschlüssel steht auf der n-Seite.', 'Wo ist der Krähenfuß?'],
    choices: {
      options: [
        'Eine Lieferung hat viele Schiffe; Fremdschlüssel in schiffe',
        'Ein Schiff bringt viele Lieferungen; Fremdschlüssel schiff_id in lieferungen',
        'n:m; Zwischentabelle nötig',
        'Ein Schiff bringt genau eine Lieferung; kein Fremdschlüssel nötig',
      ],
      correct: 1,
      explanation: 'Krähenfuß an der Lieferung = viele Lieferungen pro Schiff (1:n). Der Fremdschlüssel steht dort, wo der Krähenfuß ist: `lieferungen.schiff_id`.',
    },
    solution: '–',
    solutionExplanation: '1:n, Fremdschlüssel auf der n-Seite.',
    concepts: ['ERM'],
  },
  {
    id: 'k02-c7',
    lessonId: 'k02',
    type: 'choice',
    difficulty: 2,
    db: 'lieferdb',
    title: 'Wie viele Tabellen?',
    prompt:
      'Ein ERM enthält die Entitäten Schiff, Station, Lieferung und Ware. Schiff–Lieferung und Station–Lieferung sind 1:n, Lieferung–Ware ist n:m mit dem Attribut „Menge“. Wie viele Tabellen entstehen bei der Überführung?',
    hints: ['Regel 1: Jede Entität wird eine Tabelle.', 'Regel 4: 1:n braucht nur einen Fremdschlüssel – keine neue Tabelle.', 'Regel 5: n:m wird zu einer zusätzlichen Tabelle.'],
    choices: {
      options: ['4', '5', '6', '7'],
      correct: 1,
      explanation:
        'Vier Entitäten = vier Tabellen. Die beiden 1:n-Beziehungen werden zu Fremdschlüsseln in `lieferungen`. Die n:m-Beziehung wird zur fünften Tabelle `positionen`.',
    },
    solution: '–',
    solutionExplanation: '4 Entitäten + 1 Zwischentabelle = 5 Tabellen.',
    concepts: ['ERM'],
  },
  {
    id: 'k02-e1',
    lessonId: 'k02',
    type: 'write',
    difficulty: 2,
    db: 'lieferdb',
    title: 'Vielfalt je Station',
    prompt:
      'Wie viele **verschiedene Waren** hat jede Station insgesamt erhalten? Zeige `station` (Name der Station) und `waren`, sortiert nach `waren` absteigend.\n\nFolge dafür im ERM dem Weg Station → Lieferung → Position.\n\n**Spaltennamen und Reihenfolge werden geprüft.**',
    expectedColumns: ['station', 'waren'],
    hints: [
      'Drei Tabellen hintereinander: stationen, lieferungen, positionen. Die Bezeichnung der Ware brauchst du nicht – die ware_id reicht zum Zählen.',
      'Dieselbe Ware kann in mehreren Lieferungen einer Station vorkommen: `COUNT(DISTINCT p.ware_id)`.',
      'SELECT s.name AS station, COUNT(DISTINCT p.ware_id) AS waren\nFROM stationen AS s\nJOIN lieferungen AS l ON ___\nJOIN positionen AS p ON ___\nGROUP BY s.station_id, s.name\nORDER BY waren DESC;',
    ],
    solution:
      'SELECT s.name AS station, COUNT(DISTINCT p.ware_id) AS waren\nFROM stationen AS s\nJOIN lieferungen AS l ON l.station_id = s.station_id\nJOIN positionen AS p ON p.lieferung_id = l.lieferung_id\nGROUP BY s.station_id, s.name\nORDER BY waren DESC;',
    solutionExplanation:
      'Der JOIN-Weg folgt den Linien des ERM. `COUNT(*)` würde Positionen zählen (Station CBW: 9), `COUNT(DISTINCT p.ware_id)` zählt verschiedene Waren (5). Lieferung 5 hat noch keine Positionen und fällt beim INNER JOIN weg – für diese Frage ist das richtig.',
    check: q({ columnNames: true, orderMatters: true }),
    concepts: ['ERM', 'JOIN', 'Aggregate'],
    tests: { reject: ['SELECT s.name AS station, COUNT(*) AS waren FROM stationen s JOIN lieferungen l ON l.station_id = s.station_id JOIN positionen p ON p.lieferung_id = l.lieferung_id GROUP BY s.station_id ORDER BY waren DESC'] },
  },
  {
    id: 'k02-e2',
    lessonId: 'k02',
    type: 'predict',
    difficulty: 2,
    db: 'lieferdb',
    title: 'Zeilen nach dem JOIN',
    prompt: 'Es gibt 6 Lieferungen und 14 Positionen. Lieferung 5 hat noch keine Position. Wie viele Zeilen liefert diese Abfrage?',
    starterSql: 'SELECT COUNT(*) AS zeilen\nFROM lieferungen AS l\nJOIN positionen AS p ON p.lieferung_id = l.lieferung_id;',
    hints: ['Ein JOIN erzeugt eine Zeile pro passendem Paar.', 'Jede Position gehört zu genau einer Lieferung.', 'Was passiert beim INNER JOIN mit Lieferung 5?'],
    choices: {
      options: ['6', '14', '15', '84'],
      correct: 1,
      explanation:
        'Jede der 14 Positionen findet genau ihre Lieferung → 14 Zeilen. Die Lieferung erscheint so oft, wie sie Positionen hat (1:n vervielfacht die 1-Seite). Lieferung 5 ohne Position fällt beim INNER JOIN weg; mit LEFT JOIN wären es 15. 84 = 6 × 14 wäre das kartesische Produkt ohne ON-Bedingung.',
    },
    solution: 'SELECT COUNT(*) AS zeilen\nFROM lieferungen AS l\nJOIN positionen AS p ON p.lieferung_id = l.lieferung_id;',
    solutionExplanation: '14 Zeilen – eine pro Position.',
    concepts: ['JOIN-Vervielfachung', 'ERM'],
  },
  {
    id: 'k02-e3',
    lessonId: 'k02',
    type: 'explain',
    difficulty: 3,
    db: 'lieferdb',
    title: 'Für Schnelle: Kapitäne als eigene Entität',
    prompt:
      'Bisher steht der Kapitän als Text beim Schiff (`schiffe.kapitaen`). Was ändert sich am Modell, wenn eine Kapitänin im Lauf der Jahre **verschiedene Schiffe** fährt und wir über Kapitäne **mehr speichern** wollen, etwa Heimathafen und Patentnummer? Beschreibe die neuen Entitäten, Beziehungen, Attribute und Schlüssel.',
    starterSql: 'SELECT schiff_id, name, kapitaen FROM schiffe;',
    hints: [
      'Wenn ein „Wert“ eigene Eigenschaften bekommt, wird er zur Entität.',
      'Kapitän – Schiff ist n:m (vgl. Wissensfrage „Kapitäne und Schiffe“). Was gehört zum Paar?',
      'Denke an Zeiträume: von wann bis wann hatte jemand das Kommando?',
    ],
    modelAnswer:
      '- **Neue Entität Kapitän** (`kapitaene`): `kapitaen_id` (Primärschlüssel), `name` (Pflicht), `heimathafen`, `patentnummer` (eindeutig, also UNIQUE).\n- Die Spalte `kapitaen` im Schiff entfällt, weil sie jetzt eine eigene Entität ist.\n- **Beziehung Kapitän – Schiff ist n:m** → Zwischenentität **Kommando** (`kommandos`) mit den Fremdschlüsseln `kapitaen_id` und `schiff_id`.\n- Zum Paar gehören die Attribute **von** und **bis** (bis optional, solange das Kommando läuft).\n- **Schlüssel des Kommandos:** Dieselbe Person kann dasselbe Schiff mehrmals führen (zu verschiedenen Zeiten), deshalb reicht `(kapitaen_id, schiff_id)` nicht – Schlüssel `(kapitaen_id, schiff_id, von)`.\n- Sinnvolle Regel: `bis` leer oder nicht vor `von`.\n\nIn Tag 3 baust du genau diese Tabellen.',
    solution: 'SELECT schiff_id, name, kapitaen FROM schiffe;',
    solutionExplanation: 'Siehe Musterantwort.',
    concepts: ['ERM', 'Beziehungen', 'Schlüssel'],
  },
];
