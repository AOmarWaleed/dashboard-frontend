/**
 * Shared prop types for the validation-dashboard timeline charts.
 *
 * `TimelineRow` is intentionally loose: rows come straight from the API and
 * each series adds its own keys ("new", "claim", "pre-auth", ...).
 */
export type TimelineRow = Record<string, string | number>;

export interface TimelineChartProps {
  chartData: TimelineRow[];
  dataKey: string;
}
