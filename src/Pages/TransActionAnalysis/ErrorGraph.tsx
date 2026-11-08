import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FC, SyntheticEvent } from "react";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  Filler,
} from "chart.js";
import type { ChartData, ChartOptions } from "chart.js";
import {
  Autocomplete,
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import zoomPlugin from "chartjs-plugin-zoom";
import "chartjs-adapter-date-fns";
import { Line } from "react-chartjs-2";
import { useFormik } from "formik";
import * as Yup from "yup";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { type Dayjs, type ManipulateType } from "dayjs";
import { dashboardAxios } from "../../api";
import { DISPLAY_DATE_TIME_FORMAT } from "../../utils/dateFormat";
import {
  DEFAULT_QUICK_TIME_RANGE,
  getQuickTimeRange,
} from "../../components/QuickTimeRange.utils";
import { useApiTransactionOptions } from "../../Hooks/useApiTransactionOptions";
import type { ApiTransactionOption } from "../../Hooks/useApiTransactionOptions";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  zoomPlugin,
  Filler,
);

interface ErrorDatum {
  date: string;
  total: number;
  error: number;
  [key: string]: unknown;
}

interface FormattedErrorDatum extends ErrorDatum {
  trans_date: Date;
  errorPercentage: number;
  errorCount: number;
}

interface AppliedFilters {
  date_start: Dayjs | null;
  date_end: Dayjs | null;
  last: string;
  refresh: string;
  data_bin: string;
  all_facilities: boolean;
  api_provider: string | null;
  api_name: string | null;
  api_function: string | null;
  status: string | null;
}

interface ErrorGraphProps {
  apiUrl: string;
  title: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  yAxisLabel2?: string;
  dataFormatter?: (d: ErrorDatum) => FormattedErrorDatum;
}

// type ChartStatsRow = {
//   date: Date | string;
//   total: number;
//   [key: string]: string | number | Date | Record<string, number>;
// };

type ApiStatusRow = {
  date: string;
  total: number;
  [key: string]: string | number;
};

const lastOptions = [
  { value: "", label: "None" },
  { value: "1 hour", label: "Last 1 hour" },
  { value: "1 day", label: "Last 1 day" },
  { value: "7 day", label: "Last 7 days" },
  { value: "30 day", label: "Last 30 days" },
  { value: "90 day", label: "Last 90 days" },
  { value: "180 day", label: "Last 180 days" },
  { value: "365 day", label: "Last 365 days" },
];

const refreshOptions = [
  { value: "none", label: "No Refresh" },
  { value: "5000", label: "5 seconds" },
  { value: "60000", label: "1 minute" },
  { value: "300000", label: "5 minutes" },
  { value: "600000", label: "10 minutes" },
  { value: "1800000", label: "30 minutes" },
  { value: "3600000", label: "1 hour" },
];

const dataBinOptions = [
  { value: "5 seconds", label: "5 seconds" },
  { value: "1 minute", label: "1 minute" },
  { value: "5 minutes", label: "5 minutes" },
  { value: "10 minutes", label: "10 minutes" },
  { value: "30 minutes", label: "30 minutes" },
  { value: "1 hours", label: "1 hour" },
];
const LAST_INTERVALS: Record<string, { amount: number; unit: ManipulateType }> =
  {
    "1 hour": { amount: 1, unit: "hour" },
    "1 day": { amount: 1, unit: "day" },
    "7 day": { amount: 7, unit: "day" },
    "30 day": { amount: 30, unit: "day" },
    "90 day": { amount: 90, unit: "day" },
    "180 day": { amount: 180, unit: "day" },
    "365 day": { amount: 365, unit: "day" },
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
  fallback: "#387908",
};

// const SPARSE_POINT_LIMIT = 10;

