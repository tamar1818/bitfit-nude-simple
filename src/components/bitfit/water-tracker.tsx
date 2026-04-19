import { useT } from "@/lib/i18n";
import { Plus, Minus, GlassWater } from "lucide-react";
import { cn } from "@/lib/utils";

interface WaterTrackerProps {
  ml: number;
  goalMl?: number;
  onChange: (next: number) => void;
}

const STEP = 250;

export function WaterTracker({ ml, goalMl = 2500, onChange }: WaterTrackerProps) {
  const t = useT();
  const glasses = Math.floor(ml / STEP);
  const goalGlasses = Math.ceil(goalMl / STEP);
  const pct = Math.min((ml / goalMl) * 100, 100);

  return (
    <div className="rounded-[16px] border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[color:var(--info-soft)] text-[color:var(--info)]">
            <GlassWater className="h-3.5 w-3.5" />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("water")}
          </span>
        </div>
        <span className="text-[11px] font-medium text-muted-foreground">
          {Math.round(pct)}%
        </span>
      </div>

      <div className="mt-2 font-display text-base font-bold text-ink">
        {ml}
        <span className="ml-1 text-[11px] font-medium text-muted-foreground">
          / {goalMl}ml
        </span>
      </div>

      <div className="mt-1 flex gap-0.5">
        {Array.from({ length: goalGlasses }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 flex-1 rounded-full transition-colors",
              i < glasses ? "bg-[color:var(--info)]" : "bg-secondary",
            )}
          />
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between gap-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, ml - STEP))}
          className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-secondary text-ink transition-colors hover:bg-[color:var(--info-soft)] hover:text-[color:var(--info)] active:scale-95"
          aria-label="-"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="font-display text-xs font-bold text-ink">
          {glasses} {t("glass")}
        </span>
        <button
          type="button"
          onClick={() => onChange(ml + STEP)}
          className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[color:var(--info)] text-white transition-opacity hover:opacity-90 active:scale-95"
          aria-label="+"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
