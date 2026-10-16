/**
 * Lernfortschritt – reine Logik ohne React, damit sie testbar ist.
 *
 * Regeln (werden auch in der App unter „Fortschritt & Daten“ erklärt):
 * - Öffnen einer Lektion oder Aufgabe zählt nicht als Lernerfolg.
 * - „Selbstständig gelöst“: richtige Prüfung, ohne dass am selben Tag Hinweise oder die Musterlösung genutzt wurden.
 * - „Mit Hilfe gelöst“: richtige Prüfung, nachdem am selben Tag mindestens ein Hinweis genutzt wurde.
 * - „Musterlösung angesehen“: Die Lösung wurde angezeigt, bevor die Aufgabe gelöst war (bzw. am selben Tag).
 * - Der Status verschlechtert sich nie; eine spätere selbstständige Lösung (frühestens am Folgetag) verbessert ihn.
 * - Wiederholungen: nach 1, 3, 7 und 14 Tagen – für Aufgaben mit Hilfe, Musterlösung oder Fehlversuchen.
 */

export type TaskStatus = 'nicht_begonnen' | 'in_bearbeitung' | 'loesung_angesehen' | 'mit_hilfe' | 'selbststaendig';

export const STATUS_LABEL: Record<TaskStatus, string> = {
  nicht_begonnen: 'Noch nicht begonnen',
  in_bearbeitung: 'In Bearbeitung',
  loesung_angesehen: 'Musterlösung angesehen',
  mit_hilfe: 'Mit Hilfe gelöst',
  selbststaendig: 'Selbstständig gelöst',
};

export const STATUS_RANK: Record<TaskStatus, number> = {
  nicht_begonnen: 0,
  in_bearbeitung: 1,
  loesung_angesehen: 2,
  mit_hilfe: 3,
  selbststaendig: 4,
};

/** Punkte je Status für die Fortschrittsberechnung */
export const STATUS_POINTS: Record<TaskStatus, number> = {
  nicht_begonnen: 0,
  in_bearbeitung: 0,
  loesung_angesehen: 0,
  mit_hilfe: 0.5,
  selbststaendig: 1,
};

/** Abstände der Wiederholungen in Tagen */
export const REVIEW_INTERVALS = [1, 3, 7, 14];

export interface ReviewState {
  /** Index in REVIEW_INTERVALS – wie viele Wiederholungen bereits erfolgreich waren */
  stage: number;
  /** Fälligkeitsdatum JJJJ-MM-TT */
  due: string;
}

export interface TaskRecord {
  status: TaskStatus;
  runs: number;
  checks: number;
  wrong: number;
  /** höchste je genutzte Hilfestufe (0–3) */
  hintLevel: number;
  /** Tag der letzten Hinweisnutzung */
  hintDay?: string;
  /** Tag, an dem zuletzt die Musterlösung angezeigt wurde */
  solutionDay?: string;
  solvedAt?: string;
  lastActivity: string;
  draft?: string;
  /** Entwurf einer freien Erklärung (Aufgabentyp „explain“) */
  note?: string;
  review?: ReviewState | null;
  reviewDone?: boolean;
  selfAssessment?: 'ja' | 'teilweise' | 'nein';
  history: { at: string; event: string }[];
}

export interface TestRecord {
  at: string;
  total: number;
  correct: number;
  exerciseIds: string[];
  correctIds: string[];
}

export interface ProgressState {
  version: 1;
  tasks: Record<string, TaskRecord>;
  lastLessonId?: string;
  lastExerciseId?: string;
  lessonsVisited: Record<string, string>;
  tests: TestRecord[];
}

export const emptyProgress = (): ProgressState => ({ version: 1, tasks: {}, lessonsVisited: {}, tests: [] });

export type ProgressAction =
  | { type: 'visitLesson'; lessonId: string }
  | { type: 'openExercise'; exId: string }
  | { type: 'draft'; exId: string; sql: string }
  | { type: 'run'; exId: string }
  | { type: 'hint'; exId: string; level: number }
  | { type: 'solution'; exId: string }
  | { type: 'note'; exId: string; text: string }
  | { type: 'checkWrong'; exId: string; scheduleReview?: boolean }
  | { type: 'checkCorrect'; exId: string }
  | { type: 'selfAssess'; exId: string; value: 'ja' | 'teilweise' | 'nein' }
  | { type: 'testFinished'; record: TestRecord }
  | { type: 'import'; state: ProgressState }
  | { type: 'reset' };

