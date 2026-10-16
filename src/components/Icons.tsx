/** Schlichte Linien-Icons (24 × 24, currentColor) für die Navigation. */
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

const paths: Record<string, JSX.Element> = {
  karte: (
    <>
      <circle cx="5" cy="18" r="1.8" {...P} />
      <circle cx="11" cy="9" r="1.8" {...P} />
      <circle cx="19" cy="5" r="1.8" {...P} />
      <circle cx="17" cy="16" r="1.8" {...P} />
      <path d="M6.3 16.6 9.8 10.5M12.7 8.4 17.3 5.8M12.2 10.4l3.7 4.4" {...P} />
    </>
  ),
  rakete: (
    <>
      <path d="M14 4c3 0 6 3 6 6l-6 6-4-4 4-8Z" {...P} />
      <path d="M10 12 6 13l-2 4 4-1M12 14l-1 4 4-2 1-4" {...P} />
      <circle cx="15.5" cy="8.5" r="1.3" {...P} />
    </>
  ),
  balken: <path d="M5 20V12M10 20V8M15 20v-6M20 20V5M3 20h18" {...P} />,
  pokal: (
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" {...P} />
      <path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4" {...P} />
    </>
  ),
  buch: (
    <>
      <path d="M4 5.5C6.5 4 9.5 4 12 5.5V19c-2.5-1.5-5.5-1.5-8 0V5.5Z" {...P} />
      <path d="M20 5.5C17.5 4 14.5 4 12 5.5V19c2.5-1.5 5.5-1.5 8 0V5.5Z" {...P} />
    </>
  ),
  uebersicht: <path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" {...P} />,
  pfad: <path d="M5 19c4 0 3-6 7-6s3-6 7-6M5 19h.01M19 7h.01" {...P} />,
  station: (
    <>
      <path d="M4 20h16M6 20V10l6-5 6 5v10" {...P} />
      <path d="M10 20v-5h4v5" {...P} />
    </>
  ),
  wiederholen: <path d="M4 12a8 8 0 0 1 13.7-5.6L20 9M20 4v5h-5M20 12a8 8 0 0 1-13.7 5.6L4 15M4 20v-5h5" {...P} />,
  test: <path d="M9 4h6M10 4v4l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 17l-5-9V4M7.5 14h9" {...P} />,
  terminal: <path d="M4 5h16v14H4zM7.5 9.5 10 12l-2.5 2.5M12 15h4" {...P} />,
  daten: <path d="M12 4c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3ZM4 7v10c0 1.7 3.6 3 8 3s8-1.3 8-3V7M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" {...P} />,
  ueben: <path d="M12 3v3M12 18v3M3 12h3M18 12h3M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" {...P} />,
  schloss: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" {...P} />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" {...P} />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" {...P} />,
  minus: <path d="M5 12h14" {...P} />,
  pfeil: <path d="M9 6l6 6-6 6" {...P} />,
  flagge: <path d="M6 21V4M6 4h11l-2.5 4L17 12H6" fill="currentColor" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" />,
  funkeln: <path d="M12 2.5c.6 4.6 2.9 6.9 7.5 7.5-4.6.6-6.9 2.9-7.5 7.5-.6-4.6-2.9-6.9-7.5-7.5 4.6-.6 6.9-2.9 7.5-7.5Z" fill="currentColor" />,
  check: <path d="M6.5 12.5l3.5 3.5 7.5-8" {...P} strokeWidth={2.6} />,
  planeten: (
    <>
      <circle cx="12" cy="12" r="4.5" {...P} />
      <ellipse cx="12" cy="12" rx="10" ry="3.6" transform="rotate(-20 12 12)" {...P} />
    </>
  ),
  play: <path d="M8 5v14l11-7L8 5Z" fill="currentColor" stroke="none" />,
};

export type IconName = keyof typeof paths;

export function Icon({ name, size = 22, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      {paths[name]}
    </svg>
  );
}
