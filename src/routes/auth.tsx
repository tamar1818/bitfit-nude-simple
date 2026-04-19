import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useT } from "@/lib/i18n";
import { LanguageToggle } from "@/components/bitfit/language-toggle";
import { Logo } from "@/components/bitfit/logo";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
  fullName: z.string().trim().min(1).max(100).optional(),
});

function AuthPage() {
  const t = useT();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const parsed = schema.parse({
        email,
        password,
        fullName: mode === "signup" ? fullName : undefined,
      });

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.email,
          password: parsed.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: parsed.fullName },
          },
        });
        if (error) throw error;
        toast.success("Account created");
        navigate({ to: "/onboarding" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.email,
          password: parsed.password,
        });
        if (error) throw error;
        navigate({ to: "/" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
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
      if (result.redirected) return; // browser navigates away
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
      setOauthLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background px-5 pb-10 pt-8">
      <div className="mx-auto flex max-w-md flex-col">
        <div className="flex items-center justify-between">
          <Logo size={36} showWordmark />
          <LanguageToggle />
        </div>

        <div className="mt-12">
          <h1 className="font-display text-4xl font-bold leading-tight text-ink text-balance">
            {mode === "signup" ? (
              <>
                Start <span className="font-light italic">your</span>
                <br />
                journey.
              </>
            ) : (
              <>
                Welcome <span className="font-light italic">back.</span>
              </>
            )}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">{t("tagline")}</p>
        </div>

        {/* Email form first */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-3">
          {mode === "signup" && (
            <input
              type="text"
              placeholder={t("fullName")}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-[10px] border border-border bg-card px-5 py-4 text-base outline-none transition-colors focus:border-primary"
              required
              maxLength={100}
            />
          )}
          <input
            type="email"
            placeholder={t("email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-[10px] border border-border bg-card px-5 py-4 text-base outline-none transition-colors focus:border-primary"
            required
            maxLength={255}
          />
          <input
            type="password"
            placeholder={t("password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-[10px] border border-border bg-card px-5 py-4 text-base outline-none transition-colors focus:border-primary"
            required
            minLength={6}
            maxLength={72}
          />

          {mode === "signin" && (
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-ink/70 hover:text-ink"
              >
                {t("forgotPassword")}
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-cta mt-4 w-full rounded-[10px] bg-primary py-4 text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? t("loading") : mode === "signup" ? t("signUp") : t("signIn")}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            {t("orContinueWith")}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* OAuth below sign-in — normal case, no btn-cta */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={oauthLoading !== null}
            className="flex w-full items-center justify-center gap-3 rounded-[10px] border border-border bg-card px-5 py-3.5 text-sm font-medium text-ink transition-colors hover:border-ink/30 hover:bg-secondary disabled:opacity-50"
          >
            <GoogleIcon />
            <span>{t("continueWithGoogle")}</span>
          </button>
          <button
            type="button"
            onClick={() => handleOAuth("apple")}
            disabled={oauthLoading !== null}
            className="flex w-full items-center justify-center gap-3 rounded-[10px] border border-border bg-ink px-5 py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <AppleIcon />
            <span>{t("continueWithApple")}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="mt-6 text-center text-sm text-muted-foreground hover:text-ink"
        >
          {mode === "signup" ? t("haveAccount") : t("noAccount")}{" "}
          <span className="font-medium text-ink underline-offset-4 hover:underline">
            {mode === "signup" ? t("signIn") : t("signUp")}
          </span>
        </button>
      </div>
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
