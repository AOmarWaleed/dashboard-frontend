import {
  Box,
  Typography,
  Tabs,
  Tab,
  Grid2 as Grid,
  Tooltip,
} from "@mui/material";
import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { fetcher } from "../../api";
import FilterForm from "./Components/FilterForm";
import { useValidationDashboard } from "./ValidationDashboardContext";
import TabPanel from "@mui/lab/TabPanel";
import TabContext from "@mui/lab/TabContext";
import { GlCustomTable, GlPanelTable } from "@givc/shared-components";
import HandleTitle from "../../components/HandleTitle";
import TimeLineTab from "./Components/TimeLineTab";

export default function ValidationDashboard() {
  const {
    getAllValidationClaimParams,
    setAllValidationClaimParams,
    getAllFormValues,
    setAllFormValues,
  } = useValidationDashboard();

  const location = useLocation();

  // Create refs for each table
  const resetSelectedRowsRefs = [
    useRef<(() => void) | null>(null), // 0: req-count-by-type
    useRef<(() => void) | null>(null), // 1: req-count-by-status
    useRef<(() => void) | null>(null), // 2: statistics by validation_code
    useRef<(() => void) | null>(null), // 3: statistics by physician
    useRef<(() => void) | null>(null), // 4: statistics by item
    useRef<(() => void) | null>(null), // 5: statistics by diagnosis
    useRef<(() => void) | null>(null), // 6: details table
  ];

  const [tabValue, setTabValue] = useState("1");
  useEffect(() => {
    const parsed = Object.fromEntries(new URLSearchParams(location.search));

    setAllValidationClaimParams(parsed);
  }, [location.search]);

  const handleChange = (_: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  const [detailPageNum, setDetailPageNum] = useState(1);

  useEffect(() => {
    setDetailPageNum(1);
  }, [getAllValidationClaimParams]);

  return (
    <>
      <HandleTitle titleKey="VALIDATION_DASHBOARD" />
      <Box sx={{ p: 0 }}>
        <FilterForm resetSelectedRowRef={resetSelectedRowsRefs} />
      </Box>

      {/* Tabs */}
      <TabContext value={tabValue}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", px: 0 }}>
          <Tabs value={tabValue} onChange={handleChange}>
            <Tab label="Summary" value="1" />
            <Tab label="Claims Validation" value="2" />
            <Tab label="By Date" value="3" />
            <Tab label="By Hour" value="4" />
            <Tab label="All Facilities" value="5" />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value="1" sx={{ px: 0 }}>
          <Box sx={{ display: "grid", gap: 1 }}>
            {/* STATISTICS */}
            <Grid container spacing={1}>
              <Grid
                sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                size={{ xs: 12, md: 3 }}
              >
                {/* PRE-AUTH ANd Claim */}
                <Box>
                  <GlPanelTable>
                    <GlCustomTable
                      url="/claim-validation/req-count-by-type?req_type=ALL"
                      smallSize
                      resetSelectedRowRef={resetSelectedRowsRefs[0]}
                      params={{ ...getAllFormValues, req_type: undefined }}
                      getRowId={(r) => r.req_type}
                      autoSelectFirstRow={false}
                      sx={{
                        height: 340 / 2,
                        "& .MuiDataGrid-columnHeaders > div": {
                          backgroundColor: "#024711 !important",
                        },
                      }}
                      onRowSelected={(r: any) => {
                        setAllValidationClaimParams((prev) => {
                          if (prev.req_type === r?.req_type) {
                            return prev;
                          }
                          return {
                            ...prev,
                            req_type: r?.req_type,
                          };
                        });

                        setAllFormValues((prev) => {
                          if (prev.req_type === r?.req_type) {
                            return prev;
                          }
                          return {
                            ...prev,
                            req_type: r?.req_type,
                          };
                        });
                      }}
                      fetcher={fetcher}
                      hideFooter
                      columns={[
                        {
                          field: "req_type",
                          headerName: "Request Type",
                          flex: 1,
                        },

                        {
                          field: "amount",
                          headerName: "Amount",
                          flex: 1,
                          type: "number",
                        },
                        {
                          field: "count",
                          headerName: "Count",
                          flex: 1,
                          type: "number",
                        },
                      ]}
                    ></GlCustomTable>
                  </GlPanelTable>
                </Box>
                {/* Pre-auth or Claim Patinets and Episode*/}
                <Box>
                  <GlPanelTable>
                    <GlCustomTable
                      url="/claim-validation/patients-by-req-type"
                      smallSize
                      resetSelectedRowRef={resetSelectedRowsRefs[0]}
                      params={{ ...getAllFormValues }}
                      getRowId={(r) => r.patient_id}
                      autoSelectFirstRow={false}
                      limit={5}
                      sx={{
                        height: 425 / 2,
                      }}
                      fetcher={fetcher}
                      columns={[
                        {
                          field: "patient_id",
                          headerName: "Patient ID",
                          flex: 1,
                        },
                        {
                          field: "first_name",
                          headerName: "first name",
                          flex: 1,
                        },
                        {
                          field: "last_name",
                          headerName: "last name",
                          flex: 1,
                        },
                        {
                          field: "episodes",
                          headerName: "episode",
                          flex: 1,
                        },
                      ]}
                    ></GlCustomTable>
                  </GlPanelTable>
                </Box>
                {/* STATUS */}
                <Box>
                  <GlPanelTable>
                    <GlCustomTable
                      url="/claim-validation/req-count-by-status"
                      smallSize
                      sx={{
                        height: 190,
                        "& .MuiDataGrid-columnHeaders > div": {
                          backgroundColor: "#09b82f !important",
                        },
                      }}
                      resetSelectedRowRef={resetSelectedRowsRefs[1]}
                      autoSelectFirstRow={false}
                      params={getAllFormValues}
                      getRowId={(r) => r.status}
                      onRowSelected={(r: any) => {
                        setAllValidationClaimParams((prev) => {
                          if (prev.status === r?.status) {
                            return prev;
                          }
                          return {
                            ...prev,
                            status: r?.status,
                          };
                        });
                      }}
                      fetcher={fetcher}
                      hideFooter
                      columns={[
                        {
                          field: "status",
                          headerName: "Status",
                          flex: 1,
                        },
                        {
                          field: "amount",
                          headerName: "Amount",
                          flex: 1,
                          type: "number",
                        },
                        {
                          field: "count",
                          headerName: "Count",
                          flex: 1,
                          type: "number",
                        },
                      ]}
                    ></GlCustomTable>
                  </GlPanelTable>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Box>
                  <GlPanelTable>
                    <GlCustomTable
                      sx={{
                        height: "590px",
                        "& .MuiDataGrid-columnHeaders > div": {
                          backgroundColor: "#09b82f !important",
                        },
                      }}
                      url="/claim-validation/statistics?groupBy=validation_code"
                      smallSize
                      limit={20}
                      pageSizeOptions={[5, 10, 20, 25, 50]}
                      fetcher={fetcher}
                      resetSelectedRowRef={resetSelectedRowsRefs[2]}
                      autoSelectFirstRow={false}
                      params={getAllFormValues}
                      getRowId={(r) => r.code + r.counter}
                      onRowSelected={(r) => {
                        setAllValidationClaimParams((prev) => {
                          if (prev.validation_code === r?.code) {
                            return prev;
                          }

                          return {
                            ...prev,
                            validation_code: r?.code,
                          };
                        });
                      }}
                      columns={[
                        {
                          field: "code",
                          headerName: "Validation Code",
                          flex: 1,
                          renderCell: (params: any) => (
                            <Tooltip
                              title={params.row.description || ""}
                              placement="top"
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {params.value || "-"}
                              </Typography>
                            </Tooltip>
                          ),
                        },
                        {
                          field: "amount",
                          headerName: "Amount",
                          flex: 1,
                          type: "number",
                        },
                        {
                          field: "counter",
                          headerName: "Count",
                          flex: 1,
                          type: "number",
                        },
                      ]}
                    ></GlCustomTable>
                  </GlPanelTable>
                </Box>
              </Grid>

              <Grid
                sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                size={{ xs: 12, md: 3 }}
              >
                <Box>
                  <GlPanelTable>
                    <GlCustomTable
                      url="/claim-validation/statistics?groupBy=physician"
                      smallSize
                      limit={20}
                      pageSizeOptions={[5, 10, 20, 25, 50]}
                      sx={{
                        height: "590px",
                        "& .MuiDataGrid-columnHeaders > div": {
                          backgroundColor: "#09b82f !important",
                        },
                      }}
                      getRowId={(r) => r.code + r.counter}
                      params={getAllFormValues}
                      autoSelectFirstRow={false}
                      onRowSelected={(r) => {
                        setAllValidationClaimParams((prev) => {
                          if (prev.physician_emp_id === r?.code) {
                            return prev;
                          }
                          return {
                            ...prev,
                            physician_emp_id: r?.code,
                          };
                        });
                      }}
                      resetSelectedRowRef={resetSelectedRowsRefs[3]}
                      fetcher={fetcher}
                      columns={[
                        {
                          field: "code",
                          headerName: "Physician",
                          flex: 1,
                          renderCell: (params: any) => (
                            <Tooltip title={params.value || ""} placement="top">
                              <Typography
                                variant="body2"
                                sx={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {params.row.code +
                                  " - " +
                                  params.row.description?.trim() || "--"}
                              </Typography>
                            </Tooltip>
                          ),
                        },
                        {
                          field: "amount",
                          headerName: "Amount",
                          flex: 1,
                          type: "number",
                        },
                        {
                          field: "counter",
                          headerName: "Count",
                          flex: 1,
                          type: "number",
                        },
                      ]}
                    ></GlCustomTable>
                  </GlPanelTable>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <GlPanelTable>
                  <GlCustomTable
                    sx={{
                      height: "590px",
                      "& .MuiDataGrid-columnHeaders > div": {
                        backgroundColor: "#09b82f !important",
                      },
                    }}
                    url="/claim-validation/statistics?groupBy=diagnosis"
                    params={getAllFormValues}
                    autoSelectFirstRow={false}
                    getRowId={(r) => r.code + r.counter}
                    smallSize
                    limit={20}
                    pageSizeOptions={[5, 10, 20, 25, 50]}
                    fetcher={fetcher}
                    resetSelectedRowRef={resetSelectedRowsRefs[5]}
                    onRowSelected={(r) => {
                      setAllValidationClaimParams((prev) => {
                        if (prev.diagnosis_code === r?.code) {
                          return prev;
                        }
                        return {
                          ...prev,
                          diagnosis_code: r?.code,
                        };
                      });
                    }}
                    columns={[
                      {
                        field: "code",
                        headerName: "Diagnosis Code",
                        flex: 1,
                        renderCell: (params: any) => (
                          <Tooltip
                            title={params.row.description || ""}
                            placement="top"
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {params.value || "-"}
                            </Typography>
                          </Tooltip>
                        ),
                      },
                      {
                        field: "amount",
                        headerName: "Amount",
                        flex: 1,
                        type: "number",
                      },
                      {
                        field: "counter",
                        headerName: "Count",
                        flex: 1,
                        type: "number",
                      },
                    ]}
                  ></GlCustomTable>
                </GlPanelTable>
              </Grid>
            </Grid>

            {/* Details */}
            <Grid container spacing={1}>
              <Grid size={3}>
                <Box>
                  <GlPanelTable>
                    <GlCustomTable
                      url="/claim-validation/statistics?groupBy=item_id"
                      params={getAllFormValues}
                      sx={{
                        height: "350px",
                        "& .MuiDataGrid-columnHeaders > div": {
                          backgroundColor: "#09b82f !important",
                        },
                      }}
                      autoSelectFirstRow={false}
                      smallSize
                      getRowId={(r) => r.code + r.counter}
                      fetcher={fetcher}
                      resetSelectedRowRef={resetSelectedRowsRefs[4]}
                      onRowSelected={(r) => {
                        setAllValidationClaimParams((prev) => {
                          if (prev.item_id === r?.code) {
                            return prev;
                          }
                          return {
                            ...prev,
                            item_id: r?.code,
                          };
                        });
                      }}
                      columns={[
                        {
                          field: "code",
                          headerName: "Item ID",
                          flex: 1,
                          renderCell: (params: any) => (
                            <Tooltip
                              title={params.row.description || ""}
                              placement="top"
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {params.value || "-"}
                              </Typography>
                            </Tooltip>
                          ),
                        },
                        {
                          field: "amount",
                          headerName: "Amount",
                          flex: 1,
                          type: "number",
                        },
                        {
                          field: "counter",
                          headerName: "Count",
                          flex: 1,
                          type: "number",
                        },
                      ]}
                    ></GlCustomTable>
                  </GlPanelTable>
                </Box>
              </Grid>
              <Grid size={9}>
                <Box>
                  <GlPanelTable>
                    <GlCustomTable
                      sx={{
                        height: "350px",
                      }}
                      initialHiddenColumns={["patient_full_name"]}
                      getRowId={(r) => r.error_id}
                      columns={[
                        {
                          field: "req_id",
                          headerName: "ReqID",
                          width: 70,
                          type: "number",
                        },
                        {
                          field: "api_trans_id",
                          headerName: "API TranID",
                          width: 70,
                          type: "number",
                        },
                        {
                          field: "validation_code_description",
                          headerName: "Validation Desc",
                          width: 170,
                          renderCell: (params: any) => (
                            <Tooltip
                              title={params.row.validation_code || ""}
                              placement="top"
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {params.value || "-"}
                              </Typography>
                            </Tooltip>
                          ),
                        },
                        {
                          field: "status",
                          headerName: "Status",
                          width: 80,
                        },
                        {
                          field: "msg",
                          headerName: "Message",
                          width: 200,
                          flex: 2,
                          renderCell: (params: any) => (
                            <Typography
                              variant="body2"
                              sx={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={params.value}
                            >
                              {params.value || "-"}
                            </Typography>
                          ),
                        },
                        {
                          field: "creation_date",
                          headerName: "Creation Date",
                          width: 180,
                        },

                        {
                          field: "diagnosis_code",
                          headerName: "Diagnosis",
                          width: 130,
                          flex: 1,
                          renderCell: (params: any) => (
                            <Tooltip
                              title={params.row.diagnosis_description || ""}
                              placement="top"
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                                title={params.value}
                              >
                                {`${params.value || "-"}`}
                              </Typography>
                            </Tooltip>
                          ),
                        },
                        {
                          field: "payer_name",
                          headerName: "Payer Name",
                          width: 100,
                          type: "string",
                        },
                        {
                          field: "patient_full_name",
                          headerName: "Patient Name",
                          width: 100,
                          type: "string",
                        },
                        {
                          field: "service_item_description",
                          headerName: "Item Desc",
                          width: 100,
                          type: "string",
                        },
                        {
                          field: "physician_full_name",
                          headerName: "Physician Name",
                          width: 100,
                          type: "string",

                          renderCell: (params: any) => (
                            <Typography
                              variant="body2"
                              sx={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={params.value}
                            >
                              {params.value?.trim() || "-"}
                            </Typography>
                          ),
                        },
                      ]}
                      url="/claim-validation"
                      fetcher={fetcher}
                      params={getAllValidationClaimParams}
                      page={detailPageNum}
                      onPageChangeExternal={(p) => {
                        setDetailPageNum(p);
                      }}
                    ></GlCustomTable>
                  </GlPanelTable>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        <TabPanel value="2" sx={{ px: 0 }}>
          <GlPanelTable>
            <GlCustomTable
              getRowId={(r) => r.error_id}
              columns={[
                {
                  field: "req_id",
                  headerName: "ReqID",
                  width: 70,
                  type: "number",
                },
                {
                  field: "api_trans_id",
                  headerName: "API TranID",
                  width: 70,
                  type: "number",
                },
                {
                  field: "validation_code_description",
                  headerName: "Validation Desc",
                  width: 170,
                  renderCell: (params: any) => (
                    <Tooltip
                      title={params.row.validation_code || ""}
                      placement="top"
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {params.value || "-"}
                      </Typography>
                    </Tooltip>
                  ),
                },
                {
                  field: "status",
                  headerName: "Status",
                  width: 80,
                },
                {
                  field: "msg",
                  headerName: "Message",
                  width: 200,
                  flex: 2,
                  renderCell: (params: any) => (
                    <Typography
                      variant="body2"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={params.value}
                    >
                      {params.value || "-"}
                    </Typography>
                  ),
                },
                {
                  field: "creation_date",
                  headerName: "Creation Date",
                  width: 180,
                },

                {
                  field: "diagnosis_description",
                  headerName: "Diagnosis Description",
                  width: 130,
                  flex: 1,
                  renderCell: (params: any) => (
                    <Typography
                      variant="body2"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={params.value}
                    >
                      {`${params.row.diagnosis_code || ""}${params.value ? `-${params.value}` : ""}`}
                    </Typography>
                  ),
                },
                {
                  field: "payer_name",
                  headerName: "Payer Name",
                  width: 100,
                  type: "string",
                },
                {
                  field: "patient_full_name",
                  headerName: "Patient Name",
                  width: 100,
                  type: "string",
                },
                {
                  field: "service_item_description",
                  headerName: "Item Desc",
                  width: 100,
                  type: "string",
                },
                {
                  field: "physician_emp_id",
                  headerName: "Phys ID",
                  width: 70,
                  type: "number",
                },
              ]}
              url="/claim-validation"
              fetcher={fetcher}
              params={getAllFormValues}
            ></GlCustomTable>
          </GlPanelTable>
        </TabPanel>
        <TabPanel value="3" sx={{ px: 0 }}>
          <TimeLineTab backendParam="day" dataKey="day" />
        </TabPanel>
        <TabPanel value="4" sx={{ px: 0 }}>
          <TimeLineTab backendParam="hour" dataKey="hour" />
        </TabPanel>

        <TabPanel value="5" sx={{ px: 0 }}>
          <TimeLineTab backendParam="allFacilitiesDay" dataKey="day" />
          <TimeLineTab backendParam="allFacilitiesHour" dataKey="hour" />
        </TabPanel>
      </TabContext>
    </>
  );
}
