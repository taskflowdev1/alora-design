import { CartesianChart, type CartesianChartProps } from "@/components/ui/chart";

export type LineChartProps = Omit<CartesianChartProps, "kind" | "stacked" | "fill">;

/**
 * Change over time: 2 px lines in accent shades, an end dot, round clean ticks on one axis, a crosshair tooltip that
 * lists every series, and a legend from two series up. Arrow keys move the crosshair.
 */
export function LineChart(props: LineChartProps) {
  return <CartesianChart {...props} kind="line" />;
}
