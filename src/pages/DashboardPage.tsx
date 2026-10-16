import { EXERCISES, MODULES, exerciseById, lessonById } from '../content';
import { ProgressBar } from '../components/ProgressBar';
import { Link, navigate } from '../lib/router';
import { STATUS_LABEL, dayString, type TaskStatus } from '../progress/model';
import { useProgress } from '../progress/ProgressContext';
import { conceptStats, continueTarget, dueReviews, moduleProgress, overallProgress, upcomingReviews } from '../progress/stats';

const fmtDay = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });

export function DashboardPage() {
  const { state } = useProgress();
  const overall = overallProgress(state);
  const mods = moduleProgress(state);
  const { strengths, focus } = conceptStats(state);
  const due = dueReviews(state);
  const upcoming = upcomingReviews(state);
  const target = continueTarget(state);
  const lastLesson = state.lastLessonId ? lessonById.get(state.lastLessonId) : undefined;
  const targetLesson = lessonById.get(target.lessonId)!;
  const helpUsed = EXERCISES.filter((e) => (state.tasks[e.id]?.hintLevel ?? 0) > 0).length;
  const started = Object.keys(state.tasks).length > 0;

  const countRows: TaskStatus[] = ['selbststaendig', 'mit_hilfe', 'loesung_angesehen', 'in_bearbeitung', 'nicht_begonnen'];

  return (
    <div className="page">
      <h1>Übersicht</h1>
      <div className="grid-2">
        <section className="card highlight">
          <h2>{started ? 'Weiterlernen' : 'Willkommen!'}</h2>
          {lastLesson ? (
            <p>
              Zuletzt bearbeitet: <strong>Modul {lastLesson.moduleId} – {lastLesson.title}</strong>
            </p>
          ) : (
            <p>Starte mit Modul 1. Jede Lektion erklärt ein Thema mit Beispiel und lässt dich danach selbst Abfragen schreiben.</p>
          )}
          <p className="small muted">
            Als Nächstes: Modul {targetLesson.moduleId} – {targetLesson.title}
            {target.exerciseId && <> · Aufgabe „{exerciseById.get(target.exerciseId)?.title}“</>}
          </p>
          <div className="btn-row">
            <button type="button" className="btn btn-primary" onClick={() => navigate(`/lektion/${target.lessonId}`)}>
              Weiterlernen →
            </button>
            {target.exerciseId && (
              <button type="button" className="btn" onClick={() => navigate(`/aufgabe/${target.exerciseId}`)}>
                Direkt zur nächsten Aufgabe
              </button>
            )}
          </div>
        </section>

        <section className="card">
          <h2>Wiederholung</h2>
          {due.length > 0 ? (
            <>
              <p>
                <strong>{due.length}</strong> Aufgabe{due.length === 1 ? ' ist' : 'n sind'} heute zur Wiederholung fällig.
              </p>
              <button type="button" className="btn btn-primary" onClick={() => navigate(`/aufgabe/${due[0].id}?modus=wiederholung`)}>
                Wiederholung starten
              </button>
            </>
          ) : upcoming.length > 0 ? (
            <p>
              Heute ist nichts fällig. Nächste Wiederholung: <strong>{fmtDay(upcoming[0].due)}</strong> („{upcoming[0].ex.title}“).
            </p>
          ) : (
            <p className="muted">Noch keine Wiederholungen geplant. Aufgaben, die du mit Hilfe oder nach Fehlversuchen löst, werden hier nach 1, 3, 7 und 14 Tagen erneut vorgeschlagen.</p>
          )}
          <p className="small">
            <Link to="/wiederholen">Zum Wiederholungsbereich</Link>
          </p>
        </section>
      </div>

      <section className="card">
        <h2>Gesamtfortschritt</h2>
        <ProgressBar percent={overall.percent} label="Gesamtfortschritt im Lernpfad" />
        <p>
          {overall.counts.selbststaendig} von {overall.total} Aufgaben selbstständig gelöst, {overall.counts.mit_hilfe} mit Hilfe. Das ergibt{' '}
          {overall.points.toLocaleString('de-DE')} von {overall.total} Punkten.{' '}
          <Link to="/fortschritt">Wie wird das berechnet?</Link>
        </p>
        <table className="count-table">
          <caption className="sr-only">Aufgaben nach Status</caption>
          <tbody>
            {countRows.map((s) => (
              <tr key={s}>
                <th scope="row">{STATUS_LABEL[s]}</th>
                <td>{overall.counts[s]}</td>
              </tr>
            ))}
            <tr>
              <th scope="row">Aufgaben, bei denen Hinweise genutzt wurden</th>
              <td>{helpUsed}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <div className="grid-2">
        <section className="card">
          <h2>Stärken</h2>
          {strengths.length ? (
            <ul className="concept-list">
              {strengths.map((s) => (
                <li key={s.concept}>
                  <strong>{s.concept}</strong> <span className="muted small">– {Math.round(s.score * 100)} % Erfolg bei {s.attempted} Aufgaben</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Sobald du mehrere Aufgaben zu einem Thema überwiegend selbstständig gelöst hast, erscheinen sie hier.</p>
          )}
        </section>
        <section className="card">
          <h2>Übungsschwerpunkte</h2>
          {focus.length ? (
            <ul className="concept-list">
              {focus.map((s) => (
                <li key={s.concept}>
                  <strong>{s.concept}</strong>{' '}
                  <span className="muted small">
                    – {Math.round(s.score * 100)} % Erfolg, {s.wrong} Fehlversuch{s.wrong === 1 ? '' : 'e'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Hier erscheinen Themen mit vielen Fehlversuchen oder Hilfen – ideal zum gezielten Üben.</p>
          )}
          <p className="small">
            <Link to="/ueben">Gezielt im freien Üben trainieren</Link>
          </p>
        </section>
      </div>

      <section className="card">
        <h2>Fortschritt je Modul</h2>
        <ul className="module-progress">
          {MODULES.map((m) => {
            const p = mods.find((x) => x.moduleId === m.id);
            return (
              <li key={m.id} className={m.status === 'geplant' ? 'planned' : ''}>
                <span className="mp-title">
                  {m.lessonId ? <Link to={`/lektion/${m.lessonId}`}>{m.id}. {m.title}</Link> : `${m.id}. ${m.title}`}
                </span>
                {p ? (
                  <>
                    <ProgressBar small percent={p.percent} label={`Fortschritt Modul ${m.id}`} />
                    <span className="small muted mp-text">
                      {p.counts.selbststaendig}/{p.total} selbstständig · {p.counts.mit_hilfe} mit Hilfe
                    </span>
                  </>
                ) : (
                  <span className="badge badge-planned">geplant</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>
      <p className="small muted">Heute: {fmtDay(dayString())}</p>
    </div>
  );
}
