import { useEffect, useState, useContext, useMemo } from "react";
import { Box, Collapse, IconButton, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
} from "recharts";
import { dashboardAxios } from "../../../api";
import { STATUS_COLORS } from "../report";
import { AuthGuardContext } from "@givc/shared-components";
import type { SearchParams } from "../TransactionTimeline";

const ERROR_CHARTS_COLLAPSED_KEY = "transactiontimeline:error-charts-collapsed";

function readErrorChartsCollapsed(): boolean {
  if (typeof window === "undefined") return true;

  try {
    const saved = window.localStorage.getItem(ERROR_CHARTS_COLLAPSED_KEY);
    if (saved === "true") return true;
    if (saved === "false") return false;
  } catch {
    // Storage can throw in private or restricted contexts.
  }

  return true;
}

function writeErrorChartsCollapsed(collapsed: boolean): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(ERROR_CHARTS_COLLAPSED_KEY, String(collapsed));
  } catch {
    // Non-fatal: the preference just won't persist.
  }
}

interface ErrorsChartsSectionProps {
  searchParams: SearchParams;
  nphiesCode: string | null;
}

interface DayPoint {
  day: string;
  day_ts: number | null;
  error_count: number;
  fail_count: number;
  success_count: number;
  total: number;
  error_percent: number;
  fail_percent: number;
  error_sent_percent: number;
}

interface HourPoint {
  hour: number;
  avg_error_count: number;
  avg_fail_count: number;
  error_count: number;
  fail_count: number;
  success_count: number;
  total: number;
  error_percent: number;
  fail_percent: number;
  error_sent_percent: number;
}

