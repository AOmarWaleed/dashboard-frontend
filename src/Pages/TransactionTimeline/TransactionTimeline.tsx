import {
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { Dispatch, SetStateAction, SyntheticEvent } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Box,
  TextField,
  IconButton,
  Autocomplete,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { DesktopDateTimePicker as DateTimePicker } from "@mui/x-date-pickers/DesktopDateTimePicker";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { Secure } from "@givc/shared-components";
import OverviewSection from "./components/OverviewSection";
import TransactionsByDateSection from "./components/TransactionsByDateSection";
import TransactionsByHourSection from "./components/TransactionsByHourSection";
import dayjs from "dayjs";
import {
  API_DATE_TIME_MINUTES_FORMAT,
  DISPLAY_DATE_TIME_FORMAT,
  formatDateTime,
} from "../../utils/dateFormat";

// import NphiesTopFailsSection from "./components/NphiesTopFailsSections";
import ClaimsByPayerSection from "./components/ClaimsByPayerSection";
import EligibilityTopErrorSection from "./components/EligibilityTopErrorSection";
import FacilitiesSection from "./components/FacilitiesSection";
import RejectionAnalysisSection from "./components/RejectionAnalysisSection";
import { useApiTransactionOptions } from "../../Hooks/useApiTransactionOptions";
// import { useNavigate } from "react-router-dom";
import { AuthGuardContext } from "@givc/shared-components";
import { dashboardAxios } from "../../api";
import type { pageType } from "../../constants";
import HandleTitle from "../../components/HandleTitle";
import QuickTimeRange from "../../components/QuickTimeRange";
import {
  DEFAULT_QUICK_TIME_RANGE,
  getQuickTimeRange,
} from "../../components/QuickTimeRange.utils";
import type { QuickTimeRangeValue } from "../../components/QuickTimeRange.utils";
import type { Dayjs } from "dayjs";
import type { ReportPayload } from "./report";
export type ReportRowData = Array<Record<string, unknown>> | ReportPayload;

// API boundary: each endpoint returns a different row shape.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FetchData = (endPoint: string, setRows: Dispatch<SetStateAction<any>>) => Promise<any>;

export type SearchParams = {
  date_start: string | null;
  date_end: string | null;
  payer_id: string | null;
  api_name: string | null;
  api_provider: string | null;
  api_function: string | null;
  status: string | null;
  all_facilities?: boolean;
  facility_id?: string | number;
}

export interface TabProps {
  searchParams: SearchParams & {
    facility_id?: string | number;
    all_facilities?: boolean;
  };
  error: string;
  loading: boolean;
  fetchData: FetchData;
  page: pageType;
  facilityId?: string | number;
}

export interface TransactionTimelineProps {
  facilityId?: string | number;
}

export default function TransactionTimeline({
  facilityId,
}: TransactionTimelineProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTab, setCurrentTab] = useState<string>("0");
  const [quickTimeRange, setQuickTimeRange] = useState<
    QuickTimeRangeValue | ""
  >(DEFAULT_QUICK_TIME_RANGE);
  const { start: defaultStart, end: defaultEnd } = getQuickTimeRange(
    DEFAULT_QUICK_TIME_RANGE,
  );
  const [submittedParams, setSubmittedParams] = useState<SearchParams>({
    date_start: formatDateTime(defaultStart, API_DATE_TIME_MINUTES_FORMAT) ?? null,
    date_end: formatDateTime(defaultEnd, API_DATE_TIME_MINUTES_FORMAT) ?? null,
    payer_id: null,
    api_name: null,
    api_provider: null,
    api_function: null,
    status: null,
  });

  //==================  * Resources * ===================
  const ctx = useContext(AuthGuardContext);
  const t = ctx?.t ?? ((key: string) => key);

  const toApiDateTimeOrNull = (
    v: Dayjs | string | null | undefined,
  ) => formatDateTime(v, API_DATE_TIME_MINUTES_FORMAT) ?? null;

  // Formik initialization
  const formik = useFormik({
    initialValues: {
      date_start: defaultStart as Dayjs | null,
      date_end: defaultEnd as Dayjs | null,
      all_facilities: false,
      payer_id: null as string | null,
      api_name: null as string | null,
      api_provider: null as string | null,
      api_function: null as string | null,
    status: null as string | null,
    },
    validationSchema: Yup.object({
      date_start: Yup.date().required(
        t("transactionAnalysis_30_StartDateRequired"),
      ),
      date_end: Yup.date()
        .nullable()
        .test(
          "is-after-start",
          t("transactionAnalysis_30_EndDateAfterStart") ?? "",
          function (value) {
            return (
              !value ||
              !this.parent.date_start ||
              dayjs(value).isAfter(dayjs(this.parent.date_start))
            );
          },
        ),
    }),
    onSubmit: (values, formikHelpers) => {
      let date_start = values.date_start;
      let date_end = values.date_end;
      if (quickTimeRange) {
        const { start, end } = getQuickTimeRange(quickTimeRange);
        date_start = start;
        date_end = end;
        formikHelpers.setFieldValue("date_start", start);
        formikHelpers.setFieldValue("date_end", end);
      }
      setSubmittedParams({
        date_start: toApiDateTimeOrNull(date_start),
        date_end: toApiDateTimeOrNull(date_end),
        payer_id: values.payer_id,
        api_name: values.api_name,
        api_provider: values.api_provider,
        api_function: values.api_function,
        status: values.status,
        ...(values.all_facilities ? { all_facilities: true } : {}),
      });
    },
  });

  const { payers, providers, apiNames, apiFunctions, statuses } =
    useApiTransactionOptions({
      payer_id: formik.values.payer_id,
      api_provider: formik.values.api_provider,
      api_name: formik.values.api_name,
      api_function: formik.values.api_function,
      status: formik.values.status,
      date_start: toApiDateTimeOrNull(formik.values.date_start),
      date_end: toApiDateTimeOrNull(formik.values.date_end),
      all_facilities: formik.values.all_facilities,
      facility_id: facilityId,
    });

  const effectiveParams = useMemo(
    () => ({
      ...submittedParams,
      ...(submittedParams.all_facilities
        ? { all_facilities: true }
        : facilityId
          ? { facility_id: facilityId }
          : {}),
    }),
    [submittedParams, facilityId],
  );

  const fetchData: FetchData = useCallback(
    async (endPoint, setRows) => {
      setLoading(true);
      setError("");

      try {
        const endpoint = `/transactionTimeline/${endPoint}`;
        const { data } = await dashboardAxios.get(endpoint, {
          params: {
            date_start: effectiveParams.date_start,
            date_end: effectiveParams.date_end,
            payer_id: effectiveParams.payer_id,
            api_name: effectiveParams.api_name,
            api_provider: effectiveParams.api_provider,
            api_function: effectiveParams.api_function,
            status: effectiveParams.status,
            ...(effectiveParams.all_facilities
              ? { all_facilities: true }
              : effectiveParams.facility_id
                ? { facility_id: effectiveParams.facility_id }
                : {}),
          },
        });

        if (Array.isArray(data?.statuses)) {
          setRows(data);
        } else if (Array.isArray(data?.apiNames)) {
          setRows(data);
        } else if (Array.isArray(data?.data)) {
          setRows(
            data.data.map((item: Record<string, unknown>, i: number) => ({
              id: item.id ?? i,
              ...item,
            })),
          );
        } else {
          setRows(data);
        }
      } catch (err) {
        setError("Failed to fetch data");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    },
    [effectiveParams],
  );

  if (!ctx) {
    return null;
  }

  const handleTabChange = (_event: SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
  };

  const handleClear = () => {
    formik.resetForm({
      values: {
        date_start: null,
        date_end: null,
        all_facilities: false,
        payer_id: null,
        api_name: null,
        api_provider: null,
        api_function: null,
        status: null,
      },
    });
    setQuickTimeRange("");
    setSubmittedParams({
      date_start: null,
      date_end: null,
      payer_id: null,
      api_name: null,
      api_provider: null,
      api_function: null,
      status: null,
    });
  };

  return (
    <>
      <HandleTitle titleKey="TRANSACTION_ANALYSIS" />
      <Box component="form" onSubmit={formik.handleSubmit}>
        <Box sx={{ display: "flex", gap: 2, p: 3, alignItems: "center" }}>
          <Box sx={{ width: "14%" }}>
            <QuickTimeRange
              value={quickTimeRange}
              onChange={(range) => {
                const { start, end } = getQuickTimeRange(range);
                setQuickTimeRange(range);
                formik.setValues({
                  ...formik.values,
                  date_start: start,
                  date_end: end,
                });
              }}
            />
          </Box>
          <Box sx={{ width: "14%" }}>
            <DateTimePicker
              label={t("transactionAnalysis_30_StartDate")}
              format={DISPLAY_DATE_TIME_FORMAT}
              value={formik.values.date_start}
              views={["year", "day", "hours", "minutes", "seconds"]}
              onChange={(value) => {
                setQuickTimeRange("");
                formik.setFieldValue("date_start", value);
                formik.setFieldValue("payer_id", null);
                formik.setFieldValue("api_provider", null);
                formik.setFieldValue("api_name", null);
                formik.setFieldValue("api_function", null);
                formik.setFieldValue("status", null);
              }}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  sx: {
                    "> .MuiOutlinedInput-root": {},
                  },
                  error:
                    formik.touched.date_start &&
                    Boolean(formik.errors.date_start),
                  helperText: (
                    <>{formik.touched.date_start && formik.errors.date_start}</>
                  ),
                },
              }}
            />
          </Box>
          <Box sx={{ width: "14%" }}>
            <DateTimePicker
              label={t("transactionAnalysis_30_EndDate")}
              views={["year", "day", "hours", "minutes", "seconds"]}
              format={DISPLAY_DATE_TIME_FORMAT}
              value={formik.values.date_end}
              minDate={formik.values.date_start ?? undefined}
              onChange={(value) => {
                setQuickTimeRange("");
                formik.setFieldValue("date_end", value);
                formik.setFieldValue("payer_id", null);
                formik.setFieldValue("api_provider", null);
                formik.setFieldValue("api_name", null);
                formik.setFieldValue("api_function", null);
                formik.setFieldValue("status", null);
              }}
              slotProps={{
                field: {
                  clearable: true,
                  onClear: () => formik.setFieldValue("date_end", null),
                },
                textField: {
                  size: "small",
                  fullWidth: true,
                  sx: {
                    "> .MuiOutlinedInput-root": {},
                  },
                  error:
                    formik.touched.date_end && Boolean(formik.errors.date_end),
                  helperText: (
                    <>{formik.touched.date_end && formik.errors.date_end}</>
                  ),
                },
              }}
            />
          </Box>

          <Autocomplete
            sx={{ width: "20rem" }}
            options={payers}
            getOptionLabel={(option) => option.label}
            size="small"
            value={
              payers.find(
                (option) => option.value === formik.values.payer_id,
              ) || null
            }
            onChange={(_, newValue) => {
              formik.setFieldValue("payer_id", newValue?.value || null);
              formik.setFieldValue("api_provider", null);
              formik.setFieldValue("api_name", null);
              formik.setFieldValue("api_function", null);
              formik.setFieldValue("status", null);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={t("transactionAnalysis_30_Payer")}
                variant="outlined"
                fullWidth
              />
            )}
          />
          {/* FINDME */}
          <Autocomplete
            sx={{ width: "10rem" }}
            options={providers}
            getOptionLabel={(option) => option.label}
            size="small"
            value={
              providers.find(
                (option) => option.value === formik.values.api_provider,
              ) || null
            }
            onChange={(_, value) => {
              formik.setFieldValue("api_provider", value ? value.value : null);
              formik.setFieldValue("api_name", null);
              formik.setFieldValue("api_function", null);
              formik.setFieldValue("status", null);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                // fullWidth
                label={
                  t("transactionAnalysis_30_APIProvider") || "API Provider"
                }
                // name="api_name"
                size="small"
                // onChange={formik.handleChange}
                error={
                  formik.touched.api_name && Boolean(formik.errors.api_name)
                }
                helperText={formik.touched.api_name && formik.errors.api_name}
              />
            )}
          />
          <Autocomplete
            sx={{ width: "10rem" }}
            options={apiNames}
            getOptionLabel={(option) => option.label}
            size="small"
            value={
              apiNames.find(
                (option) => option.value === formik.values.api_name,
              ) || null
            }
            onChange={(_, value) => {
              formik.setFieldValue("api_name", value ? value.value : null);
              formik.setFieldValue("api_function", null);
              formik.setFieldValue("status", null);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={t("transactionAnalysis_30_APIName") || "API Name"}
                variant="outlined"
                fullWidth
              />
            )}
          />
          <Autocomplete
            sx={{ width: "10rem" }}
            options={apiFunctions}
            getOptionLabel={(option) => option.label}
            size="small"
            value={
              apiFunctions.find(
                (option) => option.value === formik.values.api_function,
              ) || null
            }
            onChange={(_, value) => {
              formik.setFieldValue("api_function", value ? value.value : null);
              formik.setFieldValue("status", null);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={
                  t("transactionAnalysis_30_APIFunction") || "API Function"
                }
                variant="outlined"
                fullWidth
              />
            )}
          />
          <Autocomplete
            sx={{ width: "10rem" }}
            options={statuses}
            getOptionLabel={(option) => option.label}
            size="small"
            value={
              statuses.find(
                (option) => option.value === formik.values.status,
              ) || null
            }
            onChange={(_, value) => {
              formik.setFieldValue("status", value ? value.value : null);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={t("transactionAnalysis_30_Status") || "Status"}
                variant="outlined"
                fullWidth
              />
            )}
          />
          <Box
            sx={{
              flexShrink: 0,
              "& .MuiFormControlLabel-root": {
                marginInline: "0 !important",
                whiteSpace: "nowrap",
              },
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  color="success"
                  checked={formik.values.all_facilities}
                  onChange={(e) => {
                    formik.setFieldValue("all_facilities", e.target.checked);
                  }}
                  sx={{
                    "& .MuiSvgIcon-root": { fontSize: 20 },
                    padding: "5px",
                  }}
                />
              }
              label={
                t("transactionAnalysis_30_AllFacilities") || "All Facilities"
              }
            />
          </Box>
          <IconButton
            type="button"
            aria-label="clear"
            color="inherit"
            onClick={handleClear}
          >
            <ClearIcon />
          </IconButton>
          <IconButton type="submit" aria-label="search" color="inherit">
            <SearchIcon />
          </IconButton>
        </Box>

        {
          <Secure.GLLab.TabContext
            permission="transactionTimeline_30_tabs"
            value={currentTab}
          >
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
              <Secure.GLLab.TabList
                onChange={handleTabChange}
                sx={{
                  "& .MuiTab-root": {
                    fontWeight: "medium",
                    textTransform: "none",
                    minWidth: 120,
                  },
                  "& .Mui-selected": {
                    fontWeight: "bold",
                    color: "primary.main",
                  },
                }}
                aria-label="transaction reports tabs"
              >
                <Secure.GLLab.Tab
                  permission="transactionTimeline_30_tabOverview"
                  label={t("transactionAnalysis_30_TabOverview")}
                  fallBackText="Overview"
                  value="0"
                />
                <Secure.GLLab.Tab
                  permission="transactionTimeline_30_tabClaimsByPayer"
                  label={t("transactionAnalysis_30_TabClaimsByPayer")}
                  fallBackText="Claims By Payer"
                  value="1"
                />
                <Secure.GLLab.Tab
                  permission="transactionTimeline_30_tabRejectionAnalysis"
                  label={t("transactionAnalysis_30_TabRejectionAnalysis")}
                  fallBackText="Rejection Analysis"
                  value="2"
                />
                <Secure.GLLab.Tab
                  permission="transactionTimeline_30_tabByDate"
                  label={t("transactionAnalysis_30_TabByDate")}
                  fallBackText="By Date"
                  value="3"
                />
                <Secure.GLLab.Tab
                  permission="transactionTimeline_30_tabByHour"
                  label={t("transactionAnalysis_30_TabByHour")}
                  fallBackText="By Hour"
                  value="4"
                />
                {/* NOTE: NphiesTopFails tab hidden intentionally (see import note above).
                <Secure.GLLab.Tab
                  permission="transactionTimeline_30_tabNphiesTopFails"
                  label={t("transactionAnalysis_30_TabNphiesTopFails")}
                  fallBackText="Top Fails"
                  value="hidden-topfails"
                />
                */}
                <Secure.GLLab.Tab
                  permission="transactionTimeline_30_tabTopErrors"
                  label={t("transactionAnalysis_30_TabTopErrors")}
                  fallBackText="Top Errors"
                  value="5"
                />
                <Secure.GLLab.Tab
                  permission="transactionTimeline_30_tabFacilities"
                  label={t("transactionAnalysis_30_TabFacilities")}
                  fallBackText="Facilities"
                  value="6"
                />
              </Secure.GLLab.TabList>
            </Box>
            <Box key={facilityId ?? "default"}>
              <Secure.GLLab.TabPanel
                permission="transactionTimeline_30_tabOverview"
                value="0"
              >
                <OverviewSection
                  fetchData={fetchData}
                  searchParams={effectiveParams}
                  error={error}
                  loading={loading}
                  facilityId={facilityId}
                />
              </Secure.GLLab.TabPanel>

              <Secure.GLLab.TabPanel
                permission="transactionTimeline_30_tabClaimsByPayer"
                value="1"
              >
                <Box sx={{ p: 3 }}>
                  <ClaimsByPayerSection
                    fetchData={fetchData}
                    searchParams={effectiveParams}
                    error={error}
                    loading={loading}
                    facilityId={facilityId}
                  />
                </Box>
              </Secure.GLLab.TabPanel>

              <Secure.GLLab.TabPanel
                permission="transactionTimeline_30_tabRejectionAnalysis"
                value="2"
              >
                <RejectionAnalysisSection
                  fetchData={fetchData}
                  searchParams={effectiveParams}
                  error={error}
                  loading={loading}
                  page="transactionTimeline"
                  facilityId={facilityId}
                />
              </Secure.GLLab.TabPanel>

              <Secure.GLLab.TabPanel
                permission="transactionTimeline_30_tabByDate"
                value="3"
              >
                <TransactionsByDateSection
                  fetchData={fetchData}
                  searchParams={effectiveParams}
                  error={error}
                  loading={loading}
                  facilityId={facilityId}
                />
              </Secure.GLLab.TabPanel>

              <Secure.GLLab.TabPanel
                permission="transactionTimeline_30_tabByHour"
                value="4"
              >
                <TransactionsByHourSection
                  fetchData={fetchData}
                  searchParams={effectiveParams}
                  error={error}
                  loading={loading}
                  facilityId={facilityId}
                />
              </Secure.GLLab.TabPanel>
              {/* NOTE: NphiesTopFails panel hidden intentionally (see import note above).
              <Secure.GLLab.TabPanel
                permission="transactionTimeline_30_tabNphiesTopFails"
                value="hidden-topfails"
                sx={{ p: 0 }}
              >
              <Box>
                <NphiesTopFailsSection
                  searchParams={effectiveParams}
                  error={error}
                  loading={loading}
                  page="transactionTimeline"
                  facilityId={facilityId}
                />
              </Box>
              </Secure.GLLab.TabPanel>
            */}

              <Secure.GLLab.TabPanel
                permission="transactionTimeline_30_tabTopErrors"
                value="5"
                sx={{ p: 0 }}
              >
                <Box>
                  <EligibilityTopErrorSection
                    searchParams={effectiveParams}
                    error={error}
                    loading={loading}
                    page="transactionTimeline"
                  />
                </Box>
              </Secure.GLLab.TabPanel>
              <Secure.GLLab.TabPanel
                permission="transactionTimeline_30_tabFacilities"
                value="6"
                sx={{ p: 0 }}
              >
                <Box>
                  <FacilitiesSection
                    searchParams={effectiveParams}
                    error={error}
                    loading={loading}
                    page="transactionTimeline"
                  />
                </Box>
              </Secure.GLLab.TabPanel>
            </Box>
          </Secure.GLLab.TabContext>
        }
      </Box>
    </>
  );
}
