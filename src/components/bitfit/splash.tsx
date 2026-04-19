import { useEffect, useState } from "react";
import { Logo } from "@/components/bitfit/logo";

/**
 * Bitfit launch splash — flame logo with pulse rings, shown once per session.
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
    const t = window.setTimeout(() => setShow(false), 2200);
    return () => window.clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div className="bf-splash-out fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background">
      <div className="relative flex h-32 w-32 items-center justify-center">
        <span className="absolute inset-0 rounded-[28px] bg-primary/30 bf-pulse-ring" />
        <span
          className="absolute inset-0 rounded-[28px] bg-primary/20 bf-pulse-ring"
          style={{ animationDelay: "0.5s" }}
        />
        <div className="bf-pop relative">
          <Logo size={96} animated />
        </div>
      </div>
      <div className="bf-rise mt-6 text-center">
        <div className="font-display text-3xl font-bold tracking-tight text-ink">bitfit</div>
        <div className="mt-1 text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          Track every bit
        </div>
      </div>
    </div>
  );
}
