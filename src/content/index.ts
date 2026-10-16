import { EXERCISES } from './exercises';
import { LESSONS } from './lessons';
import { MODULES } from './modules';
import type { Exercise, Lesson, ModuleInfo } from './types';

export { EXERCISES, LESSONS, MODULES };

export const exerciseById = new Map(EXERCISES.map((e) => [e.id, e]));
export const lessonById = new Map(LESSONS.map((l) => [l.id, l]));
export const moduleById = new Map(MODULES.map((m) => [m.id, m]));

export function exercisesOfLesson(lessonId: string): Exercise[] {
  return EXERCISES.filter((e) => e.lessonId === lessonId);
}

export function moduleOfExercise(ex: Exercise): ModuleInfo | undefined {
  const lesson = lessonById.get(ex.lessonId);
  return lesson ? moduleById.get(lesson.moduleId) : undefined;
}

/** Lektionen in Lernpfad-Reihenfolge */
export const ORDERED_LESSONS: Lesson[] = MODULES.filter((m) => m.lessonId)
  .map((m) => lessonById.get(m.lessonId!))
  .filter((l): l is Lesson => !!l);

export const TYPE_LABEL: Record<Exercise['type'], string> = {
  write: 'Abfrage schreiben',
  fix: 'Fehler korrigieren',
  complete: 'Abfrage ergänzen',
  predict: 'Ergebnis vorhersagen',
  explain: 'Erklären',
};

export const DIFFICULTY_LABEL: Record<number, string> = { 1: 'leicht', 2: 'mittel', 3: 'anspruchsvoll' };
