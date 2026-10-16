import type { ResultSet, SqlValue } from '../db/types';

const MAX_ROWS = 300;

function Cell({ v }: { v: SqlValue }) {
  if (v === null) return <td className="cell-null" title="NULL: kein Wert vorhanden">NULL</td>;
  if (v === '') return <td className="cell-empty" title="Leere Zeichenkette ('') – ein Wert, aber ohne Zeichen">''</td>;
  if (typeof v === 'number') return <td className="cell-num">{Number.isInteger(v) ? v : String(Math.round(v * 1e10) / 1e10)}</td>;
  // Leerzeichen am Rand sichtbar machen (wichtig für TRIM-Übungen)
  if (v !== v.trim()) {
    const m = v.match(/^(\s*)([\s\S]*?)(\s*)$/)!;
    return (
      <td title="Achtung: Leerzeichen am Anfang oder Ende (als · dargestellt)">
        <span className="ws-mark">{'·'.repeat(m[1].length)}</span>
        {m[2]}
        <span className="ws-mark">{'·'.repeat(m[3].length)}</span>
      </td>
    );
  }
  return <td>{v}</td>;
}

export function ResultTable({ result, caption }: { result: ResultSet; caption?: string }) {
  const shown = result.rows.slice(0, MAX_ROWS);
  return (
    <div className="result">
      <div className="table-scroll" tabIndex={0} role="region" aria-label={caption ?? 'Ergebnistabelle'}>
        <table className="data-table">
          {caption && <caption>{caption}</caption>}
          <thead>
            <tr>
              {result.columns.map((c, i) => (
                <th key={i} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={i}>
                {r.map((v, j) => (
                  <Cell key={j} v={v} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="result-meta">
        {result.rows.length === 0
          ? 'Keine Zeilen (leeres Ergebnis).'
          : `${result.rows.length} Zeile${result.rows.length === 1 ? '' : 'n'}, ${result.columns.length} Spalte${result.columns.length === 1 ? '' : 'n'}`}
        {result.rows.length > MAX_ROWS && ` – angezeigt werden die ersten ${MAX_ROWS}.`}
      </p>
    </div>
  );
}
