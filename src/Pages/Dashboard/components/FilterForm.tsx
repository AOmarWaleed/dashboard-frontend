import { useFormik } from "formik";
import * as Yup from "yup";
import dayjs from "dayjs";
import {
  API_DATE_TIME_MINUTES_FORMAT,
  DISPLAY_DATE_TIME_FORMAT,
  formatDateTime,
} from "../../../utils/dateFormat";
import {
  TextField,
  Autocomplete,
  Grid2 as Grid,
  IconButton,
  type SxProps,
  type Theme,
  CircularProgress,
  type AutocompleteProps,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { DesktopDateTimePicker as DateTimePicker } from "@mui/x-date-pickers/DesktopDateTimePicker";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";

import  globalAxios, { dashboardAxios } from "../../../api";

const AUTOCOMPLETE_ENDPOINTS = {
  PAYERS: "/dashboard/lookups/payers",
  ERRORS: "/dashboard/lookups/errors",
  DIAGNOSIS: "/dashboard/lookups/diagnosis",
  PHYSICIANS: "/dashboard/lookups/physicians",
  SERVICES: "/dashboard/lookups/services",
} as const;

const TRANSFORM_FUNCTIONS = {
  transformPayerResponse: (data: any[]) =>
    data.map((item) => ({
      value: item.payer_id,
      label: `${item.payer_id} · ${item.short_name}`,
      ...item,
    })),

  transformErrorResponse: (data: any[]) =>
    data.map((item) => ({
      value: item.error_id,
      label: `${item.error_id} · ${item.description}`,
      ...item,
    })),

  transformDiagnosisResponse: (data: any[]) =>
    data.map((item) => ({
      value: item.code_id,
      label: `${item.code_id} · ${item.ascii_short_desc}`,
      ...item,
    })),

  transformPhysicianResponse: (data: any[]) =>
    data.map((item) => ({
      value: item.employee_id,
      label: `${item.employee_id} · ${item.full_name}`,
      ...item,
    })),

  transformServiceResponse: (data: any[]) =>
    data.map((item) => ({
      value: item.item_bk,
      label: `${item.item_bk} · ${item.description}`,
      ...item,
    })),
};

// ============== DebouncedAutocomplete Component ==============
export interface OptionType {
  value: string;
  label: string;
  [key: string]: any;
}

interface DebouncedAutocompleteProps extends Omit<
  AutocompleteProps<OptionType, false, false, false>,
  "options" | "renderInput" | "onInputChange" | "value" | "onChange"
> {
  apiEndpoint: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: boolean;
  helperText?: string;
  size?: "small" | "medium";
  debounceDelay?: number;
  params?: Record<string, any>;
  transformResponse?: (data: any[]) => OptionType[];
  getOptionLabel?: (option: OptionType) => string;
  disabled?: boolean;
  placeholder?: string;
}

const DebouncedAutocomplete: React.FC<DebouncedAutocompleteProps> = ({
  apiEndpoint,
  value,
  onChange,
  label = "Search",
  error = false,
  helperText,
  size = "small",
  debounceDelay = 300,
  params = {},
  transformResponse,
  getOptionLabel,
  disabled = false,
  placeholder,
  ...autocompleteProps
}) => {
  const [options, setOptions] = useState<OptionType[]>([]);

  const [inputValue, setInputValue] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const defaultTransformResponse = useMemo(
    () =>
      (data: any[]): OptionType[] => {
        return data.map((item) => ({
          value: item.id || item.value || item.code || "",
          label:
            item.label ||
            item.name ||
            item.description ||
            String(item.value) ||
            "",
          ...item,
        }));
      },
    [],
  );

  // Find selected option based on value
  const selectedOption = useMemo(() => {
    if (!value) return null;
    return options.find((option) => option.value === value) || null;
  }, [value, options]);

  // Default getOptionLabel
  const defaultGetOptionLabel = (option: OptionType) => option.label || "";

  const fetchOptions = useCallback(
    async (searchTerm: string) => {
      if (!apiEndpoint) return;

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setLoading(true);

      try {
        const response = await dashboardAxios.get(apiEndpoint, {
          params: {
            _search: searchTerm,
            ...params,
          },
          signal: abortControllerRef.current.signal,
        });

        const transformedData = transformResponse
          ? transformResponse(response.data)
          : defaultTransformResponse(response.data);

        setOptions(transformedData);
      } catch (err: any) {
        if (err.name === "AbortError") {
          console.log("Request aborted");
          return;
        }
        console.error(`Error fetching options from ${apiEndpoint}:`, err);
        setOptions([]);
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [
      apiEndpoint,
      JSON.stringify(params),
      transformResponse,
      defaultTransformResponse,
    ],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOptions(inputValue);
    }, debounceDelay);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [inputValue, debounceDelay, fetchOptions]);

  // Handle input change
  const handleInputChange = useCallback(
    (_event: React.SyntheticEvent, newValue: string) => {
      setInputValue(newValue);
    },
    [],
  );

  // Handle option selection
  const handleChange = useCallback(
    (_event: React.SyntheticEvent, newValue: OptionType | null) => {
      onChange(newValue ? newValue.value : "");

      // Clear input value when selection is cleared
      if (!newValue) {
        setInputValue("");
      }
    },
    [onChange],
  );

  // Handle key down
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        onChange("");
        setInputValue("");
      }
    },
    [onChange],
  );

  return (
    <Autocomplete
      options={options}
      value={selectedOption}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      loading={loading}
      disabled={disabled}
      getOptionLabel={getOptionLabel || defaultGetOptionLabel}
      isOptionEqualToValue={(option, val) => option.value === val.value}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          size={size}
          error={error}
          helperText={helperText}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? (
                  <CircularProgress color="inherit" size={20} />
                ) : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      {...autocompleteProps}
    />
  );
};

