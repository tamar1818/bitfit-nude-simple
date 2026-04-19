import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, TrendingDown, TrendingUp, Minus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

type Goal = "lose" | "gain" | "maintain";
type Gender = "male" | "female" | "other";

function OnboardingPage() {
  const t = useT();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [target, setTarget] = useState("");
  const [invite, setInvite] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const totalSteps = 4;

  const canNext = () => {
    if (step === 0) return !!goal;
    if (step === 1) return age.length > 0 && !!gender;
    if (step === 2) return height.length > 0 && weight.length > 0 && target.length > 0;
    return true;
  };

  const finish = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { error: pErr } = await supabase
        .from("profiles")
        .update({
          goal,
          age: parseInt(age, 10),
          gender,
          height_cm: parseFloat(height),
          onboarded: true,
        })
        .eq("id", user.id);
      if (pErr) throw pErr;

      const { error: wErr } = await supabase.from("weights").insert({
        user_id: user.id,
        weight_kg: parseFloat(weight),
        target_weight_kg: parseFloat(target),
      });
      if (wErr) throw wErr;

      await supabase.from("daily_logs").upsert(
        { user_id: user.id, date: new Date().toISOString().slice(0, 10) },
        { onConflict: "user_id,date" },
      );

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
        {/* Progress */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => (step > 0 ? setStep(step - 1) : navigate({ to: "/auth" }))}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-soft"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex flex-1 gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i <= step ? "bg-ink" : "bg-nude",
                )}
              />
            ))}
          </div>
        </div>

        <div className="mt-10 flex-1">
          {step === 0 && (
            <>
              <h2 className="font-display text-3xl font-bold text-ink text-balance">
                {t("yourGoal")}
              </h2>
              <div className="mt-8 space-y-3">
                <GoalOption
                  selected={goal === "lose"}
                  onClick={() => setGoal("lose")}
                  icon={<TrendingDown className="h-5 w-5" />}
                  label={t("loseWeight")}
                  tint="lavender"
                />
                <GoalOption
                  selected={goal === "maintain"}
                  onClick={() => setGoal("maintain")}
                  icon={<Minus className="h-5 w-5" />}
                  label={t("maintainWeight")}
                  tint="mint"
                />
                <GoalOption
                  selected={goal === "gain"}
                  onClick={() => setGoal("gain")}
                  icon={<TrendingUp className="h-5 w-5" />}
                  label={t("gainWeight")}
                  tint="peach"
                />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="font-display text-3xl font-bold text-ink">{t("aboutYou")}</h2>
              <div className="mt-8 space-y-4">
                <Field label={t("age")}>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    min={1}
                    max={120}
                    className="w-full rounded-2xl bg-card px-5 py-4 text-base shadow-soft outline-none focus:ring-2 focus:ring-ink/20"
                  />
                </Field>
                <Field label={t("gender")}>
                  <div className="grid grid-cols-3 gap-2">
                    {(["female", "male", "other"] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={cn(
                          "rounded-2xl py-4 text-sm font-medium shadow-soft transition-colors",
                          gender === g ? "bg-ink text-primary-foreground" : "bg-card text-ink",
                        )}
                      >
                        {t(g)}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-display text-3xl font-bold text-ink">{t("bodyMetrics")}</h2>
              <div className="mt-8 space-y-4">
                <Field label={t("height")}>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    min={50}
                    max={250}
                    className="w-full rounded-2xl bg-card px-5 py-4 text-base shadow-soft outline-none focus:ring-2 focus:ring-ink/20"
                  />
                </Field>
                <Field label={t("currentWeight")}>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    min={20}
                    max={400}
                    className="w-full rounded-2xl bg-card px-5 py-4 text-base shadow-soft outline-none focus:ring-2 focus:ring-ink/20"
                  />
                </Field>
                <Field label={t("targetWeight")}>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    min={20}
                    max={400}
                    className="w-full rounded-2xl bg-card px-5 py-4 text-base shadow-soft outline-none focus:ring-2 focus:ring-ink/20"
                  />
                </Field>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-display text-3xl font-bold text-ink">{t("coachInvite")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter a code from your coach to link your account.
              </p>
              <div className="mt-8">
                <input
                  type="text"
                  placeholder={t("inviteCode")}
                  value={invite}
                  onChange={(e) => setInvite(e.target.value.toUpperCase())}
                  maxLength={20}
                  className="w-full rounded-2xl bg-card px-5 py-4 text-center font-display text-2xl tracking-widest shadow-soft outline-none focus:ring-2 focus:ring-ink/20"
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
              className="flex-1 rounded-full bg-ink py-4 font-medium text-primary-foreground shadow-card hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? t("loading") : t("finish")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink py-4 font-medium text-primary-foreground shadow-card hover:opacity-90 disabled:opacity-30"
            >
              {t("next")} <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function GoalOption({
  selected,
  onClick,
  icon,
  label,
  tint,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  tint: "lavender" | "mint" | "peach";
}) {
  const tintClass = { lavender: "bg-lavender", mint: "bg-mint", peach: "bg-peach" }[tint];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 rounded-3xl p-5 text-left shadow-soft transition-all",
        tintClass,
        selected && "ring-2 ring-ink",
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background/50 text-ink">
        {icon}
      </div>
      <span className="flex-1 font-display text-lg font-semibold text-ink">{label}</span>
      {selected && (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-primary-foreground">
          <Check className="h-4 w-4" />
        </div>
      )}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