/* ---------------- Datumshilfen (lokale Zeit) ---------------- */

export function dayString(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return dayString(new Date(y, m - 1, d + n));
}

/* ---------------- Reducer ---------------- */

const blankRecord = (now: string): TaskRecord => ({
  status: 'nicht_begonnen',
  runs: 0,
  checks: 0,
  wrong: 0,
  hintLevel: 0,
  lastActivity: now,
  history: [],
});

function better(a: TaskStatus, b: TaskStatus): TaskStatus {
  return STATUS_RANK[a] >= STATUS_RANK[b] ? a : b;
}

function log(r: TaskRecord, now: string, event: string): TaskRecord {
  return { ...r, history: [...r.history, { at: now, event }].slice(-30) };
}

/**
 * Ergebnis eines richtigen Lösungsversuchs bestimmen.
 * Hilfen oder Musterlösung am selben Tag → keine selbstständige Lösung.
 */
export function outcomeFor(r: TaskRecord, today: string): TaskStatus {
  if (r.solutionDay === today) return 'loesung_angesehen';
  if (r.hintDay === today) return 'mit_hilfe';
  return 'selbststaendig';
}

/** Wiederholungsplan nach einem abgeschlossenen Versuch aktualisieren */
export function scheduleAfterAttempt(r: TaskRecord, outcome: TaskStatus, today: string): Pick<TaskRecord, 'review' | 'reviewDone'> {
  const independent = outcome === 'selbststaendig';
  if (r.review) {
    if (r.review.due > today) return { review: r.review, reviewDone: r.reviewDone }; // nicht fällig: freies Üben
    if (!independent) return { review: { stage: 0, due: addDays(today, REVIEW_INTERVALS[0]) }, reviewDone: false };
    const stage = r.review.stage + 1;
    if (stage >= REVIEW_INTERVALS.length) return { review: null, reviewDone: true };
    return { review: { stage, due: addDays(today, REVIEW_INTERVALS[stage]) }, reviewDone: false };
  }
  if (r.reviewDone && independent) return { review: null, reviewDone: true };
  const needsReview = !independent || r.wrong > 0;
  return needsReview ? { review: { stage: 0, due: addDays(today, REVIEW_INTERVALS[0]) }, reviewDone: false } : { review: r.review ?? null, reviewDone: r.reviewDone };
}

