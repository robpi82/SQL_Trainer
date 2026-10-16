import { beforeAll, describe, expect, it } from 'vitest';
import { EXERCISES } from '../src/content/exercises';
import { checkExercise } from '../src/engine/check';
import { createNodeBackend } from './nodeBackend';

let backend: Awaited<ReturnType<typeof createNodeBackend>>;
beforeAll(async () => {
  backend = await createNodeBackend();
});

describe('Aufgabeninhalte', () => {
  it('haben eindeutige IDs und drei Hilfestufen', () => {
    const ids = EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of EXERCISES) expect(e.hints.length, e.id).toBe(3);
  });

  for (const ex of EXERCISES) {
    if (ex.type === 'predict' || ex.type === 'explain') {
      it(`${ex.id}: gezeigte Abfrage ist ausführbar`, async () => {
        const r = await backend.isolated(ex.db, ex.starterSql ?? ex.solution);
        expect(r.main.ok, ex.id + (r.main.ok ? '' : r.main.error)).toBe(true);
        const s = await backend.isolated(ex.db, ex.solution);
        expect(s.main.ok, ex.id).toBe(true);
        if (ex.type === 'predict') expect(ex.choices).toBeTruthy();
        if (ex.type === 'explain') expect(ex.modelAnswer).toBeTruthy();
      });
      continue;
    }
    it(`${ex.id}: Musterlösung wird akzeptiert`, async () => {
      const r = await checkExercise(backend, ex, ex.solution);
      expect(r.status, JSON.stringify(r)).toBe('correct');
    });
    if (ex.starterSql && (ex.type === 'fix' || ex.type === 'complete')) {
      it(`${ex.id}: Startcode wird NICHT akzeptiert`, async () => {
        const r = await checkExercise(backend, ex, ex.starterSql!);
        expect(r.status).not.toBe('correct');
      });
    }
    if (ex.check?.kind === 'state' && ex.check.probes?.length) {
      const probes = ex.check.probes;
      it(`${ex.id}: Musterlösung verhält sich bei allen Testanweisungen wie dokumentiert`, async () => {
        const r = await backend.probe(ex.db, ex.solution, probes.map((p) => p.sql));
        expect(r.main.ok).toBe(true);
        probes.forEach((p, i) => expect(!r.probes[i].ok, `${p.label}: ${JSON.stringify(r.probes[i])}`).toBe(p.expectError));
      });
    }
    for (const alt of ex.tests?.accept ?? []) {
      it(`${ex.id}: Alternative akzeptiert: ${alt.slice(0, 60)}`, async () => {
        const r = await checkExercise(backend, ex, alt);
        expect(r.status, JSON.stringify(r)).toBe('correct');
      });
    }
    for (const bad of ex.tests?.reject ?? []) {
      it(`${ex.id}: Fehllösung abgelehnt: ${bad.slice(0, 60)}`, async () => {
        const r = await checkExercise(backend, ex, bad);
        expect(r.status, JSON.stringify(r)).not.toBe('correct');
      });
    }
  }
});
