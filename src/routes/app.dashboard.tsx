import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Footprints, Trash2, Plus, Coffee, UtensilsCrossed, Soup, Apple } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useT } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { CalorieRing } from "@/components/bitfit/calorie-ring";
import { WaterTracker } from "@/components/bitfit/water-tracker";
import { MacroBars } from "@/components/bitfit/macro-bars";
import { Logo } from "@/components/bitfit/logo";
import { MealAvatar } from "@/components/bitfit/meal-emoji";
import { MealSuggestions } from "@/components/bitfit/meal-suggestions";
import { ActivityTracker } from "@/components/bitfit/activity-tracker";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/dashboard")({
  component: DashboardPage,
});

type MealType = "breakfast" | "lunch" | "dinner" | "snack";
interface Meal {
  id: string;
  food_name: string;
  meal_type: MealType;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
}
interface DailyLog {
  id: string;
  water_ml: number;
  steps: number;
  calories_goal: number;
}

const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
const MEAL_ICON: Record<MealType, React.ReactNode> = {
  breakfast: <Coffee className="h-4 w-4" />,
  lunch: <UtensilsCrossed className="h-4 w-4" />,
  dinner: <Soup className="h-4 w-4" />,
  snack: <Apple className="h-4 w-4" />,
};

function DashboardPage() {
  const { user } = useAuth();
  const t = useT();
  const navigate = useNavigate();
  const today = format(new Date(), "yyyy-MM-dd");
  const [log, setLog] = useState<DailyLog | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [profileName, setProfileName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [goalKind, setGoalKind] = useState<"lose" | "gain" | "maintain" | null>(null);
  const [stepsInput, setStepsInput] = useState("");

  const loadAll = async () => {
    if (!user) return;
    const [{ data: existing }, { data: m }, { data: p }] = await Promise.all([
      supabase
        .from("daily_logs")
        .select("id, water_ml, steps, calories_goal")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle(),
      supabase
        .from("meals")
        .select("id, food_name, meal_type, calories, protein_g, carbs_g, fats_g")
        .eq("user_id", user.id)
        .eq("date", today)
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("full_name, avatar_url, goal")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

    let current = existing;
    if (!current) {
      const { data: created } = await supabase
        .from("daily_logs")
        .insert({ user_id: user.id, date: today })
        .select("id, water_ml, steps, calories_goal")
        .single();
      current = created ?? null;
    }
    setLog(current);
    setMeals((m as Meal[]) ?? []);
    setProfileName(p?.full_name ?? "");
    setAvatarUrl(p?.avatar_url ?? null);
    setGoalKind((p?.goal as "lose" | "gain" | "maintain" | null) ?? null);
  };

  useEffect(() => {
    loadAll().catch((e) => toast.error(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, today]);

  const updateWater = async (next: number) => {
    if (!log || !user) return;
    setLog({ ...log, water_ml: next });
    await supabase.from("daily_logs").update({ water_ml: next }).eq("id", log.id);
  };

  const updateSteps = async () => {
    if (!log || !user) return;
    const n = parseInt(stepsInput, 10);
    if (isNaN(n) || n < 0) return;
    setLog({ ...log, steps: n });
    setStepsInput("");
    await supabase.from("daily_logs").update({ steps: n }).eq("id", log.id);
  };

  const removeMeal = async (id: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
    await supabase.from("meals").delete().eq("id", id);
  };

  const totals = meals.reduce(
    (acc, m) => ({
      cal: acc.cal + Number(m.calories),
      p: acc.p + Number(m.protein_g),
      c: acc.c + Number(m.carbs_g),
      f: acc.f + Number(m.fats_g),
    }),
    { cal: 0, p: 0, c: 0, f: 0 },
  );

  const grouped = useMemo(() => {
    const g: Record<MealType, Meal[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };
    for (const m of meals) g[m.meal_type].push(m);
    return g;
  }, [meals]);

  const goal = log?.calories_goal ?? 2000;
  const remaining = Math.max(goal - totals.cal, 0);
  const stepsGoal = 10000;
  const stepsPct = Math.min(((log?.steps ?? 0) / stepsGoal) * 100, 100);

  const quickAdd = (type: MealType) => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("bitfit.preselect_meal", type);
    }
    navigate({ to: "/app/scanner" });
  };

  return (
    <div className="mx-auto max-w-md px-5 pt-8 pb-32">
      {/* 1. Header / Profile */}
      <header className="bf-bounce-in flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size={36} />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("today")}
            </p>
            <h1 className="font-display text-xl font-bold text-ink">
              {t("welcome")}, {profileName.split(" ")[0] || "👋"}
            </h1>
          </div>
        </div>
        <Link
          to="/app/settings"
          className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-[10px] border border-border bg-card transition-transform hover:scale-105"
          aria-label={t("settings")}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="font-display text-sm font-bold text-primary">
              {profileName?.[0]?.toUpperCase() ?? "B"}
            </span>
          )}
        </Link>
      </header>

      {/* 2. Hero ring */}
      <div className="bf-bounce-in mt-6 rounded-[16px] border border-border bg-card p-6" style={{ animationDelay: "60ms" }}>
        <div className="flex flex-col items-center">
          <CalorieRing eaten={totals.cal} goal={goal} />
          <div className="mt-4 grid w-full grid-cols-2 gap-3 text-center">
            <div className="rounded-[12px] bg-brand-soft p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">{t("eaten")}</div>
              <div className="font-display text-xl font-bold text-ink">{Math.round(totals.cal)}</div>
            </div>
            <div className="rounded-[12px] bg-secondary p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("goal")}</div>
              <div className="font-display text-xl font-bold text-ink">{goal}</div>
            </div>
          </div>
          <div className="mt-4 w-full">
            <MacroBars protein={totals.p} carbs={totals.c} fats={totals.f} />
          </div>
        </div>
      </div>

      {/* 3. MEALS — second position with quick-add */}
      <section className="bf-bounce-in mt-6" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink">{t("meals")}</h2>
          <Link
            to="/app/scanner"
            className="flex items-center gap-1.5 rounded-[10px] bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-transform hover:scale-105 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="btn-cta">{t("addMeal")}</span>
          </Link>
        </div>

        {/* Quick-add buttons: breakfast / lunch / dinner / + */}
        <div className="mt-3 grid grid-cols-4 gap-2">
          {(["breakfast", "lunch", "dinner"] as MealType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => quickAdd(type)}
              className="group flex flex-col items-center gap-1.5 rounded-[12px] border border-border bg-card p-3 transition-all hover:border-primary hover:bg-brand-soft active:scale-95"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-brand-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                {MEAL_ICON[type]}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-ink">
                {t(type)}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => quickAdd("snack")}
            className="flex flex-col items-center justify-center gap-1.5 rounded-[12px] border-2 border-dashed border-primary/40 bg-brand-soft p-3 text-primary transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground active:scale-95"
            aria-label={t("addMeal")}
          >
            <Plus className="h-5 w-5" />
            <span className="text-[10px] font-semibold uppercase tracking-wide">
              {t("snack")}
            </span>
          </button>
        </div>

        {meals.length === 0 ? (
          <div className="mt-3 rounded-[12px] border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            {t("noMealsToday")}
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {MEAL_ORDER.map((type) => {
              const list = grouped[type];
              if (list.length === 0) return null;
              const sectionCal = list.reduce((s, m) => s + Number(m.calories), 0);
              return (
                <div key={type} className="rounded-[16px] border border-border bg-card p-3">
                  <div className="mb-2 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2 text-ink">
                      <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-brand-soft text-primary">
                        {MEAL_ICON[type]}
                      </span>
                      <span className="font-display text-sm font-semibold">{t(type)}</span>
                    </div>
                    <span className="text-xs font-semibold text-primary">
                      {Math.round(sectionCal)} {t("calories")}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {list.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 rounded-[10px] px-2 py-2 transition-colors hover:bg-secondary"
                      >
                        <MealAvatar name={m.food_name} size={40} />
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-sm font-medium text-ink">{m.food_name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {Math.round(Number(m.calories))} {t("calories")} · P{Math.round(Number(m.protein_g))} C{Math.round(Number(m.carbs_g))} F{Math.round(Number(m.fats_g))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMeal(m.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-[8px] text-muted-foreground transition-colors hover:bg-background hover:text-destructive"
                          aria-label={t("delete")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. AI suggestions */}
      <div className="bf-bounce-in mt-6" style={{ animationDelay: "140ms" }}>
        <MealSuggestions remainingCalories={remaining} goal={goalKind} onLogged={loadAll} />
      </div>

      {/* 5. Compact water + steps row */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        {log && <WaterTracker ml={log.water_ml} onChange={updateWater} />}
        <div className="rounded-[16px] border border-border bg-card p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-brand-soft text-primary">
                <Footprints className="h-3.5 w-3.5" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("steps")}
              </span>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground">
              {Math.round(stepsPct)}%
            </span>
          </div>
          <div className="mt-2 font-display text-base font-bold text-ink">
            {(log?.steps ?? 0).toLocaleString()}
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className={cn("h-full bg-primary transition-all duration-500")}
              style={{ width: `${stepsPct}%` }}
            />
          </div>
          <div className="mt-2 flex gap-1.5">
            <input
              type="number"
              value={stepsInput}
              onChange={(e) => setStepsInput(e.target.value)}
              placeholder="0"
              className="w-full min-w-0 rounded-[8px] bg-secondary px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={updateSteps}
              className="rounded-[8px] bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              {t("save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
