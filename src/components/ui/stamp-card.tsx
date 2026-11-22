import * as React from "react";
import { Coffee, Plus, RotateCcw } from "react-feather";
import { cn, prefersReducedMotion } from "@/lib/ad";
import { Button } from "@/components/ui/button";

/** The stamper's trip, and how far into it the rubber meets the paper. */
const STAMP_MS = 380;
const IMPACT = 0.42;
/** A beat after the last stamp lands before the card turns over. */
const FLIP_AFTER = 560;
/** Each print sits a little crooked, the same way every time. */
const CROOKED = [-8, 5, -3, 9, -6, 4, 11, -9, 2, -5, 7, -2];

const CSS = `
.ad-stampc { container-type: inline-size; }
.ad-stampc-lift { perspective: 1200px; }
.ad-stampc-turn { transform-style: preserve-3d; transition: transform 620ms cubic-bezier(0.3, 0.75, 0.2, 1); }
.ad-stampc[data-flipped="true"] .ad-stampc-turn { transform: rotateY(180deg); }
.ad-stampc-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
.ad-stampc-back { transform: rotateY(180deg); }
.ad-stampc-print { opacity: 0; }
.ad-stampc-print[data-inked="true"] { opacity: 1; animation: ad-stampc-ink ${STAMP_MS}ms linear both; }
.ad-stampc-print[data-inked="still"] { opacity: 1; }
@keyframes ad-stampc-ink {
  0%, ${IMPACT * 100 - 0.1}% { opacity: 0; }
  ${IMPACT * 100}%, 100% { opacity: 1; }
}
.ad-stampc-head { opacity: 0; pointer-events: none; will-change: transform; }
`;

/** The shop's rubber stamp as it prints: a double circle around a cup. */
const StampPrint = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className} style={style}>
    <circle cx="32" cy="32" r="29" strokeWidth="3" />
    <circle cx="32" cy="32" r="24" strokeWidth="1.2" />
    <g transform="translate(18.5 19) scale(1.12)" strokeWidth="2">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <path d="M6 1v3M10 1v3M14 1v3" />
    </g>
  </svg>
);

export interface StampCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  shop?: string;
  /** How many stamps fill the card. */
  total?: number;
  /** Stamps already on the card. */
  defaultCount?: number;
  /** On the back of the card. */
  reward?: string;
  code?: string;
  actionLabel?: string;
  /** Fires with the new count after each stamp. */
  onStamp?: (count: number) => void;
  /** Fires when the last slot is stamped. */
  onComplete?: () => void;
}

/**
 * A coffee-shop loyalty card. Each purchase brings a rubber stamp down into the next slot with a thud the card feels;
 * the last one turns the whole card over to show the reward. Press the card or the button.
 */
