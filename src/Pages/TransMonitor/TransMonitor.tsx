import { useCallback, useRef, useState } from "react";
import {
  useTransMonitorContext,
  cleanParams,
} from "./Context/TransMonitorContext";
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
    getPayersParams,
    getTransSummaryParams,
  } = useTransMonitorContext();

  const getSummaryRowId = (row: TransSummary) =>
    `${row.api_function}-${row.api_name}-${row.status}`;

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

  // Search filter and tracking
  const [filterValues, setFilterValues] = useState<Filters | null>(null);
  const filterValuesRef = useRef<Filters | null>(null);
  filterValuesRef.current = filterValues;

  const [searchCount, setSearchCount] = useState(0);

  // Table pagination
  const [payersTablePage, setPayersTablePage] = useState(1);
  const [transSummaryTablePage, setTransSummaryTablePage] = useState(1);
  const [transDetailsTablePage, setTransDetailsTablePage] = useState(1);

  // Selections
  const selectedPayerId = transMonitorContextData.selectionObj.payerId || null;
  const setSelectedPayerId = updateSelectedPayerFn;

  const [selectedTransSummary, setSelectedTransSummary] =
    useState<TransSummary | null>(null);
  const selectedTransSummaryId =
    transMonitorContextData.selectionObj.transSummaryId || null;
  const setSelectedTransSummaryId = updateSelectedTransSummaryFn;

  const [selectedTransDetails, setSelectedTransDetails] =
    useState<TransDetails | null>(null);
  const selectedTransDetailsId =
    transMonitorContextData.selectionObj.transDetailsId || null;
  const setSelectedTransDetailsId = updateSelectedTransDetailsFn;

  const [selectedTab, setSelectedTab] = useState("errors");

  const setSelectedTransErrorId = updateSelectedTransErrorFn;
  const [, setSelectedTransResponseId] = useState<string | number | null>(null);
  const [selectedPollDetailsId, setSelectedPollDetailsId] = useState<
    string | number | null
  >(null);

  const [description, setDescription] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Refs for triggering refetches on tables
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const refetchRefPayer = useRef<(() => void) | null>(null);
  const refetchRefSummary = useRef<(() => void) | null>(null);
  const refetchRefDetails = useRef<(() => void) | null>(null);
  const refetchRefErrors = useRef<(() => void) | null>(null);
  const refetchRefResponses = useRef<(() => void) | null>(null);
  const refetchRefPollDetails = useRef<(() => void) | null>(null);

  const [adminMenuAnchorEl, setAdminMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const adminMenuOpen = Boolean(adminMenuAnchorEl);

  const handleAdminMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAdminMenuAnchorEl(event.currentTarget);
  };

  const handleAdminMenuClose = () => {
    setAdminMenuAnchorEl(null);
  };

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  // ==================== SEQUENTIAL FLOW HANDLERS ====================

  /**
   * 1. Search starts (or filter values change):
   * Reset all downstream states and selections.
   * Only Payer Table will fetch first.
   */
  const handleFilterSubmit = (newFilters: Filters) => {
    filterValuesRef.current = newFilters;
    setSelectedPayerId(null);
    setSelectedTransSummary(null);
    setSelectedTransSummaryId(null);
    setSelectedTransDetails(null);
    setSelectedTransDetailsId(null);
    setSelectedTransErrorId(null);
    setSelectedTransResponseId(null);
    setSelectedPollDetailsId(null);

    setPayersTablePage(1);
    setTransSummaryTablePage(1);
    setTransDetailsTablePage(1);

    setFilterValues(newFilters);
    setSearchCount((prev) => prev + 1);
  };

  /**
   * 2. Payer row selected:
   * Once payer is selected, summary table can fetch for this payer.
   * Details and tabs remain reset until summary arrives.
   */
  const handlePayerSelected = (row: Payers | null) => {
    const newPayerId = row?.payer_id ?? null;
    setSelectedPayerId(newPayerId);

    setSelectedTransSummary(null);
    setSelectedTransSummaryId(null);
    setSelectedTransDetails(null);
    setSelectedTransDetailsId(null);
    setSelectedTransErrorId(null);
    setSelectedTransResponseId(null);
    setSelectedPollDetailsId(null);

    setTransSummaryTablePage(1);
    setTransDetailsTablePage(1);
  };

  const handlePayersPageChange = (page: number) => {
    setPayersTablePage(page);
    setSelectedPayerId(null);
    setSelectedTransSummary(null);
    setSelectedTransSummaryId(null);
    setSelectedTransDetails(null);
    setSelectedTransDetailsId(null);
    setSelectedTransErrorId(null);
    setSelectedTransResponseId(null);
    setSelectedPollDetailsId(null);

    setTransSummaryTablePage(1);
    setTransDetailsTablePage(1);
  };

  /**
   * 3. Summary row selected:
   * Once summary is selected, details table can fetch for this summary.
   * Tabs remain reset until details arrive.
   */
  const handleTransSummarySelected = (row: TransSummary | null) => {
    setSelectedTransSummary(row);
    setSelectedTransSummaryId(row ? getSummaryRowId(row) : null);

    setSelectedTransDetails(null);
    setSelectedTransDetailsId(null);
    setSelectedTransErrorId(null);
    setSelectedTransResponseId(null);
    setSelectedPollDetailsId(null);

    setTransDetailsTablePage(1);
  };

  const handleTransSummaryPageChange = (page: number) => {
    setTransSummaryTablePage(page);
    setSelectedTransSummary(null);
    setSelectedTransSummaryId(null);
    setSelectedTransDetails(null);
    setSelectedTransDetailsId(null);
    setSelectedTransErrorId(null);
    setSelectedTransResponseId(null);
    setSelectedPollDetailsId(null);

    setTransDetailsTablePage(1);
  };

  /**
   * 4. Detail row selected:
   * Once transaction detail is selected, bottom tabs can fetch.
   */
  const handleTransDetailsSelected = (row: TransDetails | null) => {
    setSelectedTransDetails(row);
    setSelectedTransDetailsId(row?.api_trans_id ?? null);
    setSelectedTransErrorId(null);
    setSelectedTransResponseId(null);
    setSelectedPollDetailsId(null);
  };

  const handleTransDetailsPageChange = (page: number) => {
    setTransDetailsTablePage(page);
    setSelectedTransDetails(null);
    setSelectedTransDetailsId(null);
    setSelectedTransErrorId(null);
    setSelectedTransResponseId(null);
    setSelectedPollDetailsId(null);
  };

  // Readiness conditions enforcing sequential flow:
  // Step 1: Payers fetch immediately when search starts
  const payersReady = Boolean(filterValues);
  const payersUrl = payersReady ? "/transMonitor/payers" : "";

  // Step 2: Summary fetches ONLY after Payer is resolved (if payers grouping is enabled)
  const summaryReady =
    Boolean(filterValues) && (!filterValues.payers || selectedPayerId != null);
  const summaryUrl = summaryReady ? "/transMonitor/trans_summaries" : "";

  // Step 3: Details fetch ONLY after Summary is resolved (if status grouping is enabled) AND Payer is resolved
  const detailsReady =
    summaryReady && (!filterValues?.status || selectedTransSummary != null);
  const detailsUrl = detailsReady ? "/transMonitor/trans_details" : "";

  // Step 4: Tabs fetch ONLY after Transaction Detail is resolved
  const tabsReady = Boolean(selectedTransDetailsId);
  const errorsUrl = tabsReady ? "/transMonitor/trans_errors" : "";
  const responsesUrl = tabsReady ? "/transMonitor/trans_responses" : "";
  const pollDetailsUrl = tabsReady ? "/transMonitor/poll_details" : "";

  // Intercepting fetchers to automatically chain selection upon data arrival
  const payerFetcher = useCallback(
    async (args: any) => {
      const res = await fetcher(args);
      const rows: Payers[] = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];
      if (filterValuesRef.current?.payers && rows.length > 0) {
        setSelectedPayerId(rows[0].payer_id);
      } else if (filterValuesRef.current?.payers && rows.length === 0) {
        setSelectedPayerId(null);
      }
      return res;
    },
    [setSelectedPayerId],
  );

  const summaryFetcher = useCallback(
    async (args: any) => {
      const res = await fetcher(args);
      const rows: TransSummary[] = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];
      if (filterValuesRef.current?.status && rows.length > 0) {
        setSelectedTransSummary(rows[0]);
        setSelectedTransSummaryId(getSummaryRowId(rows[0]));
      } else if (filterValuesRef.current?.status && rows.length === 0) {
        setSelectedTransSummary(null);
        setSelectedTransSummaryId(null);
      }
      return res;
    },
    [setSelectedTransSummary, setSelectedTransSummaryId],
  );

  const detailsFetcher = useCallback(
    async (args: any) => {
      const res = await fetcher(args);
      const rows: TransDetails[] = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];
      if (rows.length > 0) {
        setSelectedTransDetails(rows[0]);
        setSelectedTransDetailsId(rows[0].api_trans_id);
      } else {
        setSelectedTransDetails(null);
        setSelectedTransDetailsId(null);
      }
      return res;
    },
    [setSelectedTransDetails, setSelectedTransDetailsId],
  );

  const errorsFetcher = useCallback(
    async (args: any) => {
      const res = await fetcher(args);
      const rows: TransError[] = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];
      if (rows.length > 0) {
        setSelectedTransErrorId(rows[0].message_id);
      } else {
        setSelectedTransErrorId(null);
      }
      return res;
    },
    [setSelectedTransErrorId],
  );

  const responsesFetcher = useCallback(async (args: any) => {
    const res = await fetcher(args);
    const rows: TransResponse[] = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res)
        ? res
        : [];
    if (rows.length > 0) {
      setSelectedTransResponseId(rows[0].response_seq);
    } else {
      setSelectedTransResponseId(null);
    }
    return res;
  }, []);

  const pollDetailsFetcher = useCallback(async (args: any) => {
    const res = await fetcher(args);
    const rows: PollDetails[] = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res)
        ? res
        : [];
    if (rows.length > 0) {
      setSelectedPollDetailsId(rows[0].response_id);
    } else {
      setSelectedPollDetailsId(null);
    }
    return res;
  }, []);

  const getTransDetailsParams = (
    selectedPayerId: any,
    selectedSummary: TransSummary | null,
    filters: Filters | null,
  ) => {
    const activeFilters = filters ?? ({} as Filters);
    const params: Record<string, any> = {
      ...activeFilters,
      payer_id: activeFilters.payers ? selectedPayerId : activeFilters.payer_id,
      api_name: activeFilters.status
        ? selectedSummary?.api_name
        : activeFilters.api_name,
      api_function: activeFilters.status
        ? selectedSummary?.api_function
        : activeFilters.api_function,
      status: activeFilters.status
        ? selectedSummary?.status
        : activeFilters.transaction_status,
    };
    delete params.payers;
    return cleanParams(params);
  };

  const handleSendAdvancedAuth = async (responseId: string | number) => {
    if (!responseId) return;

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
        setHl7ResponseData({
          description: res.data.data?.description || "",
          resourceId: res.data.data?.msgId,
        });

        setHl7ResponseDialogOpen(true);
        refetchRefDetails?.current?.();
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
    if (!selectedTransDetails) {
      console.error("No transaction selected");
      return;
    }

    if (
      selectedTransDetails.api_name?.toUpperCase() === "MEDICATION" ||
      selectedTransDetails.api_name?.toUpperCase() === "RADIOLOGY" ||
      selectedTransDetails.api_name?.toUpperCase() === "LAB" ||
      selectedTransDetails.api_name?.toUpperCase() === "ADT"
    ) {
      const url = selectedTransDetails.url;
      setSelectedTransactionData({
        ...(selectedTransDetails as any),
      });

      setResendUrl(url);
      setResendTitle(`Resend ${selectedTransDetails.api_name} Request`);
      setResendDialogOpen(true);
      return;
    }

    setSelectedTransactionData({
      patientId: selectedTransDetails.patient_id?.toString() || "",
      episodeNo: selectedTransDetails.episode_no?.toString() || "",
      messageType: selectedTransDetails.api_function || "",
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

      refetchRefErrors?.current?.();
      refetchRefPollDetails?.current?.();
      refetchRefResponses?.current?.();
      refetchRefDetails?.current?.();
      refetchRefSummary?.current?.();
    } catch (error: any) {
      console.error("❌ Upload failed:", error?.response?.data?.msg);
      toast.error("Error " + error?.response?.data?.msg, {
        autoClose: false,
      });
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

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
          setFilterValues={handleFilterSubmit}
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
          {/* Step 1: Payers Table */}
          <Box sx={{ width: "35%" }}>
            <Secure.GLCustomTable2
              key={`payers-${searchCount}`}
              permission={`${PERMISSIONS_PREFIXES.transMonitor}payers`}
              fetcher={payerFetcher}
              url={payersUrl}
              params={getPayersParams(filterValues)}
              getRowId={(row: any) => row.payer_id}
              limit={limit}
              page={payersTablePage}
              onPageChangeExternal={handlePayersPageChange}
              smallSize
              refetchRef={refetchRefPayer}
              onRowSelected={handlePayerSelected}
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

          {/* Step 2: Summary Table (waits for payer when grouping by payers) */}
          <Box sx={{ width: "65%" }}>
            <Secure.GLCustomTable2
              key={`summary-${filterValues?.payers ? (selectedPayerId ?? "none") : "all"}-${searchCount}`}
              permission={`${PERMISSIONS_PREFIXES.transMonitor}transSummary`}
              fetcher={summaryFetcher}
              url={summaryUrl}
              params={getTransSummaryParams(selectedPayerId, filterValues)}
              getRowId={(row: TransSummary) =>
                `${row.api_function}-${row.api_name}-${row.status}`
              }
              page={transSummaryTablePage}
              onPageChangeExternal={handleTransSummaryPageChange}
              refetchRef={refetchRefSummary}
              sx={{ maxHeight: "35vh" }}
              smallSize
              limit={limit}
              onRowSelected={handleTransSummarySelected}
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
            />
          </Box>
        </Box>

        {/* Step 3: Details Table (waits for summary and payer) */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Secure.GLCustomTable2
            key={`details-${filterValues?.payers ? (selectedPayerId ?? "none") : "all"}-${filterValues?.status && selectedTransSummary ? getSummaryRowId(selectedTransSummary) : "all"}-${searchCount}`}
            permission={`${PERMISSIONS_PREFIXES.transMonitor}transDetails`}
            fetcher={detailsFetcher}
            url={detailsUrl}
            params={getTransDetailsParams(
              selectedPayerId,
              selectedTransSummary,
              filterValues,
            )}
            smallSize
            getRowId={(row: any) => row.api_trans_id}
            limit={limit}
            page={transDetailsTablePage}
            onPageChangeExternal={handleTransDetailsPageChange}
            refetchRef={refetchRefDetails}
            onRowSelected={handleTransDetailsSelected}
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
              onClick={() => {
                if (!selectedTransDetailsId) return;

                normalAxios
                  .get(`/nphies/claim/cancel/${selectedTransDetailsId}`)
                  .then((res) => {
                    setDescription(res?.data?.data?.description);
                    setResourceId(res?.data?.data?.msgId);
                    setDialogOpen(true);
                  })
                  .catch((err) => {
                    setDialogOpen(true);
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
              onClick={() => {
                if (!selectedTransDetailsId) return;
                setIsLoading(true);
                normalAxios
                  .post(`/nphies/splitPollResponse`, {
                    api_trans_id: selectedTransDetailsId,
                  })
                  .then(async () => {
                    toast.success(`Success`);
                    refetchRefErrors?.current?.();
                    refetchRefPollDetails?.current?.();
                  })
                  .catch((err) => {
                    if (isAxiosError(err)) {
                      toast.error(
                        err?.response?.data.error || "something went wrong",
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
              onClick={() => {
                if (!selectedTransDetailsId) return;
                setIsLoading(true);
                normalAxios
                  .post(`/nphies/handlePollResponseFull`, {
                    api_trans_id: selectedTransDetailsId,
                  })
                  .then(async () => {
                    toast.success(`Success`);
                    refetchRefErrors?.current?.();
                    refetchRefPollDetails?.current?.();
                  })
                  .catch((err) => {
                    if (isAxiosError(err)) {
                      toast.error(
                        err?.response?.data.error || "something went wrong",
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

        {/* Step 4: Tabs for Selected Transaction Detail */}
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
                key={`errors-${selectedTransDetailsId ?? "none"}`}
                permission={`${PERMISSIONS_PREFIXES.transMonitor}transErrorsTable`}
                fetcher={errorsFetcher}
                url={errorsUrl}
                params={{ trans_id: selectedTransDetailsId }}
                smallSize
                refetchRef={refetchRefErrors}
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
                  setSelectedTransErrorId(row?.message_id ?? null)
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
                key={`responses-${selectedTransDetailsId ?? "none"}`}
                permission={`${PERMISSIONS_PREFIXES.transMonitor}transResponses`}
                fetcher={responsesFetcher}
                url={responsesUrl}
                params={{ trans_id: selectedTransDetailsId }}
                smallSize
                refetchRef={refetchRefResponses}
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
                            />

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

                                    refetchRefErrors?.current?.();
                                    refetchRefPollDetails?.current?.();
                                  })
                                  .catch((err) => {
                                    console.log(err);
                                    if (isAxiosError(err)) {
                                      toast.error(
                                        err?.response?.data.error ||
                                          "something went wrong",
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
                key={`pollDetails-${selectedTransDetailsId ?? "none"}`}
                permission={`${PERMISSIONS_PREFIXES.transMonitor}pollDetails`}
                fetcher={pollDetailsFetcher}
                url={pollDetailsUrl}
                params={{ trans_id: selectedTransDetailsId }}
                smallSize
                refetchRef={refetchRefPollDetails}
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

                                    refetchRefErrors?.current?.();
                                    refetchRefPollDetails?.current?.();
                                  })
                                  .catch((err) => {
                                    console.log(err);
                                    if (isAxiosError(err)) {
                                      toast.error(
                                        err?.response?.data.error ||
                                          "something went wrong",
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
