import type { QueryCheck, StateCheck } from '../types';

/** Prüfung über den Vergleich des Abfrageergebnisses */
export const q = (o: Omit<QueryCheck, 'kind'> = {}): QueryCheck => ({ kind: 'query', ...o });

/** Prüfung über den entstandenen Datenbankzustand (für INSERT/UPDATE/DELETE) */
export const state = (o: Omit<StateCheck, 'kind'>): StateCheck => ({ kind: 'state', ...o });
