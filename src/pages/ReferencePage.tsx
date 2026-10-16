import { useState } from 'react';
import { MODULES } from '../content';
import { inline } from '../components/Markup';
import { REFERENCE } from '../content/reference';
import { Link } from '../lib/router';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function ReferencePage() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('alle');
  const cats = [...new Set(REFERENCE.map((r) => r.category))];
  const terms = norm(q).split(/\s+/).filter(Boolean);
  const list = REFERENCE.filter((r) => {
    if (cat !== 'alle' && r.category !== cat) return false;
    const hay = norm([r.title, r.syntax, r.explanation, r.example, ...r.mistakes, r.dialect ?? ''].join(' '));
    return terms.every((t) => hay.includes(t));
  });

  return (
    <div className="page">
      <h1>SQL-Nachschlagewerk</h1>
      <p>Syntax, Erklärung, Beispiel und typische Fehler – bezogen auf SQLite. Hinweise zu MySQL, PostgreSQL und SQL Server stehen dort, wo es Unterschiede gibt.</p>
      <div className="card filters">
        <label className="grow">
          Suche
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="z. B. NULL, JOIN, Datum, HAVING …" />
        </label>
        <label>
          Kategorie
          <select value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="alle">Alle</option>
            {cats.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="small muted" role="status">
        {list.length} Einträge
      </p>
      {list.map((r) => {
        const mod = r.moduleId ? MODULES.find((m) => m.id === r.moduleId) : undefined;
        return (
          <article key={r.id} className="card ref-entry" id={`ref-${r.id}`}>
            <h2>
              {r.title} <span className="badge">{r.category}</span>
            </h2>
            <pre className="code-block">{r.syntax}</pre>
            <p>{inline(r.explanation)}</p>
            <h3 className="h-small">Beispiel</h3>
            <pre className="code-block">{r.example}</pre>
            <Link className="btn btn-small" to={`/sandbox?db=${r.db}&sql=${encodeURIComponent(r.example)}`}>
              In der Sandbox ausprobieren
            </Link>
            <h3 className="h-small">Typische Fehler</h3>
            <ul>
              {r.mistakes.map((m, i) => (
                <li key={i}>{inline(m)}</li>
              ))}
            </ul>
            {r.dialect && (
              <p className="dialect small">
                <strong>Andere Datenbanken:</strong> {inline(r.dialect)}
              </p>
            )}
            {mod &&
              (mod.lessonId && mod.status === 'verfügbar' ? (
                <p className="small">
                  Ausführlich erklärt in <Link to={`/lektion/${mod.lessonId}`}>Modul {mod.id}: {mod.title}</Link>
                </p>
              ) : (
                <p className="small muted">Lektion „{mod.title}“ ist geplant.</p>
              ))}
          </article>
        );
      })}
    </div>
  );
}
