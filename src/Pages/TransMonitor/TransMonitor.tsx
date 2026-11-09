import { useEffect, useMemo, useRef, useState } from "react";
import { useTransMonitorContext } from "./Context/TransMonitorContext";
import type {
  Payers,
  PollDetails,
  TransDetails,
  TransError,
  TransResponse,
  TransSummary,
} from "./Context/TransMonitorContext";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import FilterForm from "./Components/FilterForm";
import type { Filters } from "./Components/FilterForm";
import { isAxiosError } from "axios";
import { DisplayMsgDialog, Secure } from "@givc/shared-components";
import type { GLGridColDef } from "@givc/shared-components";

import {
  fetcher,
  hl7Axios,
  normalAxios,
  normalAxiosWithOutContentType,
} from "../../api";
import DownloadTransData from "../../components/DownloadTransData/DownloadTransData";
import GlobalLoader from "../../components/GlobalLoader";
import ReplayIcon from "@mui/icons-material/Replay";
import { ArrowDropDown } from "@mui/icons-material";
import { toast } from "react-toastify";
import { PERMISSIONS_PREFIXES } from "../../constants";
import HandleTitle from "../../components/HandleTitle";
import ResendDialog from "./Components/resendDialog";
import FileViewer from "../../components/FileViewer";

const limit = 5;

