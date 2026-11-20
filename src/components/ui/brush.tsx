import * as React from "react";
import { cn } from "@/lib/ad";

export interface Brush {
  /** The row or point being pointed at, in either view. */
  point: number | null;
  /** The series (column) being pointed at, in either view. */
  series: string | null;
  setPoint: (i: number | null) => void;
  setSeries: (key: string | null) => void;
  /** Spread on a LineChart or AreaChart: it shows the linked point and series and reports its own hover. */
  chart: { active: number | null; onActiveChange: (i: number | null) => void; activeSeries: string | null; onActiveSeriesChange: (key: string | null) => void };
  /** Spread on the table row for point i (a TRow): hovering or focusing it lights up the chart, and it lights up back. */
  row: (i: number) => { onPointerEnter: () => void; onPointerLeave: (e: React.PointerEvent) => void; onFocus: () => void; onBlur: () => void; "data-brushed"?: true; className?: string };
  /** Spread on a column header (TH content or a span in it) for series `key`. */
  head: (key: string) => { onPointerEnter: () => void; onPointerLeave: () => void };
  /** Class for a cell of series `key`: the linked column stays ink, the others fade back (no weight change, so nothing shifts). */
  cell: (key: string) => string;
}

/**
 * Brushing and linking: one hover state shared by a chart and a table, so pointing at a day on the chart lights up its
 * row, a row moves the chart's crosshair, and a series (legend item, line, column header) emphasises its column and its
 * line together. Fills only: no outlines. Keyboard focus on a row links the same way.
 */
export function useBrush(): Brush {
  const [point, setPoint] = React.useState<number | null>(null);
  const [series, setSeries] = React.useState<string | null>(null);
  return {
    point,
    series,
    setPoint,
    setSeries,
    chart: { active: point, onActiveChange: setPoint, activeSeries: series, onActiveSeriesChange: setSeries },
    row: (i) => ({
      onPointerEnter: () => setPoint(i),
      // On touch a tap keeps the link (the finger lifting isn't leaving); tapping another row moves it.
      onPointerLeave: (e) => e.pointerType === "mouse" && setPoint((p) => (p === i ? null : p)),
      onFocus: () => setPoint(i),
      onBlur: () => setPoint((p) => (p === i ? null : p)),
      ...(point === i ? { "data-brushed": true as const, className: "[&>td]:bg-fill" } : {}),
    }),
    head: (key) => ({ onPointerEnter: () => setSeries(key), onPointerLeave: () => setSeries((s) => (s === key ? null : s)) }),
    // The other columns step down to muted ink, never to a faded opacity: their numbers must stay readable (4.5:1).
    cell: (key) => cn("transition-colors duration-[160ms] ease-ad", series != null && (series === key ? "text-ink" : "text-ink-muted")),
  };
}
