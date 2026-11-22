import * as React from "react";
import { Eye, EyeOff } from "react-feather";
import { cn, formatNumber } from "@/lib/ad";
import { Button } from "@/components/ui/button";

/** Between two characters of the wave: the big number, then the small ones running alongside it. */
const STEP = 30;
const DETAIL_STEP = 16;
const DETAIL_START = 70;
const BLUR_MS = 240;
/** Stands in for every digit once the blur has covered it, so the real number leaves the page. */
const MASK = "0";

/*
 * Each character blurs on its own delay (--d). The small lift is a keyframe with two identical names: changing the name
 * is what restarts it, and it only runs once the eye has been used, so a page load is still.
 */
const CSS = `
.ad-wave-c {
  display: inline-block; filter: blur(0); opacity: 1;
  transition: filter ${BLUR_MS}ms var(--ad-ease) var(--d), opacity ${BLUR_MS}ms var(--ad-ease) var(--d);
}
.ad-wave[data-hidden="true"] .ad-wave-c { filter: blur(7px); opacity: 0.72; }
.ad-wave[data-played="true"][data-hidden="true"] .ad-wave-c { animation: ad-wave-a ${BLUR_MS}ms var(--ad-ease) var(--d); }
.ad-wave[data-played="true"][data-hidden="false"] .ad-wave-c { animation: ad-wave-b ${BLUR_MS}ms var(--ad-ease) var(--d); }
@keyframes ad-wave-a { 40% { transform: translateY(-2px); } }
@keyframes ad-wave-b { 40% { transform: translateY(-2px); } }
.ad-wave-eye { transition: opacity 160ms var(--ad-ease), scale 160ms var(--ad-ease), filter 160ms var(--ad-ease); }
.ad-wave-eye[data-on="false"] { opacity: 0; scale: 0.8; filter: blur(2px); }
@media (prefers-reduced-motion: reduce) {
  .ad-wave-c, .ad-wave-eye { transition: none !important; animation: none !important; }
}`;

export interface BalanceDetail {
  label: string;
  /** In rupiah. */
  amount: number;
}

export interface BalancePrivacyWaveProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  label?: string;
  /** The balance in rupiah. */
  amount?: number;
  /** Smaller figures under the balance; they blur with it. */
  details?: BalanceDetail[];
  /** Controlled: whether the figures are hidden. */
  hidden?: boolean;
  defaultHidden?: boolean;
  onHiddenChange?: (hidden: boolean) => void;
}

const DEFAULT_DETAILS: BalanceDetail[] = [
  { label: "In today", amount: 12480000 },
  { label: "Out today", amount: 3915000 },
];

/** Characters with their wave position; digits become the mask once `masked`, so the width never changes. */
function Figure({ text, masked, delay }: { text: string; masked: boolean; delay: (i: number) => number }) {
  return (
    <span aria-hidden>
      {[...text].map((c, i) => (
        // The position is the identity here: a digit keeps its place while its value changes.
        <span key={i} className="ad-wave-c" style={{ "--d": `${delay(i)}ms` } as React.CSSProperties}>
          {masked && /\d/.test(c) ? MASK : c}
        </span>
      ))}
    </span>
  );
}

/**
 * A balance with a privacy eye. Hiding blurs it digit by digit in a soft wave from the left, showing sharpens it from the
 * right. Once blurred, the digits in the page are swapped for a mask, so hidden means hidden for copy and for
 * screen readers too.
 */
export function BalancePrivacyWave({
  label = "Balance",
  amount = 48240000,
  details = DEFAULT_DETAILS,
  hidden,
  defaultHidden = false,
  onHiddenChange,
  className,
  ...props
}: BalancePrivacyWaveProps) {
  const [own, setOwn] = React.useState(defaultHidden);
  const isHidden = hidden ?? own;
  const [played, setPlayed] = React.useState(false);
  const [masked, setMasked] = React.useState(isHidden);

  const main = formatNumber(amount);
  const longestDetail = Math.max(0, ...details.map((d) => formatNumber(d.amount).length));
  const mainLast = main.length - 1;
  const detailLast = longestDetail - 1;
  const waveMs = Math.max(mainLast * STEP, DETAIL_START + detailLast * DETAIL_STEP) + BLUR_MS;

  // The real digits leave only after the wave has covered them, and come back the moment it turns around.
  React.useEffect(() => {
    if (!isHidden) {
      setMasked(false);
      return;
    }
    const t = window.setTimeout(() => setMasked(true), waveMs);
    return () => clearTimeout(t);
  }, [isHidden, waveMs]);

  const toggle = () => {
    setPlayed(true);
    setOwn(!isHidden);
    onHiddenChange?.(!isHidden);
  };

  // Hiding runs left to right; showing runs right to left, from the other side.
  const mainDelay = (i: number) => (isHidden ? i : mainLast - i) * STEP;
  const detailDelay = (i: number) => DETAIL_START + (isHidden ? i : detailLast - i) * DETAIL_STEP;

  return (
    <div data-hidden={isHidden} data-played={played} className={cn("ad-wave grid min-w-0 gap-3", className)} {...props}>
      <style href="ad-balance-privacy-wave" precedence="default">
        {CSS}
      </style>
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-body text-ink-muted">{label}</span>
        <Button variant="ghost" icon aria-label={isHidden ? "Show balance" : "Hide balance"} aria-pressed={isHidden} onClick={toggle} className="relative -my-1 -mr-1 grid after:absolute after:-inset-[6px] after:content-['']">
          <Eye size={16} strokeWidth={1.75} aria-hidden data-on={!isHidden} className="ad-wave-eye col-start-1 row-start-1" />
          <EyeOff size={16} strokeWidth={1.75} aria-hidden data-on={isHidden} className="ad-wave-eye col-start-1 row-start-1" />
        </Button>
      </div>
      <p className="flex min-w-0 items-baseline gap-2 whitespace-nowrap font-semibold tabular-nums tracking-[-0.03em] text-ink">
        <span className="text-title font-medium tracking-normal text-ink-muted">Rp</span>
        <span className="text-[length:clamp(34px,11cqw,52px)] leading-[1.1]">
          <span className="sr-only">{isHidden ? "Hidden" : main}</span>
          <Figure text={main} masked={masked} delay={mainDelay} />
        </span>
      </p>
      {details.length > 0 && (
        <dl className="mt-1 grid grid-cols-2 gap-gap">
          {details.map((d) => (
            <div key={d.label} className="grid min-w-0 gap-0.5">
              <dt className="truncate text-small text-ink-muted">{d.label}</dt>
              <dd className="truncate text-body font-medium tabular-nums text-ink">
                <span className="text-ink-muted">Rp </span>
                <span className="sr-only">{isHidden ? "Hidden" : formatNumber(d.amount)}</span>
                <Figure text={formatNumber(d.amount)} masked={masked} delay={detailDelay} />
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
