import * as React from "react";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Steps } from "@/components/ui/steps";

const KEYFRAMES = `@keyframes ad-step-in { from { opacity: 0; transform: translateX(calc(var(--ad-dir) * 40%)); } }
@keyframes ad-step-out { to { opacity: 0; transform: translateX(calc(var(--ad-dir) * -28%)); filter: blur(2px); } }`;

export interface StepPanelsProps {
  /** The index of the panel to show. */
  step: number;
  /** One node per step. */
  children: React.ReactNode[];
  className?: string;
}

/**
 * Shows one panel per step. Going forward the next panel comes in from the right and the old one leaves part of the way
 * to the left (back reverses it), and the height eases to the new panel's height instead of jumping. Focus moves into
 * the new panel when it was inside the old one. Reduced motion: an instant swap.
 */
export function StepPanels({ step, children, className }: StepPanelsProps) {
  const [s, setS] = React.useState({ cur: step, prev: null as number | null, dir: 1 as 1 | -1, n: 0 });
  if (s.cur !== step) setS({ cur: step, prev: s.cur, dir: step > s.cur ? 1 : -1, n: s.n + 1 });
  const outer = React.useRef<HTMLDivElement>(null);
  const inner = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState<number | null>(null);
  // Two divs: the outer one animates to the measured height of the inner one.
  React.useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  React.useEffect(() => {
    if (!s.n) return;
    const box = outer.current;
    if (box?.contains(document.activeElement) || document.activeElement === document.body) {
      const panel = inner.current?.lastElementChild as HTMLElement | null;
      const first = panel?.querySelector<HTMLElement>("input, textarea, select, button, [tabindex]:not([tabindex='-1'])");
      if (matchMedia("(pointer: fine)").matches && first) first.focus({ preventScroll: true });
      else panel?.focus({ preventScroll: true });
    }
  }, [s.n]);
  return (
    <div
      ref={outer}
      className={cn("relative overflow-hidden transition-[height] duration-[240ms] ease-[cubic-bezier(0.65,0,0.35,1)]", className)}
      style={{ height: height ?? undefined, ["--ad-dir" as string]: s.dir }}
    >
      <style href="ad-step-form" precedence="default">
        {KEYFRAMES}
      </style>
      {s.prev != null && s.n > 0 ? (
        <div
          key={`out-${s.n}`}
          aria-hidden
          inert
          className="pointer-events-none absolute inset-x-0 top-0 animate-[ad-step-out_200ms_var(--ad-ease)_forwards]"
          onAnimationEnd={() => setS((x) => (x.n === s.n ? { ...x, prev: null } : x))}
        >
          {children[s.prev]}
        </div>
      ) : null}
      <div ref={inner}>
        <div key={`in-${s.n}`} tabIndex={-1} className={cn("outline-none", s.n > 0 && "animate-[ad-step-in_240ms_var(--ad-ease)]")}>
          {children[s.cur]}
        </div>
      </div>
    </div>
  );
}

export interface StepFormStep {
  title: string;
  content: React.ReactNode;
  /** Runs on Next: return an error string to stay (show it next to the fields yourself), or nothing to go on. */
  validate?: () => string | void | undefined;
}

export interface StepFormProps {
  steps: StepFormStep[];
  /** Controlled step; leave out to let the form keep its own. */
  step?: number;
  onStepChange?: (step: number) => void;
  /** The last step's button. */
  finishLabel?: string;
  onFinish: () => void;
  className?: string;
}

/**
 * A short wizard in one card: step progress on top, the panel (sliding in the direction of travel, height easing), and
 * Back / Next at the bottom. Next is the one accent button and stays enabled: pressing it runs the step's check, so it
 * shows what is missing instead of being greyed out. Enter submits the current step.
 */
export function StepForm({ steps, step: stepProp, onStepChange, finishLabel = "Finish", onFinish, className }: StepFormProps) {
  const [own, setOwn] = React.useState(0);
  const step = stepProp ?? own;
  const go = (i: number) => (onStepChange ? onStepChange(i) : setOwn(i));
  const last = step === steps.length - 1;
  return (
    <form
      noValidate
      className={cn("grid gap-4", className)}
      onSubmit={(e) => {
        e.preventDefault();
        if (steps[step].validate?.()) return;
        if (last) onFinish();
        else go(step + 1);
      }}
    >
      <Steps steps={steps.map((s) => s.title)} current={step} />
      <StepPanels step={step}>{steps.map((s) => s.content)}</StepPanels>
      <div className="flex items-center justify-between gap-gap">
        <Button variant="ghost" onClick={() => go(step - 1)} className={cn(step === 0 && "invisible")} tabIndex={step === 0 ? -1 : undefined}>
          Back
        </Button>
        <Button type="submit" variant="primary">
          {last ? finishLabel : "Next"}
        </Button>
      </div>
    </form>
  );
}
