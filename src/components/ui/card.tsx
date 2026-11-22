import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "react-feather";
import { cn, formatCompact, formatNumber, skeletonFill, skeletonText } from "@/lib/ad";
import { Tooltip } from "@/components/ui/tooltip";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Clickable cards lift slightly on hover. */
  interactive?: boolean;
  /** "pad" for content, "nest" when the card holds soft rows or a table (keeps inner radii concentric). */
  inset?: "pad" | "nest" | "none";
}

export function Card({ interactive, inset = "pad", className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card bg-surface shadow-card",
        inset === "pad" && "p-pad",
        inset === "nest" && "p-[calc(var(--ad-nest)*2)]",
        interactive && "cursor-pointer transition-[translate,scale,box-shadow] duration-[150ms] ease-ad hover:-translate-y-0.5 hover:shadow-raised focus-visible:-translate-y-0.5 focus-visible:shadow-raised active:scale-[0.99]",
        className,
      )}
      {...props}
    />
  );
}

/** Title row: the title and, at most, one control. No subtitle. */
export function CardHeader({ title, action, className }: { title: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-h-control items-center justify-between gap-3", className)}>
      <h3 className="truncate text-title font-semibold text-ink">{title}</h3>
      {action}
    </div>
  );
}

export type MetricVariant = "tile" | "scale" | "compact" | "hero";

export interface MetricCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  label: React.ReactNode;
  /** A number (formatted for you, id-ID grouping) or ready text such as "Rp 48.240.000". */
  value: number | string;
  /** Unit before the number, e.g. "Rp". Shown smaller and muted. */
  unit?: string;
  /** Change against the previous period, shown beside the number, e.g. "9,7%". */
  delta?: { value: React.ReactNode; direction: "up" | "down" };
  /** The one card that matters most may be highlighted. */
  primary?: boolean;
  interactive?: boolean;
  /**
   * How short (1–2 digit) and long values are drawn:
   * - "tile" (default): a short value sits big in a soft square tile beside its label; a long value stays on one line with a muted unit.
   * - "scale": a short value grows to fill the card's height; a long value mutes its trailing zero groups.
   * - "compact": a short value is a round count beside the label; a long value is shortened ("Rp 48,2 jt") with the exact value on hover.
   * - "hero": the one figure that leads a card. No surface of its own (put it in a Card); the number is sized to the
   *   card's width and always fits (pass fitTo when the value changes), the unit small and grey, the change a soft pill beside the label.
   */
  variant?: MetricVariant;
  /** Force the short or long treatment. By default: two digits or fewer is short. */
  short?: boolean;
  /** Hero: the longest value this card can show, so every value keeps one size and fits. Defaults to the current value. */
  fitTo?: number | string;
  /** Pulse in place while loading; the card keeps its size. */
  loading?: boolean;
}

/** Height every metric card shares, so a row of short and long cards lines up. */
const METRIC_H = "calc(var(--ad-pad)*2 + var(--ad-text-body)*1.45 + 4px + var(--ad-text-number)*1.15)";

const groups = (v: number) => formatNumber(Math.round(v));

/** "48,2 jt", "1,2 M", "154 rb" (the card's unit goes in front). */
export function compactNumber(v: number) {
  return formatCompact(v);
}

function isShort(value: number | string) {
  if (typeof value === "number") return Math.abs(value) < 100 && Number.isInteger(value);
  return value.replace(/[^\d]/g, "").length <= 2 && value.trim().length <= 3;
}

/** A loading value. onFill: it sits on a filled square. onInk: it sits on a primary (ink) card. */
function Pulse({ loading, onFill, onInk, children }: { loading?: boolean; onFill?: boolean; onInk?: boolean; children: React.ReactNode }) {
  if (!loading) return <>{children}</>;
  return <span className={onInk ? "ad-skel after:bg-fill" : skeletonText(onFill)}>{children}</span>;
}

