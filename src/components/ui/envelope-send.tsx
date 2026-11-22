import * as React from "react";
import { Send } from "react-feather";
import { cn, formatRp, prefersReducedMotion } from "@/lib/ad";
import { Button } from "@/components/ui/button";

export interface EnvelopeLine {
  name: string;
  qty: number;
  price: number;
}

const DEFAULT_LINES: EnvelopeLine[] = [
  { name: "Gelas kopi tanah liat", qty: 12, price: 45000 },
  { name: "Teko tanah liat", qty: 2, price: 185000 },
  { name: "Piring ceper", qty: 8, price: 42500 },
];

/*
 * The whole send is one timeline of Web Animations started together, each with its own delay, so a reset cancels it in
 * one go and everything falls back to the resting CSS. Sizes are in cqw of the stage. Paper and envelope are real
 * objects, the same in both themes (hence grey-ok); the seal takes the accent.
 */
const CSS = `
.ad-env {
  container-type: inline-size;
  --env-paper: oklch(0.985 0.005 90); /* grey-ok: invoice paper */
  --env-paper-back: oklch(0.945 0.009 88); /* grey-ok: the paper's back */
  --env-ink: oklch(0.25 0.006 80); /* grey-ok: printed text */
  --env-soft: oklch(0.48 0.008 80); /* grey-ok: printed text, lighter */
  --env-face: oklch(0.93 0.022 82); /* grey-ok: envelope */
  --env-fold: oklch(0.885 0.028 80); /* grey-ok: envelope, the folded sides */
  --env-inside: oklch(0.7 0.035 76); /* grey-ok: inside of the envelope */
  --env-flap: oklch(0.905 0.026 81); /* grey-ok: the flap, closed */
  --env-flap-in: oklch(0.8 0.032 78); /* grey-ok: the flap's inner side */
  --env-cast: oklch(0.2 0.01 70 / 0.26); /* grey-ok: shadow on the paper */
}
.ad-env-stage { height: 84cqw; }
.ad-env-sheet { left: 20cqw; top: 6cqw; width: 60cqw; height: 72cqw; transform-style: preserve-3d; }
.ad-env-persp { perspective: 900px; }
.ad-env-panel { position: absolute; left: 0; width: 100%; height: 33.3334%; transform-style: preserve-3d; }
.ad-env-side { position: absolute; inset: 0; overflow: hidden; backface-visibility: hidden; background: var(--env-paper); color: var(--env-ink); }
.ad-env-side[data-back] { transform: rotateX(180deg); background: var(--env-paper-back); }
.ad-env-panel[data-panel="top"] .ad-env-side:not([data-back]), .ad-env-panel[data-panel="bottom"] .ad-env-side[data-back] { border-radius: var(--ad-radius-item) var(--ad-radius-item) 0 0; }
.ad-env-panel[data-panel="bottom"] .ad-env-side:not([data-back]), .ad-env-panel[data-panel="top"] .ad-env-side[data-back] { border-radius: 0 0 var(--ad-radius-item) var(--ad-radius-item); }
.ad-env-soft { color: var(--env-soft); }
.ad-env-shade { position: absolute; inset: 0; background: var(--env-cast); opacity: 0; pointer-events: none; }
.ad-env-body { left: 12cqw; top: 28cqw; width: 76cqw; height: 46cqw; opacity: 0; }
.ad-env-back { background: var(--env-inside); }
.ad-env-front-a { fill: var(--env-fold); }
.ad-env-front-b { fill: var(--env-face); }
.ad-env-flap { left: 12cqw; top: 28cqw; width: 76cqw; height: 26cqw; transform-origin: 50% 0; transform: rotateX(180deg); transform-style: preserve-3d; opacity: 0; z-index: 1; }
.ad-env-flap svg { position: absolute; inset: 0; width: 100%; height: 100%; backface-visibility: hidden; }
.ad-env-flap svg[data-in] { transform: rotateX(180deg); }
.ad-env-flap-out { fill: var(--env-flap); }
.ad-env-flap-in { fill: var(--env-flap-in); }
.ad-env-seal { left: 50cqw; top: 53.4cqw; width: 8.4cqw; height: 8.4cqw; margin: -4.2cqw 0 0 -4.2cqw; opacity: 0; z-index: 6; }
.ad-env-done { animation: ad-env-done 260ms var(--ad-ease) both; }
@keyframes ad-env-done { from { opacity: 0; transform: translateY(5px); filter: blur(2px); } }
.ad-env-return { animation: ad-env-return 280ms var(--ad-ease) both; }
@keyframes ad-env-return { from { opacity: 0; transform: translateY(5cqw); } }`;

