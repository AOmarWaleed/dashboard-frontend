import { useCallback, useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { dashboardAxios } from "../../../api";
import {
  TextField,
  Autocomplete,
  Box,
  IconButton,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Typography,
  CircularProgress,
  debounce,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { DesktopDateTimePicker as DateTimePicker } from "@mui/x-date-pickers/DesktopDateTimePicker";
import { DISPLAY_DATE_TIME_FORMAT } from "../../../utils/dateFormat";
import { Secure } from "@givc/shared-components";
import { PERMISSIONS_PREFIXES } from "../../../constants";
import ClearIcon from "@mui/icons-material/Clear";
import QuickTimeRange from "../../../components/QuickTimeRange";
import {
  DEFAULT_QUICK_TIME_RANGE,
  getQuickTimeRange,
} from "../../../components/QuickTimeRange.utils";
import type { QuickTimeRangeValue } from "../../../components/QuickTimeRange.utils";
import { Collapse } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export interface Filters {
  date_start: dayjs.Dayjs | string | null;
  date_end?: dayjs.Dayjs | string | null;
  payer_id?: string;
  api_name?: string;
  api_function?: string;
  transaction_status?: string;
  api_provider?: string;
  trans_id?: string | number;
  bundle_id?: string | number;
  status?: boolean;
  payers?: boolean;
  all_facilities?: boolean;
}

interface FilterProps {
  setFilterValues: (values: Filters) => void;
  refetchRefPayer: React.MutableRefObject<(() => void) | null>;
  refetchRefSummary: React.MutableRefObject<(() => void) | null>;
  sx?: {};
}

const FilterForm = ({
  setFilterValues,
  sx,
  refetchRefPayer,
  refetchRefSummary,
}: FilterProps) => {
  const [quickTimeRange, setQuickTimeRange] = useState<
    QuickTimeRangeValue | ""
  >(DEFAULT_QUICK_TIME_RANGE);
  const defaultRange = getQuickTimeRange(DEFAULT_QUICK_TIME_RANGE);
  const [payerOptions, setPayerOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [loadingPayers, setLoadingPayers] = useState(false);

  const [apiProviderList, setApiProviderList] = useState<any[]>([]);
  const [apiNamesList, setApiNamesList] = useState<any[]>([]);
  const [apiFunctionsList, setApiFunctionsList] = useState<any[]>([]);
  const [transactionStatusList, setTransactionStatusList] = useState<any[]>([]);
  const [expanded, setExpanded] = useState(
    localStorage.getItem("trasnmonitorCollapse") || "N",
  );

  const formik = useFormik({
    initialValues: {
      date_start: defaultRange.start as Dayjs | null,
      date_end: defaultRange.end as Dayjs | null,
      payer_id: "",
      api_name: "",
      api_function: "",
      api_provider: "",
      transaction_status: "",
      trans_id: "",
      bundle_id: "",
      status: true,
      payers: true,
      all_facilities: false,
      patient: null,
    },
    validationSchema: Yup.object({
      date_start: Yup.date().required("Start Date is required"),
    }),
    onSubmit: (values, formikHelpers) => {
      let dateStartValue = values.date_start;
      let dateEndValue = values.date_end;

      if (quickTimeRange) {
        const { start, end } = getQuickTimeRange(quickTimeRange);
        dateStartValue = start;
        dateEndValue = end;
        formikHelpers.setFieldValue("date_start", start);
        formikHelpers.setFieldValue("date_end", end);
      }

      const date_start = dayjs(dateStartValue)
        .format("YYYY-MM-DD HH:mm")
        .toLowerCase();
      const date_end = dateEndValue
        ? dayjs(dateEndValue).format("YYYY-MM-DD HH:mm").toLowerCase()
        : null;

      const effectiveValues = {
        ...values,
        date_start: dateStartValue,
        date_end: dateEndValue,
      };

      const data: any = { ...effectiveValues, date_start, date_end };
      delete data?.patient;
      if (values.patient) {
        data.patient_id = (values.patient as any)?.patient_id;
      }
      setFilterValues(data);
      handleSubmit(effectiveValues);

      Promise.resolve(refetchRefPayer?.current?.())
        .then(
          () => {
            refetchRefSummary?.current?.();
          },
          () => {
            refetchRefSummary?.current?.();
          },
        );
    },
  });

  const handleSubmit = async (values: typeof formik.values) => {
    fetchOptions(values);
  };

  const formatDateTime = (v: any) =>
    v ? dayjs(v).format("YYYY-MM-DD HH:mm") : null;

  const fetchOptions = useCallback(async (values: typeof formik.values) => {
    setLoadingPayers(true);
    try {
      const { data } = await dashboardAxios.get(
        "/transMonitor/options/filter",
        {
          params: {
            date_start: formatDateTime(values.date_start),
            date_end: formatDateTime(values.date_end),
            payer_id: values.payer_id || null,
            api_provider: values.api_provider || null,
            api_name: values.api_name || null,
            api_function: values.api_function || null,
            transaction_status: values.transaction_status || null,
            all_facilities: values.all_facilities ? true : undefined,
          },
        },
      );

      const d = data?.data ?? {};

      setPayerOptions(d.payers ?? []);
      setApiProviderList(d.providers ?? []);
      setApiNamesList(d.apiNames ?? []);
      setApiFunctionsList(d.apiFunctions ?? []);
      setTransactionStatusList(d.statuses ?? []);
    } catch {
      setPayerOptions([]);
      setApiProviderList([]);
      setApiNamesList([]);
      setApiFunctionsList([]);
      setTransactionStatusList([]);
    } finally {
      setLoadingPayers(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingPayers(true);
      try {
        const { data } = await dashboardAxios.get(
          "/transMonitor/options/filter",
          {
            params: {
              date_start: formatDateTime(formik.values.date_start),
              date_end: formatDateTime(formik.values.date_end),
              payer_id: formik.values.payer_id || null,
              api_provider: formik.values.api_provider || null,
              api_name: formik.values.api_name || null,
              api_function: formik.values.api_function || null,
              transaction_status: formik.values.transaction_status || null,
              all_facilities: formik.values.all_facilities ? true : undefined,
            },
          },
        );
        if (!active) return;
        const d = data?.data ?? {};
        setPayerOptions(d.payers ?? []);
        setApiProviderList(d.providers ?? []);
        setApiNamesList(d.apiNames ?? []);
        setApiFunctionsList(d.apiFunctions ?? []);
        setTransactionStatusList(d.statuses ?? []);
      } catch {
        if (!active) return;
        setPayerOptions([]);
        setApiProviderList([]);
        setApiNamesList([]);
        setApiFunctionsList([]);
        setTransactionStatusList([]);
      } finally {
        if (active) setLoadingPayers(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [
    formik.values.date_start,
    formik.values.date_end,
    formik.values.payer_id,
    formik.values.api_provider,
    formik.values.api_name,
    formik.values.api_function,
    formik.values.transaction_status,
    formik.values.all_facilities,
  ]);

  const [patientOptions, setPatientOptions] = useState<
    {
      patient_id: string;
      first_name: string;
      middle_names: string;
      last_name: string;
    }[]
  >([]);
  const [patientOptionsLoading, setPatientOptionsLoading] = useState(false);
  
  const fetchPatients = useCallback(
    debounce(async (query) => {
      try {
        setPatientOptionsLoading(true);
        const { data } = await dashboardAxios.get("/patients/v2", {
          params: { search: query, limit: 20 },
        });

        setPatientOptions(data?.data || []);
      } finally {
        setPatientOptionsLoading(false);
      }
    }, 400),
    [],
  );
  
  useEffect(() => {
    fetchPatients("");

    return () => {
      setPatientOptions([]);
    };
  }, []);

  const handleClear = () => {
    formik.resetForm({
      values: {
        date_start: null,
        date_end: null,
        payer_id: "",
        api_name: "",
        api_function: "",
        api_provider: "",
        transaction_status: "",
        trans_id: "",
        bundle_id: "",
        status: true,
        payers: true,
        all_facilities: false,
        patient: null,
      },
    });
    setQuickTimeRange("");
    setFilterValues({
      date_start: "",
      date_end: "",
      payer_id: "",
      api_provider: "",
      api_name: "",
      api_function: "",
      transaction_status: "",
      all_facilities: false,
    });
  };

  return (
    <>
      <Box
        sx={{
          ...sx,
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
          "& .MuiInputBase-root": {
            fontSize: "0.8rem",
            height: "36px",
          },
          "& .MuiInputLabel-root": {
            fontSize: "0.8rem",
          },
          "& .MuiFormControlLabel-label": {
            fontSize: "0.8rem",
          },
        }}
      >
        <form onSubmit={formik.handleSubmit}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "nowrap",
              alignItems: "center",
              gap: 1,
              width: "100%",
              mb: 2,
            }}
          >
            <Box
              sx={{
                width: "30px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "nowrap",
                gap: 1,
              }}
            >
              <IconButton
                onClick={() =>
                  setExpanded((prev) => {
                    const convert = prev === "Y" ? "N" : "Y";
                    localStorage.setItem("trasnmonitorCollapse", convert);
                    return convert;
                  })
                }
              >
                <ExpandMoreIcon
                  sx={{
                    transform:
                      expanded === "Y" ? "rotate(0deg)" : "rotate(-90deg)",
                    transition: "transform 0.2s",
                  }}
                />
              </IconButton>
            </Box>
            <Box sx={{ flex: "6 1 0", minWidth: 0, display: "flex", gap: 0.5 }}>
              <QuickTimeRange
                value={quickTimeRange}
                onChange={(range) => {
                  const { start, end } = getQuickTimeRange(range);
                  setQuickTimeRange(range);
                  formik.setFieldValue("date_start", start);
                  formik.setFieldValue("date_end", end);
                  formik.setFieldError("date_start", "");
                  formik.setFieldError("date_end", "");
                  formik.setFieldTouched("date_start", false);
                  formik.setFieldTouched("date_end", false);
                }}
              />
              <DateTimePicker
                format={DISPLAY_DATE_TIME_FORMAT}
                views={["year", "day", "hours", "minutes", "seconds"]}
                label="Start Date"
                value={formik.values.date_start}
                onChange={(value) => {
                  setQuickTimeRange("");
                  formik.setFieldValue("date_start", value);
                }}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    error:
                      formik.touched.date_start &&
                      Boolean(formik.errors.date_start),
                    helperText: (
                      <>
                        {formik.touched.date_start && formik.errors.date_start}
                      </>
                    ),
                  },
                }}
              />

              <DateTimePicker
                label="End Date"
                format={DISPLAY_DATE_TIME_FORMAT}
                value={formik.values.date_end}
                onChange={(value) => {
                  setQuickTimeRange("");
                  formik.setFieldValue("date_end", value);
                }}
                minDate={formik.values.date_start ?? undefined}
                slotProps={{
                  field: {
                    clearable: true,
                    onClear: () => {
                      setQuickTimeRange("");
                      formik.setFieldValue("date_end", null);
                    },
                  },
                  textField: {
                    size: "small",
                    fullWidth: true,
                    error:
                      formik.touched.date_end &&
                      Boolean(formik.errors.date_end),
                    helperText:
                      formik.touched.date_end &&
                      typeof formik.errors.date_end === "string"
                        ? formik.errors.date_end
                        : undefined,
                  },
                }}
              />
            </Box>

            <Box sx={{ flex: "1.5 1 0", minWidth: 0 }}>
              <Autocomplete
                fullWidth
                options={apiProviderList}
                slotProps={{
                  paper: {
                    sx: {
                      width: "300px",
                    },
                  },
                }}
                getOptionLabel={(option: any) => option.label}
                size="small"
                value={
                  apiProviderList.find(
                    (option: any) =>
                      option.value === formik.values.api_provider,
                  ) || null
                }
                onChange={(_, value) => {
                  formik.setFieldValue(
                    "api_provider",
                    value ? value.value : null,
                  );
                  formik.setFieldValue("api_name", "");
                  formik.setFieldValue("api_function", "");
                  formik.setFieldValue("transaction_status", "");
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Api Provider"
                    size="small"
                    error={
                      formik.touched.api_name && Boolean(formik.errors.api_name)
                    }
                    helperText={
                      formik.touched.api_name && formik.errors.api_name
                    }
                  />
                )}
              />
            </Box>

            <Box sx={{ flex: "1.5 1 0", minWidth: 0 }}>
              <Autocomplete
                fullWidth
                options={apiNamesList}
                slotProps={{
                  paper: {
                    sx: {
                      width: "300px",
                    },
                  },
                }}
                getOptionLabel={(apiNameOptions) => apiNameOptions.label}
                value={
                  apiNamesList.find(
                    (option) => option.value === formik.values.api_name,
                  ) || null
                }
                onChange={(_, value) => {
                  formik.setFieldValue("api_name", value ? value.value : null);
                  formik.setFieldValue("api_function", "");
                  formik.setFieldValue("transaction_status", "");
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Api Name"
                    size="small"
                    error={
                      formik.touched.api_name && Boolean(formik.errors.api_name)
                    }
                    helperText={
                      formik.touched.api_name && formik.errors.api_name
                    }
                  />
                )}
              />
            </Box>

            <Box sx={{ flex: "1.5 1 0", minWidth: 0 }}>
              <Autocomplete
                fullWidth
                options={apiFunctionsList}
                slotProps={{
                  paper: {
                    sx: {
                      width: "300px",
                    },
                  },
                }}
                getOptionLabel={(option) => option.label}
                value={
                  apiFunctionsList.find(
                    (option) => option.value === formik.values.api_function,
                  ) || null
                }
                onChange={(_, value) => {
                  formik.setFieldValue(
                    "api_function",
                    value ? value.value : null,
                  );
                  formik.setFieldValue("transaction_status", "");
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Api Function"
                    size="small"
                    error={
                      formik.touched.api_function &&
                      Boolean(formik.errors.api_function)
                    }
                    helperText={
                      formik.touched.api_function && formik.errors.api_function
                    }
                  />
                )}
              />
            </Box>

            <Box sx={{ flex: "1.5 1 0", minWidth: 0 }}>
              <Autocomplete
                fullWidth
                options={transactionStatusList}
                slotProps={{
                  paper: {
                    sx: {
                      width: "300px",
                    },
                  },
                }}
                getOptionLabel={(option) => option.label}
                value={
                  transactionStatusList.find(
                    (option) =>
                      option.value === formik.values.transaction_status,
                  ) || null
                }
                onChange={(_, value) => {
                  formik.setFieldValue(
                    "transaction_status",
                    value ? value.value : null,
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Status"
                    size="small"
                    error={
                      formik.touched.transaction_status &&
                      Boolean(formik.errors.transaction_status)
                    }
                    helperText={
                      formik.touched.transaction_status &&
                      formik.errors.transaction_status
                    }
                  />
                )}
              />
            </Box>
            <Box
              sx={{
                "& .MuiFormControlLabel-root": {
                  marginInline: "0 !important",
                  whiteSpace: "nowrap",
                },
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    name="all_facilities"
                    color="success"
                    checked={formik.values.all_facilities}
                    onChange={(e: any) => {
                      formik.setFieldValue("all_facilities", e.target.checked);
                    }}
                    sx={{
                      "& .MuiSvgIcon-root": { fontSize: 20 },
                      padding: "4px",
                    }}
                  />
                }
                label="All Facilities"
              />
            </Box>
            <Box
              sx={{
                flex: "0 0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "nowrap",
                gap: 1,
              }}
            >
              <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                <Secure.GLIconButton2
                  permission={`${PERMISSIONS_PREFIXES.transMonitor}filterFormSearch`}
                  uiText={`${PERMISSIONS_PREFIXES.generic}search`}
                  fallBackText="Search"
                  size="small"
                  color="primary"
                  type="submit"
                >
                  <SearchIcon />
                </Secure.GLIconButton2>
                <Secure.GLIconButton2
                  permission={`${PERMISSIONS_PREFIXES.transMonitor}filterFormClear`}
                  uiText={`${PERMISSIONS_PREFIXES.generic}reset`}
                  fallBackText="Reset"
                  size="small"
                  type="button"
                  aria-label="clear"
                  color="inherit"
                  onClick={handleClear}
                >
                  <ClearIcon />
                </Secure.GLIconButton2>
              </Box>
            </Box>
          </Box>
          <Collapse in={expanded === "Y"}>
            <Box
              sx={{
                display: "flex",
                flexWrap: "nowrap",
                alignItems: "center",
                gap: 1,
                width: "100%",
              }}
            >
              <Box
                sx={{
                  width: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "nowrap",
                  gap: 1,
                }}
              ></Box>
              <Box sx={{ flex: "1.5 1 0", minWidth: 0 }}>
                <Autocomplete
                  fullWidth
                  options={payerOptions}
                  slotProps={{
                    paper: {
                      sx: {
                        width: "300px",
                      },
                    },
                  }}
                  getOptionLabel={(option) => option.label}
                  value={
                    payerOptions.find(
                      (option) => option.value === formik.values.payer_id,
                    ) || null
                  }
                  onChange={(_, value) => {
                    formik.setFieldValue(
                      "payer_id",
                      value ? value.value : null,
                    );
                    formik.setFieldValue("api_provider", "");
                    formik.setFieldValue("api_name", "");
                    formik.setFieldValue("api_function", "");
                    formik.setFieldValue("transaction_status", "");
                  }}
                  loading={loadingPayers}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Payer"
                      size="small"
                      error={
                        formik.touched.payer_id &&
                        Boolean(formik.errors.payer_id)
                      }
                      helperText={
                        formik.touched.payer_id && formik.errors.payer_id
                      }
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingPayers ? (
                              <CircularProgress size={18} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Box>
              <Box sx={{ flex: "1.5 1 0", minWidth: 0 }}>
                <Autocomplete
                  fullWidth
                  loading={patientOptionsLoading}
                  options={patientOptions}
                  slotProps={{
                    paper: {
                      sx: {
                        "& .MuiAutocomplete-option": {
                          fontSize: "12px",
                        },
                        width: "300px",
                      },
                    },
                  }}
                  getOptionLabel={(option) =>
                    `${option.patient_id} ${option.first_name} ${option.middle_names}  ${option.last_name}`
                  }
                  value={formik.values.patient}
                  onChange={(_, value) => {
                    formik.setFieldValue("patient", value);
                  }}
                  onInputChange={(_, value) => {
                    fetchPatients(value);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Patient"
                      size="small"
                      error={formik.touched.patient && !!formik.errors.patient}
                      helperText={
                        formik.touched.patient && formik.errors.patient
                      }
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <IconButton size="small">
                              <SearchIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Box>
              <Box sx={{ flex: "1.5 1 0", minWidth: 0 }}>
                <TextField
                  fullWidth
                  label="Trans Id"
                  name="trans_id"
                  size="small"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.trans_id && Boolean(formik.errors.trans_id)
                  }
                  helperText={formik.touched.trans_id && formik.errors.trans_id}
                  value={formik.values.trans_id}
                />
              </Box>
              <Box sx={{ flex: "1.5 1 0", minWidth: 0 }}>
                <TextField
                  fullWidth
                  label="Bundle Id"
                  name="bundle_id"
                  size="small"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.bundle_id && Boolean(formik.errors.bundle_id)
                  }
                  helperText={
                    formik.touched.bundle_id && formik.errors.bundle_id
                  }
                  value={formik.values.bundle_id}
                />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, whiteSpace: "nowrap" }}
                >
                  Group By:
                </Typography>
                <FormGroup
                  row
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "nowrap",
                    gap: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      "& .MuiFormControlLabel-root": {
                        marginInline: "0 !important",
                        whiteSpace: "nowrap",
                      },
                    }}
                  >
                    <Secure.GLSecureInputs.Checkbox
                      permission={`${PERMISSIONS_PREFIXES.transMonitor}groupByPayers`}
                      fallBackText="Payers"
                      name="payers"
                      checked={formik.values.payers}
                      onChange={(e: any) => {
                        formik.setFieldValue("payers", e.target.checked);
                      }}
                      onBlur={formik.handleBlur}
                      sx={{
                        "& .MuiSvgIcon-root": { fontSize: 20 },
                        padding: "4px",
                      }}
                      label="Payers"
                      color="success"
                    />
                  </Box>
                  <Box
                    sx={{
                      "& .MuiFormControlLabel-root": {
                        marginInline: "0 !important",
                        whiteSpace: "nowrap",
                      },
                    }}
                  >
                    <Secure.GLSecureInputs.Checkbox
                      permission={`${PERMISSIONS_PREFIXES.transMonitor}groupByStatus`}
                      fallBackText="Status"
                      name="status"
                      checked={formik.values.status}
                      onChange={(e: any) => {
                        formik.setFieldValue("status", e.target.checked);
                      }}
                      onBlur={formik.handleBlur}
                      sx={{
                        "& .MuiSvgIcon-root": { fontSize: 20 },
                        padding: "4px",
                      }}
                      label="Status"
                      color="success"
                    />
                  </Box>
                </FormGroup>
              </Box>
            </Box>
          </Collapse>
        </form>
      </Box>
    </>
  );
};

export default FilterForm;