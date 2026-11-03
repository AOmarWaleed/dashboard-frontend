import type { GridColDef } from "@mui/x-data-grid";

export type ReportRow = Record<string, string | number>;

export interface ReportPayload {
  data: ReportRow[];
  total: number;
  statuses: string[];
  times: string[];
}

export interface ChartSeries {
  countKey: string;
  percentKey: string;
  label: string;
  color: string;
}

export interface ReportChartPoint {
  NAME: string;
  TOTAL: number;
  [key: string]: string | number;
}

export type TimeBucketField = "created" | "hour";

export interface TimeBucketRow extends ReportRow {
  bucket_sort: number;
}

export interface TimeSeriesPayload {
  data: TimeBucketRow[];
  total: number;
  apiNames: string[];
}

export type Translate = (key: string) => string | undefined;

export const isReportPayload = (data: unknown): data is ReportPayload =>
  !!data &&
  typeof data === "object" &&
  Array.isArray((data as ReportPayload).data) &&
  Array.isArray((data as ReportPayload).statuses);

export const isTimeSeriesPayload = (data: unknown): data is TimeSeriesPayload =>
  !!data &&
  typeof data === "object" &&
  Array.isArray((data as TimeSeriesPayload).data) &&
  Array.isArray((data as TimeSeriesPayload).apiNames);

export const toTimeGridColumns = (
  bucketField: TimeBucketField,
  apiNames: string[],
  t: Translate,
): GridColDef[] => {
  const apiColumns = apiNames.flatMap((apiName) => [
    {
      field: `${apiName} Count`,
      headerName: `${apiName} ${t("transactionAnalysis_30_ColCount")}`,
      flex: 1,
      minWidth: 0,
      align: "right" as const,
      type: "number" as const,
    },
    {
      field: `${apiName} %`,
      headerName: `${apiName} %`,
      flex: 1,
      minWidth: 0,
      align: "right" as const,
      type: "number" as const,
    },
  ]);

  return [
    {
      field: bucketField,
      headerName:
        bucketField === "hour"
          ? t("transactionAnalysis_30_ColHour")
          : t("transactionAnalysis_30_ColDate"),
      flex: 1,
      minWidth: 0,
      align: "left",
      type: "string",
    },
    {
      field: "total",
      headerName: t("transactionAnalysis_30_ColTotal"),
      flex: 1,
      minWidth: 0,
      align: "right" as const,
      type: "number" as const,
    },
    ...apiColumns,
    {
      field: "time_s",
      headerName: t("transactionAnalysis_30_ColTimeSeconds"),
      flex: 1,
      minWidth: 0,
      align: "right" as const,
      type: "number" as const,
    },
    {
      field: "local_time_s",
      headerName: t("transactionAnalysis_30_ColLocalTimeSeconds"),
      flex: 1,
      minWidth: 0,
      align: "right" as const,
      type: "number" as const,
    },
    {
      field: "Succeded%",
      headerName: t("transactionAnalysis_30_ColSucceededPercent"),
      flex: 1,
      minWidth: 0,
      align: "right" as const,
      type: "number" as const,
    },
  ];
};

export const toGridColumns = (
  statuses: string[],
  t: Translate,
): GridColDef[] => {
  const statusColumns = statuses.flatMap((status) => [
    {
      field: `${status} Count`,
      headerName: `${status} ${t("transactionAnalysis_30_ColCount")}`,
      flex: 1,
      minWidth: 0,
      align: "right" as const,
      type: "number" as const,
    },
    {
      field: `${status} %`,
      headerName: `${status} %`,
      flex: 1,
      minWidth: 0,
      align: "right" as const,
      type: "number" as const,
    },
  ]);

  return [
    {
      field: "api_name",
      headerName: t("transactionAnalysis_30_ColApiName"),
      flex: 3,
      minWidth: 0,
      align: "left",
      type: "string",
    },
    {
      field: "total",
      headerName: t("transactionAnalysis_30_ColTotal"),
      flex: 1,
      minWidth: 0,
      align: "right",
      type: "number",
    },
    ...statusColumns,
    {
      field: "time_s",
      headerName: t("transactionAnalysis_30_ColTimeSeconds"),
      flex: 1,
      minWidth: 0,
      align: "right",
      type: "number",
    },
    {
      field: "errorPercentage",
      headerName: "Error/Sent Percentage",
      flex: 1,
      minWidth: 0,
      align: "right",
      type: "number",
    },
    {
      field: "Local Time s",
      headerName: t("transactionAnalysis_30_ColLocalTimeSeconds"),
      flex: 1,
      minWidth: 0,
      align: "right",
      type: "number",
    },
    {
      field: "Response Time s",
      headerName: "Response Time s",
      flex: 1,
      minWidth: 0,
      align: "right",
      type: "number",
    },
    {
      field: "Preprocess Time s",
      headerName: "Preprocess Time s",
      flex: 1,
      minWidth: 0,
      align: "right",
      type: "number",
    },
  ];
};

