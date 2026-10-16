import type { Planet, PlanetKind, StarSystem } from '../game/galaxy';

/** Deterministischer Pseudozufall, damit der Sternenhimmel bei jedem Laden gleich aussieht. */
export function seeded(seed: number) {
  let s = Math.max(1, Math.floor(seed)) % 2147483647;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Gemeinsame Filter und Verläufe (Oberflächen-Texturen, Schattierung, Leuchten).
 * Einmal pro Seite in einem unsichtbaren, aber nicht ausgeblendeten SVG einbinden.
 */
export function SpaceDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        {/* Schatten der Nachtseite + Glanzlicht – gelten für jeden Kreis (objectBoundingBox) */}
        <radialGradient id="sx-shade" cx="32%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#000" stopOpacity="0" />
          <stop offset="55%" stopColor="#000" stopOpacity="0.15" />
          <stop offset="85%" stopColor="#000" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.85" />
        </radialGradient>
        <radialGradient id="sx-shine" cx="33%" cy="28%" r="45%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sx-sun-core" cx="45%" cy="42%" r="60%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="35%" stopColor="#fff6c8" />
          <stop offset="100%" stopColor="#fff6c8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sx-progress" x1="0" x2="1">
          <stop offset="0%" stopColor="#2fb8ff" />
          <stop offset="100%" stopColor="#5ff0ff" />
        </linearGradient>

        {/* Oberflächen: schwarze Flecken mit variabler Deckkraft, auf die Kreisform begrenzt */}
        <filter id="sx-rock" x="0" y="0" width="1" height="1">
          <feTurbulence type="fractalNoise" baseFrequency="0.16" numOctaves="3" seed="4" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.2 0 0 0 -0.75" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <filter id="sx-gas" x="0" y="0" width="1" height="1">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.2" numOctaves="3" seed="9" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.6 0 0 0 -0.95" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <filter id="sx-gas-light" x="0" y="0" width="1" height="1">
          <feTurbulence type="fractalNoise" baseFrequency="0.01 0.16" numOctaves="2" seed="21" />
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.95  0 0 0 0 0.85  0 2.4 0 0 -1.1" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <filter id="sx-land" x="0" y="0" width="1" height="1">
          <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="4" seed="2" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.3  0 0 0 0 0.6  0 0 0 0 0.3  8 0 0 0 -4.1" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <filter id="sx-cloud" x="0" y="0" width="1" height="1">
          <feTurbulence type="fractalNoise" baseFrequency="0.05 0.11" numOctaves="3" seed="13" />
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 4 0 0 -2.3" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <filter id="sx-bigland" x="0" y="0" width="1" height="1">
          <feTurbulence type="fractalNoise" baseFrequency="0.004 0.007" numOctaves="5" seed="8" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.18  0 0 0 0 0.45  0 0 0 0 0.3  7 0 0 0 -3.7" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <filter id="sx-bigcloud" x="0" y="0" width="1" height="1">
          <feTurbulence type="fractalNoise" baseFrequency="0.005 0.012" numOctaves="5" seed="3" />
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 3 0 0 -1.55" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <filter id="sx-sun" x="0" y="0" width="1" height="1">
          <feTurbulence type="fractalNoise" baseFrequency="0.2" numOctaves="3" seed="7" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.75  0 0 0 0 0.25  0 0 0 0 0  2.4 0 0 0 -0.9" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <filter id="sx-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id="sx-glow-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <filter id="sx-nebula" x="0" y="0" width="1" height="1">
          <feTurbulence type="fractalNoise" baseFrequency="0.0035 0.009" numOctaves="5" seed="5" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.62  0 0 0 0 0.55  0 0 0 0 1  2.3 0 0 0 -0.95" />
        </filter>
        <filter id="sx-dust" x="0" y="0" width="1" height="1">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.02" numOctaves="4" seed="11" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.02  0 0 0 0 0.02  0 0 0 0 0.06  0 0 2.6 0 -1.25" />
        </filter>
      </defs>
    </svg>
  );
}

