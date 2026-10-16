import type { ResultSet, SqlValue } from '../db/types';

/**
 * Vergleich von Abfrageergebnissen.
 *
 * Grundsätze:
 * - Zeilen werden als Multimenge verglichen: Duplikate zählen mit.
 * - Die Reihenfolge wird nur geprüft, wenn `orderMatters` gesetzt ist.
 * - Spaltennamen werden nur geprüft, wenn `columnNames` gesetzt ist (ohne Groß-/Kleinschreibung).
 * - Zahlen werden auf 4 Nachkommastellen normalisiert (Gleitkomma-Rundungsdifferenzen).
 */

export interface CompareOptions {
  orderMatters?: boolean;
  columnNames?: boolean;
}

export interface RowExample {
  label: string;
  columns: string[];
  rows: SqlValue[][];
}

export interface CompareResult {
  match: boolean;
  /** Verständliche Beschreibung der Abweichungen (ohne die Lösung zu verraten) */
  messages: string[];
  /** Hinweise, die auch bei korrekter Lösung angezeigt werden */
  notes: string[];
  /** Beispielzeilen (zu viel / fehlend) – werden in der Oberfläche einklappbar gezeigt */
  examples: RowExample[];
}

export function normValue(v: SqlValue): SqlValue {
  if (typeof v === 'number') {
    const r = Math.round(v * 1e4) / 1e4;
    return Object.is(r, -0) ? 0 : r;
  }
  return v;
}

const rowKey = (row: SqlValue[]) => JSON.stringify(row.map(normValue));

