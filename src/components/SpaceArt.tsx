import type { StarSystem } from '../game/galaxy';

/** Deterministischer Pseudozufall, damit der Sternenhimmel bei jedem Laden gleich aussieht. */
export function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Sternenhimmel als SVG-Punkte */
export function Starfield({ width, height, count, seed = 7 }: { width: number; height: number; count: number; seed?: number }) {
  const rnd = seeded(seed);
  const stars = Array.from({ length: count }, () => ({ x: rnd() * width, y: rnd() * height, r: rnd() < 0.92 ? rnd() * 0.9 + 0.3 : rnd() * 1.4 + 1, o: rnd() * 0.6 + 0.3 }));
  return (
    <g aria-hidden="true">
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={s.o} />
      ))}
    </g>
  );
}

/** Farbverläufe für Stern und Planeten eines Systems (einmal pro SVG einbinden). */
export function SystemDefs({ system, idPrefix }: { system: StarSystem; idPrefix: string }) {
  return (
    <>
      <radialGradient id={`${idPrefix}-star`} cx="40%" cy="38%" r="65%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="35%" stopColor={system.star} />
        <stop offset="100%" stopColor={system.star} stopOpacity="0.65" />
      </radialGradient>
      <radialGradient id={`${idPrefix}-glow`}>
        <stop offset="0%" stopColor={system.star} stopOpacity="0.55" />
        <stop offset="45%" stopColor={system.star} stopOpacity="0.18" />
        <stop offset="100%" stopColor={system.star} stopOpacity="0" />
      </radialGradient>
      {system.planets.map((p, i) => (
        <radialGradient key={p.id} id={`${idPrefix}-p${i}`} cx="35%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="18%" stopColor={p.color} />
          <stop offset="100%" stopColor="#0b0f1e" />
        </radialGradient>
      ))}
    </>
  );
}

/**
 * Ein Sternsystem: Umlaufbahnen, leuchtender Stern, Planeten (= Module).
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
  const n = system.planets.length;
  const orbits = [
    { rx: 78 * scale, ry: 28 * scale },
    { rx: 118 * scale, ry: 42 * scale },
    { rx: 150 * scale, ry: 54 * scale },
  ];
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={170 * scale} ry={62 * scale} className={highlight ? 'orbit-ring orbit-ring-active' : 'orbit-ring'} />
      {orbits.map((o, i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={o.rx} ry={o.ry} className="orbit" />
      ))}
      <circle cx={cx} cy={cy} r={64 * scale} fill={`url(#${idPrefix}-glow)`} />
      <circle cx={cx} cy={cy} r={22 * scale} fill={`url(#${idPrefix}-star)`} className="star-core" />
      {system.planets.map((p, i) => {
        const o = orbits[i % orbits.length];
        const angle = (i / Math.max(n, 1)) * Math.PI * 2 + 0.6 + (i % 2) * 0.5;
        const px = cx + Math.cos(angle) * o.rx;
        const py = cy + Math.sin(angle) * o.ry;
        const r = (p.planned ? 7 : 9 + ((i * 3) % 6)) * scale;
        const clickable = !!(onPlanet && p.lessonId);
        return (
          <g
            key={p.id}
            className={clickable ? 'planet planet-link' : 'planet'}
            opacity={p.planned ? 0.45 : 1}
            onClick={clickable ? () => onPlanet!(p.lessonId!) : undefined}
          >
            <title>{p.planned ? `${p.title} (geplant)` : p.title}</title>
            <circle cx={px} cy={py} r={r} fill={`url(#${idPrefix}-p${i})`} />
            {i % 3 === 2 && !p.planned && <ellipse cx={px} cy={py} rx={r * 1.7} ry={r * 0.45} className="planet-ring" />}
          </g>
        );
      })}
    </g>
  );
}