export default function TransMonitor() {
  const {
    transMonitorContextData,
    updateSelectedPayerFn,
    updateSelectedTransSummaryFn,
    updateSelectedTransDetailsFn,
    updateSelectedTransErrorFn,
    resetAllSelectionsFn,
    getPayersParams,
    getTransSummaryParams,
    getTransDetailsParams,
  } = useTransMonitorContext();

  const {
    payerId: selectedPayerId,
    transSummary: selectedTransSummary,
    transDetailsId: selectedTransDetailsId,
    transDetail: selectedTransDetail,
  } = transMonitorContextData.selectionObj;

  const [resendDialogOpen, setResendDialogOpen] = useState(false);
  const [resendUrl, setResendUrl] = useState("");
  const [resendTitle, setResendTitle] = useState("Resend Request");

  const [hl7ResendDialogOpen, setHl7ResendDialogOpen] = useState(false);
  const [selectedTransactionData, setSelectedTransactionData] = useState<{
    patientId: string;
    episodeNo: string;
    messageType: string;
    status?: string;
    orderLine?: string;
  } | null>(null);
  
  const [hl7ResponseDialogOpen, setHl7ResponseDialogOpen] = useState(false);
  const [hl7ResponseData, setHl7ResponseData] = useState<{
    description: string;
    resourceId: string;
  } | null>(null);

  const [filterValues, setFilterValues] = useState<Filters | null>(null);

  const [selectedTab, setSelectedTab] = useState("errors");

  const [, setSelectedTransResponseId] = useState<string | number | null>(null);
  const [selectedPollDetailsId, setSelectedPollDetailsId] = useState<string | number | null>(null);

  const [description, setDescription] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [adminMenuAnchorEl, setAdminMenuAnchorEl] = useState<null | HTMLElement>(null);
  const adminMenuOpen = Boolean(adminMenuAnchorEl);

  const handleAdminMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAdminMenuAnchorEl(event.currentTarget);
  };

  const handleAdminMenuClose = () => {
    setAdminMenuAnchorEl(null);
  };

  const [payerPage, setPayerPage] = useState(1);
  const [summaryPage, setSummaryPage] = useState(1);
  const [detailsPage, setDetailsPage] = useState(1);
  const [errorsPage, setErrorsPage] = useState(1);
  const [responsePage, setResponsePage] = useState(1);
  const [pollDetailsPage, setPollDetailsPage] = useState(1);

  useEffect(() => {
    setPayerPage(1);
  }, [filterValues]);

  useEffect(() => {
    setSummaryPage(1);
  }, [selectedPayerId, filterValues]);

  useEffect(() => {
    setDetailsPage(1);
  }, [selectedPayerId, selectedTransSummary, filterValues]);

  useEffect(() => {
    setErrorsPage(1);
  }, [selectedTransDetailsId]);

  useEffect(() => {
    setResponsePage(1);
  }, [selectedTransDetailsId]);

  useEffect(() => {
    setPollDetailsPage(1);
  }, [selectedTransDetailsId]);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  const handleSendAdvancedAuth = async (responseId: string | number) => {
    if (!responseId) return;

    console.log({ responseId });

    try {
      setLoading(true);
      const { data } = await normalAxios.get(
        `/nphies/test/payer-response/advanced-auth`,
        {
          params: {
            responseId,
          },
        },
      );
      console.log(data);
      console.log(data.data.msgId);

      setOpen(true);
      setTitle(data.data.msgId);
      setDescription(data.data.description);
    } catch (error) {
      if (isAxiosError(error)) {
        console.error("Error submitting payer communication data:", error);
        setOpen(true);
        setTitle(error.response?.data.data.msgId);
        setDescription(error.response?.data.data.description);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendHl7Msg = (useHttp: boolean) => {
    if (!selectedTransactionData) return;

    const { patientId, episodeNo, messageType } = selectedTransactionData;
    const httpFlag = useHttp ? 1 : 0;
    setIsLoading(true);

    hl7Axios
      .get(
        `/adt/single?patientId=${patientId}&messageType=${messageType}&episodeNo=${episodeNo}&http=${httpFlag}`,
      )
      .then((res) => {
        console.log("HL7 Resend Response:", res.data);

        setHl7ResponseData({
          description: res.data.data?.description || "",
          resourceId: res.data.data?.msgId,
        });

        setHl7ResponseDialogOpen(true);
      })
      .catch((err) => {
        console.error("HL7 Resend Error:", err);

        setHl7ResponseData({
          description: err.response?.data?.data?.description || "",
          resourceId: err.response?.data?.data?.msgId,
        });
        setHl7ResponseDialogOpen(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleResendHl7Click = async () => {
    if (!selectedTransDetailsId) {
      console.error("No transaction selected");
      return;
    }

    if (!selectedTransDetail) {
      console.error("Selected transaction not found");
      return;
    }

    if (
      selectedTransDetail.api_name?.toUpperCase() == "MEDICATION" ||
      selectedTransDetail.api_name?.toUpperCase() == "RADIOLOGY" ||
      selectedTransDetail.api_name?.toUpperCase() == "LAB" ||
      selectedTransDetail.api_name?.toUpperCase() == "ADT"
    ) {
      const url = selectedTransDetail.url;
      setSelectedTransactionData({
        ...(selectedTransDetail as any),
      });

      setResendUrl(url);
      setResendTitle(`Resend ${selectedTransDetail.api_name} Request`);
      setResendDialogOpen(true);
      return;
    }

    setSelectedTransactionData({
      patientId: selectedTransDetail.patient_id?.toString() || "",
      episodeNo: selectedTransDetail.episode_no?.toString() || "",
      messageType: selectedTransDetail.api_function || "",
    });

    setHl7ResendDialogOpen(true);
  };

  const handleResendSuccess = (responseData: any) => {
    setDescription(responseData.description);
    setResourceId(responseData.msgId);
    setDialogOpen(true);
  };

  const handleResendError = (error: any) => {
    if (isAxiosError(error)) {
      const description =
        error.response?.data?.description ||
        error.response?.data?.data?.description ||
        "Error fetching data";
      const resourceId =
        error.response?.data?.msgId ||
        error.response?.data?.data?.msgId ||
        "Error";
      setDescription(description);
      setResourceId(resourceId);
      setDialogOpen(true);
    }
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const refetchRefPayer = useRef<(() => void) | null>(null);
  const refetchRefSummary = useRef<(() => void) | null>(null);
  const refetchRefTransErrors = useRef<(() => void) | null>(null);
  const refetchRefPollDetails = useRef<(() => void) | null>(null);

  const resetSelectedRowRefPayer = useRef<(() => void) | null>(null);
  const resetSelectedRowRefSummary = useRef<(() => void) | null>(null);
  const resetSelectedRowRefDetails = useRef<(() => void) | null>(null);

  const [loading, setLoading] = useState(false);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      await normalAxiosWithOutContentType.post("/nphies/poll/upload", formData);

      toast.success(`Success`);
    } catch (error: any) {
      console.error("Upload failed:", error?.response?.data?.msg);
      toast.error("Error " + error?.response?.data?.msg, {
        autoClose: false,
      });
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  const handleSearch = useCallback(
    (newFilters: Filters) => {
      // 1. Reset all selections in context
      resetAllSelectionsFn();

      // 2. Reset table internal selection highlights
      resetSelectedRowRefPayer.current?.();
      resetSelectedRowRefSummary.current?.();
      resetSelectedRowRefDetails.current?.();

      // 3. Reset pagination
      setPayerPage(1);
      setSummaryPage(1);
      setDetailsPage(1);
      setErrorsPage(1);
      setResponsePage(1);
      setPollDetailsPage(1);

      // 4. Update filter values
      setFilterValues(newFilters);

      // 5. Force refetch Payers table
      refetchRefPayer.current?.();
    },
    [resetAllSelectionsFn],
  );

  const isSummaryReady = Boolean(
    filterValues?.payers === false ? filterValues : selectedPayerId != null,
  );
  const summaryUrl = isSummaryReady ? "/transMonitor/trans_summaries" : "";

  const isDetailsReady = Boolean(
    filterValues?.status === false
      ? filterValues?.payers === false
        ? filterValues
        : selectedPayerId != null
      : selectedTransSummary != null,
  );
  const detailsUrl = isDetailsReady ? "/transMonitor/trans_details" : "";

  const isDetailSelected = Boolean(selectedTransDetailsId != null);
  const errorsUrl = isDetailSelected ? "/transMonitor/trans_errors" : "";
  const responseUrl = isDetailSelected ? "/transMonitor/trans_responses" : "";
  const pollDetailsUrl = isDetailSelected ? "/transMonitor/poll_details" : "";

  const payersParams = useMemo(() => {
    return getPayersParams(filterValues);
  }, [getPayersParams, filterValues]);

  const summaryParams = useMemo(() => {
    if (!isSummaryReady) return {};
    return getTransSummaryParams(selectedPayerId, filterValues);
  }, [isSummaryReady, getTransSummaryParams, selectedPayerId, filterValues]);

  const detailsParams = useMemo(() => {
    if (!isDetailsReady) return {};
    return getTransDetailsParams(
      selectedPayerId,
      selectedTransSummary,
      filterValues,
    );
  }, [
    isDetailsReady,
    getTransDetailsParams,
    selectedPayerId,
    selectedTransSummary,
    filterValues,
  ]);

  const tabParams = useMemo(() => {
    return isDetailSelected ? { trans_id: selectedTransDetailsId } : {};
  }, [isDetailSelected, selectedTransDetailsId]);

  return (
    <>
      <HandleTitle titleKey="TRANS_MONITOR" />
      <ResendDialog
        open={resendDialogOpen}
        onClose={() => setResendDialogOpen(false)}
        url={resendUrl}
        title={resendTitle}
        onSuccess={handleResendSuccess}
        onError={handleResendError}
        transactionData={{
          ...selectedTransactionData,
        }}
      />
      <DisplayMsgDialog
        open={open}
        onClose={() => setOpen(false)}
        description={description}
        resourceId={title}
      />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          justifyContent: "space-between",
        }}
      >
        {(isLoading || loading) && <GlobalLoader />}

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        
        <FilterForm
          setFilterValues={setFilterValues}
          onSearch={handleSearch}
          refetchRefPayer={refetchRefPayer}
          refetchRefSummary={refetchRefSummary}
        />

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 1,
            justifyContent: "space-evenly",
            width: "100%",
          }}
        >
          <Box sx={{ width: "35%" }}>
            <Secure.GLCustomTable2
              permission={`${PERMISSIONS_PREFIXES.transMonitor}payers`}
              fetcher={fetcher}
              url="/transMonitor/payers"
              page={payerPage}
              onPageChangeExternal={setPayerPage}
              params={payersParams}
              getRowId={(row: any) => row.payer_id}
              limit={limit}
              smallSize
              refetchRef={refetchRefPayer}
              resetSelectedRowRef={resetSelectedRowRefPayer}
              onRowSelected={(row: Payers | null) =>
                updateSelectedPayerFn(row?.payer_id != null ? row.payer_id : null)
              }
              sx={{ maxHeight: "35vh" }}
              columns={
                [
                  {
                    field: "payer_id",
                    align: "right",
                    type: "number",
                    headerName: "Payer Id",
                    permission: `${PERMISSIONS_PREFIXES.transMonitor}payerId`,
                  },
                  {
                    field: "payer_name",
                    headerName: "Payer Name",
                    flex: 2,
                    permission: `${PERMISSIONS_PREFIXES.transMonitor}payerName`,
                  },
                  {
                    field: "cnt",
                    align: "right",
                    type: "number",
                    headerName: "CNT",
                    permission: `${PERMISSIONS_PREFIXES.transMonitor}cnt`,
                    renderCell: (p) => (
                      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        {p.value}
                      </Box>
                    ),
                  },
                  {
                    field: "response_ms",
                    align: "right",
                    type: "number",
                    headerName: "Response MS",
                    permission: `${PERMISSIONS_PREFIXES.transMonitor}responseMs`,
                    renderCell: (p) => (
                      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        {p.value}
                      </Box>
                    ),
                  },
                ] as GLGridColDef[]
              }
            />
          </Box>
          <Box sx={{ width: "65%" }}>
            <Secure.GLCustomTable2
              permission={`${PERMISSIONS_PREFIXES.transMonitor}transSummary`}
              fetcher={fetcher}
              page={summaryPage}
              refetchRef={refetchRefSummary}
              resetSelectedRowRef={resetSelectedRowRefSummary}
              onPageChangeExternal={setSummaryPage}
              url={summaryUrl}
              params={summaryParams}
              getRowId={(row: TransSummary) =>
                `${row?.api_function}-${row?.api_name}-${row?.status}`
              }
              sx={{ maxHeight: "35vh" }}
              smallSize
              limit={limit}
              columns={
                [
                  {
                    field: "api_name",
                    headerName: "API Name",
                    permission: `${PERMISSIONS_PREFIXES.transMonitor}apiName`,
                  },
                  {
                    field: "api_function",
                    headerName: "API Function",
                    permission: `${PERMISSIONS_PREFIXES.transMonitor}apiFunction`,
                    flex: 2,
                  },
                  {
                    field: "status",
                    headerName: "Status",
                    permission: `${PERMISSIONS_PREFIXES.transMonitor}status`,
                  },
                  {
                    field: "trans_count",
                    headerName: "Trans Count",
                    permission: `${PERMISSIONS_PREFIXES.transMonitor}transCount`,
                    type: "number",
                    renderCell: (p) => (
                      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        {p.value}
                      </Box>
                    ),
                    display: "flex",
                    align: "right",
                  },
                  {
                    field: "earliest_trans",
                    headerName: "Earliest Trans",
                    permission: `${PERMISSIONS_PREFIXES.transMonitor}earliestTrans`,
                    flex: 2,
                  },
                  {
                    field: "latest_trans",
                    headerName: "Latest Trans",
                    permission: `${PERMISSIONS_PREFIXES.transMonitor}latestTrans`,
                    flex: 2,
                  },
                  {
                    field: "preprocess_t_ms",
                    headerName: "Avg Preprocess Time",
                    permission: `${PERMISSIONS_PREFIXES.transMonitor}averagePreprocessTime`,
                    flex: 2,
                    valueFormatter: (value) => Number(value).toFixed(2),
                    align: "right",
                  },
                  {
                    field: "elapsed_t_ms",
                    headerName: "Avg Elapsed Time",
                    permission: `${PERMISSIONS_PREFIXES.transMonitor}averageElapsedTime`,
                    flex: 2,
                    valueFormatter: (value) => Number(value).toFixed(2),
                    align: "right",
                  },
                  {
                    field: "response_ms",
                    permission: `${PERMISSIONS_PREFIXES.transMonitor}responseMs`,
                    align: "right",
                    type: "number",
                    renderCell: (p) => (
                      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        {p.value}
                      </Box>
                    ),
                    headerName: "Response MS",
                  },
                ] as GLGridColDef[]
              }
              onRowSelected={(row: TransSummary | null) => {
                updateSelectedTransSummaryFn(row);
              }}
            />
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Secure.GLCustomTable2
            permission={`${PERMISSIONS_PREFIXES.transMonitor}transDetails`}
            fetcher={fetcher}
            page={detailsPage}
            onPageChangeExternal={setDetailsPage}
            resetSelectedRowRef={resetSelectedRowRefDetails}
            url={detailsUrl}
            params={detailsParams}
            smallSize
            getRowId={(row: any) => row.api_trans_id}
            limit={limit}
            initialHiddenColumns={[
              "bundle_id",
              "response_time_ms",
              "trans_date",
              "elapsed_time_ms",
              "preprocess_time_ms",
              "local_api_time_ms",
            ]}
            columns={
              [
                {
                  field: "api_trans_id",
                  align: "right",
                  type: "number",
                  display: "flex",
                  headerName: "API Trans ID",
                  permission: `${PERMISSIONS_PREFIXES.transMonitor}apiTransId`,
                  renderCell: (params: any) => {
                    return (
                      <Box
                        className={
                          params.row.api_function?.toUpperCase() == "CANCEL"
                            ? " status_C"
                            : ""
                        }
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          gap: 1,
                          alignItems: "center",
                        }}
                      >
                        <span>{params.row.api_trans_id}</span>
                        <DownloadTransData
                          permission={`${PERMISSIONS_PREFIXES.transMonitor}downloadTransData`}
                          fallBackText="Download"
                          transId={params.row.api_trans_id}
                        />
                      </Box>
                    );
                  },
                },
                {
                  field: "api_name",
                  display: "flex",
                  headerName: "API Name",
                  permission: `${PERMISSIONS_PREFIXES.transMonitor}apiName`,
                },
                {
                  field: "api_function",
                  display: "flex",
                  headerName: "API Function",
                  permission: `${PERMISSIONS_PREFIXES.transMonitor}apiFunction`,
                  flex: 1,
                },
                {
                  field: "creation_date",
                  display: "flex",
                  headerName: "Creation Date",
                  permission: `${PERMISSIONS_PREFIXES.transMonitor}creationDate`,
                  width: 130,
                },
                {
                  field: "trans_date",
                  display: "flex",
                  headerName: "Transaction Date",
                  permission: `${PERMISSIONS_PREFIXES.transMonitor}transactionDate`,
                  width: 130,
                },
                {
                  field: "bundle_id",
                  display: "flex",
                  headerName: "Bundle Id",
                  permission: `${PERMISSIONS_PREFIXES.transMonitor}bundleId`,
                  flex: 1,
                },
                {
                  field: "response_time_ms",
                  headerName: "Response ms",
                  permission: `${PERMISSIONS_PREFIXES.transMonitor}responseTime`,
                  display: "flex",
                  type: "number",
                },
                {
                  field: "elapsed_time_ms",
                  headerName: "Elapsed ms",
                  permission: `${PERMISSIONS_PREFIXES.transMonitor}elapsedTime`,
                  display: "flex",
                  type: "number",
                },
                {
                  field: "preprocess_time_ms",
                  headerName: "Preprocess ms",
                  permission: `${PERMISSIONS_PREFIXES.transMonitor}preprocessTime`,
                  display: "flex",
                  type: "number",
                },
                {
                  field: "local_api_time_ms",
                  headerName: "Local API ms",
                  permission: `${PERMISSIONS_PREFIXES.transMonitor}localApiTime`,
                  type: "number",
                  display: "flex",
                },
                {
                  field: "status",
                  headerName: "Status",
                  display: "flex",
                  permission: `${PERMISSIONS_PREFIXES.transMonitor}status`,
                },
                {
                  field: "outcome",
                  headerName: "Outcome",
                  display: "flex",
                  permission: `${PERMISSIONS_PREFIXES.transMonitor}outcome`,
                },
                {
                  field: "adjudication_outcome",
                  headerName: "Adjudication",
                  permission: `${PERMISSIONS_PREFIXES.transMonitor}adjudication`,
                  display: "flex",
                },
                {
                  field: "patient_id",
                  align: "right",
                  type: "number",
                  headerName: "Patient Id",
                  permission: `${PERMISSIONS_PREFIXES.transMonitor}patientId`,
                },
                {
                  field: "episode_no",
                  align: "right",
                  type: "number",
                  headerName: "Episode",
                  permission: `${PERMISSIONS_PREFIXES.transMonitor}episodeNo`,
                },
                {
                  field: "transaction_id",
                  align: "right",
                  type: "number",
                  headerName: "Transaction Id",
                  permission: `${PERMISSIONS_PREFIXES.transMonitor}transactionId`,
                },
                {
                  field: "payer_id",
                  align: "right",
                  type: "number",
                  headerName: "Payer",
                  permission: `${PERMISSIONS_PREFIXES.transMonitor}payerId`,
                },
                {
                  field: "facility_id",
                  align: "right",
                  type: "number",
                  headerName: "Facility Id",
                  permission: `${PERMISSIONS_PREFIXES.transMonitor}facilityId`,
                },
                {
                  field: "bundle_count",
                  align: "right",
                  type: "number",
                  permission: `${PERMISSIONS_PREFIXES.transMonitor}bundleCount`,
                  headerName: "Bundles",
                  renderCell: (p) => {
                    return (
                      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        {p.value}
                      </Box>
                    );
                  },
                },
                {
                  field: "res_kb",
                  align: "right",
                  type: "number",
                  permission: `${PERMISSIONS_PREFIXES.transMonitor}resKb`,
                  display: "flex",
                  headerName: "Res KB",
                  renderCell: (p) => {
                    return (
                      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        {p.value}
                      </Box>
                    );
                  },
                },
                {
                  field: "dest_url",
                  headerName: "Dest URL",
                  permission: `${PERMISSIONS_PREFIXES.transMonitor}destUrl`,
                  flex: 1,
                  renderCell: (params: any) => (
                    <Tooltip
                      title={params.value || ""}
                      placement="top"
                      arrow
                      disableHoverListener={!params.value}
                    >
                      <Box
                        sx={{
                          width: "100%",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {params.value}
                      </Box>
                    </Tooltip>
                  ),
                },
                {
                  field: "url",
                  headerName: "URL",
                  permission: `${PERMISSIONS_PREFIXES.transMonitor}url`,
                  flex: 1,
                  renderCell: (params: any) => (
                    <Tooltip
                      title={params.value || ""}
                      placement="top"
                      arrow
                      disableHoverListener={!params.value}
                    >
                      <Box
                        sx={{
                          width: "100%",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {params.value}
                      </Box>
                    </Tooltip>
                  ),
                },
                {
                  field: "cancel_api_trans_id",
                  align: "right",
                  type: "number",
                  headerName: "Cancel Trans ID",
                  permission: `${PERMISSIONS_PREFIXES.transMonitor}cancelTransId`,
                  flex: 1,
                },
                {
                  field: "error_message",
                  headerName: "Error Message",
                  permission: `${PERMISSIONS_PREFIXES.transMonitor}errorMessage`,
                  flex: 2,
                  renderCell: (params: any) => (
                    <Tooltip
                      title={params.value || ""}
                      placement="top"
                      arrow
                      disableHoverListener={!params.value}
                    >
                      <Box
                        sx={{
                          width: "100%",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {params.value}
                      </Box>
                    </Tooltip>
                  ),
                },
              ] as GLGridColDef[]
            }
            sx={{ maxHeight: "35vh" }}
            onRowSelected={(row: TransDetails | null) => {
              updateSelectedTransDetailsFn(row);
            }}
          />

          <DisplayMsgDialog
            description={description}
            resourceId={resourceId}
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
          />

          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-start",
              gap: 1,
            }}
          >
            <Button
              variant="contained"
              disabled={!selectedTransDetailsId}
              onClick={() => {
                if (!selectedTransDetailsId) return;

                normalAxios
                  .get(`/nphies/claim/cancel/${selectedTransDetailsId}`)
                  .then((res) => {
                    console.log(res.data);
                    setDescription(res?.data?.data?.description);
                    setResourceId(res?.data?.data?.msgId);
                    setDialogOpen(true);
                  })
                  .catch((err) => {
                    setDialogOpen(true);
                    console.log(err?.response?.data?.data);
                    setDescription(err?.response?.data?.data?.description);
                    setResourceId(err?.response?.data?.data?.msgId);
                  });
              }}
            >
              Cancel
            </Button>

            <Button variant="contained" onClick={() => console.log("Status")}>
              Status
            </Button>

            <Button
              variant="contained"
              onClick={() => console.log("Send Error")}
            >
              Send Error
            </Button>

            <Button
              variant="contained"
              disabled={!selectedTransDetailsId}
              onClick={() => {
                if (!selectedTransDetailsId) return;
                setIsLoading(true);
                normalAxios
                  .post(`/nphies/splitPollResponse`, {
                    api_trans_id: selectedTransDetailsId,
                  })
                  .then(async (res) => {
                    toast.success(`Success`);
                    refetchRefTransErrors?.current?.();
                    refetchRefPollDetails?.current?.();
                  })
                  .catch((err) => {
                    if (isAxiosError(err)) {
                      toast.error(
                        err?.response?.data.error || "something want wrong",
                      );
                    }
                    console.log(err);
                  })
                  .finally(() => {
                    setIsLoading(false);
                  });
              }}
            >
              Re-parse Poll
            </Button>

            <Button
              variant="contained"
              disabled={!selectedTransDetailsId}
              onClick={() => {
                if (!selectedTransDetailsId) return;
                setIsLoading(true);
                normalAxios
                  .post(`/nphies/handlePollResponseFull`, {
                    api_trans_id: selectedTransDetailsId,
                  })
                  .then(async () => {
                    toast.success(`Success`);
                    refetchRefTransErrors?.current?.();
                    refetchRefPollDetails?.current?.();
                  })
                  .catch((err) => {
                    if (isAxiosError(err)) {
                      toast.error(
                        err?.response?.data.error || "something want wrong",
                      );
                    }
                    console.log(err);
                  })
                  .finally(() => {
                    setIsLoading(false);
                  });
              }}
            >
              Re-process Poll
            </Button>

            <Button
              disabled={!selectedTransDetailsId}
              variant="contained"
              onClick={() => {
                handleButtonClick();
              }}
            >
              Upload Poll
            </Button>

            <Button
              onClick={handleAdminMenuOpen}
              aria-controls={adminMenuOpen ? "admin-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={adminMenuOpen ? "true" : undefined}
              sx={{ cursor: "pointer" }}
            >
              Admin
              <ArrowDropDown fontSize="small" sx={{ mr: 0.5 }} />
            </Button>

            <Menu
              id="admin-menu"
              anchorEl={adminMenuAnchorEl}
              open={adminMenuOpen}
              onClose={handleAdminMenuClose}
              MenuListProps={{
                "aria-labelledby": "admin-button",
              }}
            >
              <MenuItem
                disabled={!selectedPollDetailsId}
                onClick={() => {
                  if (selectedPollDetailsId) {
                    handleSendAdvancedAuth(selectedPollDetailsId);
                  }
                }}
              >
                <ListItemText>Advanced Auth</ListItemText>
              </MenuItem>
            </Menu>
            <Button
              disabled={!selectedTransDetailsId}
              variant="contained"
              onClick={async () => {
                await handleResendHl7Click();
              }}
            >
              {"Resend  Msg"}
            </Button>
          </Box>
        </Box>

        <Box>
          <Secure.GLLab.TabContext
            permission={`${PERMISSIONS_PREFIXES.transMonitor}transDetailsTabs`}
            value={selectedTab}
          >
            <Secure.GLLab.TabList
              onChange={(_, value) => setSelectedTab(value)}
            >
              <Secure.GLLab.Tab
                permission={`${PERMISSIONS_PREFIXES.transMonitor}transDetailsErrorsTab`}
                label="Errors"
                value="errors"
                fallBackText="Errors"
              />

              <Secure.GLLab.Tab
                permission={`${PERMISSIONS_PREFIXES.transMonitor}transDetailsResponseTab`}
                label="Response"
                value="response"
                fallBackText="Response"
              />

              <Secure.GLLab.Tab
                permission={`${PERMISSIONS_PREFIXES.transMonitor}transDetailsPollDetailsTab`}
                label="Poll Details"
                value="pollDetails"
                fallBackText="Poll Details"
              />

              <Secure.GLLab.Tab
                permission={`${PERMISSIONS_PREFIXES.transMonitor}transDetailsPreviewTab`}
                label="Preview"
                value="preview"
                fallBackText="Preview"
              />
            </Secure.GLLab.TabList>

            <Secure.GLLab.TabPanel
              value="errors"
              sx={{ p: 1 }}
              permission={`${PERMISSIONS_PREFIXES.transMonitor}transDetailsErrorsTab`}
            >
              <Secure.GLCustomTable2
                permission={`${PERMISSIONS_PREFIXES.transMonitor}transErrorsTable`}
                fetcher={fetcher}
                url={errorsUrl}
                params={tabParams}
                page={errorsPage}
                onPageChangeExternal={setErrorsPage}
                refetchRef={refetchRefTransErrors}
                smallSize
                columns={
                  [
                    {
                      field: "message_id",
                      align: "right",
                      type: "number",
                      headerName: "Message Id",
                      permission: `${PERMISSIONS_PREFIXES.transMonitor}messageId`,
                    },
                    {
                      field: "api_trans_id",
                      align: "right",
                      type: "number",
                      headerName: "Trans Id",
                      permission: `${PERMISSIONS_PREFIXES.transMonitor}transId`,
                      renderCell: (params: any) => {
                        return (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 1,
                              alignItems: "flex-start",
                            }}
                          >
                            <span>{params.row.api_trans_id}</span>
                            <DownloadTransData
                              transId={params.row.api_trans_id}
                              permission={`${PERMISSIONS_PREFIXES.transMonitor}downloadTransData`}
                              fallBackText="Download"
                            />
                          </Box>
                        );
                      },
                    },
                    {
                      field: "nphies_message_id",
                      headerName: "Nphies Message ID",
                      permission: `${PERMISSIONS_PREFIXES.transMonitor}nphiesMessageId`,
                    },
                    {
                      field: "nphies_message",
                      headerName: "Nphies Message",
                      flex: 5,
                      permission: `${PERMISSIONS_PREFIXES.transMonitor}nphiesMessage`,
                    },
                    {
                      field: "error_element",
                      headerName: "Error Element",
                      flex: 3,
                      permission: `${PERMISSIONS_PREFIXES.transMonitor}errorElement`,
                    },
                    {
                      field: "element_value",
                      headerName: "Element Value",
                      permission: `${PERMISSIONS_PREFIXES.transMonitor}elementValue`,
                    },
                    {
                      field: "item_no",
                      align: "right",
                      type: "number",
                      headerName: "Item No",
                      permission: `${PERMISSIONS_PREFIXES.transMonitor}itemNo`,
                    },
                    {
                      field: "response_id",
                      align: "right",
                      type: "number",
                      headerName: "ResponseId",
                      permission: `${PERMISSIONS_PREFIXES.transMonitor}responseId`,
                    },
                  ] as GLGridColDef[]
                }
                getRowId={(row: TransError) => row.message_id}
                onRowSelected={(row) =>
                  updateSelectedTransErrorFn(row?.message_id ?? null)
                }
                sx={{ maxHeight: "35vh", flex: 1 }}
              />
            </Secure.GLLab.TabPanel>

            <Secure.GLLab.TabPanel
              value="response"
              sx={{ p: 1 }}
              permission={`${PERMISSIONS_PREFIXES.transMonitor}transDetailsResponseTab`}
            >
              <Secure.GLCustomTable2
                permission={`${PERMISSIONS_PREFIXES.transMonitor}transResponses`}
                fetcher={fetcher}
                url={responseUrl}
                page={responsePage}
                onPageChangeExternal={setResponsePage}
                params={tabParams}
                smallSize
                getRowId={(row: TransResponse) => row.response_seq}
                onRowSelected={(row) =>
                  setSelectedTransResponseId(row?.response_seq ?? null)
                }
                sx={{ maxHeight: "35vh", flex: 1 }}
                columns={
                  [
                    {
                      flex: 1,
                      field: "api_trans_id",
                      align: "right",
                      type: "number",
                      headerName: "Poll Trans ID",
                      permission: `${PERMISSIONS_PREFIXES.transMonitor}pollTransId`,
                    },
                    {
                      flex: 1,
                      field: "response_seq",
                      align: "right",
                      headerName: "Response Seq",
                      permission: `${PERMISSIONS_PREFIXES.transMonitor}responseSeq`,
                    },
                    {
                      flex: 1,
                      field: "response_type",
                      headerName: "Response Type",
                      permission: `${PERMISSIONS_PREFIXES.transMonitor}responseType`,
                    },
                    {
                      flex: 1,
                      field: "status",
                      headerName: "Status",
                      permission: `${PERMISSIONS_PREFIXES.transMonitor}status`,
                    },
                    {
                      flex: 1,
                      field: "creation_date",
                      permission: `${PERMISSIONS_PREFIXES.transMonitor}creationDate`,
                      headerName: "Created at",
                    },
                    {
                      flex: 1,
                      field: "error_message",
                      headerName: "Error Message",
                      permission: `${PERMISSIONS_PREFIXES.transMonitor}errorMessage`,
                    },
                    {
                      field: " ",
                      headerName: "Response Bundle",
                      permission: `${PERMISSIONS_PREFIXES.transMonitor}responseBundle`,
                      renderCell: (params: any) => {
                        return (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "center",
                              gap: 1,
                              alignItems: "flex-start",
                            }}
                          >
                            <DownloadTransData
                              directData={params.row.response_bundle}
                              directFileType={{
                                name: `${params.row.about_api_trans_id}_${params.row.response_type}_poll_${params.row.api_trans_id}_${params.row.response_id}`,
                                type: "application/json",
                              }}
                              permission={`${PERMISSIONS_PREFIXES.transMonitor}downloadTransData`}
                              fallBackText="Download"
                            ></DownloadTransData>

                            <ReplayIcon
                              fontSize="small"
                              onClick={() => {
                                if (!params.row.response_id) return;
                                setIsLoading(true);
                                normalAxios
                                  .post(`/nphies/processSingleBundle`, {
                                    response_id: params.row.response_id,
                                  })
                                  .then(async (res) => {
                                    toast.success(
                                      `Success ${
                                        res.data.req_id
                                          ? `(ServiceRequest ID ${res.data.req_id} )`
                                          : ""
                                      }`,
                                    );

                                    refetchRefTransErrors?.current?.();
                                    refetchRefPollDetails?.current?.();
                                  })
                                  .catch((err) => {
                                    console.log(err);
                                    if (isAxiosError(err)) {
                                      toast.error(
                                        err?.response?.data.error ||
                                          "something want wrong",
                                      );
                                    }
                                  })
                                  .finally(() => {
                                    setIsLoading(false);
                                  });
                              }}
                            />
                          </Box>
                        );
                      },
                    },
                  ] as GLGridColDef[]
                }
              />
            </Secure.GLLab.TabPanel>

            <Secure.GLLab.TabPanel
              value="pollDetails"
              sx={{ p: 1 }}
              permission={`${PERMISSIONS_PREFIXES.transMonitor}transDetailsPollDetailsTab`}
            >
              <Secure.GLCustomTable2
                permission={`${PERMISSIONS_PREFIXES.transMonitor}pollDetails`}
                refetchRef={refetchRefPollDetails}
                fetcher={fetcher}
                url={pollDetailsUrl}
                params={tabParams}
                page={pollDetailsPage}
                onPageChangeExternal={setPollDetailsPage}
                smallSize
                getRowId={(row: PollDetails) => row.response_id}
                onRowSelected={(row) =>
                  setSelectedPollDetailsId(row?.response_id ?? null)
                }
                sx={{ maxHeight: "35vh", flex: 1 }}
                columns={
                  [
                    {
                      flex: 1,
                      field: "response_seq",
                      align: "right",
                      headerName: "Response Seq",
                      permission: `${PERMISSIONS_PREFIXES.transMonitor}responseSeq`,
                    },
                    {
                      flex: 1,
                      field: "response_type",
                      headerName: "Response Type",
                      permission: `${PERMISSIONS_PREFIXES.transMonitor}responseType`,
                    },
                    {
                      flex: 1,
                      field: "response_id",
                      align: "right",
                      type: "number",
                      headerName: "Response Id",
                      permission: `${PERMISSIONS_PREFIXES.transMonitor}responseId`,
                    },
                    {
                      flex: 1,
                      field: "status",
                      headerName: "Status",
                      permission: `${PERMISSIONS_PREFIXES.transMonitor}status`,
                    },
                    {
                      flex: 1,
                      field: "about_api_trans_id",
                      align: "right",
                      type: "number",
                      headerName: "About",
                      permission: `${PERMISSIONS_PREFIXES.transMonitor}aboutApiTransId`,
                    },
                    {
                      flex: 1,
                      field: "adjudication_outcome",
                      headerName: "Outcome",
                      permission: `${PERMISSIONS_PREFIXES.transMonitor}outcome`,
                    },
                    {
                      flex: 1,
                      field: "creation_date",
                      headerName: "Created at",
                      permission: `${PERMISSIONS_PREFIXES.transMonitor}creationDate`,
                    },
                    {
                      flex: 1,
                      field: "error_message",
                      headerName: "Error Message",
                      permission: `${PERMISSIONS_PREFIXES.transMonitor}errorMessage`,
                    },
                    {
                      field: " ",
                      headerName: "Actions",
                      permission: `${PERMISSIONS_PREFIXES.transMonitor}actions`,
                      uiText: `${PERMISSIONS_PREFIXES.generic}actions`,
                      renderCell: (params: any) => {
                        return (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "center",
                              gap: 1,
                              alignItems: "flex-start",
                            }}
                          >
                            <DownloadTransData
                              directData={params.row.response_bundle}
                              directFileType={{
                                name: `${params.row.about_api_trans_id || ""}_${params.row.response_type}_poll_${params.row.api_trans_id}_${params.row.response_id}`,
                                type: "application/json",
                              }}
                              permission={`${PERMISSIONS_PREFIXES.transMonitor}downloadTransData`}
                              fallBackText="Download"
                            />
                            <ReplayIcon
                              onClick={() => {
                                if (!params.row.response_id) return;
                                setIsLoading(true);
                                normalAxios
                                  .post(`/nphies/processSingleBundle`, {
                                    response_id: params.row.response_id,
                                  })
                                  .then(async (res) => {
                                    toast.success(
                                      `Success ${
                                        res.data.req_id
                                          ? `(ServiceRequest ID ${res.data.req_id} )`
                                          : ""
                                      }`,
                                    );

                                    refetchRefTransErrors?.current?.();
                                    refetchRefPollDetails?.current?.();
                                  })
                                  .catch((err) => {
                                    console.log(err);
                                    if (isAxiosError(err)) {
                                      toast.error(
                                        err?.response?.data.error ||
                                          "something want wrong",
                                      );
                                    }
                                  })
                                  .finally(() => {
                                    setIsLoading(false);
                                  });
                              }}
                            />
                          </Box>
                        );
                      },
                    },
                  ] as GLGridColDef[]
                }
              />
            </Secure.GLLab.TabPanel>

            <Secure.GLLab.TabPanel
              value="preview"
              permission={`${PERMISSIONS_PREFIXES.transMonitor}transDetailsPreviewTab`}
            >
              <FileViewer transDetailsId={selectedTransDetailsId || ""} />
            </Secure.GLLab.TabPanel>
          </Secure.GLLab.TabContext>
        </Box>

        <DisplayMsgDialog
          description={hl7ResponseData?.description || ""}
          open={hl7ResponseDialogOpen}
          onClose={() => setHl7ResponseDialogOpen(false)}
          resourceId={hl7ResponseData?.resourceId}
        />
        <Hl7ResendDialog
          open={hl7ResendDialogOpen}
          onClose={() => setHl7ResendDialogOpen(false)}
          onConfirm={handleResendHl7Msg}
          transactionData={selectedTransactionData}
        />
      </Box>
    </>
  );
}

interface Hl7ResendDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (useHttp: boolean) => void;
  transactionData: {
    patientId: string;
    episodeNo: string;
    messageType: string;
  } | null;
}

function Hl7ResendDialog({
  open,
  onClose,
  onConfirm,
  transactionData,
}: Hl7ResendDialogProps) {
  const [useHttp, setUseHttp] = useState(true);

  const handleSubmit = () => {
    onConfirm(useHttp);
    onClose();
  };

  if (!transactionData) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{"Resend HL7 Message"}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Typography>
            {"Are you sure you want to resend this HL7 message?"}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {"Patient ID"}: {transactionData.patientId}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {"Episode No"}: {transactionData.episodeNo}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {"Message Type"}: {transactionData.messageType}
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={useHttp}
                onChange={(e: any) => setUseHttp(e.target.checked)}
                color="primary"
              />
            }
            label="Send via HTTP"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          {"Cancel"}
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {"Resend"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}