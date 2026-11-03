import {
  Box,
  Grid2 as Grid,
  type SxProps,
  type Theme,
  Typography,
  useTheme,
  Tabs,
  Tab,
} from "@mui/material";
import TabContext from "@mui/lab/TabContext";
import TabPanel from "@mui/lab/TabPanel";
import LineChart from "./components/LineChart";
import HorizontalBarChart from "./components/HorizontalBarChart";
import KpiCard from "./components/KpiCard";
import { useCallback, useEffect, useState } from "react";
import { GlCustomTable  , GlPanelTable} from "@givc/shared-components";
import FilterForm, { type Filters } from "./components/FilterForm";



import { dashboardAxios, fetcher } from "../../api";
import HandleTitle from "../../components/HandleTitle";

export default function Dashboard() {
  const {
    palette: { mode },
  } = useTheme();
  interface RejectionTimeData {
    time_bucket: string | number;
    cnt: number;
    [key: string]: string | number;
  }

  interface BarData {
    label: string;
    value: number;
    [key: string]: string | number;
  }

  const [rejectionByTimeData, setRejectionByTimeData] = useState<
    RejectionTimeData[]
  >([]);
  const [topErrors, setTopErrors] = useState<BarData[]>([]);
  const [rejectionTimeHoverData, setRejectionTimeHoverData] =
    useState<RejectionTimeData | null>(null);
  const [topPayers, setTopPayers] = useState<BarData[]>([]);
  const [topDiagnosis, setTopDiagnosis] = useState<BarData[]>([]);
  const [topServices, setTopServices] = useState<BarData[]>([]);
  const [topPhysicians, setTopPhysicians] = useState<BarData[]>([]);
  const [filters, setFilters] = useState<Filters | null>(null);

  const [kpiRejectionCount, setKpiRejectionCount] = useState<number>(0);
  const [kpiRejectionRate, setKpiRejectionRate] = useState<number>(0);
  const [kpiRejectionAmount, setKpiRejectionAmount] = useState<number>(0);
  const [tabValue, setTabValue] = useState("1");
  const [selectedMsgIdRow, setSelectedMsgIdRow] = useState<Record<
    string,
    any
  > | null>(null);
  const [selectedClaimRow, setSelectedClaimRow] = useState<Record<
    string,
    any
  > | null>(null);

  const handleChange = (_: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };
  const fetchChartData = useCallback(
    async <T,>(
      endpoint: string,
      hook: React.Dispatch<React.SetStateAction<T[]>>,
      params?: Record<string, unknown>,
    ) => {
      try {
        const { data } = await dashboardAxios.get<T[]>(`${endpoint}`, { params });

        if (!Array.isArray(data) || !data.length) {
          hook([]);
          return;
        }

        hook(data);
      } catch (error) {
        console.error("Error fetching chart data:", error);
      }
    },
    [],
  );

  const fetchKpiData = useCallback(
    async (
      endpoint: string,
      hook: React.Dispatch<React.SetStateAction<number>>,
      params?: Record<string, unknown>,
    ) => {
      try {
        const { data } = await dashboardAxios.get(endpoint, { params });

        hook(data.value ?? 0);
      } catch (error) {
        console.error("Error fetching KPI data:", error);
      }
    },
    [],
  );

  const buildParams = useCallback(
    (extraParams: Record<string, unknown> = {}) => {
      const base = filters ?? {};
      const merged = { ...base, ...extraParams };
      return Object.fromEntries(
        Object.entries(merged).filter(
          ([, value]) => value !== "" && value !== null && value !== undefined,
        ),
      );
    },
    [filters],
  );

  useEffect(() => {
    const params = buildParams();
    fetchChartData(
      "/dashboard/rejectionByTime",
      setRejectionByTimeData,
      params,
    );
    fetchChartData("/dashboard/topErrors", setTopErrors, params);
    fetchChartData("/dashboard/topPayers", setTopPayers, params);
    fetchChartData("/dashboard/topDiagnosis", setTopDiagnosis, params);
    fetchChartData("/dashboard/topServices", setTopServices, params);
    fetchChartData("/dashboard/topPhysicians", setTopPhysicians, params);

    fetchKpiData("/dashboard/rejectionCount", setKpiRejectionCount, params);
    fetchKpiData("/dashboard/rejectionRate", setKpiRejectionRate, params);
    fetchKpiData("/dashboard/rejectionAmount", setKpiRejectionAmount, params);
  }, [buildParams, fetchChartData, fetchKpiData]);

  useEffect(() => {
    const params = buildParams({
      date: rejectionTimeHoverData
        ? rejectionTimeHoverData.time_bucket
        : undefined,
      limit: 10,
    });
    fetchChartData("/dashboard/topErrors", setTopErrors, params);
  }, [rejectionTimeHoverData, buildParams, fetchChartData]);

  const formatTimeBucket = useCallback(
    (value: string | number | null | undefined): string => {
      if (value === undefined || value === null) {
        return "";
      }

      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        return String(value);
      }

      return parsed.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    },
    [],
  );

  const renderTooltipContent = useCallback(
    (data: RejectionTimeData | null) => {
      if (!data) {
        return null;
      }
      return (
        <div
          style={{
            backgroundColor: "white",
            padding: "10px",
            border: "1px solid #ccc",
          }}
        >
          <p>{`Date: ${formatTimeBucket(data.time_bucket)}`}</p>
          <p>{`Count: ${data.cnt ?? 0}`}</p>
        </div>
      );
    },
    [formatTimeBucket],
  );

  const baseContainerSx: SxProps<Theme> = {
    p: 1,
    flex: 1,
    borderRadius: 2,
    boxShadow: 2,
  };

  return (
    <>
      <HandleTitle titleKey="DASHBOARD" />
      <Box sx={{ p: 3 }}>
        <FilterForm setFilterValues={setFilters} />
      </Box>
      <TabContext value={tabValue}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", px: 0 }}>
          <Tabs value={tabValue} onChange={handleChange}>
            <Tab label="Statistics" value="1" />
            <Tab label="rejection Reason" value="2" />
          </Tabs>
        </Box>
        <TabPanel value="1" sx={{ px: 0 }}>
          <Box sx={{ display: "flex", gap: 2, p: 3, flexWrap: "wrap" }}>
            <KpiCard title="Total Rejections" value={kpiRejectionCount} />
            <KpiCard title="Rejections Rate" value={`${kpiRejectionRate}%`} />
            <KpiCard
              title="Rejection Amount"
              value={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <img
                    src={`./themes/${mode}/icons/currency-black.png`}
                    alt="currency"
                    style={{ height: "40px", padding: "0 10px", width: "auto" }}
                  />
                  <span>{kpiRejectionAmount}</span>
                </Box>
              }
            />
          </Box>

          <Box sx={{ p: 3 }}>
            <Grid container spacing={3} direction={"row"}>
              <Grid size={{ xs: 12, md: 6 }} sx={baseContainerSx}>
                <Typography variant="h6" align="center">
                  Rejection Over Time
                </Typography>
                <LineChart
                  data={rejectionByTimeData}
                  xKey="time_bucket"
                  yKey="cnt"
                  xAxisLabel="Day"
                  yAxisLabel="Total Count"
                  onPointHover={setRejectionTimeHoverData}
                  xTickFormatter={formatTimeBucket}
                  tooltipContent={renderTooltipContent}
                  lineColor="skyblue"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }} sx={baseContainerSx}>
                <Typography variant="h6" align="center">
                  Top Errors
                </Typography>
                <HorizontalBarChart
                  height={400}
                  data={topErrors}
                  categoryKey="msg_id"
                  valueKey="cnt"
                  xAxisLabel="Volume"
                  yAxisLabel="Status"
                  disableAnimation={false}
                  tooltipContent={(data: BarData | null) => {
                    if (!data) {
                      return null;
                    }
                    return (
                      <div
                        style={{
                          backgroundColor: "white",
                          padding: "10px",
                          border: "1px solid #ccc",
                          borderRadius: "10px",
                        }}
                      >
                        <p style={{ margin: 2 }}>{`${
                          data.description ?? "N/A"
                        }`}</p>
                        <p style={{ margin: 2 }}>{`Count: ${data.cnt ?? 0}`}</p>
                      </div>
                    );
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }} sx={baseContainerSx}>
                <Typography variant="h6" align="center">
                  Top Payers
                </Typography>
                <HorizontalBarChart
                  data={topPayers}
                  categoryKey="short_name"
                  valueKey="cnt"
                  xAxisLabel="Volume"
                  yAxisLabel="Payer"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }} sx={baseContainerSx}>
                <Typography variant="h6" align="center">
                  Rejected Claims by Physician
                </Typography>
                <HorizontalBarChart
                  data={topPhysicians}
                  categoryKey="full_name"
                  valueKey="cnt"
                  xAxisLabel="Volume"
                  yAxisLabel="Status"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }} sx={baseContainerSx}>
                <Typography variant="h6" align="center">
                  Top Diagnosis
                </Typography>

                <HorizontalBarChart
                  data={topDiagnosis}
                  categoryKey="ascii_short_desc"
                  valueKey="cnt"
                  xAxisLabel="Volume"
                  yAxisLabel="Status"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }} sx={baseContainerSx}>
                <Typography variant="h6" align="center">
                  Top Services
                </Typography>
                <HorizontalBarChart
                  data={topServices}
                  categoryKey="description"
                  valueKey="cnt"
                  xAxisLabel="Volume"
                  yAxisLabel="service"
                />
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
        <TabPanel value="2">
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: 1,
              width: "100%",
            }}
          >
            <Box sx={{ flex: "0 0 25%" }}>
              <GlPanelTable>
                <GlCustomTable
                  url="/dashboard/getErrorCodes"
                  params={{ ...filters }}
                  smallSize
                  getRowId={(r) => r.msg_id + r.reason}
                  autoSelectFirstRow
                  onRowSelected={(row) => setSelectedMsgIdRow(row)}
                  fetcher={fetcher}
                  sx={{
                    height: "350px",
                  }}
                  columns={[
                    {
                      field: "msg_id",
                      headerName: "Code",
                      flex: 1,
                    },

                    {
                      field: "reason",
                      headerName: "Rejection Reason",
                      flex: 3,
                    },
                  ]}
                ></GlCustomTable>
              </GlPanelTable>
            </Box>
            <Box
              sx={{
                flex: "0 0 75%",
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              <Box>
                <GlPanelTable>
                  <GlCustomTable
                    url="/dashboard/getClaims"
                    params={{
                      msg_id: selectedMsgIdRow?.msg_id,
                      ...filters,
                    }}
                    sx={{
                      minHeight: "350px",
                    }}
                    smallSize
                    getRowId={(r) => r.claim_invoice_no}
                    autoSelectFirstRow
                    onRowSelected={(row) => setSelectedClaimRow(row)}
                    fetcher={fetcher}
                    columns={[
                      {
                        field: "claim_invoice_no",
                        headerName: "Claim no",
                        flex: 1,
                      },
                      {
                        field: "billable_period_end",
                        headerName: "Billable Period End",
                        flex: 1,
                      },
                      {
                        field: "practitioner",
                        headerName: "Pracitioner",
                        flex: 2,
                      },
                      {
                        field: "payer",
                        headerName: "Payer",
                        flex: 2,
                      },
                      {
                        field: "diagnosis_codes",
                        headerName: "Diagnosis",
                        flex: 1,
                      },
                      {
                        field: "specialty",
                        headerName: "Specialty",
                        flex: 1,
                        align: "right",
                      },
                      {
                        field: "treatment_type",
                        headerName: "Treatment Type",
                        flex: 1,
                      },
                      {
                        field: "treatment_sub_type",
                        headerName: "Treatment Subtype",
                        flex: 1,
                      },
                      {
                        field: "patient",
                        headerName: "Patient",
                        flex: 2,
                      },
                      {
                        field: "age",
                        headerName: "Age",
                        flex: 1,
                        align: "right",
                      },
                      {
                        field: "gender",
                        headerName: "Gender",
                        flex: 1,
                        align: "right",
                      },
                    ]}
                  ></GlCustomTable>
                </GlPanelTable>
                <Box sx={{ mt: 2 }}>
                  {selectedClaimRow && (
                    <>
                      <Typography variant="h6">Chief Complain</Typography>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: "background.default",
                          border: 1,
                          borderColor: "divider",
                          borderRadius: 1,
                          boxShadow: "inset 0 1px 4px rgba(0,0,0,0.1)",
                        }}
                      >
                        <Typography>
                          {selectedClaimRow?.chief_complaint || ""}
                        </Typography>
                      </Box>
                      <Typography variant="h6">Reasons</Typography>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: "background.default",
                          border: 1,
                          borderColor: "divider",
                          borderRadius: 1,
                          boxShadow: "inset 0 1px 4px rgba(0,0,0,0.1)",
                        }}
                      >
                        <Typography>
                          {selectedClaimRow?.reason || ""}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>
              </Box>
              <Box>
                <GlPanelTable>
                  <GlCustomTable
                    url="/dashboard/getServices"
                    params={{
                      claim_invoice_no: selectedClaimRow?.claim_invoice_no,
                      msg_id: selectedMsgIdRow?.msg_id,
                      ...filters,
                    }}
                    sx={{
                      minHeight: "350px",
                    }}
                    smallSize
                    getRowId={(r) => r?.id}
                    autoSelectFirstRow
                    fetcher={fetcher}
                    columns={[
                      {
                        field: "service_code",
                        headerName: "Service Code",
                        flex: 1,
                      },
                      {
                        field: "item_descirption",
                        headerName: "Item Description",
                        flex: 3,
                      },
                      {
                        field: "amount",
                        headerName: "Amount",
                        flex: 1,
                        align: "right",
                      },
                      {
                        field: "status",
                        headerName: "Status",
                        flex: 1,
                      },
                      {
                        field: "msg_id",
                        headerName: "Msg",
                        flex: 1,
                      },
                      {
                        field: "approved_quantity",
                        headerName: "Approved qty",
                        flex: 1,
                        align: "right",
                      },
                    ]}
                  ></GlCustomTable>
                </GlPanelTable>
              </Box>
            </Box>
          </Box>
        </TabPanel>
      </TabContext>
    </>
  );
}