const ErrorGraph: FC<ErrorGraphProps> = ({
  apiUrl,
  title,
  xAxisLabel,
  // yAxisLabel,
  // yAxisLabel2,
  // dataFormatter,
}) => {
  const [data, setData] = useState<ApiStatusRow[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const defaultQuickRange = useMemo(
    () => getQuickTimeRange(DEFAULT_QUICK_TIME_RANGE),
    [],
  );

  const [applied, setApplied] = useState<AppliedFilters>(() => ({
    date_start: defaultQuickRange.start,
    date_end: defaultQuickRange.end,
    last: lastOptions[0].value,
    refresh: refreshOptions[2].value,
    data_bin: dataBinOptions[1].value,
    all_facilities: false,
    api_provider: null,
    api_name: null,
    api_function: null,
    status: null,
  }));
  const validationSchema = Yup.object({
    date_start: Yup.date().nullable(),
    date_end: Yup.date()
      .nullable()
      .when("date_start", (date_start, schema) =>
        date_start
          ? schema.min(date_start, "End date must be after start date")
          : schema,
      ),
  });

  const formik = useFormik<AppliedFilters>({
    initialValues: {
      date_start: defaultQuickRange.start,
      date_end: defaultQuickRange.end,
      last: lastOptions[0].value,
      refresh: refreshOptions[2].value, // Default to "1 minute"
      data_bin: dataBinOptions[1].value,
      all_facilities: false,
      api_provider: null,
      api_name: null,
      api_function: null,
      status: null,
    },
    validationSchema,
    onSubmit: (values) => {
      setApplied(values);
    },
  });
  const yColor = "rgba(255, 115, 0, 1)";
  const y1Color = "rgba(255, 115, 0, 1)";
  // const formattedData: FormattedErrorDatum[] = data.map((d) => {
  //   const defaultFormatted: FormattedErrorDatum = {
  //     ...d,
  //     trans_date: new Date(d.date),
  //     errorPercentage: d.total > 0 ? (d.error / d.total) * 100 : 0,
  //     errorCount: Number(d.error) || 0,
  //   };
  //   return dataFormatter ? dataFormatter(d) : defaultFormatted;
  // });

  // const test2: ChartStatsRow[] = data.map((dataObj) => {
  //   let { date: rawDate, total, ...restStatusObject } = dataObj;
  //   const date: Date = new Date(rawDate);
  //   const outputObject: ChartStatsRow = { date, total };
  //   Object.keys(restStatusObject).forEach((element) => {
  //     outputObject[element] = {};
  //     const count = Number(restStatusObject[element]) || 0;
  //     outputObject[element].percentage = total > 0 ? (count / total) * 100 : 0;
  //     outputObject[element].count = count;
  //   });

  //   return outputObject;
  // });
  const minXValue = data.length ? new Date(data[0].date).getTime() : undefined;
  const maxXValue = data.length
    ? new Date(data[data.length - 1].date).getTime()
    : undefined;
  const { date: tmpDate, total: tmpTotal, ...restObj } = data[0] || {};
  const keys = Object.keys(restObj);
  console.log(keys);
  const formattedData: any = {};
  keys.forEach((key) => (formattedData[key] = { count: [], percentage: [] }));
  data.forEach((rawDataElement) => {
    let date = new Date(rawDataElement.date).getTime();
    let total = Number(rawDataElement.total);
    keys.forEach((key) => {
      formattedData[key].count.push({
        x: date,
        y: Number(rawDataElement[key]) || 0,
      });
      formattedData[key].percentage.push({
        x: date,
        y: total > 0 ? (Number(rawDataElement[key]) / total) * 100 : 0,
      });
    });
  });

  const pointRadius = 3;
  const pointHoverRadius = 5;

  const chartData: ChartData<"line"> = { datasets: [] };
  keys.forEach((key) => {
    Object.keys(formattedData[key]).forEach((secKey) => {
      const color = STATUS_COLORS[key.toUpperCase()] || yColor;
      chartData.datasets.push({
        label: `${key} ${secKey}`,
        data: formattedData[key][secKey],
        borderColor: secKey === "count" ? color : lightenColor(color, 0.4),
        backgroundColor: secKey === "count" ? color : lightenColor(color, 0.4),
        pointRadius,
        pointHoverRadius,
        fill: false,
        tension: 0.1,
        yAxisID: `${secKey}`,
      });
    });
  });
  // const chartData: ChartData<"line"> = { datasets: datasets };
  // const chartData: ChartData<"line"> = {
  //   datasets: [
  //     {
  //       label:
  //         yAxisLabel || formik.values.status
  //           ? `${formik.values.status} Count`
  //           : "Count",
  //       data: formattedData.map((d) => ({
  //         x: d.trans_date.getTime(),
  //         y: d.errorCount,
  //       })),
  //       borderColor: yColor,
  //       backgroundColor: yColor,
  //       pointRadius,
  //       pointHoverRadius,
  //       fill: false,
  //       tension: 0.1,
  //       yAxisID: "y",
  //     },
  //     {
  //       label:
  //         yAxisLabel2 || formik.values.status
  //           ? `${formik.values.status} %`
  //           : "%",
  //       data: formattedData.map((d) => ({
  //         x: d.trans_date.getTime(),
  //         y: d.errorPercentage,
  //       })),
  //       borderColor: "rgba(255, 115, 0, 0.2)",
  //       backgroundColor: "rgba(255, 115, 0, 0.2)",
  //       fill: true,
  //       tension: 0.1,
  //       pointRadius,
  //       pointHoverRadius,
  //       yAxisID: "y1",
  //     },
  //   ],
  // };

  // const keys = Object.keys(test2[0] || {});
  // const statusKeys = keys.filter((key) => key !== "date" && key !== "total");

  // const test = statusKeys.map((key) => {
  //   return {
  //     datasets: [
  //       {
  //         label: key + " Count",
  //         data: test2.map((d) => ({
  //           x: d.date.getTime(),
  //           y: d[key]?.count,
  //         })),
  //         borderColor: yColor,
  //         backgroundColor: yColor,
  //         pointRadius,
  //         pointHoverRadius,
  //         fill: false,
  //         tension: 0.1,
  //         yAxisID: key,
  //       },
  //       {
  //         label: key + " %",
  //         data: test2.map((d) => ({
  //           x: d.date.getTime(),
  //           y: d[key]?.percentage,
  //         })),
  //         borderColor: "rgba(255, 115, 0, 0.2)",
  //         backgroundColor: "rgba(255, 115, 0, 0.2)",
  //         fill: true,
  //         tension: 0.1,
  //         pointRadius,
  //         pointHoverRadius,
  //         yAxisID: key + "1",
  //       },
  //     ],
  //   };
  // });
  // console.log("##############", chartData);
  // console.log("$$$$$$$$$$$$$$", test);

  // const lastInterval = applied.last ? LAST_INTERVALS[applied.last] : undefined;
  // const xMin = applied.date_start
  //   ? applied.date_start.valueOf()
  //   : lastInterval
  //     ? dayjs().subtract(lastInterval.amount, lastInterval.unit).valueOf()
  //     : undefined;
  // const xMax = applied.date_end ? applied.date_end.valueOf() : Date.now();

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "nearest" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: `${title}`,
      },
      zoom: {
        pan: {
          enabled: true,
          mode: "x",
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: "x",
        },
        limits: {
          x: { min: "original", max: "original" },
        },
      },
    },
    scales: {
      x: {
        type: "time" as const,
        min: minXValue,
        max: maxXValue,
        time: {
          tooltipFormat: "dd/MM/yyyy HH:mm",
          displayFormats: {
            second: "HH:mm:ss",
            minute: "dd/MM HH:mm",
            hour: "dd/MM/yyyy",
            day: "dd/MM/yyyy",
            month: "MMM yyyy",
            year: "yyyy",
          },
        },
        title: {
          display: true,
          text: xAxisLabel || "Date",
        },
      },
      count: {
        type: "linear" as const,
        position: "right" as const,
        beginAtZero: true,
        title: {
          display: true,
          text: "Total Status Count",
        },
        ticks: {
          color: yColor,
        },
        border: {
          color: yColor,
        },
      },
      percentage: {
        type: "linear" as const,
        position: "left" as const,
        beginAtZero: true,
        max: 100,
        grid: {
          drawOnChartArea: false, // only want the grid lines for one axis to show up
        },
        title: {
          display: true,
          text: "Status Percentage (%)",
        },
        ticks: {
          color: y1Color,
        },
        border: {
          color: y1Color,
        },
      },
    },
  };

  const { providers, apiNames, apiFunctions, statuses } =
    useApiTransactionOptions({
      api_provider: formik.values.api_provider,
      api_name: formik.values.api_name,
      api_function: formik.values.api_function,
      status: formik.values.status,
      date_start: formik.values.date_start
        ? formik.values.date_start.toISOString()
        : null,
      date_end: formik.values.date_end
        ? formik.values.date_end.toISOString()
        : null,
      all_facilities: formik.values.all_facilities,
    });
  console.log("*&*&*&", statuses);
  const getData = useCallback(
    async (filters: AppliedFilters, statuses: Record<string, string>[]) => {
      const res = await dashboardAxios.get(`${apiUrl}`, {
        params: {
          date_start: filters.date_start
            ? filters.date_start.format("YYYY-MM-DD HH:mm:ss")
            : null,
          date_end: filters.date_end
            ? filters.date_end.format("YYYY-MM-DD HH:mm:ss")
            : filters.date_start
              ? dayjs().format("YYYY-MM-DD HH:mm:ss")
              : null,
          last: filters.last || null,
          data_bin: filters.data_bin,
          api_provider: filters.api_provider,
          api_name: filters.api_name,
          api_function: filters.api_function,
          status: filters.status,
          ...(filters.all_facilities ? { all_facilities: true } : {}),
          statuses: statuses.map((item: any) => item.value) || [],
        },
      });
      setData(res.data);
    },
    [apiUrl],
  );

  useEffect(() => {
    getData(applied, statuses).catch((err) => {
      console.error("Error fetching data:", err);
    });
  }, [applied, getData]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Don't set up a new interval if "none" is selected
    if (applied.refresh === "none") {
      return;
    }

    const currentRefresh = applied.refresh
      ? parseInt(applied.refresh)
      : parseInt(refreshOptions[1].value); // Default to first numeric option

    intervalRef.current = setInterval(() => {
      getData(applied).catch((err) => {
        console.error("Error refreshing data:", err);
      });
    }, currentRefresh);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [applied, getData]);

  return (
    <>
      <>
        <Box sx={{ p: 3 }}>
          <form onSubmit={formik.handleSubmit}>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Box sx={{ flex: 1.2 }}>
                <FormControl
                  fullWidth
                  size="small"
                  error={formik.touched.last && Boolean(formik.errors.last)}
                >
                  <InputLabel id="last-label">Last</InputLabel>
                  <Select
                    labelId="last-label"
                    id="last"
                    name="last"
                    value={formik.values.last}
                    onChange={(event) => {
                      const nextLast = event.target.value;
                      const interval = nextLast
                        ? LAST_INTERVALS[nextLast]
                        : undefined;
                      const end = dayjs();
                      formik.setValues({
                        ...formik.values,
                        last: nextLast,
                        date_start: interval
                          ? end.subtract(interval.amount, interval.unit)
                          : null,
                        date_end: null,
                      });
                    }}
                    onBlur={formik.handleBlur}
                    label="Last"
                  >
                    {lastOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {formik.touched.last && formik.errors.last}
                  </FormHelperText>
                </FormControl>
              </Box>
              <Box sx={{ flex: 3, display: "flex", gap: 1 }}>
                {/* date start */}
                <DateTimePicker
                  format={DISPLAY_DATE_TIME_FORMAT}
                  label="Start Date"
                  value={formik.values.date_start}
                  maxDate={formik.values.date_end || dayjs()}
                  onChange={(value) => {
                    formik.setFieldValue("last", lastOptions[0].value);
                    formik.setFieldValue("date_start", value);
                  }}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      error:
                        formik.touched.date_start &&
                        Boolean(formik.errors.date_start),
                      helperText:
                        formik.touched.date_start && formik.errors.date_start,
                      sx: {
                        "> .MuiOutlinedInput-root": {},
                      },
                    },
                  }}
                />

                {/* date end */}
                <DateTimePicker
                  format={DISPLAY_DATE_TIME_FORMAT}
                  label="End Date"
                  value={formik.values.date_end}
                  onChange={(value) => {
                    formik.setFieldValue("refresh", refreshOptions[0].value);
                    formik.setFieldValue("last", lastOptions[0].value);
                    formik.setFieldValue("date_end", value);
                  }}
                  maxDate={dayjs()} // Set max date to today
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      error:
                        formik.touched.date_end &&
                        Boolean(formik.errors.date_end),
                      helperText:
                        formik.touched.date_end && formik.errors.date_end,
                      sx: {
                        "> .MuiOutlinedInput-root": {},
                      },
                    },
                  }}
                />
              </Box>

              <Box sx={{ flex: 2 }}>
                <Autocomplete
                  sx={{ width: "100%" }}
                  options={providers}
                  getOptionLabel={(option: ApiTransactionOption) =>
                    option.label
                  }
                  size="small"
                  value={
                    providers.find(
                      (option: ApiTransactionOption) =>
                        option.value === formik.values.api_provider,
                    ) || null
                  }
                  onChange={(
                    _event: SyntheticEvent,
                    value: ApiTransactionOption | null,
                  ) => {
                    formik.setFieldValue(
                      "api_provider",
                      value ? value.value : null,
                    );
                    formik.setFieldValue("api_name", null);
                    formik.setFieldValue("api_function", null);
                    formik.setFieldValue("status", null);
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="API Provider" size="small" />
                  )}
                />
              </Box>

              <Box sx={{ flex: 2 }}>
                <Autocomplete
                  sx={{ width: "100%" }}
                  options={apiNames}
                  getOptionLabel={(option: ApiTransactionOption) =>
                    option.label
                  }
                  size="small"
                  value={
                    apiNames.find(
                      (option: ApiTransactionOption) =>
                        option.value === formik.values.api_name,
                    ) || null
                  }
                  onChange={(
                    _event: SyntheticEvent,
                    value: ApiTransactionOption | null,
                  ) => {
                    formik.setFieldValue(
                      "api_name",
                      value ? value.value : null,
                    );
                    formik.setFieldValue("api_function", null);
                    formik.setFieldValue("status", null);
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="API Name" size="small" />
                  )}
                />
              </Box>

              <Box sx={{ flex: 2 }}>
                <Autocomplete
                  sx={{ width: "100%" }}
                  options={apiFunctions}
                  getOptionLabel={(option: ApiTransactionOption) =>
                    option.label
                  }
                  size="small"
                  value={
                    apiFunctions.find(
                      (option: ApiTransactionOption) =>
                        option.value === formik.values.api_function,
                    ) || null
                  }
                  onChange={(
                    _event: SyntheticEvent,
                    value: ApiTransactionOption | null,
                  ) => {
                    formik.setFieldValue(
                      "api_function",
                      value ? value.value : null,
                    );
                    formik.setFieldValue("status", null);
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="API Function" size="small" />
                  )}
                />
              </Box>

              <Box sx={{ flex: 2 }}>
                <Autocomplete
                  sx={{ width: "100%" }}
                  options={statuses}
                  getOptionLabel={(option: ApiTransactionOption) =>
                    option.label
                  }
                  size="small"
                  value={
                    statuses.find(
                      (option: ApiTransactionOption) =>
                        option.value === formik.values.status,
                    ) || null
                  }
                  onChange={(
                    _event: SyntheticEvent,
                    value: ApiTransactionOption | null,
                  ) => {
                    formik.setFieldValue("status", value ? value.value : null);
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Status" size="small" />
                  )}
                />
              </Box>

              <Box sx={{ flex: 1.5 }}>
                <FormControl
                  fullWidth
                  size="small"
                  error={
                    formik.touched.data_bin && Boolean(formik.errors.data_bin)
                  }
                >
                  <InputLabel id="refresh-label">Refresh</InputLabel>
                  <Select
                    labelId="refresh-label"
                    id="refresh"
                    name="refresh"
                    value={formik.values.refresh}
                    onChange={(event) => {
                      formik.setFieldValue("date_end", null);
                      const selectedIndex = refreshOptions.findIndex(
                        (option) => option.value === event.target.value,
                      );
                      if (selectedIndex > 0) {
                        formik.setFieldValue(
                          "data_bin",
                          dataBinOptions[selectedIndex - 1].value,
                        );
                      }
                      formik.handleChange(event);
                    }}
                    onBlur={formik.handleBlur}
                    label="Refresh"
                  >
                    {refreshOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {formik.touched.refresh && formik.errors.refresh}
                  </FormHelperText>
                </FormControl>
              </Box>

              <Box sx={{ flex: 1.5 }}>
                <FormControl
                  fullWidth
                  size="small"
                  error={
                    formik.touched.data_bin && Boolean(formik.errors.data_bin)
                  }
                >
                  <InputLabel id="data-bin-label">Data Bin</InputLabel>
                  <Select
                    labelId="data-bin-label"
                    id="data-bin"
                    name="data_bin"
                    value={formik.values.data_bin}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label="Data Bin"
                  >
                    {dataBinOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {formik.touched.data_bin && formik.errors.data_bin}
                  </FormHelperText>
                </FormControl>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  flexShrink: 0,
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      name="all_facilities"
                      color="success"
                      checked={formik.values.all_facilities}
                      onChange={(e) => {
                        formik.setFieldValue(
                          "all_facilities",
                          e.target.checked,
                        );
                      }}
                      sx={{
                        "& .MuiSvgIcon-root": { fontSize: 20 },
                        padding: "4px",
                      }}
                    />
                  }
                  label="All Facilities"
                />
                <IconButton type="submit" aria-label="search" color="primary">
                  <SearchIcon />
                </IconButton>
              </Box>
            </Box>
          </form>
        </Box>
      </>

      <Box sx={{ p: 3 }}>
        <Box sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
          <Box sx={{ p: 3 }}>
            <div style={{ height: "500px", width: "100%" }}>
              <Line data={chartData} options={options} />
            </div>
          </Box>
        </Box>
      </Box>
    </>
  );
};

const lightenColor = (hex: string, amount: number) => {
  const num = parseInt(hex.replace("#", ""), 16);

  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;

  r = Math.round(r + (255 - r) * amount);
  g = Math.round(g + (255 - g) * amount);
  b = Math.round(b + (255 - b) * amount);

  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
};

const darkenColor = (hex: string, amount: number) => {
  const num = parseInt(hex.replace("#", ""), 16);

  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;

  r = Math.round(r * (1 - amount));
  g = Math.round(g * (1 - amount));
  b = Math.round(b * (1 - amount));

  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
};

export default ErrorGraph;
