# SQL verstehen – interaktive SQL-Lernanwendung (SQLite)

Eine deutschsprachige Lern-App für SQL. Du schreibst echte Abfragen, sie werden **wirklich ausgeführt** (SQLite im Browser über sql.js), und die App prüft das **Ergebnis**, nicht den SQL-Text. Kein Server, kein Konto, kein API-Schlüssel.

**SQL-Dialekt: SQLite.** Wo sich MySQL, PostgreSQL oder SQL Server unterscheiden, steht ein Hinweis in der Lektion bzw. im Nachschlagewerk.

---

## Inhalt der ersten Version

| Bereich | Stand |
|---|---|
| Lernpfad | Module 1–16 vollständig ausgearbeitet (Lernziel → Erklärung → Beispiel → Schritt für Schritt → angeleitete Übung → Aufgaben → Zusammenfassung) |
| Aufgaben | **117 Aufgaben** (82 davon in den Modulen 1–12: Grundlagen bis JOIN und Unterabfragen, 9 zu CASE WHEN, 6 zu INSERT/UPDATE/DELETE, 9 zu CREATE TABLE, 11 Praxis- und Analyseaufgaben), leicht/mittel/anspruchsvoll |
| Aufgabentypen | Abfrage schreiben, Fehler korrigieren, Abfrage ergänzen, Ergebnis vorhersagen, Erklären (Selbsteinschätzung mit Musterantwort) |
| Prüfung | Ergebnisvergleich mit Duplikaten, optionaler Reihenfolge- und Spaltennamenprüfung, zusätzlichen Testdaten, Zustandsprüfung für INSERT/UPDATE/DELETE |
| Hilfen | 3 Stufen (Denkanstoß → Schlüsselwörter → Gerüst), Musterlösung erst nach Bestätigung |
| Fehler | Syntaxfehler, unbekannte Tabelle/Spalte, logische Fehler und Constraint-Verletzungen werden unterschieden – mit Originalmeldung und Erklärung |
| Bereiche | Übersicht, Lernpfad, Freies Üben, Wiederholen (1/3/7/14 Tage), Wissenstest, SQL-Sandbox, Nachschlagewerk, Fortschritt & Daten |
| Speicherung | Fortschritt dauerhaft im Browser (localStorage), JSON-Export/-Import, Zurücksetzen mit Bestätigung |
| Oberfläche | Hell/Dunkel, Tastaturbedienung (Strg+Enter, Strg+Umschalt+Enter), Desktop und Tablet |

**Noch nicht enthalten (als „geplant“ markiert):** CTEs (WITH) und Window Functions.

---

## Start unter Windows

### 1. Voraussetzungen

- **Node.js (LTS-Version, mindestens 18, empfohlen 20 oder 22)** – Download: <https://nodejs.org/de> → „LTS“ wählen und mit den Standardeinstellungen installieren. npm ist darin enthalten.
- Ein aktueller Browser: **Edge, Chrome oder Firefox**.

Prüfen, ob Node.js installiert ist – PowerShell öffnen (Startmenü → „PowerShell“) und eingeben:

```powershell
node -v
npm -v
```

Es sollten Versionsnummern erscheinen (z. B. `v22.x.x` und `10.x.x`).

### 2. Installation

1. Den Projektordner `sql-lernapp` an einen beliebigen Ort kopieren bzw. das ZIP entpacken, z. B. nach `C:\Users\<Name>\Documents\sql-lernapp`.
2. Im Explorer den Ordner öffnen, oben in die Adressleiste klicken, `powershell` eingeben und Enter drücken. Es öffnet sich eine PowerShell direkt in diesem Ordner.
   (Alternativ: `cd "C:\Users\<Name>\Documents\sql-lernapp"`.)
3. Abhängigkeiten installieren (einmalig, braucht Internet):

```powershell
npm install
```

> **Falls eine Fehlermeldung wie „Die Datei npm.ps1 kann nicht geladen werden“ erscheint:** Verwende `npm.cmd` statt `npm` (z. B. `npm.cmd install`) oder erlaube Skripte einmalig für deinen Benutzer:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

### 3. Benötigte Terminalbefehle