// ============== FilterForm Component ==============
export interface Filters {
  date_start: string | null;
  date_end?: string | null;
  payer_id?: string;
  error_code?: string;
  diagnosis_code?: string;
  physician_id?: string;
  service_code?: string;
}

interface FilterProps {
  setFilterValues: (values: Filters) => void;
  sx?: SxProps<Theme>;
}

const FilterForm = ({ setFilterValues, sx }: FilterProps) => {
  
  const [timeStampFormate, setTimeStampFormate] = useState(
    DISPLAY_DATE_TIME_FORMAT,
  );

  useEffect(() => {
    const fetchDateFormats = async () => {
      try {
        const { data } = await globalAxios.get(`/systemRules/front_formate`);
        const formats = data?.data;
        if (formats) {
          setTimeStampFormate(
            formats.TIMESTAMP_FORMAT_FRONT || DISPLAY_DATE_TIME_FORMAT,
          );
        }
      } catch (error) {
        console.error("Failed to load date format:", error);
      }
    };

    fetchDateFormats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formik = useFormik({
    initialValues: {
      date_start: dayjs().subtract(5, "minute"),
      date_end: null,
      payer_id: "",
      error_code: "",
      diagnosis_code: "",
      physician_id: "",
      service_code: "",
    },
    validationSchema: Yup.object({
      date_start: Yup.date().required("Start Date is required"),
    }),
    onSubmit: (values) => {
      const formattedValues = {
        ...values,
        date_start:
          formatDateTime(values.date_start, API_DATE_TIME_MINUTES_FORMAT) ??
          null,
        date_end:
          formatDateTime(values.date_end, API_DATE_TIME_MINUTES_FORMAT) ??
          null,
      };

      setFilterValues(formattedValues);
      console.log("Form values:", formattedValues);
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} style={{ width: "100%" }}>
      <Grid container spacing={2} sx={{ alignItems: "center", ...sx }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }} sx={{ display: "flex", gap: 1 }}>
          {/* Start Date */}
          <DateTimePicker
            format={timeStampFormate}
            views={["year", "day", "hours", "minutes", "seconds"]}
            label="Start Date"
            value={formik.values.date_start}
            onChange={(value) => formik.setFieldValue("date_start", value)}
            slotProps={{
              textField: {
                fullWidth: true,
                size: "small",
                error:
                  formik.touched.date_start &&
                  Boolean(formik.errors.date_start),
                helperText:
                  formik.touched.date_start && formik.errors.date_start
                    ? String(formik.errors.date_start)
                    : undefined,
              },
            }}
          />

          {/* End Date */}
          <DateTimePicker
            label="End Date"
            format={timeStampFormate}
            value={formik.values.date_end}
            onChange={(value) => formik.setFieldValue("date_end", value)}
            minDate={formik.values.date_start}
            slotProps={{
              textField: {
                fullWidth: true,
                size: "small",
                error:
                  formik.touched.date_end && Boolean(formik.errors.date_end),
                helperText:
                  formik.touched.date_end && formik.errors.date_end
                    ? String(formik.errors.date_end)
                    : undefined,
              },
            }}
          />
        </Grid>

        {/* Payer */}
        <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
          <DebouncedAutocomplete
            apiEndpoint={AUTOCOMPLETE_ENDPOINTS.PAYERS}
            value={formik.values.payer_id}
            onChange={(value) => formik.setFieldValue("payer_id", value)}
            label="Payer"
            error={formik.touched.payer_id && Boolean(formik.errors.payer_id)}
            helperText={
              formik.touched.payer_id ? formik.errors.payer_id : undefined
            }
            transformResponse={TRANSFORM_FUNCTIONS.transformPayerResponse}
            params={{ searchField: "payer_id" }}
          />
        </Grid>

        {/* Error */}
        <Grid size={{ xs: 12, sm: 6, lg: 1.6 }}>
          <DebouncedAutocomplete
            apiEndpoint={AUTOCOMPLETE_ENDPOINTS.ERRORS}
            value={formik.values.error_code}
            onChange={(value) => formik.setFieldValue("error_code", value)}
            label="Error"
            error={
              formik.touched.error_code && Boolean(formik.errors.error_code)
            }
            helperText={
              formik.touched.error_code ? formik.errors.error_code : undefined
            }
            transformResponse={TRANSFORM_FUNCTIONS.transformErrorResponse}
          />
        </Grid>

        {/* Diagnosis */}
        <Grid size={{ xs: 12, sm: 6, lg: 1.6 }}>
          <DebouncedAutocomplete
            apiEndpoint={AUTOCOMPLETE_ENDPOINTS.DIAGNOSIS}
            value={formik.values.diagnosis_code}
            onChange={(value) => formik.setFieldValue("diagnosis_code", value)}
            label="Diagnosis"
            transformResponse={TRANSFORM_FUNCTIONS.transformDiagnosisResponse}
          />
        </Grid>

        {/* Physician */}
        <Grid size={{ xs: 12, sm: 6, lg: 1.6 }}>
          <DebouncedAutocomplete
            apiEndpoint={AUTOCOMPLETE_ENDPOINTS.PHYSICIANS}
            value={formik.values.physician_id}
            onChange={(value) => formik.setFieldValue("physician_id", value)}
            label="Physician"
            transformResponse={TRANSFORM_FUNCTIONS.transformPhysicianResponse}
          />
        </Grid>

        {/* Service */}
        <Grid size={{ xs: 12, sm: 6, lg: 1.6 }}>
          <DebouncedAutocomplete
            apiEndpoint={AUTOCOMPLETE_ENDPOINTS.SERVICES}
            value={formik.values.service_code}
            onChange={(value) => formik.setFieldValue("service_code", value)}
            label="Service"
            transformResponse={TRANSFORM_FUNCTIONS.transformServiceResponse}
          />
        </Grid>

        {/* Search Button */}
        <Grid size={{ xs: 0.5, sm: 0.5, lg: 0.5 }}>
          <IconButton type="submit" aria-label="search">
            <SearchIcon />
          </IconButton>
        </Grid>
      </Grid>
    </form>
  );
};

export default FilterForm;
