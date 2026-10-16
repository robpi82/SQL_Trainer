import type { DbId } from '../db/seeds';

/**
 * Aufgabentypen:
 * - write:    SQL-Abfrage selbst schreiben
 * - fix:      fehlerhafte Abfrage korrigieren (Startcode enthält den Fehler)
 * - complete: unvollständige Abfrage ergänzen (Startcode mit Lücken ___)
 * - predict:  Ergebnis einer Abfrage vorhersagen (Auswahl), danach ausführen
 * - explain:  in eigenen Worten erklären; Abgleich mit Musterantwort zur Selbsteinschätzung
 */
export type ExerciseType = 'write' | 'fix' | 'complete' | 'predict' | 'explain';
export type Difficulty = 1 | 2 | 3;

export interface QueryCheck {
  kind: 'query';
  /** Reihenfolge prüfen – nur wenn die Aufgabe eine Sortierung verlangt. */
  orderMatters?: boolean;
  /** Spaltennamen/Aliase prüfen (Groß-/Kleinschreibung egal). Sonst zählt nur der Inhalt. */
  columnNames?: boolean;
  /**
   * Zusätzliche Testdaten: SQL, das vor der Prüfung auf eine frische Kopie angewendet wird.
   * So fallen Abfragen auf, die nur zufällig zu den Beispieldaten passen (z. B. fest eingetragene IDs).
   */
  variants?: { description: string; setup: string }[];
}

export interface StateCheck {
  kind: 'state';
  /** Abfrage(n), mit denen der entstandene Datenbankzustand verglichen wird (mit ORDER BY!). */
  stateQueries: { label: string; sql: string }[];
  variants?: { description: string; setup: string }[];
  /**
   * Testanweisungen, die nach der Lösung einzeln ausgeführt werden (z. B. INSERTs, die eine Regel verletzen).
   * Erwartet wird dasselbe Verhalten wie bei der Musterlösung: Fehler bzw. kein Fehler und – falls vorhanden – dasselbe Ergebnis.
   * `expectError` dokumentiert das erwartete Verhalten und wird in den automatischen Tests überprüft.
   */
  probes?: { label: string; sql: string; expectError: boolean; hint: string }[];
}

export interface Exercise {
  id: string;
  lessonId: string;
  /** true = angeleitete Übung der Lektion */
  guided?: boolean;
  type: ExerciseType;
  difficulty: Difficulty;
  db: DbId;
  title: string;
  /** Aufgabenstellung (Mini-Markup: `code`, **fett**, Absätze durch Leerzeile) */
  prompt: string;
  /** Startcode im Editor (bei fix/complete Pflicht, bei predict/explain die gezeigte Abfrage) */
  starterSql?: string;
  /** Drei Hilfestufen: 1. Denkanstoß, 2. Schlüsselwörter, 3. Gerüst */
  hints: [string, string, string];
  solution: string;
  solutionExplanation: string;
  /** Erwartete Spalten – nur zur Anzeige in der Aufgabe. */
  expectedColumns?: string[];
  check?: QueryCheck | StateCheck;
  /** Für predict: Antwortmöglichkeiten */
  choices?: { options: string[]; correct: number; explanation: string };
  /** Für explain: Musterantwort zur Selbsteinschätzung */
  modelAnswer?: string;
  /** Konzepte für die Stärken-/Schwächenanalyse */
  concepts: string[];
  /** Nur für automatische Tests der Inhalte: korrekte Alternativen und typische Fehllösungen. */
  tests?: { accept?: string[]; reject?: string[] };
}

export interface ModuleInfo {
  id: number;
  title: string;
  short: string;
  status: 'verfügbar' | 'geplant';
  lessonId?: string;
}

export interface LessonExample {
  db: DbId;
  /** Ausschnitt der Beispieltabelle(n) – wird live ausgeführt und angezeigt. */
  tables: { label: string; sql: string }[];
  sql: string;
  note?: string;
}

export interface Lesson {
  id: string;
  moduleId: number;
  title: string;
  goals: string[];
  /** Erklärung als Absätze (Mini-Markup) */
  explanation: string[];
  terms?: { term: string; definition: string }[];
  example: LessonExample;
  steps: { code: string; text: string }[];
  /** Klauseln, die in der Darstellung Schreib- vs. Verarbeitungsreihenfolge hervorgehoben werden. */
  logicalOrder?: string[];
  /** Hinweise zu Unterschieden SQLite vs. MySQL/PostgreSQL/SQL Server */
  dialectNotes?: string[];
  /** expectError: Das Beispiel soll absichtlich einen Fehler zeigen (z. B. verletzter Constraint). */
  extraSections?: { title: string; paragraphs: string[]; sql?: string; db?: DbId; expectError?: boolean }[];
  summary: { merksatz: string; fehler: string[] };
}
