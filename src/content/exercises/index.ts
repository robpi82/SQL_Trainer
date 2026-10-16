import type { Exercise } from '../types';
import { exercisesM01toM04 } from './m01-m04';
import { exercisesM05toM08 } from './m05-m08';
import { exercisesM09toM11 } from './m09-m11';
import { exercisesM12toM14 } from './m12-m14';
import { exercisesM13 } from './m13';

/** Alle Aufgaben in Lernpfad-Reihenfolge. Neue Dateien hier ergänzen. */
export const EXERCISES: Exercise[] = [...exercisesM01toM04, ...exercisesM05toM08, ...exercisesM09toM11, ...exercisesM12toM14, ...exercisesM13];