export default function ErrorsChartsSection({
  searchParams,
  nphiesCode,
}: ErrorsChartsSectionProps) {
  const [open, setOpen] = useState(() => !readErrorChartsCollapsed());

  useEffect(() => {
    writeErrorChartsCollapsed(!open);
  }, [open]);
  const [days, setDays] = useState<DayPoint[]>([]);
  const [hours, setHours] = useState<HourPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDayTs, setSelectedDayTs] = useState<number | null>(null);

  const statusFilter = searchParams?.status ?? null;
  const showError = !statusFilter || statusFilter === "ERROR";
  const showFail =
    !statusFilter || statusFilter === "FAIL" || statusFilter === "FAILED";

  const countSeries = useMemo(
    () =>
      (
        [
          {
            key: "error_count",
            nameKey: "transactionAnalysis_30_ColErrorCount",
            fallback: "Error Count",
            color: STATUS_COLORS.ERROR,
            visible: showError,
          },
          {
            key: "fail_count",
            nameKey: "transactionAnalysis_30_ColFailedCount",
            fallback: "Failed Count",
            color: STATUS_COLORS.FAIL,
            visible: showFail,
          },
        ] as const
      ).filter((s) => s.visible),
    [showError, showFail],
  );
  const avgSeries = useMemo(
    () =>
      (
        [
          {
            key: "avg_error_count",
            nameKey: "transactionAnalysis_30_ColAvgErrorCount",
            fallback: "Avg Error Count",
            color: STATUS_COLORS.ERROR,
            visible: showError,
          },
          {
            key: "avg_fail_count",
            nameKey: "transactionAnalysis_30_ColFailedCount",
            fallback: "Avg Failed Count",
            color: STATUS_COLORS.FAIL,
            visible: showFail,
          },
        ] as const
      ).filter((s) => s.visible),
    [showError, showFail],
  );
  const ctx = useContext(AuthGuardContext);
  const t = ctx?.t ?? ((key: string) => key);

  const handleDayClick = (state: {
    activePayload?: Array<{ payload?: DayPoint }>;
    activeLabel?: string | number;
  }) => {
    const point = state.activePayload?.[0]?.payload;
    const ts =
      point?.day_ts ??
      days.find((d) => d.day === state?.activeLabel)?.day_ts ??
      null;
    if (ts === null || ts === undefined) return;
    setSelectedDayTs((prev) => (prev === ts ? null : ts));
  };

  const makeDayDot =
    (color: string) =>
    (props: { cx?: number; cy?: number; payload?: DayPoint }) => {
    const { cx, cy, payload } = props;
    const isSelected =
      selectedDayTs !== null &&
      payload?.day_ts !== null &&
      payload?.day_ts !== undefined &&
      Number(payload.day_ts) === selectedDayTs;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={isSelected ? 7 : 3.5}
        fill={isSelected ? color : "#ffffff"}
        stroke={color}
        strokeWidth={isSelected ? 3 : 1.5}
      />
    );
  };

  useEffect(() => {
    if (!open) return;
    let active = true;
    const params = {
      ...searchParams,
      ...(nphiesCode ? { nphies_code: nphiesCode } : {}),
    };
    const hourlyParams = {
      ...params,
      ...(selectedDayTs === null ? {} : { day_ts: selectedDayTs }),
    };
    setLoading(true);
    Promise.all([
      dashboardAxios.get("/transactionTimeline/getErrorDailyPerformance", {
        params,
      }),
      dashboardAxios.get("/transactionTimeline/getErrorHourlyPerformance", {
        params: hourlyParams,
      }),
    ])
      .then(([dailyRes, hourlyRes]) => {
        if (!active) return;
        setDays(
          (dailyRes.data?.data || []).map((d: Record<string, unknown>) => ({
            day: d.day,
            day_ts: d.day_ts === null || d.day_ts === undefined ? null : Number(d.day_ts),
            error_count: Number(d.error_count) || 0,
            fail_count: Number(d.fail_count) || 0,
            success_count: Number(d.success_count) || 0,
            total: Number(d.total) || 0,
            error_percent: Number(d.error_percent) || 0,
            fail_percent: Number(d.fail_percent) || 0,
            error_sent_percent: Number(d.error_sent_percent) || 0,
          })),
        );
        setHours(
          (hourlyRes.data?.data || []).map((h: Record<string, unknown>) => ({
            hour: Number(h.hour),
            avg_error_count: Number(h.avg_error_count) || 0,
            avg_fail_count: Number(h.avg_fail_count) || 0,
            error_count: Number(h.error_count) || 0,
            fail_count: Number(h.fail_count) || 0,
            success_count: Number(h.success_count) || 0,
            total: Number(h.total) || 0,
            error_percent: Number(h.error_percent) || 0,
            fail_percent: Number(h.fail_percent) || 0,
            error_sent_percent: Number(h.error_sent_percent) || 0,
          })),
        );
      })
      .catch((err) => {
        console.error("Error fetching errors charts:", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [
    searchParams?.start_date,
    searchParams?.end_date,
    searchParams?.payer_id,
    searchParams?.api_name,
    searchParams?.api_provider,
    searchParams?.api_function,
    searchParams?.status,
    searchParams?.all_facilities,
    searchParams?.facility_id,
    nphiesCode,
    selectedDayTs,
    open,
  ]);

  return (
    <Box>
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer" }}
        onClick={() => setOpen((prev) => !prev)}
      >
        <IconButton size="small">
          <ExpandMoreIcon
            sx={{
              transform: open ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 0.2s",
            }}
          />
        </IconButton>
        <Typography variant="subtitle1" fontWeight={600}>
          {t("transactionAnalysis_30_ErrorsChartsTitle") || "Error Days & Hours"}
        </Typography>
      </Box>
      <Collapse in={open} timeout={70}>
        {open ? (
          <>
          <Box sx={{ display: "flex", flexDirection: "row", gap: 2, mb: 3 }}>
          <Box sx={{ flex: 1, p: 2, borderRadius: 2, boxShadow: 2 }}>
            <Box sx={{ p: 3 }}>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={days}
                  margin={{ top: 30, right: 40, left: 10, bottom: 5 }}
                  onClick={handleDayClick}
                  style={{ cursor: "pointer" }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="day"
                    label={{
                      value: t("transactionAnalysis_30_ColDate"),
                      position: "insideBottomRight",
                      offset: -5,
                    }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis
                    yAxisId="left"
                    label={{
                      value: t("transactionAnalysis_30_ColErrorCount"),
                      angle: -90,
                      position: "insideLeft",
                    }}
                    stroke="#000000"
                  />
                  {/* TEMP-HIDDEN: percentages axis - remove comment markers to restore
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    tickFormatter={(value: number) => `${value.toFixed(0)}%`}
                    label={{
                      value: t("transactionAnalysis_30_ColErrorPercent"),
                      angle: -90,
                      position: "insideRight",
                    }}
                    allowDecimals={false}
                    stroke="#800080"
                    tick={{ fill: "#800080" }}
                    axisLine={{ stroke: "#800080" }}
                    tickLine={{ stroke: "#800080" }}
                  />
                  */}
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name.endsWith("%") ? [`${value}%`, name] : [value, name]
                    }
                    labelFormatter={(label, payload) => {
                      const point = payload?.[0]?.payload ?? {};
                      return `${label} ${t("transactionAnalysis_30_ColTotal")}(${point.total ?? "-"}) ${t("transactionAnalysis_30_ColSucceededCount")}(${point.success_count ?? "-"})`;
                    }}
                  />
                  <Legend verticalAlign="top" />
                  {countSeries.map((item) => (
                    <Line
                      key={item.key}
                      yAxisId="left"
                      type="monotone"
                      dataKey={item.key}
                      name={t(item.nameKey) || item.fallback}
                      stroke={item.color}
                      dot={makeDayDot(item.color)}
                    />
                  ))}
                  {/* TEMP-HIDDEN: percentage lines - remove comment markers to restore
                  {pctSeries.map((item) => (
                    <Line
                      key={item.key}
                      yAxisId="right"
                      type="monotone"
                      dataKey={item.key}
                      name={t(item.nameKey) || item.fallback}
                      stroke={item.color}
                      dot={makeDayDot(item.color)}
                    />
                  ))}
                  */}
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Box>
          <Box sx={{ flex: 1, p: 2, borderRadius: 2, boxShadow: 2 }}>
            <Box sx={{ p: 3 }}>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={hours}
                  margin={{ top: 30, right: 40, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="hour"
                    tickFormatter={(value: number) =>
                      String(value).padStart(2, "0")
                    }
                    label={{
                      value: t("transactionAnalysis_30_ColHour"),
                      position: "insideBottomRight",
                      offset: -5,
                    }}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis
                    yAxisId="left"
                    label={{
                      value: t("transactionAnalysis_30_ColAvgErrorCount"),
                      angle: -90,
                      position: "insideLeft",
                    }}
                    stroke="#000000"
                  />
                  {/* TEMP-HIDDEN: percentages axis - remove comment markers to restore
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    tickFormatter={(value: number) => `${value.toFixed(0)}%`}
                    label={{
                      value: t("transactionAnalysis_30_ColErrorPercent"),
                      angle: -90,
                      position: "insideRight",
                    }}
                    allowDecimals={false}
                    stroke="#800080"
                    tick={{ fill: "#800080" }}
                    axisLine={{ stroke: "#800080" }}
                    tickLine={{ stroke: "#800080" }}
                  />
                  */}
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name.endsWith("%") ? [`${value}%`, name] : [value, name]
                    }
                    labelFormatter={(label, payload) => {
                      const point = payload?.[0]?.payload ?? {};
                      return `${label} ${t("transactionAnalysis_30_ColTotal")}(${point.total ?? "-"}) ${t("transactionAnalysis_30_ColSucceededCount")}(${point.success_count ?? "-"})`;
                    }}
                  />
                  <Legend verticalAlign="top" />
                  {avgSeries.map((item) => (
                    <Line
                      key={item.key}
                      yAxisId="left"
                      type="monotone"
                      dataKey={item.key}
                      name={t(item.nameKey) || item.fallback}
                      stroke={item.color}
                      dot={true}
                    />
                  ))}
                  {/* TEMP-HIDDEN: percentage lines - remove comment markers to restore
                  {pctSeries.map((item) => (
                    <Line
                      key={item.key}
                      yAxisId="right"
                      type="monotone"
                      dataKey={item.key}
                      name={t(item.nameKey) || item.fallback}
                      stroke={item.color}
                      dot={true}
                    />
                  ))}
                  */}
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        </Box>
        {loading && (
          <Typography variant="body2" align="center">
            Loading charts...
          </Typography>
        )}
          </>
        ) : null}
      </Collapse>
    </Box>
  );
}
