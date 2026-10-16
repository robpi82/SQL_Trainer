import type { Exercise, QueryCheck, StateCheck } from '../content/types';
import type { SqlBackend } from '../db/sqlClient';
import type { ExecResult, ResultSet, TableInfo } from '../db/types';
import { compareResultSets, type RowExample } from './compare';
import { explainError, lintSql, type ExplainedError } from './errors';

export type CheckOutcome =
  | { status: 'correct'; notes: string[]; result?: ResultSet }
  | { status: 'wrong'; messages: string[]; notes: string[]; examples: RowExample[]; result?: ResultSet }
  | { status: 'error'; error: ExplainedError }
  | { status: 'empty' };

const lastResult = (r: ExecResult & { ok: true }): ResultSet | undefined => r.results[r.results.length - 1];

/** Entfernt Kommentare und Leerraum, um leere Eingaben zu erkennen. */
export function isBlankSql(sql: string): boolean {
  return sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim().replace(/;/g, '').trim() === '';
}

export async function checkExercise(
  backend: SqlBackend,
  ex: Exercise,
  userSql: string,
  schema?: TableInfo[],
): Promise<CheckOutcome> {
  if (isBlankSql(userSql)) return { status: 'empty' };
  if (userSql.includes('___')) {
    return {
      status: 'wrong',
      messages: ['Im Code stehen noch Lücken „___“. Ersetze sie durch passenden SQL-Code.'],
      notes: [],
      examples: [],
    };
  }
  const check = ex.check;
  if (!check) throw new Error(`Aufgabe ${ex.id} hat keine Prüfkriterien.`);
  return check.kind === 'state'
    ? checkState(backend, ex, check, userSql, schema)
    : checkQuery(backend, ex, check, userSql, schema);
}

async function checkQuery(
  backend: SqlBackend,
  ex: Exercise,
  check: QueryCheck,
  userSql: string,
  schema?: TableInfo[],
): Promise<CheckOutcome> {
  const { main } = await backend.isolated(ex.db, userSql);
  if (!main.ok) return { status: 'error', error: explainError(main.error, userSql, schema) };
  const notes = lintSql(userSql, schema);
  const actual = lastResult(main);
  if (!actual) {
    return {
      status: 'wrong',
      messages: [
        main.changes > 0
          ? 'Deine Anweisung hat Daten verändert, aber keine Ergebnistabelle geliefert. Für diese Aufgabe brauchst du eine SELECT-Abfrage. (Keine Sorge: Geprüft wird auf einer Kopie, deine Übungsdatenbank bleibt unverändert.)'
          : 'Deine Anweisung liefert keine Ergebnistabelle. Für diese Aufgabe brauchst du eine SELECT-Abfrage.',
      ],
      notes,
      examples: [],
    };
  }
  if (main.results.length > 1) notes.push('Du hast mehrere Abfragen ausgeführt – geprüft wird das Ergebnis der letzten.');

  const exp = await backend.isolated(ex.db, ex.solution);
  if (!exp.main.ok || !lastResult(exp.main)) throw new Error(`Musterlösung von ${ex.id} ist fehlerhaft: ${!exp.main.ok ? exp.main.error : ''}`);
  const cmp = compareResultSets(lastResult(exp.main)!, actual, check);
  if (!cmp.match) return { status: 'wrong', messages: cmp.messages, notes: [...cmp.notes, ...notes], examples: cmp.examples, result: actual };

  // Zusätzliche Testdaten: fällt eine nur zufällig passende Abfrage auf?
  for (const v of check.variants ?? []) {
    const u = await backend.isolated(ex.db, userSql, v.setup);
    const s = await backend.isolated(ex.db, ex.solution, v.setup);
    if (!s.main.ok) throw new Error(`Variante in ${ex.id} fehlerhaft: ${s.main.error}`);
    const uRes = u.main.ok ? lastResult(u.main) : undefined;
    const vcmp = uRes ? compareResultSets(lastResult(s.main)!, uRes, check) : null;
    if (!vcmp || !vcmp.match) {
      return {
        status: 'wrong',
        messages: [
          'Mit den sichtbaren Beispieldaten stimmt dein Ergebnis. Die Prüfung verwendet aber zusätzlich veränderte Testdaten – dort passt es nicht.',
          `Geänderte Testdaten: ${v.description}`,
          'Wahrscheinlich ist ein Wert fest eingetragen (z. B. eine ID oder ein ausgerechnetes Ergebnis), statt die Bedingung allgemein zu formulieren.',
          ...(vcmp ? vcmp.messages : []),
        ],
        notes,
        examples: [],
        result: actual,
      };
    }
  }
  return { status: 'correct', notes: [...cmp.notes, ...notes], result: actual };
}

