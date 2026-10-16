import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { exercisesOfLesson, lessonById } from '../content';
import { Icon } from '../components/Icons';
import { Asteroids, PlanetBody, SpaceDefs, Starfield, SystemArt, SystemDefs, SystemPortrait } from '../components/SpaceArt';
import { MAP_H, MAP_W, ROUTE, SYSTEMS, explored, exercisesOfPlanet, exercisesOfSystem, nextMission, previousSystem, systemById, systemOfLesson, type StarSystem } from '../game/galaxy';
import { Link, navigate } from '../lib/router';
import { useProgress } from '../progress/ProgressContext';
import { continueTarget } from '../progress/stats';

const W = MAP_W;
const H = MAP_H;
const MOBILE = '(max-width: 860px)';

/** Weltraum-Rand um die Karte (Karteneinheiten), damit auch Systeme am Rand in die Mitte geschoben werden können */
const M = 650;
const VW = W + 2 * M;
const VH = H + 2 * M;

/** Grundmaßstab der Karte (Pixel je Karteneinheit) bei Zoom 1 */
function baseScale() {
  return window.matchMedia?.(MOBILE).matches ? 0.5 : 0.7;
}

const ASTEROIDS = [
  { x: 84, y: 912, r: 51 },
  { x: 180, y: 1008, r: 24 },
  { x: 48, y: 1212, r: 33 },
  { x: 276, y: 1392, r: 60 },
  { x: 144, y: 1458, r: 39 },
  { x: 744, y: 1422, r: 69 },
  { x: 840, y: 1344, r: 27 },
  { x: 924, y: 1458, r: 45 },
  { x: 1260, y: 1416, r: 54 },
  { x: 1332, y: 1326, r: 21 },
  { x: 1392, y: 1464, r: 33 },
  { x: 732, y: 564, r: 14 },
  { x: 1428, y: 624, r: 12 },
  { x: 48, y: 396, r: 30 },
  { x: 2232, y: 672, r: 36 },
  { x: 2160, y: 1440, r: 51 },
  { x: 1488, y: 168, r: 12 },
];

