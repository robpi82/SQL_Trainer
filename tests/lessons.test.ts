import { beforeAll, describe, expect, it } from 'vitest';
import { LESSONS, MODULES, EXERCISES, exercisesOfLesson } from '../src/content';
import { REFERENCE } from '../src/content/reference';
import { createNodeBackend } from './nodeBackend';

let backend: Awaited<ReturnType<typeof createNodeBackend>>;
beforeAll(async () => { backend = await createNodeBackend(); });

describe('Lektionen und Nachschlagewerk', () => {
  it('jede verfügbare Lektion hat eine angeleitete Übung und mehrere Aufgaben', () => {
    for (const m of MODULES.filter((m) => m.status === 'verfügbar')) {
      const ex = exercisesOfLesson(m.lessonId!);
      expect(ex.filter((e) => e.guided).length, m.lessonId).toBe(1);
      expect(ex.filter((e) => !e.guided).length, m.lessonId).toBeGreaterThanOrEqual(3);
    }
  });
  it('mindestens 30 Aufgaben bis einschließlich Unterabfragen', () => {
    const basic = EXERCISES.filter((e) => Number(e.lessonId.slice(1)) <= 12);
    expect(basic.length).toBeGreaterThanOrEqual(30);
  });
  for (const l of LESSONS) {
    it(`${l.id}: Beispiel-SQL ist ausführbar`, async () => {
      const queries = [
        ...l.example.tables.map((t) => ({ db: l.example.db, sql: t.sql })),
        { db: l.example.db, sql: l.example.sql },
        ...(l.extraSections ?? []).filter((s) => s.sql).map((s) => ({ db: s.db ?? l.example.db, sql: s.sql! })),
      ];
      for (const { db, sql } of queries) {
        const r = await backend.isolated(db, sql);
        expect(r.main.ok, `${l.id}: ${sql} ${r.main.ok ? '' : r.main.error}`).toBe(true);
      }
    });
  }
  for (const r of REFERENCE) {
    it(`Nachschlagewerk ${r.id}: Beispiel ausführbar`, async () => {
      const res = await backend.isolated(r.db, r.example);
      expect(res.main.ok, r.id + (res.main.ok ? '' : res.main.error)).toBe(true);
    });
  }
});
