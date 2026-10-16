import { describe, expect, it } from 'vitest';
import { addDays, emptyProgress, progressReducer, validateImport, type ProgressAction, type ProgressState } from '../src/progress/model';

const day = (s: string) => new Date(`${s}T10:00:00`);
function apply(state: ProgressState, actions: ProgressAction[], d: string) {
  return actions.reduce((s, a) => progressReducer(s, a, day(d)), state);
}

describe('Fortschrittslogik', () => {
  it('Öffnen zählt nicht als Erfolg', () => {
    const s = apply(emptyProgress(), [{ type: 'openExercise', exId: 'a' }, { type: 'visitLesson', lessonId: 'm01' }], '2026-01-01');
    expect(s.tasks.a).toBeUndefined();
    expect(s.lastLessonId).toBe('m01');
  });

  it('Lösen ohne Hilfe = selbstständig, keine Wiederholung', () => {
    const s = apply(emptyProgress(), [{ type: 'run', exId: 'a' }, { type: 'checkCorrect', exId: 'a' }], '2026-01-01');
    expect(s.tasks.a.status).toBe('selbststaendig');
    expect(s.tasks.a.review ?? null).toBeNull();
  });

  it('Lösen nach Hinweis = mit Hilfe, Wiederholung nach 1 Tag', () => {
    const s = apply(emptyProgress(), [{ type: 'hint', exId: 'a', level: 1 }, { type: 'checkCorrect', exId: 'a' }], '2026-01-01');
    expect(s.tasks.a.status).toBe('mit_hilfe');
    expect(s.tasks.a.review).toEqual({ stage: 0, due: '2026-01-02' });
  });

  it('Musterlösung ansehen und dann einfügen zählt NICHT als selbstständig', () => {
    const s = apply(emptyProgress(), [{ type: 'solution', exId: 'a' }, { type: 'checkCorrect', exId: 'a' }], '2026-01-01');
    expect(s.tasks.a.status).toBe('loesung_angesehen');
    // auch nicht nach erneutem Öffnen am selben Tag
    const s2 = apply(s, [{ type: 'openExercise', exId: 'a' }, { type: 'checkCorrect', exId: 'a' }], '2026-01-01');
    expect(s2.tasks.a.status).toBe('loesung_angesehen');
  });

  it('Fehlversuche führen trotz selbstständiger Lösung zu einer Wiederholung', () => {
    const s = apply(emptyProgress(), [{ type: 'checkWrong', exId: 'a' }, { type: 'checkCorrect', exId: 'a' }], '2026-01-01');
    expect(s.tasks.a.status).toBe('selbststaendig');
    expect(s.tasks.a.review?.due).toBe('2026-01-02');
  });

  it('Wiederholungen nach 1, 3, 7, 14 Tagen; danach erledigt; Status verbessert sich', () => {
    let s = apply(emptyProgress(), [{ type: 'solution', exId: 'a' }], '2026-01-01');
    expect(s.tasks.a.review).toEqual({ stage: 0, due: '2026-01-02' });
    s = apply(s, [{ type: 'checkCorrect', exId: 'a' }], '2026-01-02');
    expect(s.tasks.a.status).toBe('selbststaendig');
    expect(s.tasks.a.review).toEqual({ stage: 1, due: '2026-01-05' });
    // zu früh: keine Änderung am Plan
    s = apply(s, [{ type: 'checkCorrect', exId: 'a' }], '2026-01-03');
    expect(s.tasks.a.review).toEqual({ stage: 1, due: '2026-01-05' });
    s = apply(s, [{ type: 'checkCorrect', exId: 'a' }], '2026-01-05');
    expect(s.tasks.a.review).toEqual({ stage: 2, due: '2026-01-12' });
    s = apply(s, [{ type: 'checkCorrect', exId: 'a' }], '2026-01-12');
    expect(s.tasks.a.review).toEqual({ stage: 3, due: '2026-01-26' });
    s = apply(s, [{ type: 'checkCorrect', exId: 'a' }], '2026-01-26');
    expect(s.tasks.a.review).toBeNull();
    expect(s.tasks.a.reviewDone).toBe(true);
  });

  it('Wiederholung mit Hilfe setzt den Plan zurück', () => {
    let s = apply(emptyProgress(), [{ type: 'hint', exId: 'a', level: 2 }, { type: 'checkCorrect', exId: 'a' }], '2026-01-01');
    s = apply(s, [{ type: 'checkCorrect', exId: 'a' }], '2026-01-02');
    expect(s.tasks.a.review?.stage).toBe(1);
    s = apply(s, [{ type: 'hint', exId: 'a', level: 1 }, { type: 'checkCorrect', exId: 'a' }], '2026-01-05');
    expect(s.tasks.a.review).toEqual({ stage: 0, due: '2026-01-06' });
  });

  it('Status verschlechtert sich nicht', () => {
    let s = apply(emptyProgress(), [{ type: 'checkCorrect', exId: 'a' }], '2026-01-01');
    s = apply(s, [{ type: 'solution', exId: 'a' }, { type: 'checkWrong', exId: 'a' }], '2026-01-01');
    expect(s.tasks.a.status).toBe('selbststaendig');
  });

  it('Export/Import-Rundlauf erhält den Zustand', () => {
    const s = apply(emptyProgress(), [{ type: 'hint', exId: 'a', level: 3 }, { type: 'checkCorrect', exId: 'a' }, { type: 'draft', exId: 'b', sql: 'SELECT 1' }], '2026-01-01');
    const json = JSON.parse(JSON.stringify({ app: 'sql-lernapp', fortschritt: s }));
    expect(validateImport(json)).toEqual(s);
    expect(() => validateImport({ foo: 1 })).toThrow();
    expect(() => validateImport({ version: 1, tasks: { x: { status: 'quatsch' } } })).toThrow();
  });

  it('addDays über Monatsgrenzen', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-25', 14)).toBe('2027-01-08');
  });
});
