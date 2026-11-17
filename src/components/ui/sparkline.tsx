import * as React from "react";
import { cn } from "@/lib/ad";

export interface SparklineProps {
  data: number[];
  kind?: "line" | "bars";
  width?: number;
  height?: number;
  /** Mark the last point. */
  dot?: boolean;
  className?: string;
  "aria-label"?: string;
}

/** A word-sized chart in the accent shade. No axes, no grid. Sits beside a number. */
export function Sparkline({ data, kind = "line", width = 96, height = 28, dot = true, className, ...aria }: SparklineProps) {
  const id = React.useId();
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = 2.5;
  const x = (i: number) => pad + (i * (width - pad * 2)) / Math.max(1, data.length - 1);
  const y = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2);
  if (kind === "bars") {
    const gap = 2;
    const w = (width - gap * (data.length - 1)) / data.length;
    return (
      <svg role="img" aria-label={aria["aria-label"]} width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={cn("shrink-0 overflow-visible", className)}>
        {data.map((v, i) => {
          const h = Math.max(2, ((v - Math.min(0, min)) / (max - Math.min(0, min) || 1)) * height);
          return <rect key={i} x={i * (w + gap)} y={height - h} width={w} height={h} rx={Math.min(w / 2, 1.5)} fill={i === data.length - 1 ? "var(--ad-chart-1)" : "var(--ad-chart-3)"} />;
        })}
      </svg>
    );
  }
  const d = data.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const last = data.length - 1;
  return (
    <svg role="img" aria-label={aria["aria-label"]} width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={cn("shrink-0 overflow-visible", className)}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--ad-chart-1)" stopOpacity="0.22" />
          <stop offset="1" stopColor="var(--ad-chart-1)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${x(last)} ${height} L${x(0)} ${height} Z`} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke="var(--ad-chart-1)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      {dot ? <circle cx={x(last)} cy={y(data[last])} r="2.5" fill="var(--ad-chart-1)" /> : null}
    </svg>
  );
}