/** Sternenhimmel; mit band: Sterne verdichten sich entlang der Milchstraße (Diagonale). */
export function Starfield({ width, height, count, seed = 7, band = false }: { width: number; height: number; count: number; seed?: number; band?: boolean }) {
  const rnd = seeded(seed);
  const stars = Array.from({ length: count }, () => {
    let x = rnd() * width;
    let y = rnd() * height;
    if (band && rnd() < 0.55) {
      // Punkt nahe der Diagonale von unten links nach oben rechts
      const t = rnd();
      const off = (rnd() - 0.5) * (rnd() * height * 0.35);
      x = t * width + off * 0.4;
      y = height * 0.95 - t * height * 0.9 + off;
    }
    const big = rnd() > 0.965;
    return { x, y, r: big ? rnd() * 1.3 + 1.1 : rnd() * 0.85 + 0.25, o: rnd() * 0.6 + 0.35, big, warm: rnd() > 0.8 };
  });
  return (
    <g aria-hidden="true">
      {stars.map((s, i) =>
        s.big ? (
          <g key={i} opacity={s.o}>
            <circle cx={s.x} cy={s.y} r={s.r * 2.6} fill="#cfe2ff" opacity="0.25" />
            <circle cx={s.x} cy={s.y} r={s.r} fill="#fff" />
            <path d={`M${s.x - s.r * 5} ${s.y}H${s.x + s.r * 5}M${s.x} ${s.y - s.r * 5}V${s.y + s.r * 5}`} stroke="#fff" strokeWidth="0.6" opacity="0.6" />
          </g>
        ) : (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={s.warm ? '#ffe8c8' : '#fff'} opacity={s.o} />
        ),
      )}
    </g>
  );
}

/** Unregelmäßiger Asteroid */
function asteroidPath(cx: number, cy: number, r: number, rnd: () => number) {
  const n = 9;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.7 + rnd() * 0.45);
    return `${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr * 0.85).toFixed(1)}`;
  });
  return `M${pts.join('L')}Z`;
}

export function Asteroids({ items, seed }: { items: { x: number; y: number; r: number }[]; seed: number }) {
  const rnd = seeded(seed);
  return (
    <g aria-hidden="true">
      {items.map((a, i) => {
        const d = asteroidPath(a.x, a.y, a.r, rnd);
        return (
          <g key={i}>
            <path d={d} fill="#2b2a33" />
            <path d={d} fill="#6b6575" filter="url(#sx-rock)" opacity="0.9" />
            <path d={d} fill="url(#sx-shade)" />
            <path d={asteroidPath(a.x - a.r * 0.15, a.y - a.r * 0.2, a.r * 0.45, rnd)} fill="#8a8494" opacity="0.18" />
          </g>
        );
      })}
    </g>
  );
}

/** Ein Planet mit Oberfläche, Schatten, Atmosphäre und ggf. Ring */
export function PlanetBody({ x, y, r, color, kind, faded }: { x: number; y: number; r: number; color: string; kind: PlanetKind; faded?: boolean }) {
  const ring = kind === 'ring';
  const rx = r * 2.15;
  const ry = r * 0.55;
  return (
    <g opacity={faded ? 0.45 : 1}>
      {ring && <ellipse cx={x} cy={y} rx={rx} ry={ry} transform={`rotate(-14 ${x} ${y})`} fill="none" stroke="#e7d6b8" strokeOpacity="0.55" strokeWidth={r * 0.28} />}
      {(kind === 'erde' || kind === 'eis') && <circle cx={x} cy={y} r={r * 1.12} fill={kind === 'erde' ? '#6fb8ff' : '#bfe6ff'} opacity="0.28" filter="url(#sx-glow-soft)" />}
      <circle cx={x} cy={y} r={r} fill={color} />
      {kind === 'fels' && <circle cx={x} cy={y} r={r} fill="#000" filter="url(#sx-rock)" opacity="0.55" />}
      {(kind === 'gas' || kind === 'ring') && (
        <>
          <circle cx={x} cy={y} r={r} fill="#000" filter="url(#sx-gas)" opacity="0.45" />
          <circle cx={x} cy={y} r={r} fill="#fff" filter="url(#sx-gas-light)" opacity="0.22" />
        </>
      )}
      {kind === 'erde' && (
        <>
          <circle cx={x} cy={y} r={r} fill="#fff" filter="url(#sx-land)" />
          <circle cx={x} cy={y} r={r} fill="#fff" filter="url(#sx-cloud)" opacity="0.75" />
        </>
      )}
      {kind === 'eis' && <circle cx={x} cy={y} r={r} fill="#fff" filter="url(#sx-cloud)" opacity="0.45" />}
      <circle cx={x} cy={y} r={r} fill="url(#sx-shine)" />
      <circle cx={x} cy={y} r={r} fill="url(#sx-shade)" />
      {ring && (
        <path
          d={`M${x - rx} ${y} A${rx} ${ry} 0 0 0 ${x + rx} ${y}`}
          transform={`rotate(-14 ${x} ${y})`}
          fill="none"
          stroke="#f1e2c6"
          strokeOpacity="0.75"
          strokeWidth={r * 0.28}
        />
      )}
    </g>
  );
}

