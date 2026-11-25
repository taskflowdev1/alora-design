import * as React from "react";
import { Check, PlusSquare, Share } from "react-feather";
import { prefersReducedMotion } from "@/lib/ad";
import { useStandalone } from "@/lib/ad-hooks";
import { MobileSheet } from "./mobile-sheet";
import { MobileStateButton, type MobileButtonState } from "./mobile-state-button";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
export type InstallPlatform = "android" | "ios";
export type InstallOutcome = "accepted" | "dismissed" | "unavailable";

const isIos = () => typeof navigator !== "undefined" && (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

/**
 * Everything an install button needs. Chromium fires `beforeinstallprompt`: it is held here and replayed from your tap.
 * iOS has no such event, so `platform` is "ios" and you show the Add to Home Screen steps. `installed` is true in the
 * home screen app and after an accepted install.
 */
export function useInstallPrompt() {
  const [event, setEvent] = React.useState<InstallEvent | null>(null);
  const [accepted, setAccepted] = React.useState(false);
  const standalone = useStandalone();
  React.useEffect(() => {
    const hold = (e: Event) => (e.preventDefault(), setEvent(e as InstallEvent));
    const done = () => (setAccepted(true), setEvent(null));
    window.addEventListener("beforeinstallprompt", hold);
    window.addEventListener("appinstalled", done);
    return () => (window.removeEventListener("beforeinstallprompt", hold), window.removeEventListener("appinstalled", done));
  }, []);
  const install = React.useCallback(async (): Promise<InstallOutcome> => {
    if (!event) return "unavailable";
    await event.prompt();
    const { outcome } = await event.userChoice;
    setEvent(null);
    if (outcome === "accepted") setAccepted(true);
    return outcome;
  }, [event]);
  const platform: InstallPlatform = isIos() ? "ios" : "android";
  return { platform, canPrompt: !!event, installed: standalone || accepted, install };
}

export interface MobileInstallSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The app's name, as it will read under its icon. */
  name: string;
  /** The app icon, about 56 px. */
  icon: React.ReactNode;
  /** "android": one Install button. "ios": the three Safari steps. */
  platform: InstallPlatform;
  /** Android: run the browser's install (`install` from useInstallPrompt). */
  onInstall?: () => Promise<InstallOutcome>;
  /** Installed: open the app. */
  onOpenApp?: () => void;
}

const IOS_STEPS = [
  { icon: Share, label: "Tap Share" },
  { icon: PlusSquare, label: "Add to Home Screen" },
  { icon: Check, label: "Tap Add" },
];

/**
 * Ask to install at a moment that earned it (after a first order, not on load). Android gets one button that does the
 * install in place; iPhone gets the three steps, lit one after another, because Safari has no install prompt.
 */
export function MobileInstallSheet({ open, onOpenChange, name, icon, platform, onInstall, onOpenApp }: MobileInstallSheetProps) {
  const [state, setState] = React.useState<MobileButtonState>("idle");
  const [ready, setReady] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const timer = React.useRef(0);
  React.useEffect(() => {
    if (!open || platform !== "ios" || prefersReducedMotion()) return;
    const t = window.setInterval(() => setStep((s) => (s + 1) % IOS_STEPS.length), 1400);
    return () => window.clearInterval(t);
  }, [open, platform]);
  React.useEffect(() => {
    setState("idle");
    setReady(false);
    return () => window.clearTimeout(timer.current);
  }, [platform]);
  const install = async () => {
    setState("busy");
    const outcome = await (onInstall?.() ?? Promise.resolve<InstallOutcome>("unavailable"));
    setState(outcome === "accepted" ? "done" : "idle");
    if (outcome === "accepted") timer.current = window.setTimeout(() => (setReady(true), setState("idle")), 1000);
  };
  return (
    <MobileSheet
      open={open}
      onOpenChange={onOpenChange}
      aria-label={`Install ${name}`}
      footer={
        platform === "android" ? (
          <MobileStateButton variant="primary" state={ready ? "idle" : state} busyLabel="Installing" doneLabel="Installed" onClick={ready ? onOpenApp : install}>
            {ready ? "Open" : "Install"}
          </MobileStateButton>
        ) : undefined
      }
    >
      <div className="grid justify-items-center gap-3 pb-2 pt-1 text-center">
        {icon}
        <h2 className="text-[20px] font-semibold text-ink">Add {name} to your home screen</h2>
      </div>
      {platform === "ios" ? (
        <ol className="mt-3 grid gap-1 pb-1">
          {IOS_STEPS.map((s, i) => (
            <li key={s.label} data-step-active={i === step || undefined} className="flex h-touch items-center gap-3 rounded-item px-3 text-[15px] text-ink-muted transition-colors duration-[220ms] ease-ad data-[step-active]:bg-fill data-[step-active]:text-ink">
              <s.icon size={18} strokeWidth={1.75} className="shrink-0" />
              {s.label}
            </li>
          ))}
        </ol>
      ) : null}
    </MobileSheet>
  );
}
