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

export interface MetricCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  label: React.ReactNode;
  value: React.ReactNode;
  /** Change against the previous period, shown beside the number, e.g. "9,7%". */
  delta?: { value: string; direction: "up" | "down" };
  /** The one card that matters most may be highlighted. */
  primary?: boolean;
  interactive?: boolean;
}

/** As wide as its number needs, never stretched. */
export function MetricCard({ label, value, delta, primary, interactive, className, ...props }: MetricCardProps) {
  return (
    <Card
      interactive={interactive}
      className={cn("inline-flex w-fit min-w-36 flex-col gap-1", primary && "bg-on text-on-ink", className)}
      {...props}
    >
      <span className={cn("whitespace-nowrap text-body", primary ? "text-on-ink/70" : "text-ink-muted")}>{label}</span>
      <span className="flex items-baseline gap-2 whitespace-nowrap">
        <span className="text-number font-semibold tabular-nums">{value}</span>
        {delta ? (
          <span className={cn("inline-flex items-center gap-0.5 text-body tabular-nums", primary ? "text-on-ink/70" : "text-ink-muted")}>
            {delta.direction === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {delta.value}
          </span>
        ) : null}
      </span>
    </Card>
  );
}
