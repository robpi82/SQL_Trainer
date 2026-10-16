import type { Lesson } from './types';

/**
 * Lektionen. Aufbau jeder Lektion:
 * Lernziel → Erklärung → Beispiel → Schritt für Schritt → angeleitete Übung → Aufgaben → Zusammenfassung.
 * Die zugehörigen Aufgaben werden über `lessonId` in src/content/exercises zugeordnet.
 */
export const LESSONS: Lesson[] = [
  {
    id: 'm01',
    moduleId: 1,
    title: 'Tabellen, Zeilen, Spalten und Schlüssel',
    goals: [
      'Du kannst erklären, was Tabelle, Zeile (Datensatz) und Spalte (Attribut) sind.',
      'Du kennst die Datentypen von SQLite und weißt, was NULL bedeutet.',
      'Du erkennst Primär- und Fremdschlüssel und verstehst, wie sie Tabellen verbinden.',
      'Du kannst dir mit `SELECT * FROM tabelle` eine Tabelle vollständig anzeigen lassen.',
    ],
    explanation: [
      'Eine **relationale Datenbank** speichert Daten in **Tabellen**. Jede Tabelle beschreibt eine Art von Dingen: Kunden, Bestellungen, Produkte.',
      'Eine **Zeile** (auch *Datensatz*) steht für genau ein Ding – zum Beispiel einen Kunden. Eine **Spalte** (auch *Attribut*) ist ein Merkmal, das jede Zeile hat – zum Beispiel `stadt`.',
      'Jede Spalte hat einen **Datentyp**. SQLite kennt im Kern nur fünf Speicherklassen: `INTEGER` (ganze Zahl), `REAL` (Dezimalzahl), `TEXT`, `BLOB` (Binärdaten) und `NULL`. Ein eigener Datumstyp fehlt: Datumswerte werden als Text im Format `JJJJ-MM-TT` gespeichert. (MySQL, PostgreSQL und SQL Server haben dafür DATE, VARCHAR(n), DECIMAL usw. und sind bei Typen deutlich strenger.)',
      '**NULL** bedeutet „kein Wert vorhanden“ bzw. „unbekannt“. NULL ist **nicht** dasselbe wie 0 oder ein leerer Text `\'\'`. Das wird später bei Filtern und Zählungen wichtig.',
      'Der **Primärschlüssel** (Primary Key, PK) identifiziert jede Zeile eindeutig, z. B. `kunde_id`. Er darf nicht doppelt und nicht NULL sein.',
      'Ein **Fremdschlüssel** (Foreign Key, FK) ist eine Spalte, die auf den Primärschlüssel einer anderen Tabelle verweist. `bestellungen.kunde_id` sagt: „Diese Bestellung gehört zum Kunden mit dieser ID.“ So entstehen **Beziehungen** zwischen Tabellen – hier 1:n: Ein Kunde kann viele Bestellungen haben, jede Bestellung gehört zu genau einem Kunden.',
      'Um eine Tabelle anzusehen, verwendest du `SELECT * FROM tabellenname;` – das Sternchen bedeutet „alle Spalten“. In der nächsten Lektion lernst du, gezielt Spalten auszuwählen.',
    ],
    terms: [
      { term: 'Tabelle', definition: 'Sammlung gleichartiger Datensätze, z. B. alle Kunden.' },
      { term: 'Zeile / Datensatz', definition: 'Ein einzelner Eintrag, z. B. ein Kunde.' },
      { term: 'Spalte / Attribut', definition: 'Ein Merkmal mit festem Namen und Datentyp, z. B. stadt.' },
      { term: 'Primärschlüssel (PK)', definition: 'Spalte, die jede Zeile eindeutig identifiziert.' },
      { term: 'Fremdschlüssel (FK)', definition: 'Spalte, die auf den Primärschlüssel einer anderen (oder derselben) Tabelle verweist.' },
      { term: 'NULL', definition: 'Markierung für „kein Wert / unbekannt“. Weder 0 noch leerer Text.' },
    ],
    example: {
      db: 'vertrieb',
      tables: [
        { label: 'kunden (Auszug)', sql: 'SELECT kunde_id, vorname, nachname, stadt, email FROM kunden LIMIT 4;' },
        { label: 'bestellungen (Auszug)', sql: 'SELECT bestellung_id, kunde_id, bestelldatum, status FROM bestellungen LIMIT 4;' },
      ],
      sql: 'SELECT * FROM bestellungen;',
      note: 'In `bestellungen` kommt `kunde_id` 1 mehrfach vor (Anna Schmidt hat mehrere Bestellungen). In `kunden` gibt es jede `kunde_id` genau einmal.',
    },
    steps: [
      { code: 'SELECT', text: 'Leitet eine Abfrage ein: „Gib mir …“' },
      { code: '*', text: 'Platzhalter für „alle Spalten“ in der Reihenfolge der Tabellendefinition.' },
      { code: 'FROM bestellungen', text: 'Aus welcher Tabelle die Daten kommen.' },
      { code: ';', text: 'Schließt die Anweisung ab. Bei einer einzelnen Abfrage optional, bei mehreren nötig.' },
    ],
    summary: {
      merksatz: 'Zeilen sind Dinge, Spalten sind Merkmale. Der Primärschlüssel macht jede Zeile eindeutig, der Fremdschlüssel verbindet Tabellen.',
      fehler: [
        'NULL mit 0 oder einem leeren Text verwechseln.',
        'Annehmen, ein Fremdschlüssel müsse eindeutig sein – er darf (und soll oft) mehrfach vorkommen.',
        'Datumswerte in SQLite für einen eigenen Datentyp halten: Es sind Texte.',
      ],
    },
  },

  {
    id: 'm02',
    moduleId: 2,
    title: 'SELECT, FROM, Spaltenauswahl und Aliase',
    goals: [
      'Du wählst gezielt Spalten aus einer Tabelle aus.',
      'Du vergibst Spaltenaliase mit `AS` und verstehst, wozu sie dienen.',
      'Du kennst Tabellenaliase und weißt, warum ein fehlendes Komma gefährlich ist.',
    ],
    explanation: [
      'Statt `*` schreibst du hinter `SELECT` die Spalten, die du brauchst – getrennt durch Kommas. Die Reihenfolge im Ergebnis entspricht der Reihenfolge in deiner Abfrage.',
      'Mit einem **Spaltenalias** gibst du einer Spalte im Ergebnis einen anderen Namen: `name AS produkt`. Die Tabelle wird dabei nicht verändert – nur die Überschrift im Ergebnis. Aliase sind besonders bei berechneten Spalten wichtig (Modul 7).',
      'Auch Tabellen können einen Alias bekommen: `FROM produkte AS p`. Dann kannst du `p.name` schreiben. Das ist bei mehreren Tabellen (JOINs, Modul 11) unverzichtbar.',
      '`AS` darf man weglassen: `name produkt` bedeutet dasselbe wie `name AS produkt`. Genau deshalb ist ein **vergessenes Komma** tückisch: `SELECT vorname nachname` läuft ohne Fehler, liefert aber nur eine Spalte mit der Überschrift „nachname“.',
      'Groß- und Kleinschreibung von Schlüsselwörtern ist egal (`select` = `SELECT`). Üblich ist: Schlüsselwörter groß, Tabellen- und Spaltennamen klein.',
    ],
    example: {
      db: 'vertrieb',
      tables: [{ label: 'produkte (Auszug)', sql: 'SELECT * FROM produkte LIMIT 5;' }],
      sql: 'SELECT name AS produkt, preis, kategorie\nFROM produkte;',
    },
    steps: [
      { code: 'SELECT name AS produkt,', text: 'Spalte `name`, im Ergebnis mit der Überschrift „produkt“.' },
      { code: 'preis, kategorie', text: 'Zwei weitere Spalten ohne Alias – sie behalten ihren Namen.' },
      { code: 'FROM produkte;', text: 'Alle Zeilen der Tabelle `produkte`.' },
    ],
    logicalOrder: ['FROM', 'SELECT'],
    dialectNotes: [
      'Spaltenaliase mit Leerzeichen brauchen Anführungszeichen: in SQLite und PostgreSQL `AS "Preis in Euro"`, in MySQL auch Backticks, in SQL Server eckige Klammern `[Preis in Euro]`.',
    ],
    summary: {
      merksatz: 'SELECT bestimmt die Spalten, FROM die Tabelle. AS benennt Spalten im Ergebnis um, ohne die Daten zu ändern.',
      fehler: [
        'Fehlendes Komma zwischen Spalten – das zweite Wort wird zum Alias.',
        'Komma nach der letzten Spalte vor FROM (Syntaxfehler).',
        'Texte statt Aliase in einfache Anführungszeichen setzen: `SELECT \'name\'` liefert den Text „name“ statt der Spalte.',
      ],
    },
  },

  {
    id: 'm03',
    moduleId: 3,
    title: 'WHERE und Vergleichsoperatoren',
    goals: [
      'Du filterst Zeilen mit WHERE.',
      'Du verwendest die Vergleichsoperatoren `=`, `<>`, `<`, `>`, `<=`, `>=` für Zahlen, Texte und Datumswerte.',
      'Du weißt, warum Vergleiche mit NULL keine Zeilen liefern.',
    ],
    explanation: [
      '`WHERE` filtert **Zeilen**: Nur Zeilen, für die die Bedingung **wahr** ist, kommen ins Ergebnis.',
      'Vergleichsoperatoren: `=` gleich, `<>` oder `!=` ungleich, `<` kleiner, `>` größer, `<=` kleiner oder gleich, `>=` größer oder gleich.',
      '**Zahlen** schreibst du ohne Anführungszeichen mit Punkt als Dezimaltrennzeichen: `preis < 49.90`. **Texte** stehen in **einfachen** Anführungszeichen: `stadt = \'Hamburg\'`.',
      'In SQLite unterscheidet `=` bei Texten Groß- und Kleinschreibung: `\'hamburg\'` findet „Hamburg“ nicht. (In MySQL ist das je nach Einstellung anders – dort wird oft nicht unterschieden.)',
      'Datumswerte im Format `JJJJ-MM-TT` kann man wie Texte vergleichen: `bestelldatum >= \'2024-06-01\'`. Das klappt, weil die Zeichenreihenfolge der zeitlichen Reihenfolge entspricht.',
      'Ein Vergleich mit **NULL** ist nie wahr: `NULL < 10` ergibt „unbekannt“. Deshalb fehlen Zeilen mit NULL bei normalen Vergleichen. Wie man NULL gezielt findet, lernst du in Modul 6.',
    ],
    example: {
      db: 'vertrieb',
      tables: [{ label: 'produkte', sql: 'SELECT produkt_id, name, preis, lagerbestand FROM produkte;' }],
      sql: 'SELECT name, preis\nFROM produkte\nWHERE preis >= 100;',
    },
    steps: [
      { code: 'FROM produkte', text: 'Zuerst werden alle Zeilen der Tabelle betrachtet.' },
      { code: 'WHERE preis >= 100', text: 'Für jede Zeile wird geprüft: Ist der Preis mindestens 100? Nur dann bleibt sie.' },
      { code: 'SELECT name, preis', text: 'Von den verbleibenden Zeilen werden zwei Spalten angezeigt.' },
    ],
    logicalOrder: ['FROM', 'WHERE', 'SELECT'],
    dialectNotes: [
      'SQLite erlaubt in WHERE sogar Spaltenaliase aus SELECT – PostgreSQL und SQL Server nicht. Gewöhne dir an, in WHERE die Originalspalten zu verwenden.',
      'Doppelte Anführungszeichen `"Hamburg"` bezeichnen in Standard-SQL einen Spaltennamen. SQLite wertet sie notfalls als Text, andere Datenbanken melden einen Fehler.',
    ],
    summary: {
      merksatz: 'WHERE behält nur Zeilen, bei denen die Bedingung wahr ist. Texte in einfache Anführungszeichen, Zahlen ohne.',
      fehler: [
        'Texte ohne oder mit doppelten Anführungszeichen schreiben.',
        'Komma statt Punkt bei Dezimalzahlen (`49,90`).',
        '„Mindestens“ mit `>` statt `>=` umsetzen.',
        'Erwarten, dass `spalte = NULL` oder `spalte < 10` Zeilen mit NULL findet.',
      ],
    },
  },

  {
    id: 'm04',
    moduleId: 4,
    title: 'AND, OR, NOT und Klammern',
    goals: [
      'Du kombinierst mehrere Bedingungen mit AND und OR.',
      'Du verneinst Bedingungen mit NOT.',
      'Du kennst die Vorrangregeln und setzt Klammern bewusst.',
    ],
    explanation: [
      '**AND**: Beide Bedingungen müssen wahr sein. Das Ergebnis wird kleiner.',
      '**OR**: Mindestens eine Bedingung muss wahr sein. Das Ergebnis wird größer.',
      '**NOT** kehrt eine Bedingung um: `NOT status = \'geliefert\'` entspricht `status <> \'geliefert\'`.',
      '**Vorrang**: Zuerst NOT, dann AND, dann OR – ähnlich wie „Punkt vor Strich“. `a OR b AND c` wird gelesen als `a OR (b AND c)`.',
      'Mit **Klammern** legst du die Reihenfolge selbst fest. Faustregel: Sobald AND und OR gemeinsam vorkommen, setze Klammern – auch wenn es ohne ginge. Das macht deine Absicht für andere (und dich selbst) eindeutig.',
      'Achtung bei der Umgangssprache: „Kunden aus Hamburg **und** Köln“ meint fachlich meist „aus Hamburg **oder** aus Köln“ – niemand wohnt in beiden Städten gleichzeitig.',
    ],
    example: {
      db: 'support',
      tables: [{ label: 'tickets (Auszug)', sql: 'SELECT ticket_id, titel, kategorie_id, prioritaet, status FROM tickets LIMIT 8;' }],
      sql: "SELECT ticket_id, titel, prioritaet, status\nFROM tickets\nWHERE (prioritaet = 'hoch' OR prioritaet = 'mittel')\n  AND status = 'offen';",
    },
    steps: [
      { code: "(prioritaet = 'hoch' OR prioritaet = 'mittel')", text: 'Die Klammer wird zuerst ausgewertet: hohe oder mittlere Priorität.' },
      { code: "AND status = 'offen'", text: 'Zusätzlich muss das Ticket offen sein – das gilt für beide Prioritäten.' },
      { code: 'ohne Klammern …', text: "… hieße es: `hoch OR (mittel AND offen)` – dann kämen auch geschlossene Tickets mit hoher Priorität dazu." },
    ],
    logicalOrder: ['FROM', 'WHERE', 'SELECT'],
    summary: {
      merksatz: 'AND bindet stärker als OR. Wenn du beides mischst, setze Klammern.',
      fehler: [
        'Fehlende Klammern bei Kombinationen aus AND und OR.',
        "Umgangssprachliches „und“ als AND übersetzen, obwohl OR gemeint ist (`stadt = 'Hamburg' AND stadt = 'Köln'` liefert nie etwas).",
        'Bei `NOT` übersehen, worauf es sich bezieht.',
      ],
    },
  },

  {
    id: 'm05',
    moduleId: 5,
    title: 'ORDER BY, DISTINCT und LIMIT',
    goals: [
      'Du sortierst Ergebnisse auf- und absteigend, auch nach mehreren Spalten.',
      'Du entfernst doppelte Zeilen mit DISTINCT.',
      'Du begrenzt das Ergebnis mit LIMIT, z. B. für „Top 3“-Fragen.',
      'Du kennst den Unterschied zwischen Schreib- und Verarbeitungsreihenfolge.',
    ],
    explanation: [
      'Ohne `ORDER BY` ist die Reihenfolge der Zeilen **nicht garantiert** – auch wenn sie oft „ordentlich“ aussieht.',
      '`ORDER BY spalte` sortiert aufsteigend (`ASC`, Standard), `ORDER BY spalte DESC` absteigend. Mehrere Kriterien trennst du durch Komma: `ORDER BY datum, anzahl DESC`. Das zweite Kriterium entscheidet nur bei Gleichstand im ersten.',
      '`DISTINCT` direkt hinter SELECT entfernt doppelte **Zeilen** aus dem Ergebnis. Es bezieht sich immer auf alle ausgewählten Spalten zusammen.',
      '`LIMIT n` gibt nur die ersten n Zeilen aus. Sinnvoll ist das fast immer nur zusammen mit ORDER BY.',
      'Wichtig ist der Unterschied zwischen **Schreibreihenfolge** und **logischer Verarbeitung**: Du schreibst SELECT zuerst, die Datenbank verarbeitet es aber erst nach FROM und WHERE. ORDER BY kommt danach – deshalb darf man dort Aliase aus SELECT verwenden, in WHERE (standardmäßig) nicht.',
    ],
    example: {
      db: 'forschung',
      tables: [{ label: 'inseln', sql: 'SELECT * FROM inseln;' }],
      sql: 'SELECT name, region, flaeche_km2\nFROM inseln\nORDER BY region, flaeche_km2 DESC\nLIMIT 5;',
    },
    steps: [
      { code: 'FROM inseln', text: 'Alle Inseln.' },
      { code: 'SELECT name, region, flaeche_km2', text: 'Drei Spalten werden ausgewählt.' },
      { code: 'ORDER BY region,', text: 'Erst nach Region (alphabetisch: Nordsee vor Ostsee) …' },
      { code: 'flaeche_km2 DESC', text: '… innerhalb jeder Region die größte Insel zuerst.' },
      { code: 'LIMIT 5', text: 'Nur die ersten fünf Zeilen des sortierten Ergebnisses.' },
    ],
    logicalOrder: ['FROM', 'WHERE', 'SELECT', 'DISTINCT', 'ORDER BY', 'LIMIT'],
    dialectNotes: [
      'SQL Server kennt kein LIMIT, sondern `SELECT TOP 5 …` bzw. `OFFSET … FETCH NEXT 5 ROWS ONLY`.',
      'NULL-Werte stehen in SQLite und MySQL beim aufsteigenden Sortieren vorne, in PostgreSQL hinten (änderbar mit `NULLS FIRST/LAST`).',
      'SQLite sortiert Texte standardmäßig nach Zeichencode: Großbuchstaben vor Kleinbuchstaben, Umlaute hinter z.',
    ],
    summary: {
      merksatz: 'ORDER BY sortiert, DISTINCT entfernt doppelte Zeilen, LIMIT schneidet ab – und zwar in genau dieser Reihenfolge nach SELECT.',
      fehler: [
        'LIMIT ohne ORDER BY verwenden und eine sinnvolle Auswahl erwarten.',
        'Annehmen, DESC gelte für alle Sortierspalten – es gilt nur für die Spalte direkt davor.',
        'DISTINCT nur auf die erste Spalte beziehen – es gilt für die ganze Zeile.',
        'Nach einer ID sortieren, wenn eigentlich nach einem Datum gefragt ist.',
      ],
    },
  },

  {
    id: 'm06',
    moduleId: 6,
    title: 'LIKE, IN, BETWEEN, IS NULL und IS NOT NULL',
    goals: [
      'Du suchst mit LIKE nach Textmustern.',
      'Du prüfst mit IN gegen eine Liste und mit BETWEEN gegen einen Bereich.',
      'Du findest fehlende Werte mit IS NULL und unterscheidest NULL von einer leeren Zeichenkette.',
    ],
    explanation: [
      "**LIKE** vergleicht mit einem Muster: `%` steht für beliebig viele Zeichen (auch keins), `_` für genau ein Zeichen. `name LIKE 'Laptop%'` = beginnt mit „Laptop“; `'%kabel%'` = enthält „kabel“. In SQLite ist LIKE für die Buchstaben A–Z **nicht** case-sensitiv.",
      "**IN** prüft, ob ein Wert in einer Liste vorkommt: `stadt IN ('Hamburg', 'Köln')` ist eine Kurzform für mehrere OR-Bedingungen.",
      "**BETWEEN a AND b** prüft einen Bereich **einschließlich** beider Grenzen: `preis BETWEEN 50 AND 100` entspricht `preis >= 50 AND preis <= 100`.",
      '**IS NULL** / **IS NOT NULL** finden fehlende bzw. vorhandene Werte. `= NULL` funktioniert nie, weil jeder Vergleich mit NULL „unbekannt“ ergibt.',
      "**NULL oder leer?** Eine leere Zeichenkette `''` ist ein echter Wert (ein Text der Länge 0). NULL heißt „gar kein Wert“. In der Praxis kommt beides vor, deshalb prüft man oft `email IS NULL OR email = ''`.",
      "Alle drei Operatoren lassen sich mit NOT verneinen: `NOT LIKE`, `NOT IN`, `NOT BETWEEN`. Aber Vorsicht: `NOT IN` mit einer Liste, die NULL enthält, liefert nie Zeilen (mehr dazu in Modul 12).",
    ],
    example: {
      db: 'vertrieb',
      tables: [{ label: 'kunden', sql: 'SELECT kunde_id, vorname, stadt, email FROM kunden;' }],
      sql: "SELECT vorname, stadt, email\nFROM kunden\nWHERE stadt IN ('Hamburg', 'München')\n  AND email IS NOT NULL;",
    },
    steps: [
      { code: "stadt IN ('Hamburg', 'München')", text: 'Die Stadt muss einer der beiden Werte sein.' },
      { code: 'AND email IS NOT NULL', text: 'Und es muss ein E-Mail-Wert vorhanden sein. Achtung: Finn Becker hat einen leeren Text – der ist NICHT NULL und bleibt deshalb im Ergebnis.' },
    ],
    logicalOrder: ['FROM', 'WHERE', 'SELECT'],
    dialectNotes: [
      'LIKE unterscheidet in PostgreSQL Groß-/Kleinschreibung (dort gibt es ILIKE); in SQLite und MySQL meist nicht.',
      "Oracle behandelt `''` als NULL – SQLite, MySQL, PostgreSQL und SQL Server nicht.",
    ],
    summary: {
      merksatz: 'Muster mit LIKE, Listen mit IN, Bereiche mit BETWEEN (inklusive Grenzen), fehlende Werte nur mit IS NULL.',
      fehler: [
        '`= NULL` statt `IS NULL`.',
        "NULL und `''` gleichsetzen.",
        '`%` vergessen: `LIKE \'Laptop\'` sucht genau „Laptop“.',
        'BETWEEN bei Zeitstempeln: `<= \'2024-05-31\'` erfasst nicht `\'2024-05-31 14:00\'`.',
      ],
    },
  },

  {
    id: 'm07',
    moduleId: 7,
    title: 'Berechnungen und Textfunktionen',
    goals: [
      'Du berechnest neue Spalten mit `+ - * /` und rundest mit ROUND.',
      'Du kennst die Falle der Ganzzahldivision.',
      'Du bearbeitest Texte mit `||`, LOWER, UPPER, TRIM, LENGTH, SUBSTR und REPLACE.',
      'Du bereinigst unsaubere Daten für Vergleiche.',
    ],
    explanation: [
      'Hinter SELECT dürfen **Ausdrücke** stehen: `menge * einzelpreis`, `preis * 1.19`. Sie werden für jede Zeile berechnet. Gib berechneten Spalten immer einen Alias.',
      '**Ganzzahldivision:** Sind beide Zahlen ganzzahlig, ist auch das Ergebnis ganzzahlig: `7 / 2` = 3. Für Dezimalergebnisse `7 / 2.0` oder `CAST(x AS REAL) / 2`.',
      '`ROUND(wert, n)` rundet auf n Nachkommastellen. Rechnen mit NULL ergibt NULL: `NULL * 2` ist NULL.',
      "Texte verkettest du in SQLite mit `||`: `vorname || ' ' || nachname`.",
      '`LOWER(text)` / `UPPER(text)` ändern die Schreibweise, `TRIM(text)` entfernt Leerzeichen am Anfang und Ende, `LENGTH(text)` zählt Zeichen, `SUBSTR(text, start, länge)` schneidet aus, `REPLACE(text, alt, neu)` ersetzt.',
      "Funktionen lassen sich **verschachteln** – von innen nach außen: `LOWER(TRIM(stadt))` entfernt erst Leerzeichen und macht dann alles klein. So werden `'Berlin'`, `'berlin '` und `' BERLIN'` vergleichbar.",
    ],
    example: {
      db: 'vertrieb',
      tables: [{ label: 'kunden (Auszug)', sql: "SELECT kunde_id, vorname, nachname, stadt, '[' || stadt || ']' AS stadt_mit_rand FROM kunden WHERE kunde_id IN (1, 5, 7);" }],
      sql: "SELECT vorname || ' ' || nachname AS kunde,\n       LOWER(TRIM(stadt)) AS stadt_bereinigt,\n       LENGTH(stadt) AS laenge\nFROM kunden\nWHERE LOWER(TRIM(stadt)) = 'berlin';",
      note: 'Die eckigen Klammern im Auszug machen das Leerzeichen am Ende von „berlin “ sichtbar.',
    },
    steps: [
      { code: "vorname || ' ' || nachname AS kunde", text: 'Drei Texte werden aneinandergehängt und als „kunde“ ausgegeben.' },
      { code: 'TRIM(stadt)', text: 'Entfernt Leerzeichen am Rand: „berlin “ → „berlin“.' },
      { code: 'LOWER(…)', text: 'Wandelt in Kleinbuchstaben: „Berlin“ → „berlin“.' },
      { code: "WHERE LOWER(TRIM(stadt)) = 'berlin'", text: 'Vergleicht die bereinigte Form – alle drei Berliner Kunden werden gefunden.' },
      { code: 'LENGTH(stadt)', text: 'Zeigt: „berlin “ hat 7 Zeichen, „Berlin“ nur 6.' },
    ],
    logicalOrder: ['FROM', 'WHERE', 'SELECT'],
    dialectNotes: [
      "Verkettung: SQLite/PostgreSQL `||`, MySQL `CONCAT(a, b)`, SQL Server `a + b` oder `CONCAT`.",
      'LOWER/UPPER wandeln in SQLite nur A–Z um, keine Umlaute (`UPPER(\'Rügen\')` → „RüGEN“). Andere Datenbanken behandeln Umlaute korrekt.',
      'Ganzzahldivision gibt es auch in PostgreSQL und SQL Server; MySQL liefert bei `7 / 2` dagegen 3.5000.',
      'LENGTH heißt in SQL Server LEN, SUBSTR heißt dort SUBSTRING.',
    ],
    summary: {
      merksatz: 'Berechnungen und Funktionen verändern nur die Ausgabe, nie die gespeicherten Daten. Funktionen werden von innen nach außen ausgewertet.',
      fehler: [
        'Ganzzahldivision übersehen (`ziel_stunden / 24` → 0).',
        'Berechnete Spalten ohne Alias lassen.',
        'Unsaubere Texte (Leerzeichen, Schreibweise) beim Vergleichen nicht berücksichtigen.',
        'Zu großzügige Muster wie `LIKE \'%berlin%\'` verwenden, die auch „Berlinchen“ treffen.',
      ],
    },
  },

  {
    id: 'm08',
    moduleId: 8,
    title: 'Datumswerte und Datumsfunktionen',
    goals: [
      'Du weißt, wie SQLite Datumswerte speichert und warum das ISO-Format wichtig ist.',
      "Du extrahierst Jahr und Monat mit `strftime`.",
      'Du berechnest Zeitdifferenzen mit `julianday` und verschiebst Daten mit `date(…, \'+n days\')`.',
      'Du definierst Zeitkennzahlen wie Liefer- oder Bearbeitungsdauer sauber.',
    ],
    explanation: [
      'SQLite hat keinen eigenen Datumstyp. Datumswerte sind Texte im ISO-Format `JJJJ-MM-TT` bzw. `JJJJ-MM-TT HH:MM`. Weil die größte Einheit links steht, funktionieren Vergleiche und Sortierungen als Textvergleich.',
      "`strftime(format, datum)` formatiert ein Datum: `%Y` Jahr, `%m` Monat, `%d` Tag, `%H` Stunde. `strftime('%Y-%m', bestelldatum)` liefert z. B. '2024-03'. **Achtung:** Das Ergebnis ist Text, also `= '2024'` und nicht `= 2024`.",
      "`date(datum, modifikator)` rechnet: `date('2024-06-15', '-14 days')` → '2024-06-01'. Weitere Modifikatoren: `'+1 month'`, `'-5 years'`, `'start of month'`. `date('now')` liefert das heutige Datum.",
      '`julianday(datum)` wandelt ein Datum in eine fortlaufende Tageszahl (mit Nachkommastellen für die Uhrzeit) um. Die Differenz zweier Werte ist die Dauer in **Tagen**; mal 24 ergibt Stunden.',
      '**Kennzahlen definieren:** Bevor du rechnest, lege fest, was gemessen wird. Beispiel *Bearbeitungsdauer* = `(julianday(geloest_am) - julianday(erstellt_am)) * 24` Stunden, nur für Tickets mit `geloest_am`. Beispiel *Lieferdauer* = Tage zwischen `bestelldatum` und `lieferdatum`.',
    ],
    example: {
      db: 'support',
      tables: [{ label: 'tickets (Auszug)', sql: 'SELECT ticket_id, titel, erstellt_am, geloest_am FROM tickets LIMIT 5;' }],
      sql: "SELECT ticket_id,\n       strftime('%Y-%m', erstellt_am) AS monat,\n       ROUND((julianday(geloest_am) - julianday(erstellt_am)) * 24, 1) AS dauer_stunden\nFROM tickets\nWHERE geloest_am IS NOT NULL\nLIMIT 5;",
    },
    steps: [
      { code: "strftime('%Y-%m', erstellt_am)", text: 'Jahr und Monat als Text, z. B. „2024-09“.' },
      { code: 'julianday(geloest_am) - julianday(erstellt_am)', text: 'Dauer in Tagen, z. B. 0,3125 Tage.' },
      { code: '* 24', text: 'Umrechnung in Stunden (Klammern beachten!).' },
      { code: 'ROUND(…, 1)', text: 'Auf eine Nachkommastelle runden.' },
      { code: 'WHERE geloest_am IS NOT NULL', text: 'Nur gelöste Tickets haben eine Bearbeitungsdauer.' },
    ],
    logicalOrder: ['FROM', 'WHERE', 'SELECT', 'LIMIT'],
    dialectNotes: [
      'MySQL: `YEAR(d)`, `MONTH(d)`, `DATEDIFF(ende, start)`, `DATE_ADD(d, INTERVAL 7 DAY)`, `NOW()`.',
      "PostgreSQL: echter DATE/TIMESTAMP-Typ, `EXTRACT(YEAR FROM d)`, `ende - start`, `d + INTERVAL '7 days'`, `CURRENT_DATE`.",
      'SQL Server: `YEAR(d)`, `DATEPART(month, d)`, `DATEDIFF(day, start, ende)`, `DATEADD(day, 7, d)`, `GETDATE()`.',
      'In SQLite ist `date(\'now\')` immer UTC.',
    ],
    summary: {
      merksatz: 'In SQLite sind Datumswerte ISO-Texte: vergleichen als Text, zerlegen mit strftime, rechnen mit date() und julianday().',
      fehler: [
        "`strftime('%Y', d) = 2024` (Zahl statt Text) liefert nichts.",
        'Datumswerte direkt subtrahieren (`lieferdatum - bestelldatum`) – ergibt in SQLite Unsinn.',
        'Klammern bei `(a - b) * 24` vergessen.',
        'Zeitkennzahlen berechnen, ohne festzulegen, wie mit fehlenden Endzeitpunkten umgegangen wird.',
      ],
    },
  },

  {
    id: 'm09',
    moduleId: 9,
    title: 'Aggregatfunktionen: COUNT, SUM, AVG, MIN, MAX',
    goals: [
      'Du fasst viele Zeilen mit Aggregatfunktionen zu einem Wert zusammen.',
      'Du kennst den Unterschied zwischen COUNT(*), COUNT(spalte) und COUNT(DISTINCT spalte).',
      'Du weißt, wie Aggregatfunktionen mit NULL umgehen.',
    ],
    explanation: [
      '**Aggregatfunktionen** berechnen aus vielen Zeilen einen einzigen Wert: `COUNT` (Anzahl), `SUM` (Summe), `AVG` (Durchschnitt), `MIN` (kleinster Wert), `MAX` (größter Wert).',
      '`COUNT(*)` zählt **Zeilen** – egal, was drinsteht. `COUNT(spalte)` zählt nur Zeilen, in denen diese Spalte **nicht NULL** ist. `COUNT(DISTINCT spalte)` zählt **unterschiedliche** Werte.',
      'SUM, AVG, MIN und MAX **ignorieren NULL**. AVG teilt also durch die Anzahl der vorhandenen Werte, nicht durch alle Zeilen. Sind alle Werte NULL, ist das Ergebnis NULL (bei SUM nicht 0!).',
      'WHERE wird **vor** der Aggregation ausgeführt: `SELECT SUM(…) FROM … WHERE …` summiert nur die gefilterten Zeilen.',
      'Ohne GROUP BY liefert eine Abfrage mit Aggregatfunktion **genau eine Zeile**. Normale Spalten neben Aggregaten sind dann nicht sinnvoll – das lernst du im nächsten Modul.',
    ],
    example: {
      db: 'vertrieb',
      tables: [{ label: 'produkte', sql: 'SELECT produkt_id, name, preis, lagerbestand FROM produkte;' }],
      sql: 'SELECT COUNT(*) AS produkte,\n       COUNT(lagerbestand) AS mit_bestand,\n       SUM(lagerbestand) AS bestand_gesamt,\n       ROUND(AVG(preis), 2) AS durchschnittspreis,\n       MAX(preis) AS hoechster_preis\nFROM produkte;',
    },
    steps: [
      { code: 'COUNT(*)', text: 'Alle 12 Zeilen.' },
      { code: 'COUNT(lagerbestand)', text: 'Nur Zeilen mit Lagerbestand: 9 (drei sind NULL).' },
      { code: 'SUM(lagerbestand)', text: 'Summe der 9 vorhandenen Werte; NULL wird übersprungen.' },
      { code: 'ROUND(AVG(preis), 2)', text: 'Durchschnitt aller Preise, auf Cent gerundet.' },
      { code: 'MAX(preis)', text: 'Der höchste Preis.' },
    ],
    logicalOrder: ['FROM', 'WHERE', 'SELECT'],
    summary: {
      merksatz: 'COUNT(*) zählt Zeilen, COUNT(spalte) zählt Werte. Alle anderen Aggregatfunktionen überspringen NULL.',
      fehler: [
        'COUNT(spalte) verwenden, wenn alle Zeilen gezählt werden sollen (oder umgekehrt).',
        '`SUM(x) / COUNT(*)` als Durchschnitt, obwohl x NULL-Werte enthält.',
        'Aggregatfunktionen in WHERE schreiben (→ Fehler „misuse of aggregate“).',
        'Ganzzahldivision bei eigenen Durchschnittsberechnungen.',
      ],
    },
  },

  {
    id: 'm10',
    moduleId: 10,
    title: 'GROUP BY und HAVING',
    goals: [
      'Du bildest Gruppen mit GROUP BY und berechnest Kennzahlen je Gruppe.',
      'Du filterst Gruppen mit HAVING.',
      'Du kannst sicher entscheiden, ob eine Bedingung in WHERE oder HAVING gehört.',
    ],
    explanation: [
      '`GROUP BY spalte` fasst alle Zeilen mit gleichem Wert zu einer **Gruppe** zusammen. Aggregatfunktionen werden dann **je Gruppe** berechnet. Jede Gruppe ergibt eine Ergebniszeile.',
      'In SELECT dürfen dann nur stehen: die Gruppierungsspalten und Aggregatfunktionen. (SQLite ist hier nachsichtig und lässt auch andere Spalten zu – liefert dann aber einen zufälligen Wert aus der Gruppe. PostgreSQL und SQL Server melden einen Fehler.)',
      'NULL-Werte bilden beim Gruppieren eine eigene Gruppe.',
      '**WHERE oder HAVING?** WHERE filtert **einzelne Zeilen vor** dem Gruppieren. HAVING filtert **Gruppen nach** dem Gruppieren – dort kannst du Aggregatfunktionen verwenden: `HAVING COUNT(*) > 3`.',
      'Faustregel: Bezieht sich die Bedingung auf eine Eigenschaft einzelner Zeilen (Preis, Status, Datum)? → WHERE. Bezieht sie sich auf ein Ergebnis über mehrere Zeilen (Anzahl, Summe, Durchschnitt)? → HAVING.',
    ],
    example: {
      db: 'vertrieb',
      tables: [{ label: 'bestellungen', sql: 'SELECT bestellung_id, kunde_id, status FROM bestellungen;' }],
      sql: "SELECT kunde_id, COUNT(*) AS anzahl\nFROM bestellungen\nWHERE status <> 'storniert'\nGROUP BY kunde_id\nHAVING COUNT(*) >= 2\nORDER BY anzahl DESC, kunde_id;",
    },
    steps: [
      { code: 'FROM bestellungen', text: 'Alle 18 Bestellungen.' },
      { code: "WHERE status <> 'storniert'", text: 'Stornierte Bestellungen werden VOR dem Zählen entfernt.' },
      { code: 'GROUP BY kunde_id', text: 'Je Kunde entsteht eine Gruppe.' },
      { code: 'HAVING COUNT(*) >= 2', text: 'Nur Gruppen (Kunden) mit mindestens zwei Bestellungen bleiben.' },
      { code: 'SELECT kunde_id, COUNT(*) AS anzahl', text: 'Je verbleibender Gruppe eine Zeile mit Kunde und Anzahl.' },
      { code: 'ORDER BY anzahl DESC, kunde_id', text: 'Sortierung – hier ist der Alias erlaubt, weil ORDER BY nach SELECT verarbeitet wird.' },
    ],
    logicalOrder: ['FROM', 'WHERE', 'GROUP BY', 'HAVING', 'SELECT', 'ORDER BY'],
    summary: {
      merksatz: 'WHERE filtert Zeilen vor dem Gruppieren, HAVING filtert Gruppen danach.',
      fehler: [
        'Aggregatfunktion in WHERE (→ „misuse of aggregate“).',
        'Zeilenbedingungen in HAVING statt WHERE (funktioniert manchmal, ist aber unklar und langsamer).',
        'In SELECT Spalten verwenden, die weder gruppiert noch aggregiert sind.',
        'Nach einem Namen statt nach der ID gruppieren – gleiche Namen werden dann zusammengefasst.',
      ],
    },
  },

  {
    id: 'm11',
    moduleId: 11,
    title: 'INNER JOIN und LEFT JOIN',
    goals: [
      'Du verknüpfst Tabellen über Primär- und Fremdschlüssel mit INNER JOIN.',
      'Du verwendest LEFT JOIN, um auch Zeilen ohne Partner zu behalten, z. B. „Kunden ohne Bestellung“.',
      'Du erkennst die Vervielfachung von Zeilen bei 1:n-Beziehungen.',
      'Du weißt, warum Filter auf die rechte Tabelle eines LEFT JOIN in ON statt WHERE gehören können.',
    ],
    explanation: [
      'Ein **JOIN** verbindet Zeilen zweier Tabellen, wenn die **ON-Bedingung** erfüllt ist – meist Fremdschlüssel = Primärschlüssel: `ON b.kunde_id = k.kunde_id`.',
      '**INNER JOIN** (oder nur `JOIN`) liefert nur Paare, die zusammenpassen. Kunden ohne Bestellung erscheinen nicht.',
      '**LEFT JOIN** liefert **alle** Zeilen der linken Tabelle. Gibt es keinen Partner, werden die Spalten der rechten Tabelle mit NULL aufgefüllt. Mit `WHERE rechts.id IS NULL` findet man so Zeilen **ohne** Partner.',
      '**Vervielfachung:** Bei einer 1:n-Beziehung erscheint die „1“-Seite so oft, wie sie Partner hat. Ein Kunde mit 4 Bestellungen steht nach dem JOIN in 4 Zeilen. Wer danach zählt oder summiert, muss wissen, was eine Zeile jetzt bedeutet.',
      '**LEFT JOIN und Filter:** Eine Bedingung auf die rechte Tabelle in WHERE entfernt auch die NULL-Zeilen – der LEFT JOIN verhält sich dann wie ein INNER JOIN. Soll die Bedingung nur bestimmen, *welche* Partner angehängt werden, gehört sie in den ON-Teil.',
      'Bei gleichnamigen Spalten (z. B. `name`) musst du den Tabellenalias davorschreiben: `s.name`, `i.name`.',
    ],
    example: {
      db: 'vertrieb',
      tables: [
        { label: 'kunden (Auszug)', sql: 'SELECT kunde_id, vorname, nachname FROM kunden WHERE kunde_id IN (1, 8, 11);' },
        { label: 'bestellungen (Auszug)', sql: 'SELECT bestellung_id, kunde_id, status FROM bestellungen WHERE kunde_id IN (1, 8, 11);' },
      ],
      sql: 'SELECT k.vorname, k.nachname, b.bestellung_id, b.status\nFROM kunden AS k\nLEFT JOIN bestellungen AS b ON b.kunde_id = k.kunde_id\nWHERE k.kunde_id IN (1, 8, 11);',
      note: 'Anna Schmidt (1) erscheint viermal – einmal je Bestellung. Hannah Schulz (8) und Karl Zimmermann (11) haben keine Bestellung: Der LEFT JOIN behält sie mit NULL. Bei INNER JOIN würden sie fehlen.',
    },
    steps: [
      { code: 'FROM kunden AS k', text: 'Linke Tabelle mit Alias k.' },
      { code: 'LEFT JOIN bestellungen AS b', text: 'Rechte Tabelle; alle Kunden bleiben erhalten.' },
      { code: 'ON b.kunde_id = k.kunde_id', text: 'Verknüpfungsbedingung: Fremdschlüssel = Primärschlüssel.' },
      { code: 'WHERE k.kunde_id IN (1, 8, 11)', text: 'Filter auf die linke Tabelle – unproblematisch.' },
      { code: 'SELECT k.vorname, …, b.status', text: 'Spalten aus beiden Tabellen, eindeutig über den Alias.' },
    ],
    logicalOrder: ['FROM', 'JOIN', 'WHERE', 'GROUP BY', 'HAVING', 'SELECT', 'ORDER BY'],
    extraSections: [
      {
        title: 'Vergleich: INNER JOIN',
        paragraphs: ['Dieselbe Abfrage mit INNER JOIN: Kunden ohne Bestellung verschwinden.'],
        db: 'vertrieb',
        sql: 'SELECT k.vorname, k.nachname, b.bestellung_id, b.status\nFROM kunden AS k\nINNER JOIN bestellungen AS b ON b.kunde_id = k.kunde_id\nWHERE k.kunde_id IN (1, 8, 11);',
      },
    ],
    dialectNotes: [
      'RIGHT JOIN und FULL OUTER JOIN unterstützt SQLite erst ab Version 3.39 (hier vorhanden). In der Praxis lassen sich RIGHT JOINs immer als LEFT JOIN mit vertauschten Tabellen schreiben.',
      '`JOIN … USING (kunde_id)` ist eine Kurzform, wenn die Spalten gleich heißen. SQL Server kennt USING nicht.',
    ],
    summary: {
      merksatz: 'INNER JOIN = nur passende Paare. LEFT JOIN = alle Zeilen links, fehlende Partner als NULL. Bei 1:n vervielfachen sich die Zeilen der 1-Seite.',
      fehler: [
        'ON-Bedingung vergessen oder falsche Spalten verknüpfen (z. B. bestellung_id = kunde_id).',
        'Bei LEFT JOIN mit COUNT(*) zählen – die NULL-Zeile wird als 1 gezählt. Besser COUNT(rechts.id).',
        'Filter auf die rechte Tabelle eines LEFT JOIN in WHERE statt ON.',
        'Nach einem JOIN zählen oder summieren, ohne die Vervielfachung zu bedenken.',
      ],
    },
  },

  {
    id: 'm12',
    moduleId: 12,
    title: 'Unterabfragen: skalar, IN und EXISTS',
    goals: [
      'Du verwendest skalare Unterabfragen, die genau einen Wert liefern.',
      'Du filterst mit IN gegen das Ergebnis einer Unterabfrage.',
      'Du nutzt EXISTS und NOT EXISTS mit korrelierten Unterabfragen.',
      'Du kennst die NULL-Falle bei NOT IN.',
    ],
    explanation: [
      'Eine **Unterabfrage** ist eine SELECT-Abfrage in Klammern innerhalb einer anderen Abfrage.',
      '**Skalare Unterabfrage:** liefert genau **einen Wert** (eine Zeile, eine Spalte) und kann wie eine Zahl verwendet werden: `WHERE preis > (SELECT AVG(preis) FROM produkte)`.',
      '**Unterabfrage mit IN:** liefert eine **Liste** (eine Spalte, beliebig viele Zeilen): `WHERE kategorie_id IN (SELECT kategorie_id FROM kategorien WHERE …)`. Liefert eine Unterabfrage mehrere Werte, muss IN statt = verwendet werden.',
      '**EXISTS** prüft, ob die Unterabfrage **mindestens eine Zeile** liefert. Meist ist sie **korreliert**: Sie bezieht sich auf die aktuelle Zeile der äußeren Abfrage (`WHERE b.kunde_id = k.kunde_id`). Was sie auswählt (`SELECT 1`), ist egal.',
      '**NULL-Falle bei NOT IN:** Enthält die Liste ein NULL, liefert `NOT IN` keine einzige Zeile, weil `x <> NULL` nie wahr ist. `NOT EXISTS` hat dieses Problem nicht – oder man schließt NULL in der Unterabfrage aus.',
      'Viele Aufgaben lassen sich wahlweise mit JOIN oder Unterabfrage lösen. Unterabfragen sind oft lesbarer, wenn nur gefiltert und nichts aus der anderen Tabelle angezeigt werden soll – und sie vervielfachen keine Zeilen.',
    ],
    example: {
      db: 'vertrieb',
      tables: [{ label: 'Durchschnittspreis (innere Abfrage allein)', sql: 'SELECT AVG(preis) AS durchschnitt FROM produkte;' }],
      sql: 'SELECT name, preis\nFROM produkte\nWHERE preis > (SELECT AVG(preis) FROM produkte)\nORDER BY preis DESC;',
    },
    steps: [
      { code: '(SELECT AVG(preis) FROM produkte)', text: 'Wird zuerst ausgewertet und liefert einen einzigen Wert (ca. 273,68).' },
      { code: 'WHERE preis > …', text: 'Jedes Produkt wird mit diesem Wert verglichen.' },
      { code: 'ORDER BY preis DESC', text: 'Sortiert die verbleibenden Produkte.' },
    ],
    logicalOrder: ['FROM', 'WHERE', 'SELECT', 'ORDER BY'],
    extraSections: [
      {
        title: 'Beispiel mit EXISTS',
        paragraphs: ['Alle Kunden, die mindestens eine stornierte Bestellung haben. Für jeden Kunden prüft die Unterabfrage, ob es eine passende Bestellung gibt.'],
        db: 'vertrieb',
        sql: "SELECT k.vorname, k.nachname\nFROM kunden AS k\nWHERE EXISTS (\n  SELECT 1\n  FROM bestellungen AS b\n  WHERE b.kunde_id = k.kunde_id\n    AND b.status = 'storniert'\n);",
      },
    ],
    dialectNotes: [
      'Liefert eine skalare Unterabfrage mehrere Zeilen, nimmt SQLite still die erste. PostgreSQL, MySQL und SQL Server melden einen Fehler – verlasse dich nicht auf SQLites Verhalten.',
    ],
    summary: {
      merksatz: 'Ein Wert → Vergleich mit = oder >. Mehrere Werte → IN. Existenzfrage → EXISTS. Bei NOT IN auf NULL achten.',
      fehler: [
        '`= (SELECT …)` bei Unterabfragen, die mehrere Zeilen liefern.',
        'NOT IN gegen eine Spalte mit NULL-Werten.',
        'Unterabfrage mit mehreren Spalten bei IN (→ „sub-select returns 2 columns“).',
        'Bei korrelierten Unterabfragen den Bezug zur äußeren Tabelle vergessen – dann ist EXISTS für alle Zeilen wahr.',
      ],
    },
  },

  {
    id: 'm13',
    moduleId: 13,
    title: 'Fallunterscheidungen mit CASE WHEN',
    goals: [
      'Du erzeugst mit CASE WHEN neue Werte abhängig von Bedingungen, z. B. Klassen oder Kategorien.',
      'Du kennst die allgemeine und die einfache Form von CASE und weißt, warum die Reihenfolge der WHEN-Zweige zählt.',
      'Du behandelst NULL und den fehlenden ELSE-Zweig bewusst.',
      'Du verwendest CASE in ORDER BY und für bedingtes Zählen in Aggregatfunktionen.',
    ],
    explanation: [
      '`CASE` ist das „Wenn-dann“ von SQL. Es ist ein **Ausdruck**: Für jede Zeile liefert er genau **einen Wert**. Deshalb kann CASE überall stehen, wo ein Wert stehen darf – in SELECT, in ORDER BY, in WHERE oder in einer Aggregatfunktion.',
      '**Allgemeine Form:** `CASE WHEN bedingung1 THEN wert1 WHEN bedingung2 THEN wert2 ELSE wert_sonst END`. Die Bedingungen werden **von oben nach unten** geprüft, und die **erste** wahre gewinnt. Alle weiteren Zweige werden ignoriert.',
      "**Einfache Form:** `CASE spalte WHEN 'a' THEN … WHEN 'b' THEN … END`. Sie vergleicht eine Spalte nur auf Gleichheit mit festen Werten – kürzer, aber weniger flexibel.",
      '**Reihenfolge bei Bereichen:** Bei Grenzwerten prüft man von der strengsten zur schwächsten Bedingung: erst `>= 500`, dann `>= 50`. Umgekehrt würde schon `>= 50` für 1299 € zutreffen.',
      '**ELSE und NULL:** Trifft kein Zweig zu und fehlt ELSE, ergibt CASE **NULL**. Und auch in CASE gilt: `WHEN spalte = NULL` ist nie wahr – verwende `WHEN spalte IS NULL`. NULL-Fälle sollte man meist als ersten Zweig behandeln.',
      "**Bedingtes Zählen:** `SUM(CASE WHEN status = 'geliefert' THEN 1 ELSE 0 END)` zählt in einer Gruppe nur die passenden Zeilen. So entstehen mehrere Teilzahlen in einer einzigen Abfrage – sehr häufig in Berichten.",
      '**Fachliche Sortierung:** `ORDER BY CASE status WHEN \'offen\' THEN 1 … END` sortiert nach einer selbst festgelegten Reihenfolge statt alphabetisch.',
      'Alle Zweige sollten denselben Datentyp liefern (nur Texte oder nur Zahlen). SQLite ist hier nachsichtig, andere Datenbanken melden sonst einen Fehler.',
    ],
    terms: [
      { term: 'CASE-Ausdruck', definition: 'Liefert pro Zeile genau einen Wert, abhängig von Bedingungen.' },
      { term: 'WHEN … THEN …', definition: 'Ein Zweig: Bedingung und Wert, wenn sie zutrifft.' },
      { term: 'ELSE', definition: 'Wert, wenn kein Zweig zutrifft. Fehlt ELSE, ist das Ergebnis NULL.' },
      { term: 'END', definition: 'Schließt den CASE-Ausdruck ab – danach folgt meist ein Alias mit AS.' },
      { term: 'Bedingtes Zählen', definition: 'Aggregatfunktion über einen CASE-Ausdruck, z. B. SUM(CASE WHEN … THEN 1 ELSE 0 END).' },
    ],
    example: {
      db: 'vertrieb',
      tables: [{ label: 'produkte (Auszug)', sql: 'SELECT produkt_id, name, kategorie, preis FROM produkte;' }],
      sql: "SELECT name, preis,\n       CASE\n         WHEN preis >= 500 THEN 'teuer'\n         WHEN preis >= 50 THEN 'mittel'\n         ELSE 'günstig'\n       END AS preisklasse\nFROM produkte\nORDER BY preis DESC;",
    },
    steps: [
      { code: 'CASE', text: 'Beginn der Fallunterscheidung – für jede Zeile einzeln.' },
      { code: "WHEN preis >= 500 THEN 'teuer'", text: 'Erster Zweig: Trifft er zu, ist das Ergebnis „teuer“ und die übrigen Zweige werden nicht mehr geprüft.' },
      { code: "WHEN preis >= 50 THEN 'mittel'", text: 'Wird nur noch für Zeilen geprüft, die nicht schon „teuer“ sind – also für Preise unter 500.' },
      { code: "ELSE 'günstig'", text: 'Alle übrigen Zeilen (unter 50 €).' },
      { code: 'END AS preisklasse', text: 'Ende des Ausdrucks; die neue Spalte heißt „preisklasse“.' },
    ],
    logicalOrder: ['FROM', 'SELECT', 'ORDER BY'],
    extraSections: [
      {
        title: 'Beispiel: bedingtes Zählen je Gruppe',
        paragraphs: ['Je Kategorie die Anzahl aller Tickets und davon die offenen bzw. hoch priorisierten – in einer einzigen Abfrage. Tickets ohne Kategorie bilden eine eigene Gruppe mit NULL.'],
        db: 'support',
        sql: "SELECT kategorie_id,\n       COUNT(*) AS tickets,\n       SUM(CASE WHEN status = 'offen' THEN 1 ELSE 0 END) AS offen,\n       SUM(CASE WHEN prioritaet = 'hoch' THEN 1 ELSE 0 END) AS hoch\nFROM tickets\nGROUP BY kategorie_id;",
      },
      {
        title: 'Beispiel: fehlendes ELSE ergibt NULL',
        paragraphs: ['Ohne ELSE erhalten Zeilen, auf die kein Zweig passt, den Wert NULL. Hier betrifft das alle Produkte unter 500 €.'],
        db: 'vertrieb',
        sql: "SELECT name, preis,\n       CASE WHEN preis >= 500 THEN 'teuer' END AS markierung\nFROM produkte;",
      },
    ],
    dialectNotes: [
      'CASE WHEN ist Standard-SQL und funktioniert in SQLite, MySQL, PostgreSQL und SQL Server gleich.',
      'Kurzformen für genau zwei Fälle: MySQL `IF(bedingung, a, b)`, SQL Server `IIF(bedingung, a, b)`, SQLite ab Version 3.32 ebenfalls `iif(…)`. CASE ist portabler.',
      "In SQLite und MySQL sind Bedingungen Zahlen (wahr = 1, falsch = 0), deshalb funktioniert dort auch `SUM(status = 'geliefert')`. PostgreSQL und SQL Server erlauben das nicht – dort CASE verwenden oder in PostgreSQL `COUNT(*) FILTER (WHERE …)`.",
    ],
    summary: {
      merksatz: 'CASE liefert pro Zeile einen Wert: Die erste zutreffende WHEN-Bedingung gewinnt, ohne ELSE entsteht NULL.',
      fehler: [
        'Bereichsgrenzen in falscher Reihenfolge (erst `>= 50`, dann `>= 500`) – der zweite Zweig wird nie erreicht.',
        '`WHEN spalte = NULL` bzw. `CASE spalte WHEN NULL` – beides ist nie wahr. Richtig: `WHEN spalte IS NULL`.',
        'ELSE vergessen und unbemerkt NULL-Werte erzeugen.',
        '`END` vergessen (Syntaxfehler) oder den Alias weglassen.',
        'Bei bedingtem Zählen mit SUM das `ELSE 0` weglassen – dann kann NULL statt 0 herauskommen.',
      ],
    },
  },

  {
    id: 'm14',
    moduleId: 14,
    title: 'INSERT, UPDATE und DELETE',
    goals: [
      'Du fügst Zeilen mit INSERT ein.',
      'Du änderst Werte mit UPDATE und löschst Zeilen mit DELETE.',
      'Du weißt, warum die WHERE-Bedingung bei UPDATE und DELETE lebenswichtig ist.',
      'Du verstehst, wie Fremdschlüssel Änderungen absichern.',
    ],
    explanation: [
      'Bisher hast du nur gelesen. Mit **INSERT**, **UPDATE** und **DELETE** veränderst du Daten (DML – Data Manipulation Language). Hier verändern sie nur deine eigene Übungsdatenbank, die du jederzeit zurücksetzen kannst.',
      "`INSERT INTO tabelle (spalte1, spalte2) VALUES (wert1, wert2);` fügt eine Zeile ein. Die Spaltenliste ist optional, macht die Anweisung aber robust und lesbar.",
      '`UPDATE tabelle SET spalte = neuer_wert WHERE bedingung;` ändert alle Zeilen, die die Bedingung erfüllen. Mehrere Spalten trennt man in SET durch **Komma**. Der neue Wert darf den alten verwenden: `SET preis = preis * 1.1`.',
      '`DELETE FROM tabelle WHERE bedingung;` löscht alle passenden Zeilen.',
      '**Ohne WHERE betreffen UPDATE und DELETE alle Zeilen der Tabelle!** Profi-Tipp: Schreibe zuerst ein `SELECT * FROM tabelle WHERE …`, prüfe das Ergebnis und ersetze dann `SELECT *` durch `DELETE` bzw. setze das UPDATE davor.',
      '**Fremdschlüssel** schützen die Beziehungen: Eine Bestellung für einen nicht existierenden Kunden lässt sich nicht einfügen, und ein Ticket, auf das noch Statusereignisse verweisen, nicht löschen („FOREIGN KEY constraint failed“).',
    ],
    example: {
      db: 'vertrieb',
      tables: [{ label: 'produkte (vorher, Zubehör)', sql: "SELECT produkt_id, name, preis FROM produkte WHERE kategorie = 'Zubehör';" }],
      sql: "UPDATE produkte\nSET preis = preis - 5\nWHERE kategorie = 'Zubehör' AND preis > 70;\n\nSELECT produkt_id, name, preis\nFROM produkte\nWHERE kategorie = 'Zubehör';",
      note: 'Das Beispiel läuft auf einer Kopie – deine Übungsdatenbanken bleiben unverändert. Im Ergebnis siehst du den Zustand nach dem UPDATE.',
    },
    steps: [
      { code: 'UPDATE produkte', text: 'In welcher Tabelle geändert wird.' },
      { code: 'SET preis = preis - 5', text: 'Neuer Wert, berechnet aus dem alten.' },
      { code: "WHERE kategorie = 'Zubehör' AND preis > 70", text: 'Nur diese Zeilen werden geändert (hier: Dockingstation und Headset).' },
      { code: 'SELECT …', text: 'Kontrolle des Ergebnisses mit einer zweiten Anweisung, getrennt durch Semikolon.' },
    ],
    dialectNotes: [
      'In echten Datenbanken arbeitet man bei kritischen Änderungen mit Transaktionen: `BEGIN; … ; COMMIT;` (oder `ROLLBACK;`, um alles zurückzunehmen).',
      'MySQL Workbench verhindert im „Safe Update Mode“ standardmäßig UPDATE/DELETE ohne WHERE auf Schlüsselspalten.',
    ],
    summary: {
      merksatz: 'Erst mit SELECT prüfen, dann ändern. UPDATE und DELETE ohne WHERE treffen jede Zeile.',
      fehler: [
        'WHERE bei UPDATE oder DELETE vergessen.',
        '`SET a = 1 AND b = 2` statt `SET a = 1, b = 2`.',
        'Feste IDs verwenden, obwohl die Zeilen über eine fachliche Bedingung (Status, Kategorie) bestimmt werden sollen.',
        'Werte in INSERT in anderer Reihenfolge als die Spaltenliste angeben.',
      ],
    },
  },
  {
    id: 'm15',
    moduleId: 15,
    title: 'CREATE TABLE, Constraints und Beziehungen',
    goals: [
      'Du legst Tabellen mit CREATE TABLE an und wählst passende Datentypen.',
      'Du sicherst Daten mit Constraints ab: PRIMARY KEY, NOT NULL, UNIQUE, DEFAULT, CHECK und FOREIGN KEY.',
      'Du bildest 1:n-, 1:1- und n:m-Beziehungen ab – letztere mit einer Zwischentabelle.',
      'Du änderst bestehende Tabellen mit ALTER TABLE und kennst DROP TABLE.',
    ],
    explanation: [
      'Bisher hast du mit vorhandenen Tabellen gearbeitet. Mit **DDL** (Data Definition Language) legst du die Struktur selbst fest: `CREATE TABLE`, `ALTER TABLE`, `DROP TABLE`.',
      '`CREATE TABLE name ( spalte1 TYP regeln, spalte2 TYP regeln, … );` – jede Spalte bekommt einen Namen, einen Datentyp und optional **Constraints** (Regeln). Spalten werden durch Kommas getrennt, nach der letzten steht keines.',
      '**Datentypen in SQLite:** `INTEGER` (ganze Zahl), `REAL` (Dezimalzahl), `TEXT`, `BLOB`. SQLite ist großzügig: `VARCHAR(100)` wird wie TEXT behandelt, `INT` wie INTEGER. Datumswerte speichert man als TEXT im ISO-Format. Andere Datenbanken sind strenger und haben eigene Typen wie `DATE` oder `DECIMAL(10,2)`.',
      '**Constraints** schützen die Datenqualität – die Datenbank lehnt Verstöße mit einer Fehlermeldung ab:',
      "- `PRIMARY KEY`: eindeutig und nicht leer. Bei mehreren Spalten am Ende: `PRIMARY KEY (a, b)`.\n- `NOT NULL`: Pflichtfeld.\n- `UNIQUE`: kein Wert doppelt (mehrere NULL sind aber erlaubt).\n- `DEFAULT wert`: Standardwert, wenn die Spalte beim INSERT fehlt.\n- `CHECK (bedingung)`: nur Werte, für die die Bedingung nicht falsch ist.\n- `REFERENCES tabelle(spalte)`: Fremdschlüssel – der Wert muss in der anderen Tabelle existieren.",
      '**Beziehungen:** Ein Fremdschlüssel auf der „n“-Seite ergibt **1:n** (ein Produkt – viele Bewertungen). Fremdschlüssel plus `UNIQUE` ergibt **1:1** (eine Bestellung – eine Rechnung). **n:m** (Tickets ↔ Tags) braucht eine **Zwischentabelle** mit zwei Fremdschlüsseln und einem zusammengesetzten Primärschlüssel.',
      '**Fremdschlüssel in SQLite:** Sie werden nur geprüft, wenn `PRAGMA foreign_keys = ON;` gesetzt ist – standardmäßig ist das aus! In dieser App ist die Prüfung immer eingeschaltet. Was beim Löschen eines referenzierten Datensatzes passieren soll, legt man mit `ON DELETE CASCADE` (mitlöschen) oder `ON DELETE SET NULL` fest; ohne Angabe wird das Löschen verweigert.',
      '`ALTER TABLE tabelle ADD COLUMN spalte TYP;` fügt eine Spalte hinzu, ohne Daten zu verlieren. `DROP TABLE tabelle;` löscht die Tabelle **samt aller Daten**. `CREATE TABLE IF NOT EXISTS` bzw. `DROP TABLE IF EXISTS` vermeiden Fehler, wenn die Tabelle schon existiert bzw. fehlt.',
    ],
    terms: [
      { term: 'DDL', definition: 'Data Definition Language: Anweisungen, die Strukturen anlegen oder ändern (CREATE, ALTER, DROP).' },
      { term: 'Constraint', definition: 'Regel, die die Datenbank bei jedem INSERT und UPDATE prüft.' },
      { term: 'Zusammengesetzter Primärschlüssel', definition: 'Primärschlüssel aus mehreren Spalten – erst die Kombination ist eindeutig.' },
      { term: 'Zwischentabelle', definition: 'Tabelle, die eine n:m-Beziehung über zwei Fremdschlüssel abbildet.' },
      { term: 'Referentielle Integrität', definition: 'Jeder Fremdschlüsselwert verweist auf einen existierenden Datensatz.' },
    ],
    example: {
      db: 'vertrieb',
      tables: [{ label: 'Struktur der vorhandenen Tabelle bestellpositionen', sql: "SELECT name AS spalte, type AS datentyp, \"notnull\" AS pflicht, pk AS primaerschluessel\nFROM pragma_table_info('bestellpositionen');" }],
      sql: "CREATE TABLE lieferanten (\n  lieferant_id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL UNIQUE,\n  land TEXT NOT NULL DEFAULT 'DE',\n  bewertung INTEGER CHECK (bewertung BETWEEN 1 AND 5)\n);\n\nINSERT INTO lieferanten (lieferant_id, name) VALUES (1, 'Techno GmbH');\nINSERT INTO lieferanten (lieferant_id, name, land, bewertung) VALUES (2, 'Nordlicht AG', 'AT', 4);\n\nSELECT * FROM lieferanten;",
      note: 'Bei Techno GmbH wurde kein Land angegeben – deshalb steht dort der Standardwert „DE“. Die Bewertung ist NULL, weil sie optional ist. Das Beispiel läuft auf einer Kopie und verändert keine Übungsdatenbank.',
    },
    steps: [
      { code: 'CREATE TABLE lieferanten (', text: 'Neue Tabelle mit dem Namen „lieferanten“; die Spalten stehen in Klammern.' },
      { code: 'lieferant_id INTEGER PRIMARY KEY,', text: 'Ganze Zahl, eindeutiger Schlüssel. In SQLite wird sie automatisch vergeben, wenn man sie weglässt.' },
      { code: 'name TEXT NOT NULL UNIQUE,', text: 'Pflichtfeld, und kein Name darf doppelt vorkommen.' },
      { code: "land TEXT NOT NULL DEFAULT 'DE',", text: 'Pflichtfeld mit Standardwert – fehlt die Angabe beim INSERT, wird „DE“ eingetragen.' },
      { code: 'bewertung INTEGER CHECK (bewertung BETWEEN 1 AND 5)', text: 'Optional, aber wenn vorhanden, nur 1 bis 5. Kein Komma nach der letzten Spalte.' },
      { code: ');', text: 'Ende der Definition.' },
    ],
    extraSections: [
      {
        title: 'Constraints in Aktion: Fremdschlüssel',
        paragraphs: ['Eine Bestellung für einen nicht existierenden Kunden wird abgelehnt – die Datenbank meldet einen Fehler, statt fehlerhafte Daten zu speichern.'],
        db: 'vertrieb',
        sql: "INSERT INTO bestellungen (bestellung_id, kunde_id, bestelldatum, status)\nVALUES (99, 999, '2024-07-01', 'offen');",
        expectError: true,
      },
      {
        title: 'Beispiel: n:m-Beziehung mit Zwischentabelle',
        paragraphs: ['Mitarbeitende können an mehreren Projekten arbeiten, ein Projekt hat mehrere Mitarbeitende. Die Zwischentabelle speichert jede Zuordnung als eigene Zeile; der JOIN über alle drei Tabellen setzt sie wieder zusammen.'],
        db: 'vertrieb',
        sql: "CREATE TABLE projekte (\n  projekt_id INTEGER PRIMARY KEY,\n  titel TEXT NOT NULL\n);\nCREATE TABLE projekt_mitarbeit (\n  projekt_id INTEGER NOT NULL REFERENCES projekte(projekt_id),\n  mitarbeiter_id INTEGER NOT NULL REFERENCES mitarbeitende(mitarbeiter_id),\n  rolle TEXT,\n  PRIMARY KEY (projekt_id, mitarbeiter_id)\n);\nINSERT INTO projekte VALUES (1, 'Webshop'), (2, 'CRM-Einführung');\nINSERT INTO projekt_mitarbeit VALUES (1, 2, 'Leitung'), (1, 3, NULL), (2, 2, NULL), (2, 5, 'Marketing');\n\nSELECT p.titel, m.vorname, pm.rolle\nFROM projekt_mitarbeit AS pm\nJOIN projekte AS p ON p.projekt_id = pm.projekt_id\nJOIN mitarbeitende AS m ON m.mitarbeiter_id = pm.mitarbeiter_id\nORDER BY p.titel, m.vorname;",
      },
    ],
    dialectNotes: [
      'Automatisch hochzählende IDs: SQLite `INTEGER PRIMARY KEY` (optional `AUTOINCREMENT`), MySQL `AUTO_INCREMENT`, PostgreSQL `GENERATED ALWAYS AS IDENTITY` bzw. `SERIAL`, SQL Server `IDENTITY(1,1)`.',
      'Datentypen: Andere Datenbanken erzwingen Typen streng, z. B. `VARCHAR(100)` mit Längenbegrenzung, `DECIMAL(10,2)` für Geldbeträge, `DATE`/`TIMESTAMP` für Zeitpunkte, `BOOLEAN`. SQLite speichert dagegen fast alles in jeder Spalte (Type Affinity).',
      'Fremdschlüssel prüft SQLite nur nach `PRAGMA foreign_keys = ON;` – in MySQL (InnoDB), PostgreSQL und SQL Server sind sie immer aktiv.',
      'SQL Server erlaubt in einer UNIQUE-Spalte nur ein einziges NULL, SQLite, MySQL und PostgreSQL beliebig viele.',
      'ALTER TABLE ist in SQLite eingeschränkt (Spalten hinzufügen, umbenennen, löschen). Constraints nachträglich ändern geht nur über Neuanlegen der Tabelle; andere Datenbanken bieten `ALTER TABLE … ADD CONSTRAINT`.',
    ],
    summary: {
      merksatz: 'CREATE TABLE legt Spalten, Datentypen und Regeln fest. Constraints lassen die Datenbank selbst für saubere Daten sorgen; Fremdschlüssel bilden Beziehungen ab, n:m braucht eine Zwischentabelle.',
      fehler: [
        'Komma nach der letzten Spaltendefinition (Syntaxfehler).',
        'Fremdschlüssel ohne `NOT NULL` – dann ist „kein Partner“ erlaubt.',
        'UNIQUE für Pflichtfelder ohne `NOT NULL` – mehrere NULL bleiben möglich.',
        'Bei n:m einen einzelnen Primärschlüssel auf eine der beiden Spalten legen statt auf die Kombination.',
        'Mehrere Werte in ein Feld schreiben (`\'1,4,7\'`) statt eine Zwischentabelle anzulegen.',
        'Mit `DROP TABLE` statt `ALTER TABLE` arbeiten und dabei alle Daten verlieren.',
      ],
    },
  },
];
