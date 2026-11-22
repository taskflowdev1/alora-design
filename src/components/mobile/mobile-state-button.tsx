import * as React from "react";
import { Check } from "react-feather";
import { cn } from "@/lib/ad";
import { Button, type ButtonProps } from "@/components/ui/button";

export type MobileButtonState = "idle" | "busy" | "done";

export interface MobileStateButtonProps extends Omit<ButtonProps, "children" | "asChild" | "icon" | "size"> {
  state?: MobileButtonState;
  /** The label at rest. */
  children: React.ReactNode;
  /** While working ("Installing"). Defaults to the label. */
  busyLabel?: React.ReactNode;
  /** When finished ("Installed"). */
  doneLabel?: React.ReactNode;
}

/**
 * A 44 px button that does its work in place: it keeps its width and shape through idle, busy and done (all three labels
 * share one cell, so the widest sets the size). Busy runs a soft sweep behind the label, done draws a check. Taps are
 * ignored until it is idle again.
 */
export function MobileStateButton({ state = "idle", children, busyLabel, doneLabel, className, onClick, ...props }: MobileStateButtonProps) {
  const label = (s: MobileButtonState, node: React.ReactNode) => (
    <span
      aria-hidden={state !== s}
      className={cn(
        "col-start-1 row-start-1 flex items-center justify-center gap-2 transition-[opacity,transform] duration-[220ms] ease-ad motion-reduce:transition-none",
        state === s ? "translate-y-0 opacity-100" : s === "idle" || (s === "busy" && state === "done") ? "-translate-y-2 opacity-0" : "translate-y-2 opacity-0",
      )}
    >
      {node}
    </span>
  );
  return (
    <Button
      {...props}
      aria-busy={state === "busy" || undefined}
      onClick={state === "idle" ? onClick : undefined}
      className={cn("relative h-touch overflow-hidden text-[15px]", state !== "idle" && "cursor-default active:scale-100", className)}
    >
      <style href="ad-state-button" precedence="default">{`@keyframes ad-state-sweep { from { transform: translateX(-100%); } to { transform: translateX(100%); } } @keyframes ad-state-check { from { stroke-dashoffset: 24; } to { stroke-dashoffset: 0; } }`}</style>
      {state === "busy" ? <span aria-hidden className="absolute inset-0 animate-[ad-state-sweep_1100ms_var(--ad-ease)_infinite] bg-current opacity-15 motion-reduce:animate-none motion-reduce:opacity-10" /> : null}
      <span className="relative grid">
        {label("idle", children)}
        {label("busy", busyLabel ?? children)}
        {label(
          "done",
          <>
            {state === "done" ? <Check strokeDasharray={24} className="animate-[ad-state-check_260ms_var(--ad-ease)_both] motion-reduce:animate-none" /> : <Check />}
            {doneLabel ?? children}
          </>,
        )}
      </span>
    </Button>
  );
}
