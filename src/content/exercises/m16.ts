import type { Exercise } from '../types';
import { q } from './helpers';

/**
 * Modul 16: Gemischte Analyseaufgaben in drei kleinen Praxisprojekten.
 * Jede Aufgabe kombiniert Konzepte aus mehreren früheren Modulen; neue Konzepte kommen nicht hinzu.
 */
export const exercisesM16: Exercise[] = [
  {
    id: 'm16-g1',
    lessonId: 'm16',
    guided: true,
    type: 'write',
    difficulty: 2,
    db: 'vertrieb',
    title: 'Die umsatzstärksten Kunden',
    prompt:
      '**Fragestellung der Vertriebsleitung:** Wer sind unsere drei umsatzstärksten Kunden?\n\n**Kennzahl:** Umsatz = Summe aus `menge * einzelpreis` aller Positionen von Bestellungen, die **nicht storniert** sind.\n\n**Ergebnis:** eine Zeile pro Kunde mit `kunde` (Vorname und Nachname mit Leerzeichen), `bestellungen` (Anzahl der nicht stornierten Bestellungen) und `umsatz` (auf 2 Stellen gerundet). Nur die drei Kunden mit dem höchsten Umsatz, höchster zuerst.\n\n**Spaltennamen und Reihenfolge werden geprüft.**',
    expectedColumns: ['kunde', 'bestellungen', 'umsatz'],
    hints: [
      'Gehe nach der Methode vor: Welche drei Tabellen brauchst du? Was ist „eine Zeile“ nach dem JOIN – und was soll eine Ergebniszeile sein?',
      'Nach dem JOIN mit `bestellpositionen` steht jede Bestellung so oft da, wie sie Positionen hat. Für die Anzahl der Bestellungen brauchst du deshalb `COUNT(DISTINCT …)`.',
      "SELECT k.vorname || ' ' || k.nachname AS kunde,\n       COUNT(DISTINCT b.bestellung_id) AS bestellungen,\n       ROUND(SUM(bp.menge * bp.einzelpreis), 2) AS umsatz\nFROM kunden AS k\nJOIN bestellungen AS b ON ___\nJOIN bestellpositionen AS bp ON ___\nWHERE ___\nGROUP BY k.kunde_id, k.vorname, k.nachname\nORDER BY ___\nLIMIT ___;",
    ],
    solution:
      "SELECT k.vorname || ' ' || k.nachname AS kunde,\n       COUNT(DISTINCT b.bestellung_id) AS bestellungen,\n       ROUND(SUM(bp.menge * bp.einzelpreis), 2) AS umsatz\nFROM kunden AS k\nJOIN bestellungen AS b ON b.kunde_id = k.kunde_id\nJOIN bestellpositionen AS bp ON bp.bestellung_id = b.bestellung_id\nWHERE b.status <> 'storniert'\nGROUP BY k.kunde_id, k.vorname, k.nachname\nORDER BY umsatz DESC\nLIMIT 3;",
    solutionExplanation:
      'Nach den beiden JOINs ist **eine Zeile = eine Bestellposition**. SUM über diese Zeilen ergibt korrekt den Umsatz. `COUNT(*)` würde dagegen Positionen zählen (Anna Schmidt hätte 5 statt 3) – deshalb `COUNT(DISTINCT b.bestellung_id)`. Stornos werden vor dem Gruppieren mit WHERE entfernt. Gruppiert wird nach der ID, damit zwei Kunden mit gleichem Namen nicht zusammenfallen.',
    check: q({ columnNames: true, orderMatters: true }),
    concepts: ['Analyse', 'JOIN-Vervielfachung', 'GROUP BY'],
    tests: {
      reject: [
        "SELECT k.vorname || ' ' || k.nachname AS kunde, COUNT(*) AS bestellungen, ROUND(SUM(bp.menge * bp.einzelpreis), 2) AS umsatz FROM kunden k JOIN bestellungen b ON b.kunde_id = k.kunde_id JOIN bestellpositionen bp ON bp.bestellung_id = b.bestellung_id WHERE b.status <> 'storniert' GROUP BY k.kunde_id ORDER BY umsatz DESC LIMIT 3",
        "SELECT k.vorname || ' ' || k.nachname AS kunde, COUNT(DISTINCT b.bestellung_id) AS bestellungen, ROUND(SUM(bp.menge * bp.einzelpreis), 2) AS umsatz FROM kunden k JOIN bestellungen b ON b.kunde_id = k.kunde_id JOIN bestellpositionen bp ON bp.bestellung_id = b.bestellung_id GROUP BY k.kunde_id ORDER BY umsatz DESC LIMIT 3",
      ],
    },
  },

  /* ---------------- Projekt A: Vertriebsanalyse ---------------- */
  {
    id: 'm16-a1',
    lessonId: 'm16',
    type: 'write',
    difficulty: 2,
    db: 'vertrieb',
    title: 'Projekt Vertrieb 1: Umsatz je Kategorie',
    prompt:
      '**Fragestellung:** Welche Produktkategorien tragen wie viel zum Umsatz bei?\n\n**Kennzahl:** Umsatz wie in der angeleiteten Übung (nur nicht stornierte Bestellungen).\n\n**Ergebnis:** `kategorie` und `umsatz` (2 Stellen gerundet), höchster Umsatz zuerst. Produkte **ohne Kategorie** sollen unter dem Namen „ohne Kategorie“ erscheinen, falls sie Umsatz haben.\n\n**Spaltennamen und Reihenfolge werden geprüft.**',
    expectedColumns: ['kategorie', 'umsatz'],
    hints: [
      'Welche drei Tabellen werden gebraucht? Der Status steht in `bestellungen`, die Kategorie in `produkte`.',
      "Für den Ersatznamen bei NULL hilft `CASE WHEN p.kategorie IS NULL THEN 'ohne Kategorie' ELSE p.kategorie END` (Modul 13). Gruppiere nach diesem Ausdruck bzw. seinem Alias.",
      "SELECT CASE WHEN p.kategorie IS NULL THEN 'ohne Kategorie' ELSE p.kategorie END AS kategorie,\n       ROUND(SUM(bp.menge * bp.einzelpreis), 2) AS umsatz\nFROM bestellpositionen AS bp\nJOIN produkte AS p ON ___\nJOIN bestellungen AS b ON ___\nWHERE ___\nGROUP BY ___\nORDER BY ___;",
    ],
    solution:
      "SELECT CASE WHEN p.kategorie IS NULL THEN 'ohne Kategorie' ELSE p.kategorie END AS kategorie,\n       ROUND(SUM(bp.menge * bp.einzelpreis), 2) AS umsatz\nFROM bestellpositionen AS bp\nJOIN produkte AS p ON p.produkt_id = bp.produkt_id\nJOIN bestellungen AS b ON b.bestellung_id = bp.bestellung_id\nWHERE b.status <> 'storniert'\nGROUP BY 1\nORDER BY umsatz DESC;",
    solutionExplanation:
      "Ausgangspunkt sind die Positionen, denn dort steht der Umsatz. Die Kategorie kommt aus `produkte`, der Status aus `bestellungen`. Ohne den CASE-Ausdruck würde die Gruppe der Produkte ohne Kategorie als NULL erscheinen. `GROUP BY 1` bedeutet „nach der ersten Spalte im SELECT“ – gleichwertig ist der Alias `kategorie` oder der ganze CASE-Ausdruck. In anderen Datenbanken ist dafür auch `COALESCE(p.kategorie, 'ohne Kategorie')` üblich.",
    check: q({
      columnNames: true,
      orderMatters: true,
      variants: [{ description: 'Eine zusätzliche Position mit Druckerpapier (Produkt ohne Kategorie) in einer gelieferten Bestellung.', setup: 'INSERT INTO bestellpositionen VALUES (31, 13, 12, 10, 5.99);' }],
    }),
    concepts: ['Analyse', 'JOIN', 'GROUP BY', 'CASE WHEN'],
    tests: {
      accept: ["SELECT COALESCE(p.kategorie, 'ohne Kategorie') AS kategorie, ROUND(SUM(bp.menge * bp.einzelpreis), 2) AS umsatz FROM bestellpositionen bp JOIN produkte p USING (produkt_id) JOIN bestellungen b USING (bestellung_id) WHERE b.status <> 'storniert' GROUP BY COALESCE(p.kategorie, 'ohne Kategorie') ORDER BY umsatz DESC"],
      reject: [
        'SELECT p.kategorie, ROUND(SUM(bp.menge * bp.einzelpreis), 2) AS umsatz FROM bestellpositionen bp JOIN produkte p USING (produkt_id) JOIN bestellungen b USING (bestellung_id) WHERE b.status <> \'storniert\' GROUP BY p.kategorie ORDER BY umsatz DESC',
        "SELECT CASE WHEN p.kategorie IS NULL THEN 'ohne Kategorie' ELSE p.kategorie END AS kategorie, ROUND(SUM(bp.menge * p.preis), 2) AS umsatz FROM bestellpositionen bp JOIN produkte p USING (produkt_id) JOIN bestellungen b USING (bestellung_id) WHERE b.status <> 'storniert' GROUP BY 1 ORDER BY umsatz DESC",
      ],
    },
  },
  {
    id: 'm16-a2',
    lessonId: 'm16',
    type: 'write',
    difficulty: 3,
    db: 'vertrieb',
    title: 'Projekt Vertrieb 2: Durchschnittlicher Bestellwert',
    prompt:
      '**Fragestellung:** Wie hoch ist der durchschnittliche Bestellwert pro Monat?\n\n**Kennzahl:** Bestellwert = Summe der Positionen **einer Bestellung**. Durchschnittlicher Bestellwert eines Monats = Umsatz des Monats ÷ Anzahl der Bestellungen des Monats. Stornierte Bestellungen zählen nicht.\n\n**Ergebnis:** `monat` (JJJJ-MM), `bestellungen` und `bestellwert` (2 Stellen gerundet), chronologisch.\n\n**Spaltennamen und Reihenfolge werden geprüft.**',
    expectedColumns: ['monat', 'bestellungen', 'bestellwert'],
    hints: [
      'Vorsicht Granularität: Nach dem JOIN ist eine Zeile eine **Position**, nicht eine Bestellung. Was liefert dann `AVG(menge * einzelpreis)`?',
      'Teile die Umsatzsumme durch die Anzahl **verschiedener** Bestellungen: `SUM(…) / COUNT(DISTINCT …)`.',
      "SELECT strftime('%Y-%m', b.bestelldatum) AS monat,\n       COUNT(DISTINCT b.bestellung_id) AS bestellungen,\n       ROUND(SUM(bp.menge * bp.einzelpreis) / COUNT(DISTINCT ___), 2) AS bestellwert\nFROM bestellungen AS b\nJOIN bestellpositionen AS bp ON ___\nWHERE ___\nGROUP BY monat\nORDER BY monat;",
    ],
    solution:
      "SELECT strftime('%Y-%m', b.bestelldatum) AS monat,\n       COUNT(DISTINCT b.bestellung_id) AS bestellungen,\n       ROUND(SUM(bp.menge * bp.einzelpreis) / COUNT(DISTINCT b.bestellung_id), 2) AS bestellwert\nFROM bestellungen AS b\nJOIN bestellpositionen AS bp ON bp.bestellung_id = b.bestellung_id\nWHERE b.status <> 'storniert'\nGROUP BY monat\nORDER BY monat;",
    solutionExplanation:
      '`AVG(bp.menge * bp.einzelpreis)` wäre der durchschnittliche **Positionswert** – im Januar 499,43 statt 998,85, weil jede Bestellung dort zwei Positionen hat. Die Kennzahl verlangt den Durchschnitt pro **Bestellung**, also Umsatz geteilt durch die Zahl der verschiedenen Bestellungen. Ganzzahldivision droht hier nicht, weil die Preise Dezimalzahlen sind.',
    check: q({ columnNames: true, orderMatters: true }),
    concepts: ['Analyse', 'JOIN-Vervielfachung', 'Aggregate', 'Datum'],
    tests: {
      reject: ["SELECT strftime('%Y-%m', b.bestelldatum) AS monat, COUNT(DISTINCT b.bestellung_id) AS bestellungen, ROUND(AVG(bp.menge * bp.einzelpreis), 2) AS bestellwert FROM bestellungen b JOIN bestellpositionen bp ON bp.bestellung_id = b.bestellung_id WHERE b.status <> 'storniert' GROUP BY monat ORDER BY monat"],
    },
  },
  {
    id: 'm16-a3',
    lessonId: 'm16',
    type: 'write',
    difficulty: 3,
    db: 'vertrieb',
    title: 'Projekt Vertrieb 3: Kundenstatus',
    prompt:
      '**Fragestellung:** Welche Kunden sind aktiv, welche sollten wir wieder ansprechen?\n\n**Kennzahl Kundenstatus** (Stichtag 30.06.2024, alle Bestellungen unabhängig vom Status):\n\n- „ohne Bestellung“: Der Kunde hat nie bestellt.\n- „aktiv“: Die letzte Bestellung war am **01.05.2024 oder später**.\n- „inaktiv“: sonst.\n\n**Ergebnis:** **alle** Kunden mit `kunde_id`, `letzte_bestellung` (Datum oder NULL) und `kundenstatus`.\n\n**Die Spaltennamen werden geprüft.**',
    expectedColumns: ['kunde_id', 'letzte_bestellung', 'kundenstatus'],
    hints: [
      'Alle Kunden, auch ohne Bestellung → LEFT JOIN. Das letzte Bestelldatum je Kunde liefert eine Aggregatfunktion.',
      'In CASE darfst du Aggregatfunktionen verwenden: `CASE WHEN MAX(b.bestelldatum) IS NULL THEN … WHEN MAX(b.bestelldatum) >= … THEN … ELSE … END`.',
      "SELECT k.kunde_id,\n       MAX(b.bestelldatum) AS letzte_bestellung,\n       CASE\n         WHEN MAX(b.bestelldatum) IS NULL THEN '___'\n         WHEN MAX(b.bestelldatum) >= '___' THEN 'aktiv'\n         ELSE '___'\n       END AS kundenstatus\nFROM kunden AS k\nLEFT JOIN bestellungen AS b ON ___\nGROUP BY k.kunde_id;",
    ],
    solution:
      "SELECT k.kunde_id,\n       MAX(b.bestelldatum) AS letzte_bestellung,\n       CASE\n         WHEN MAX(b.bestelldatum) IS NULL THEN 'ohne Bestellung'\n         WHEN MAX(b.bestelldatum) >= '2024-05-01' THEN 'aktiv'\n         ELSE 'inaktiv'\n       END AS kundenstatus\nFROM kunden AS k\nLEFT JOIN bestellungen AS b ON b.kunde_id = k.kunde_id\nGROUP BY k.kunde_id;",
    solutionExplanation:
      'Der LEFT JOIN behält Kunden ohne Bestellung; MAX ergibt bei ihnen NULL. CASE wird **nach** dem Gruppieren ausgewertet und kann deshalb auf das Gruppenergebnis `MAX(…)` zugreifen. Die NULL-Prüfung steht zuerst, denn `NULL >= …` wäre nie wahr und würde im ELSE („inaktiv“) landen.',
    check: q({
      columnNames: true,
      variants: [{ description: 'Kundin 8 (bisher ohne Bestellung) bestellt am 15.06.2024; Kunde 7 bestellt am 30.04.2024 erneut.', setup: "INSERT INTO bestellungen VALUES (19, 8, 2, '2024-06-15', 'offen', NULL); INSERT INTO bestellungen VALUES (20, 7, 3, '2024-04-30', 'geliefert', '2024-05-03');" }],
    }),
    concepts: ['Analyse', 'LEFT JOIN', 'CASE WHEN', 'Aggregate'],
    tests: {
      reject: [
        "SELECT k.kunde_id, MAX(b.bestelldatum) AS letzte_bestellung, CASE WHEN MAX(b.bestelldatum) >= '2024-05-01' THEN 'aktiv' ELSE 'inaktiv' END AS kundenstatus FROM kunden k LEFT JOIN bestellungen b ON b.kunde_id = k.kunde_id GROUP BY k.kunde_id",
        "SELECT k.kunde_id, MAX(b.bestelldatum) AS letzte_bestellung, CASE WHEN MAX(b.bestelldatum) IS NULL THEN 'ohne Bestellung' WHEN MAX(b.bestelldatum) >= '2024-05-01' THEN 'aktiv' ELSE 'inaktiv' END AS kundenstatus FROM kunden k JOIN bestellungen b ON b.kunde_id = k.kunde_id GROUP BY k.kunde_id",
      ],
    },
  },

  /* ---------------- Projekt B: Forschungsbericht ---------------- */
  {
    id: 'm16-b1',
    lessonId: 'm16',
    type: 'write',
    difficulty: 2,
    db: 'forschung',
    title: 'Projekt Forschung 1: Beobachtungen je Insel',
    prompt:
      '**Fragestellung:** Auf welchen Inseln wird wie viel beobachtet – und wo gar nichts?\n\n**Ergebnis:** **alle** Inseln mit `insel`, `region`, `beobachtungen` (Anzahl) und `arten` (Anzahl verschiedener Arten). Inseln ohne Station oder ohne Beobachtung erscheinen mit 0. Sortiert nach `beobachtungen` absteigend, bei Gleichstand nach Inselname.\n\n**Spaltennamen und Reihenfolge werden geprüft.**',
    expectedColumns: ['insel', 'region', 'beobachtungen', 'arten'],
    hints: [
      'Die Kette lautet Insel → Station → Beobachtung. Damit keine Insel verloren geht, müssen **beide** Verknüpfungen LEFT JOINs sein.',
      'Gezählt werden nur vorhandene Beobachtungen: `COUNT(b.beobachtung_id)` statt `COUNT(*)`, und `COUNT(DISTINCT b.art)`.',
      'SELECT i.name AS insel, i.region,\n       COUNT(b.beobachtung_id) AS beobachtungen,\n       COUNT(DISTINCT b.art) AS arten\nFROM inseln AS i\nLEFT JOIN stationen AS s ON ___\nLEFT JOIN beobachtungen AS b ON ___\nGROUP BY i.insel_id, i.name, i.region\nORDER BY ___ DESC, ___;',
    ],
    solution:
      'SELECT i.name AS insel, i.region,\n       COUNT(b.beobachtung_id) AS beobachtungen,\n       COUNT(DISTINCT b.art) AS arten\nFROM inseln AS i\nLEFT JOIN stationen AS s ON s.insel_id = i.insel_id\nLEFT JOIN beobachtungen AS b ON b.station_id = s.station_id\nGROUP BY i.insel_id, i.name, i.region\nORDER BY beobachtungen DESC, insel;',
    solutionExplanation:
      'Wäre der zweite JOIN ein INNER JOIN, fielen Inseln ohne Beobachtung wieder heraus – ein LEFT JOIN wirkt nur, solange alle folgenden Verknüpfungen ebenfalls LEFT JOINs sind. `COUNT(*)` würde Spiekeroog und Neuwerk je 1 statt 0 geben, weil der LEFT JOIN für sie eine Zeile mit NULL erzeugt.',
    check: q({ columnNames: true, orderMatters: true }),
    concepts: ['Analyse', 'LEFT JOIN', 'COUNT(*) vs. COUNT(spalte)'],
    tests: {
      reject: [
        'SELECT i.name AS insel, i.region, COUNT(b.beobachtung_id) AS beobachtungen, COUNT(DISTINCT b.art) AS arten FROM inseln i LEFT JOIN stationen s ON s.insel_id = i.insel_id JOIN beobachtungen b ON b.station_id = s.station_id GROUP BY i.insel_id ORDER BY beobachtungen DESC, insel',
        'SELECT i.name AS insel, i.region, COUNT(*) AS beobachtungen, COUNT(DISTINCT b.art) AS arten FROM inseln i LEFT JOIN stationen s ON s.insel_id = i.insel_id LEFT JOIN beobachtungen b ON b.station_id = s.station_id GROUP BY i.insel_id ORDER BY beobachtungen DESC, insel',
      ],
    },
  },
  {
    id: 'm16-b2',
    lessonId: 'm16',
    type: 'write',
    difficulty: 3,
    db: 'forschung',
    title: 'Projekt Forschung 2: Temperaturbericht Juni',
    prompt:
      '**Fragestellung:** Wie warm war es im **Juni 2024** an den einzelnen Stationen?\n\n**Kennzahlen** je Station (nur Messgröße „Lufttemperatur“, nur Messungen mit Wert):\n\n- `messungen`: Anzahl gültiger Messungen\n- `minimum`, `maximum`: niedrigste und höchste Temperatur\n- `spanne`: Maximum minus Minimum, auf 1 Stelle gerundet\n\n**Ergebnis:** `station` (Stationsname), die vier Kennzahlen; nur Stationen mit mindestens einer gültigen Messung im Juni. Sortiert nach `maximum` absteigend.\n\nAchtung: `zeitpunkt` enthält auch die Uhrzeit.\n\n**Spaltennamen und Reihenfolge werden geprüft.**',
    expectedColumns: ['station', 'messungen', 'minimum', 'maximum', 'spanne'],
    hints: [
      'Filter auf Zeilen: Messgröße und Zeitraum. Wie erfasst du den ganzen 30. Juni, obwohl dort eine Uhrzeit steht?',
      "`strftime('%Y-%m', zeitpunkt) = '2024-06'` erfasst den ganzen Monat. MIN, MAX und COUNT(wert) ignorieren NULL von selbst – aber eine Station nur mit Sensorausfällen hätte dann 0 Messungen.",
      "SELECT s.name AS station,\n       COUNT(m.wert) AS messungen,\n       MIN(m.wert) AS minimum,\n       MAX(m.wert) AS maximum,\n       ROUND(MAX(m.wert) - MIN(m.wert), 1) AS spanne\nFROM stationen AS s\nJOIN messwerte AS m ON ___\nWHERE m.messgroesse = '___'\n  AND strftime('%Y-%m', m.zeitpunkt) = '___'\n  AND m.wert ___\nGROUP BY s.station_id, s.name\nORDER BY ___;",
    ],
    solution:
      "SELECT s.name AS station,\n       COUNT(m.wert) AS messungen,\n       MIN(m.wert) AS minimum,\n       MAX(m.wert) AS maximum,\n       ROUND(MAX(m.wert) - MIN(m.wert), 1) AS spanne\nFROM stationen AS s\nJOIN messwerte AS m ON m.station_id = s.station_id\nWHERE m.messgroesse = 'Lufttemperatur'\n  AND strftime('%Y-%m', m.zeitpunkt) = '2024-06'\n  AND m.wert IS NOT NULL\nGROUP BY s.station_id, s.name\nORDER BY maximum DESC;",
    solutionExplanation:
      "`BETWEEN '2024-06-01' AND '2024-06-30'` wäre zu knapp: '2024-06-30 18:00' ist als Text größer als '2024-06-30' und fiele heraus (Modul 6). `m.wert IS NOT NULL` sorgt dafür, dass Stationen nur mit Sensorausfall gar nicht erst erscheinen. Bei der Dünenstation Amrum zählt der Ausfall am 15.06. nicht als Messung.",
    check: q({
      columnNames: true,
      orderMatters: true,
      variants: [
        {
          description: "Zusätzliche Messungen: Station 1 am 30.06.2024 um 18:00 (25,0 °C) und Station 2 nur mit einem Sensorausfall am 20.06.",
          setup: "INSERT INTO messwerte VALUES (27, 1, '2024-06-30 18:00', 'Lufttemperatur', 25.0, '°C'); UPDATE messwerte SET wert = NULL WHERE station_id = 2 AND zeitpunkt LIKE '2024-06%';",
        },
      ],
    }),
    concepts: ['Analyse', 'Datum', 'Aggregate', 'NULL'],
    tests: {
      accept: ["SELECT s.name AS station, COUNT(m.wert) AS messungen, MIN(m.wert) AS minimum, MAX(m.wert) AS maximum, ROUND(MAX(m.wert) - MIN(m.wert), 1) AS spanne FROM stationen s JOIN messwerte m ON m.station_id = s.station_id WHERE m.messgroesse = 'Lufttemperatur' AND m.zeitpunkt >= '2024-06-01' AND m.zeitpunkt < '2024-07-01' GROUP BY s.station_id HAVING COUNT(m.wert) > 0 ORDER BY maximum DESC"],
      reject: [
        "SELECT s.name AS station, COUNT(m.wert) AS messungen, MIN(m.wert) AS minimum, MAX(m.wert) AS maximum, ROUND(MAX(m.wert) - MIN(m.wert), 1) AS spanne FROM stationen s JOIN messwerte m ON m.station_id = s.station_id WHERE m.messgroesse = 'Lufttemperatur' AND m.zeitpunkt BETWEEN '2024-06-01' AND '2024-06-30' AND m.wert IS NOT NULL GROUP BY s.station_id ORDER BY maximum DESC",
        "SELECT s.name AS station, COUNT(m.wert) AS messungen, MIN(m.wert) AS minimum, MAX(m.wert) AS maximum, ROUND(MAX(m.wert) - MIN(m.wert), 1) AS spanne FROM stationen s JOIN messwerte m ON m.station_id = s.station_id WHERE m.messgroesse = 'Lufttemperatur' AND m.zeitpunkt LIKE '2024-06%' GROUP BY s.station_id ORDER BY maximum DESC",
      ],
    },
  },
  {
    id: 'm16-b3',
    lessonId: 'm16',
    type: 'write',
    difficulty: 3,
    db: 'forschung',
    title: 'Projekt Forschung 3: Anteile der Fachgebiete',
    prompt:
      '**Fragestellung:** Welchen Anteil an allen Beobachtungen hat jedes Fachgebiet?\n\n**Kennzahl:** Anteil in % = Beobachtungen des Fachgebiets ÷ alle Beobachtungen **mit erfasster Person** × 100, auf 1 Stelle gerundet.\n\n**Ergebnis:** `fachgebiet`, `beobachtungen`, `anteil_prozent`; nur Fachgebiete mit Beobachtungen. Sortiert nach Anteil absteigend, bei Gleichstand nach Fachgebiet.\n\n**Spaltennamen und Reihenfolge werden geprüft.**',
    expectedColumns: ['fachgebiet', 'beobachtungen', 'anteil_prozent'],
    hints: [
      'Zähler: Anzahl je Fachgebiet (JOIN + GROUP BY). Nenner: **eine** Zahl für alle – die liefert eine skalare Unterabfrage (Modul 12).',
      'Achtung Ganzzahldivision: `5 / 23` ergibt 0. Multipliziere zuerst mit `100.0`.',
      'SELECT f.fachgebiet,\n       COUNT(*) AS beobachtungen,\n       ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM beobachtungen WHERE ___), 1) AS anteil_prozent\nFROM beobachtungen AS b\nJOIN forschende AS f ON ___\nGROUP BY f.fachgebiet\nORDER BY ___ DESC, ___;',
    ],
    solution:
      'SELECT f.fachgebiet,\n       COUNT(*) AS beobachtungen,\n       ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM beobachtungen WHERE forscher_id IS NOT NULL), 1) AS anteil_prozent\nFROM beobachtungen AS b\nJOIN forschende AS f ON f.forscher_id = b.forscher_id\nGROUP BY f.fachgebiet\nORDER BY anteil_prozent DESC, f.fachgebiet;',
    solutionExplanation:
      'Die Unterabfrage liefert den Nenner (23 Beobachtungen mit Person) für jede Gruppe gleich. Ohne `100.0` würde SQLite ganzzahlig teilen und überall 0 liefern. Zur **Plausibilisierung**: Die Anteile müssen zusammen etwa 100 % ergeben (52,2 + 30,4 + 8,7 + 8,7 = 100). Mit `COUNT(*)` aller 24 Beobachtungen als Nenner kämen nur 95,8 % heraus – ein Hinweis, dass Zähler und Nenner nicht zusammenpassen.',
    check: q({
      columnNames: true,
      orderMatters: true,
      variants: [{ description: 'Drei zusätzliche Botanik-Beobachtungen und eine weitere ohne erfasste Person.', setup: "INSERT INTO beobachtungen VALUES (25, 8, 7, '2024-08-02', 'Strandhafer', NULL, NULL), (26, 8, 7, '2024-08-03', 'Meersenf', 40, NULL), (27, 8, 9, '2024-08-04', 'Strandhafer', NULL, NULL), (28, 4, NULL, '2024-08-05', 'Eiderente', 12, NULL);" }],
    }),
    concepts: ['Analyse', 'Unterabfragen', 'GROUP BY', 'Berechnungen'],
    tests: {
      reject: [
        'SELECT f.fachgebiet, COUNT(*) AS beobachtungen, ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM beobachtungen), 1) AS anteil_prozent FROM beobachtungen b JOIN forschende f ON f.forscher_id = b.forscher_id GROUP BY f.fachgebiet ORDER BY anteil_prozent DESC, f.fachgebiet',
        'SELECT f.fachgebiet, COUNT(*) AS beobachtungen, ROUND(COUNT(*) * 100 / (SELECT COUNT(*) FROM beobachtungen WHERE forscher_id IS NOT NULL), 1) AS anteil_prozent FROM beobachtungen b JOIN forschende f ON f.forscher_id = b.forscher_id GROUP BY f.fachgebiet ORDER BY anteil_prozent DESC, f.fachgebiet',
        'SELECT f.fachgebiet, COUNT(*) AS beobachtungen, ROUND(COUNT(*) * 100.0 / 23, 1) AS anteil_prozent FROM beobachtungen b JOIN forschende f ON f.forscher_id = b.forscher_id GROUP BY f.fachgebiet ORDER BY anteil_prozent DESC, f.fachgebiet',
      ],
    },
  },

  /* ---------------- Projekt C: Support-Monatsbericht ---------------- */
  {
    id: 'm16-c1',
    lessonId: 'm16',
    type: 'write',
    difficulty: 2,
    db: 'support',
    title: 'Projekt Support 1: Auslastung des Teams',
    prompt:
      '**Fragestellung:** Wie sind die Tickets auf das Team verteilt?\n\n**Ergebnis:** **alle** Bearbeitenden mit `name`, `team`, `gesamt` (zugewiesene Tickets), `in_arbeit` (Status „offen“ oder „in Bearbeitung“) und `erledigt` (Status „gelöst“ oder „geschlossen“). Wer keine Tickets hat, erscheint mit 0. Sortiert nach `gesamt` absteigend, bei Gleichstand nach Name.\n\n**Spaltennamen und Reihenfolge werden geprüft.**',
    expectedColumns: ['name', 'team', 'gesamt', 'in_arbeit', 'erledigt'],
    hints: [
      'Alle Bearbeitenden → LEFT JOIN mit `tickets`. Drei Zahlen pro Person → GROUP BY und bedingtes Zählen (Modul 13).',
      "`COUNT(t.ticket_id)` für gesamt; `SUM(CASE WHEN t.status IN ('offen', 'in Bearbeitung') THEN 1 ELSE 0 END)` für in_arbeit.",
      "SELECT b.name, b.team,\n       COUNT(t.ticket_id) AS gesamt,\n       SUM(CASE WHEN t.status IN (___) THEN 1 ELSE 0 END) AS in_arbeit,\n       SUM(CASE WHEN t.status IN (___) THEN 1 ELSE 0 END) AS erledigt\nFROM bearbeitende AS b\nLEFT JOIN tickets AS t ON ___\nGROUP BY b.bearbeiter_id, b.name, b.team\nORDER BY ___;",
    ],
    solution:
      "SELECT b.name, b.team,\n       COUNT(t.ticket_id) AS gesamt,\n       SUM(CASE WHEN t.status IN ('offen', 'in Bearbeitung') THEN 1 ELSE 0 END) AS in_arbeit,\n       SUM(CASE WHEN t.status IN ('gelöst', 'geschlossen') THEN 1 ELSE 0 END) AS erledigt\nFROM bearbeitende AS b\nLEFT JOIN tickets AS t ON t.bearbeiter_id = b.bearbeiter_id\nGROUP BY b.bearbeiter_id, b.name, b.team\nORDER BY gesamt DESC, b.name;",
    solutionExplanation:
      'Für Lars Engel erzeugt der LEFT JOIN eine Zeile mit `t.status` NULL: `COUNT(t.ticket_id)` ergibt 0, und die CASE-Ausdrücke fallen ins `ELSE 0`. **Plausibilisierung:** `in_arbeit + erledigt` muss für jede Person `gesamt` ergeben – sonst gibt es einen Status, den die Kennzahl nicht abdeckt. Nicht zugewiesene Tickets (bearbeiter_id NULL) tauchen in dieser Sicht bewusst nicht auf.',
    check: q({ columnNames: true, orderMatters: true }),
    concepts: ['Analyse', 'LEFT JOIN', 'CASE WHEN', 'GROUP BY'],
    tests: {
      accept: ["SELECT b.name, b.team, COUNT(t.ticket_id) AS gesamt, COUNT(CASE WHEN t.status IN ('offen', 'in Bearbeitung') THEN 1 END) AS in_arbeit, COUNT(CASE WHEN t.status IN ('gelöst', 'geschlossen') THEN 1 END) AS erledigt FROM bearbeitende b LEFT JOIN tickets t ON t.bearbeiter_id = b.bearbeiter_id GROUP BY b.bearbeiter_id ORDER BY gesamt DESC, b.name"],
      reject: [
        "SELECT b.name, b.team, COUNT(*) AS gesamt, SUM(CASE WHEN t.status IN ('offen', 'in Bearbeitung') THEN 1 ELSE 0 END) AS in_arbeit, SUM(CASE WHEN t.status IN ('gelöst', 'geschlossen') THEN 1 ELSE 0 END) AS erledigt FROM bearbeitende b LEFT JOIN tickets t ON t.bearbeiter_id = b.bearbeiter_id GROUP BY b.bearbeiter_id ORDER BY gesamt DESC, b.name",
        "SELECT b.name, b.team, COUNT(t.ticket_id) AS gesamt, SUM(CASE WHEN t.status IN ('offen', 'in Bearbeitung') THEN 1 ELSE 0 END) AS in_arbeit, SUM(CASE WHEN t.status IN ('gelöst', 'geschlossen') THEN 1 ELSE 0 END) AS erledigt FROM bearbeitende b JOIN tickets t ON t.bearbeiter_id = b.bearbeiter_id GROUP BY b.bearbeiter_id ORDER BY gesamt DESC, b.name",
      ],
    },
  },
  {
    id: 'm16-c2',
    lessonId: 'm16',
    type: 'write',
    difficulty: 3,
    db: 'support',
    title: 'Projekt Support 2: Bearbeitungszeit je Kategorie',
    prompt:
      '**Fragestellung:** Welche Kategorie hat die längste durchschnittliche Bearbeitungszeit – und liegt sie über der Zielzeit?\n\n**Kennzahl:** Bearbeitungsdauer = Stunden zwischen `erstellt_am` und `geloest_am`, nur für gelöste Tickets (Modul 8).\n\n**Ergebnis:** `kategorie` (Name), `geloeste_tickets`, `durchschnitt_stunden` (1 Stelle gerundet) und `ziel_stunden`; nur Kategorien mit mindestens einem gelösten Ticket. Längste Durchschnittsdauer zuerst.\n\n**Spaltennamen und Reihenfolge werden geprüft.**',
    expectedColumns: ['kategorie', 'geloeste_tickets', 'durchschnitt_stunden', 'ziel_stunden'],
    hints: [
      'Die Zielzeit steht in `kategorien`, die Zeiten in `tickets`. Welche Tickets fließen in die Kennzahl ein?',
      'JOIN, `WHERE t.geloest_am IS NOT NULL`, GROUP BY je Kategorie. `ziel_stunden` ist innerhalb einer Kategorie überall gleich – nimm es in GROUP BY auf.',
      'SELECT k.name AS kategorie,\n       COUNT(*) AS geloeste_tickets,\n       ROUND(AVG((julianday(t.geloest_am) - julianday(t.erstellt_am)) * 24), 1) AS durchschnitt_stunden,\n       k.ziel_stunden\nFROM tickets AS t\nJOIN kategorien AS k ON ___\nWHERE ___\nGROUP BY k.kategorie_id, k.name, k.ziel_stunden\nORDER BY ___;',
    ],
    solution:
      'SELECT k.name AS kategorie,\n       COUNT(*) AS geloeste_tickets,\n       ROUND(AVG((julianday(t.geloest_am) - julianday(t.erstellt_am)) * 24), 1) AS durchschnitt_stunden,\n       k.ziel_stunden\nFROM tickets AS t\nJOIN kategorien AS k ON k.kategorie_id = t.kategorie_id\nWHERE t.geloest_am IS NOT NULL\nGROUP BY k.kategorie_id, k.name, k.ziel_stunden\nORDER BY durchschnitt_stunden DESC;',
    solutionExplanation:
      'Ohne die WHERE-Bedingung würde `COUNT(*)` auch offene Tickets zählen – AVG ignoriert deren NULL-Dauer zwar, die Spalte `geloeste_tickets` wäre aber falsch. Hardware liegt mit 61,9 Stunden im Schnitt deutlich über der Zielzeit von 48 Stunden. Ein Durchschnitt kann allerdings durch Ausreißer (hier 120 Stunden für einen neuen Laptop) verzerrt sein – ein Blick auf die Einzelwerte gehört zur Analyse dazu.',
    check: q({ columnNames: true, orderMatters: true }),
    concepts: ['Analyse', 'Datum', 'Aggregate', 'JOIN'],
    tests: {
      reject: ['SELECT k.name AS kategorie, COUNT(*) AS geloeste_tickets, ROUND(AVG((julianday(t.geloest_am) - julianday(t.erstellt_am)) * 24), 1) AS durchschnitt_stunden, k.ziel_stunden FROM tickets t JOIN kategorien k ON k.kategorie_id = t.kategorie_id GROUP BY k.kategorie_id ORDER BY durchschnitt_stunden DESC'],
    },
  },
  {
    id: 'm16-c3',
    lessonId: 'm16',
    type: 'write',
    difficulty: 3,
    db: 'support',
    title: 'Projekt Support 3: SLA-Quote je Priorität',
    prompt:
      '**Fragestellung:** Halten wir unsere Zielzeiten bei dringenden Tickets besser ein als bei unwichtigen?\n\n**Kennzahl SLA-Quote:** Anteil der gelösten Tickets, deren Bearbeitungsdauer **höchstens** `ziel_stunden` ihrer Kategorie beträgt, in Prozent (1 Stelle gerundet). Grundlage sind nur gelöste Tickets mit Kategorie.\n\n**Ergebnis:** `prioritaet`, `geloest`, `eingehalten`, `quote_prozent`. Sortiert fachlich: hoch, mittel, niedrig.\n\n**Spaltennamen und Reihenfolge werden geprüft.**',
    expectedColumns: ['prioritaet', 'geloest', 'eingehalten', 'quote_prozent'],
    hints: [
      'Eine Zeile pro Priorität. „eingehalten“ ist bedingtes Zählen; die Quote ist eingehalten ÷ geloest × 100.',
      'Den CASE-Ausdruck für „eingehalten“ brauchst du zweimal (Zählung und Quote) – oder du rechnest `100.0 * SUM(…) / COUNT(*)`. Die fachliche Sortierung gelingt mit CASE in ORDER BY.',
      "SELECT t.prioritaet,\n       COUNT(*) AS geloest,\n       SUM(CASE WHEN (julianday(t.geloest_am) - julianday(t.erstellt_am)) * 24 <= k.ziel_stunden THEN 1 ELSE 0 END) AS eingehalten,\n       ROUND(100.0 * SUM(CASE WHEN ___ THEN 1 ELSE 0 END) / COUNT(*), 1) AS quote_prozent\nFROM tickets AS t\nJOIN kategorien AS k ON ___\nWHERE ___\nGROUP BY t.prioritaet\nORDER BY CASE t.prioritaet WHEN 'hoch' THEN 1 WHEN 'mittel' THEN 2 ELSE 3 END;",
    ],
    solution:
      "SELECT t.prioritaet,\n       COUNT(*) AS geloest,\n       SUM(CASE WHEN (julianday(t.geloest_am) - julianday(t.erstellt_am)) * 24 <= k.ziel_stunden THEN 1 ELSE 0 END) AS eingehalten,\n       ROUND(100.0 * SUM(CASE WHEN (julianday(t.geloest_am) - julianday(t.erstellt_am)) * 24 <= k.ziel_stunden THEN 1 ELSE 0 END) / COUNT(*), 1) AS quote_prozent\nFROM tickets AS t\nJOIN kategorien AS k ON k.kategorie_id = t.kategorie_id\nWHERE t.geloest_am IS NOT NULL\nGROUP BY t.prioritaet\nORDER BY CASE t.prioritaet WHEN 'hoch' THEN 1 WHEN 'mittel' THEN 2 ELSE 3 END;",
    solutionExplanation:
      'Diese Abfrage vereint fast alles aus dem Lernpfad: JOIN, WHERE, Datumsrechnung, bedingtes Zählen, GROUP BY, Ganzzahldivision vermeiden (`100.0`) und fachliches Sortieren. Ergebnis: Bei hoher und mittlerer Priorität werden 50 % eingehalten, bei niedriger nur 33,3 %. **Vorsicht bei der Interpretation:** Mit 3 bis 6 Tickets je Gruppe sind die Quoten wenig belastbar – in einem Bericht gehört die Fallzahl immer dazu, deshalb steht `geloest` mit im Ergebnis.',
    check: q({ columnNames: true, orderMatters: true, variants: [{ description: 'Die Zielzeit für Netzwerk beträgt 30 statt 8 Stunden.', setup: 'UPDATE kategorien SET ziel_stunden = 30 WHERE kategorie_id = 3;' }] }),
    concepts: ['Analyse', 'CASE WHEN', 'GROUP BY', 'Datum'],
    tests: {
      reject: [
        "SELECT t.prioritaet, COUNT(*) AS geloest, SUM(CASE WHEN (julianday(t.geloest_am) - julianday(t.erstellt_am)) * 24 <= k.ziel_stunden THEN 1 ELSE 0 END) AS eingehalten, ROUND(100 * SUM(CASE WHEN (julianday(t.geloest_am) - julianday(t.erstellt_am)) * 24 <= k.ziel_stunden THEN 1 ELSE 0 END) / COUNT(*), 1) AS quote_prozent FROM tickets t JOIN kategorien k ON k.kategorie_id = t.kategorie_id WHERE t.geloest_am IS NOT NULL GROUP BY t.prioritaet ORDER BY CASE t.prioritaet WHEN 'hoch' THEN 1 WHEN 'mittel' THEN 2 ELSE 3 END",
        "SELECT t.prioritaet, COUNT(*) AS geloest, SUM(CASE WHEN (julianday(t.geloest_am) - julianday(t.erstellt_am)) * 24 <= k.ziel_stunden THEN 1 ELSE 0 END) AS eingehalten, ROUND(100.0 * SUM(CASE WHEN (julianday(t.geloest_am) - julianday(t.erstellt_am)) * 24 <= k.ziel_stunden THEN 1 ELSE 0 END) / COUNT(*), 1) AS quote_prozent FROM tickets t JOIN kategorien k ON k.kategorie_id = t.kategorie_id GROUP BY t.prioritaet ORDER BY CASE t.prioritaet WHEN 'hoch' THEN 1 WHEN 'mittel' THEN 2 ELSE 3 END",
      ],
    },
  },
  {
    id: 'm16-e1',
    lessonId: 'm16',
    type: 'explain',
    difficulty: 2,
    db: 'support',
    title: 'Kennzahlen sauber definieren',
    prompt:
      'Die Teamleitung fragt: „Wie lange dauert bei uns ein Ticket im Schnitt?“ Bevor du eine Abfrage schreibst, musst du die Kennzahl genauer festlegen. Nenne mindestens **vier Fragen**, die du klären musst, und begründe kurz, warum sie das Ergebnis verändern.',
    starterSql:
      "SELECT ticket_id, status, erstellt_am, geloest_am,\n       ROUND((julianday(geloest_am) - julianday(erstellt_am)) * 24, 1) AS dauer_stunden\nFROM tickets\nORDER BY ticket_id;",
    hints: [
      'Sieh dir die Daten an: Gibt es Tickets ohne Ende? Mehrere mögliche Endzeitpunkte?',
      'Denke an: Start- und Endzeitpunkt, offene Tickets, Zeiteinheit, Wochenenden, Ausreißer, Gruppierung, Zeitraum.',
      'Vergleiche Status „gelöst“ und „geschlossen“ in der Tabelle `statusereignisse`.',
    ],
    modelAnswer:
      'Mögliche Klärungsfragen:\n\n- **Endzeitpunkt:** Zählt „gelöst“ (`geloest_am`) oder „geschlossen“ (Statusereignis)? Bei geschlossenen Tickets liegen dazwischen oft Stunden.\n- **Offene Tickets:** Werden sie ausgeschlossen (dann wirkt der Durchschnitt besser, als er ist) oder mit der bisherigen Dauer bis zum Stichtag eingerechnet?\n- **Zeitraum:** Welche Tickets – nach Erstellungs- oder nach Lösungsdatum, welcher Monat?\n- **Zeiteinheit und Zeitbasis:** Stunden oder Tage? Kalenderzeit oder nur Arbeitszeit (Nächte, Wochenenden)? Ticket 5 dauerte 120 Kalenderstunden, aber deutlich weniger Arbeitsstunden.\n- **Ausreißer:** Verzerrt ein einzelnes sehr langes Ticket den Durchschnitt? Ist der Median aussagekräftiger?\n- **Gruppierung:** Ein Wert für alle oder je Kategorie/Priorität? Netzwerk- und Hardwaretickets haben ganz andere Zielzeiten.\n- **Datenqualität:** Gibt es Tickets ohne Kategorie oder mit fehlendem Zeitstempel?\n\nErst wenn diese Punkte geklärt und dokumentiert sind, ist die Kennzahl eindeutig – und zwei Personen kommen mit ihrer Abfrage zum selben Ergebnis.',
    solution:
      "SELECT ticket_id, status, erstellt_am, geloest_am,\n       ROUND((julianday(geloest_am) - julianday(erstellt_am)) * 24, 1) AS dauer_stunden\nFROM tickets\nORDER BY ticket_id;",
    solutionExplanation: 'Siehe Musterantwort.',
    concepts: ['Analyse'],
  },
];
