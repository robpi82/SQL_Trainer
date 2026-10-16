import { EXERCISES } from './exercises';
import { LESSONS as PATH_LESSONS } from './lessons';
import { COURSE_LESSONS } from './kurs/lessons';
import { MODULES } from './modules';
import type { Exercise, Lesson, ModuleInfo } from './types';

/** Alle Lektionen: Lernpfad und Unterricht */
export const LESSONS: Lesson[] = [...PATH_LESSONS, ...COURSE_LESSONS];
export { EXERCISES, MODULES, COURSE_LESSONS };

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
  choice: 'Wissensfrage',
};

export const DIFFICULTY_LABEL: Record<number, string> = { 1: 'leicht', 2: 'mittel', 3: 'anspruchsvoll' };

/** Auswahlaufgaben (Vorhersage oder Wissensfrage) */
export const isChoiceType = (e: Exercise) => e.type === 'predict' || e.type === 'choice';

/** Beschriftung einer Lektion, z. B. „Modul 3“ oder „Unterricht Tag 2“ */
export function lessonLabel(l: Lesson): string {
  return l.course ? `Unterricht ${l.course.label}` : `Modul ${l.moduleId}`;
}

/** Aufgaben des Lernpfads (ohne Unterricht) */
export const PATH_EXERCISES: Exercise[] = EXERCISES.filter((e) => !lessonById.get(e.lessonId)?.course);
/** Aufgaben zum Unterricht */
export const COURSE_EXERCISES: Exercise[] = EXERCISES.filter((e) => !!lessonById.get(e.lessonId)?.course);
