const WRITTEN = ['SELECT', 'DISTINCT', 'FROM', 'JOIN', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT'];
const LOGICAL = ['FROM', 'JOIN', 'WHERE', 'GROUP BY', 'HAVING', 'SELECT', 'DISTINCT', 'ORDER BY', 'LIMIT'];

/** Gegenüberstellung von Schreib- und logischer Verarbeitungsreihenfolge. */
export function LogicalOrder({ used }: { used: string[] }) {
  const set = new Set(used);
  const row = (list: string[]) =>
    list.map((c, i) => (
      <li key={c} className={set.has(c) ? 'clause used' : 'clause'}>
        <span className="clause-no">{i + 1}</span> {c}
      </li>
    ));
  return (
    <div className="logical-order">
      <div>
        <h4>So schreibst du die Abfrage</h4>
        <ol className="clauses">{row(WRITTEN)}</ol>
      </div>
      <div>
        <h4>So verarbeitet die Datenbank sie</h4>
        <ol className="clauses">{row(LOGICAL)}</ol>
      </div>
      <p className="muted small">
        Hervorgehoben sind die Klauseln dieser Lektion. Weil SELECT logisch erst nach WHERE und GROUP BY kommt, sind Spaltenaliase in WHERE nicht
        sicher verwendbar (Standard-SQL verbietet es), in ORDER BY aber schon.
      </p>
    </div>
  );
}
