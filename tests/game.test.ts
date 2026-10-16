import { describe, expect, it } from 'vitest';
import { EXERCISES, LESSONS } from '../src/content';
import { SYSTEMS, ROUTE, UNMAPPED_MODULES, exercisesOfSystem, explored, nextMission, systemById, systemOfLesson } from '../src/game/galaxy';
import { medals, streak, totalXp } from '../src/game/rewards';
import { emptyProgress, progressReducer, type ProgressAction, type ProgressState } from '../src/progress/model';

const day = (s: string) => new Date(`${s}T10:00:00`);
function apply(state: ProgressState, actions: ProgressAction[], d: string) {
  return actions.reduce((s, a) => progressReducer(s, a, day(d)), state);
}

describe('Sternenkarte', () => {
  it('jedes Modul und jede Lektion liegt in genau einem System', () => {
    expect(UNMAPPED_MODULES).toEqual([]);
    for (const l of LESSONS) {
      const hits = SYSTEMS.filter((s) => s.planets.some((p) => p.lessonId === l.id));
      expect(hits.length, l.id).toBe(1);
      expect(systemOfLesson(l.id)).toBe(hits[0]);
    }
  });

  it('jede Aufgabe gehört zu genau einem System', () => {
    const counted = SYSTEMS.flatMap((s) => exercisesOfSystem(s).map((e) => e.id));
    expect(new Set(counted).size).toBe(counted.length);
    expect(counted.length).toBe(EXERCISES.length);
  });

  it('Route verbindet nur existierende Systeme', () => {
    for (const [a, b] of ROUTE) {
      expect(systemById.has(a), a).toBe(true);
      expect(systemById.has(b), b).toBe(true);
    }
  });

  it('Erkundet-Prozent und nächste Mission folgen dem Fortschritt', () => {
    const sys = SYSTEMS[0];
    const ex = exercisesOfSystem(sys);
    let s = emptyProgress();
    expect(explored(s, ex)).toBe(0);
    expect(nextMission(s, sys)?.id).toBe(ex[0].id);
    s = apply(s, [{ type: 'checkCorrect', exId: ex[0].id }], '2026-01-01');
    expect(explored(s, ex)).toBeGreaterThan(0);
    expect(nextMission(s, sys)?.id).not.toBe(ex[0].id);
  });
});

describe('XP, Serie, Medaillen', () => {
  const [a, b, c] = EXERCISES.filter((e) => e.type !== 'choice');

  it('XP: selbstständig 50, mit Hilfe 20, Lösung angesehen 0', () => {
    let s = apply(emptyProgress(), [{ type: 'checkCorrect', exId: a.id }], '2026-01-01');
    s = apply(s, [{ type: 'hint', exId: b.id, level: 1 }, { type: 'checkCorrect', exId: b.id }], '2026-01-01');
    s = apply(s, [{ type: 'solution', exId: c.id }, { type: 'checkCorrect', exId: c.id }], '2026-01-01');
    expect(totalXp(s)).toBe(70);
    // mehrfaches Lösen bringt keine zusätzlichen XP
    s = apply(s, [{ type: 'checkCorrect', exId: a.id }], '2026-01-02');
    expect(totalXp(s)).toBe(70);
  });

  it('Serie zählt aufeinanderfolgende Tage mit Lösung', () => {
    let s = apply(emptyProgress(), [{ type: 'checkCorrect', exId: a.id }], '2026-01-01');
    s = apply(s, [{ type: 'checkCorrect', exId: b.id }], '2026-01-02');
    s = apply(s, [{ type: 'checkCorrect', exId: c.id }], '2026-01-03');
    expect(streak(s, '2026-01-03')).toBe(3);
    expect(streak(s, '2026-01-04')).toBe(3); // heute noch nichts gelöst: Serie läuft weiter
    expect(streak(s, '2026-01-05')).toBe(0);
  });

  it('Medaille „Erstes Signal“ erst nach einer gelösten Aufgabe', () => {
    const first = (s: ProgressState) => medals(s)[0];
    expect(first(emptyProgress()).earned).toBe(false);
    const s = apply(emptyProgress(), [{ type: 'checkCorrect', exId: a.id }], '2026-01-01');
    expect(first(s).earned).toBe(true);
  });
});