export const STATUS_COLORS: Record<string, string> = {
  SUCCESS: "#5cb85c",
  FAILED: "#d9534f",
  ERROR: "#ec971f",
  FAIL: "#d9534f",
  "-": "#9c27b0",
  APPROVAL: "#2f5597",
  ELIGIBILITY: "#00a0a0",
  CLAIM: "#e07b39",
  PULL: "#7b5ea7",
  COMMUNICATION: "#4a7c59",
  TIMEOUT: "#b23a48",
  CANCEL: "#5c6bc0",
  ISSUED: "#00838f",
  PROCESSED: "#ad1457",
  APPROVED: "#283593",
  REJECTED: "#558b2f",
  SUBMITTED: "#ff8f00",
  CANCELLED: "#6d4c41",
  PENDING: "#c2185b",
  IN_PROCESS: "#00796b",
  COMPLETED: "#303f9f",
  EXPIRED: "#f9a825",
  "Error Percentage": "#fc0318",
};

const UNKNOWN_STATUS_COLOR = "#bdbdbd";

const TIMES_COLOR = {
  "Local Time s": "#f87822",
  "Preprocess Time s": "#0ee3f7",
  "Response Time s": "#19f55b",
};

const API_COLORS: Record<string, string> = {
  APPROVAL: "#ff7f0e",
  ELIGIBILITY: "#2ca02c",
  CLAIM: "#d62728",
  PULL: "#9467bd",
  COMMUNICATION: "#8c564b",
};

const API_FALLBACK_COLORS = [
  "#1f77b4",
  "#e377c2",
  "#bcbd22",
  "#17becf",
  "#7f7f7f",
  "#8dd3c7",
  "#fb8072",
  "#aec7e8",
  "#ffbb78",
  "#98df8a",
  "#c5b0d5",
  "#c49c94",
];

const colorForApi = (apiName: string, index: number): string =>
  API_COLORS[apiName] ??
  STATUS_COLORS[apiName] ??
  API_FALLBACK_COLORS[index % API_FALLBACK_COLORS.length];

export const toDimensionSeries = (statuses: string[]): ChartSeries[] =>
  statuses.map((status) => ({
    countKey: `${status} Count`,
    percentKey: `${status} %`,
    label: status,
    color: STATUS_COLORS[status] ?? UNKNOWN_STATUS_COLOR,
  }));

export const toChartPoints = (
  rows: ReportRow[],
  statuses: string[],
): ReportChartPoint[] => {
  return rows
    .map((row) => {
      // const errorCount = Number(row["ERROR Count"] || 0);
      // const successCount = Number(row["SUCCESS Count"] || 0);
      // const totalCount = errorCount + successCount;
      // const errorPercentage = totalCount
      //   ? ((errorCount / totalCount) * 100).toFixed(2)
      //   : "0.00";

      const local_time_s = Number(row["Local Time s"]) || 0;
      const preprocess_time_s = Number(row["Preprocess Time s"]) || 0;
      const response_time_s = Number(row["Response Time s"]) || 0;
      const totalTime = local_time_s + preprocess_time_s + response_time_s;
      const point: ReportChartPoint = {
        NAME: String(row.api_name ?? ""),
        TOTAL: Number(row.total) || 0,
        time_s: Number(row.time_s) || 0,
        "Local Time s": local_time_s,
        "Preprocess Time s": preprocess_time_s,
        "Response Time s": response_time_s,
        totalTime,
        errorPercentage: row.errorPercentage,
      };

      statuses.forEach((status) => {
        point[`${status} Count`] = Number(row[`${status} Count`]) || 0;
        point[`${status} %`] = Number(row[`${status} %`]) || 0;
      });

      return point;
    })
    .filter((point) => point.TOTAL > 0);
};
export const toApiSeries = (apiNames: string[]): ChartSeries[] =>
  apiNames.map((apiName, index) => ({
    countKey: `${apiName} Count`,
    percentKey: `${apiName} %`,
    label: apiName,
    color: colorForApi(apiName, index),
  }));

export const toTimeChartPoints = (
  rows: TimeBucketRow[],
  apiNames: string[],
  bucketField: TimeBucketField,
): ReportChartPoint[] =>
  rows
    .map((row) => {
      const label = String(row[bucketField] ?? "");
      const point: ReportChartPoint = {
        NAME: label,
        TOTAL: Number(row.total) || 0,
        time_s: Number(row.time_s) || 0,
        local_time_s: Number(row.local_time_s) || 0,
        [bucketField]: label,
      };

      apiNames.forEach((apiName) => {
        point[`${apiName} Count`] = Number(row[`${apiName} Count`]) || 0;
        point[`${apiName} %`] = Number(row[`${apiName} %`]) || 0;
      });

      return point;
    })
    .filter((point) => point.TOTAL > 0);

export const toTimesSeries = (times: string[]) => {
  return times.map((time) => ({
    key: time,
    color: TIMES_COLOR[time as keyof typeof TIMES_COLOR],
    Label: time,
  }));
};
