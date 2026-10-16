import type { TableInfo } from '../db/types';

export type ErrorCategory = 'syntax' | 'unknown' | 'logic' | 'constraint' | 'timeout' | 'other';

export interface ExplainedError {
  category: ErrorCategory;
  /** Überschrift, z. B. „Syntaxfehler“ */
  title: string;
  /** Verständliche Erklärung – leer, wenn der Fehler nicht zuverlässig erkannt wurde */
  explanation: string[];
  /** Originalmeldung der Datenbank */
  original: string;
}

export const CATEGORY_LABEL: Record<ErrorCategory, string> = {
  syntax: 'Syntaxfehler',
  unknown: 'Unbekannte Tabelle oder Spalte',
  logic: 'Abfrage so nicht zulässig',
  constraint: 'Regel (Constraint) verletzt',
  timeout: 'Zeitlimit / Abbruch',
  other: 'Datenbankfehler',
};

/** Funktionen anderer SQL-Dialekte und ihre SQLite-Entsprechung */
const FOREIGN_FUNCTIONS: Record<string, string> = {
  YEAR: "In SQLite gibt es YEAR() nicht. Verwende strftime('%Y', datum) – Ergebnis ist ein Text wie '2024'.",
  MONTH: "In SQLite gibt es MONTH() nicht. Verwende strftime('%m', datum) – Ergebnis ist ein Text wie '03'.",
  DAY: "In SQLite gibt es DAY() nicht. Verwende strftime('%d', datum).",
  NOW: "In SQLite gibt es NOW() nicht. Verwende datetime('now') bzw. date('now').",
  CURDATE: "In SQLite gibt es CURDATE() nicht. Verwende date('now').",
  GETDATE: "GETDATE() stammt aus SQL Server. In SQLite: datetime('now').",
  DATEDIFF: 'DATEDIFF() gibt es in SQLite nicht. Differenz in Tagen: julianday(ende) - julianday(start).',
  DATEADD: "DATEADD() stammt aus SQL Server. In SQLite: date(datum, '+7 days').",
  DATE_ADD: "DATE_ADD() stammt aus MySQL. In SQLite: date(datum, '+7 days').",
  DATE_FORMAT: "DATE_FORMAT() stammt aus MySQL. In SQLite: strftime('%d.%m.%Y', datum).",
  TO_CHAR: "TO_CHAR() stammt aus PostgreSQL/Oracle. In SQLite: strftime(...).",
  EXTRACT: "EXTRACT() kennt SQLite nicht. Verwende strftime('%Y', datum) usw.",
  LEN: 'LEN() stammt aus SQL Server. In SQLite heißt die Funktion LENGTH().',
  ISNULL: 'ISNULL(a, b) stammt aus SQL Server. In SQLite: IFNULL(a, b) oder COALESCE(a, b).',
  NVL: 'NVL() stammt aus Oracle. In SQLite: COALESCE(a, b).',
  CHARINDEX: 'CHARINDEX() stammt aus SQL Server. In SQLite: INSTR(text, suchtext).',
  LOCATE: 'LOCATE() stammt aus MySQL. In SQLite: INSTR(text, suchtext).',
  CONCAT_WS: "CONCAT_WS() ist in dieser SQLite-Version nicht verfügbar. Verwende den Operator ||, z. B. vorname || ' ' || nachname.",
  CONCAT: "Verwende in SQLite den Operator ||, z. B. vorname || ' ' || nachname.",
  STDDEV: 'SQLite hat keine eingebaute Standardabweichung.',
  MEDIAN: 'SQLite hat keine eingebaute MEDIAN-Funktion.',
};

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

function suggest(name: string, candidates: string[]): string[] {
  const n = name.toLowerCase();
  return [...new Set(candidates)]
    .map((c) => ({ c, d: levenshtein(n, c.toLowerCase()) }))
    .filter((x) => x.d <= Math.max(2, Math.floor(n.length / 3)) || x.c.toLowerCase().includes(n) || n.includes(x.c.toLowerCase()))
    .sort((x, y) => x.d - y.d)
    .slice(0, 3)
    .map((x) => x.c);
}

const CLAUSE_ORDER = 'SELECT … FROM … JOIN … ON … WHERE … GROUP BY … HAVING … ORDER BY … LIMIT …';

