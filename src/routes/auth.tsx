import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";
import { LanguageToggle } from "@/components/bitfit/language-toggle";
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

  return (
    <div className="min-h-screen bg-background px-5 pb-10 pt-8">
      <div className="mx-auto flex max-w-md flex-col">
        <div className="flex items-center justify-between">
          <div className="font-display text-2xl font-bold text-ink">Bitfit</div>
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

        <form onSubmit={handleSubmit} className="mt-8 space-y-3">
          {mode === "signup" && (
            <input
              type="text"
              placeholder={t("fullName")}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-2xl bg-card px-5 py-4 text-base shadow-soft outline-none focus:ring-2 focus:ring-ink/20"
              required
              maxLength={100}
            />
          )}
          <input
            type="email"
            placeholder={t("email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl bg-card px-5 py-4 text-base shadow-soft outline-none focus:ring-2 focus:ring-ink/20"
            required
            maxLength={255}
          />
          <input
            type="password"
            placeholder={t("password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl bg-card px-5 py-4 text-base shadow-soft outline-none focus:ring-2 focus:ring-ink/20"
            required
            minLength={6}
            maxLength={72}
          />

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full rounded-full bg-ink py-4 font-medium text-primary-foreground shadow-card transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? t("loading") : mode === "signup" ? t("signUp") : t("signIn")}
          </button>
        </form>

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
