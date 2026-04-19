/**
 * Crisp SVG flag icons (24x16) — vector, no emoji rendering quirks.
 */
export function GeorgianFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 16"
      width="24"
      height="16"
      className={className}
      aria-label="ქართული"
      role="img"
    >
      <rect width="24" height="16" fill="#FFFFFF" />
      {/* Big red cross */}
      <rect x="10" y="0" width="4" height="16" fill="#FF0000" />
      <rect x="0" y="6" width="24" height="4" fill="#FF0000" />
      {/* Four small Bolnisi crosses in the corners */}
      {[
        { x: 4, y: 3 },
        { x: 18, y: 3 },
        { x: 4, y: 11 },
        { x: 18, y: 11 },
      ].map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${p.y})`} fill="#FF0000">
          <rect x="-1.4" y="-0.4" width="2.8" height="0.8" />
          <rect x="-0.4" y="-1.4" width="0.8" height="2.8" />
        </g>
      ))}
      <rect width="24" height="16" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
    </svg>
  );
}

export function UKFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 30"
      width="24"
      height="16"
      className={className}
      aria-label="English"
      role="img"
    >
      <clipPath id="uk-flag-clip">
        <rect width="60" height="30" />
      </clipPath>
      <g clipPath="url(#uk-flag-clip)">
        <rect width="60" height="30" fill="#012169" />
        {/* White diagonals */}
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
        {/* Red diagonals (offset) */}
        <path
          d="M0,0 L60,30 M60,0 L0,30"
          stroke="#C8102E"
          strokeWidth="4"
          clipPath="url(#uk-flag-clip)"
        />
        {/* White cross */}
        <path d="M30,0 v30 M0,15 h60" stroke="#FFFFFF" strokeWidth="10" />
        {/* Red cross */}
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
      <rect width="60" height="30" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
    </svg>
  );
}