/** Leuchtender Stern mit Korona und Oberflächenstruktur */
export function Sun({ x, y, r, color, glowId }: { x: number; y: number; r: number; color: string; glowId: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r * 4.2} fill={`url(#${glowId})`} />
      <circle cx={x} cy={y} r={r * 1.25} fill={color} opacity="0.7" filter="url(#sx-glow)" />
      <circle cx={x} cy={y} r={r} fill={color} />
      <circle cx={x} cy={y} r={r} fill="#000" filter="url(#sx-sun)" opacity="0.55" />
      <circle cx={x} cy={y} r={r} fill="url(#sx-sun-core)" opacity="0.85" />
    </g>
  );
}

/** System-spezifischer Leuchtverlauf (einmal pro SVG, eindeutiges Präfix) */
export function SystemDefs({ system, idPrefix }: { system: StarSystem; idPrefix: string }) {
  return (
    <radialGradient id={`${idPrefix}-glow`}>
      <stop offset="0%" stopColor={system.star} stopOpacity="0.6" />
      <stop offset="22%" stopColor={system.star} stopOpacity="0.22" />
      <stop offset="60%" stopColor={system.star} stopOpacity="0.06" />
      <stop offset="100%" stopColor={system.star} stopOpacity="0" />
    </radialGradient>
  );
}

export const ORBITS = [
  { rx: 105, ry: 39 },
  { rx: 155, ry: 57 },
  { rx: 205, ry: 76 },
];

/** Position eines Planeten auf seiner Umlaufbahn */
function planetPos(system: StarSystem, i: number, cx: number, cy: number, scale: number) {
  const n = system.planets.length;
  const o = ORBITS[i % ORBITS.length];
  const angle = (i / Math.max(n, 1)) * Math.PI * 2 + 0.35 + (i % 2) * 0.55 + system.x * 0.001;
  return { x: cx + Math.cos(angle) * o.rx * scale, y: cy + Math.sin(angle) * o.ry * scale };
}

export function planetRadius(p: Planet, i: number) {
  if (p.planned) return 12;
  return p.kind === 'gas' || p.kind === 'ring' ? 25 + (i % 2) * 4 : 17 + ((i * 5) % 7);
}

/**
 * Ein Sternsystem: Umlaufbahnen, Asteroidengürtel, leuchtender Stern, Planeten (= Lektionen).
 * onPlanet: Klick auf einen Planeten (öffnet die Lektion).
 */
