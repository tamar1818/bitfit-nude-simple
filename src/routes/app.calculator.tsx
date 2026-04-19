import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calculator, Flame, Activity, Target, Check } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useT } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/bitfit/stat-card";
import { toast } from "sonner";

export const Route = createFileRoute("/app/calculator")({
  component: CalculatorPage,
});

type Gender = "male" | "female";
type Goal = "lose" | "maintain" | "gain";
type Activity = "sedentary" | "light" | "moderate" | "active" | "extra";

const ACTIVITY_MULTIPLIER: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  extra: 1.9,
};

const GOAL_DELTA: Record<Goal, number> = {
  lose: -500,
  maintain: 0,
  gain: 400,
};

interface Result {
  bmr: number;
  tdee: number;
  goalCalories: number;
}

function calc(
  age: number,
  weightKg: number,
  heightCm: number,
  gender: Gender,
  activity: Activity,
  goal: Goal,
): Result {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = gender === "male" ? base + 5 : base - 161;
  const tdee = bmr * ACTIVITY_MULTIPLIER[activity];
  const goalCalories = tdee + GOAL_DELTA[goal];
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    goalCalories: Math.round(goalCalories),
  };
}

function CalculatorPage() {
  const t = useT();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [activity, setActivity] = useState<Activity>("moderate");
  const [goal, setGoal] = useState<Goal>("maintain");
  const [result, setResult] = useState<Result | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: profile }, { data: weights }] = await Promise.all([
        supabase
          .from("profiles")
          .select("age, height_cm, gender, goal")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("weights")
          .select("weight_kg")
          .eq("user_id", user.id)
          .order("recorded_at", { ascending: false })
          .limit(1),
      ]);
      if (profile?.age) setAge(String(profile.age));
      if (profile?.height_cm) setHeight(String(profile.height_cm));
      if (profile?.gender === "male" || profile?.gender === "female") setGender(profile.gender);
      if (profile?.goal === "lose" || profile?.goal === "gain" || profile?.goal === "maintain") {
        setGoal(profile.goal);
      }
      if (weights?.[0]?.weight_kg) setWeight(String(weights[0].weight_kg));
    };
    load().catch((e) => toast.error(e.message));
  }, [user]);

  const onCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const a = Number(age);
    const w = Number(weight);
    const h = Number(height);
    if (!a || !w || !h || a < 10 || a > 120 || w < 25 || w > 400 || h < 100 || h > 250) {
      toast.error("Please enter valid age, weight, and height");
      return;
    }
    setResult(calc(a, w, h, gender, activity, goal));
  };

  const applyGoal = async () => {
    if (!result || !user) return;
    setApplying(true);
    const today = format(new Date(), "yyyy-MM-dd");
    const { data: existing } = await supabase
      .from("daily_logs")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();

    const { error } = existing
      ? await supabase
          .from("daily_logs")
          .update({ calories_goal: result.goalCalories })
          .eq("id", existing.id)
      : await supabase
          .from("daily_logs")
          .insert({ user_id: user.id, date: today, calories_goal: result.goalCalories });

    setApplying(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("goalApplied"));
    navigate({ to: "/app/dashboard" });
  };

  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-lavender">
          <Calculator className="h-5 w-5 text-ink" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{t("calculator")}</h1>
          <p className="text-xs text-muted-foreground">{t("calculatorDesc")}</p>
        </div>
      </header>

      <form onSubmit={onCalculate} className="mt-6 space-y-4">
        <div className="rounded-3xl bg-card p-5 shadow-soft">
          <div className="grid grid-cols-3 gap-3">
            <NumberField label={t("age")} value={age} onChange={setAge} placeholder="25" />
            <NumberField
              label={t("currentWeight")}
              value={weight}
              onChange={setWeight}
              placeholder="70"
            />
            <NumberField label={t("height")} value={height} onChange={setHeight} placeholder="175" />
          </div>

          <div className="mt-5">
            <Label>{t("gender")}</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <SegBtn active={gender === "male"} onClick={() => setGender("male")}>
                {t("male")}
              </SegBtn>
              <SegBtn active={gender === "female"} onClick={() => setGender("female")}>
                {t("female")}
              </SegBtn>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-card p-5 shadow-soft">
          <Label>{t("activityLevel")}</Label>
          <div className="mt-3 space-y-2">
            <ActivityRow
              active={activity === "sedentary"}
              onClick={() => setActivity("sedentary")}
              label={t("sedentary")}
              desc={t("sedentaryDesc")}
              multi="1.2"
            />
            <ActivityRow
              active={activity === "light"}
              onClick={() => setActivity("light")}
              label={t("lightlyActive")}
              desc={t("lightlyActiveDesc")}
              multi="1.375"
            />
            <ActivityRow
              active={activity === "moderate"}
              onClick={() => setActivity("moderate")}
              label={t("moderatelyActive")}
              desc={t("moderatelyActiveDesc")}
              multi="1.55"
            />
            <ActivityRow
              active={activity === "active"}
              onClick={() => setActivity("active")}
              label={t("veryActive")}
              desc={t("veryActiveDesc")}
              multi="1.725"
            />
            <ActivityRow
              active={activity === "extra"}
              onClick={() => setActivity("extra")}
              label={t("extraActive")}
              desc={t("extraActiveDesc")}
              multi="1.9"
            />
          </div>
        </div>

        <div className="rounded-3xl bg-card p-5 shadow-soft">
          <Label>{t("yourGoal")}</Label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <SegBtn active={goal === "lose"} onClick={() => setGoal("lose")}>
              {t("loseWeight")}
            </SegBtn>
            <SegBtn active={goal === "maintain"} onClick={() => setGoal("maintain")}>
              {t("maintainWeight")}
            </SegBtn>
            <SegBtn active={goal === "gain"} onClick={() => setGoal("gain")}>
              {t("gainWeight")}
            </SegBtn>
          </div>
        </div>

        <button
          type="submit"
          className="btn-cta w-full rounded-full bg-ink py-4 text-primary-foreground shadow-card transition-transform active:scale-[0.98]"
        >
          {t("calculate")}
        </button>
      </form>

      {result && (
        <div className="mt-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              tint="lavender"
              icon={<Flame className="h-4 w-4" />}
              label={t("bmr")}
              value={result.bmr.toLocaleString()}
              hint={t("bmrDesc")}
            />
            <StatCard
              tint="peach"
              icon={<Activity className="h-4 w-4" />}
              label={t("tdee")}
              value={result.tdee.toLocaleString()}
              hint={t("tdeeDesc")}
            />
          </div>

          <div className="rounded-3xl bg-ink p-6 text-primary-foreground shadow-card">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 opacity-70" />
              <span className="text-xs font-medium uppercase tracking-wider opacity-70">
                {t("dailyGoal")}
              </span>
            </div>
            <div className="mt-2 font-display text-5xl font-bold">
              {result.goalCalories.toLocaleString()}
              <span className="ml-2 text-base font-medium opacity-60">{t("calories")}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={applyGoal}
            disabled={applying}
            className="btn-cta flex w-full items-center justify-center gap-2 rounded-full bg-lime py-4 text-ink shadow-soft transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            <Check className="h-5 w-5" />
            {t("applyGoal")}
          </button>
        </div>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-2xl bg-nude px-3 py-3 text-center font-display text-lg font-bold text-ink outline-none focus:ring-2 focus:ring-ink/20"
      />
    </label>
  );
}

function SegBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full px-3 py-3 text-sm font-medium transition-all " +
        (active
          ? "bg-ink text-primary-foreground shadow-soft"
          : "bg-nude text-ink hover:bg-nude/70")
      }
    >
      {children}
    </button>
  );
}

function ActivityRow({
  active,
  onClick,
  label,
  desc,
  multi,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  desc: string;
  multi: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all " +
        (active ? "bg-ink text-primary-foreground" : "bg-nude text-ink hover:bg-nude/70")
      }
    >
      <div
        className={
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold " +
          (active ? "bg-primary-foreground text-ink" : "bg-card text-ink")
        }
      >
        {multi}
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold">{label}</div>
        <div className={"text-xs " + (active ? "opacity-70" : "text-muted-foreground")}>
          {desc}
        </div>
      </div>
      {active && <Check className="h-4 w-4" />}
    </button>
  );
}
