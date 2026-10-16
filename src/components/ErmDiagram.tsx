/**
 * ERM der Lieferdatenbank in Krähenfuß-Notation (Unterricht Tag 2/3).
 * Zwei Striche = genau eins, Krähenfuß = viele. PK unterstrichen, FK mit „FK“ markiert.
 */
type Box = { x: number; y: number; title: string; rows: { name: string; pk?: boolean; fk?: boolean }[]; highlight?: boolean };

const W = 170;
const ROW = 19;
const HEAD = 28;

const BOXES: Record<string, Box> = {
  schiff: { x: 10, y: 10, title: 'Schiff', rows: [{ name: 'schiff_id', pk: true }, { name: 'name' }, { name: 'flagge' }, { name: 'kapitaen' }] },
  station: { x: 10, y: 190, title: 'Station', rows: [{ name: 'station_id', pk: true }, { name: 'name' }, { name: 'region' }] },
  lieferung: {
    x: 270,
    y: 95,
    title: 'Lieferung',
    rows: [{ name: 'lieferung_id', pk: true }, { name: 'ankunft' }, { name: 'schiff_id', fk: true }, { name: 'station_id', fk: true }],
  },
  position: {
    x: 525,
    y: 95,
    title: 'Position',
    highlight: true,
    rows: [{ name: 'lieferung_id', pk: true, fk: true }, { name: 'ware_id', pk: true, fk: true }, { name: 'menge_kisten' }],
  },
  ware: { x: 780, y: 95, title: 'Ware', rows: [{ name: 'ware_id', pk: true }, { name: 'bezeichnung' }, { name: 'einheit' }] },
};

const height = (b: Box) => HEAD + b.rows.length * ROW + 8;

function Entity({ b }: { b: Box }) {
  return (
    <g>
      <rect x={b.x} y={b.y} width={W} height={height(b)} rx={6} className={b.highlight ? 'erm-box erm-box-hl' : 'erm-box'} />
      <rect x={b.x} y={b.y} width={W} height={HEAD} rx={6} className="erm-head" />
      <text x={b.x + W / 2} y={b.y + 19} textAnchor="middle" className="erm-title">
        {b.title}
      </text>
      {b.rows.map((r, i) => (
        <text key={r.name} x={b.x + 10} y={b.y + HEAD + 15 + i * ROW} className="erm-attr" textDecoration={r.pk ? 'underline' : undefined}>
          {r.name}
          {r.fk && <tspan className="erm-fk"> FK</tspan>}
        </text>
      ))}
    </g>
  );
}

/** Zwei Striche (genau eins) an einem Linienende, das nach rechts (+1) oder links (-1) vom Kasten wegführt. */
const one = (x: number, y: number, dir: 1 | -1) => (
  <g className="erm-mark">
    <line x1={x + dir * 8} y1={y - 7} x2={x + dir * 8} y2={y + 7} />
    <line x1={x + dir * 14} y1={y - 7} x2={x + dir * 14} y2={y + 7} />
  </g>
);

/** Krähenfuß (viele) an der Kastenkante x. dir: Richtung, aus der die Linie kommt. */
const many = (x: number, y: number, dir: 1 | -1) => (
  <g className="erm-mark">
    <line x1={x + dir * 14} y1={y} x2={x} y2={y - 8} />
    <line x1={x + dir * 14} y1={y} x2={x} y2={y} />
    <line x1={x + dir * 14} y1={y} x2={x} y2={y + 8} />
  </g>
);

export function ErmDiagram() {
  const { schiff, station, lieferung, position, ware } = BOXES;
  const sR = schiff.x + W;
  const lL = lieferung.x;
  const lR = lieferung.x + W;
  const pL = position.x;
  const pR = position.x + W;
  const wL = ware.x;
  const ySchiff = schiff.y + 45;
  const yStation = station.y + 45;
  const yL1 = lieferung.y + 60;
  const yL2 = lieferung.y + 92;
  const yMid = lieferung.y + 60;
  return (
    <figure className="erm">
      <svg viewBox="0 0 960 300" role="img" aria-labelledby="erm-title erm-desc">
        <title id="erm-title">ERM der Lieferdatenbank</title>
        <desc id="erm-desc">
          Schiff 1 zu n Lieferung, Station 1 zu n Lieferung, Lieferung 1 zu n Position, Ware 1 zu n Position. Position ist die aufgelöste n:m-Beziehung
          zwischen Lieferung und Ware mit dem zusammengesetzten Schlüssel aus lieferung_id und ware_id.
        </desc>
        <path d={`M${sR} ${ySchiff} H220 V${yL1} H${lL}`} className="erm-line" />
        <path d={`M${station.x + W} ${yStation} H220 V${yL2} H${lL}`} className="erm-line" />
        <path d={`M${lR} ${yMid} H${pL}`} className="erm-line" />
        <path d={`M${wL} ${yMid} H${pR}`} className="erm-line" />
        {one(sR, ySchiff, 1)}
        {many(lL, yL1, -1)}
        {one(station.x + W, yStation, 1)}
        {many(lL, yL2, -1)}
        {one(lR, yMid, 1)}
        {many(pL, yMid, -1)}
        {one(wL, yMid, -1)}
        {many(pR, yMid, 1)}
        {Object.values(BOXES).map((b) => (
          <Entity key={b.title} b={b} />
        ))}
        <text x={232} y={ySchiff - 8} className="erm-card">1 : n</text>
        <text x={232} y={yStation + 18} className="erm-card">1 : n</text>
        <text x={lR + 30} y={yMid - 10} className="erm-card">1 : n</text>
        <text x={pR + 30} y={yMid - 10} className="erm-card">n : 1</text>
      </svg>
      <figcaption className="small muted">
        Krähenfuß-Notation: zwei Striche = genau eins, Krähenfuß = viele. Unterstrichen = Primärschlüssel, FK = Fremdschlüssel. Hervorgehoben: Position –
        die aufgelöste n:m-Beziehung zwischen Lieferung und Ware mit dem zusammengesetzten Schlüssel (lieferung_id, ware_id).
      </figcaption>
    </figure>
  );
}