export function progressReducer(state: ProgressState, action: ProgressAction, nowDate: Date = new Date()): ProgressState {
  const now = nowDate.toISOString();
  const today = dayString(nowDate);

  if (action.type === 'reset') return emptyProgress();
  if (action.type === 'import') return action.state;
  if (action.type === 'visitLesson')
    return { ...state, lastLessonId: action.lessonId, lessonsVisited: { ...state.lessonsVisited, [action.lessonId]: now } };
  if (action.type === 'testFinished') return { ...state, tests: [...state.tests, action.record].slice(-50) };

  const exId = action.exId;
  const prev = state.tasks[exId] ?? blankRecord(now);
  let r: TaskRecord = { ...prev, lastActivity: now };
  const touch = (rec: TaskRecord) => (rec.status === 'nicht_begonnen' ? { ...rec, status: 'in_bearbeitung' as TaskStatus } : rec);

  switch (action.type) {
    case 'openExercise':
      // Öffnen allein ändert keinen Status.
      return { ...state, lastExerciseId: exId };
    case 'draft':
      r = { ...prev, draft: action.sql };
      break;
    case 'run':
      r = touch({ ...r, runs: r.runs + 1 });
      break;
    case 'hint':
      r = log(touch({ ...r, hintLevel: Math.max(r.hintLevel, action.level), hintDay: today }), now, `Hinweis ${action.level}`);
      break;
    case 'solution': {
      r = log({ ...r, solutionDay: today }, now, 'Musterlösung angezeigt');
      if (STATUS_RANK[r.status] < STATUS_RANK.loesung_angesehen) r.status = 'loesung_angesehen';
      if (!r.review && !r.reviewDone) r.review = { stage: 0, due: addDays(today, REVIEW_INTERVALS[0]) };
      if (r.review && r.review.due <= today) r.review = { stage: 0, due: addDays(today, REVIEW_INTERVALS[0]) };
      break;
    }
    case 'note':
      r = { ...prev, note: action.text };
      break;
    case 'checkWrong':
      r = log(touch({ ...r, checks: r.checks + 1, wrong: r.wrong + 1 }), now, 'Prüfung: nicht korrekt');
      // z. B. im Wissenstest: falsche Antworten kommen in die Wiederholung
      if (action.scheduleReview && (!r.review || r.review.due <= today)) r.review = { stage: 0, due: addDays(today, REVIEW_INTERVALS[0]) };
      break;
    case 'checkCorrect': {
      const outcome = outcomeFor(r, today);
      r = { ...r, checks: r.checks + 1, ...scheduleAfterAttempt(r, outcome, today) };
      r.status = better(r.status, outcome);
      if (!r.solvedAt && outcome !== 'loesung_angesehen') r.solvedAt = now;
      r = log(r, now, `Prüfung: korrekt (${STATUS_LABEL[outcome]})`);
      break;
    }
    case 'selfAssess': {
      // Freie Erklärungen: keine automatische Bewertung, sondern Selbsteinschätzung.
      let outcome: TaskStatus;
      if (action.value === 'ja') outcome = outcomeFor(r, today);
      else if (action.value === 'teilweise') outcome = 'mit_hilfe';
      else outcome = 'loesung_angesehen';
      const wrongBump = action.value === 'ja' ? 0 : 1;
      r = { ...r, checks: r.checks + 1, wrong: r.wrong + wrongBump, selfAssessment: action.value };
      r = { ...r, ...scheduleAfterAttempt(r, outcome, today) };
      r.status = better(r.status, outcome);
      if (!r.solvedAt && action.value === 'ja') r.solvedAt = now;
      r = log(r, now, `Selbsteinschätzung: ${action.value}`);
      break;
    }
  }
  return { ...state, lastExerciseId: exId, tasks: { ...state.tasks, [exId]: r } };
}

/* ---------------- Auswertungen ---------------- */

export function statusOf(state: ProgressState, exId: string): TaskStatus {
  return state.tasks[exId]?.status ?? 'nicht_begonnen';
}

export function isDue(r: TaskRecord | undefined, today: string): boolean {
  return !!r?.review && r.review.due <= today;
}

/** Prüft und bereinigt importierte Daten. Wirft bei ungültigem Format. */
export function validateImport(data: unknown): ProgressState {
  if (!data || typeof data !== 'object') throw new Error('Die Datei enthält kein gültiges JSON-Objekt.');
  const d = data as Record<string, unknown>;
  const inner = (d.fortschritt ?? d) as Record<string, unknown>;
  if (inner.version !== 1) throw new Error('Unbekanntes Format: Es fehlt „version: 1“.');
  if (!inner.tasks || typeof inner.tasks !== 'object') throw new Error('Unbekanntes Format: Es fehlen die Aufgabendaten („tasks“).');
  const tasks: Record<string, TaskRecord> = {};
  for (const [id, raw] of Object.entries(inner.tasks as Record<string, unknown>)) {
    const t = raw as Partial<TaskRecord>;
    if (!t || typeof t !== 'object' || !(t.status && t.status in STATUS_RANK)) throw new Error(`Ungültiger Eintrag für Aufgabe „${id}“.`);
    tasks[id] = {
      ...blankRecord(typeof t.lastActivity === 'string' ? t.lastActivity : new Date().toISOString()),
      ...t,
      history: Array.isArray(t.history) ? t.history.slice(-30) : [],
    } as TaskRecord;
  }
  return {
    version: 1,
    tasks,
    lastLessonId: typeof inner.lastLessonId === 'string' ? inner.lastLessonId : undefined,
    lastExerciseId: typeof inner.lastExerciseId === 'string' ? inner.lastExerciseId : undefined,
    lessonsVisited: (inner.lessonsVisited as Record<string, string>) ?? {},
    tests: Array.isArray(inner.tests) ? (inner.tests as TestRecord[]) : [],
  };
}
