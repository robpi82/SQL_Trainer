export type SqlValue = string | number | null;

export interface ResultSet {
  columns: string[];
  rows: SqlValue[][];
}

export type ExecResult =
  | { ok: true; results: ResultSet[]; changes: number; durationMs: number }
  | { ok: false; error: string; durationMs: number };

export interface ColumnInfo {
  name: string;
  type: string;
  notNull: boolean;
  pk: boolean;
  fk?: { table: string; column: string };
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  rowCount: number;
}
