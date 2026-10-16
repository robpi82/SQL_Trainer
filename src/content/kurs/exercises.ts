import type { Exercise } from '../types';
import { exercisesTag2 } from './tag2';
import { exercisesTag3 } from './tag3';
import { exercisesTag4 } from './tag4';

/** Aufgaben zum Unterricht. Neue Kurstage hier ergänzen (und eine Lektion in kurs/lessons.ts anlegen). */
export const COURSE_EXERCISES: Exercise[] = [...exercisesTag2, ...exercisesTag3, ...exercisesTag4];
