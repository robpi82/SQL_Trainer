import type { RowExample } from '../engine/compare';
import type { ExplainedError } from '../engine/errors';
import { ResultTable } from './ResultTable';

export function ErrorBox({ error }: { error: ExplainedError }) {
  return (
    <div className={`feedback feedback-error`} role="alert">
      <div className="feedback-head">
        <span className={`err-cat err-${error.category}`}>{error.title}</span>
      </div>
      {error.explanation.length > 0 ? (
        <ul className="feedback-list">
          {error.explanation.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      ) : (
        <p>Für diese Meldung gibt es keine automatische Erklärung. Lies die Originalmeldung und vergleiche deine Abfrage mit dem Nachschlagewerk.</p>
      )}
      <p className="orig-msg">
        <span>{error.category === 'timeout' ? 'Meldung:' : 'Meldung der Datenbank:'}</span> <code>{error.original}</code>
      </p>
    </div>
  );
}

export function WrongBox({ messages, notes, examples, statement }: { messages: string[]; notes: string[]; examples: RowExample[]; statement?: boolean }) {
  return (
    <div className="feedback feedback-wrong" role="alert">
      <div className="feedback-head">
        <strong>Noch nicht richtig.</strong>{' '}
        {statement
          ? 'Deine Anweisung ist ausführbar, aber der entstandene Tabelleninhalt passt noch nicht zur Aufgabe.'
          : 'Deine Abfrage ist ausführbar, aber das Ergebnis passt noch nicht zur Aufgabe.'}
      </div>
      <ul className="feedback-list">
        {messages.map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ul>
      {notes.map((n, i) => (
        <p key={i} className="note">
          Hinweis: {n}
        </p>
      ))}
      {examples.length > 0 && (
        <details className="examples">
          <summary>Beispielzeilen anzeigen (verrät Daten, aber nicht die Abfrage)</summary>
          {examples.map((e, i) => (
            <ResultTable key={i} result={{ columns: e.columns, rows: e.rows }} caption={e.label} />
          ))}
        </details>
      )}
    </div>
  );
}

export function NotesBox({ notes }: { notes: string[] }) {
  if (!notes.length) return null;
  return (
    <div className="feedback feedback-note">
      {notes.map((n, i) => (
        <p key={i}>Hinweis: {n}</p>
      ))}
    </div>
  );
}
