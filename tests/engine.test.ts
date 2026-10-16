import { beforeAll, describe, expect, it } from 'vitest';
import { compareResultSets } from '../src/engine/compare';
import { explainError, lintSql } from '../src/engine/errors';
import { exerciseById } from '../src/content';
import { checkExercise } from '../src/engine/check';
import { createNodeBackend } from './nodeBackend';

const rs = (columns: string[], rows: (string | number | null)[][]) => ({ columns, rows });

describe('Ergebnisvergleich', () => {
  it('ignoriert Reihenfolge ohne ORDER-Anforderung, prüft sie mit', () => {
    const e = rs(['a'], [[1], [2], [3]]);
    const a = rs(['a'], [[3], [1], [2]]);
    expect(compareResultSets(e, a).match).toBe(true);
    const r = compareResultSets(e, a, { orderMatters: true });
    expect(r.match).toBe(false);
    expect(r.messages[0]).toMatch(/Reihenfolge/);
  });

  it('berücksichtigt doppelte Zeilen', () => {
    const e = rs(['stadt'], [['Berlin'], ['Hamburg']]);
    const dup = compareResultSets(e, rs(['stadt'], [['Berlin'], ['Berlin'], ['Hamburg']]));
    expect(dup.match).toBe(false);
    expect(dup.messages[0]).toMatch(/mehrfach/);
    const missingDup = compareResultSets(rs(['x'], [[1], [1]]), rs(['x'], [[1]]));
    expect(missingDup.match).toBe(false);
    expect(missingDup.messages[0]).toMatch(/DISTINCT/);
  });

  it('unterscheidet NULL von leerer Zeichenkette und 0', () => {
    expect(compareResultSets(rs(['e'], [[null]]), rs(['e'], [['']])).match).toBe(false);
    expect(compareResultSets(rs(['e'], [[null]]), rs(['e'], [[0]])).match).toBe(false);
    expect(compareResultSets(rs(['e'], [[null]]), rs(['e'], [[null]])).match).toBe(true);
  });

  it('toleriert Gleitkomma-Rundungsrauschen, aber keine echten Abweichungen', () => {
    expect(compareResultSets(rs(['x'], [[1830]]), rs(['x'], [[1830.0000000000002]])).match).toBe(true);
    expect(compareResultSets(rs(['x'], [[52.4]]), rs(['x'], [[52.39]])).match).toBe(false);
  });

  it('Spaltennamen nur prüfen, wenn verlangt; Spaltenreihenfolge wird akzeptiert', () => {
    const e = rs(['produkt', 'bestand'], [['A', 1]]);
    expect(compareResultSets(e, rs(['name', 'lagerbestand'], [['A', 1]])).match).toBe(true);
    const named = compareResultSets(e, rs(['name', 'lagerbestand'], [['A', 1]]), { columnNames: true });
    expect(named.match).toBe(false);
    expect(named.messages.join(' ')).toMatch(/Alias/);
    const swapped = compareResultSets(e, rs(['bestand', 'produkt'], [[1, 'A']]), { columnNames: true });
    expect(swapped.match).toBe(true);
    expect(swapped.notes.join(' ')).toMatch(/Reihenfolge/);
  });

  it('meldet falsche Spaltenanzahl und konkrete Abweichungen', () => {
    expect(compareResultSets(rs(['a', 'b'], [[1, 2]]), rs(['a'], [[1]])).messages[0]).toMatch(/2 Spalten/);
    const r = compareResultSets(rs(['n', 'p'], [['A', 1], ['B', 2]]), rs(['n', 'p'], [['A', 1], ['B', 3]]));
    expect(r.messages.join(' ')).toMatch(/„p“/);
    expect(r.examples.length).toBe(2);
  });
});

describe('Fehlererklärungen', () => {
  const schema = [{ name: 'kunden', rowCount: 1, columns: [{ name: 'stadt', type: 'TEXT', notNull: false, pk: false }, { name: 'kunde_id', type: 'INTEGER', notNull: true, pk: true }] }];
  it('Syntaxfehler', () => {
    const e = explainError('near "FROM": syntax error', 'SELECT a, FROM kunden', schema);
    expect(e.category).toBe('syntax');
  });
  it('unbekannte Tabelle mit Vorschlag', () => {
    const e = explainError('no such table: kunde', 'SELECT * FROM kunde', schema);
    expect(e.category).toBe('unknown');
    expect(e.explanation.join(' ')).toMatch(/kunden/);
  });
  it('unbekannte Spalte / Textwert ohne Anführungszeichen', () => {
    const e = explainError('no such column: Hamburg', 'SELECT * FROM kunden WHERE stadt = Hamburg', schema);
    expect(e.category).toBe('unknown');
    expect(e.explanation.join(' ')).toMatch(/'Hamburg'/);
  });
  it('Aggregat in WHERE', () => {
    expect(explainError('misuse of aggregate: COUNT()', '', schema).explanation.join(' ')).toMatch(/HAVING/);
  });
  it('Funktionen anderer Dialekte', () => {
    expect(explainError('no such function: YEAR', '', schema).explanation.join(' ')).toMatch(/strftime/);
  });
  it('TOP aus SQL Server', () => {
    expect(explainError('near "3": syntax error', 'SELECT TOP 3 * FROM kunden', schema).explanation.join(' ')).toMatch(/LIMIT/);
  });
  it('Hinweise: doppelte Anführungszeichen und = NULL', () => {
    const n = lintSql('SELECT * FROM kunden WHERE stadt = "Berlin" AND email = NULL', schema);
    expect(n.length).toBe(2);
  });
});