const NO_WHERE = /\b(UPDATE|DELETE\s+FROM)\b(?![\s\S]*\bWHERE\b)/i;

async function checkState(
  backend: SqlBackend,
  ex: Exercise,
  check: StateCheck,
  userSql: string,
  schema?: TableInfo[],
): Promise<CheckOutcome> {
  const notes = lintSql(userSql, schema);
  const scenarios = [{ description: '', setup: undefined as string | undefined }, ...(check.variants ?? [])];
  for (let si = 0; si < scenarios.length; si++) {
    const sc = scenarios[si];
    for (const sq of check.stateQueries) {
      const u = await backend.isolated(ex.db, userSql, sc.setup, sq.sql);
      if (!u.main.ok) return { status: 'error', error: explainError(u.main.error, userSql, schema) };
      const s = await backend.isolated(ex.db, ex.solution, sc.setup, sq.sql);
      if (!s.main.ok || !s.after?.ok) throw new Error(`Musterlösung von ${ex.id} fehlerhaft`);
      if (!u.after?.ok) throw new Error(`Zustandsabfrage von ${ex.id} fehlerhaft`);
      const cmp = compareResultSets(lastResult(s.after)!, lastResult(u.after)!, { orderMatters: false, columnNames: false });
      if (!cmp.match) {
        const messages: string[] = [];
        if (si > 0) {
          messages.push(
            'Mit den Beispieldaten stimmt der Zustand, aber nicht mit zusätzlichen Testdaten.',
            `Geänderte Testdaten: ${sc.description}`,
            'Ist ein Wert fest eingetragen, statt die Bedingung allgemein zu formulieren?',
          );
        } else {
          messages.push(`Der Zustand der Tabelle stimmt nach deiner Anweisung nicht (${sq.label}).`);
          const uc = u.main.changes;
          const scount = s.main.changes;
          if (uc !== scount) messages.push(`Deine Anweisung hat ${uc} Zeile${uc === 1 ? '' : 'n'} geändert, eingefügt oder gelöscht – erwartet ${scount === 1 ? 'wird 1' : `werden ${scount}`}.`);
          if (uc > scount && NO_WHERE.test(userSql))
            messages.push('Achtung: Deine UPDATE- bzw. DELETE-Anweisung hat keine WHERE-Bedingung. Dann sind ALLE Zeilen der Tabelle betroffen!');
          else if (uc > scount) messages.push('Es sind mehr Zeilen betroffen als vorgesehen – ist die WHERE-Bedingung zu weit gefasst?');
          else if (uc < scount) messages.push('Es sind weniger Zeilen betroffen als vorgesehen – ist die WHERE-Bedingung zu eng?');
          messages.push(
            ...cmp.messages.map((m) =>
              m
                .replace('Dein Ergebnis hat', 'Die Tabelle hat danach')
                .replace('Dein Ergebnis', 'Der Tabelleninhalt nach deiner Anweisung')
                .replace('deine Abfrage liefert', 'die Tabelle enthält')
                .replace('gehören nicht ins Ergebnis', 'sind anders als erwartet')
                .replace('gehört nicht ins Ergebnis', 'ist anders als erwartet')
                .replace('erwartete Zeilen fehlen', 'erwartete Zeilen fehlen in der Tabelle')
                .replace('erwartete Zeile fehlt', 'erwartete Zeile fehlt in der Tabelle'),
            ),
          );
        }
        return {
          status: 'wrong',
          messages,
          notes,
          examples: cmp.examples.map((e) => ({
            ...e,
            label: e.label.includes('nicht') ? 'Zeilen, die nach deiner Anweisung so nicht vorhanden sein sollten' : 'Zeilen, die nach der Anweisung vorhanden sein sollten',
          })),
          result: lastResult(u.after),
        };
      }
    }
  }
  return { status: 'correct', notes };
}
