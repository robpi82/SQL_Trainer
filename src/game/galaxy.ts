import { MODULES, exercisesOfLesson, lessonById, moduleById } from '../content';
import type { Exercise, Lesson } from '../content/types';
import { STATUS_POINTS, statusOf, type ProgressState } from '../progress/model';

/**
 * Sternenkarte: Die Module des Lernpfads sind zu „Systemen“ gruppiert.
 * Jedes System hat einen Stern (Farbe) und Planeten (= Module bzw. Unterrichtstage).
 * Positionen beziehen sich auf eine Karte von 1280 × 760.
 */
export interface Planet {
  id: string;
  title: string;
  lessonId?: string;
  planned: boolean;
  color: string;
}

export interface StarSystem {
  id: string;
  name: string;
  subtitle: string;
  star: string; // Farbe des Sterns
  x: number;
  y: number;
  /** Unterricht statt Lernpfad */
  course?: boolean;
  planets: Planet[];
}

const PLANET_COLORS = ['#c97b4a', '#4a8ccf', '#d9a066', '#8fb3a0', '#b56a8c', '#7a86c9', '#c9b18a'];

function modulePlanets(ids: number[]): Planet[] {
  return ids.map((id, i) => {
    const m = moduleById.get(id)!;
    return { id: `m${id}`, title: m.title, lessonId: m.status === 'verfügbar' ? m.lessonId : undefined, planned: m.status !== 'verfügbar', color: PLANET_COLORS[(id + i) % PLANET_COLORS.length] };
  });
}

export const SYSTEMS: StarSystem[] = [
  { id: 'signale', name: 'Die ersten Signale', subtitle: 'Grundlagen · SELECT bis NULL', star: '#5be37d', x: 175, y: 590, planets: modulePlanets([1, 2, 3, 4, 5, 6]) },
  { id: 'rechenwerke', name: 'Die Rechenwerke', subtitle: 'Berechnungen, Datum & CASE', star: '#ffb347', x: 215, y: 215, planets: modulePlanets([7, 8, 13]) },
  { id: 'analyse', name: 'Das Analyse-System', subtitle: 'Aggregate, GROUP BY & HAVING', star: '#c46bff', x: 640, y: 150, planets: modulePlanets([9, 10]) },
  { id: 'verbunden', name: 'Verbundene Welten', subtitle: 'JOINs', star: '#ffc23d', x: 560, y: 445, planets: modulePlanets([11]) },
  { id: 'tiefen', name: 'Die Tiefen des Datenraums', subtitle: 'Unterabfragen & CTEs', star: '#6fb6ff', x: 905, y: 335, planets: modulePlanets([12, 17]) },
  { id: 'baumeister', name: 'Die Baumeister', subtitle: 'Daten ändern & Tabellen bauen', star: '#ff6f61', x: 1095, y: 590, planets: modulePlanets([14, 15]) },
  { id: 'expeditionen', name: 'Expeditionen', subtitle: 'Praxisprojekte', star: '#ff9a3c', x: 1100, y: 150, planets: modulePlanets([16]) },
  {
    id: 'station',
    name: 'Station CBW',
    subtitle: 'Unterricht · Dezernat 512',
    star: '#36d6c3',
    x: 815,
    y: 640,
    course: true,
    planets: ['k02', 'k03', 'k04'].map((id, i) => {
      const l = lessonById.get(id) as Lesson;
      return { id, title: `${l.course!.label}: ${l.title}`, lessonId: id, planned: false, color: PLANET_COLORS[(i + 2) % PLANET_COLORS.length] };
    }),
  },
];

/** Reihenfolge der Systeme im Lernpfad (gestrichelte Verbindungen). Station CBW hängt an den Baumeistern. */
export const ROUTE: [string, string][] = [
  ['signale', 'rechenwerke'],
  ['rechenwerke', 'analyse'],
  ['analyse', 'verbunden'],
  ['verbunden', 'tiefen'],
  ['tiefen', 'baumeister'],
  ['baumeister', 'expeditionen'],
  ['baumeister', 'station'],
];

export const systemById = new Map(SYSTEMS.map((s) => [s.id, s]));

export function exercisesOfPlanet(p: Planet): Exercise[] {
  return p.lessonId ? exercisesOfLesson(p.lessonId) : [];
}

export function exercisesOfSystem(s: StarSystem): Exercise[] {
  return s.planets.flatMap(exercisesOfPlanet);
}

/** Erkundet-Anteil (0–100) nach denselben Punkten wie der Fortschritt im Lernpfad. */
export function explored(state: ProgressState, ex: Exercise[]): number {
  if (!ex.length) return 0;
  const pts = ex.reduce((a, e) => a + STATUS_POINTS[statusOf(state, e.id)], 0);
  return Math.round((pts / ex.length) * 100);
}

export function systemOfLesson(lessonId: string | undefined): StarSystem | undefined {
  if (!lessonId) return undefined;
  return SYSTEMS.find((s) => s.planets.some((p) => p.lessonId === lessonId));
}

/** Vorgänger im Lernpfad (für die Empfehlung „Vorwissen empfohlen“) */
export function previousSystem(id: string): StarSystem | undefined {
  const r = ROUTE.find(([, to]) => to === id);
  return r ? systemById.get(r[0]) : undefined;
}

/** Nächste offene Aufgabe in einem System (für „Expedition fortsetzen“) */
export function nextMission(state: ProgressState, s: StarSystem): Exercise | undefined {
  return exercisesOfSystem(s).find((e) => !['selbststaendig', 'mit_hilfe'].includes(statusOf(state, e.id)));
}

// Sicherheitsnetz: Jedes verfügbare Modul muss auf der Karte vorkommen.
export const UNMAPPED_MODULES = MODULES.filter((m) => !SYSTEMS.some((s) => s.planets.some((p) => p.id === `m${m.id}`)));