export function explainError(message: string, sql: string, schema?: TableInfo[]): ExplainedError {
  const original = message;
  const tables = schema?.map((t) => t.name) ?? [];
  const columns = schema?.flatMap((t) => t.columns.map((c) => c.name)) ?? [];
  let m: RegExpMatchArray | null;

  if (/Zeitlimit|abgebrochen/i.test(message)) {
    return {
      category: 'timeout',
      title: CATEGORY_LABEL.timeout,
      explanation: [
        'Die Ausführung hat zu lange gedauert oder wurde abgebrochen. Die SQL-Umgebung wurde neu gestartet; deine Übungsdatenbank ist dabei auf den Ausgangszustand zurückgesetzt worden.',
        'Häufige Ursache: Ein JOIN ohne passende ON-Bedingung verknüpft jede Zeile mit jeder anderen (kartesisches Produkt).',
      ],
      original,
    };
  }

  if ((m = message.match(/no such table: (\S+)/i))) {
    const name = m[1].replace(/^main\./, '');
    const s = suggest(name, tables);
    return {
      category: 'unknown',
      title: CATEGORY_LABEL.unknown,
      explanation: [
        `Die Tabelle „${name}“ gibt es in dieser Datenbank nicht.`,
        s.length ? `Meintest du: ${s.map((x) => `„${x}“`).join(', ')}?` : `Vorhandene Tabellen: ${tables.join(', ')}.`,
        'Tipp: Das Schema links zeigt alle Tabellen. Tabellennamen werden hier kleingeschrieben und ohne Umlaute geführt (z. B. „flaeche_km2“).',
      ],
      original,
    };
  }

  if ((m = message.match(/no such column: (\S+)/i))) {
    const full = m[1];
    const name = full.includes('.') ? full.split('.').pop()! : full;
    const s = suggest(name, columns);
    const expl = [`Die Spalte „${full}“ ist in den verwendeten Tabellen unbekannt.`];
    if (s.length) expl.push(`Ähnliche Spaltennamen: ${s.map((x) => `„${x}“`).join(', ')}.`);
    if (full.includes('.')) expl.push(`Prüfe auch, ob der Tabellenalias „${full.split('.')[0]}“ in FROM bzw. JOIN so vergeben wurde und die Spalte zu dieser Tabelle gehört.`);
    if (/^[A-ZÄÖÜa-zäöü]/.test(name) && !columns.some((c) => c.toLowerCase() === name.toLowerCase()))
      expl.push(`Falls „${name}“ ein Wert (Text) sein soll: Texte stehen in einfachen Anführungszeichen, z. B. '${name}'.`);
    return { category: 'unknown', title: CATEGORY_LABEL.unknown, explanation: expl, original };
  }

  if ((m = message.match(/ambiguous column name: (\S+)/i))) {
    return {
      category: 'unknown',
      title: 'Mehrdeutiger Spaltenname',
      explanation: [
        `Die Spalte „${m[1]}“ gibt es in mehreren der verknüpften Tabellen. Die Datenbank weiß nicht, welche gemeint ist.`,
        `Lösung: Schreibe den Tabellennamen oder Alias davor, z. B. k.${m[1]} oder b.${m[1]}.`,
      ],
      original,
    };
  }

  if ((m = message.match(/no such function: (\S+)/i))) {
    const fn = m[1].toUpperCase();
    return {
      category: 'unknown',
      title: 'Unbekannte Funktion',
      explanation: [
        `Die Funktion „${m[1]}“ kennt SQLite nicht.`,
        FOREIGN_FUNCTIONS[fn] ?? 'Prüfe die Schreibweise. Im Nachschlagewerk findest du die in SQLite verfügbaren Funktionen.',
      ],
      original,
    };
  }

  if (/misuse of aggregate/i.test(message)) {
    return {
      category: 'logic',
      title: 'Aggregatfunktion an falscher Stelle',
      explanation: [
        'Aggregatfunktionen wie COUNT, SUM oder AVG dürfen nicht in WHERE stehen. WHERE filtert einzelne Zeilen, bevor gruppiert und gezählt wird – zu diesem Zeitpunkt gibt es noch keine Summen oder Anzahlen.',
        'Bedingungen auf Gruppenergebnisse gehören in HAVING (nach GROUP BY).',
      ],
      original,
    };
  }

  if (/GROUP BY clause is required before HAVING|HAVING clause on a non-aggregate query/i.test(message)) {
    return {
      category: 'logic',
      title: 'HAVING ohne Gruppierung',
      explanation: ['HAVING filtert Gruppen. Ohne GROUP BY bzw. Aggregatfunktion gibt es nichts zu filtern – meist gehört die Bedingung in WHERE.'],
      original,
    };
  }

  if (/aggregate functions are not allowed in the GROUP BY clause/i.test(message)) {
    return {
      category: 'logic',
      title: 'Aggregat in GROUP BY',
      explanation: ['In GROUP BY stehen die Spalten, nach denen gruppiert wird – keine Aggregatfunktionen.'],
      original,
    };
  }

  if ((m = message.match(/sub-select returns (\d+) columns - expected 1/i))) {
    return {
      category: 'logic',
      title: 'Unterabfrage liefert zu viele Spalten',
      explanation: [
        `Die Unterabfrage liefert ${m[1]} Spalten. Für Vergleiche mit =, <, > oder IN darf sie nur genau eine Spalte zurückgeben.`,
      ],
      original,
    };
  }

  if (/row value misused/i.test(message)) {
    return {
      category: 'logic',
      title: 'Klammerausdruck falsch verwendet',
      explanation: ['Mehrere Werte in Klammern (a, b) dürfen nur an bestimmten Stellen stehen. Prüfe Klammern bei IN (...) und Unterabfragen.'],
      original,
    };
  }

  if ((m = message.match(/wrong number of arguments to function (\S+)/i))) {
    return {
      category: 'logic',
      title: 'Falsche Anzahl an Argumenten',
      explanation: [`Die Funktion ${m[1]} wurde mit zu vielen oder zu wenigen Werten aufgerufen. Das Nachschlagewerk zeigt die Syntax.`],
      original,
    };
  }

  if ((m = message.match(/(NOT NULL|UNIQUE|FOREIGN KEY|CHECK|PRIMARY KEY) constraint failed:?\s*(.*)/i))) {
    const kind = m[1].toUpperCase();
    const text: Record<string, string> = {
      'NOT NULL': `Die Spalte ${m[2]} darf nicht leer (NULL) sein. Gib beim INSERT einen Wert für sie an.`,
      UNIQUE: `Der Wert für ${m[2]} existiert bereits. Diese Spalte muss eindeutig sein (z. B. ein Primärschlüssel).`,
      'PRIMARY KEY': `Der Primärschlüssel ${m[2]} existiert bereits.`,
      'FOREIGN KEY': 'Ein Fremdschlüssel verweist auf einen Datensatz, den es nicht gibt – oder du willst einen Datensatz löschen, auf den noch verwiesen wird.',
      CHECK: `Ein Wert verletzt eine CHECK-Bedingung ${m[2]}.`,
    };
    return { category: 'constraint', title: CATEGORY_LABEL.constraint, explanation: [text[kind]], original };
  }

  if (/datatype mismatch/i.test(message)) {
    return {
      category: 'constraint',
      title: 'Falscher Datentyp',
      explanation: ['Ein INTEGER PRIMARY KEY in SQLite muss eine ganze Zahl sein.'],
      original,
    };
  }

  if ((m = message.match(/table (\S+) already exists/i))) {
    return {
      category: 'other',
      title: 'Tabelle existiert bereits',
      explanation: [`Die Tabelle ${m[1]} gibt es schon. Setze die Übungsdatenbank zurück oder verwende CREATE TABLE IF NOT EXISTS.`],
      original,
    };
  }

  if (/incomplete input/i.test(message)) {
    return {
      category: 'syntax',
      title: CATEGORY_LABEL.syntax,
      explanation: [
        'Die Abfrage endet unerwartet. Häufige Ursachen: eine geöffnete Klammer wurde nicht geschlossen, ein Text-Anführungszeichen fehlt am Ende oder nach einem Schlüsselwort (z. B. WHERE) fehlt die Bedingung.',
      ],
      original,
    };
  }

  if ((m = message.match(/unrecognized token: "(.*)"/i))) {
    return {
      category: 'syntax',
      title: CATEGORY_LABEL.syntax,
      explanation: [
        `SQLite kann „${m[1]}“ nicht lesen. Meist fehlt ein schließendes einfaches Anführungszeichen ' bei einem Text oder es steht ein ungültiges Zeichen in der Abfrage.`,
      ],
      original,
    };
  }

  if ((m = message.match(/near "(.*)": syntax error/i))) {
    const tok = m[1];
    const up = tok.toUpperCase();
    const expl = [`SQLite hat kurz vor oder bei „${tok}“ etwas Unerwartetes gefunden.`];
    if (/\bTOP\s+\d+/i.test(sql)) expl.push('TOP stammt aus SQL Server. In SQLite (und MySQL/PostgreSQL) begrenzt man mit LIMIT am Ende der Abfrage: … ORDER BY preis DESC LIMIT 3.');
    else if (up === 'FROM') expl.push('Steht vor FROM ein überflüssiges Komma nach der letzten Spalte? Oder fehlt die Spaltenliste hinter SELECT?');
    else if (['WHERE', 'GROUP', 'ORDER', 'HAVING', 'LIMIT', 'JOIN', 'ON', 'BY'].includes(up))
      expl.push(`Prüfe die Reihenfolge der Klauseln: ${CLAUSE_ORDER}. Fehlt davor etwas (Tabellenname, Bedingung, Komma) – oder steht ein Komma zu viel?`);
    else if (up === ',') expl.push('Ein Komma steht an einer unerwarteten Stelle – z. B. doppelt oder vor FROM bzw. am Ende der Spaltenliste.');
    else if (up === ')' || up === '(') expl.push('Prüfe die Klammern: Zu jeder öffnenden Klammer gehört eine schließende – und Funktionen wie COUNT( ) brauchen ihren Inhalt.');
    else if (/^(SELECT|UPDATE|DELETE|INSERT|CREATE)$/.test(up)) expl.push('Wahrscheinlich fehlt ein Semikolon ; zwischen zwei Anweisungen oder eine Unterabfrage steht nicht in Klammern.');
    else if (/^[A-ZÄÖÜa-zäöü_]+$/.test(tok))
      expl.push('Ist ein Schlüsselwort falsch geschrieben (z. B. SELCT, FORM, WHRE) – oder fehlt ein Komma zwischen zwei Spalten?');
    if (/=\s*NULL/i.test(sql)) expl.push('Hinweis: Vergleiche mit NULL schreibt man als IS NULL bzw. IS NOT NULL.');
    if (sql.includes('___')) expl.push('Im Code stehen noch Lücken „___“, die ersetzt werden müssen.');
    return { category: 'syntax', title: CATEGORY_LABEL.syntax, explanation: expl, original };
  }

  if (/syntax error/i.test(message)) {
    return { category: 'syntax', title: CATEGORY_LABEL.syntax, explanation: ['Die Abfrage entspricht nicht der SQL-Grammatik.'], original };
  }

  return { category: 'other', title: CATEGORY_LABEL.other, explanation: [], original };
}

