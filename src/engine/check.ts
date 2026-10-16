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
          const missingTable = sq.label.startsWith('Struktur der Tabelle ') && (lastResult(u.after)?.rows.length ?? 0) === 0;
          if (missingTable) {
            return {
              status: 'wrong',
              messages: [`Nach deiner Anweisung gibt es keine Tabelle „${sq.label.slice('Struktur der Tabelle '.length)}“. Prüfe den Tabellennamen und ob CREATE TABLE fehlerfrei ausgeführt wurde.`],
              notes,
              examples: [],
            };
          }
          if (sq.label.startsWith('Struktur der Tabelle ')) {
            return {
              status: 'wrong',
              messages: [
                `Die Struktur der Tabelle „${sq.label.slice('Struktur der Tabelle '.length)}“ entspricht noch nicht der Aufgabe:`,
                ...describeStructureDiff(lastResult(s.after)!, lastResult(u.after)!),
              ],
              notes,
              examples: [],
            };
          }
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
  // Testanweisungen: Greifen die Regeln (NOT NULL, UNIQUE, CHECK, Fremdschlüssel …) wie bei der Musterlösung?
  if (check.probes?.length) {
    const sqls = check.probes.map((p) => p.sql);
    const u = await backend.probe(ex.db, userSql, sqls);
    if (!u.main.ok) return { status: 'error', error: explainError(u.main.error, userSql, schema) };
    const s = await backend.probe(ex.db, ex.solution, sqls);
    const messages: string[] = [];
    check.probes.forEach((p, i) => {
      const ur = u.probes[i];
      const sr = s.probes[i];
      if (!ur || !sr) return;
      if (!sr.ok && ur.ok) {
        messages.push(`Test „${p.label}“: Diese Anweisung hätte die Datenbank ablehnen müssen, sie wurde aber angenommen. ${p.hint}`);
      } else if (sr.ok && !ur.ok) {
        messages.push(`Test „${p.label}“: Diese Anweisung sollte erlaubt sein, wurde aber abgelehnt (${ur.error}). ${p.hint}`);
      } else if (sr.ok && ur.ok) {
        const exp = lastResult(sr);
        const act = lastResult(ur);
        if (exp && (!act || !compareResultSets(exp, act, { orderMatters: false, columnNames: false }).match)) {
          messages.push(`Test „${p.label}“: Das Ergebnis weicht ab. ${p.hint}`);
        }
      }
      if (messages.length && messages[messages.length - 1].startsWith(`Test „${p.label}“`)) {
        messages[messages.length - 1] += ` Getestet wurde: ${p.sql.replace(/\s+/g, ' ').trim()}`;
      }
    });
    if (messages.length) {
      return {
        status: 'wrong',
        messages: ['Die Tabellenstruktur stimmt, aber nicht alle Regeln verhalten sich wie verlangt. Dafür wurden nach deiner Anweisung Test-Datensätze eingefügt:', ...messages],
        notes,
        examples: [],
      };
    }
  }
  return { status: 'correct', notes };
}

/** Spaltenweiser Vergleich zweier Strukturabfragen (spalte, datentyp, pflicht, primaerschluessel). */
function describeStructureDiff(expected: ResultSet, actual: ResultSet): string[] {
  type Col = { typ: string; pflicht: number; pk: number };
  const toMap = (rs: ResultSet) => new Map(rs.rows.map((r) => [String(r[0]), { typ: String(r[1]), pflicht: Number(r[2]), pk: Number(r[3]) } as Col]));
  const exp = toMap(expected);
  const act = toMap(actual);
  const out: string[] = [];
  for (const [name, e] of exp) {
    const a = act.get(name);
    if (!a) {
      out.push(`Die Spalte „${name}“ fehlt (oder ist anders geschrieben).`);
      continue;
    }
    if (a.typ !== e.typ) out.push(`Spalte „${name}“: Erwartet wird der Datentyp „${e.typ}“, angelegt ist „${a.typ}“.`);
    if (e.pk && !a.pk) out.push(`Spalte „${name}“ gehört zum Primärschlüssel.`);
    if (!e.pk && a.pk) out.push(`Spalte „${name}“ soll nicht (allein) der Primärschlüssel sein.`);
    if (!e.pk && !a.pk && e.pflicht && !a.pflicht) out.push(`Spalte „${name}“ soll ein Pflichtfeld sein (NOT NULL).`);
    if (!e.pk && !a.pk && !e.pflicht && a.pflicht) out.push(`Spalte „${name}“ soll optional sein – ohne NOT NULL.`);
  }
  for (const name of act.keys()) if (!exp.has(name)) out.push(`Die Spalte „${name}“ ist in der Aufgabe nicht verlangt.`);
  if (out.length === 0) out.push('Die Spalten stimmen, aber die Reihenfolge oder Details weichen ab.');
  return out;
}