const subscribeMotion = (fn: () => void) => {
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", fn);
  return () => mq.removeEventListener("change", fn);
};

/** On touch, the button answers across a full 44 px. */
const TOUCH = "relative pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:top-1/2 pointer-coarse:after:h-[44px] pointer-coarse:after:-translate-y-1/2";

const SOFT = "cubic-bezier(0.45, 0, 0.2, 1)";
const OUT = "cubic-bezier(0.2, 0.8, 0.2, 1)";
const THROW = "cubic-bezier(0.5, 0, 0.85, 0.5)";
/** How long "Sent" stays before the next invoice comes up. */
const SENT_MS = 1500;

/** The next number in the series: INV/2026/11/0482 becomes INV/2026/11/0483. */
const nextInvoice = (invoice: string, by: number) => invoice.replace(/\d+$/, (n) => String(Number(n) + by).padStart(n.length, "0"));

type Step = { el: Element | null | undefined; frames: Keyframe[]; at: number; ms: number; easing?: string };

function Invoice({ shop, customer, invoice, lines, total }: { shop: string; customer: string; invoice: string; lines: EnvelopeLine[]; total: number }) {
  return (
    <div className="grid h-full grid-rows-[auto_1fr_auto] gap-[5cqw] p-[4.6cqw]">
      <div className="grid gap-[0.7cqw]">
        <span translate="no" className="truncate text-[4.4cqw] font-semibold leading-tight">
          {shop}
        </span>
        <span translate="no" className="ad-env-soft truncate text-[2.9cqw] tabular-nums leading-tight">
          {invoice}
        </span>
      </div>
      <div className="grid content-start gap-[2.6cqw]">
        <span translate="no" className="truncate text-[3.3cqw] font-medium leading-tight">
          {customer}
        </span>
        <div className="grid gap-[2.1cqw]">
          {lines.map((l) => (
            <div key={l.name} className="flex items-baseline justify-between gap-[2cqw] text-[3cqw] leading-tight">
              <span translate="no" className="min-w-0 truncate">
                {l.name}
                <span className="ad-env-soft tabular-nums">&nbsp;× {l.qty}</span>
              </span>
              <span className="shrink-0 tabular-nums">{formatRp(l.qty * l.price)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-baseline justify-between gap-[2cqw]">
        <span className="ad-env-soft text-[2.9cqw]">Total</span>
        <span className="text-[5.2cqw] font-semibold leading-none tabular-nums">{formatRp(total)}</span>
      </div>
    </div>
  );
}

export interface EnvelopeSendProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  shop?: string;
  customer?: string;
  invoice?: string;
  lines?: EnvelopeLine[];
  /** The initial on the seal. */
  initial?: string;
  /** Called the moment the envelope has flown. */
  onSend?: () => void;
}

/**
 * An invoice that sends itself: it folds in thirds, slips into an envelope, the flap closes on a seal and the envelope
 * flies off, and the next invoice in the series comes up. Under reduced motion it goes straight to sent.
 */
export function EnvelopeSend({ shop = "Rimba Kemang", customer = "Toko Bu Sari", invoice = "INV/2026/11/0482", lines = DEFAULT_LINES, initial = "R", onSend, className, ...props }: EnvelopeSendProps) {
  const root = React.useRef<HTMLDivElement>(null);
  const anims = React.useRef<Animation[]>([]);
  const run = React.useRef(0);
  const [phase, setPhase] = React.useState<"idle" | "sending" | "sent">("idle");
  const [returning, setReturning] = React.useState(false);
  const [sentCount, setSentCount] = React.useState(0);
  const timer = React.useRef(0);
  const reduced = React.useSyncExternalStore(subscribeMotion, prefersReducedMotion, () => false);
  const total = lines.reduce((s, l) => s + l.qty * l.price, 0);

  const clearAnims = () => {
    anims.current.forEach((a) => a.cancel());
    anims.current = [];
  };
  React.useEffect(
    () => () => {
      run.current++;
      clearTimeout(timer.current);
      anims.current.forEach((a) => a.cancel());
    },
    [],
  );

  const send = async () => {
    if (phase !== "idle") return;
    const token = ++run.current;
    setReturning(false);
    if (reduced) {
      finish();
      return;
    }
    setPhase("sending");
    const q = (s: string) => root.current?.querySelector(s);
    const qa = (s: string) => [...(root.current?.querySelectorAll(s) ?? [])];
    const sheet = q("[data-sheet]");
    const top = q("[data-panel=top]");
    const bottom = q("[data-panel=bottom]");
    const flap = q("[data-flap]");
    const seal = q("[data-seal]");
    const flight = q("[data-flight]");
    const shades = qa("[data-shade]");
    const body = qa("[data-env-body]");

    const steps: Step[] = [
      // Fold: the bottom third comes up, then the top third over it.
      { el: bottom, frames: [{ transform: "translateZ(0.4px) rotateX(0deg)" }, { transform: "translateZ(0.4px) rotateX(180deg)" }], at: 0, ms: 320, easing: SOFT },
      { el: shades[2], frames: [{ opacity: 0 }, { opacity: 0.7, offset: 0.5 }, { opacity: 0 }], at: 0, ms: 320 },
      { el: top, frames: [{ transform: "translateZ(0.8px) rotateX(0deg)" }, { transform: "translateZ(0.8px) rotateX(-180deg)" }], at: 240, ms: 320, easing: SOFT },
      { el: shades[0], frames: [{ opacity: 0 }, { opacity: 0.7, offset: 0.5 }, { opacity: 0 }], at: 240, ms: 320 },
      // The folded sheet lifts while the envelope rises to meet it.
      { el: sheet, frames: [{ transform: "translateY(0)" }, { transform: "translateY(-11cqw)" }], at: 560, ms: 280, easing: OUT },
      ...body.map((el) => ({ el, frames: [{ opacity: 0, transform: "translateY(46cqw)" }, { opacity: 1, transform: "translateY(0)" }], at: 600, ms: 300, easing: OUT })),
      { el: flap, frames: [{ opacity: 0, transform: "translateY(46cqw) rotateX(180deg)" }, { opacity: 1, transform: "translateY(0) rotateX(180deg)" }], at: 600, ms: 300, easing: OUT },
      // Slips in, behind the front of the envelope.
      { el: sheet, frames: [{ transform: "translateY(-11cqw)" }, { transform: "translateY(9.5cqw)" }], at: 900, ms: 280, easing: SOFT },
      // The flap comes over the top: above the sheet from here on.
      { el: flap, frames: [{ zIndex: 5 }, { zIndex: 5 }], at: 1200, ms: 1, easing: "linear" },
      { el: flap, frames: [{ opacity: 1, transform: "rotateX(180deg)" }, { opacity: 1, transform: "rotateX(0deg)" }], at: 1200, ms: 280, easing: SOFT },
      { el: seal, frames: [{ opacity: 0, transform: "scale(1.5) rotate(-14deg)" }, { opacity: 1, transform: "scale(1) rotate(-6deg)" }], at: 1470, ms: 150, easing: "cubic-bezier(0.55, 0, 0.9, 0.4)" },
      // A small wind-up, then it goes up and away on a curve.
      {
        el: flight,
        frames: [
          { transform: "translate(0, 0) rotate(0deg) scale(1)", opacity: 1, easing: OUT },
          { transform: "translate(-0.6cqw, 1.2cqw) rotate(1.4deg) scale(0.985)", opacity: 1, offset: 0.2, easing: THROW },
          { transform: "translate(14cqw, -22cqw) rotate(-7deg) scale(0.86)", opacity: 1, offset: 0.62 },
          { transform: "translate(78cqw, -88cqw) rotate(-19deg) scale(0.58)", opacity: 0, offset: 1 },
        ],
        at: 1780,
        ms: 640,
      },
    ];

    clearAnims();
    const started = steps.flatMap((s) => (s.el ? [s.el.animate(s.frames, { delay: s.at, duration: s.ms, easing: s.easing ?? "linear", fill: "forwards" })] : []));
    anims.current = started;
    try {
      await Promise.all(started.map((a) => a.finished));
    } catch {
      return; // Cancelled by a reset or unmount.
    }
    if (run.current !== token) return;
    finish();
  };

  /** Sent: says so for a moment, then the next invoice in the series comes up, ready to go. */
  const finish = () => {
    setPhase("sent");
    onSend?.();
    timer.current = window.setTimeout(() => {
      clearAnims();
      setSentCount((c) => c + 1);
      setReturning(true);
      setPhase("idle");
    }, SENT_MS);
  };

  const panels = [
    { key: "top", top: "0%", inner: "0%", origin: "50% 100%" },
    { key: "middle", top: "33.3333%", inner: "-100%", origin: "50% 50%" },
    { key: "bottom", top: "66.6667%", inner: "-200%", origin: "50% 0%" },
  ];
  const paper = <Invoice shop={shop} customer={customer} invoice={nextInvoice(invoice, sentCount)} lines={lines} total={total} />;

  return (
    <div ref={root} className={cn("ad-env grid w-full min-w-0 gap-3", className)} {...props}>
      <style href="ad-envelope-send" precedence="default">
        {CSS}
      </style>
      <div className="ad-env-stage relative select-none overflow-hidden rounded-card bg-surface shadow-card">
        <div data-flight className={cn("ad-env-persp absolute inset-0", phase === "sent" && "invisible")}>
          <div data-env-body aria-hidden className="ad-env-body ad-env-back absolute rounded-item" />
          <div data-flap aria-hidden className="ad-env-flap absolute">
            <svg viewBox="0 0 100 34" preserveAspectRatio="none">
              <path className="ad-env-flap-out" d="M1.5 0H98.5C100 0 100.6 1.6 99.4 2.6L54 31.6C51.5 33.2 48.5 33.2 46 31.6L.6 2.6C-.6 1.6 0 0 1.5 0Z" />
            </svg>
            <svg data-in viewBox="0 0 100 34" preserveAspectRatio="none">
              <path className="ad-env-flap-in" d="M1.5 0H98.5C100 0 100.6 1.6 99.4 2.6L54 31.6C51.5 33.2 48.5 33.2 46 31.6L.6 2.6C-.6 1.6 0 0 1.5 0Z" />
            </svg>
          </div>

          <div data-sheet className={cn("ad-env-sheet absolute z-[2]", returning && "ad-env-return")} onAnimationEnd={() => setReturning(false)}>
            {panels.map((p) => (
              <div key={p.key} data-panel={p.key} className="ad-env-panel" style={{ top: p.top, transformOrigin: p.origin }}>
                <div className="ad-env-side">
                  <div className="absolute inset-x-0 h-[300%]" style={{ top: p.inner }}>
                    {paper}
                  </div>
                  <div data-shade className="ad-env-shade" />
                </div>
                <div data-back className="ad-env-side" />
              </div>
            ))}
          </div>

          <div data-env-body aria-hidden className="ad-env-body absolute z-[3] overflow-hidden rounded-item" style={{ filter: "drop-shadow(0 2px 5px var(--env-cast))" }}>
            <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="absolute inset-0 size-full">
              <path className="ad-env-front-a" d="M0 0 50 35 100 0V60H0Z" />
              <path className="ad-env-front-b" d="M0 60 42 29.5C47 26 53 26 58 29.5L100 60Z" />
            </svg>
          </div>
          <div data-seal aria-hidden className="ad-env-seal absolute grid place-items-center rounded-full bg-brand text-[3.8cqw] font-semibold text-brand-ink shadow-sel">
            {initial}
          </div>
        </div>

        {phase === "sent" && (
          <p role="status" className="ad-env-done absolute inset-0 grid place-items-center text-title font-semibold text-ink">
            <span className="flex items-center gap-2">
              <span aria-hidden className="size-[7px] rounded-full bg-success" />
              <span translate="no">Sent to {customer}</span>
            </span>
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button variant="primary" disabled={phase !== "idle"} className={cn("w-[136px]", TOUCH)} onClick={send}>
          <Send strokeWidth={1.75} />
          {phase === "sending" ? "Sending…" : "Send invoice"}
        </Button>
      </div>
    </div>
  );
}
