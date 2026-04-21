import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useT } from "@/lib/i18n";
import { LanguageToggle } from "@/components/bitfit/language-toggle";
import { ThemeSwitcher } from "@/components/bitfit/theme-switcher";
import { Logo } from "@/components/bitfit/logo";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Mail, Lock, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (search) => searchSchema.parse(search),
  component: AuthPage,
});

const credSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
  fullName: z.string().trim().min(1).max(100).optional(),
});

type SignupStep = "name" | "email" | "password" | "confirm";

function AuthPage() {
  const t = useT();
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signup");

  return (
    <div className="min-h-screen bg-background px-5 pb-10 pt-7">
      <div className="mx-auto flex min-h-screen max-w-md flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between bf-bounce-in">
          <Link
            to="/welcome"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card transition-colors hover:bg-secondary"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4 text-ink" />
          </Link>
          <Logo size={32} />
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <LanguageToggle />
          </div>
        </div>

        {mode === "signup" ? (
          <SignupFlow onSwitchMode={() => setMode("signin")} navigate={navigate} t={t} />
        ) : (
          <SignInForm onSwitchMode={() => setMode("signup")} navigate={navigate} t={t} />
        )}
      </div>
    </div>
  );
}

/* -------------------- SIGN IN (compact, single form) -------------------- */

function SignInForm({
  onSwitchMode,
  navigate,
  t,
}: {
  onSwitchMode: () => void;
  navigate: ReturnType<typeof useNavigate>;
  t: ReturnType<typeof useT>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const parsed = credSchema.parse({ email, password });
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.email,
        password: parsed.password,
      });
      if (error) throw error;
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setOauthLoading(provider);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Sign-in failed");
        setOauthLoading(null);
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
      setOauthLoading(null);
    }
  };

  return (
    <div className="bf-step-in mt-12">
      <h1 className="font-display text-4xl font-bold leading-tight text-ink text-balance">
        Welcome <span className="font-light italic">back.</span>
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">{t("tagline")}</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-3">
        <InputField
          icon={<Mail className="h-4 w-4" />}
          type="email"
          value={email}
          onChange={setEmail}
          placeholder={t("email")}
          required
          maxLength={255}
        />
        <InputField
          icon={<Lock className="h-4 w-4" />}
          type="password"
          value={password}
          onChange={setPassword}
          placeholder={t("password")}
          required
          minLength={6}
          maxLength={72}
        />

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-xs font-medium text-ink/70 hover:text-ink"
          >
            {t("forgotPassword")}
          </Link>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-cta mt-4 w-full rounded-[14px] bg-primary py-4 text-primary-foreground shadow-float transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          {submitting ? t("loading") : t("signIn")}
        </button>
      </form>

      <Divider label={t("orContinueWith")} />

      <OAuthButtons onClick={handleOAuth} loading={oauthLoading} t={t} />

      <button
        type="button"
        onClick={onSwitchMode}
        className="mt-6 w-full text-center text-sm text-muted-foreground hover:text-ink"
      >
        {t("noAccount")}{" "}
        <span className="font-semibold text-ink underline-offset-4 hover:underline">
          {t("signUp")}
        </span>
      </button>
    </div>
  );
}

/* -------------------- SIGNUP (one-field-at-a-time micro-flow) -------------------- */