/** Startseite: Sternenkarte des Lernpfads */
export function StarMapPage() {
  const { state } = useProgress();
  const target = continueTarget(state);
  const here = systemOfLesson(state.lastLessonId) ?? systemOfLesson(target.lessonId) ?? SYSTEMS[0];
  const [selectedId, setSelectedId] = useState(here.id);
  const [zoom, setZoom] = useState(1);
  const [base, setBase] = useState(baseScale);
  const [expanded, setExpanded] = useState(false);
  const selected = systemById.get(selectedId) ?? here;
  const vp = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; sl: number; st: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const scale = base * zoom;

  useEffect(() => setSelectedId(here.id), [here.id]);
  useEffect(() => {
    const on = () => setBase(baseScale());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);

  /** Mitte des freien Kartenbereichs (ohne Seitenleisten, Kopfzeile und Systemkarte) relativ zum Viewport */
  const visibleCenter = (el: HTMLDivElement) => {
    const r = el.getBoundingClientRect();
    const mobile = window.matchMedia?.(MOBILE).matches;
    const rect = (sel: string) => {
      const n = document.querySelector(sel);
      const b = n?.getBoundingClientRect();
      return b && b.width > 0 && b.height > 0 ? b : undefined;
    };
    const nav = mobile ? undefined : rect('.sidenav');
    const top = rect('.topbar');
    const panel = rect('.system-panel');
    let left = r.left;
    let right = r.right;
    let upper = r.top;
    let lower = r.bottom;
    if (nav && nav.right > left && nav.left < left + 60) left = nav.right;
    if (top && top.bottom > upper && top.top <= upper + 5 && mobile) upper = top.bottom;
    if (panel) {
      if (mobile) lower = Math.min(lower, panel.top);
      else right = Math.min(right, panel.left);
    }
    return { x: (left + right) / 2 - r.left, y: (upper + lower) / 2 - r.top };
  };

  // Beim Öffnen auf „Du bist hier“ zentrieren
  useLayoutEffect(() => {
    const center = () => {
      const el = vp.current;
      if (!el) return;
      const c = visibleCenter(el);
      el.scrollLeft = (M + here.x) * scale - c.x;
      el.scrollTop = (M + here.y) * scale - c.y;
    };
    center();
    // nach dem ersten Zeichnen (Seitenleiste/Systemkarte haben dann ihre endgültige Größe) noch einmal
    const id = requestAnimationFrame(center);
    return () => cancelAnimationFrame(id);
  }, [base]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeZoom = (z: number) => {
    const el = vp.current;
    const nz = Math.min(1.6, Math.max(0.5, +z.toFixed(2)));
    if (!el || nz === zoom) return;
    const c = visibleCenter(el);
    const mx = (el.scrollLeft + c.x) / scale;
    const my = (el.scrollTop + c.y) / scale;
    setZoom(nz);
    requestAnimationFrame(() => {
      el.scrollLeft = mx * base * nz - c.x;
      el.scrollTop = my * base * nz - c.y;
    });
  };

  // Mit der Maus ziehen = Karte verschieben (Touch scrollt nativ)
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || !vp.current) return;
    drag.current = { x: e.clientX, y: e.clientY, sl: vp.current.scrollLeft, st: vp.current.scrollTop, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !vp.current) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) > 5) {
      d.moved = true;
      vp.current.classList.add('dragging');
    }
    if (d.moved) {
      vp.current.scrollLeft = d.sl - dx;
      vp.current.scrollTop = d.st - dy;
    }
  };
  const endDrag = () => {
    if (drag.current?.moved) {
      suppressClick.current = true;
      setTimeout(() => (suppressClick.current = false), 0);
    }
    drag.current = null;
    vp.current?.classList.remove('dragging');
  };
  const onClickCapture = (e: React.MouseEvent) => {
    if (suppressClick.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  const select = (s: StarSystem) => {
    setSelectedId(s.id);
    setExpanded(false);
  };
  const openLesson = (lessonId: string) => navigate(`/lektion/${lessonId}`);

  return (
    <div className="starmap-page">
      <SpaceDefs />
      <div
        ref={vp}
        className="starmap-viewport"
        tabIndex={0}
        aria-label="Sternenkarte – mit der Maus ziehen oder mit den Pfeiltasten verschieben"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={onClickCapture}
      >
        <div className="starmap-canvas" style={{ width: VW * scale, height: VH * scale }}>
          <svg viewBox={`${-M} ${-M} ${VW} ${VH}`} className="starmap-svg" role="img" aria-label="Sternenkarte mit den Systemen des Lernpfads">
            <defs>
              <linearGradient id="map-bg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#060a1f" />
                <stop offset="55%" stopColor="#070a1c" />
                <stop offset="100%" stopColor="#03050e" />
              </linearGradient>
              <radialGradient id="map-band">
                <stop offset="0%" stopColor="#c9b8ff" stopOpacity="0.32" />
                <stop offset="35%" stopColor="#8b7bff" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#5a4dff" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="map-band-core">
                <stop offset="0%" stopColor="#ffe3c4" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#ffe3c4" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="map-band-alpha">
                <stop offset="0%" stopColor="#fff" stopOpacity="1" />
                <stop offset="100%" stopColor="#fff" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="map-blue">
                <stop offset="0%" stopColor="#2e7bff" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#2e7bff" stopOpacity="0" />
              </radialGradient>
              <mask id="map-band-mask" maskUnits="userSpaceOnUse" x={-M} y={-M} width={VW} height={VH}>
                <ellipse cx={W / 2} cy={H / 2} rx={VW * 0.6} ry={H * 0.3} fill="url(#map-band-alpha)" transform={`rotate(-27 ${W / 2} ${H / 2})`} />
              </mask>
              <radialGradient id="map-earth-air">
                <stop offset="90%" stopColor="#4fc3ff" stopOpacity="0" />
                <stop offset="95%" stopColor="#6fd6ff" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#6fd6ff" stopOpacity="0" />
              </radialGradient>
              {SYSTEMS.map((s) => (
                <SystemDefs key={s.id} system={s} idPrefix={`map-${s.id}`} />
              ))}
            </defs>

            {/* Hintergrund: Milchstraße mit Nebel und Staubwolken */}
            <rect x={-M} y={-M} width={VW} height={VH} fill="url(#map-bg)" />
            <ellipse cx={W / 2} cy={H / 2} rx={VW * 0.6} ry={H * 0.28} fill="url(#map-band)" transform={`rotate(-27 ${W / 2} ${H / 2})`} />
            <ellipse cx={W * 0.55} cy={H * 0.45} rx={W * 0.32} ry={H * 0.09} fill="url(#map-band-core)" transform={`rotate(-27 ${W / 2} ${H / 2})`} />
            <rect x={-M} y={-M} width={VW} height={VH} filter="url(#sx-nebula)" mask="url(#map-band-mask)" />
            <rect x={-M} y={-M} width={VW} height={VH} filter="url(#sx-dust)" mask="url(#map-band-mask)" opacity="0.8" />
            <ellipse cx={W * 0.82} cy={H * 0.18} rx={360} ry={220} fill="url(#map-blue)" />
            <ellipse cx={W * 0.15} cy={H * 0.3} rx={300} ry={240} fill="url(#map-blue)" />
            <g transform={`translate(${-M} ${-M})`}>
              <Starfield width={VW} height={VH} count={1500} band seed={11} />
            </g>

            {/* Planet im Vordergrund unten links */}
            <g aria-hidden="true">
              <circle cx={-190} cy={H + 620} r={840} fill="url(#map-earth-air)" />
              <circle cx={-190} cy={H + 620} r={790} fill="#1a4f9e" />
              <circle cx={-190} cy={H + 620} r={790} fill="#2f8a5a" filter="url(#sx-bigland)" />
              <circle cx={-190} cy={H + 620} r={790} fill="#fff" filter="url(#sx-bigcloud)" />
              <circle cx={-190} cy={H + 620} r={790} fill="url(#sx-shine)" />
              <circle cx={-190} cy={H + 620} r={790} fill="url(#sx-shade)" opacity="0.9" />
            </g>

            {/* Route */}
            {ROUTE.map(([a, b]) => {
              const s1 = systemById.get(a)!;
              const s2 = systemById.get(b)!;
              const mx = (s1.x + s2.x) / 2 + (s2.y - s1.y) * 0.15;
              const my = (s1.y + s2.y) / 2 - (s2.x - s1.x) * 0.15;
              const d = `M${s1.x} ${s1.y} Q${mx} ${my} ${s2.x} ${s2.y}`;
              return (
                <g key={a + b} aria-hidden="true">
                  <path d={d} className="route-glow" filter="url(#sx-glow-soft)" />
                  <path d={d} className="route" />
                </g>
              );
            })}

            {SYSTEMS.map((s) => (
              <g key={s.id} className="system-hit" onClick={() => select(s)}>
                <ellipse cx={s.x} cy={s.y} rx={250} ry={100} fill="transparent" />
                <SystemArt system={s} idPrefix={`map-${s.id}`} cx={s.x} cy={s.y} highlight={s.id === selected.id} onPlanet={openLesson} />
              </g>
            ))}

            <Asteroids items={ASTEROIDS} seed={5} />

            {/* Raumschiff „Du bist hier“ */}
            <g transform={`translate(${here.x + 195} ${here.y - 70}) rotate(-24) scale(1.3)`} className="ship" aria-hidden="true">
              <path d="M-46 0 L-8 -4 L-8 4 Z" fill="#7fe6ff" opacity="0.7" filter="url(#sx-glow-soft)" />
              <path d="M-30 0 L-8 -2.5 L-8 2.5 Z" fill="#e8fbff" />
              <path d="M-10 -7 L22 -4 Q34 0 22 4 L-10 7 Z" fill="#dfe6f2" />
              <path d="M-10 -7 L22 -4 Q34 0 22 4 L-10 7 Z" fill="url(#sx-shade)" opacity="0.6" />
              <path d="M4 -5 L-6 -18 L12 -5 Z M4 5 L-6 18 L12 5 Z" fill="#aab6cc" />
              <ellipse cx="16" cy="0" rx="5" ry="2.4" fill="#4fb6ff" />
            </g>
          </svg>
          {SYSTEMS.map((s) => (
            <SystemLabel key={s.id} system={s} selected={s.id === selected.id} onSelect={() => select(s)} />
          ))}
          <span className="here-badge" style={{ left: `${((M + here.x + 300) / VW) * 100}%`, top: `${((M + here.y - 118) / VH) * 100}%` }}>
            Du bist hier
          </span>
        </div>
      </div>

      <header className="starmap-head">
        <h1>Deine SQL-Galaxie</h1>
        <p className="starmap-sub">Entdecke Systeme. Erforsche Planeten. Meistere SQL.</p>
      </header>

      <div className="zoom-controls">
        <button type="button" className="zoom-btn" aria-label="Vergrößern" onClick={() => changeZoom(zoom + 0.2)}>
          <Icon name="plus" size={26} />
        </button>
        <button type="button" className="zoom-btn" aria-label="Verkleinern" onClick={() => changeZoom(zoom - 0.2)}>
          <Icon name="minus" size={26} />
        </button>
      </div>

      <div className="map-legend">
        <span>
          <Icon name="schloss" size={18} /> Vorwissen empfohlen
        </span>
        <span>
          <Icon name="funkeln" size={18} className="legend-star" /> Unterricht
        </span>
      </div>

      <SystemPanel system={selected} expanded={expanded} onToggle={() => setExpanded(!expanded)} />
    </div>
  );
}

function SystemLabel({ system, selected, onSelect }: { system: StarSystem; selected: boolean; onSelect: () => void }) {
  const { state } = useProgress();
  const ex = exercisesOfSystem(system);
  const p = explored(state, ex);
  const prev = previousSystem(system.id);
  const recommendPrior = prev && !system.course && explored(state, exercisesOfSystem(prev)) < 50 && p === 0;
  const done = ex.length > 0 && p >= 100;
  const above = system.label === 'oben';
  const top = above ? system.y - 125 : system.y + 108;
  return (
    <button
      type="button"
      className={`system-label${selected ? ' selected' : ''}${above ? ' above' : ''}`}
      style={{ left: `${((M + system.x) / VW) * 100}%`, top: `${((M + top) / VH) * 100}%` }}
      onClick={onSelect}
      aria-pressed={selected}
    >
      {done ? (
        <span className="label-icon label-done" aria-label="vollständig erkundet">
          <Icon name="check" size={16} />
        </span>
      ) : system.icon ? (
        <span className={`label-icon label-${system.icon}`} aria-hidden="true">
          <Icon name={system.icon} size={22} />
        </span>
      ) : null}
      <span className="label-body">
        <span className="label-title">{system.name}</span>
        <span className="label-sub">
          {system.subtitle}
          {system.course && <Icon name="funkeln" size={13} className="label-course" />}
        </span>
        {ex.length > 0 && (p > 0 || selected) && (
          <span className="label-progress">
            <span className="mini-track">
              <span className="mini-fill" style={{ width: `${p}%` }} />
            </span>
            <span className="label-pct">{p} %</span>
          </span>
        )}
        {ex.length === 0 && <span className="label-sub">geplant</span>}
      </span>
      {recommendPrior && (
        <span className="label-lock" title={`Vorwissen empfohlen: erst „${prev!.name}“ erkunden`}>
          <Icon name="schloss" size={15} />
        </span>
      )}
    </button>
  );
}

function SystemPanel({ system, expanded, onToggle }: { system: StarSystem; expanded: boolean; onToggle: () => void }) {
  const { state } = useProgress();
  const ex = exercisesOfSystem(system);
  const p = explored(state, ex);
  const next = nextMission(state, system);
  const firstLesson = system.planets.find((pl) => pl.lessonId)?.lessonId;
  return (
    <aside className={expanded ? 'system-panel expanded' : 'system-panel'} aria-label={`System ${system.name}`}>
      <div className="panel-head">
        <div className="panel-art-wrap">
          <SystemPortrait system={system} idPrefix={`panel-${system.id}`} />
        </div>
        <div className="panel-heading">
          <h2 className="panel-title">{system.name}</h2>
          <p className="panel-sub">
            {system.subtitle}
            {system.course && <Icon name="funkeln" size={16} className="label-course" />}
          </p>
          <p className="panel-meta">
            <Icon name="planeten" size={17} /> {system.planets.length} Planet{system.planets.length === 1 ? '' : 'en'}
            <span aria-hidden="true">·</span> {ex.length} Missionen
          </p>
        </div>
        <button type="button" className="panel-toggle" aria-expanded={expanded} aria-label={expanded ? 'Planeten ausblenden' : 'Planeten anzeigen'} onClick={onToggle}>
          <Icon name="pfeil" size={20} />
        </button>
      </div>

      <ul className="planet-list">
        {system.planets.map((pl, i) => {
          const pex = exercisesOfPlanet(pl);
          const pp = explored(state, pex);
          const body = (
            <>
              <svg viewBox="0 0 44 44" className="planet-icon" aria-hidden="true">
                <PlanetBody x={22} y={22} r={17} color={pl.color} kind={pl.kind === 'ring' ? 'gas' : pl.kind} faded={pl.planned} />
              </svg>
              <span className="planet-text">
                <span className="planet-name">{pl.title}</span>
                <span className="planet-missions">{pl.planned ? 'geplant' : `${pex.length} Missionen${pp > 0 ? ` · ${pp} %` : ''}`}</span>
              </span>
              {!pl.planned && <Icon name="pfeil" size={18} className="planet-chev" />}
            </>
          );
          return (
            <li key={pl.id + i}>
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

      {ex.length > 0 ? (
        <>
          <div className="panel-explored">
            <span className="explored-label">Erkundet</span>
            <span className="explored-row">
              <span className="mini-track wide">
                <span className="mini-fill" style={{ width: `${p}%` }} />
              </span>
              <strong>{p} %</strong>
            </span>
          </div>
          <button type="button" className="btn btn-primary btn-launch" onClick={() => navigate(next ? `/aufgabe/${next.id}` : `/lektion/${firstLesson}`)}>
            <Icon name="play" size={20} /> {p === 0 ? 'Expedition starten' : next ? 'Expedition fortsetzen' : 'System wiederholen'}
          </button>
        </>
      ) : (
        <p className="small muted">Dieses System ist noch in Planung.</p>
      )}
      {firstLesson && (
        <button type="button" className="btn btn-outline btn-view" onClick={() => navigate(`/lektion/${firstLesson}`)}>
          <Icon name="buch" size={20} /> System ansehen
        </button>
      )}
      {next && (
        <p className="panel-next">
          Nächste Mission: {next.title} <span className="muted">({lessonById.get(next.lessonId)?.title})</span>
        </p>
      )}
      {exercisesOfLesson(firstLesson ?? '').length > 0 && <p className="panel-foot">Erkundet = Punkte wie im Fortschritt: selbstständig 1, mit Hilfe ½.</p>}
    </aside>
  );
}
