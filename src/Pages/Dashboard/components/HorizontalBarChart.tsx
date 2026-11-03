import { useCallback, useMemo, useRef } from "react";
import { Box, type SxProps, type Theme } from "@mui/material";
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import type { ReactNode } from "react";
import type { TooltipProps } from "recharts/types/component/Tooltip";
import type { Margin } from "recharts/types/util/types";

type ChartDatum = Record<string, unknown>;

interface HorizontalBarChartProps<T extends ChartDatum> {
    data: T[];
    categoryKey: keyof T;
    valueKey: keyof T;
    onBarHover?: (bar: T | null) => void;
    height?: number;
    barColor?: string;
    barSize?: number;
    containerSx?: SxProps<Theme>;
    showGrid?: boolean;
    xAxisLabel?: string;
    yAxisLabel?: string;
    xTickFormatter?: (value: number) => string;
    yTickFormatter?: (value: T[keyof T]) => string;
    tooltipContent?: (payload: T) => ReactNode;
    margin?: Margin;
    disableAnimation?: boolean;
    cursorFill?: string;
    xDomain?: [number, number];
}


const HorizontalBarChart = <T extends ChartDatum>({
    data,
    categoryKey,
    valueKey,
    onBarHover,
    height = 400,
    barColor = "#42a5f5",
    barSize,
    containerSx,
    showGrid = true,
    xAxisLabel,
    yAxisLabel,
    xTickFormatter,
    yTickFormatter,
    tooltipContent,
    margin = { top: 30, right: 40, left: 10, bottom: 10 },
    disableAnimation = true,
    cursorFill = "rgba(0, 0, 0, 0.05)",
    xDomain,
}: HorizontalBarChartProps<T>) => {
    const lastHoveredIndex = useRef<number | null>(null);

    const getNumericValue = useCallback(
        (datum: T) => {
            const rawValue = datum[valueKey];
            if (typeof rawValue === "number") {
                return Number.isFinite(rawValue) ? rawValue : 0;
            }
            const parsed = Number(rawValue);
            return Number.isFinite(parsed) ? parsed : 0;
        },
        [valueKey],
    );

    const maxValue = useMemo(() => {
        if (!data.length) {
            return 0;
        }
        return data.reduce((currentMax, datum) => {
            const value = getNumericValue(datum);
            return value > currentMax ? value : currentMax;
        }, 0);
    }, [data, getNumericValue]);

    const computedDomain = useMemo<[number, number]>(() => {
        if (xDomain) {
            return xDomain;
        }
        const upperBound = maxValue === 0 ? 1 : maxValue;
        return [0, upperBound];
    }, [maxValue, xDomain]);

    const categoryDataKey = categoryKey as string;
    const valueDataKey = valueKey as string;

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

            const categoryValue = rawPayload[categoryKey];
            const numericValue = getNumericValue(rawPayload);

            const formattedCategory = yTickFormatter
                ? yTickFormatter(categoryValue)
                : categoryValue === undefined || categoryValue === null
                    ? ""
                    : String(categoryValue);

            const formattedValue = xTickFormatter ? xTickFormatter(numericValue) : numericValue.toString();

            return (
                <div style={{ backgroundColor: "#fff", padding: "10px", border: "1px solid #ccc" }}>
                    <p>{`${yAxisLabel ?? categoryDataKey}: ${formattedCategory}`}</p>
                    <p>{`${xAxisLabel ?? valueDataKey}: ${formattedValue}`}</p>
                </div>
            );
        },
        [categoryKey, categoryDataKey, getNumericValue, tooltipContent, xAxisLabel, xTickFormatter, valueDataKey, yAxisLabel, yTickFormatter],
    );

    const handleMouseMove = useCallback(
        (state: any) => {
            if (!onBarHover) {
                return;
            }

            const payload = state?.activePayload?.[0]?.payload as T | undefined;
            const currentIndex = typeof state?.activeTooltipIndex === "number" ? state.activeTooltipIndex : null;

            if (payload && currentIndex !== null) {
                if (currentIndex !== lastHoveredIndex.current) {
                    lastHoveredIndex.current = currentIndex;
                    onBarHover(payload);
                }
                return;
            }

            if (lastHoveredIndex.current !== null) {
                lastHoveredIndex.current = null;
                onBarHover(null);
            }
        },
        [onBarHover],
    );

    const handleMouseLeave = useCallback(() => {
        if (!onBarHover) {
            return;
        }
        lastHoveredIndex.current = null;
        onBarHover(null);
    }, [onBarHover]);

    return (
        <Box sx={containerSx}>
            <ResponsiveContainer width="100%" height={height}>
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={margin}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    title="Test"
                >
                    {showGrid && <CartesianGrid strokeDasharray="3 3" horizontal={false} />}
                    <XAxis
                        type="number"
                        domain={computedDomain}
                        label={xAxisLabel ? { value: xAxisLabel, position: "insideBottom", offset: -5 } : undefined}
                        tickFormatter={(value) => {
                            const numericValue = Number(value);
                            if (xTickFormatter && Number.isFinite(numericValue)) {
                                return xTickFormatter(numericValue);
                            }
                            return Number.isFinite(numericValue)
                                ? numericValue.toString()
                                : (value ?? "").toString();
                        }}
                    />
                    <YAxis
                        type="category"
                        dataKey={categoryDataKey}
                        width={150}
                        label={
                            yAxisLabel
                                ? { value: yAxisLabel, angle: -90, position: "insideLeft" }
                                : undefined
                        }
                        tickFormatter={(value) => {
                            if (yTickFormatter) {
                                return yTickFormatter(value as T[keyof T]);
                            }
                            return value === undefined || value === null
                                ? ""
                                : String(value);
                        }}
                    />
                    <Bar
                        dataKey={valueDataKey}
                        fill={barColor}
                        barSize={barSize}
                        isAnimationActive={!disableAnimation}
                        
                    />
                    <Tooltip cursor={{ fill: cursorFill }} content={renderTooltip} />
                </BarChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default HorizontalBarChart;
export type { HorizontalBarChartProps };
