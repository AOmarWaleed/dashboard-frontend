import { Box } from "@mui/material";
import GenericTable from "./GenericTable";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useState, useEffect, useContext, useMemo } from "react";
import type { FC } from "react";
import type { TabProps } from "../TransactionTimeline";
import { AuthGuardContext } from "@givc/shared-components";
import {
  isTimeSeriesPayload,
  toApiSeries,
  toTimeChartPoints,
  toTimeGridColumns,
  type TimeBucketRow,
  type TimeSeriesPayload,
  type Translate,
} from "../report";

const TransactionsByHourSection: FC<Omit<TabProps, "page">> = ({
  searchParams,
  fetchData,
  facilityId,
}: Omit<TabProps, "page">) => {
  const [report, setReport] = useState<TimeSeriesPayload>({
    data: [],
    total: 0,
    apiNames: [],
  });

  const ctx = useContext(AuthGuardContext);
  const t: Translate = useMemo(
    () => ctx?.t ?? ((key: string) => key),
    [ctx],
  );

  useEffect(() => {
    if (!ctx) {
      return;
    }
    fetchData("getHourlyApiPerformance", (data) =>
      setReport(
        isTimeSeriesPayload(data)
          ? data
          : { data: [], total: 0, apiNames: [] },
      ),
    );
  }, [
    fetchData,
    ctx,
    searchParams?.start_date,
    searchParams?.end_date,
    searchParams?.payer_id,
    searchParams?.api_name,
    searchParams?.api_provider,
    searchParams?.api_function,
    searchParams?.status,
    searchParams?.all_facilities,
    facilityId,
  ]);

  const { data, apiNames } = report;
  const columns = useMemo(
    () => toTimeGridColumns("hour", apiNames, t),
    [apiNames, t],
  );
  const series = useMemo(() => toApiSeries(apiNames), [apiNames]);
  const chartData = useMemo(() => {
    const base = toTimeChartPoints(data, apiNames, "hour");
    return base.map((point) => {
      const hourNum = Number(point.NAME);
      return { ...point, hourNum };
    });
  }, [data, apiNames]);

  const hourTicks = useMemo(() => {
    const hours = new Set<number>();
    chartData.forEach((point) => {
      const h = Number(point.NAME);
      if (!isNaN(h)) hours.add(h);
    });
    return [...hours].sort((a, b) => a - b);
  }, [chartData]);

  if (!ctx) {
    return null;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", flexDirection: "row", gap: 2, mb: 3 }}>
        <Box sx={{ flex: 1, p: 2, borderRadius: 2, boxShadow: 2 }}>
          <Box sx={{ p: 3 }}>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={chartData}
                margin={{ top: 30, right: 40, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />

                {/* X-Axis with Hour */}
                <XAxis
                  dataKey="hourNum"
                  type="number"
                  ticks={hourTicks}
                  label={{
                    value: t("transactionAnalysis_30_ColHour"),
                    position: "insideBottomRight",
                    offset: -5,
                  }}
                  tickFormatter={(value) => String(value).padStart(2, "0")}
                  textAnchor="end"
                  height={100}
                />

                {/* Left Y-Axis: for counts */}
                <YAxis
                  yAxisId="left"
                  label={{
                    value: t("transactionAnalysis_30_ColTotal") + " " + t("transactionAnalysis_30_ColCount"),
                    angle: -90,
                    position: "insideLeft",
                  }}
                  stroke="#000000"
                />

                <Tooltip />
                <Legend verticalAlign="top" />

                {series.map((item) => (
                  <Line
                    key={item.countKey}
                    yAxisId="left"
                    type="monotone"
                    dataKey={item.countKey}
                    name={item.label}
                    stroke={item.color}
                    dot={true}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Box>
        <Box sx={{ flex: 1, p: 2, borderRadius: 2, boxShadow: 2 }}>
          <Box sx={{ p: 3 }}>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={chartData}
                margin={{ top: 30, right: 40, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />

                {/* X-Axis with Hour */}
                <XAxis
                  dataKey="hourNum"
                  type="number"
                  ticks={hourTicks}
                  label={{
                    value: t("transactionAnalysis_30_ColHour"),
                    position: "insideBottomRight",
                    offset: -5,
                  }}
                  tickFormatter={(value) => String(value).padStart(2, "0")}
                  textAnchor="end"
                  height={100}
                />

                {/* Left Y-Axis: for counts */}
                <YAxis
                  yAxisId="left"
                  label={{
                    value: t("transactionAnalysis_30_ColTotal") + " " + t("transactionAnalysis_30_ColCount"),
                    angle: -90,
                    position: "insideLeft",
                  }}
                  stroke="#1f77b4"
                />

                {/* Right Y-Axis: for TIME_S (seconds) */}
                <YAxis
                  dataKey="local_time_s"
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 3.5]}
                  label={{
                    value: t("transactionAnalysis_30_ColLocalTimeSeconds"),
                    angle: -90,
                    position: "insideRight",
                  }}
                  stroke="#800080"
                  tick={{ fill: "#800080" }}
                  axisLine={{ stroke: "#800080" }}
                  tickLine={{ stroke: "#800080" }}
                />

                <Tooltip />
                <Legend verticalAlign="top" />

                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="TOTAL"
                  stroke="#000000"
                  dot={true}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="local_time_s"
                  stroke="#800080"
                  strokeWidth={2}
                  dot={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </Box>
      <GenericTable
        title={t("transactionAnalysis_30_TabByHour")}
        url="/transactionTimeline/getHourlyApiPerformance"
        params={{ ...searchParams }}
        columns={columns}
        getRowId={(row: TimeBucketRow) => row.hour}
      />
    </Box>
  );
};

export default TransactionsByHourSection;