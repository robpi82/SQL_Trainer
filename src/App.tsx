import { useEffect, useRef, useState } from 'react';
import { href, useRoute } from './lib/router';
import { DarkContext, useTheme, type ThemeSetting } from './lib/theme';
import { DashboardPage } from './pages/DashboardPage';
import { PathPage } from './pages/PathPage';
import { CoursePage } from './pages/CoursePage';
import { LessonPage } from './pages/LessonPage';
import { ExercisePage } from './pages/ExercisePage';
import { PracticePage } from './pages/PracticePage';
import { ReviewPage } from './pages/ReviewPage';
import { TestPage } from './pages/TestPage';
import { SandboxPage } from './pages/SandboxPage';
import { ReferencePage } from './pages/ReferencePage';
import { ProgressPage } from './pages/ProgressPage';
import { useProgress } from './progress/ProgressContext';
import { exerciseById, lessonById } from './content';
import { dueReviews } from './progress/stats';

const NAV = [
  { to: '/', label: 'Übersicht', match: [''] },
  { to: '/lernpfad', label: 'Lernpfad', match: ['lernpfad', 'lektion'] },
  { to: '/unterricht', label: 'Unterricht', match: ['unterricht'] },
  { to: '/ueben', label: 'Freies Üben', match: ['ueben'] },
  { to: '/wiederholen', label: 'Wiederholen', match: ['wiederholen'] },
  { to: '/test', label: 'Wissenstest', match: ['test'] },
  { to: '/sandbox', label: 'SQL-Sandbox', match: ['sandbox'] },
  { to: '/nachschlagen', label: 'Nachschlagewerk', match: ['nachschlagen'] },
  { to: '/fortschritt', label: 'Fortschritt & Daten', match: ['fortschritt'] },
];

export function App() {
  const route = useRoute();
  const { setting, setSetting, dark } = useTheme();
  const { state } = useProgress();
  const due = dueReviews(state).length;
  const [menuOpen, setMenuOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const first = route.parts[0] ?? '';

  // Bei Seitenwechsel nach oben scrollen und Fokus auf den Inhalt setzen (Tastatur/Screenreader)
  useEffect(() => {
    window.scrollTo(0, 0);
    setMenuOpen(false);
    mainRef.current?.focus({ preventScroll: true });
  }, [route.parts.join('/')]);

  let page;
  switch (first) {
    case '':
      page = <DashboardPage />;
      break;
    case 'lernpfad':
      page = <PathPage />;
      break;
    case 'unterricht':
      page = <CoursePage />;
      break;
    case 'lektion':
      page = <LessonPage lessonId={route.parts[1]} section={route.query.get('abschnitt')} />;
      break;
    case 'aufgabe':
      page = <ExercisePage exerciseId={route.parts[1]} mode={route.query.get('modus')} />;
      break;
    case 'ueben':
      page = <PracticePage />;
      break;
    case 'wiederholen':
      page = <ReviewPage />;
      break;
    case 'test':
      page = <TestPage />;
      break;
    case 'sandbox':
      page = <SandboxPage initialDb={route.query.get('db')} initialSql={route.query.get('sql')} />;
      break;
    case 'nachschlagen':
      page = <ReferencePage />;
      break;
    case 'fortschritt':
      page = <ProgressPage />;
      break;
    default:
      page = (
        <div className="page">
          <h1>Seite nicht gefunden</h1>
          <p>
            <a href="#/">Zur Übersicht</a>
          </p>
        </div>
      );
  }

  const modus = route.query.get('modus');
  // Unterrichtslektionen und -aufgaben gehören zum Navigationspunkt „Unterricht“
  const routeLesson =
    first === 'lektion' ? lessonById.get(route.parts[1] ?? '') : first === 'aufgabe' ? lessonById.get(exerciseById.get(route.parts[1] ?? '')?.lessonId ?? '') : undefined;
  const activeNav =
    first === 'aufgabe' && modus === 'frei'
      ? 'ueben'
      : first === 'aufgabe' && modus === 'wiederholung'
        ? 'wiederholen'
        : routeLesson?.course
          ? 'unterricht'
          : first === 'aufgabe'
            ? 'lernpfad'
            : first;

  return (
    <DarkContext.Provider value={dark}>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); mainRef.current?.focus(); }}>
        Zum Inhalt springen
      </a>
      <div className="shell">
        <header className="topbar">
          <button type="button" className="btn btn-ghost menu-btn" aria-expanded={menuOpen} aria-controls="nav" onClick={() => setMenuOpen(!menuOpen)}>
            ☰ Menü
          </button>
          <a className="brand" href="#/">
            <span className="brand-icon" aria-hidden="true">⛁</span> SQL verstehen
          </a>
          <span className="badge dialect-badge" title="Alle Übungen verwenden den SQL-Dialekt von SQLite (im Browser über sql.js)">
            SQLite
          </span>
          <span className="toolbar-spacer" />
          <label className="theme-select">
            <span className="sr-only">Farbschema</span>
            <select value={setting} onChange={(e) => setSetting(e.target.value as ThemeSetting)} aria-label="Farbschema">
              <option value="system">Farbschema: System</option>
              <option value="hell">Farbschema: Hell</option>
              <option value="dunkel">Farbschema: Dunkel</option>
            </select>
          </label>
        </header>
        <nav id="nav" className={menuOpen ? 'sidenav open' : 'sidenav'} aria-label="Hauptnavigation">
          <ul>
            {NAV.map((n) => (
              <li key={n.to}>
                <a href={href(n.to)} aria-current={n.match.includes(activeNav) ? 'page' : undefined}>
                  {n.label}
                  {n.to === '/wiederholen' && due > 0 && <span className="nav-count" aria-label={`${due} fällig`}>{due}</span>}
                </a>
              </li>
            ))}
          </ul>
          <p className="nav-foot small muted">
            Fortschritt wird nur lokal in diesem Browser gespeichert. Sicherung unter „Fortschritt &amp; Daten“.
          </p>
        </nav>
        <main id="main" ref={mainRef} tabIndex={-1} className="main">
          {page}
        </main>
      </div>
    </DarkContext.Provider>
  );
}