function SignupFlow({
  onSwitchMode,
  navigate,
  t,
}: {
  onSwitchMode: () => void;
  navigate: ReturnType<typeof useNavigate>;
  t: ReturnType<typeof useT>;
}) {
  const [step, setStep] = useState<SignupStep>("name");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);

  const stepOrder: SignupStep[] = ["name", "email", "password", "confirm"];
  const stepIndex = stepOrder.indexOf(step);

  const isNameValid = fullName.trim().length >= 1;
  const isEmailValid = z.string().email().safeParse(email.trim()).success;
  const isPasswordValid = password.length >= 6;

  const canAdvance = () => {
    if (step === "name") return isNameValid;
    if (step === "email") return isEmailValid;
    if (step === "password") return isPasswordValid;
    return acceptedPolicy;
  };

  const advance = () => {
    if (!canAdvance()) return;
    const next = stepOrder[stepIndex + 1];
    if (next) setStep(next);
  };

  const goBack = () => {
    const prev = stepOrder[stepIndex - 1];
    if (prev) setStep(prev);
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setOauthLoading(provider);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Sign-in failed");
        setOauthLoading(null);
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
      setOauthLoading(null);
    }
  };

  const finish = async () => {
    if (!acceptedPolicy) {
      toast.error(t("mustAcceptPolicy"));
      return;
    }
    setSubmitting(true);
    try {
      const parsed = credSchema.parse({ email, password, fullName });
      const { error } = await supabase.auth.signUp({
        email: parsed.email,
        password: parsed.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: parsed.fullName },
        },
      });
      if (error) throw error;
      toast.success("Account created 🎉");
      navigate({ to: "/onboarding" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const firstName = fullName.trim().split(" ")[0] || "";

  return (
    <div className="mt-10 flex flex-1 flex-col">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2">
        {stepOrder.map((s, i) => (
          <div
            key={s}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === stepIndex ? "w-8 bg-primary" : "w-1.5 bg-border",
              i < stepIndex && "bg-primary",
            )}
          />
        ))}
      </div>

      {/* Step header */}
      <div className="mt-8">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
          {step === "confirm" ? t("almostDone") : t("letsGetYouIn")}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold leading-tight text-ink text-balance">
          {step === "name" && (
            <>
              👋 {t("whatsYourName")}
            </>
          )}
          {step === "email" && (
            <>
              📧 {t("whatsYourEmail")}
            </>
          )}
          {step === "password" && (
            <>
              🔒 {t("chooseAPassword")}
            </>
          )}
          {step === "confirm" && t("welcomeFirstName").replace("{name}", firstName)}
        </h1>
      </div>

      {/* Step body — animated */}
      <div key={step} className="bf-step-in mt-6 flex-1">
        {step === "name" && (
          <BigInput
            icon={<UserIcon className="h-5 w-5" />}
            value={fullName}
            onChange={setFullName}
            placeholder={t("namePlaceholder")}
            valid={isNameValid}
            autoFocus
            onEnter={advance}
            maxLength={100}
          />
        )}

        {step === "email" && (
          <BigInput
            icon={<Mail className="h-5 w-5" />}
            type="email"
            value={email}
            onChange={(v) => setEmail(v.toLowerCase())}
            placeholder={t("emailPlaceholder")}
            valid={isEmailValid}
            autoFocus
            onEnter={advance}
            maxLength={255}
          />
        )}

        {step === "password" && (
          <>
            <BigInput
              icon={<Lock className="h-5 w-5" />}
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              valid={isPasswordValid}
              autoFocus
              onEnter={advance}
              minLength={6}
              maxLength={72}
            />
            <p className="mt-3 px-2 text-xs text-muted-foreground">{t("passwordHint")}</p>
          </>
        )}

        {step === "confirm" && (
          <div className="space-y-4">
            {/* Summary card */}
            <div className="rounded-[16px] border border-border bg-card p-4">
              <SummaryRow icon={<UserIcon className="h-3.5 w-3.5" />} label={t("fullName")} value={fullName} />
              <SummaryRow icon={<Mail className="h-3.5 w-3.5" />} label={t("email")} value={email} />
              <SummaryRow icon={<Lock className="h-3.5 w-3.5" />} label={t("password")} value={"•".repeat(Math.min(password.length, 12))} last />
            </div>

            {/* Privacy checkbox */}
            <label className="flex cursor-pointer items-start gap-3 rounded-[16px] border border-border bg-card/50 px-4 py-3 text-sm text-ink/80 transition-colors hover:bg-card">
              <input
                type="checkbox"
                checked={acceptedPolicy}
                onChange={(e) => setAcceptedPolicy(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary"
                required
                aria-required="true"
              />
              <span className="leading-snug">
                {t("acceptPolicyPrefix")}{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setPolicyOpen(true);
                  }}
                  className="font-medium text-ink underline underline-offset-2 hover:text-primary"
                >
                  {t("privacyPolicy")}
                </button>{" "}
                {t("andTerms")}
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Bottom action area */}
      <div className="mt-8 space-y-3">
        {step === "confirm" ? (
          <button
            type="button"
            onClick={finish}
            disabled={submitting || !acceptedPolicy}
            className="btn-cta flex w-full items-center justify-center gap-2 rounded-[14px] bg-primary py-4 text-primary-foreground shadow-float transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? t("loading") : t("finishSignup")}
          </button>
        ) : (
          <button
            type="button"
            onClick={advance}
            disabled={!canAdvance()}
            className="btn-cta flex w-full items-center justify-center gap-2 rounded-[14px] bg-primary py-4 text-primary-foreground shadow-float transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30"
          >
            {t("continue")} <ArrowRight className="h-4 w-4" />
          </button>
        )}

        {step !== "name" && (
          <button
            type="button"
            onClick={goBack}
            className="w-full text-center text-xs font-medium text-muted-foreground hover:text-ink"
          >
            ← {t("back")}
          </button>
        )}

        {step === "name" && (
          <>
            <Divider label={t("orContinueWith")} />
            <OAuthButtons onClick={handleOAuth} loading={oauthLoading} t={t} />
            <button
              type="button"
              onClick={onSwitchMode}
              className="mt-2 w-full text-center text-sm text-muted-foreground hover:text-ink"
            >
              {t("haveAccount")}{" "}
              <span className="font-semibold text-ink underline-offset-4 hover:underline">
                {t("signIn")}
              </span>
            </button>
          </>
        )}
      </div>

      {/* Privacy dialog */}
      <Dialog open={policyOpen} onOpenChange={setPolicyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("privacyTitle")}</DialogTitle>
            <DialogDescription className="pt-2 text-sm leading-relaxed text-ink/70">
              {t("privacyBody")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex-row justify-end gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                setAcceptedPolicy(false);
                setPolicyOpen(false);
                toast.error(t("policyDeclined"));
              }}
              className="rounded-[10px] border border-border bg-card px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-secondary"
            >
              {t("decline")}
            </button>
            <button
              type="button"
              onClick={() => {
                setAcceptedPolicy(true);
                setPolicyOpen(false);
              }}
              className="rounded-[10px] bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              {t("accept")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* -------------------- SHARED PIECES -------------------- */

function InputField({
  icon,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  minLength,
  maxLength,
}: {
  icon: React.ReactNode;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
        {icon}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        className="w-full rounded-[14px] border border-border bg-card py-4 pl-11 pr-4 text-base outline-none transition-colors focus:border-primary"
      />
    </div>
  );
}

function BigInput({
  icon,
  type = "text",
  value,
  onChange,
  placeholder,
  valid,
  autoFocus,
  onEnter,
  minLength,
  maxLength,
}: {
  icon: React.ReactNode;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  valid: boolean;
  autoFocus?: boolean;
  onEnter?: () => void;
  minLength?: number;
  maxLength?: number;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center rounded-[18px] border-2 bg-card pl-5 pr-5 transition-colors",
        valid ? "border-primary" : "border-border focus-within:border-primary/60",
      )}
    >
      <span
        className={cn(
          "shrink-0 transition-colors",
          valid ? "text-primary" : "text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <input
        type={type}
        value={value}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onEnter) {
            e.preventDefault();
            onEnter();
          }
        }}
        placeholder={placeholder}
        minLength={minLength}
        maxLength={maxLength}
        className="w-full bg-transparent py-5 pl-3 pr-2 text-lg font-medium outline-none placeholder:text-muted-foreground/60"
      />
      {valid && (
        <span className="bf-pop ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-4 w-4" />
        </span>
      )}
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  last,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 py-2.5",
        !last && "border-b border-border",
      )}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-primary">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-ink">{value || "—"}</p>
      </div>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="my-6 flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function OAuthButtons({
  onClick,
  loading,
  t,
}: {
  onClick: (provider: "google" | "apple") => void;
  loading: "google" | "apple" | null;
  t: ReturnType<typeof useT>;
}) {
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => onClick("google")}
        disabled={loading !== null}
        className="flex w-full items-center justify-center gap-3 rounded-[14px] border border-border bg-card px-5 py-3.5 text-sm font-medium text-ink transition-colors hover:border-ink/30 hover:bg-secondary disabled:opacity-50"
      >
        <GoogleIcon />
        <span>{t("continueWithGoogle")}</span>
      </button>
      <button
        type="button"
        onClick={() => onClick("apple")}
        disabled={loading !== null}
        className="flex w-full items-center justify-center gap-3 rounded-[14px] border border-border bg-ink px-5 py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        <AppleIcon />
        <span>{t("continueWithApple")}</span>
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.31 0-6-2.74-6-6.1s2.69-6.1 6-6.1c1.88 0 3.14.8 3.86 1.5l2.63-2.54C16.94 3.36 14.7 2.4 12 2.4 6.94 2.4 2.85 6.5 2.85 11.5S6.94 20.6 12 20.6c6.92 0 9.15-4.86 9.15-7.43 0-.5-.05-.86-.13-1.97H12z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.365 1.43c0 1.14-.41 2.23-1.23 3.07-.83.85-2.18 1.5-3.34 1.41-.13-1.1.41-2.25 1.18-3.04.86-.89 2.32-1.55 3.39-1.44zM20.5 17.4c-.55 1.27-.81 1.84-1.52 2.96-.99 1.55-2.39 3.48-4.12 3.5-1.54.02-1.94-.99-4.03-.97-2.09.02-2.53 1-4.07.98-1.73-.02-3.06-1.77-4.05-3.32C-.07 16.94-.36 11.7 1.45 8.92c1.28-1.96 3.31-3.11 5.21-3.11 1.94 0 3.16 1.07 4.76 1.07 1.55 0 2.5-1.07 4.74-1.07 1.69 0 3.49.92 4.78 2.51-4.2 2.31-3.51 8.31.56 9.08z" />
    </svg>
  );
}
