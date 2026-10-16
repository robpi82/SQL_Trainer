import { MODULES, exercisesOfLesson, lessonById } from '../content';
import { ProgressBar } from '../components/ProgressBar';
import { Link } from '../lib/router';
import { useProgress } from '../progress/ProgressContext';
import { progressOf } from '../progress/stats';

export function PathPage() {
  const { state } = useProgress();
  return (
    <div className="page">
      <h1>Lernpfad</h1>
      <p>
        Die Module bauen aufeinander auf. Jede Lektion setzt nur Konzepte voraus, die vorher erklärt wurden. Du kannst jederzeit springen – empfohlen ist
        aber die Reihenfolge.
      </p>
      <ol className="path">
        {MODULES.map((m) => {
          const lesson = m.lessonId ? lessonById.get(m.lessonId) : undefined;
          if (!lesson || m.status === 'geplant')
            return (
              <li key={m.id} className="path-item planned">
                <div className="path-no">{m.id}</div>
                <div className="path-body">
                  <h2>{m.title}</h2>
                  <p className="muted">
                    <span className="badge badge-planned">geplant</span> Dieses Modul ist noch nicht ausgearbeitet.
                  </p>
                </div>
              </li>
            );
          const ex = exercisesOfLesson(lesson.id);
          const p = progressOf(state, ex);
          return (
            <li key={m.id} className="path-item">
              <div className="path-no">{m.id}</div>
              <div className="path-body">
                <h2>
                  <Link to={`/lektion/${lesson.id}`}>{lesson.title}</Link>
                </h2>
                <p className="small muted">{lesson.goals[0]}</p>
                <ProgressBar small percent={p.percent} label={`Fortschritt Modul ${m.id}`} />
                <p className="small">
                  {ex.length} Aufgaben · {p.counts.selbststaendig} selbstständig · {p.counts.mit_hilfe} mit Hilfe · {p.counts.loesung_angesehen} Lösung
                  angesehen · {p.counts.nicht_begonnen} offen
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
