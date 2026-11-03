import { useFormik } from "formik";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  useTheme,
  Collapse,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import FormikDateTimeFilter from "../../../components/FormikDateTimeFilter";
import FormikAutocompleteServerFilter from "../../../components/FormikAutocompleteServerFilter";
import FormikTextFilter from "../../../components/FormikTextFilter";
import FormikAutocompleteClientFilter from "../../../components/FormikAutocompleteClientFilter";
import { useValidationDashboard } from "../ValidationDashboardContext";
import SearchIcon from "@mui/icons-material/Search";
import { useCallback, useEffect, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import debounce from "lodash.debounce";
import {
  API_DATE_TIME_FORMAT,
  formatDateTime,
} from "../../../utils/dateFormat";
import { dashboardAxios } from "../../../api";
import { usePayers } from "../hooks/usePayers";
import { Secure } from "@givc/shared-components";
import { DisplayMsgDialog } from "@givc/shared-components";
import { AxiosError } from "axios";
import QuickTimeRange from "../../../components/QuickTimeRange";
import {
  DEFAULT_QUICK_TIME_RANGE,
  getQuickTimeRange,
} from "../../../components/QuickTimeRange.utils";
import type { QuickTimeRangeValue } from "../../../components/QuickTimeRange.utils";
import { ClearIcon } from "@mui/x-date-pickers";

//TYPES
interface FormValues {
  start_date: Dayjs | null;
  end_date: Dayjs | null;
  patient: any | null;
  item: any | null;
  physician: any | null;
  diagnosis: any | null;
  validation: any | null;
  payer: any | null;
  req_id: string;
  api_trans_id: string;
  status: string | null;
}

export default function FilterForm({
  resetSelectedRowRef,
}: {
  resetSelectedRowRef: React.MutableRefObject<(() => void) | null>[];
}) {
  const {
    palette: { mode },
  } = useTheme();
  const { setAllValidationClaimParams, setAllFormValues } =
    useValidationDashboard();
  const [quickTimeRange, setQuickTimeRange] = useState<
    QuickTimeRangeValue | ""
  >(DEFAULT_QUICK_TIME_RANGE);
  const { start: defaultStart, end: defaultEnd } = getQuickTimeRange(
    DEFAULT_QUICK_TIME_RANGE,
  );
  const [expanded, setExpanded] = useState(false);

  const formik = useFormik<FormValues>({
    initialValues: {
      start_date: defaultStart,
      end_date: defaultEnd,
      patient: null,
      item: null,
      physician: null,
      diagnosis: null,
      validation: null,
      payer: null,
      req_id: "",
      api_trans_id: "",
      status: null,
    },
    onSubmit: (values, formikHelpers) => {
      const params = {
        start_date: formatDateTime(values.start_date, API_DATE_TIME_FORMAT),
        end_date: formatDateTime(values.end_date, API_DATE_TIME_FORMAT),
        patient_id: values.patient?.patient_id,
        item_id: values.item?.item_id,
        diagnosis_code: values.diagnosis?.diagnosis_code,
        validation_code: values.validation?.user_code,
        physician_emp_id: values.physician?.employee_no,
        payer_id: values.payer?.payer_id,
        api_trans_id: values.api_trans_id || undefined,
        req_id: values.req_id || undefined,
        status: values.status || undefined,
      };
      if (quickTimeRange) {
        const { start, end } = getQuickTimeRange(quickTimeRange);
        params.start_date = formatDateTime(start, API_DATE_TIME_FORMAT);
        params.end_date = formatDateTime(end, API_DATE_TIME_FORMAT);
        formikHelpers.setFieldValue("start_date", start);
        formikHelpers.setFieldValue("end_date", end);
      }
      setAllValidationClaimParams(params);
      setAllFormValues(params);
      resetSelectedRowRef.forEach((ref) => {
        if (ref.current) ref.current();
      });
    },
  });

  // Dialoug state
  const [open, setOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  // Payer autocomplete
  const {
    options: payerAutoCompleteOptions,
    loading: payerAutoCompleteOptionsLoading,
    fetchPayers: fetchPayersRequest,
  } = usePayers();
  const fetchPayers = useCallback(
    debounce((query) => {
      fetchPayersRequest(query);
    }, 400),
    [fetchPayersRequest],
  );

  const handleReset = () => {
    formik.resetForm();
  };
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openActionMenu = Boolean(anchorEl);
  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Patient autocomplete
  const [patientAutoCompleteOptions, setPatientAutoCompleteOptions] = useState<
    any[]
  >([]);
  const [
    patientAutoCompleteOptionsLoading,
    setPatientAutoCompleteOptionsLoading,
  ] = useState(false);
  const fetchPatients = useCallback(
    debounce(async (query) => {
      try {
        setPatientAutoCompleteOptionsLoading(true);
        const { data } = await dashboardAxios.get("/patients/v2", {
          params: { search: query, limit: 20 },
        });
        setPatientAutoCompleteOptions(data?.data || []);
      } finally {
        setPatientAutoCompleteOptionsLoading(false);
      }
    }, 400),
    [],
  );

  // Service autocomplete
  const [serviceAutoCompleteOptions, setServiceAutoCompleteOptions] = useState<
    any[]
  >([]);
  const [
    serviceAutoCompleteOptionsLoading,
    setServiceAutoCompleteOptionsLoading,
  ] = useState(false);
  const fetchServices = useCallback(
    debounce(async (query) => {
      try {
        setServiceAutoCompleteOptionsLoading(true);
        const { data } = await dashboardAxios.get(
          "/claim-validation/services",
          {
            params: { search: query },
          },
        );
        setServiceAutoCompleteOptions(data?.data || []);
      } finally {
        setServiceAutoCompleteOptionsLoading(false);
      }
    }, 400),
    [],
  );

  // Diagnosis autocomplete
  const [diagnosisAutoCompleteOptions, setDiagnosisAutoCompleteOptions] =
    useState<any[]>([]);
  const [
    diagnosisAutoCompleteOptionsLoading,
    setDiagnosisAutoCompleteOptionsLoading,
  ] = useState(false);
  const fetchDiagnosis = useCallback(
    debounce(async (query) => {
      try {
        setDiagnosisAutoCompleteOptionsLoading(true);
        const { data } = await dashboardAxios.get(
          "/claim-validation/diagnosis",
          {
            params: { search: query },
          },
        );
        setDiagnosisAutoCompleteOptions(data?.data || []);
      } finally {
        setDiagnosisAutoCompleteOptionsLoading(false);
      }
    }, 400),
    [],
  );

  // physician autocomplete
  const [physicianAutoCompleteOptions, setPhysicianAutoCompleteOptions] =
    useState<any[]>([]);
  const [
    physicianAutoCompleteOptionsLoading,
    setPhysicianAutoCompleteOptionsLoading,
  ] = useState(false);
  const fetchPhysicians = useCallback(
    debounce(async (query) => {
      try {
        setPhysicianAutoCompleteOptionsLoading(true);
        const { data } = await dashboardAxios.get(
          "/claim-validation/physicians",
          {
            params: { search: query },
          },
        );
        setPhysicianAutoCompleteOptions(data?.data || []);
      } finally {
        setPhysicianAutoCompleteOptionsLoading(false);
      }
    }, 400),
    [],
  );

  // Validation code autocomplete
  const [
    validationCodeAutoCompleteOptions,
    setValidationCodeAutoCompleteOptions,
  ] = useState<any[]>([]);
  const [
    validationCodeAutoCompleteOptionsLoading,
    setValidationCodeAutoCompleteOptionsLoading,
  ] = useState(false);

  const formattedStartDate =
    formatDateTime(formik.values.start_date, API_DATE_TIME_FORMAT) ??
    formatDateTime(dayjs(), API_DATE_TIME_FORMAT);
  const formattedEndDate =
    formatDateTime(formik.values.end_date, API_DATE_TIME_FORMAT) ??
    formatDateTime(dayjs(), API_DATE_TIME_FORMAT);

  const fetchValidationCodes = useCallback(
    debounce(async (query) => {
      try {
        setValidationCodeAutoCompleteOptionsLoading(true);
        const { data } = await dashboardAxios.get(
          "/claim-validation/validation-codes",
          {
            params: { search: query },
          },
        );
        setValidationCodeAutoCompleteOptions(data?.data || []);
      } finally {
        setValidationCodeAutoCompleteOptionsLoading(false);
      }
    }, 400),
    [],
  );

  useEffect(() => {
    // Fetch initial data for all autocomplete fields (optional)
    fetchPatients("");
    fetchServices("");
    fetchDiagnosis("");
    fetchValidationCodes("");
    fetchPayers("");
    fetchPhysicians("");
  }, []);

  // Handlers
  const handleExportExcelData = async () => {
    try {
      const { data: result } = await dashboardAxios.get(
        "/claim-validation/get-validations-by-facility",
        {
          params: {
            start_date: formatDateTime(
              formik.values.start_date,
              API_DATE_TIME_FORMAT,
            ),
            end_date: formatDateTime(
              formik.values.end_date,
              API_DATE_TIME_FORMAT,
            ),
          },
        },
      );
      return result.data;
    } catch (error: any) {
      setOpen(true);
      setErrorMsg(error.message);
      return [];
    }
  };
  async function printClaims(endPoint: string) {
    try {
      const response = await dashboardAxios.get(endPoint, {
        responseType: "blob",
        params: {
          start_date: formatDateTime(
            formik.values.start_date,
            API_DATE_TIME_FORMAT,
          ),
          end_date: formatDateTime(
            formik.values.end_date,
            API_DATE_TIME_FORMAT,
          ),
        },
      });
      const contentType = response.headers["content-type"];

      if (
        typeof contentType === "string" &&
        contentType.includes("application/pdf")
      ) {
        const fileURL = window.URL.createObjectURL(response.data);
        const link = document.createElement("a");

        const fileName = `Transaction_Validation_Report from ${formattedStartDate} to ${formattedEndDate}`;
        link.href = fileURL;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(fileURL);
      } else {
        const text = await response.data.text();
        const json = JSON.parse(text);
        console.error("Server error:", json);
      }
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);

          console.error("ðŸ”¥ Error JSON: we are here", json);
        } catch {
          // fallback if parsing fails
          console.error("ðŸ”¥ Non-JSON error:", error);
        }
      } else {
        console.error("ðŸ”¥ Unknown error:", error);
      }
    } finally {
    }
  }

  const handleDownloadReport = async () => {
    await printClaims("/claim-validation/get-validations-by-facility-report");
  };

  return (
    <Box component="form" onSubmit={formik.handleSubmit}>
      <DisplayMsgDialog
        open={open}
        onClose={() => {
          setOpen(false);
          setErrorMsg("");
        }}
        getResource={false}
        status="ERROR"
        description={errorMsg}
      />

      <Grid
        container
        columns={49}
        columnSpacing={"4px"} /* inline styles */
        wrap="nowrap"
        alignContent={"flex-start"}
        sx={{ mb: 1 }}
      >
        <Grid size={1}>
          <IconButton onClick={() => setExpanded((prev) => !prev)}>
            <ExpandMoreIcon
              sx={{
                transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
                transition: "transform 0.2s",
              }}
            />
          </IconButton>
        </Grid>
        <Grid size={8}>
          <QuickTimeRange
            value={quickTimeRange}
            onChange={(range) => {
              const { start, end } = getQuickTimeRange(range);
              setQuickTimeRange(range);
              formik.setFieldValue("start_date", start);
              formik.setFieldValue("end_date", end);
            }}
          />
        </Grid>
        <Grid size={8}>
          <FormikDateTimeFilter
            name="start_date"
            label="Start Date"
            formik={formik}
            onChange={(value: any) => {
              formik.setFieldValue("start_date", value);
              setQuickTimeRange("");
            }}
            resetDate={() => formik.setFieldValue("start_date", null)}
          />
        </Grid>
        <Grid size={8}>
          <FormikDateTimeFilter
            name="end_date"
            label="End Date"
            formik={formik}
            onChange={(value: any) => {
              formik.setFieldValue("end_date", value);
              setQuickTimeRange("");
            }}
            resetDate={() => formik.setFieldValue("end_date", null)}
          />
        </Grid>
        {/* validation code */}
        <Grid size={8}>
          <FormikAutocompleteServerFilter
            name="validation"
            label="Validation Code"
            minWidth={"300px"}
            formik={formik}
            loading={validationCodeAutoCompleteOptionsLoading}
            options={validationCodeAutoCompleteOptions}
            getOptionLabel={(option) => `${option.description}`}
            onInputChange={fetchValidationCodes}
            isOptionEqualToValue={(option, value) =>
              option?.user_code === value?.user_code
            }
          />
        </Grid>
        <Grid size={5}>
          <FormikTextFilter name="req_id" label="Request ID" formik={formik} />
        </Grid>
        <Grid size={5}>
          <FormikTextFilter
            name="api_trans_id"
            label="API Trans ID"
            formik={formik}
          />
        </Grid>
        <Grid size={5}>
          <FormikAutocompleteClientFilter
            name="status"
            label="Status"
            formik={formik}
            options={[
              { value: "NEW", label: "NEW" },
              { value: "RECHECK", label: "RECHECK" },
              // { value: "IGONRE", label: "IGONRE" },
              { value: "IGNORE", label: "IGNORE" },
              { value: "RESOLVED", label: "RESOLVED" },
            ]}
            getOptionLabel={(option) => option.label}
            getOptionValue={(option) => option.value}
          />
        </Grid>

        <Grid size={2}>
          <Box
            display="flex"
            flexDirection="row"
            gap={0}
            alignContent={"center"}
            alignItems={"center"}
            justifyContent={"flex-start"}
          >
            <IconButton onClick={handleReset} color="primary">
              <ClearIcon />
            </IconButton>
            <IconButton type="submit" color="primary">
              <SearchIcon />
            </IconButton>
          </Box>
        </Grid>
        <Grid size={2}>
          <Box>
            <Tooltip title="Actions Menu">
              <Button onClick={handleMenuOpen}>Actions</Button>
            </Tooltip>

            <Menu
              anchorEl={anchorEl}
              open={openActionMenu}
              onClose={handleMenuClose}
            >
              {/* Export */}
              <MenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuClose();
                }}
              >
                <Box
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Button
                    onClick={handleDownloadReport}
                    startIcon={
                      <img
                        src={`./themes/${mode}/icons/exportpdf.png`}
                        style={{
                          width: 24,
                          height: 24,
                          padding: 0,
                        }}
                      />
                    }
                  >
                    export as pdf
                  </Button>
                </Box>
              </MenuItem>

              <MenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuClose();
                }}
              >
                <Box
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Secure.GLExcelExportIconButton
                    sx={{ p: 0 }}
                    resource_key="validationDashboard_41_ExportByFacility"
                    fileName={`Transaction_Validation_Sheet from ${formattedStartDate} to ${formattedEndDate}`}
                    columns={[
                      { field: "facility_name", headerName: "facility name" },
                      {
                        field: "claim",
                        headerName: "claim",
                        format: (value) => Number(value),
                      },
                      {
                        field: "pre-auth",
                        headerName: "pre-auth",
                        format: (value) => Number(value),
                      },
                      {
                        field: "prescription",
                        headerName: "prescription",
                        format: (value) => Number(value),
                      },
                      {
                        field: "services",
                        headerName: "services",
                        format: (value) => Number(value),
                      },
                    ]}
                    data={handleExportExcelData}
                    totalColumns="total per type"
                    totalRows="total per facility"
                    autoWidth
                    headerSection={[
                      ["Transaction Validation Report"],
                      [
                        "From: " + formattedStartDate,
                        null,
                        null,
                        "To: " + formattedEndDate,
                        null,
                        null,
                      ],
                      [],
                    ]}
                    mergeArray={[
                      {
                        s: { r: 0, c: 0 },
                        e: { r: 0, c: 3 },
                      },
                      {
                        s: { r: 1, c: 0 },
                        e: { r: 1, c: 2 },
                      },
                      {
                        s: { r: 1, c: 3 },
                        e: { r: 1, c: 5 },
                      },
                    ]}
                  >
                    <Button
                      startIcon={
                        <img
                          src={`./themes/${mode}/icons/exportxls.png`}
                          style={{
                            width: 24,
                            height: 24,
                            padding: 0,
                          }}
                        />
                      }
                    >
                      export as exel
                    </Button>
                  </Secure.GLExcelExportIconButton>
                </Box>
              </MenuItem>
            </Menu>
          </Box>
        </Grid>
      </Grid>
      <Collapse in={expanded}>
        <Grid
          container
          columns={49}
          columnSpacing={"4px"} /* inline styles */
          wrap="nowrap"
          alignContent={"flex-start"}
        >
          <Grid size={1}>
            <Box></Box>
          </Grid>

          {/* physician */}
          <Grid size={9.6}>
            <FormikAutocompleteServerFilter
              name="physician"
              label="Physician"
              minWidth={"300px"}
              formik={formik}
              loading={physicianAutoCompleteOptionsLoading}
              options={physicianAutoCompleteOptions}
              getOptionLabel={(option) =>
                `${option.employee_id}  ${option.first_name} ${option.middle_names}  ${option.last_name}`
              }
              onInputChange={fetchPhysicians}
              isOptionEqualToValue={(option, value) =>
                option?.employee_no === value?.employee_no
              }
            />
          </Grid>
          {/* payer */}
          <Grid size={9.6}>
            <FormikAutocompleteServerFilter
              name="payer"
              label="Payer"
              minWidth={"300px"}
              formik={formik}
              loading={payerAutoCompleteOptionsLoading}
              options={payerAutoCompleteOptions}
              getOptionLabel={(option) => {
                const o = option as any;
                return `${o.payer_id ?? ""} ${o.description ?? ""}  ${o.payer_pk ?? ""}`;
              }}
              onInputChange={fetchPayers}
              isOptionEqualToValue={(option, value) =>
                option?.payer_id === value?.payer_id
              }
            />
          </Grid>
          {/* diagnosis */}
          <Grid size={9.6}>
            <FormikAutocompleteServerFilter
              name="diagnosis"
              label="Diagnosis"
              minWidth={"300px"}
              formik={formik}
              loading={diagnosisAutoCompleteOptionsLoading}
              options={diagnosisAutoCompleteOptions}
              getOptionLabel={(option) =>
                `${option.diagnosis_code} ${option.diagnosis_desc}`
              }
              onInputChange={fetchDiagnosis}
              isOptionEqualToValue={(option, value) =>
                option?.diagnosis_code === value?.diagnosis_code
              }
            />
          </Grid>
          {/* service */}
          <Grid size={9.6}>
            <FormikAutocompleteServerFilter
              name="item"
              label="Service"
              minWidth={"300px"}
              formik={formik}
              loading={serviceAutoCompleteOptionsLoading}
              options={serviceAutoCompleteOptions}
              getOptionLabel={(option) =>
                `${option.item_id} ${option.description}`
              }
              onInputChange={fetchServices}
              isOptionEqualToValue={(option, value) =>
                option?.item_id === value?.item_id
              }
            />
          </Grid>
          <Grid size={9.6}>
            <FormikAutocompleteServerFilter
              name="patient"
              label="Patient"
              minWidth={"300px"}
              formik={formik}
              loading={patientAutoCompleteOptionsLoading}
              options={patientAutoCompleteOptions}
              listboxSx={{
                "& .MuiAutocomplete-option": {
                  fontSize: "12px",
                },
              }}
              getOptionLabel={(option) =>
                `${option.patient_id} ${option.first_name} ${option.middle_names}  ${option.last_name}`
              }
              onInputChange={(value) => {
                fetchPatients(value);
              }}
              isOptionEqualToValue={(option, value) =>
                option?.patient_id === value?.patient_id
              }
            />
          </Grid>
        </Grid>
      </Collapse>
    </Box>
  );
}
