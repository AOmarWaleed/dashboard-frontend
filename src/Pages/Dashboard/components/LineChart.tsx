import { useCallback, useMemo, useRef } from "react";
import { Box, type SxProps, type Theme } from "@mui/material";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReactNode } from "react";
import type { TooltipProps } from "recharts/types/component/Tooltip";
import type { Margin } from "recharts/types/util/types";
import type { CurveType } from "recharts/types/shape/Curve";

type ChartDate = Record<string, unknown>;

interface LineChartProps<T extends ChartDate> {
  data: T[];
  xKey: keyof T;
  yKey: keyof T;
  onPointHover?: (point: T | null) => void;
  height?: number;
  lineType?: CurveType;
  xAxisLabel?: string;
  yAxisLabel?: string;
  xAxisHeight?: number;
  containerSx?: SxProps<Theme>;
  showGrid?: boolean;
  xTickFormatter?: (value: T[keyof T]) => string;
  yTickFormatter?: (value: number) => string;
  tooltipContent?: (payload: T) => ReactNode;
  margin?: Margin;
  strokeWidth?: number;
  disableAnimation?: boolean;
  cursorStroke?: string;
  lineColor?: string;
  showDots?: boolean;
  yDomain?: [number, number];
}

const RejectionAnalysisChart = <T extends ChartDate>({
  data,
  xKey,
  yKey,
  onPointHover,
  height = 400,
  lineColor = "skyblue",
  lineType = "monotone",
  xAxisLabel,
  yAxisLabel,
  xAxisHeight = 60,
  containerSx,
  showGrid = true,
  xTickFormatter,
  yTickFormatter,
  tooltipContent,
  margin = { top: 30, right: 40, left: 10, bottom: 5 },
  strokeWidth = 2,
  disableAnimation = true,
  cursorStroke = "rgba(0, 0, 0, 0.1)",
  showDots = false,
  yDomain,
}: LineChartProps<T>) => {
  const lastHoveredIndex = useRef<number | null>(null);

  const getNumericValue = useCallback(
    (date: T) => {
      const rawValue = date[yKey];
      if (typeof rawValue === "number") {
        return Number.isFinite(rawValue) ? rawValue : 0;
      }
      const parsed = Number(rawValue);
      return Number.isFinite(parsed) ? parsed : 0;
    },
    [yKey],
  );

  const maxY = useMemo(() => {
    if (!data.length) {
      return 0;
    }
    return data.reduce((currentMax, date) => {
      const value = getNumericValue(date);
      return value > currentMax ? value : currentMax;
    }, 0);
  }, [data, getNumericValue]);

  const computedDomain = useMemo<[number, number]>(() => {
    if (yDomain) {
      return yDomain;
    }
    const upperBound = maxY === 0 ? 1 : maxY;
    return [0, upperBound];
  }, [maxY, yDomain]);

  const xDataKey = xKey as string;
  const yDataKey = yKey as string;

  const renderTooltip = useCallback(
    (props: TooltipProps<number, string>) => {
      if (!props.active || !props.payload || props.payload.length === 0) {
        return null;
      }

      const rawPayload = props.payload[0]?.payload as T | undefined;
      if (!rawPayload) {
        return null;
      }

      if (tooltipContent) {
        return <>{tooltipContent(rawPayload)}</>;
      }

      const xValue = rawPayload[xKey];
      const yValue = getNumericValue(rawPayload);

      const formattedX = xTickFormatter
        ? xTickFormatter(xValue)
        : xValue === undefined || xValue === null
          ? ""
          : String(xValue);

      const formattedY = yTickFormatter
        ? yTickFormatter(yValue)
        : yValue.toString();

      return (
        <div
          style={{
            backgroundColor: "#fff",
            padding: "10px",
            border: "1px solid #ccc",
          }}
        >
          <p>{`${xAxisLabel ?? xDataKey}: ${formattedX}`}</p>
          <p>{`${yAxisLabel ?? yDataKey}: ${formattedY}`}</p>
        </div>
      );
    },
    [
      getNumericValue,
      tooltipContent,
      xKey,
      xAxisLabel,
      xDataKey,
      xTickFormatter,
      yAxisLabel,
      yDataKey,
      yTickFormatter,
    ],
  );

  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseMove = useCallback(
    (state: any) => {
      if (!onPointHover) {
        return;
      }

      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }

      hoverTimeoutRef.current = setTimeout(() => {
        hoverTimeoutRef.current = null;

        const payload = state?.activePayload?.[0]?.payload as T | undefined;
        const currentIndex =
          typeof state?.activeTooltipIndex === "number"
            ? state.activeTooltipIndex
            : null;

        if (payload && currentIndex !== null) {
          if (currentIndex !== lastHoveredIndex.current) {
            lastHoveredIndex.current = currentIndex;
            onPointHover(payload);
          }
          return;
        }

        if (lastHoveredIndex.current !== null) {
          lastHoveredIndex.current = null;
          onPointHover(null);
        }
      }, 60);
    },
    [onPointHover],
  );

  const handleMouseLeave = useCallback(() => {
    if (!onPointHover) {
      return;
    }
    lastHoveredIndex.current = null;
    onPointHover(null);
  }, [onPointHover]);

  return (
    <Box sx={{ ...(containerSx || {}) }}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={margin}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis
            dataKey={xDataKey}
            height={xAxisHeight}
            label={
              xAxisLabel
                ? { value: xAxisLabel, position: "insideBottom" }
                : undefined
            }
            tickFormatter={(value) =>
              xTickFormatter
                ? xTickFormatter(value as T[keyof T])
                : (value ?? "").toString()
            }
            angle={-45}
            tick={{ textAnchor: "end" }}
          />
          <YAxis
            yAxisId="left"
            label={
              yAxisLabel
                ? { value: yAxisLabel, angle: -90, position: "insideLeft" }
                : undefined
            }
            stroke="#000000"
            domain={computedDomain}
            tickFormatter={(value) => {
              const numericValue = Number(value);
              if (yTickFormatter && Number.isFinite(numericValue)) {
                return yTickFormatter(numericValue);
              }
              return Number.isFinite(numericValue)
                ? numericValue.toString()
                : (value ?? "").toString();
            }}
          />
          <Line
            yAxisId="left"
            type={lineType}
            dataKey={yDataKey}
            stroke={lineColor}
            strokeWidth={strokeWidth}
            dot={showDots}
            isAnimationActive={!disableAnimation}
          />
          <Tooltip
            cursor={{ stroke: cursorStroke, strokeWidth: 2 }}
            content={renderTooltip}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default RejectionAnalysisChart;
export type { LineChartProps };
