import { useEffect, useState } from 'react';
import { exercisesOfLesson, lessonById } from '../content';
import { Icon } from '../components/Icons';
import { Starfield, SystemArt, SystemDefs } from '../components/SpaceArt';
import { ROUTE, SYSTEMS, explored, exercisesOfPlanet, exercisesOfSystem, nextMission, previousSystem, systemById, systemOfLesson, type StarSystem } from '../game/galaxy';
import { Link, navigate } from '../lib/router';
import { useProgress } from '../progress/ProgressContext';
import { continueTarget } from '../progress/stats';

const W = 1280;
const H = 850;

/** Startseite: Sternenkarte des Lernpfads */
export function StarMapPage() {
  const { state } = useProgress();
  const target = continueTarget(state);
  const here = systemOfLesson(state.lastLessonId) ?? systemOfLesson(target.lessonId) ?? SYSTEMS[0];
  const [selectedId, setSelectedId] = useState(here.id);
  const [zoom, setZoom] = useState(1);
  const selected = systemById.get(selectedId) ?? here;

  useEffect(() => setSelectedId(here.id), [here.id]);

  const openLesson = (lessonId: string) => navigate(`/lektion/${lessonId}`);

  return (
    <div className="page page-wide starmap-page">
      <header className="starmap-head">
        <h1>Deine SQL-Galaxie</h1>
        <p className="starmap-sub">Entdecke Systeme. Erforsche Planeten. Meistere SQL.</p>
      </header>

      <div className="starmap-layout">
        {/* ---------- Karte (Desktop/Tablet quer) ---------- */}
        <section className="starmap" aria-label="Sternenkarte">
          <div className="starmap-viewport">
            <div className="starmap-canvas" style={{ width: `${zoom * 100}%` }}>
              <svg viewBox={`0 0 ${W} ${H}`} className="starmap-svg" role="img" aria-label="Sternenkarte mit den Systemen des Lernpfads">
                <defs>
                  <radialGradient id="nebula-a">
                    <stop offset="0%" stopColor="#7a4dff" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#7a4dff" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="nebula-b">
                    <stop offset="0%" stopColor="#2e8bff" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#2e8bff" stopOpacity="0" />
                  </radialGradient>
                  {SYSTEMS.map((s) => (
                    <SystemDefs key={s.id} system={s} idPrefix={`map-${s.id}`} />
                  ))}
                </defs>
                <ellipse cx={760} cy={180} rx={420} ry={190} fill="url(#nebula-a)" />
                <ellipse cx={330} cy={520} rx={380} ry={220} fill="url(#nebula-b)" />
                <ellipse cx={1050} cy={560} rx={300} ry={170} fill="url(#nebula-a)" />
                <Starfield width={W} height={H} count={260} />
                {ROUTE.map(([a, b]) => {
                  const s1 = systemById.get(a)!;
                  const s2 = systemById.get(b)!;
                  const mx = (s1.x + s2.x) / 2 + (s2.y - s1.y) * 0.18;
                  const my = (s1.y + s2.y) / 2 - (s2.x - s1.x) * 0.18;
                  return <path key={a + b} d={`M${s1.x} ${s1.y} Q${mx} ${my} ${s2.x} ${s2.y}`} className="route" />;
                })}
                {SYSTEMS.map((s) => (
                  <g key={s.id} className="system-hit" onClick={() => setSelectedId(s.id)}>
                    <SystemArt system={s} idPrefix={`map-${s.id}`} cx={s.x} cy={s.y} scale={0.82} highlight={s.id === selected.id} onPlanet={openLesson} />
                  </g>
                ))}
                {/* Raumschiff „Du bist hier“ */}
                <g transform={`translate(${here.x + 70} ${here.y - 78}) rotate(-28)`} className="ship" aria-hidden="true">
                  <path d="M0 0 L26 -6 L34 0 L26 6 Z" fill="#dfe7ff" />
                  <path d="M6 -4 L0 -12 L12 -5 Z M6 4 L0 12 L12 5 Z" fill="#9fb2ff" />
                  <path d="M-12 0 L0 -3 L0 3 Z" fill="#7cf3ff" opacity="0.85" />
                </g>
              </svg>
              {SYSTEMS.map((s) => (
                <SystemLabel key={s.id} system={s} selected={s.id === selected.id} onSelect={() => setSelectedId(s.id)} />
              ))}
              <span className="here-badge" style={{ left: `${((here.x + 112) / W) * 100}%`, top: `${((here.y - 104) / H) * 100}%` }}>
                Du bist hier
              </span>
            </div>
          </div>
          <div className="zoom-controls">
            <button type="button" className="zoom-btn" aria-label="Vergrößern" onClick={() => setZoom((z) => Math.min(1.8, +(z + 0.2).toFixed(1)))}>
              <Icon name="plus" />
            </button>
            <button type="button" className="zoom-btn" aria-label="Verkleinern" onClick={() => setZoom((z) => Math.max(1, +(z - 0.2).toFixed(1)))}>
              <Icon name="minus" />
            </button>
          </div>
          <div className="map-legend small">
            <span>
              <Icon name="schloss" size={16} /> Vorwissen empfohlen
            </span>
            <span>
              <span className="legend-dot legend-course" /> Unterricht
            </span>
            <span>Planet anklicken = Lektion öffnen</span>
          </div>
        </section>

        {/* ---------- Liste (Smartphone/Tablet hoch) ---------- */}
        <section className="system-list" aria-label="Systeme">
          {SYSTEMS.map((s) => (
            <button key={s.id} type="button" className={s.id === selected.id ? 'system-tile active' : 'system-tile'} onClick={() => setSelectedId(s.id)}>
              <svg viewBox="0 0 220 120" className="system-tile-art" aria-hidden="true">
                <defs>
                  <SystemDefs system={s} idPrefix={`tile-${s.id}`} />
                </defs>
                <Starfield width={220} height={120} count={30} seed={s.x} />
                <SystemArt system={s} idPrefix={`tile-${s.id}`} cx={110} cy={60} scale={0.6} />
              </svg>
              <SystemLabelBody system={s} />
            </button>
          ))}
        </section>

        <SystemPanel system={selected} />
      </div>
    </div>
  );
}