// Rough width in em at the hero's weight and tracking: tabular digits, narrow separators, the small unit before them.
const heroEm = (text: string, unit?: string) =>
  [...text].reduce((w, c) => w + (/\d/.test(c) ? 0.6 : /[.,:'\s]/.test(c) ? 0.27 : 0.68), 0) + (unit ? unit.length * 0.23 + 0.16 : 0);

// Secondary text on an ink-filled (primary) card: the page's muted grey would sit at about 2:1 there, so it takes the
// pale ramp step on the far side instead.
const mutedOn = (primary?: boolean) => (primary ? "text-fill-strong" : "text-ink-muted");

function Delta({ delta, primary }: { delta: NonNullable<MetricCardProps["delta"]>; primary?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5 whitespace-nowrap text-body tabular-nums", mutedOn(primary))}>
      {delta.direction === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
      {delta.value}
    </span>
  );
}

/** As wide as its number needs, never stretched. Short and long numbers each get their own treatment. */
export function MetricCard({ label, value, unit, delta, primary, interactive, variant = "tile", short, fitTo, loading, className, style, ...props }: MetricCardProps) {
  const text = typeof value === "number" ? groups(value) : value;
  if (variant === "hero") {
    const longest = fitTo == null ? text : typeof fitTo === "number" ? groups(fitTo) : fitTo;
    return (
      <div className={cn("@container grid min-w-0 grid-cols-[minmax(0,1fr)] gap-1", className)} style={style} {...props}>
        <div className="flex min-h-6 items-center justify-between gap-3">
          <span className="truncate text-body text-ink-muted">{label}</span>
          {delta ? (
            <span
              data-shape="round"
              aria-busy={loading || undefined}
              className={cn(
                "inline-flex h-6 items-center gap-0.5 whitespace-nowrap rounded-full px-bubble-sm text-small font-medium tabular-nums",
                loading
                  ? cn(skeletonFill(), "text-transparent")
                  : primary && delta.direction === "up"
                    ? "bg-brand-soft text-brand-soft-ink"
                    : "bg-fill text-ink",
              )}
            >
              {delta.direction === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {delta.value}
            </span>
          ) : null}
        </div>
        {/* Sized to the card and to the longest value it can show: it always fits, and switching values moves nothing. */}
        <span
          className="block whitespace-nowrap font-semibold leading-none tracking-[-0.035em] text-ink tabular-nums"
          style={{ fontSize: `min(72px, 15cqi, calc(100cqi / ${heroEm(longest, unit).toFixed(2)}))` }}
        >
          {/* The unit sits on the number.s baseline, small and muted, so it reads "Rp 48.240.000" (a raised unit read as a footnote). */}
          {unit ? <span className="mr-[0.22em] text-[length:0.34em] font-medium tracking-normal text-ink-muted">{unit}</span> : null}
          <Pulse loading={loading}>{text}</Pulse>
        </span>
      </div>
    );
  }
  const isShortValue = short ?? isShort(value);
  const muted = mutedOn(primary);
  const labelEl = <span className={cn("whitespace-nowrap text-body", muted)}>{label}</span>;
  const unitEl = unit ? <span className={cn("mr-1 text-title font-medium", muted)}>{unit}</span> : null;
  const shell = (inner: React.ReactNode, cls?: string) => (
    <Card
      interactive={interactive}
      inset="none"
      style={{ ...style, ["--ad-metric-h" as string]: METRIC_H }}
      className={cn(
        "inline-flex h-[var(--ad-metric-h)] w-fit shrink-0",
        primary && "bg-on text-on-ink [--ad-ink:var(--ad-on-ink)] [--ad-fill:var(--ad-ink-muted)]",
        cls,
        className,
      )}
      {...props}
    >
      {inner}
    </Card>
  );

  if (isShortValue && variant === "tile") {
    return shell(
      <>
        <span className="grid aspect-square h-full place-items-center rounded-control bg-fill px-1 text-[calc(var(--ad-text-number)*1.3)] font-semibold leading-none tabular-nums">
          <Pulse loading={loading} onFill>{text}</Pulse>
        </span>
        <span className="flex min-w-0 flex-col justify-center gap-0.5 pr-[calc(var(--ad-pad)-var(--ad-nest))]">
          {labelEl}
          {delta ? <Delta delta={delta} primary={primary} /> : null}
        </span>
      </>,
      "items-stretch gap-3 p-nest",
    );
  }
  if (isShortValue && variant === "scale") {
    return shell(
      <>
        <span className="flex flex-col justify-between">
          {labelEl}
          {delta ? <Delta delta={delta} primary={primary} /> : null}
        </span>
        <span className="text-[calc(var(--ad-metric-h)-var(--ad-pad)*2+6px)] font-semibold leading-[0.8] tracking-[-0.03em] tabular-nums">
          <Pulse loading={loading} onInk={primary}>{text}</Pulse>
        </span>
      </>,
      "items-end gap-5 p-pad",
    );
  }
  if (isShortValue && variant === "compact") {
    return shell(
      <>
        <span className="flex flex-col gap-0.5">
          {labelEl}
          {delta ? <Delta delta={delta} primary={primary} /> : null}
        </span>
        <span data-shape="round" className="grid size-10 shrink-0 place-items-center rounded-full bg-fill text-title font-semibold tabular-nums">
          <Pulse loading={loading} onFill>{text}</Pulse>
        </span>
      </>,
      "items-center gap-4 p-pad",
    );
  }

  // Long values
  let digits: React.ReactNode = text;
  let title: string | undefined;
  if (variant === "scale") {
    const m = /^(.*?)((?:\.0{3})+)$/.exec(text);
    if (m) digits = (<>{m[1]}<span className={muted}>{m[2]}</span></>);
  } else if (variant === "compact" && typeof value === "number") {
    digits = compactNumber(value);
    title = `${unit ? `${unit}\u00a0` : ""}${text}`;
  }
  const body = (
    <span className="flex flex-col justify-center gap-1">
      {labelEl}
      <span className="flex items-baseline gap-2 whitespace-nowrap">
        <span className="text-number font-semibold tabular-nums">
          <Pulse loading={loading} onInk={primary}>
            {unitEl}
            {digits}
          </Pulse>
        </span>
        {delta ? <Delta delta={delta} primary={primary} /> : null}
      </span>
    </span>
  );
  // The exact value of a shortened number shows in the house tooltip, never the browser's title box.
  return shell(title ? <Tooltip content={title}>{body}</Tooltip> : body, "min-w-36 p-pad");
}
