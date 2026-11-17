import * as React from "react";
import { cn } from "@/lib/ad";

export interface ComposerGlowProps {
  children: React.ReactNode;
  /** The agent is working: a faster pulse and a band drifting through the aura. */
  working?: boolean;
  /** Pulse while idle (the new-chat screen). Off holds the glow still. */
  breathe?: boolean;
  /** How far the aura reaches, in px. */
  halo?: number;
  /** Aura strength at the top of its pulse, 0 to 1. */
  strength?: number;
  /** One idle pulse, in seconds; working runs at 0.6 of it. */
  pulse?: number;
  /** How bright the top of the ring is, 0 to 1. */
  ring?: number;
  /** Corner radius of the box inside; defaults to the sheet radius. */
  radius?: string;
  className?: string;
}

// Film grain as a mask: fractal noise drives the alpha between about 45% and 100%, so the aura reads as a glow with
// fine grain, not loose speckles.
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.05' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .6 0 0 0 .45'/%3E%3C/filter%3E%3Crect width='128' height='128' filter='url(%23g)'/%3E%3C/svg%3E")`;

const CSS = `
.ad-glow { position: relative; isolation: isolate; border-radius: var(--glow-r); --glow: var(--ad-brand); --glow-hot: color-mix(in oklab, var(--ad-brand) 62%, white); --glow-halo: color-mix(in srgb, var(--ad-brand) 56%, transparent); }
.ad-glow-fx { position: absolute; inset: 0; pointer-events: none; }
.ad-glow-halo { position: absolute; inset: calc(var(--halo) * -1.8); z-index: -1; opacity: var(--halo-hi); -webkit-mask-image: ${GRAIN}; -webkit-mask-size: 128px 128px; mask-image: ${GRAIN}; mask-size: 128px 128px; transition: opacity 400ms ease-out; }
.ad-glow-halo::before, .ad-glow-halo > span { content: ""; position: absolute; inset: calc(var(--halo) * 1.35); border-radius: calc(var(--glow-r) + var(--halo) * .45); filter: blur(calc(var(--halo) * .4)); }
.ad-glow-halo::before { background: var(--glow-halo); }
.ad-glow-halo > span { display: block; overflow: hidden; opacity: 0; transition: opacity 500ms ease-out; }
.ad-glow-halo > span::before { content: ""; position: absolute; inset: 0 auto 0 0; width: 200%; background: linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--glow) 70%, transparent) 12%, transparent 25% 50%, color-mix(in srgb, var(--glow) 70%, transparent) 62%, transparent 75% 100%); animation: ad-glow-drift 4s linear infinite paused; }
.ad-glow-ring { position: absolute; inset: 0; z-index: 1; border: 1px solid transparent; border-radius: var(--glow-r); background: linear-gradient(180deg, color-mix(in srgb, var(--glow-hot) var(--ring-top), transparent), color-mix(in srgb, var(--glow) 14%, transparent) 55%, color-mix(in srgb, var(--glow) 26%, transparent)) border-box; -webkit-mask: linear-gradient(#000 0 0) padding-box, linear-gradient(#000 0 0) border-box; -webkit-mask-composite: xor; mask: linear-gradient(#000 0 0) padding-box exclude, linear-gradient(#000 0 0) border-box; }
.ad-glow[data-breathe] .ad-glow-halo { animation: ad-glow-breathe var(--pulse) ease-in-out infinite alternate; }
.ad-glow[data-working] .ad-glow-halo { animation: ad-glow-breathe calc(var(--pulse) * .6) ease-in-out infinite alternate; }
.ad-glow[data-working] .ad-glow-halo > span { opacity: 1; }
.ad-glow[data-working] .ad-glow-halo > span::before { animation-play-state: running; }
.ad-glow[data-offscreen] .ad-glow-halo, .ad-glow[data-offscreen] .ad-glow-halo > span::before { animation-play-state: paused; }
@keyframes ad-glow-breathe { from { opacity: var(--halo-lo); } to { opacity: var(--halo-hi); } }
@keyframes ad-glow-drift { to { translate: -50% 0; } }
@media (prefers-reduced-motion: reduce) {
  .ad-glow .ad-glow-halo { animation: none !important; opacity: var(--halo-hi) !important; }
  .ad-glow .ad-glow-halo > span, .ad-glow .ad-glow-halo > span::before { animation: none !important; opacity: 0 !important; }
  .ad-glow[data-working] { --ring-top: 80% !important; }
}`;

/**
 * The AI composer's glow (Alora Board, "G2 aura"): a soft grainy aura in the accent around the box, a ring lit from
 * the top on its edge, and a slow pulse. Wrap the message box with it. Only opacity and translate animate; it pauses
 * off screen, and reduced motion keeps the glow but stops the motion.
 */
export function ComposerGlow({ children, working = false, breathe = true, halo = 20, strength = 0.52, pulse = 3.6, ring = 0.48, radius = "var(--ad-radius-sheet)", className }: ComposerGlowProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => el.toggleAttribute("data-offscreen", !e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const hi = Math.min(1, working ? strength * 1.15 : strength);
  const style = {
    "--glow-r": radius,
    "--halo": `${halo}px`,
    "--halo-hi": hi,
    "--halo-lo": hi * 0.65,
    "--pulse": `${pulse}s`,
    "--ring-top": `${Math.round(ring * 100)}%`,
  } as React.CSSProperties;
  return (
    <div ref={ref} className={cn("ad-glow", className)} style={style} data-working={working ? "" : undefined} data-breathe={breathe && !working ? "" : undefined}>
      <style href="ad-composer-glow" precedence="default">
        {CSS}
      </style>
      <span className="ad-glow-fx" aria-hidden="true">
        <span className="ad-glow-halo">
          <span />
        </span>
        <span className="ad-glow-ring" />
      </span>
      {children}
    </div>
  );
}
