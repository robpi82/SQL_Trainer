import { EXERCISES } from '../content';
import { StatusBadge } from '../components/StatusBadge';
import { Link, navigate } from '../lib/router';
import { REVIEW_INTERVALS, statusOf } from '../progress/model';
import { useProgress } from '../progress/ProgressContext';
import { dueReviews, upcomingReviews } from '../progress/stats';

const fmt = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

export function ReviewPage() {
  const { state } = useProgress();
  const due = dueReviews(state);
  const upcoming = upcomingReviews(state);
  const open = EXERCISES.filter((e) => statusOf(state, e.id) === 'in_bearbeitung' && (state.tasks[e.id]?.wrong ?? 0) > 0);
  const helped = EXERCISES.filter((e) => ['mit_hilfe', 'loesung_angesehen'].includes(statusOf(state, e.id)));

  return (
    <div className="page">
      <h1>Wiederholen</h1>
      <p>
        Aufgaben, die du mit Hilfe, nach Fehlversuchen oder mit Blick in die Musterlösung bearbeitet hast, werden nach{' '}
        {REVIEW_INTERVALS.join(', ').replace(/, (\d+)$/, ' und $1')} Tagen erneut vorgeschlagen. Löst du eine fällige Aufgabe selbstständig, rückt sie
        eine Stufe weiter; brauchst du wieder Hilfe, beginnt der Plan von vorn. Nach der 14-Tage-Stufe gilt sie als gefestigt.
      </p>

      <section className="card">
        <h2>Heute fällig ({due.length})</h2>
        {due.length === 0 ? (
          <p className="muted">Heute ist keine Wiederholung fällig.</p>
        ) : (
          <>
            <ul className="review-list">
              {due.map((e) => (
                <li key={e.id}>
                  <Link to={`/aufgabe/${e.id}?modus=wiederholung`}>{e.title}</Link> <StatusBadge status={statusOf(state, e.id)} />{' '}
                  <span className="small muted">Stufe {state.tasks[e.id]!.review!.stage + 1} von {REVIEW_INTERVALS.length}</span>
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn-primary" onClick={() => navigate(`/aufgabe/${due[0].id}?modus=wiederholung`)}>
              Wiederholung starten
            </button>
          </>
        )}
      </section>

      <section className="card">
        <h2>Geplante Wiederholungen</h2>
        {upcoming.length === 0 ? (
          <p className="muted">Keine weiteren Wiederholungen geplant.</p>
        ) : (
          <table className="list-table">
            <thead>
              <tr>
                <th scope="col">Fällig am</th>
                <th scope="col">Aufgabe</th>
                <th scope="col">Stufe</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map(({ ex, due: d }) => (
                <tr key={ex.id}>
                  <td>{fmt(d)}</td>
                  <td>
                    <Link to={`/aufgabe/${ex.id}?modus=frei`}>{ex.title}</Link>
                  </td>
                  <td>
                    {state.tasks[ex.id]!.review!.stage + 1} / {REVIEW_INTERVALS.length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="small muted">Vorzeitiges Üben ist jederzeit möglich, verschiebt den Plan aber nicht.</p>
      </section>

      <section className="card">
        <h2>Offene Aufgaben mit Fehlversuchen ({open.length})</h2>
        {open.length === 0 ? (
          <p className="muted">Keine.</p>
        ) : (
          <ul className="review-list">
            {open.map((e) => (
              <li key={e.id}>
                <Link to={`/aufgabe/${e.id}?modus=frei`}>{e.title}</Link>{' '}
                <span className="small muted">{state.tasks[e.id]!.wrong} Fehlversuch(e)</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Mit Hilfe gelöst oder Lösung angesehen ({helped.length})</h2>
        {helped.length === 0 ? (
          <p className="muted">Keine.</p>
        ) : (
          <ul className="review-list">
            {helped.map((e) => (
              <li key={e.id}>
                <Link to={`/aufgabe/${e.id}?modus=frei`}>{e.title}</Link> <StatusBadge status={statusOf(state, e.id)} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
