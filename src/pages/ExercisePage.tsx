import { exerciseById, exercisesOfLesson, lessonById } from '../content';
import { ExerciseWorkspace, type WorkspaceMode } from '../components/ExerciseWorkspace';
import { Link, navigate } from '../lib/router';
import { useProgress } from '../progress/ProgressContext';
import { dueReviews } from '../progress/stats';

export function ExercisePage({ exerciseId, mode: rawMode }: { exerciseId?: string; mode: string | null }) {
  const { state } = useProgress();
  const ex = exerciseId ? exerciseById.get(exerciseId) : undefined;
  if (!ex)
    return (
      <div className="page">
        <h1>Aufgabe nicht gefunden</h1>
        <Link to="/ueben">Zur Aufgabenliste</Link>
      </div>
    );
  const mode: WorkspaceMode = rawMode === 'wiederholung' ? 'wiederholung' : rawMode === 'frei' ? 'frei' : 'lernpfad';
  const lesson = lessonById.get(ex.lessonId)!;
  const list = exercisesOfLesson(lesson.id);
  const idx = list.findIndex((e) => e.id === ex.id);

  let onNext: (() => void) | undefined;
  let nextLabel = 'Nächste Aufgabe';
  if (mode === 'wiederholung') {
    const next = dueReviews(state).find((e) => e.id !== ex.id);
    if (next) onNext = () => navigate(`/aufgabe/${next.id}?modus=wiederholung`);
    else {
      onNext = () => navigate('/wiederholen');
      nextLabel = 'Zurück zum Wiederholungsbereich';
    }
  } else if (mode === 'frei') {
    onNext = () => navigate('/ueben');
    nextLabel = 'Zurück zur Aufgabenliste';
  } else if (idx >= 0 && idx < list.length - 1) {
    onNext = () => navigate(`/aufgabe/${list[idx + 1].id}`);
  } else {
    onNext = () => navigate(`/lektion/${lesson.id}?abschnitt=zusammenfassung`);
    nextLabel = 'Zur Zusammenfassung der Lektion';
  }

  return (
    <div className="page page-wide">
      <nav className="breadcrumb small" aria-label="Brotkrümelnavigation">
        {mode === 'wiederholung' ? (
          <Link to="/wiederholen">Wiederholen</Link>
        ) : mode === 'frei' ? (
          <Link to="/ueben">Freies Üben</Link>
        ) : (
          <Link to="/lernpfad">Lernpfad</Link>
        )}{' '}
        › <Link to={`/lektion/${lesson.id}`}>Modul {lesson.moduleId}: {lesson.title}</Link> ›{' '}
        {mode === 'lernpfad' ? `Aufgabe ${idx + 1} von ${list.length}` : ex.title}
      </nav>
      <ExerciseWorkspace key={ex.id} exercise={ex} mode={mode} onNext={onNext} nextLabel={nextLabel} />
      {mode === 'lernpfad' && (
        <div className="pager">
          {idx > 0 ? <Link to={`/aufgabe/${list[idx - 1].id}`}>← Vorherige Aufgabe</Link> : <span />}
          {idx < list.length - 1 ? <Link to={`/aufgabe/${list[idx + 1].id}`}>Aufgabe überspringen →</Link> : <span />}
        </div>
      )}
    </div>
  );
}
