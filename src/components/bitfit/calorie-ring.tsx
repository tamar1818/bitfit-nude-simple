import { useT } from "@/lib/i18n";

interface CalorieRingProps {
  eaten: number;
  goal: number;
  burned?: number;
  size?: number;
}

export function CalorieRing({ eaten, goal, burned = 0, size = 220 }: CalorieRingProps) {
  const t = useT();
  const remaining = Math.max(goal - eaten + burned, 0);
  const ratio = eaten / Math.max(goal, 1);
  const pct = Math.min(ratio, 1);
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;

  // Color meaning: <70% green (on track) · 70-95% amber (closing in) · ≥95% red (over)
  const status =
    ratio >= 0.95 ? "over" : ratio >= 0.7 ? "near" : "ok";
  const ringColor =
    status === "ok" ? "var(--success)" : status === "near" ? "var(--warning)" : "var(--primary)";
  const labelKey = status === "ok" ? "remaining" : status === "near" ? "remaining" : "remaining";
  const numberColor =
    status === "ok" ? "text-[color:var(--success)]" : status === "near" ? "text-[color:var(--warning)]" : "text-primary";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--nude)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${c}`}
          style={{ transition: "stroke-dasharray 600ms ease, stroke 400ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t(labelKey)}
        </div>
        <div className={`font-display text-5xl font-bold ${numberColor}`}>{Math.round(remaining)}</div>
        <div className="text-xs text-muted-foreground">{t("calories")}</div>
      </div>
    </div>
  );
}
