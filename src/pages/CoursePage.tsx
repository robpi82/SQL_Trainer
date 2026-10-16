import { COURSE_LESSONS, TYPE_LABEL, exercisesOfLesson } from '../content';
import { ProgressBar } from '../components/ProgressBar';
import { Link } from '../lib/router';
import { useProgress } from '../progress/ProgressContext';
import { progressOf } from '../progress/stats';

export function CoursePage() {
  const { state } = useProgress();
  return (
    <div className="page">
      <h1>Unterricht</h1>
      <p>
        Lektionen und Übungen passend zu deinen Kurstagen (E.I.S. · Dezernat 512). Die Übungen sind <strong>neue, parallele Fälle</strong> zu den Aufgaben
        aus dem Unterricht – du übst also zusätzlich, statt dieselben Aufgaben zu wiederholen. Sie laufen auf der <strong>Lieferdatenbank des E.I.S.</strong> im
        Stand nach Einsatz 512-003.
      </p>
      <p className="small muted">
        Fortschritt und Wiederholungen funktionieren wie im Lernpfad. Im Gesamtfortschritt des Lernpfads werden diese Aufgaben nicht mitgezählt, sie haben hier
        ihre eigene Anzeige.
      </p>
      <ol className="path">
        {COURSE_LESSONS.map((l) => {
          const ex = exercisesOfLesson(l.id);
          const p = progressOf(state, ex);
          const types = [...new Set(ex.map((e) => TYPE_LABEL[e.type]))].join(', ');
          return (
            <li key={l.id} className="path-item">
              <div className="path-no">{l.course!.day}</div>
              <div className="path-body">
                <h2>
                  <Link to={`/lektion/${l.id}`}>
                    {l.course!.label}: {l.title}
                  </Link>
                </h2>
                <p className="small muted">Grundlage: {l.course!.sources.join(' · ')}</p>
                <ProgressBar small percent={p.percent} label={`Fortschritt ${l.course!.label}`} />
                <p className="small">
                  {ex.length} Aufgaben ({types}) · {p.counts.selbststaendig} selbstständig · {p.counts.mit_hilfe} mit Hilfe · {p.counts.nicht_begonnen} offen
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
