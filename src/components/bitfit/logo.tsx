import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
  animated?: boolean;
}

/**
 * Bitfit flame mark — geometric flame on warm red field.
 * iOS-style 20% corner radius. SVG so it scales crisply.
 */
export function Logo({ size = 44, showWordmark = false, className, animated = false }: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <svg
        viewBox="0 0 72 72"
        width={size}
        height={size}
        aria-label="Bitfit"
        className="shrink-0"
      >
        <rect width="72" height="72" rx="14" fill="#E85438" />
        <g className={animated ? "bf-flame" : undefined} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
          <path
            d="M36 60C29 60 23 54.5 23 47c0-5 2.5-9 6-12 0 4 2 6 4 6-1-5 2-10 6-14 0 6 3 9 5 11 2-3 2-6 1-9 4 4 6 9 6 14 0 8.5-5.5 17-11 17z"
            fill="#FFFFFF"
          />
          <path
            d="M36 55c-3 0-6-2.5-6-5.5 0-3 1.5-5 4-6.5 0 2.5 1.5 4 3 3.5-0.5 2.5 1.5 4.5 3 4.5s3-2 2.5-4.5c1.5 1.5 2.5 3.5 2.5 5 0 3-4 3-9 3z"
            fill="rgba(255,255,255,0.55)"
          />
        </g>
      </svg>
      {showWordmark && (
        <div className="leading-none">
          <div className="font-display text-2xl font-bold tracking-tight text-ink">bitfit</div>
          <div className="mt-0.5 text-[10px] tracking-[0.3em] text-muted-foreground">ბიტფიტ</div>
        </div>
      )}
    </div>
  );
}
