import * as React from "react";
import { cn } from "@/lib/ad";

type Phase = "idle" | "saving" | "done" | "failed";

const MIN_SAVING_MS = 900;
const DONE_MS = 1900;
const SPINNER_R = 6.5;
const SPINNER_ARC = 14;

const CSS = `
.ad-save-face { position: absolute; inset: 0; display: grid; place-items: center; white-space: nowrap; pointer-events: none; }
.ad-save-in { animation: ad-save-in 260ms var(--ad-ease) 40ms backwards; }
.ad-save-out { animation: ad-save-out 200ms var(--ad-ease) forwards; }
@keyframes ad-save-in { from { opacity: 0; transform: translateY(62%); filter: blur(2px); } }
@keyframes ad-save-out { to { opacity: 0; transform: translateY(-62%); filter: blur(2px); } }
.ad-save-spin { animation: ad-save-spin 780ms linear infinite; }
@keyframes ad-save-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .ad-save-in { animation: none; }
  .ad-save-out { display: none; }
  .ad-save-spin { animation: none; }
}`;

export interface SaveMorphProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children" | "onClick"> {
  label?: string;
  doneLabel?: string;
  failLabel?: string;
  /** The save. Return a promise and the spinner runs until it settles; a rejection comes back as `failLabel`. */
  onSave?: () => void | Promise<unknown>;
  /**
   * Whether the form has unsaved changes. When given, the done label stays until this turns true again; clear it
   * before the save's promise resolves. Left out, the button returns to `label` on its own after a moment.
   */
  dirty?: boolean;
  /** The size of the button. */
  size?: "default" | "lg";
}

/**
 * A save button that keeps its width and shape through every state. The label rolls away, a small spinner runs in its
 * place, and the answer rolls into the same spot.
 */
export function SaveMorph({ label = "Save changes", doneLabel = "Saved", failLabel = "Try again", onSave, dirty, size = "default", className, disabled, ...props }: SaveMorphProps) {
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [roll, setRoll] = React.useState<{ now: Phase; prev: Phase | null; n: number }>({ now: "idle", prev: null, n: 0 });
  if (roll.now !== phase) setRoll({ now: phase, prev: roll.now, n: roll.n + 1 });
  const timers = React.useRef<number[]>([]);
  const run = React.useRef(0);
  const tracksForm = dirty !== undefined;
  const tracksFormRef = React.useRef(tracksForm);
  tracksFormRef.current = tracksForm;

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  const clearLater = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
  };

  React.useEffect(
    () => () => {
      run.current++;
      timers.current.forEach(window.clearTimeout);
    },
    [],
  );

  React.useLayoutEffect(() => {
    if (phase === "done" && dirty) setPhase("idle");
  }, [phase, dirty]);

  const press = () => {
    if (disabled || phase === "saving") return;
    clearLater();
    if (phase === "done") {
      if (!tracksForm) setPhase("idle");
      return;
    }
    const id = ++run.current;
    setPhase("saving");
    const started = performance.now();
    const settle = (next: Phase) => {
      if (run.current !== id) return;
      later(
        () => {
          if (run.current !== id) return;
          setPhase(next);
          if (next === "done" && !tracksFormRef.current) later(() => run.current === id && setPhase("idle"), DONE_MS);
        },
        Math.max(0, MIN_SAVING_MS - (performance.now() - started)),
      );
    };
    let result: void | Promise<unknown>;
    try {
      result = onSave?.();
    } catch {
      settle("failed");
      return;
    }
    Promise.resolve(result).then(
      () => settle("done"),
      () => settle("failed"),
    );
  };

  const lg = size === "lg";
  const pad = lg ? "px-6" : "px-3.5";
  const words: Record<Exclude<Phase, "saving">, string> = { idle: label, done: doneLabel, failed: failLabel };
  const spoken = phase === "saving" ? "Saving" : words[phase];
  const face = (p: Phase) =>
    p === "saving" ? (
      <svg viewBox="0 0 16 16" width={16} height={16} fill="none" className="ad-save-spin">
        <circle cx="8" cy="8" r={SPINNER_R} stroke="currentColor" strokeWidth="1.75" opacity="0.28" />
        <circle cx="8" cy="8" r={SPINNER_R} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeDasharray={`${SPINNER_ARC} ${2 * Math.PI * SPINNER_R}`} />
      </svg>
    ) : (
      words[p]
    );

  return (
    <span className={cn("relative inline-grid shrink-0 align-middle font-medium", lg ? "h-11 text-title" : "h-control text-body", className)}>
      <style href="ad-save-morph" precedence="default">
        {CSS}
      </style>
      {[label, doneLabel, failLabel].map((word, i) => (
        <span key={i} aria-hidden className={cn("invisible col-start-1 row-start-1 flex items-center justify-center whitespace-nowrap", pad)}>
          {word}
        </span>
      ))}
      <button
        type="button"
        disabled={disabled}
        aria-busy={phase === "saving"}
        aria-label={spoken}
        onClick={press}
        className="ad-press absolute inset-0 cursor-pointer select-none overflow-hidden rounded-control bg-brand text-brand-ink hover:bg-brand-hover focus-visible:bg-brand-hover active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45"
        {...props}
      >
        {roll.prev && (
          <span key={`out-${roll.n}`} aria-hidden className="ad-save-face ad-save-out">
            {face(roll.prev)}
          </span>
        )}
        <span key={`in-${roll.n}`} aria-hidden className={cn("ad-save-face", roll.n > 0 && "ad-save-in")}>
          {face(roll.now)}
        </span>
      </button>
      <span role="status" className="sr-only">
        {phase === "saving" ? "Saving" : phase === "done" ? doneLabel : phase === "failed" ? failLabel : ""}
      </span>
    </span>
  );
}
