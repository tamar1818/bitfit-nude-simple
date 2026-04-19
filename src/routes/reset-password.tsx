import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";
import { LanguageToggle } from "@/components/bitfit/language-toggle";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

const schema = z.object({ password: z.string().min(6).max(72) });

function ResetPasswordPage() {
  const t = useT();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase places the recovery session in the URL hash and triggers
    // PASSWORD_RECOVERY via onAuthStateChange.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { password: parsed } = schema.parse({ password });
      const { error } = await supabase.auth.updateUser({ password: parsed });
      if (error) throw error;
      toast.success(t("passwordUpdated"));
      navigate({ to: "/" });
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
          <div className="font-display text-2xl font-bold text-ink">Bitfit</div>
          <LanguageToggle />
        </div>

        <div className="mt-12">
          <h1 className="font-display text-4xl font-bold leading-tight text-ink">
            {t("resetPassword")}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">{t("newPassword")}</p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-3">
          <input
            type="password"
            placeholder={t("newPassword")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            maxLength={72}
            className="w-full rounded-2xl bg-card px-5 py-4 text-base shadow-soft outline-none focus:ring-2 focus:ring-ink/20"
          />
          <button
            type="submit"
            disabled={submitting || !ready}
            className="btn-cta mt-4 w-full rounded-full bg-ink py-4 text-primary-foreground shadow-card transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? t("loading") : t("updatePassword")}
          </button>
        </form>
      </div>
    </div>
  );
}
