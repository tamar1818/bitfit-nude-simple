import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Activity as ActivityIcon,
  Footprints,
  Dumbbell,
  Waves,
  Bike,
  Heart,
  Flame,
  Trophy,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ActivityType =
  | "walk"
  | "run"
  | "gym"
  | "swim"
  | "cycle"
  | "yoga"
  | "hiit"
  | "sport"
  | "other";

interface ActivityRow {
  id: string;
  activity_type: ActivityType;
  label: string | null;
  duration_min: number;
  calories_burned: number;
}

interface Props {
  onChange?: (totalBurned: number) => void;
}

// kcal/min for a 70 kg adult — used as a quick estimate
const KCAL_PER_MIN: Record<ActivityType, number> = {
  walk: 4,
  run: 11,
  gym: 7,
  swim: 9,
  cycle: 8,
  yoga: 3,
  hiit: 12,
  sport: 8,
  other: 5,
};

const ICONS: Record<ActivityType, React.ReactNode> = {
  walk: <Footprints className="h-4 w-4" />,
  run: <Flame className="h-4 w-4" />,
  gym: <Dumbbell className="h-4 w-4" />,
  swim: <Waves className="h-4 w-4" />,
  cycle: <Bike className="h-4 w-4" />,
  yoga: <Heart className="h-4 w-4" />,
  hiit: <ActivityIcon className="h-4 w-4" />,
  sport: <Trophy className="h-4 w-4" />,
  other: <ActivityIcon className="h-4 w-4" />,
};

const TYPES: ActivityType[] = [
  "walk",
  "run",
  "gym",
  "swim",
  "cycle",
  "yoga",
  "hiit",
  "sport",
];

export function ActivityTracker({ onChange }: Props) {
  const { user } = useAuth();
  const t = useT();
  const today = format(new Date(), "yyyy-MM-dd");
  const [items, setItems] = useState<ActivityRow[]>([]);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ActivityType>("walk");
  const [minutes, setMinutes] = useState(30);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("activities")
      .select("id, activity_type, label, duration_min, calories_burned")
      .eq("user_id", user.id)
      .eq("date", today)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    const rows = (data as ActivityRow[]) ?? [];
    setItems(rows);
    onChange?.(rows.reduce((s, a) => s + Number(a.calories_burned), 0));
  };

  useEffect(() => {
    load().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, today]);

  const add = async () => {
    if (!user || minutes <= 0) return;
    setSaving(true);
    const burned = Math.round(KCAL_PER_MIN[type] * minutes);
    const { error } = await supabase.from("activities").insert({
      user_id: user.id,
      activity_type: type,
      duration_min: minutes,
      calories_burned: burned,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`+${burned} kcal`);
    setOpen(false);
    setMinutes(30);
    setType("walk");
    load();
  };

  const remove = async (id: string) => {
    setItems((prev) => prev.filter((a) => a.id !== id));
    await supabase.from("activities").delete().eq("id", id);
    load();
  };

  const total = items.reduce((s, a) => s + Number(a.calories_burned), 0);

  return (
    <div className="rounded-[16px] border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[color:var(--success-soft)] text-[color:var(--success)]">
            <ActivityIcon className="h-4 w-4" />
          </span>
          <div>
            <div className="font-display text-sm font-bold text-ink">{t("activities")}</div>
            <div className="text-[11px] text-muted-foreground">
              {total > 0
                ? `−${Math.round(total)} ${t("calories")}`
                : t("noActivitiesToday")}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-9 items-center gap-1.5 rounded-[10px] bg-[color:var(--success)] px-3 text-xs font-semibold text-white transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{t("addActivity")}</span>
        </button>
      </div>

      {items.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {items.map((a) => (
            <div
              key={a.id}
              className="bf-step-in flex items-center gap-3 rounded-[10px] border border-border bg-background px-3 py-2"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[color:var(--success-soft)] text-[color:var(--success)]">
                {ICONS[a.activity_type]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-ink">
                  {t(`activity_${a.activity_type}` as never)}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {a.duration_min} min · −{Math.round(Number(a.calories_burned))} {t("calories")}
                </div>
              </div>
              <button
                type="button"
                onClick={() => remove(a.id)}
                className="flex h-7 w-7 items-center justify-center rounded-[8px] text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                aria-label={t("delete")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add sheet */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[20px] border border-border bg-card p-5 shadow-float">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-ink">{t("addActivity")}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-secondary text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2">
              {TYPES.map((tp) => (
                <button
                  key={tp}
                  type="button"
                  onClick={() => setType(tp)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-[12px] border px-2 py-2.5 text-[10px] font-semibold transition-all",
                    type === tp
                      ? "border-[color:var(--success)] bg-[color:var(--success-soft)] text-[color:var(--success)]"
                      : "border-border bg-background text-muted-foreground hover:bg-secondary",
                  )}
                >
                  {ICONS[tp]}
                  <span>{t(`activity_${tp}` as never)}</span>
                </button>
              ))}
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("duration")}
              </label>
              <input
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(Math.max(0, Number(e.target.value)))}
                className="mt-1 w-full rounded-[10px] border border-border bg-background px-4 py-3 text-base outline-none focus:border-[color:var(--success)]"
                min={1}
                max={600}
              />
              <div className="mt-2 text-[11px] text-muted-foreground">
                ≈ {Math.round(KCAL_PER_MIN[type] * minutes)} {t("calories")}
              </div>
            </div>

            <button
              type="button"
              onClick={add}
              disabled={saving || minutes <= 0}
              className="mt-5 w-full rounded-[10px] bg-[color:var(--success)] py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? t("loading") : t("add")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
