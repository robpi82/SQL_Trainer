import { EXERCISES, lessonById } from '../content';
import { STATUS_POINTS, addDays, dayString, statusOf, type ProgressState, type TaskStatus } from '../progress/model';
import { SYSTEMS, explored, exercisesOfSystem } from './galaxy';

/**
 * Belohnungen – vollständig aus dem echten Lernfortschritt berechnet:
 * - XP: selbstständig gelöst 50, mit Hilfe 20, Musterlösung angesehen 0.
 * - Serie: aufeinanderfolgende Tage mit mindestens einer richtig gelösten Aufgabe (bis heute oder gestern).
 * - Medaillen: feste Kriterien, siehe MEDALS.
 */
export const XP_PER_STATUS: Record<TaskStatus, number> = {
  nicht_begonnen: 0,
  in_bearbeitung: 0,
  loesung_angesehen: 0,
  mit_hilfe: 20,
  selbststaendig: 50,
};

export function totalXp(state: ProgressState): number {
  return EXERCISES.reduce((a, e) => a + XP_PER_STATUS[statusOf(state, e.id)], 0);
}

/** Tage (JJJJ-MM-TT), an denen mindestens eine Aufgabe richtig gelöst wurde */
export function activeDays(state: ProgressState): Set<string> {
  const days = new Set<string>();
  for (const t of Object.values(state.tasks)) {
    for (const h of t.history) {
      if (h.event.startsWith('Prüfung: korrekt') || h.event === 'Selbsteinschätzung: ja') days.add(dayString(new Date(h.at)));
    }
  }
  return days;
}

export function streak(state: ProgressState, today = dayString()): number {
  const days = activeDays(state);
  let d = days.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export interface Medal {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  progress?: string;
}

export function medals(state: ProgressState): Medal[] {
  const count = (s: TaskStatus) => EXERCISES.filter((e) => statusOf(state, e.id) === s).length;
  const independent = count('selbststaendig');
  const st = streak(state);
  const longest = longestStreak(state);
  const fixesIndependent = EXERCISES.filter((e) => e.type === 'fix' && statusOf(state, e.id) === 'selbststaendig').length;
  const reviewsDone = Object.values(state.tasks).filter((t) => t.reviewDone).length;
  const bestTest = Math.max(0, ...state.tests.map((t) => (t.total ? t.correct / t.total : 0)));
  const courseDone = EXERCISES.filter((e) => lessonById.get(e.lessonId)?.course && STATUS_POINTS[statusOf(state, e.id)] > 0).length;

  const list: Medal[] = [
    { id: 'erstes-signal', title: 'Erstes Signal', description: 'Die erste Aufgabe selbstständig gelöst.', icon: '📡', earned: independent >= 1 },
    { id: 'zehn', title: 'Zehn ohne Hilfe', description: '10 Aufgaben selbstständig gelöst.', icon: '🛰️', earned: independent >= 10, progress: `${Math.min(independent, 10)}/10` },
    { id: 'fuenfzig', title: 'Fünfzig ohne Hilfe', description: '50 Aufgaben selbstständig gelöst.', icon: '🚀', earned: independent >= 50, progress: `${Math.min(independent, 50)}/50` },
    { id: 'serie3', title: 'Dranbleiben', description: 'An 3 Tagen in Folge eine Aufgabe gelöst.', icon: '🔥', earned: longest >= 3, progress: `${Math.min(st, 3)}/3` },
    { id: 'serie7', title: 'Wochenserie', description: 'An 7 Tagen in Folge eine Aufgabe gelöst.', icon: '☄️', earned: longest >= 7, progress: `${Math.min(st, 7)}/7` },
    { id: 'fehlerjaeger', title: 'Fehlerjäger', description: '5 Fehler-korrigieren-Aufgaben selbstständig gelöst.', icon: '🔧', earned: fixesIndependent >= 5, progress: `${Math.min(fixesIndependent, 5)}/5` },
    { id: 'wiederholung', title: 'Gefestigt', description: 'Eine Aufgabe durch alle Wiederholungsstufen (1, 3, 7, 14 Tage) gebracht.', icon: '🧭', earned: reviewsDone >= 1 },
    { id: 'testpilot', title: 'Testpilot', description: 'Einen Wissenstest mit mindestens 80 % bestanden.', icon: '🎯', earned: bestTest >= 0.8 },
    { id: 'dezernat', title: 'Dezernat 512', description: '10 Unterrichtsaufgaben gelöst.', icon: '🐧', earned: courseDone >= 10, progress: `${Math.min(courseDone, 10)}/10` },
    ...SYSTEMS.filter((s) => exercisesOfSystem(s).length > 0).map((s) => {
      const p = explored(state, exercisesOfSystem(s));
      return { id: `system-${s.id}`, title: `${s.name} erkundet`, description: `Mindestens 80 % des Systems „${s.name}“ erkundet.`, icon: '🪐', earned: p >= 80, progress: `${p} %` };
    }),
  ];
  return list;
}

export function longestStreak(state: ProgressState): number {
  const days = [...activeDays(state)].sort();
  let best = 0;
  let run = 0;
  let prev = '';
  for (const d of days) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}