function countMap(rows: SqlValue[][]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = rowKey(r);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

interface RowDiff {
  equalMultiset: boolean;
  equalSequence: boolean;
  missing: SqlValue[][];
  extra: SqlValue[][];
  sameDistinct: boolean;
}

export function diffRows(expected: SqlValue[][], actual: SqlValue[][]): RowDiff {
  const em = countMap(expected);
  const am = countMap(actual);
  const missing: SqlValue[][] = [];
  const extra: SqlValue[][] = [];
  const remaining = new Map(am);
  for (const r of expected) {
    const k = rowKey(r);
    const c = remaining.get(k) ?? 0;
    if (c > 0) remaining.set(k, c - 1);
    else missing.push(r);
  }
  const remainingE = new Map(em);
  for (const r of actual) {
    const k = rowKey(r);
    const c = remainingE.get(k) ?? 0;
    if (c > 0) remainingE.set(k, c - 1);
    else extra.push(r);
  }
  const equalMultiset = missing.length === 0 && extra.length === 0;
  const equalSequence =
    equalMultiset && expected.length === actual.length && expected.every((r, i) => rowKey(r) === rowKey(actual[i]));
  const sameDistinct = em.size === am.size && [...em.keys()].every((k) => am.has(k));
  return { equalMultiset, equalSequence, missing, extra, sameDistinct };
}

function project(rs: ResultSet, mapping: number[]): ResultSet {
  return { columns: mapping.map((i) => rs.columns[i]), rows: rs.rows.map((r) => mapping.map((i) => r[i])) };
}

function columnMultisetKey(rows: SqlValue[][], col: number): string {
  return JSON.stringify(rows.map((r) => JSON.stringify(normValue(r[col]))).sort());
}

/** Sucht eine Spaltenzuordnung, bei der die Spalteninhalte (als Multimenge) übereinstimmen. */
function findPermutation(expected: ResultSet, actual: ResultSet): number[] | null {
  const n = expected.columns.length;
  if (n > 7) return null;
  const expKeys = Array.from({ length: n }, (_, i) => columnMultisetKey(expected.rows, i));
  const actKeys = Array.from({ length: n }, (_, i) => columnMultisetKey(actual.rows, i));
  const used = new Array(n).fill(false);
  const mapping: number[] = [];
  const solutions: number[][] = [];
  const rec = (i: number) => {
    if (solutions.length > 20) return;
    if (i === n) {
      solutions.push([...mapping]);
      return;
    }
    for (let j = 0; j < n; j++) {
      if (!used[j] && actKeys[j] === expKeys[i]) {
        used[j] = true;
        mapping.push(j);
        rec(i + 1);
        mapping.pop();
        used[j] = false;
      }
    }
  };
  rec(0);
  for (const s of solutions) {
    const p = project(actual, s);
    if (diffRows(expected.rows, p.rows).equalMultiset) return s;
  }
  return null;
}

const fmtCols = (cols: string[]) => cols.map((c) => `„${c}“`).join(', ');

export function compareResultSets(expected: ResultSet, actual: ResultSet, opts: CompareOptions = {}): CompareResult {
  const messages: string[] = [];
  const notes: string[] = [];
  const examples: RowExample[] = [];
  const n = expected.columns.length;

  if (actual.columns.length !== n) {
    messages.push(
      `Erwartet ${n === 1 ? 'wird 1 Spalte' : `werden ${n} Spalten`}, dein Ergebnis hat ${actual.columns.length}. ` +
        (opts.columnNames ? `Gesucht sind: ${fmtCols(expected.columns)}.` : 'Prüfe die Spaltenauswahl hinter SELECT.'),
    );
    if (actual.rows.length !== expected.rows.length) {
      messages.push(`Außerdem hat dein Ergebnis ${actual.rows.length} Zeilen, erwartet werden ${expected.rows.length}.`);
    }
    return { match: false, messages, notes, examples };
  }

  const expNames = expected.columns.map((c) => c.toLowerCase());
  const actNames = actual.columns.map((c) => c.toLowerCase());
  let mapping = expNames.map((_, i) => i);
  let namesOk = true;

  const sameNameSet =
    new Set(actNames).size === n && expNames.every((e) => actNames.includes(e)) && new Set(expNames).size === n;
  if (sameNameSet) {
    mapping = expNames.map((e) => actNames.indexOf(e));
    if (mapping.some((m, i) => m !== i)) notes.push('Deine Spalten stehen in einer anderen Reihenfolge als angegeben – inhaltlich wird das akzeptiert.');
  } else if (opts.columnNames) {
    namesOk = false;
    const missing = expected.columns.filter((c) => !actNames.includes(c.toLowerCase()));
    messages.push(
      `Die Spaltennamen sind Teil der Aufgabe. Es fehlen bzw. heißen anders: ${fmtCols(missing)}. ` +
        'Vergib die Namen mit einem Alias, z. B. `ausdruck AS name`.',
    );
  }

  let act = project(actual, mapping);
  let diff = diffRows(expected.rows, act.rows);

  if (!diff.equalMultiset && !sameNameSet) {
    const perm = findPermutation(expected, actual);
    if (perm) {
      act = project(actual, perm);
      diff = diffRows(expected.rows, act.rows);
      notes.push('Deine Spalten stehen in einer anderen Reihenfolge als angegeben – inhaltlich wird das akzeptiert.');
    }
  }

  if (diff.equalMultiset) {
    if (opts.orderMatters && !diff.equalSequence) {
      messages.push(
        'Alle Zeilen stimmen, aber die Reihenfolge nicht. Prüfe ORDER BY: richtige Spalte? ASC oder DESC? Wird ein zweites Sortierkriterium verlangt?',
      );
      return { match: false, messages, notes, examples };
    }
    if (!namesOk) {
      messages.push('Inhaltlich stimmen die Werte bereits – es fehlen nur die richtigen Spaltennamen.');
      return { match: false, messages, notes, examples };
    }
    return { match: true, messages, notes, examples };
  }

  const e = expected.rows.length;
  const a = act.rows.length;
  if (a === 0) {
    messages.push(
      `Deine Abfrage liefert keine Zeilen, erwartet werden ${e}. Prüfe die Bedingungen: Schreibweise der Werte (Groß-/Kleinschreibung, Leerzeichen), Vergleichsoperatoren und NULL-Vergleiche (IS NULL statt = NULL).`,
    );
  } else if (e === 0) {
    messages.push(`Erwartet wird ein leeres Ergebnis, deine Abfrage liefert ${a} Zeilen.`);
  } else if (diff.sameDistinct) {
    if (a > e) {
      messages.push(
        `Dein Ergebnis enthält die richtigen Zeilen, aber manche davon mehrfach (${a} statt ${e} Zeilen). ` +
          'Brauchst du DISTINCT – oder vervielfacht ein JOIN die Zeilen?',
      );
    } else {
      messages.push(
        `Im erwarteten Ergebnis kommen manche Zeilen mehrfach vor (${e} Zeilen), bei dir nur ${a}. Entfernst du mit DISTINCT oder GROUP BY zu viel?`,
      );
    }
  } else {
    if (a !== e) messages.push(`Dein Ergebnis hat ${a} Zeile${a === 1 ? '' : 'n'}, erwartet ${e === 1 ? 'wird 1 Zeile' : `werden ${e} Zeilen`}.`);
    else messages.push(`Die Anzahl der Zeilen (${a}) stimmt, aber nicht alle Werte.`);
    if (diff.extra.length) messages.push(`${diff.extra.length} Zeile${diff.extra.length === 1 ? ' gehört' : 'n gehören'} nicht ins Ergebnis.`);
    if (diff.missing.length) messages.push(`${diff.missing.length} erwartete Zeile${diff.missing.length === 1 ? ' fehlt' : 'n fehlen'}.`);

    // Spaltenweise Analyse: Wo weichen die Werte ab?
    const badCols: string[] = [];
    for (let i = 0; i < n; i++) {
      if (columnMultisetKey(expected.rows, i) !== columnMultisetKey(act.rows, i)) badCols.push(act.columns[i]);
    }
    if (a === e && badCols.length > 0 && badCols.length < n) {
      messages.push(`Abweichende Werte gibt es in: ${fmtCols(badCols)}. Prüfe Berechnung, Rundung oder Bedingung für diese Spalte(n).`);
    } else if (a === e && badCols.length === 0) {
      messages.push('Jede Spalte enthält die richtigen Werte – sie sind aber falsch miteinander kombiniert (Zeilen vertauscht?).');
    }
    if (act.rows.some((r) => r.some((v) => typeof v === 'number' && !Number.isInteger(v) && String(v).length > 10))) {
      notes.push('Einige Zahlen haben viele Nachkommastellen. Verlangt die Aufgabe eine Rundung mit ROUND(…)?');
    }
  }

  if (diff.extra.length) examples.push({ label: 'Beispiel für Zeilen, die nicht ins Ergebnis gehören', columns: act.columns, rows: diff.extra.slice(0, 3) });
  if (diff.missing.length) examples.push({ label: 'Beispiel für fehlende Zeilen', columns: expected.columns, rows: diff.missing.slice(0, 3) });

  return { match: false, messages, notes, examples };
}