| Befehl | Wozu |
|---|---|
| `npm install` | Abhängigkeiten installieren (einmalig bzw. nach Updates) |
| `npm run dev` | App im Entwicklungsmodus starten |
| `npm run build` | Typprüfung und fertige Version in `dist\` erzeugen |
| `npm run preview` | Die gebaute Version aus `dist\` lokal starten |
| `npm test` | Automatische Tests: prüft alle Musterlösungen, Alternativ- und Fehllösungen, Prüflogik und Fortschrittslogik |

### 4. Start der Anwendung

```powershell
npm run dev
```

Danach im Browser öffnen: **<http://localhost:5173>**
(Die Adresse steht auch in der PowerShell. Beenden mit `Strg + C`.)

Hinweise:
- Der Fortschritt wird **pro Browser** gespeichert. Wer Browser oder Rechner wechselt, nutzt „Fortschritt & Daten → Exportieren/Importieren“.
- Die gebaute Version (`dist\`) braucht einen kleinen Webserver (`npm run preview`). Ein Doppelklick auf `index.html` funktioniert nicht, weil Browser Web Worker und WebAssembly über `file://` blockieren.

### 5. Eigene Aufgaben hinzufügen

Alle Inhalte liegen als strukturierte TypeScript-Daten in `src\content\`:

```
src\content\
  modules.ts            Modulliste (Status „verfügbar“ / „geplant“)
  lessons.ts            Lektionen (Erklärung, Beispiel, Schritte, Merksatz, typische Fehler)
  reference.ts          Nachschlagewerk
  exercises\
    m01-m04.ts …        Aufgaben, nach Modulen gruppiert
    index.ts            Sammelt alle Aufgabendateien
