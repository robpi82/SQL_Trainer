import { MODULES, exercisesOfLesson, lessonById, moduleById } from '../content';
import type { Exercise, Lesson } from '../content/types';
import { STATUS_POINTS, statusOf, type ProgressState } from '../progress/model';

/**
 * Sternenkarte: Die Module des Lernpfads sind zu „Systemen“ gruppiert.
 * Jedes System hat einen Stern (Farbe) und Planeten (= Module bzw. Unterrichtstage).
 * Positionen beziehen sich auf eine Karte von MAP_W × MAP_H (wird verschoben und gezoomt).
 */
export const MAP_W = 2280;
export const MAP_H = 1500;

export type PlanetKind = 'fels' | 'erde' | 'gas' | 'eis' | 'ring';

export interface Planet {
  id: string;
  title: string;
  lessonId?: string;
  planned: boolean;
  color: string;
  kind: PlanetKind;
}

export interface StarSystem {
  id: string;
  name: string;
  subtitle: string;
  star: string; // Farbe des Sterns
  x: number;
  y: number;
  /** Beschriftung über oder unter dem System */
  label: 'oben' | 'unten';
  /** Symbol links in der Beschriftung */
  icon?: 'flagge' | 'funkeln';
  /** Unterricht statt Lernpfad */
  course?: boolean;
  planets: Planet[];
}

const PLANET_STYLES: { color: string; kind: PlanetKind }[] = [
  { color: '#2f74d8', kind: 'erde' },
  { color: '#d0773a', kind: 'gas' },
  { color: '#b4553c', kind: 'fels' },
  { color: '#5aa6e0', kind: 'eis' },
  { color: '#d6a46a', kind: 'ring' },
  { color: '#8c6a52', kind: 'fels' },
  { color: '#c25f8a', kind: 'gas' },
  { color: '#7e8fd0', kind: 'eis' },
  { color: '#e0a050', kind: 'gas' },
];

function modulePlanets(ids: number[]): Planet[] {
  return ids.map((id, i) => {
    const m = moduleById.get(id)!;
    const st = PLANET_STYLES[(id * 4 + i) % PLANET_STYLES.length];
    return { id: `m${id}`, title: m.title, lessonId: m.status === 'verfügbar' ? m.lessonId : undefined, planned: m.status !== 'verfügbar', ...st };
  });
}

export const SYSTEMS: StarSystem[] = [
  { id: 'signale', name: 'Die ersten Signale', subtitle: 'Grundlagen · SELECT bis NULL', star: '#5be37d', x: 456, y: 1116, label: 'unten', planets: modulePlanets([1, 2, 3, 4, 5, 6]) },
  { id: 'rechenwerke', name: 'Die Rechenwerke', subtitle: 'Berechnungen, Datum & CASE', star: '#ffb347', x: 432, y: 516, label: 'unten', planets: modulePlanets([7, 8, 13]) },
  { id: 'analyse', name: 'Das Analyse-System', subtitle: 'GROUP BY & HAVING', star: '#c46bff', x: 1152, y: 348, label: 'oben', icon: 'funkeln', planets: modulePlanets([9, 10]) },
  { id: 'verbunden', name: 'Verbundene Welten', subtitle: 'JOINs', star: '#ffc23d', x: 1056, y: 840, label: 'unten', planets: modulePlanets([11]) },
  { id: 'tiefen', name: 'Die Tiefen des Datenraums', subtitle: 'CTEs & Unterabfragen', star: '#6fb6ff', x: 1596, y: 1152, label: 'unten', planets: modulePlanets([12, 17]) },
  { id: 'baumeister', name: 'Die Baumeister', subtitle: 'Daten ändern & Tabellen bauen', star: '#ff6f61', x: 1776, y: 696, label: 'unten', planets: modulePlanets([14, 15]) },
  { id: 'expeditionen', name: 'Expeditionen', subtitle: 'Praxisprojekte', star: '#ff9a3c', x: 1872, y: 240, label: 'unten', icon: 'flagge', planets: modulePlanets([16]) },
  {
    id: 'station',
    name: 'Station CBW',
    subtitle: 'Unterricht · Dezernat 512',
    star: '#36d6c3',
    x: 2064,
    y: 1116,
    label: 'unten',
    course: true,
    planets: ['k02', 'k03', 'k04'].map((id, i) => {
      const l = lessonById.get(id) as Lesson;
      return { id, title: `${l.course!.label}: ${l.title}`, lessonId: id, planned: false, ...PLANET_STYLES[(i * 2 + 1) % PLANET_STYLES.length] };
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
