import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "react-feather";
import { cn } from "@/lib/ad";

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
        interactive && "cursor-pointer transition-[transform,box-shadow] duration-[220ms] ease-ad hover:-translate-y-0.5 hover:shadow-raised active:scale-[0.99]",
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

export type MetricVariant = "tile" | "scale" | "compact";

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
   */
  variant?: MetricVariant;
  /** Force the short or long treatment. By default: two digits or fewer is short. */
  short?: boolean;
  /** Pulse in place while loading; the card keeps its size. */
  loading?: boolean;
}

/** Height every metric card shares, so a row of short and long cards lines up. */
const METRIC_H = "calc(var(--ad-pad)*2 + var(--ad-text-body)*1.45 + 4px + var(--ad-text-number)*1.15)";

const groups = (v: number) => Math.round(v).toLocaleString("id-ID");

/** "Rp 48,2 jt", "Rp 1,2 M", "Rp 154 rb". */
export function compactNumber(v: number) {
  const abs = Math.abs(v);
  const f = (n: number, s: string) => `${n.toLocaleString("id-ID", { maximumFractionDigits: Math.abs(n) < 100 ? 1 : 0 })} ${s}`;
  if (abs >= 1e9) return f(v / 1e9, "M");
  if (abs >= 1e6) return f(v / 1e6, "jt");
  if (abs >= 1e4) return f(v / 1e3, "rb");
  return groups(v);
}

function isShort(value: number | string) {
  if (typeof value === "number") return Math.abs(value) < 100 && Number.isInteger(value);
  return value.replace(/[^\d]/g, "").length <= 2 && value.trim().length <= 3;
}

function Pulse({ loading, children }: { loading?: boolean; children: React.ReactNode }) {
  if (!loading) return <>{children}</>;
  return <span className="animate-[ad-pulse_1.6s_ease-in-out_infinite] rounded-small bg-ink/8 text-transparent [box-decoration-break:clone] select-none">{children}</span>;
}

function Delta({ delta, primary }: { delta: NonNullable<MetricCardProps["delta"]>; primary?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5 whitespace-nowrap text-body tabular-nums", primary ? "text-on-ink/70" : "text-ink-muted")}>
      {delta.direction === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
      {delta.value}
    </span>
  );
}

/** As wide as its number needs, never stretched. Short and long numbers each get their own treatment. */
export function MetricCard({ label, value, unit, delta, primary, interactive, variant = "tile", short, loading, className, style, ...props }: MetricCardProps) {
  const isShortValue = short ?? isShort(value);
  const text = typeof value === "number" ? groups(value) : value;
  const muted = primary ? "text-on-ink/70" : "text-ink-muted";
  const labelEl = <span className={cn("whitespace-nowrap text-body", muted)}>{label}</span>;
  const unitEl = unit ? <span className={cn("mr-1 text-title font-medium", muted)}>{unit}</span> : null;
  const shell = (inner: React.ReactNode, cls?: string) => (
    <Card
      interactive={interactive}
      inset="none"
      style={{ ...style, ["--ad-metric-h" as string]: METRIC_H }}
      className={cn(
        "inline-flex h-[var(--ad-metric-h)] w-fit shrink-0",
        primary && "bg-on text-on-ink [--ad-ink:var(--ad-on-ink)] [--ad-fill:color-mix(in_oklab,var(--ad-on-ink)_12%,transparent)]",
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
          <Pulse loading={loading}>{text}</Pulse>
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
          <Pulse loading={loading}>{text}</Pulse>
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
          <Pulse loading={loading}>{text}</Pulse>
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
    title = `${unit ? `${unit} ` : ""}${text}`;
  }
  return shell(
    <span className="flex flex-col justify-center gap-1" title={title}>
      {labelEl}
      <span className="flex items-baseline gap-2 whitespace-nowrap">
        <span className="text-number font-semibold tabular-nums">
          <Pulse loading={loading}>
            {unitEl}
            {digits}
          </Pulse>
        </span>
        {delta ? <Delta delta={delta} primary={primary} /> : null}
      </span>
    </span>,
    "min-w-36 p-pad",
  );
}