src\db\seeds.ts         Die drei Übungsdatenbanken (Tabellen + Daten)
```

**Beispiel – eine neue Aufgabe** (z. B. am Ende von `src\content\exercises\m05-m08.ts` in das Array einfügen):

```ts
{
  id: 'm06-e6',                 // eindeutig!
  lessonId: 'm06',              // zu welcher Lektion
  type: 'write',                // write | fix | complete | predict | explain
  difficulty: 2,                // 1 leicht, 2 mittel, 3 anspruchsvoll
  db: 'forschung',              // vertrieb | forschung | support
  title: 'Notizen vorhanden',
  prompt: 'Zeige `beobachtung_id` und `notiz` aller Beobachtungen **mit** Notiz.',
  expectedColumns: ['beobachtung_id', 'notiz'],
  hints: [
    'Gesucht sind Zeilen, in denen die Spalte einen Wert hat.',      // 1. Denkanstoß
    'Schlüsselwörter: `IS NOT NULL`.',                              // 2. Schlüsselwörter
    'SELECT beobachtung_id, notiz\nFROM beobachtungen\nWHERE ___;',  // 3. Gerüst
  ],
  solution: 'SELECT beobachtung_id, notiz\nFROM beobachtungen\nWHERE notiz IS NOT NULL;',
  solutionExplanation: '`IS NOT NULL` findet vorhandene Werte. `<> NULL` würde nie zutreffen.',
  check: q({
    orderMatters: false,        // Reihenfolge nur prüfen, wenn die Aufgabe sortieren verlangt
    columnNames: false,         // true = Aliase/Spaltennamen werden geprüft
    variants: [{                // zusätzliche Testdaten gegen „zufällig richtige“ Abfragen
      description: 'Eine zusätzliche Beobachtung mit Notiz.',
      setup: "INSERT INTO beobachtungen VALUES (25, 2, 1, '2024-08-02', 'Basstölpel', 80, 'Nebel');",
    }],
  }),
  concepts: ['NULL'],           // für Stärken/Übungsschwerpunkte
  tests: {                      // nur für „npm test“
    accept: ['SELECT beobachtung_id, notiz FROM beobachtungen WHERE NOT notiz IS NULL'],
    reject: ['SELECT beobachtung_id, notiz FROM beobachtungen WHERE notiz <> NULL'],
  },
},
```

Weitere Möglichkeiten:
- **Fehler korrigieren / ergänzen:** `type: 'fix'` bzw. `'complete'` und `starterSql` mit dem fehlerhaften bzw. lückenhaften Code (Lücken als `___`).
- **Vorhersage:** `type: 'predict'`, `starterSql` (gezeigte Abfrage) und `choices: { options: [...], correct: 1, explanation: '…' }`.
- **Erklären:** `type: 'explain'` und `modelAnswer` (Musterantwort zur Selbsteinschätzung).
- **Schreiboperationen:** `check: state({ stateQueries: [{ label: 'Tabelle produkte', sql: 'SELECT * FROM produkte ORDER BY produkt_id;' }] })` – geprüft wird der Tabelleninhalt nach der Anweisung.

**Erwartete Ergebnisse ansehen** (praktisch beim Schreiben von Aufgaben):

```powershell
npx vite-node scripts/abfrage.ts forschung "SELECT * FROM beobachtungen WHERE notiz IS NOT NULL"
```

**Danach immer prüfen:**

```powershell
npm test
```

Der Test führt jede Musterlösung aus, prüft, dass sie akzeptiert wird, dass Startcode und `reject`-Lösungen abgelehnt und `accept`-Alternativen akzeptiert werden.

**Neue Lektion / neues Modul:** Lektion in `lessons.ts` ergänzen, in `modules.ts` beim Modul `status: 'verfügbar'` und `lessonId` setzen, Aufgaben mit dieser `lessonId` anlegen (genau eine mit `guided: true` für die angeleitete Übung).

---

## Wie die Prüfung funktioniert

1. Deine Abfrage läuft auf einer **frischen Kopie** der Übungsdatenbank (deine Experimente stören die Prüfung nicht).
2. Die Musterlösung läuft ebenfalls; verglichen werden die **Ergebnisse**:
   - Zeilen als Multimenge – **Duplikate zählen**.
   - **Reihenfolge** nur, wenn die Aufgabe eine Sortierung verlangt.
   - **Spaltennamen** nur, wenn die Aufgabe es angibt; vertauschte Spalten werden erkannt und akzeptiert.
   - Zahlen mit Toleranz für Gleitkomma-Rauschen (4 Nachkommastellen).
3. Bei manchen Aufgaben folgt ein zweiter Durchlauf mit **veränderten Testdaten**, damit fest eingetragene IDs oder Werte auffallen.
4. Bei INSERT/UPDATE/DELETE wird der **entstandene Tabelleninhalt** verglichen, inklusive Hinweis auf fehlendes WHERE.
5. Bei falschen Ergebnissen sagt die App konkret, ob Zeilen fehlen oder zu viel sind, ob Duplikate, Reihenfolge oder einzelne Spalten abweichen – ohne die Lösung zu verraten.

Freie Erklärungen werden **nicht** automatisch bewertet. Du vergleichst sie selbst mit einer Musterantwort.

## Wie der Fortschritt berechnet wird

| Status | Bedeutung | Punkte |
|---|---|---|
| Noch nicht begonnen | Nicht ausgeführt/geprüft (Öffnen zählt nicht) | 0 |
| In Bearbeitung | Ausgeführt, geprüft oder Hinweis geöffnet, noch nicht gelöst | 0 |
| Musterlösung angesehen | Lösung angezeigt, bevor die Aufgabe gelöst war (bzw. am selben Tag) | 0 |
| Mit Hilfe gelöst | Richtig gelöst, nachdem am selben Tag ein Hinweis genutzt wurde | 0,5 |
| Selbstständig gelöst | Richtig gelöst ohne Hinweis/Lösung am selben Tag | 1 |

Modulfortschritt = Punkte ÷ Aufgaben des Moduls. Ein Status wird nie schlechter. Aufgaben mit Hilfe, Musterlösung oder Fehlversuchen werden nach 1, 3, 7 und 14 Tagen zur Wiederholung vorgeschlagen.

## Architektur

```
React + TypeScript + Vite
 ├─ src/db/sql.worker.ts      Web Worker: sql.js (SQLite als WebAssembly)
 ├─ src/db/sqlCore.ts         isolierte Arbeitsdatenbanken je Aufgabe, frische Kopien für Prüfungen
 ├─ src/db/sqlClient.ts       Kommunikation mit dem Worker, Zeitlimit 5 s, Abbrechen, Neustart
 ├─ src/engine/compare.ts     Ergebnisvergleich + verständliche Abweichungsbeschreibung
 ├─ src/engine/check.ts       Prüfablauf (Abfrage, Testdaten-Varianten, Zustandsprüfung)
 ├─ src/engine/errors.ts      Fehlerklassifikation und Erklärungen
 ├─ src/progress/             Fortschritt (reine Logik + React-Context, localStorage)
 ├─ src/content/              Lektionen, Aufgaben, Nachschlagewerk (Daten)
 ├─ src/components/, pages/   Oberfläche
 └─ tests/                    Vitest: Inhalte, Prüflogik, Fortschritt
```

Lernfortschritt (localStorage) und Übungsdatenbanken (nur im Arbeitsspeicher des Workers) sind getrennt. Schreiboperationen betreffen nur die Arbeitskopie der jeweiligen Aufgabe bzw. der Sandbox.