/**
 * Weiche Hinweise zu Abfragen, die zwar laufen, aber typische Missverständnisse enthalten.
 * Nur Hinweise, keine Bewertung.
 */
export function lintSql(sql: string, schema?: TableInfo[]): string[] {
  const notes: string[] = [];
  const names = new Set(
    (schema ?? []).flatMap((t) => [t.name.toLowerCase(), ...t.columns.map((c) => c.name.toLowerCase())]),
  );
  const noComments = sql.replace(/--.*$/gm, '').replace(/'(?:[^']|'')*'/g, "''");
  const dq = [...noComments.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  const suspicious = dq.filter((d) => !names.has(d.toLowerCase()));
  if (suspicious.length)
    notes.push(
      `„"${suspicious[0]}"“ steht in doppelten Anführungszeichen. In SQL bezeichnen doppelte Anführungszeichen Namen (Spalten/Tabellen), Texte gehören in einfache: '${suspicious[0]}'. SQLite ist hier nachsichtig, andere Datenbanken melden einen Fehler.`,
    );
  if (/(=|<>|!=)\s*NULL\b/i.test(noComments))
    notes.push('Ein Vergleich wie `= NULL` ist nie wahr – auch nicht bei NULL-Werten. Verwende `IS NULL` bzw. `IS NOT NULL`.');
  return notes;
}
