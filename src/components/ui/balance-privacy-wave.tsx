import * as React from "react";
import { Eye, EyeOff } from "react-feather";
import { cn, formatNumber } from "@/lib/ad";
import { Button } from "@/components/ui/button";

/** Between two characters of the wave: the big number, then the small ones running alongside it. */
const STEP = 32;
const DETAIL_STEP = 18;
const DETAIL_START = 80;
const MS = 240;
/** The dot follows its digit out (and leads it back in) by this much. */
const LAG = 60;
/** Stands in for every digit once the wave has covered it, so the real number leaves the page. */
const MASK = "0";

/*
 * Every character is a slot of its digit's width holding two layers: the digit and a round dot. Hiding lifts and
 * blurs each digit away as its dot springs in, slot by slot from the left; showing runs from the right, the dot
 * leaving first. Separators fade, so a hidden balance reads as groups of dots. The slot keeps its width, so nothing
 * moves.
 */
const CSS = `
.ad-wave-s { display: inline-grid; }
.ad-wave-s > * { grid-area: 1 / 1; }
.ad-wave-d {
  transition: opacity ${MS}ms var(--ad-ease), filter ${MS}ms var(--ad-ease), transform ${MS}ms var(--ad-ease);
  transition-delay: calc(var(--d) + ${LAG}ms);
}
.ad-wave-dot {
  place-self: center; width: 0.26em; height: 0.26em; border-radius: 999px; corner-shape: round; background: currentColor;
  opacity: 0; transform: scale(0.2);
  transition: opacity 160ms var(--ad-ease), transform ${MS}ms var(--ad-ease);
  transition-delay: var(--d);
}
.ad-wave[data-hidden="true"] .ad-wave-d { opacity: 0; filter: blur(4px); transform: translateY(-0.14em) scale(0.92); transition-delay: var(--d); }
.ad-wave[data-hidden="true"] .ad-wave-dot {
  opacity: 1; transform: none;
  transition: opacity 160ms var(--ad-ease), transform 340ms cubic-bezier(0.34, 1.56, 0.64, 1);
  transition-delay: calc(var(--d) + ${LAG}ms);
}
.ad-wave-sep { transition: opacity ${MS}ms var(--ad-ease); transition-delay: var(--d); }
.ad-wave[data-hidden="true"] .ad-wave-sep { opacity: 0; }
.ad-wave-eye { transition: opacity 160ms var(--ad-ease), scale 160ms var(--ad-ease), filter 160ms var(--ad-ease); }
.ad-wave-eye[data-on="false"] { opacity: 0; scale: 0.8; filter: blur(2px); }
@media (prefers-reduced-motion: reduce) {
  .ad-wave-d, .ad-wave-dot, .ad-wave-sep, .ad-wave-eye { transition: none !important; }
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
  /** Smaller figures under the balance; they hide with it. */
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
      {[...text].map((c, i) => {
        const style = { "--d": `${delay(i)}ms` } as React.CSSProperties;
        // The position is the identity here: a digit keeps its place while its value changes.
        if (!/\d/.test(c)) {
          return (
            <span key={i} className="ad-wave-sep" style={style}>
              {c}
            </span>
          );
        }
        return (
          <span key={i} className="ad-wave-s" style={style}>
            <span className="ad-wave-d">{masked ? MASK : c}</span>
            <span className="ad-wave-dot" />
          </span>
        );
      })}
    </span>
  );
}

/**
 * A balance with a privacy eye. Hiding turns it into dots digit by digit in a soft wave from the left, each digit
 * lifting away as its dot springs in; showing runs back from the right. Once hidden, the digits in the page are
 * swapped for a mask, so hidden means hidden for copy and for screen readers too.
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
  const [masked, setMasked] = React.useState(isHidden);

  const main = formatNumber(amount);
  const longestDetail = Math.max(0, ...details.map((d) => formatNumber(d.amount).length));
  const mainLast = main.length - 1;
  const detailLast = longestDetail - 1;
  const waveMs = Math.max(mainLast * STEP, DETAIL_START + detailLast * DETAIL_STEP) + LAG + MS;

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
    setOwn(!isHidden);
    onHiddenChange?.(!isHidden);
  };

  // Hiding runs left to right; showing runs right to left, from the other side.
  const mainDelay = (i: number) => (isHidden ? i : mainLast - i) * STEP;
  const detailDelay = (i: number) => DETAIL_START + (isHidden ? i : detailLast - i) * DETAIL_STEP;

  return (
    <div data-hidden={isHidden} className={cn("ad-wave grid min-w-0 gap-4", className)} {...props}>
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
      {/* The hero number of the metric card: the unit small and muted on the number's baseline. */}
      <p className="whitespace-nowrap text-[length:clamp(36px,13.5cqw,60px)] font-semibold leading-none tracking-[-0.035em] text-ink tabular-nums">
        <span className="mr-[0.22em] align-[0.7em] text-[length:0.34em] font-medium tracking-normal text-ink-muted">Rp</span>
        <span className="sr-only">{isHidden ? "Hidden" : main}</span>
        <Figure text={main} masked={masked} delay={mainDelay} />
      </p>
      {details.length > 0 && (
        <dl className="mt-2 grid grid-cols-2 gap-gap">
          {details.map((d) => (
            <div key={d.label} className="grid min-w-0 gap-1">
              <dt className="truncate text-body text-ink-muted">{d.label}</dt>
              <dd className="truncate text-title font-semibold tabular-nums tracking-[-0.01em] text-ink">
                <span className="mr-1 text-body font-medium tracking-normal text-ink-muted">Rp</span>
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
