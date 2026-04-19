import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { useT } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { CalorieRing } from "@/components/bitfit/calorie-ring";
import { StatCard } from "@/components/bitfit/stat-card";

export const Route = createFileRoute("/coach/clients/$id")({
  component: ClientDetail,
});

interface Profile {
  full_name: string | null;
  age: number | null;
  height_cm: number | null;
  goal: string | null;
}

interface Meal {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
}

interface DailyLog {
  water_ml: number;
  steps: number;
  calories_goal: number;
}

function ClientDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const t = useT();
  const today = format(new Date(), "yyyy-MM-dd");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [log, setLog] = useState<DailyLog | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);

  useEffect(() => {
    Promise.all([
      supabase
        .from("profiles")
        .select("full_name, age, height_cm, goal")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("daily_logs")
        .select("water_ml, steps, calories_goal")
        .eq("user_id", id)
        .eq("date", today)
        .maybeSingle(),
      supabase
        .from("meals")
        .select("calories, protein_g, carbs_g, fats_g")
        .eq("user_id", id)
        .eq("date", today),
    ]).then(([p, l, m]) => {
      setProfile(p.data as Profile);
      setLog(l.data as DailyLog);
      setMeals((m.data as Meal[]) ?? []);
    });
  }, [id, today]);

  const totals = meals.reduce(
    (a, m) => ({
      cal: a.cal + Number(m.calories),
    }),
    { cal: 0 },
  );

  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/coach/clients" })}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-soft"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="font-display text-2xl font-bold text-ink">
          {profile?.full_name || "Client"}
        </h1>
      </header>

      <div className="mt-6 rounded-3xl bg-card p-6 shadow-card">
        <div className="flex justify-center">
          <CalorieRing eaten={totals.cal} goal={log?.calories_goal ?? 2000} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatCard tint="sky" label={t("water")} value={`${log?.water_ml ?? 0}ml`} />
        <StatCard tint="mint" label={t("steps")} value={log?.steps ?? 0} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <StatCard tint="nude" label={t("age")} value={profile?.age ?? "—"} />
        <StatCard tint="nude" label="cm" value={profile?.height_cm ?? "—"} />
        <StatCard tint="nude" label={t("goal")} value={profile?.goal ?? "—"} />
      </div>
    </div>
  );
}
