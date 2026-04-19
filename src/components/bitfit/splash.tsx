import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

/**
 * Bitfit launch splash — shown once per session.
 * Animated heartbeat + pulse rings convey "fitness / wellbeing".
 */
export function Splash() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem("bitfit.splashShown") === "1") {
      setShow(false);
      return;
    }
    window.sessionStorage.setItem("bitfit.splashShown", "1");
    const t = window.setTimeout(() => setShow(false), 2000);
    return () => window.clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div className="bf-splash-out fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-lime/40 bf-pulse-ring" />
        <span
          className="absolute inset-0 rounded-full bg-lime/30 bf-pulse-ring"
          style={{ animationDelay: "0.4s" }}
        />
        <div className="bf-pop relative flex h-20 w-20 items-center justify-center rounded-full bg-ink shadow-float">
          <Heart className="bf-heartbeat h-9 w-9 fill-lime text-lime" />
        </div>
      </div>
      <div className="bf-rise mt-6 text-center">
        <div className="font-display text-3xl font-bold tracking-tight text-ink">Bitfit</div>
        <div className="mt-1 text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Fit · Calm · You
        </div>
      </div>
    </div>
  );
}