function SystemLabelBody({ system }: { system: StarSystem }) {
  const { state } = useProgress();
  const ex = exercisesOfSystem(system);
  const p = explored(state, ex);
  const prev = previousSystem(system.id);
  const recommendPrior = prev && !system.course && explored(state, exercisesOfSystem(prev)) < 50 && p === 0;
  const allPlanned = ex.length === 0;
  return (
    <span className="label-body">
      <span className="label-title">
        {p >= 100 && <span className="label-check" aria-label="vollständig erkundet">✓</span>}
        {system.name}
        {recommendPrior && (
          <span className="label-lock" title={`Vorwissen empfohlen: erst „${prev!.name}“ erkunden`}>
            <Icon name="schloss" size={14} />
          </span>
        )}
      </span>
      <span className="label-sub">
        {system.subtitle}
        {system.course && <span className="label-course"> ✦</span>}
      </span>
      {allPlanned ? (
        <span className="label-sub">geplant</span>
      ) : (
        <span className="label-progress">
          <span className="mini-track">
            <span className="mini-fill" style={{ width: `${p}%` }} />
          </span>
          <span className="label-pct">{p} %</span>
        </span>
      )}
    </span>
  );
}

function SystemLabel({ system, selected, onSelect }: { system: StarSystem; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      className={selected ? 'system-label selected' : 'system-label'}
      style={{ left: `${(system.x / W) * 100}%`, top: `${((system.y + 58) / H) * 100}%` }}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <SystemLabelBody system={system} />
    </button>
  );
}

function SystemPanel({ system }: { system: StarSystem }) {
  const { state } = useProgress();
  const ex = exercisesOfSystem(system);
  const p = explored(state, ex);
  const next = nextMission(state, system);
  const firstLesson = system.planets.find((pl) => pl.lessonId)?.lessonId;
  return (
    <aside className="system-panel" aria-label={`System ${system.name}`}>
      <svg viewBox="0 0 360 170" className="panel-art" aria-hidden="true">
        <defs>
          <SystemDefs system={system} idPrefix={`panel-${system.id}`} />
        </defs>
        <rect width="360" height="170" fill="#050816" />
        <Starfield width={360} height={170} count={70} seed={system.y + 3} />
        <SystemArt system={system} idPrefix={`panel-${system.id}`} cx={180} cy={88} scale={1.05} />
      </svg>
      <h2 className="panel-title">{system.name}</h2>
      <p className="panel-sub">
        {system.subtitle}
        {system.course && <span className="badge badge-course">Unterricht</span>}
      </p>
      <p className="panel-meta small">
        {system.planets.length} Planet{system.planets.length === 1 ? '' : 'en'} · {ex.length} Missionen
      </p>
      <ul className="planet-list">
        {system.planets.map((pl, i) => {
          const pex = exercisesOfPlanet(pl);
          const pp = explored(state, pex);
          const body = (
            <>
              <svg viewBox="0 0 40 40" className="planet-icon" aria-hidden="true">
                <defs>
                  <radialGradient id={`pi-${system.id}-${i}`} cx="35%" cy="32%" r="75%">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
                    <stop offset="20%" stopColor={pl.color} />
                    <stop offset="100%" stopColor="#0b0f1e" />
                  </radialGradient>
                </defs>
                <circle cx="20" cy="20" r="16" fill={`url(#pi-${system.id}-${i})`} opacity={pl.planned ? 0.45 : 1} />
              </svg>
              <span className="planet-text">
                <span className="planet-name">{pl.title}</span>
                <span className="planet-missions small">{pl.planned ? 'geplant' : `${pex.length} Missionen · ${pp} % erkundet`}</span>
              </span>
              {!pl.planned && <Icon name="pfeil" size={18} className="planet-chev" />}
            </>
          );
          return (
            <li key={pl.id}>
              {pl.lessonId ? (
                <Link to={`/lektion/${pl.lessonId}`} className="planet-row">
                  {body}
                </Link>
              ) : (
                <div className="planet-row planned">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
      {ex.length > 0 && (
        <>
          <div className="panel-explored">
            <span>Erkundet</span>
            <span className="mini-track wide">
              <span className="mini-fill" style={{ width: `${p}%` }} />
            </span>
            <strong>{p} %</strong>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-launch"
            onClick={() => navigate(next ? `/aufgabe/${next.id}` : `/lektion/${firstLesson}`)}
          >
            <Icon name="play" size={18} /> {p === 0 ? 'Expedition starten' : next ? 'Expedition fortsetzen' : 'System wiederholen'}
          </button>
          {next && (
            <p className="small muted panel-next">
              Nächste Mission: {next.title} ({lessonById.get(next.lessonId)?.title})
            </p>
          )}
        </>
      )}
      {firstLesson && (
        <button type="button" className="btn btn-outline" onClick={() => navigate(`/lektion/${firstLesson}`)}>
          <Icon name="buch" size={18} /> System ansehen
        </button>
      )}
      {ex.length === 0 && <p className="small muted">Dieses System ist noch in Planung.</p>}
      <p className="small muted panel-foot">
        {exercisesOfLesson(firstLesson ?? '').length > 0 && 'Erkundet = Punkte wie im Fortschritt: selbstständig 1, mit Hilfe ½.'}
      </p>
    </aside>
  );
}