export function StampCard({
  shop = "Rimba Kemang",
  total = 10,
  defaultCount = 7,
  reward = "Gratis 1 Gelas kopi tanah liat",
  code = "RIMBA-GRATIS",
  actionLabel = "Add purchase",
  onStamp,
  onComplete,
  className,
  ...props
}: StampCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const heads = React.useRef<(HTMLSpanElement | null)[]>([]);
  const timer = React.useRef(0);
  const inkId = `ad-stampc-${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [count, setCount] = React.useState(() => Math.min(defaultCount, total));
  // The slots stamped during this visit animate; the ones it came with are simply there.
  const [fresh, setFresh] = React.useState<number[]>([]);
  const [flipped, setFlipped] = React.useState(() => defaultCount >= total);

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const stamp = () => {
    if (count >= total || flipped) return;
    const slot = count;
    const next = count + 1;
    setCount(next);
    setFresh((f) => [...f, slot]);
    onStamp?.(next);
    const calm = prefersReducedMotion();
    if (!calm) {
      const tilt = CROOKED[slot % CROOKED.length];
      heads.current[slot]?.animate(
        [
          { transform: `translateY(-30px) scale(1.2) rotate(${tilt}deg)`, opacity: 0, easing: "cubic-bezier(0.55, 0, 0.9, 0.4)" },
          { transform: `translateY(-16px) scale(1.12) rotate(${tilt}deg)`, opacity: 1, offset: 0.14, easing: "cubic-bezier(0.55, 0, 0.9, 0.4)" },
          { transform: `translateY(0) scale(1) rotate(${tilt}deg)`, opacity: 1, offset: IMPACT },
          { transform: `translateY(0) scale(0.97) rotate(${tilt}deg)`, opacity: 1, offset: IMPACT + 0.12, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" },
          { transform: `translateY(-24px) scale(1.14) rotate(${tilt}deg)`, opacity: 0 },
        ],
        { duration: STAMP_MS },
      );
      cardRef.current?.animate(
        [
          { transform: "translateY(0) scale(1)", easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" },
          { transform: "translateY(2px) scale(0.988)", offset: 0.22, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" },
          { transform: "translateY(0) scale(1)" },
        ],
        { duration: 240, delay: STAMP_MS * IMPACT },
      );
    }
    if (next >= total) {
      onComplete?.();
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setFlipped(true), calm ? 0 : FLIP_AFTER);
    }
  };

  const reset = () => {
    window.clearTimeout(timer.current);
    setFlipped(false);
    // Cleared while the back is still facing us, so the front comes round empty.
    setCount(0);
    setFresh([]);
  };

  const full = count >= total;

  return (
    <div className={cn("grid w-full justify-items-center gap-6", className)} {...props}>
      <style href="ad-stamp-card" precedence="default">
        {CSS}
      </style>
      <svg aria-hidden width="0" height="0" className="absolute">
        {/* A rubber stamp never prints solid: speckle the ink and rough its edge a little. */}
        <filter id={inkId} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 2.1" result="holes" />
          <feComposite in="SourceGraphic" in2="holes" operator="in" result="inked" />
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="9" result="warp" />
          <feDisplacementMap in="inked" in2="warp" scale="1.6" />
        </filter>
      </svg>
      <div className="ad-stampc w-full" data-flipped={flipped}>
        <div ref={cardRef} className="ad-stampc-lift w-full">
          <div className="ad-stampc-turn relative aspect-[1.62] w-full">
            <div
              onClick={stamp}
              className={cn("ad-stampc-face absolute inset-0 grid grid-rows-[auto_1fr] gap-pad rounded-card bg-surface p-pad shadow-raised select-none", !full && "cursor-pointer")}
            >
              <div className="flex items-center justify-between gap-4 text-body">
                <span className="truncate font-semibold">{shop}</span>
                <span className="shrink-0 tabular-nums text-ink-muted">
                  {count}/{total}
                </span>
              </div>
              <div className="grid min-h-0 place-items-center" style={{ gridTemplateColumns: `repeat(${Math.ceil(total / 2)}, minmax(0, 1fr))` }}>
                {Array.from({ length: total }, (_, slot) => slot).map((slot) => {
                  const inked = slot < count;
                  const tilt = CROOKED[slot % CROOKED.length];
                  return (
                    <div key={`slot-${slot + 1}`} className="relative grid aspect-square w-[min(88%,calc((61.7cqw-96px)/2))] place-items-center rounded-full bg-fill text-small tabular-nums text-ink-muted">
                      <span className={cn(inked && "opacity-0")}>{slot + 1}</span>
                      <span
                        aria-hidden
                        data-inked={!inked ? "false" : fresh.includes(slot) ? "true" : "still"}
                        className="ad-stampc-print absolute inset-[4%] text-brand-soft-ink"
                        style={{ filter: `url(#${inkId})`, rotate: `${tilt}deg` }}
                      >
                        <StampPrint className="block size-full" />
                      </span>
                      <span
                        ref={(el) => {
                          heads.current[slot] = el;
                        }}
                        aria-hidden
                        className="ad-stampc-head absolute inset-[-3%] z-10 grid place-items-center rounded-full bg-on text-on-ink shadow-dialog"
                      >
                        <Coffee size={16} strokeWidth={1.75} />
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div aria-hidden={!flipped} className="ad-stampc-face ad-stampc-back absolute inset-0 grid content-between overflow-hidden rounded-card bg-fill-strong p-pad text-ink shadow-raised">
              <StampPrint className="absolute right-[6%] top-1/2 w-[36%] -translate-y-1/2 -rotate-12 text-brand-soft-ink" style={{ filter: `url(#${inkId})` }} />
              <span className="truncate text-body font-semibold">{shop}</span>
              <p className="relative max-w-[56%] text-[length:clamp(22px,6.4cqw,30px)] font-semibold leading-[1.12] tracking-[-0.02em]">{reward}</p>
              <span className="text-body font-medium tabular-nums">{code}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="grid h-control place-items-center">
        {flipped ? (
          <Button variant="secondary" onClick={reset}>
            <RotateCcw strokeWidth={1.75} />
            New card
          </Button>
        ) : (
          <Button variant="primary" onClick={stamp} disabled={full}>
            <Plus strokeWidth={1.75} />
            {actionLabel}
          </Button>
        )}
      </div>
      <span aria-live="polite" className="sr-only">
        {flipped ? `Card full. ${reward}, code ${code}` : `${count} of ${total} stamps`}
      </span>
    </div>
  );
}