describe('Ausführung und Prüfung mit echter SQLite-Datenbank', () => {
  let backend: Awaited<ReturnType<typeof createNodeBackend>>;
  beforeAll(async () => { backend = await createNodeBackend(); });

  it('Übungsdatenbanken sind isoliert und zurücksetzbar', async () => {
    await backend.exec('a', 'vertrieb', 'DELETE FROM bestellpositionen;');
    const a = await backend.exec('a', 'vertrieb', 'SELECT COUNT(*) FROM bestellpositionen;');
    const b = await backend.exec('b', 'vertrieb', 'SELECT COUNT(*) FROM bestellpositionen;');
    expect(a.ok && a.results[0].rows[0][0]).toBe(0);
    expect(b.ok && b.results[0].rows[0][0]).toBe(30);
    await backend.reset('a');
    const c = await backend.exec('a', 'vertrieb', 'SELECT COUNT(*) FROM bestellpositionen;');
    expect(c.ok && c.results[0].rows[0][0]).toBe(30);
  });

  it('Prüfung läuft auf frischer Kopie – Änderungen in der Arbeitsdatenbank stören nicht', async () => {
    await backend.exec('aufgabe:m03-e1', 'vertrieb', "DELETE FROM kunden WHERE stadt = 'Hamburg';");
    const r = await checkExercise(backend, exerciseById.get('m03-e1')!, "SELECT vorname, nachname FROM kunden WHERE stadt = 'Hamburg'");
    expect(r.status).toBe('correct');
  });

  it('leere Ergebnisse behalten Spaltennamen', async () => {
    const r = await backend.isolated('vertrieb', 'SELECT name, preis FROM produkte WHERE 1 = 0');
    expect(r.main.ok && r.main.results[0]).toEqual({ columns: ['name', 'preis'], rows: [] });
  });

  it('Fremdschlüssel sind aktiv', async () => {
    const r = await backend.isolated('support', 'DELETE FROM tickets WHERE ticket_id = 1;');
    expect(r.main.ok).toBe(false);
  });

  it('klassifiziert Fehler bei der Prüfung', async () => {
    const ex = exerciseById.get('m10-e5')!;
    const r = await checkExercise(backend, ex, ex.starterSql!);
    expect(r.status).toBe('error');
    if (r.status === 'error') expect(r.error.category).toBe('logic');
  });

  it('Strukturprüfung nennt konkrete Abweichungen je Spalte', async () => {
    const r = await checkExercise(backend, exerciseById.get('m15-g1')!, 'CREATE TABLE lieferanten (lieferant_id TEXT, name TEXT, ort TEXT)');
    expect(r.status).toBe('wrong');
    const text = r.status === 'wrong' ? r.messages.join(' ') : '';
    expect(text).toMatch(/„lieferant_id“: Erwartet wird der Datentyp „ganze Zahl“/);
    expect(text).toMatch(/„lieferant_id“ gehört zum Primärschlüssel/);
    expect(text).toMatch(/„name“ soll ein Pflichtfeld sein/);
    expect(text).toMatch(/„land“ fehlt/);
    expect(text).toMatch(/„ort“ ist in der Aufgabe nicht verlangt/);
  });

  it('Testanweisungen decken fehlende Regeln auf', async () => {
    const r = await checkExercise(backend, exerciseById.get('m15-e3')!, exerciseById.get('m15-e3')!.starterSql!);
    expect(r.status).toBe('wrong');
    if (r.status === 'wrong') expect(r.messages.join(' ')).toMatch(/0 Sterne.*ablehnen/);
  });

  it('fehlende Tabelle wird klar benannt', async () => {
    const r = await checkExercise(backend, exerciseById.get('m15-g1')!, 'CREATE TABLE lieferant (lieferant_id INTEGER PRIMARY KEY, name TEXT NOT NULL, land TEXT)');
    expect(r.status === 'wrong' && r.messages[0]).toMatch(/keine Tabelle „lieferanten“/);
  });

  it('Schreibaufgabe ohne WHERE wird erkannt', async () => {
    const r = await checkExercise(backend, exerciseById.get('m14-e1')!, 'UPDATE produkte SET lagerbestand = lagerbestand + 20');
    expect(r.status).toBe('wrong');
    if (r.status === 'wrong') expect(r.messages.join(' ')).toMatch(/keine WHERE-Bedingung/);
  });
});
