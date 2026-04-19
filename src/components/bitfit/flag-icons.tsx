/**
 * Crisp circular SVG flag icons — square viewBox so they fit perfectly
 * inside a round badge without stretching or overflowing.
 *
 * Design: render the flag inside a clipped circle, sized 1:1 to its container.
 */

export function GeorgianFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-label="ქართული"
      role="img"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <clipPath id="ge-flag-circle">
          <circle cx="12" cy="12" r="12" />
        </clipPath>
      </defs>
      <g clipPath="url(#ge-flag-circle)">
        <rect width="24" height="24" fill="#FFFFFF" />
        {/* Big red cross — centered on a square */}
        <rect x="10" y="0" width="4" height="24" fill="#FF0000" />
        <rect x="0" y="10" width="24" height="4" fill="#FF0000" />
        {/* Four Bolnisi crosses in each quadrant */}
        {[
          { x: 5, y: 5 },
          { x: 19, y: 5 },
          { x: 5, y: 19 },
          { x: 19, y: 19 },
        ].map((p, i) => (
          <g key={i} transform={`translate(${p.x} ${p.y})`} fill="#FF0000">
            <rect x="-1.6" y="-0.45" width="3.2" height="0.9" />
            <rect x="-0.45" y="-1.6" width="0.9" height="3.2" />
          </g>
        ))}
      </g>
    </svg>
  );
}

export function UKFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 30 30"
      className={className}
      aria-label="English"
      role="img"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <clipPath id="uk-flag-circle">
          <circle cx="15" cy="15" r="15" />
        </clipPath>
      </defs>
      <g clipPath="url(#uk-flag-circle)">
        <rect width="30" height="30" fill="#012169" />
        {/* White diagonals */}
        <path d="M0,0 L30,30 M30,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
        {/* Red diagonals */}
        <path d="M0,0 L30,30 M30,0 L0,30" stroke="#C8102E" strokeWidth="3" />
        {/* White cross */}
        <path d="M15,0 v30 M0,15 h30" stroke="#FFFFFF" strokeWidth="9" />
        {/* Red cross */}
        <path d="M15,0 v30 M0,15 h30" stroke="#C8102E" strokeWidth="5" />
      </g>
    </svg>
  );
}
