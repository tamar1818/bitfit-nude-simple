import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";
import { LanguageToggle } from "@/components/bitfit/language-toggle";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

const schema = z.object({ email: z.string().trim().email().max(255) });

function ForgotPasswordPage() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { email: parsed } = schema.parse({ email });
      const { error } = await supabase.auth.resetPasswordForEmail(parsed, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success(t("resetLinkSent"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-5 pb-10 pt-8">
      <div className="mx-auto flex max-w-md flex-col">
        <div className="flex items-center justify-between">
          <Link
            to="/auth"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-soft"
          >
            <ArrowLeft className="h-5 w-5 text-ink" />
          </Link>
          <LanguageToggle />
        </div>

        <div className="mt-12">
          <h1 className="font-display text-4xl font-bold leading-tight text-ink">
            {t("resetPassword")}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("email")} → {t("sendResetLink")}
          </p>
        </div>

        {sent ? (
          <div className="mt-8 rounded-2xl bg-mint p-5 text-sm text-ink">
            {t("resetLinkSent")} ✉️
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-3">
            <input
              type="email"
              placeholder={t("email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
              className="w-full rounded-2xl bg-card px-5 py-4 text-base shadow-soft outline-none focus:ring-2 focus:ring-ink/20"
            />
            <button
              type="submit"
              disabled={submitting}
              className="btn-cta mt-4 w-full rounded-full bg-ink py-4 text-primary-foreground shadow-card transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? t("loading") : t("sendResetLink")}
            </button>
          </form>
        )}

        <Link
          to="/auth"
          className="mt-6 text-center text-sm text-muted-foreground hover:text-ink"
        >
          {t("backToSignIn")}
        </Link>
      </div>
    </div>
  );
}
