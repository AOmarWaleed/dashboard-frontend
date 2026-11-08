import { Box } from "@mui/material";
import { useContext, useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  LabelList,
  Bar,
  Line,
  Legend,
  Tooltip,
} from "recharts";
import { AuthGuardContext } from "@givc/shared-components";

import type { TabProps } from "../TransactionTimeline";
import {
  isReportPayload,
  toChartPoints,
  toDimensionSeries,
  toGridColumns,
  toTimesSeries,
  type ReportPayload,
} from "../report";
import GenericTable from "./GenericTable";

const EMPTY_REPORT: ReportPayload = {
  data: [],
  total: 0,
  statuses: [],
  times: [],
};

export default function OverviewSection({
  searchParams,
  fetchData,
  facilityId,
}: Omit<TabProps, "page">) {
  const [report, setReport] = useState<ReportPayload>(EMPTY_REPORT);

  const ctx = useContext(AuthGuardContext);
  const t = ctx?.t ?? ((key: string) => key);

  useEffect(() => {
    if (!ctx) return;
    fetchData("getApiSummaryReport", (data) =>
      setReport(isReportPayload(data) ? data : EMPTY_REPORT),
    );
  }, [
    searchParams?.date_start,
    searchParams?.date_end,
    searchParams?.payer_id,
    searchParams?.api_name,
    searchParams?.api_provider,
    searchParams?.api_function,
    searchParams?.status,
    searchParams?.all_facilities,
    facilityId,
  ]);
  const { data, statuses, times } = report;

  const overviewColumns = useMemo(
    () => toGridColumns(statuses, t),
    [statuses, t],
  );
  const series = useMemo(() => toDimensionSeries(statuses), [statuses]);
  const chartData = useMemo(
    () => toChartPoints(data, statuses),
    [data, statuses],
  );

  const timesSeries = toTimesSeries(times);

  if (!ctx) {
    return null;
  }

  // console.log(">>>>", timesSeries);
  // console.log("****", chartData);
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", flexDirection: "row", gap: 2, mb: 3 }}>
        <Box sx={{ flex: 1, p: 2, borderRadius: 2, boxShadow: 2 }}>
          <Box sx={{ p: 3 }}>
            <ResponsiveContainer width="100%" height={450}>
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 0, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="NAME"
                  interval={0}
                  tickFormatter={(tick) => (tick === "N/A" ? "" : tick)}
                  angle={-35}
                  textAnchor="end"
                  height={150}
                />
                <YAxis
                  yAxisId="left"
                  domain={[0, 100]}
                  label={{
                    value:
                      t("transactionAnalysis_30_ColTotal") +
                      " " +
                      t("transactionAnalysis_30_ColCount"),
                    angle: -90,
                    position: "insideLeft",
                  }}
                  stroke="#000000"
                  tick={{ fill: "#000000" }}
                  axisLine={{ stroke: "#000000" }}
                  tickLine={{ stroke: "#000000" }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value.toFixed(0)}%`}
                  label={{
                    value: t("transactionAnalysis_30_ChartPercentage"),
                    angle: -90,
                    position: "insideRight",
                  }}
                  allowDecimals={false}
                  stroke="#2f5597"
                  tick={{ fill: "#2f5597" }}
                  axisLine={{ stroke: "#2f5597" }}
                  tickLine={{ stroke: "#2f5597" }}
                />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name.endsWith("%") ? [`${value}%`, name] : [value, name]
                  }
                  labelFormatter={(label, payload) => {
                    const total = payload?.[0]?.payload?.TOTAL;
                    return `${label} TOTAL(${total})`;
                  }}
                />

                {series.map((item, index) => (
                  <Bar
                    key={item.countKey}
                    yAxisId="left"
                    dataKey={item.countKey}
                    stackId="b"
                    fill={item.color}
                    name={item.label}
                    barSize={30}
                  >
                    {index === series.length - 1 && (
                      <LabelList
                        dataKey="TOTAL"
                        position="top"
                        formatter={(val: number) => val.toLocaleString()}
                      />
                    )}
                  </Bar>
                ))}

                <Line
                  yAxisId="right"
                  dataKey={"errorPercentage"}
                  stroke="#2f5597"
                  name={"Error/Sent Percentage"}
                  dot={true}
                />

                <Legend />
              </ComposedChart>
            </ResponsiveContainer>
          </Box>
        </Box>
        <Box sx={{ flex: 1, p: 2, borderRadius: 2, boxShadow: 2 }}>
          <Box sx={{ p: 3 }}>
            <ResponsiveContainer width="100%" height={450}>
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 0, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="4 4" />
                <XAxis
                  dataKey="NAME"
                  interval={0}
                  tickFormatter={(tick) => (tick === "N/A" ? "" : tick)}
                  angle={-35}
                  textAnchor="end"
                  height={150}
                />
                <YAxis
                  yAxisId="left"
                  domain={[0, 100]}
                  label={{
                    value:
                      t("transactionAnalysis_30_ColTotal") +
                      " " +
                      t("transactionAnalysis_30_ColCount"),
                    angle: -90,
                    position: "insideLeft",
                  }}
                  stroke="#000000"
                  tick={{ fill: "#000000" }}
                  axisLine={{ stroke: "#000000" }}
                  tickLine={{ stroke: "#000000" }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, "dataMax"]}
                  allowDecimals={false}
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
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name.endsWith("%")) {
                      return [`${value}%`, name];
                    }
                    return [value, name];
                  }}
                  labelFormatter={(label) => {
                    return `${label}`;
                  }}
                />

                {timesSeries.map((item, index) => (
                  <Bar
                    key={item.key}
                    yAxisId="right"
                    dataKey={item.key}
                    stackId="a"
                    fill={item.color}
                    name={item.Label}
                    barSize={45}
                  >
                    {index === timesSeries.length - 1 && (
                      <LabelList
                        dataKey="totalTime"
                        position="top"
                        formatter={(val: number) => val.toLocaleString()}
                      />
                    )}
                  </Bar>
                ))}
                <Line
                  yAxisId="left"
                  dataKey={"TOTAL"}
                  stroke="#800080"
                  name={"count"}
                  dot={true}
                />
                <Legend />
              </ComposedChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </Box>

      <GenericTable
        title={t("transactionAnalysis_30_TabOverview")}
        url="/transactionTimeline/getApiSummaryReport"
        params={searchParams}
        columns={overviewColumns}
        getRowId={(row) => String(row.api_name ?? "")}
      />
    </Box>
  );
}
