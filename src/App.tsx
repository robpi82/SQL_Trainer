import { useEffect, useRef, useState } from 'react';
import { href, useRoute } from './lib/router';
import { DarkContext, SpaceContext, useTheme, type ThemeSetting } from './lib/theme';
import { Icon, type IconName } from './components/Icons';
import { StarMapPage } from './pages/StarMapPage';
import { MedalsPage } from './pages/MedalsPage';
import { medals, streak, totalXp } from './game/rewards';
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

type NavItem = { to: string; label: string; match: string[]; icon: IconName; mobile?: boolean };
const NAV: NavItem[] = [
  { to: '/', label: 'Sternenkarte', match: [''], icon: 'karte', mobile: true },
  { to: '/uebersicht', label: 'Übersicht', match: ['uebersicht'], icon: 'uebersicht' },
  { to: '/lernpfad', label: 'Lernpfad', match: ['lernpfad', 'lektion'], icon: 'pfad' },
  { to: '/unterricht', label: 'Expedition: Unterricht', match: ['unterricht'], icon: 'rakete', mobile: true },
  { to: '/ueben', label: 'Üben', match: ['ueben'], icon: 'balken', mobile: true },
  { to: '/wiederholen', label: 'Wiederholen', match: ['wiederholen'], icon: 'wiederholen' },
  { to: '/test', label: 'Wissenstest', match: ['test'], icon: 'test' },
  { to: '/sandbox', label: 'SQL-Sandbox', match: ['sandbox'], icon: 'terminal' },
  { to: '/medaillen', label: 'Medaillen', match: ['medaillen'], icon: 'pokal', mobile: true },
  { to: '/nachschlagen', label: 'SQL-Lexikon', match: ['nachschlagen'], icon: 'buch', mobile: true },
  { to: '/fortschritt', label: 'Fortschritt & Daten', match: ['fortschritt'], icon: 'daten' },
];

export function App() {
  const route = useRoute();
  const { setting, setSetting, dark, space } = useTheme();
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
      page = <StarMapPage />;
      break;
    case 'uebersicht':
      page = <DashboardPage />;
      break;
    case 'medaillen':
      page = <MedalsPage />;
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
            <a href="#/">Zur Startseite</a>
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

  const xp = totalXp(state);
  const days = streak(state);
  const medalCount = medals(state).filter((m) => m.earned).length;

  return (
    <DarkContext.Provider value={dark}>
      <SpaceContext.Provider value={space}>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); mainRef.current?.focus(); }}>
        Zum Inhalt springen
      </a>
      <div className="shell">
        <header className="topbar">
          <button type="button" className="btn btn-ghost menu-btn" aria-expanded={menuOpen} aria-controls="nav" onClick={() => setMenuOpen(!menuOpen)}>
            ☰<span className="menu-word"> Menü</span>
          </button>
          <a className="brand" href="#/">
            <svg className="brand-planet" viewBox="0 0 40 40" aria-hidden="true">
              <defs>
                <linearGradient id="brand-g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#8fd3ff" />
                  <stop offset="100%" stopColor="#7c5cff" />
                </linearGradient>
              </defs>
              <circle cx="20" cy="20" r="11" fill="url(#brand-g)" />
              <ellipse cx="20" cy="21" rx="18" ry="6" fill="none" stroke="#b7a6ff" strokeWidth="2.2" transform="rotate(-22 20 20)" />
            </svg>
            <span className="brand-text">{space ? <>SPACE<br />ACADEMY</> : 'SQL verstehen'}</span>
          </a>
          <span className="badge dialect-badge" title="Alle Übungen verwenden den SQL-Dialekt von SQLite (im Browser über sql.js)">
            SQLite
          </span>
          <span className="toolbar-spacer" />
          {space && (
            <div className="stat-pills" aria-label="Deine Werte">
              <a className="stat-pill" href="#/medaillen" title="Erfahrungspunkte aus gelösten Aufgaben">
                <span aria-hidden="true">⭐</span> {xp.toLocaleString('de-DE')} <small>XP</small>
              </a>
              <a className="stat-pill" href="#/medaillen" title="Tage in Folge mit mindestens einer gelösten Aufgabe">
                <span aria-hidden="true">🔥</span> {days} {days === 1 ? 'Tag' : 'Tage'}
              </a>
              <a className="stat-pill" href="#/medaillen" title="Verdiente Medaillen">
                <span aria-hidden="true">🏅</span> {medalCount} <span className="pill-word">Medaillen</span>
              </a>
            </div>
          )}
          <label className="theme-select">
            <span className="sr-only">Design</span>
            <select value={setting} onChange={(e) => setSetting(e.target.value as ThemeSetting)} aria-label="Design">
              <option value="weltraum">Design: Weltraum</option>
              <option value="system">Design: Klassisch (System)</option>
              <option value="hell">Design: Klassisch hell</option>
              <option value="dunkel">Design: Klassisch dunkel</option>
            </select>
          </label>
          {space && (
            <a className="avatar" href="#/fortschritt" title="Fortschritt & Daten" aria-label="Fortschritt und Daten">
              <span aria-hidden="true">👩‍🚀</span>
            </a>
          )}
        </header>
        <nav id="nav" className={menuOpen ? 'sidenav open' : 'sidenav'} aria-label="Hauptnavigation">
          <ul>
            {NAV.map((n) => (
              <li key={n.to}>
                <a href={href(n.to)} aria-current={n.match.includes(activeNav) ? 'page' : undefined}>
                  <span className="nav-label">
                    <Icon name={n.icon} className="nav-icon" />
                    {n.label}
                  </span>
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
        <nav className="bottomnav" aria-label="Schnellnavigation">
          {NAV.filter((n) => n.mobile).map((n) => (
            <a key={n.to} href={href(n.to)} aria-current={n.match.includes(activeNav) ? 'page' : undefined}>
              <Icon name={n.icon} />
              <span>{n.label.replace('Expedition: ', '').replace('SQL-', '')}</span>
            </a>
          ))}
        </nav>
      </div>
      </SpaceContext.Provider>
    </DarkContext.Provider>
  );
}
