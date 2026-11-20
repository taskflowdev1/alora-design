import * as React from "react";
import { cn } from "@/lib/ad";
import { ThinkingOrbs, type OrbTone } from "./thinking-orbs";

export interface RunStatusProps {
  /** What the agent is doing, e.g. "Reading the orders…". Empty hides the line. */
  text: string;
  /** Orbs turn and the text shimmers while true; plain text once settled. */
  active?: boolean;
  /** Orb box in px. */
  size?: number;
  /** One shimmer sweep, in seconds. */
  shimmer?: number;
  /** Orb speed, 1 = the default pace. */
  speed?: number;
  tone?: OrbTone;
  className?: string;
}

const CSS = `
.ad-run-text[data-active] {
  background: linear-gradient(90deg, var(--ad-ink-muted) 0 35%, var(--ad-ink) 50%, var(--ad-ink-muted) 65% 100%) 0 0 / 250% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: ad-run-shimmer var(--ad-run-shimmer, 2.2s) linear infinite;
}
.ad-run-text[data-offscreen] { animation-play-state: paused; }
@keyframes ad-run-shimmer { from { background-position: 100% 0; } to { background-position: 0 0; } }
@keyframes ad-run-in { from { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .ad-run-text[data-active] { animation: none; background: none; color: var(--ad-ink-muted); }
}`;

/**
 * The agent's live line where its reply will start (an agent assistant): turning orbs and shimmering text while
 * work runs, plain text once settled. No bubble. The shimmer pauses off screen; reduced motion shows plain text.
 */
export function RunStatus({ text, active = true, size = 22, shimmer = 2.2, speed = 1, tone = "ink", className }: RunStatusProps) {
  const textRef = React.useRef<HTMLParagraphElement>(null);
  React.useEffect(() => {
    const el = textRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => el.toggleAttribute("data-offscreen", !e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div hidden={!text} className={cn("grid items-center justify-start gap-x-2 animate-[ad-run-in_220ms_ease-out]", className)} style={{ gridTemplateColumns: `${size}px minmax(0, auto)` }}>
      <style href="ad-run-status" precedence="default">
        {CSS}
      </style>
      <ThinkingOrbs active={active && !!text} size={size} speed={speed} tone={tone} />
      <p
        ref={textRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-active={active ? "" : undefined}
        className="ad-run-text m-0 min-w-0 truncate text-body text-ink-muted"
        style={{ "--ad-run-shimmer": `${shimmer}s` } as React.CSSProperties}
      >
        {text}
      </p>
    </div>
  );
}
