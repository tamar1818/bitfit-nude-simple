import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Minus,
  Check,
  Armchair,
  Bike,
  Dumbbell,
  Flame,
  HeartPulse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/bitfit/logo";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

type Goal = "lose" | "gain" | "maintain";
type Gender = "male" | "female" | "other";
type Activity = "sedentary" | "light" | "moderate" | "active" | "extra";

const ACTIVITY_MULT: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  extra: 1.9,
};
const GOAL_DELTA: Record<Goal, number> = { lose: -500, maintain: 0, gain: 400 };

function calcCalories(args: {
  age: number;
  weightKg: number;
  heightCm: number;
  gender: Gender;
  activity: Activity;
  goal: Goal;
}) {
  const { age, weightKg, heightCm, gender, activity, goal } = args;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = gender === "male" ? base + 5 : base - 161; // "other" treated as female-leaning baseline
  const tdee = bmr * ACTIVITY_MULT[activity];
  return Math.round(tdee + GOAL_DELTA[goal]);
}

function OnboardingPage() {
  const t = useT();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [target, setTarget] = useState("");
  const [invite, setInvite] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const totalSteps = 5;

  const canNext = () => {
    if (step === 0) return !!goal;
    if (step === 1) return age.length > 0 && !!gender;
    if (step === 2) return height.length > 0 && weight.length > 0 && target.length > 0;
    if (step === 3) return !!activity;
    return true;
  };

  const calorieGoal = useMemo(() => {
    if (!goal || !gender || !activity) return null;
    const ageN = parseInt(age, 10);
    const hN = parseFloat(height);
    const wN = parseFloat(weight);
    if (!ageN || !hN || !wN) return null;
    return calcCalories({ age: ageN, weightKg: wN, heightCm: hN, gender, activity, goal });
  }, [age, height, weight, gender, activity, goal]);

  const finish = async () => {
    if (!user || !goal || !gender || !activity) return;
    setSubmitting(true);
    try {
      const ageN = parseInt(age, 10);
      const hN = parseFloat(height);
      const wN = parseFloat(weight);
      const tN = parseFloat(target);

      const { error: pErr } = await supabase
        .from("profiles")
        .update({
          goal,
          age: ageN,
          gender,
          height_cm: hN,
          activity_level: activity,
          onboarded: true,
        })
        .eq("id", user.id);
      if (pErr) throw pErr;

      const { error: wErr } = await supabase.from("weights").insert({
        user_id: user.id,
        weight_kg: wN,
        target_weight_kg: tN,
      });
      if (wErr) throw wErr;

      const computed = calcCalories({
        age: ageN, weightKg: wN, heightCm: hN, gender, activity, goal,
      });

      // Upsert today's daily log with auto-calculated calorie goal
      const today = new Date().toISOString().slice(0, 10);
      const { data: existing } = await supabase
        .from("daily_logs")
        .select("id")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("daily_logs")
          .update({ calories_goal: computed })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("daily_logs")
          .insert({ user_id: user.id, date: today, calories_goal: computed });
      }

      if (invite.trim()) {
        const { error: iErr } = await supabase.rpc("redeem_coach_invite", {
          _code: invite.trim(),
        });
        if (iErr) toast.error(`Invite: ${iErr.message}`);
      }

      navigate({ to: "/app/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-5 pb-10 pt-8">
      <div className="mx-auto flex min-h-screen max-w-md flex-col">
        {/* Header: back + logo + progress */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => (step > 0 ? setStep(step - 1) : navigate({ to: "/auth" }))}
            className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-border bg-card"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4 text-ink" />
          </button>
          <Logo size={32} />
          <div className="ml-auto text-xs font-medium text-muted-foreground">
            {t("stepOf")} {step + 1}/{totalSteps}
          </div>
        </div>

        <div className="mt-3 flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                i <= step ? "bg-primary" : "bg-border",
              )}
            />
          ))}
        </div>

        <div key={step} className="bf-step-in mt-10 flex-1">
          {step === 0 && (
            <>
              <h2 className="font-display text-3xl font-bold text-ink text-balance">
                {t("yourGoal")}
              </h2>
              <div className="mt-8 space-y-3">
                <SelectCard
                  selected={goal === "lose"}
                  onClick={() => setGoal("lose")}
                  icon={<TrendingDown className="h-5 w-5" />}
                  label={t("loseWeight")}
                />
                <SelectCard
                  selected={goal === "maintain"}
                  onClick={() => setGoal("maintain")}
                  icon={<Minus className="h-5 w-5" />}
                  label={t("maintainWeight")}
                />
                <SelectCard
                  selected={goal === "gain"}
                  onClick={() => setGoal("gain")}
                  icon={<TrendingUp className="h-5 w-5" />}
                  label={t("gainWeight")}
                />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="font-display text-3xl font-bold text-ink">{t("aboutYou")}</h2>
              <div className="mt-8 space-y-5">
                <Field label={t("gender")}>
                  <div className="grid grid-cols-3 gap-3">
                    <GenderPick
                      active={gender === "female"}
                      onClick={() => setGender("female")}
                      label={t("female")}
                      icon={<FemaleIcon />}
                    />
                    <GenderPick
                      active={gender === "male"}
                      onClick={() => setGender("male")}
                      label={t("male")}
                      icon={<MaleIcon />}
                    />
                    <GenderPick
                      active={gender === "other"}
                      onClick={() => setGender("other")}
                      label={t("other")}
                      icon={<OtherIcon />}
                    />
                  </div>
                </Field>
                <Field label={t("age")}>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    min={1}
                    max={120}
                    className="w-full rounded-[10px] border border-border bg-card px-4 py-3.5 text-base outline-none transition-colors focus:border-primary"
                  />
                </Field>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-display text-3xl font-bold text-ink">{t("bodyMetrics")}</h2>
              <div className="mt-8 space-y-4">
                <Field label={t("height")}>
                  <NumberInput value={height} onChange={setHeight} min={50} max={250} />
                </Field>
                <Field label={t("currentWeight")}>
                  <NumberInput value={weight} onChange={setWeight} min={20} max={400} />
                </Field>
                <Field label={t("targetWeight")}>
                  <NumberInput value={target} onChange={setTarget} min={20} max={400} />
                </Field>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-display text-3xl font-bold text-ink">{t("activityLevel")}</h2>
              <div className="mt-6 space-y-2">
                <ActivityRow
                  active={activity === "sedentary"}
                  onClick={() => setActivity("sedentary")}
                  icon={<Armchair className="h-4 w-4" />}
                  label={t("sedentary")}
                  desc={t("sedentaryDesc")}
                />
                <ActivityRow
                  active={activity === "light"}
                  onClick={() => setActivity("light")}
                  icon={<Bike className="h-4 w-4" />}
                  label={t("lightlyActive")}
                  desc={t("lightlyActiveDesc")}
                />
                <ActivityRow
                  active={activity === "moderate"}
                  onClick={() => setActivity("moderate")}
                  icon={<HeartPulse className="h-4 w-4" />}
                  label={t("moderatelyActive")}
                  desc={t("moderatelyActiveDesc")}
                />
                <ActivityRow
                  active={activity === "active"}
                  onClick={() => setActivity("active")}
                  icon={<Dumbbell className="h-4 w-4" />}
                  label={t("veryActive")}
                  desc={t("veryActiveDesc")}
                />
                <ActivityRow
                  active={activity === "extra"}
                  onClick={() => setActivity("extra")}
                  icon={<Flame className="h-4 w-4" />}
                  label={t("extraActive")}
                  desc={t("extraActiveDesc")}
                />
              </div>

              {calorieGoal !== null && (
                <div className="bf-rise mt-6 rounded-2xl border border-primary/30 bg-brand-soft p-5">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-primary" />
                    <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                      {t("yourCalorieGoal")}
                    </div>
                  </div>
                  <div className="mt-2 font-display text-4xl font-bold text-ink">
                    {calorieGoal}{" "}
                    <span className="text-base font-medium text-muted-foreground">{t("calories")}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="font-display text-3xl font-bold text-ink">{t("coachInvite")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("coachInviteDesc")}
              </p>
              <div className="mt-8">
                <input
                  type="text"
                  placeholder={t("inviteCode")}
                  value={invite}
                  onChange={(e) => setInvite(e.target.value.toUpperCase())}
                  maxLength={20}
                  className="w-full rounded-[10px] border border-border bg-card px-5 py-4 text-center font-display text-2xl tracking-widest outline-none transition-colors focus:border-primary"
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-8 flex gap-3">
          {step === totalSteps - 1 ? (
            <button
              type="button"
              onClick={finish}
              disabled={submitting}
              className="btn-cta flex-1 rounded-[10px] bg-primary py-4 text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? t("calculating") : t("finish")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              className="btn-cta flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-primary py-4 text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-30"
            >
              {t("next")} <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SelectCard({
  selected,
  onClick,
  icon,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 rounded-[16px] border-2 bg-card p-4 text-left transition-all",
        selected ? "border-primary bg-brand-soft" : "border-border hover:border-ink/30",
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-[10px] transition-colors",
          selected ? "bg-primary text-primary-foreground" : "bg-secondary text-ink",
        )}
      >
        {icon}
      </div>
      <span className="flex-1 font-display text-lg font-semibold text-ink">{label}</span>
      {selected && (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-4 w-4" />
        </div>
      )}
    </button>
  );
}

function GenderPick({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 rounded-[16px] border-2 bg-card p-4 transition-all",
        active ? "border-primary bg-brand-soft" : "border-border hover:border-ink/30",
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
          active ? "bg-primary text-primary-foreground" : "bg-secondary text-ink",
        )}
      >
        {icon}
      </div>
      <span className="text-sm font-medium text-ink">{label}</span>
    </button>
  );
}

function ActivityRow({
  active,
  onClick,
  icon,
  label,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-[12px] border-2 bg-card p-3 text-left transition-all",
        active ? "border-primary bg-brand-soft" : "border-border hover:border-ink/30",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] transition-colors",
          active ? "bg-primary text-primary-foreground" : "bg-secondary text-ink",
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-ink">{label}</div>
        <div className="truncate text-xs text-muted-foreground">{desc}</div>
      </div>
      {active && <Check className="h-4 w-4 text-primary" />}
    </button>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
}: {
  value: string;
  onChange: (v: string) => void;
  min: number;
  max: number;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      min={min}
      max={max}
      className="w-full rounded-[10px] border border-border bg-card px-4 py-3.5 text-base outline-none transition-colors focus:border-primary"
    />
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

/* ---------- Friendly gender icons ---------- */
function FemaleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="9" r="5" />
      <path d="M12 14v8" />
      <path d="M9 19h6" />
    </svg>
  );
}
function MaleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="14" r="5" />
      <path d="M14 10l6-6" />
      <path d="M15 4h5v5" />
    </svg>
  );
}
function OtherIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 17v5" />
      <path d="M9 22h6" />
      <path d="M16 8l3-3" />
      <path d="M17 5h2v2" />
    </svg>
  );
}
