import { useT } from "@/lib/i18n";
import { Plus, Minus, Droplet } from "lucide-react";
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

  return (
    <div className="rounded-[16px] border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-brand-soft text-primary">
            <Droplet className="h-3.5 w-3.5" />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("water")}
          </span>
        </div>
        <div className="text-[11px] font-medium text-muted-foreground">
          {ml} / {goalMl}ml
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {Array.from({ length: goalGlasses }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-4 flex-1 rounded-sm transition-colors",
              i < glasses ? "bg-primary" : "bg-secondary",
            )}
          />
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, ml - STEP))}
          className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-secondary text-ink hover:bg-brand-soft hover:text-primary"
          aria-label="-"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="font-display text-sm font-bold text-ink">
          {glasses} {t("glass")}
        </span>
        <button
          type="button"
          onClick={() => onChange(ml + STEP)}
          className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-primary text-primary-foreground hover:opacity-90"
          aria-label="+"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
