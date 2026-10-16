import { EXERCISES, MODULES, ORDERED_LESSONS, exercisesOfLesson, lessonById } from '../content';
import type { Exercise } from '../content/types';
import { STATUS_POINTS, dayString, isDue, statusOf, type ProgressState, type TaskStatus } from './model';

export interface ModuleProgress {
  moduleId: number;
  total: number;
  points: number;
  percent: number;
  counts: Record<TaskStatus, number>;
}

const emptyCounts = (): Record<TaskStatus, number> => ({
  nicht_begonnen: 0,
  in_bearbeitung: 0,
  loesung_angesehen: 0,
  mit_hilfe: 0,
  selbststaendig: 0,
});

export function progressOf(state: ProgressState, exercises: Exercise[]) {
  const counts = emptyCounts();
  let points = 0;
  for (const e of exercises) {
    const s = statusOf(state, e.id);
    counts[s]++;
    points += STATUS_POINTS[s];
  }
  const total = exercises.length;
  return { total, points, percent: total ? Math.round((points / total) * 100) : 0, counts };
}

export function moduleProgress(state: ProgressState): ModuleProgress[] {
  return MODULES.filter((m) => m.status === 'verfügbar' && m.lessonId).map((m) => ({
    moduleId: m.id,
    ...progressOf(state, exercisesOfLesson(m.lessonId!)),
  }));
}

export function overallProgress(state: ProgressState) {
  return progressOf(state, EXERCISES);
}

export interface ConceptStat {
  concept: string;
  attempted: number;
  total: number;
  score: number;
  wrong: number;
}

/** Stärken und Übungsschwerpunkte je Konzept */
export function conceptStats(state: ProgressState): { strengths: ConceptStat[]; focus: ConceptStat[] } {
  const map = new Map<string, ConceptStat>();
  for (const e of EXERCISES) {
    for (const c of e.concepts) {
      const st = map.get(c) ?? { concept: c, attempted: 0, total: 0, score: 0, wrong: 0 };
      st.total++;
      const s = statusOf(state, e.id);
      if (s !== 'nicht_begonnen') {
        st.attempted++;
        st.score += STATUS_POINTS[s];
        st.wrong += state.tasks[e.id]?.wrong ?? 0;
      }
      map.set(c, st);
    }
  }
  const all = [...map.values()].filter((s) => s.attempted > 0).map((s) => ({ ...s, score: s.score / s.attempted }));
  const strengths = all.filter((s) => s.attempted >= 2 && s.score >= 0.75).sort((a, b) => b.score - a.score || b.attempted - a.attempted).slice(0, 5);
  const focus = all
    .filter((s) => s.score < 0.6 || s.wrong >= 3)
    .sort((a, b) => a.score - b.score || b.wrong - a.wrong)
    .slice(0, 5);
  return { strengths, focus };
}

export function dueReviews(state: ProgressState, today = dayString()): Exercise[] {
  return EXERCISES.filter((e) => isDue(state.tasks[e.id], today)).sort((a, b) =>
    (state.tasks[a.id]!.review!.due).localeCompare(state.tasks[b.id]!.review!.due),
  );
}

export function upcomingReviews(state: ProgressState, today = dayString()): { ex: Exercise; due: string }[] {
  return EXERCISES.filter((e) => state.tasks[e.id]?.review && state.tasks[e.id]!.review!.due > today)
    .map((e) => ({ ex: e, due: state.tasks[e.id]!.review!.due }))
    .sort((a, b) => a.due.localeCompare(b.due));
}

/** Nächste sinnvolle Lektion: die zuletzt besuchte, falls nicht abgeschlossen – sonst die erste nicht abgeschlossene. */
export function continueTarget(state: ProgressState): { lessonId: string; exerciseId?: string } {
  const unfinished = (lessonId: string) =>
    exercisesOfLesson(lessonId).find((e) => !['selbststaendig', 'mit_hilfe'].includes(statusOf(state, e.id)));
  if (state.lastLessonId && lessonById.has(state.lastLessonId)) {
    const ex = unfinished(state.lastLessonId);
    if (ex) return { lessonId: state.lastLessonId, exerciseId: ex.id };
  }
  for (const l of ORDERED_LESSONS) {
    const ex = unfinished(l.id);
    if (ex) return { lessonId: l.id, exerciseId: ex.id };
  }
  return { lessonId: ORDERED_LESSONS[ORDERED_LESSONS.length - 1].id };
}
