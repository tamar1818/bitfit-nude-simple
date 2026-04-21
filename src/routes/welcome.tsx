import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/providers/auth-provider";
import { useT } from "@/lib/i18n";
import { Logo } from "@/components/bitfit/logo";
import { LanguageToggle } from "@/components/bitfit/language-toggle";
import { ThemeSwitcher } from "@/components/bitfit/theme-switcher";
import { ArrowRight, Camera, Flame, Trophy } from "lucide-react";
import heroImg from "@/assets/welcome-hero.jpg";

export const Route = createFileRoute("/welcome")({
  component: WelcomePage,
});

function WelcomePage() {
  const t = useT();
  const { user, loading } = useAuth();

  if (!loading && user) return <Navigate to="/" />;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Hero image — full bleed */}
      <div className="absolute inset-x-0 top-0 h-[58vh] min-h-[420px]">
        <img
          src={heroImg}
          alt=""
          className="h-full w-full object-cover"
          width={1024}
          height={1280}
        />
        {/* Bottom gradient for legibility behind the title block */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/10 to-background" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-5 pb-8 pt-7">
        {/* Top bar — controls float over photo */}
        <div className="flex items-center justify-between bf-bounce-in">
          <div className="rounded-full bg-card/80 p-1.5 backdrop-blur-md">
            <Logo size={32} />
          </div>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <LanguageToggle />
          </div>
        </div>

        {/* Spacer pushes content card to bottom */}
        <div className="flex-1" />

        {/* Glass content card */}
        <div
          className="bf-bounce-in rounded-[28px] border border-border/60 bg-background/95 p-6 shadow-card backdrop-blur-xl"
          style={{ animationDelay: "120ms" }}
        >
          {/* Feature pills */}
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <FeaturePill icon={<Camera className="h-3 w-3" />} label={t("featureScan")} />
            <FeaturePill icon={<Flame className="h-3 w-3" />} label={t("featureCalories")} />
            <FeaturePill icon={<Trophy className="h-3 w-3" />} label={t("featureGoals")} />
          </div>

          {/* Headline */}
          <h1 className="mt-5 font-display text-[34px] font-bold leading-[1.05] tracking-tight text-ink text-balance">
            {t("welcomeHeadlineLeft")}{" "}
            <span className="font-light italic text-primary">{t("welcomeHeadlineAccent")}</span>
            <br />
            {t("welcomeHeadlineRight")}
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-balance">
            {t("welcomeSubheadline")}
          </p>

          {/* Primary CTA */}
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="btn-cta mt-6 flex w-full items-center justify-center gap-2 rounded-[14px] bg-primary py-4 text-primary-foreground shadow-float transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {t("getStarted")}
            <ArrowRight className="h-4 w-4" />
          </Link>

          {/* Secondary — sign in link */}
          <Link
            to="/auth"
            search={{ mode: "signin" }}
            className="mt-3 block text-center text-sm text-muted-foreground hover:text-ink"
          >
            {t("haveAccount")}{" "}
            <span className="font-semibold text-ink underline-offset-4 hover:underline">
              {t("signIn")}
            </span>
          </Link>
        </div>

        {/* Privacy footnote */}
        <Link
          to="/privacy"
          className="mt-4 text-center text-[11px] text-muted-foreground underline-offset-4 hover:underline"
        >
          {t("viewPrivacyPolicy")}
        </Link>
      </div>
    </div>
  );
}

function FeaturePill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink">
      <span className="text-primary">{icon}</span>
      {label}
    </span>
  );
}
