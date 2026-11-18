import { CartesianChart, type CartesianChartProps } from "@/components/ui/chart";

export type AreaChartProps = Omit<CartesianChartProps, "kind">;

/**
 * A line chart with a soft wash under each line (about 14%, never a solid block). `stacked` piles the series up to
 * show a total and its parts. Same axis, tooltip and legend as the line chart.
 */
export function AreaChart(props: AreaChartProps) {
  return <CartesianChart {...props} kind="area" />;
}
