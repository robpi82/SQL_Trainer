import { useEffect } from 'react';
import { DIFFICULTY_LABEL, TYPE_LABEL, exercisesOfLesson, lessonById, ORDERED_LESSONS } from '../content';
import { ExerciseWorkspace } from '../components/ExerciseWorkspace';
import { LogicalOrder } from '../components/LogicalOrder';
import { Markup, inline } from '../components/Markup';
import { QueryPreview } from '../components/QueryPreview';
import { StatusBadge } from '../components/StatusBadge';
import { Link, navigate } from '../lib/router';
import { statusOf } from '../progress/model';
import { useProgress } from '../progress/ProgressContext';

const sandboxLink = (db: string, sql: string) => `/sandbox?db=${db}&sql=${encodeURIComponent(sql)}`;

export function LessonPage({ lessonId, section }: { lessonId?: string; section: string | null }) {
  const { state, dispatch } = useProgress();
  const lesson = lessonId ? lessonById.get(lessonId) : undefined;

  useEffect(() => {
    if (lesson) dispatch({ type: 'visitLesson', lessonId: lesson.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id]);

  useEffect(() => {
    if (section) setTimeout(() => document.getElementById(section)?.scrollIntoView({ behavior: 'auto', block: 'start' }), 50);
  }, [section, lessonId]);

  if (!lesson)
    return (
      <div className="page">
        <h1>Lektion nicht gefunden</h1>
        <Link to="/lernpfad">Zum Lernpfad</Link>
      </div>
    );

  const all = exercisesOfLesson(lesson.id);
  const guided = all.find((e) => e.guided);
  const tasks = all.filter((e) => !e.guided);
  const pos = ORDERED_LESSONS.findIndex((l) => l.id === lesson.id);
  const prev = ORDERED_LESSONS[pos - 1];
  const next = ORDERED_LESSONS[pos + 1];

  return (
    <div className="page lesson">
      <nav className="breadcrumb small" aria-label="Brotkrümelnavigation">
        <Link to="/lernpfad">Lernpfad</Link> › Modul {lesson.moduleId}
      </nav>
      <h1>
        <span className="muted">Modul {lesson.moduleId}:</span> {lesson.title}
      </h1>
      <nav className="toc small" aria-label="Abschnitte">
        <a href={`#/lektion/${lesson.id}?abschnitt=ziel`}>1. Lernziel</a>
        <a href={`#/lektion/${lesson.id}?abschnitt=erklaerung`}>2. Erklärung</a>
        <a href={`#/lektion/${lesson.id}?abschnitt=beispiel`}>3. Beispiel</a>
        <a href={`#/lektion/${lesson.id}?abschnitt=schritte`}>4. Schritt für Schritt</a>
        <a href={`#/lektion/${lesson.id}?abschnitt=uebung`}>5. Angeleitete Übung</a>
        <a href={`#/lektion/${lesson.id}?abschnitt=aufgaben`}>6. Aufgaben</a>
        <a href={`#/lektion/${lesson.id}?abschnitt=zusammenfassung`}>7. Zusammenfassung</a>
      </nav>

      <section id="ziel" className="card lesson-section">
        <h2>1. Lernziel</h2>
        <p>Nach dieser Lektion …</p>
        <ul>
          {lesson.goals.map((g, i) => (
            <li key={i}>{inline(g)}</li>
          ))}
        </ul>
      </section>

      <section id="erklaerung" className="card lesson-section">
        <h2>2. Erklärung</h2>
        {lesson.explanation.map((p, i) => (
          <Markup key={i} text={p} />
        ))}
        {lesson.terms && (
          <dl className="terms">
            {lesson.terms.map((t) => (
              <div key={t.term}>
                <dt>{t.term}</dt>
                <dd>{t.definition}</dd>
              </div>
            ))}
          </dl>
        )}
        {lesson.logicalOrder && (
          <>
            <h3>Schreibreihenfolge und logische Verarbeitung</h3>
            <LogicalOrder used={lesson.logicalOrder} />
          </>
        )}
        {lesson.dialectNotes && (
          <aside className="dialect">
            <h3>SQLite und andere Datenbanken</h3>
            <ul>
              {lesson.dialectNotes.map((d, i) => (
                <li key={i}>{inline(d)}</li>
              ))}
            </ul>
          </aside>
        )}
      </section>

      <section id="beispiel" className="card lesson-section">
        <h2>3. Konkretes Beispiel</h2>
        {lesson.example.tables.map((t, i) => (
          <div key={i}>
            <h3 className="h-small">Beispieltabelle: {t.label}</h3>
            <QueryPreview db={lesson.example.db} sql={t.sql} />
          </div>
        ))}
        <h3 className="h-small">Abfrage</h3>
        <pre className="code-block">{lesson.example.sql}</pre>
        <h3 className="h-small">Ergebnis</h3>
        <QueryPreview db={lesson.example.db} sql={lesson.example.sql} />
        {lesson.example.note && <Markup text={lesson.example.note} className="note" />}
        <p>
          <Link className="btn btn-small" to={sandboxLink(lesson.example.db, lesson.example.sql)}>
            In der Sandbox ausprobieren und abwandeln
          </Link>
        </p>
        {lesson.extraSections?.map((s, i) => (
          <div key={i} className="extra">
            <h3>{s.title}</h3>
            {s.paragraphs.map((p, j) => (
              <Markup key={j} text={p} />
            ))}
            {s.sql && (
              <>
                <pre className="code-block">{s.sql}</pre>
                <QueryPreview db={s.db ?? lesson.example.db} sql={s.sql} />
              </>
            )}
          </div>
        ))}
      </section>

      <section id="schritte" className="card lesson-section">
        <h2>4. Schritt für Schritt</h2>
        <ol className="steps">
          {lesson.steps.map((s, i) => (
            <li key={i}>
              <code className="step-code">{s.code}</code>
              <span>{inline(s.text)}</span>
            </li>
          ))}
        </ol>
      </section>

      <section id="uebung" className="lesson-section">
        <h2>5. Angeleitete Übung</h2>
        <p className="muted">Eine ähnliche Aufgabe wie im Beispiel. Die Hilfen führen dich Schritt für Schritt zur Lösung, falls du hängst.</p>
        {guided && <ExerciseWorkspace key={guided.id} exercise={guided} mode="lernpfad" onNext={() => navigate(`/lektion/${lesson.id}?abschnitt=aufgaben`)} nextLabel="Weiter zu den Aufgaben" />}
      </section>

      <section id="aufgaben" className="card lesson-section">
        <h2>6. Selbstständige Aufgaben</h2>
        <p>Die Aufgaben werden schrittweise anspruchsvoller. Versuche sie zuerst ohne Hinweise.</p>
        <ol className="task-list">
          {tasks.map((t) => (
            <li key={t.id}>
              <Link to={`/aufgabe/${t.id}`} className="task-link">
                <span className="task-title">{t.title}</span>
                <span className="task-meta small">
                  <span className="badge">{TYPE_LABEL[t.type]}</span> <span className={`badge diff-${t.difficulty}`}>{DIFFICULTY_LABEL[t.difficulty]}</span>
                </span>
                <StatusBadge status={statusOf(state, t.id)} />
              </Link>
            </li>
          ))}
        </ol>
        {tasks[0] && (
          <button type="button" className="btn btn-primary" onClick={() => navigate(`/aufgabe/${(tasks.find((t) => !['selbststaendig', 'mit_hilfe'].includes(statusOf(state, t.id))) ?? tasks[0]).id}`)}>
            Mit den Aufgaben beginnen →
          </button>
        )}
      </section>

      <section id="zusammenfassung" className="card lesson-section summary">
        <h2>7. Zusammenfassung</h2>
        <p className="merksatz">
          <strong>Merksatz:</strong> {inline(lesson.summary.merksatz)}
        </p>
        <h3>Typische Fehler</h3>
        <ul>
          {lesson.summary.fehler.map((f, i) => (
            <li key={i}>{inline(f)}</li>
          ))}
        </ul>
      </section>

      <div className="pager">
        {prev ? <Link to={`/lektion/${prev.id}`}>← Modul {prev.moduleId}: {prev.title}</Link> : <span />}
        {next ? <Link to={`/lektion/${next.id}`}>Modul {next.moduleId}: {next.title} →</Link> : <span />}
      </div>
    </div>
  );
}