export function SystemArt({
  system,
  idPrefix,
  cx,
  cy,
  scale = 1,
  highlight,
  onPlanet,
}: {
  system: StarSystem;
  idPrefix: string;
  cx: number;
  cy: number;
  scale?: number;
  highlight?: boolean;
  onPlanet?: (lessonId: string) => void;
}) {
  const rnd = seeded(system.x * 7 + system.y);
  const belt = Array.from({ length: 90 }, () => {
    const a = rnd() * Math.PI * 2;
    const k = 1.12 + rnd() * 0.16;
    return { x: cx + Math.cos(a) * ORBITS[2].rx * k * scale, y: cy + Math.sin(a) * ORBITS[2].ry * k * scale, r: (rnd() * 1.4 + 0.4) * scale, o: rnd() * 0.5 + 0.3 };
  });
  const planets = system.planets.map((p, i) => ({ p, i, ...planetPos(system, i, cx, cy, scale), r: planetRadius(p, i) * scale }));
  // Planeten hinter dem Stern (obere Hälfte) zuerst zeichnen
  const back = planets.filter((pl) => pl.y < cy);
  const front = planets.filter((pl) => pl.y >= cy);
  const drawPlanet = ({ p, x, y, r }: (typeof planets)[number]) => {
    const clickable = !!(onPlanet && p.lessonId);
    return (
      <g
        key={p.id}
        className={clickable ? 'planet planet-link' : 'planet'}
        onClick={
          clickable
            ? (e) => {
                e.stopPropagation();
                onPlanet!(p.lessonId!);
              }
            : undefined
        }
      >
        <title>{p.planned ? `${p.title} (geplant)` : p.title}</title>
        {clickable && <circle cx={x} cy={y} r={r + 6 * scale} fill="transparent" />}
        <PlanetBody x={x} y={y} r={r} color={p.color} kind={p.kind} faded={p.planned} />
      </g>
    );
  };
  return (
    <g>
      {highlight && (
        <>
          <ellipse cx={cx} cy={cy} rx={252 * scale} ry={97 * scale} fill="rgba(40,160,255,0.06)" stroke="#36d0ff" strokeWidth={7 * scale} opacity="0.55" filter="url(#sx-glow)" />
          <ellipse cx={cx} cy={cy} rx={252 * scale} ry={97 * scale} fill="none" stroke="#7fe6ff" strokeWidth={2 * scale} />
        </>
      )}
      {ORBITS.map((o, i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={o.rx * scale} ry={o.ry * scale} className="orbit" />
      ))}
      <g aria-hidden="true">
        {belt.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r={b.r} fill="#c9c2d6" opacity={b.o} />
        ))}
      </g>
      {back.map(drawPlanet)}
      <Sun x={cx} y={cy} r={36 * scale} color={system.star} glowId={`${idPrefix}-glow`} />
      {front.map(drawPlanet)}
    </g>
  );
}

/** Nahaufnahme eines Systems für die Seitenleiste: großer Stern, zwei große Planeten */
export function SystemPortrait({ system, idPrefix, width = 360, height = 180 }: { system: StarSystem; idPrefix: string; width?: number; height?: number }) {
  const [a, b] = system.planets;
  const c = system.planets[2];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="panel-art" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <SystemDefs system={system} idPrefix={idPrefix} />
        <linearGradient id={`${idPrefix}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0b1030" />
          <stop offset="100%" stopColor="#03050f" />
        </linearGradient>
      </defs>
      <rect width={width} height={height} fill={`url(#${idPrefix}-bg)`} />
      <rect width={width} height={height} filter="url(#sx-nebula)" opacity="0.5" />
      <Starfield width={width} height={height} count={90} seed={system.y + 3} />
      <Sun x={width * 0.56} y={height * 0.36} r={height * 0.2} color={system.star} glowId={`${idPrefix}-glow`} />
      {c && <PlanetBody x={width * 0.22} y={height * 0.2} r={height * 0.07} color={c.color} kind={c.kind === 'ring' ? 'gas' : c.kind} />}
      {b && <PlanetBody x={width * 0.88} y={height * 0.62} r={height * 0.23} color={b.color} kind={b.kind === 'ring' ? 'gas' : b.kind} />}
      {a && <PlanetBody x={width * 0.18} y={height * 0.78} r={height * 0.28} color={a.color} kind={a.kind === 'ring' ? 'gas' : a.kind} />}
      <circle cx={width * 0.36} cy={height * 0.58} r={height * 0.035} fill="#9aa4c8" />
      <circle cx={width * 0.36} cy={height * 0.58} r={height * 0.035} fill="url(#sx-shade)" />
    </svg>
  );
}
