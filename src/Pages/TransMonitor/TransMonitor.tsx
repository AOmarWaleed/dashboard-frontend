import { useEffect, useRef, useState } from "react";
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
    getPayersFn,
    getTransSummaryFn,
    getTransDetailsFn,
    getTransErrorsFn,
    getTransResponsesFn,
    getPollDetailsFn,
    updateSelectedPayerFn,
    updateSelectedTransSummaryFn,
    updateSelectedTransDetailsFn,
    updateSelectedTransErrorFn,
    getPayersParams,
    getTransSummaryParams,
  } = useTransMonitorContext();

  const isCanceled = (error: any) => error?.code === "ERR_CANCELED";

  // const [
  //   transDetailsColumnVisibilityModel,
  //   setTransDetailsColumnVisibilityModel,
  // ] = useState(() => {
  //   // Try to get saved visibility from localStorage
  //   const savedVisibility = localStorage.getItem(
  //     "transMonitor_columnVisibility",
  //   );
  //   if (savedVisibility) {
  //     try {
  //       return JSON.parse(savedVisibility);
  //     } catch (e) {
  //       console.error("Failed to parse saved column visibility:", e);
  //     }
  //   }
  //   // Return default visibility if nothing saved
  //   return {
  //     bundle_id: false,
  //     response_time_ms: false,
  //     trans_date : false,
  //     elapsed_time_ms: false,
  //     preprocess_time_ms: false,
  //     local_api_time_ms: false,
  //   };
  // });

  // useEffect(() => {
  //   localStorage.setItem(
  //     "transMonitor_columnVisibility",
  //     JSON.stringify(transDetailsColumnVisibilityModel),
  //   );
  // }, [transDetailsColumnVisibilityModel]);

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

  const [filterValues, setFilterValues] = useState<Filters | null>(null);
  const [payersTablePage, setPayersTablePage] = useState(1);
  const [transSummaryTablePage, setTransSummaryTablePage] = useState(1);
  const [transDetailsTablePage, setTransDetailsTablePage] = useState(1);

  const [payers, setPayers] = useState<Payers[]>([]);
  const [payersPage] = useState(1);

  const selectedPayerId = transMonitorContextData.selectionObj.payerId || null;
  const setSelectedPayerId = updateSelectedPayerFn;

  const [transSummaries, setTransSummaries] = useState<TransSummary[]>([]);
  const [transSummaryPage, setTransSummaryPage] = useState(1);

  const [selectedTransSummary, setSelectedTransSummary] =
    useState<TransSummary | null>(null);
  const selectedTransSummaryId =
    transMonitorContextData.selectionObj.transSummaryId || null;
  const setSelectedTransSummaryId = updateSelectedTransSummaryFn;

  const [transDetails, setTransDetails] = useState<TransDetails[]>([]);
  const [transDetailsPage, setTransDetailsPage] = useState(1);

  const selectedTransDetailsId =
    transMonitorContextData.selectionObj.transDetailsId || null;
  const setSelectedTransDetailsId = updateSelectedTransDetailsFn;

  const [selectedTab, setSelectedTab] = useState("errors");

  const [transErrors, setTransErrors] = useState<TransError[]>([]);
  const [transErrorsPage] = useState(1);

  const setSelectedTransErrorId = updateSelectedTransErrorFn;

  const [transResponses, setTransResponses] = useState<TransResponse[]>([]);
  const [transResponsesPage] = useState(1);
  const [, setSelectedTransResponseId] = useState<string | number | null>(null);

  const [pollDetails, setPollDetails] = useState<PollDetails[]>([]);
  const [pollDetailsPage] = useState(1);
  const [selectedPollDetailsId, setSelectedPollDetailsId] = useState<
    string | number | null
  >(null);

  const [description, setDescription] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [adminMenuAnchorEl, setAdminMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const adminMenuOpen = Boolean(adminMenuAnchorEl);

  const handleAdminMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAdminMenuAnchorEl(event.currentTarget);
  };

  const handleAdminMenuClose = () => {
    setAdminMenuAnchorEl(null);
  };

  const handleTransSummaryPageChange = (page: number) => {
    setTransSummaryTablePage(page);
    setSelectedTransSummary(null);
    setSelectedTransSummaryId(null);
    setTransDetailsTablePage(1);
  };

  const resetPages = () => {
    setPayers([]);
    setPayersTablePage(1);

    setTransSummaries([]);
    setTransSummaryPage(1);
    setTransSummaryTablePage(1);

    setTransDetails([]);
    setTransDetailsTablePage(1);

    setTransErrors([]);

    setTransResponses([]);

    setPollDetails([]);

    setSelectedPayerId(null);
    setSelectedTransDetailsId(null);
    setSelectedTransSummaryId(null);
    setSelectedTransSummary(null);
    setSelectedTransErrorId(null);
    setSelectedTransResponseId(null);
    setSelectedPollDetailsId(null);
  };

  // Dependent tables reset when upstream selection changes (standard master-detail pattern)
  useEffect(() => {
    setTransSummaryTablePage(1);
    setTransDetailsTablePage(1);
  }, [selectedPayerId]);

  useEffect(() => {
    setTransDetailsTablePage(1);
  }, [selectedTransSummaryId]);

  const getPayers = (
    page: number,
    limit: number,
    filters: Filters,
    next?: () => void,
  ) => {
    getPayersFn({ page, limit, filters })
      .then((r) => {
        setPayers(r.data);
      })
      .catch((error) => {
        if (isCanceled(error)) return;
        setPayers([]);
      })
      .finally(() => {
        if (next) next();
      });
  };

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

  const getTransSummaries = (
    page: number,
    limit: number,
    selectedPayerId: any,
    filters: Filters,
  ) => {
    getTransSummaryFn({
      page,
      limit,
      payer_id: selectedPayerId,
      filters,
    })
      .then((r) => {
        setTransSummaries(r.data);
      })
      .catch((error) => {
        if (isCanceled(error)) return;
        setTransSummaries([]);
      });
  };

  const getTransDetailsParams = (
    selectedPayerId: any,
    selectedSummary: TransSummary | null,
    filters: Filters | null,
  ) => {
    const activeFilters = filters ?? ({} as Filters);
    const params = {
      ...activeFilters,
      payer_id: activeFilters.payers ? selectedPayerId : activeFilters.payer_id,
      api_name: activeFilters.status
        ? selectedSummary?.api_name
        : activeFilters.api_name,
      api_function: activeFilters.status
        ? selectedSummary?.api_function
        : activeFilters.api_function,
      status: activeFilters.status ? selectedSummary?.status : "",
    };
    delete params.payers;
    return params;
  };

  const getTransDetails = (
    page: number,
    limit: number,
    selectedPayerId: any,
    selectedTransSummaryId: any,
    filters: Filters,
  ) => {
    const selectedSummryRow = transSummaries?.find(
      (row: TransSummary) =>
        `${row.api_function}-${row.api_name}-${row.status}` ===
        selectedTransSummaryId,
    );

    const { api_name, api_function, status } = selectedSummryRow || {};

    getTransDetailsFn({
      page,
      limit,
      api_name,
      api_function,
      status,
      payer_id: selectedPayerId,
      filters,
    })
      .then((r) => {
        setTransDetails(r.data);
      })
      .catch((error) => {
        if (isCanceled(error)) return;
        setTransDetails([]);
      });
  };

  const getTransErrors = (
    trans_id: string | number,
    page: number,
    limit: number,
  ) => {
    getTransErrorsFn({ trans_id, page, limit })
      .then((r) => {
        console.log(r);

        setTransErrors(r.data);
      })
      .catch((error) => {
        if (isCanceled(error)) return;
        setTransErrors([]);

        console.error("Failed to fetch errors:", error);
      });
  };

  const getTransResponses = (
    trans_id: string | number,
    page: number,
    limit: number,
  ) => {
    getTransResponsesFn({ trans_id, page, limit })
      .then((r) => {
        setTransResponses(r.data);
      })
      .catch((error) => {
        if (isCanceled(error)) return;
        setTransResponses([]);

        console.error("Failed to fetch responses:", error);
      });
  };

  const getPollDetails = (
    trans_id: string | number,
    page: number,
    limit: number,
  ) => {
    getPollDetailsFn({ trans_id, page, limit })
      .then((r) => {
        setPollDetails(r.data);
      })
      .catch((error) => {
        if (isCanceled(error)) return;
        setPollDetails([]);

        console.error("Failed to fetch poll details:", error);
      });
  };

  const handleResendHl7Msg = (useHttp: boolean) => {
    if (!selectedTransactionData) return;

    const { patientId, episodeNo, messageType } = selectedTransactionData;
    const httpFlag = useHttp ? 1 : 0;
    setIsLoading(true);
    // episodeNo, http, patientId, messageType
    // ! send specific msg for specific patient and episodeNo
    // app.get("/api/v1/hl7"

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

        if (filterValues) {
          getTransDetails(
            transDetailsPage,
            limit,
            selectedPayerId,
            selectedTransSummaryId,
            filterValues,
          );
        }
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

    const selectedTrans = transDetails.find(
      (trans) => trans.api_trans_id === selectedTransDetailsId,
    );

    if (!selectedTrans) {
      console.error("Selected transaction not found");
      return;
    }

    // if (
    //   selectedTrans.api_name == "MEDICATION" ||
    //   selectedTrans.api_name == "RADIOLOGY" ||
    //   selectedTrans.api_name == "LAB"
    // ) {
    //   const url = selectedTrans.url;

    //   try {
    //     setLoading(true);
    //     const { data } = await normalAxios.get(url);
    //     const responseData = data?.data;
    //     if (!responseData) {
    //       toast.error("No data received from API");
    //       throw new Error("No data received from API");
    //     }

    //     setDescription(responseData.description);
    //     setResourceId(responseData.msgId);
    //     setDialogOpen(true);
    //   } catch (error) {
    //     if (isAxiosError(error)) {
    //       console.error(
    //         "Error fetching medication data:",
    //         error.response?.data?.msg,
    //       );
    //       const description =
    //         error.response?.data?.description ||
    //         "Error fetching medication data";
    //       const resourceId = error.response?.data?.msgId || "Error";
    //       setDescription(description);
    //       setResourceId(resourceId);
    //       setDialogOpen(true);
    //     } else {
    //       console.error("Error fetching medication data:", error);
    //       toast.error("Error fetching medication data");
    //     }
    //   } finally {
    //     setLoading(false);
    //   }

    //   return;
    // }

    if (
      selectedTrans.api_name?.toUpperCase() == "MEDICATION" ||
      selectedTrans.api_name?.toUpperCase() == "RADIOLOGY" ||
      selectedTrans.api_name?.toUpperCase() == "LAB" ||
      selectedTrans.api_name?.toUpperCase() == "ADT"
    ) {
      const url = selectedTrans.url;
      setSelectedTransactionData({
        ...(selectedTrans as any),
      });

      setResendUrl(url);
      setResendTitle(`Resend ${selectedTrans.api_name} Request`);
      setResendDialogOpen(true);
      return;
    }

    setSelectedTransactionData({
      patientId: selectedTrans.patient_id?.toString() || "",
      episodeNo: selectedTrans.episode_no?.toString() || "",
      messageType: selectedTrans.api_function || "",
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

  useEffect(() => {
    return () => {
      resetPages();
    };
  }, []);

  useEffect(() => {
    if (filterValues) {
      resetPages();

      if (filterValues.payers && !filterValues.status) {
        getPayers(payersPage, limit, filterValues);
      } else if (filterValues.status && filterValues.payers) {
        getPayers(payersPage, limit, filterValues);
        getTransSummaries(
          transSummaryPage,
          limit,
          selectedPayerId,
          filterValues,
        );
      } else if (filterValues.status && !filterValues.payers) {
        getPayers(payersPage, limit, filterValues);
        getTransSummaries(
          transSummaryPage,
          limit,
          selectedPayerId,
          filterValues,
        );
      } else {
        getPayers(payersPage, limit, filterValues);
        getTransSummaries(
          transSummaryPage,
          limit,
          selectedPayerId,
          filterValues,
        );
        getTransDetails(
          transDetailsPage,
          limit,
          selectedPayerId,
          selectedTransSummaryId,
          filterValues,
        );
      }
    }
  }, [filterValues]);

  useEffect(() => {
    if (payers && payers.length > 0 && filterValues?.payers)
      setSelectedPayerId(payers[0].payer_id);
  }, [payers]);

  useEffect(() => {
    setSelectedTransDetailsId(null);
  }, [selectedTransSummaryId, transDetailsPage]);

  useEffect(() => {
    if (transDetails.length > 0 && !selectedTransDetailsId)
      setSelectedTransDetailsId(transDetails[0].api_trans_id);

    if (transDetails.length == 0) {
      console.log("set transDetails");

      setSelectedTransDetailsId(null);
    }
  }, [transDetails]);

  useEffect(() => {
    if (transErrors.length > 0)
      setSelectedTransErrorId(transErrors[0].message_id);
    if (transErrors.length === 0) setSelectedTransErrorId(null);
  }, [transErrors]);

  useEffect(() => {
    if (transResponses.length > 0)
      setSelectedTransResponseId(transResponses[0].response_seq);
    if (transResponses.length === 0) setSelectedTransResponseId(null);
  }, [transResponses]);

  useEffect(() => {
    if (pollDetails.length > 0)
      setSelectedPollDetailsId(pollDetails[0].response_id);
    if (pollDetails.length === 0) setSelectedPollDetailsId(null);
  }, [pollDetails]);

  useEffect(() => {
    if (filterValues) {
      getPayers(payersPage, limit, filterValues);
    }
  }, [payersPage]);

  useEffect(() => {
    if (!selectedPayerId || !filterValues?.payers) return;

    setTransSummaryPage(1);
    setTransDetailsPage(1);

    getTransSummaries(transSummaryPage, limit, selectedPayerId, filterValues);
  }, [selectedPayerId, payers]);

  useEffect(() => {
    if (!filterValues) return;
    getTransSummaries(transSummaryPage, limit, selectedPayerId, filterValues);
  }, [transSummaryPage]);

  useEffect(() => {
    if (!filterValues) return;

    if (
      filterValues.status &&
      filterValues.payers &&
      selectedPayerId &&
      selectedTransSummaryId
    ) {
      getTransDetails(
        transDetailsPage,
        limit,
        selectedPayerId,
        selectedTransSummaryId,
        filterValues,
      );
    } else if (
      filterValues.status &&
      selectedTransSummaryId &&
      !filterValues.payers
    ) {
      getTransDetails(
        transDetailsPage,
        limit,
        undefined,
        selectedTransSummaryId,
        filterValues,
      );
    } else if (!filterValues.payers && !filterValues.status) {
      getTransDetails(
        transDetailsPage,
        limit,
        undefined,
        undefined,
        filterValues,
      );
    }
  }, [selectedTransSummaryId, transDetailsPage, selectedPayerId]);

  useEffect(() => {
    getTransErrors(selectedTransDetailsId || -1, transErrorsPage, limit);
  }, [transErrorsPage]);

  useEffect(() => {
    getTransResponses(selectedTransDetailsId || -1, transResponsesPage, limit);
  }, [transResponsesPage]);

  useEffect(() => {
    getPollDetails(selectedTransDetailsId || -1, pollDetailsPage, limit);
  }, [pollDetailsPage]);

  // useEffect(() => {
  //   switch (selectedTab) {
  //     case "errors":
  //       getTransErrors(selectedTransDetailsId || -1, transErrorsPage, limit);
  //       break;
  //     case "response":
  //       getTransResponses(
  //         selectedTransDetailsId || -1,
  //         transResponsesPage,
  //         limit,
  //       );
  //       break;
  //     case "pollDetails":
  //       getPollDetails(selectedTransDetailsId || -1, pollDetailsPage, limit);
  //       break;
  //     default:
  //       break;
  //   }
  // }, [selectedTransDetailsId, selectedTab]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const refetchRefPayer = useRef<() => void | null>(null);
  const refetchRefSummary = useRef<() => void | null>(null);
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

      await getTransErrors(
        selectedTransDetailsId || -1,
        transErrorsPage,
        limit,
      );

      await getPollDetails(
        selectedTransDetailsId || -1,
        pollDetailsPage,
        limit,
      );

      await getTransSummaries(
        transSummaryPage,
        limit,
        selectedPayerId,
        filterValues!,
      );

      await getTransDetails(
        transDetailsPage,
        limit,
        selectedPayerId,
        selectedTransSummaryId,
        filterValues!,
      );
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
        {/* remove title --- rebuild */}
        {/* <Typography variant="h5">TransMonitors</Typography> */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <FilterForm
          setFilterValues={setFilterValues}
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
              params={getPayersParams(filterValues)}
              getRowId={(row: any) => row.payer_id}
              loading={transMonitorContextData.isLoading.getPayersReq}
              limit={limit}
              page={payersTablePage}
              onPageChangeExternal={setPayersTablePage}
              smallSize
              refetchRef={refetchRefPayer}
              // onRowSelectionModelChange={(
              //   selectionModel: GridRowSelectionModel,
              // ) => {
              //   const selected = selectionModel[0];
              //   if (selected != null) setSelectedPayerId(selected as any);
              // }}
              // onCellKeyDown={handleGridKeyNav(
              //   payers,
              //   (row) => row.payer_id,
              //   payersApiRef,
              //   setSelectedPayerId,
              // )}
              onRowSelected={(row: Payers | null) =>
                setSelectedPayerId(row?.payer_id ?? null)
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
            {/* <DataGrid
              apiRef={payersApiRef}
              rows={payers}
              columns={
                [
                  { field: "payer_id", headerName: "Payer Id" },
                  { field: "payer_name", headerName: "Payer Name", flex: 2 },
                  {
                    field: "cnt",
                    headerName: "CNT",
                    renderCell: (p) => (
                      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        {p.value}
                      </Box>
                    ),
                  },
                  {
                    field: "response_ms",
                    headerName: "Response MS",
                    renderCell: (p) => (
                      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        {p.value}
                      </Box>
                    ),
                  },
                ] as GridColDef[]
              }
              getRowId={(row: any) => row.payer_id}
              rowCount={payersTotalRows}
              loading={transMonitorContextData.isLoading.getPayersReq}
              paginationMode="server"
              paginationModel={{ page: payersCurrentPage - 1, pageSize: limit }}
              onPaginationModelChange={(model) => setPayersPage(model.page + 1)}
              pageSizeOptions={[limit]}
              slots={{
                pagination: () => <CustomPagination rightSide={false} />,
              }}
              rowSelection={Boolean(filterValues?.payers)}
              rowSelectionModel={
                selectedPayerId != null ? [selectedPayerId] : []
              }
              onRowSelectionModelChange={(
                selectionModel: GridRowSelectionModel,
              ) => {
                const selected = selectionModel[0];
                if (selected != null) setSelectedPayerId(selected as any);
              }}
              onCellKeyDown={handleGridKeyNav(
                payers,
                (row) => row.payer_id,
                payersApiRef,
                setSelectedPayerId,
              )}
              sx={{ maxHeight: "35vh" }}
              hideFooterSelectedRowCount
              className="exact-25px-rows"
            /> */}
          </Box>
          <Box sx={{ width: "65%" }}>
            <Secure.GLCustomTable2
              permission={`${PERMISSIONS_PREFIXES.transMonitor}transSummary`}
              fetcher={fetcher}
              url="/transMonitor/trans_summaries"
              params={getTransSummaryParams(selectedPayerId, filterValues)}
              getRowId={(row: TransSummary) =>
                `${row.api_function}-${row.api_name}-${row.status}`
              }
              loading={transMonitorContextData.isLoading.getTransSummriesReq}
              page={transSummaryTablePage}
              onPageChangeExternal={handleTransSummaryPageChange}
              refetchRef={refetchRefSummary}
              // onRowSelectionModelChange={(
              //   selectionModel: GridRowSelectionModel,
              // ) => {
              //   const selected = selectionModel[0];
              //   if (selected != null)
              //     setSelectedTransSummaryId(selected as any);
              // }}
              // onCellKeyDown={handleGridKeyNav(
              //   transSummaries,
              //   getSummaryRowId,
              //   transSummaryApiRef,
              //   setSelectedTransSummaryId,
              // )}
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
                setSelectedTransSummary(row);
                setSelectedTransSummaryId(row ? getSummaryRowId(row) : null);
              }}
            />
            {/* <DataGrid
              apiRef={transSummaryApiRef}
              rows={transSummaries}
              columns={
                [
                  { field: "api_name", headerName: "API Name" },
                  {
                    field: "api_function",
                    headerName: "API Function",
                    flex: 2,
                  },
                  { field: "status", headerName: "Status" },
                  {
                    field: "trans_count",
                    headerName: "Trans Count",
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
                    flex: 2,
                  },
                  {
                    field: "latest_trans",
                    headerName: "Latest Trans",
                    flex: 2,
                  },
                  {
                    field: "response_ms",
                    renderCell: (p) => (
                      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        {p.value}
                      </Box>
                    ),
                    headerName: "Response MS",
                  },
                ] as GridColDef[]
              }
              getRowId={(row: TransSummary) =>
                `${row.api_function}-${row.api_name}-${row.status}`
              }
              rowCount={transSummaryTotalRows}
              loading={transMonitorContextData.isLoading.getTransSummriesReq}
              paginationMode="server"
              paginationModel={{
                page: transSummaryCurrentPage - 1,
                pageSize: limit,
              }}
              onPaginationModelChange={(model) =>
                setTransSummaryPage(model.page + 1)
              }
              pageSizeOptions={[limit]}
              slots={{
                pagination: () => <CustomPagination rightSide={false} />,
              }}
              rowSelection={Boolean(filterValues?.status)}
              rowSelectionModel={
                selectedTransSummaryId != null ? [selectedTransSummaryId] : []
              }
              onRowSelectionModelChange={(
                selectionModel: GridRowSelectionModel,
              ) => {
                const selected = selectionModel[0];
                if (selected != null)
                  setSelectedTransSummaryId(selected as any);
              }}
              onCellKeyDown={handleGridKeyNav(
                transSummaries,
                getSummaryRowId,
                transSummaryApiRef,
                setSelectedTransSummaryId,
              )}
              sx={{ maxHeight: "35vh" }}
              hideFooterSelectedRowCount
            /> */}
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {/* {selectedTransDetailsId} */}
          <Secure.GLCustomTable2
            permission={`${PERMISSIONS_PREFIXES.transMonitor}transDetails`}
            fetcher={fetcher}
            url="/transMonitor/trans_details"
            params={getTransDetailsParams(
              selectedPayerId,
              selectedTransSummary,
              filterValues,
            )}
            smallSize
            getRowId={(row: any) => row.api_trans_id}
            loading={transMonitorContextData.isLoading.getTransDetailsReq}
            limit={limit}
            page={transDetailsTablePage}
            onPageChangeExternal={setTransDetailsTablePage}
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
                        {/* <span>{params.row.api_function}</span> */}
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
                //              response_time_ms,
                // elapsed_time_ms,
                // preprocess_time_ms,
                // local_api_time_ms,
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
            onRowSelected={(row: TransDetails | null) =>
              setSelectedTransDetailsId(row?.api_trans_id ?? null)
            }
          />
          {/* <DataGrid
            apiRef={transDetailsApiRef}
            rows={transDetails}
            columns={
              [
                {
                  field: "api_trans_id",
                  display: "flex",
                  headerName: "API Trans ID",
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
                        {/* <span>{params.row.api_function}</span> 
                        <span>{params.row.api_trans_id}</span>
                        <DownloadTransData
                          permission={`${PERMISSIONS_PREFIXES.transMonitor}downloadTransData`}
                          fallBackText="Download"
                          transId={params.row.api_trans_id}
                          apiClient={normalAxios}
                        />
                      </Box>
                    );
                  },
                },
                { field: "api_name", display: "flex", headerName: "API Name" },
                {
                  field: "api_function",
                  display: "flex",
                  headerName: "API Function",
                  flex: 1,
                },
                {
                  field: "creation_date",
                  display: "flex",
                  headerName: "Creation Date",
                  width: 130,
                },
                {
                  field: "bundle_id",

                  display: "flex",
                  headerName: "Bundle Id",
                  flex: 1,
                },
                //              response_time_ms,
                // elapsed_time_ms,
                // preprocess_time_ms,
                // local_api_time_ms,
                {
                  field: "response_time_ms",
                  headerName: "Response ms",
                  display: "flex",
                  type: "number",
                },

                {
                  field: "elapsed_time_ms",
                  headerName: "Elapsed ms",
                  display: "flex",
                  type: "number",
                },
                {
                  field: "preprocess_time_ms",
                  headerName: "Preprocess ms",
                  display: "flex",
                  type: "number",
                },
                {
                  field: "local_api_time_ms",
                  headerName: "Local API ms",
                  type: "number",
                  display: "flex",
                },

                { field: "status", headerName: "Status", display: "flex" },
                { field: "outcome", headerName: "Outcome", display: "flex" },
                {
                  field: "adjudication_outcome",
                  headerName: "Adjudication",
                  display: "flex",
                },
                { field: "patient_id", headerName: "Patient Id" },
                { field: "episode_no", headerName: "Episode" },
                { field: "transaction_id", headerName: "Transaction Id" },

                { field: "payer_id", headerName: "Payer" },
                {
                  field: "bundle_count",

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
                  headerName: "Cancel Trans ID",
                  flex: 1,
                },
                {
                  field: "error_message",
                  headerName: "Error Message",
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
              ] as GridColDef[]
            }
            getRowId={(row: any) => row.api_trans_id}
            rowCount={transDetailsTotalRows}
            loading={transMonitorContextData.isLoading.getTransDetailsReq}
            paginationMode="server"
            paginationModel={{
              page: transDetailsCurrentPage - 1,
              pageSize: limit,
            }}
            onPaginationModelChange={(model) =>
              setTransDetailsPage(model.page + 1)
            }
            pageSizeOptions={[limit]}
            slots={{ pagination: () => <CustomPagination rightSide={false} /> }}
            rowSelectionModel={
              selectedTransDetailsId != null ? [selectedTransDetailsId] : []
            }
            onRowSelectionModelChange={(
              selectionModel: GridRowSelectionModel,
            ) => {
              const selected = selectionModel[0];
              if (selected != null) {
                setSelectedTransDetailsId(selected as any);
              }
            }}
            onCellKeyDown={handleGridKeyNav(
              transDetails,
              (row) => row.api_trans_id,
              transDetailsApiRef,
              setSelectedTransDetailsId,
            )}
            columnVisibilityModel={transDetailsColumnVisibilityModel}
            onColumnVisibilityModelChange={(newModel) =>
              setTransDetailsColumnVisibilityModel(newModel)
            }
            sx={{ maxHeight: "35vh" }}
            hideFooterSelectedRowCount
            className="exact-25px-rows"
          /> */}

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
              jsutifyContent: "flex-start",
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
              onClick={() => {
                if (!selectedTransDetailsId) return;
                setIsLoading(true);
                normalAxios
                  .post(`/nphies/splitPollResponse`, {
                    api_trans_id: selectedTransDetailsId,
                  })
                  .then(async (res) => {
                    toast.success(`Success`);

                    await getTransErrors(
                      selectedTransDetailsId,
                      transErrorsPage,
                      limit,
                    );
                    await getPollDetails(
                      selectedTransDetailsId,
                      pollDetailsPage,
                      limit,
                    );

                    console.log(res.data);
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
              onClick={() => {
                if (!selectedTransDetailsId) return;
                setIsLoading(true);
                normalAxios
                  .post(`/nphies/handlePollResponseFull`, {
                    api_trans_id: selectedTransDetailsId,
                  })
                  .then(async () => {
                    toast.success(`Success`);
                    await getTransErrors(
                      selectedTransDetailsId,
                      transErrorsPage,
                      limit,
                    );
                    await getPollDetails(
                      selectedTransDetailsId,
                      pollDetailsPage,
                      limit,
                    );
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
                  console.log("hiii", selectedPollDetailsId);

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
                url={`/transMonitor/trans_errors`}
                params={{ trans_id: selectedTransDetailsId }}
                loading={transMonitorContextData.isLoading.getTransErrorsReq}
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
                permission={`${PERMISSIONS_PREFIXES.transMonitor}transResponses`}
                fetcher={fetcher}
                url={`/transMonitor/trans_responses`}
                params={{ trans_id: selectedTransDetailsId }}
                loading={transMonitorContextData.isLoading.getTransResponsesReq}
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
                                    console.log(res.data, "respinnnnnnse");
                                    toast.success(
                                      `Success ${
                                        res.data.req_id
                                          ? `(ServiceRequest ID ${res.data.req_id} )`
                                          : ""
                                      }`,
                                    );

                                    await getTransErrors(
                                      selectedTransDetailsId || "",
                                      transErrorsPage,
                                      limit,
                                    );

                                    await getPollDetails(
                                      selectedTransDetailsId || -1,
                                      pollDetailsPage,
                                      limit,
                                    );
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
                fetcher={fetcher}
                url={`/transMonitor/poll_details`}
                params={{ trans_id: selectedTransDetailsId }}
                loading={transMonitorContextData.isLoading.getPollDetailsReq}
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
                                    console.log(res.data, "respinnnnnnse");
                                    toast.success(
                                      `Success ${
                                        res.data.req_id
                                          ? `(ServiceRequest ID ${res.data.req_id} )`
                                          : ""
                                      }`,
                                    );

                                    await getTransErrors(
                                      selectedTransDetailsId || "",
                                      transErrorsPage,
                                      limit,
                                    );

                                    await getPollDetails(
                                      selectedTransDetailsId || -1,
                                      pollDetailsPage,
                                      limit,
                                    );
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

          {/* <TabContext value={selectedTab}> */}
          {/* <TabList
              onChange={(_, value) => setSelectedTab(value)}
              aria-label=""
            >
              <Tab label="Errors" value="errors" />
              <Tab label="Response" value="response" />
              <Tab label="Poll Details" value="pollDetails" />
            </TabList> */}

          {/* <TabPanel value="errors" sx={{ p: 1 }}> */}
          {/* <DataGrid
                apiRef={transErrorsApiRef}
                rows={transErrors}
                columns={
                  [
                    { field: "message_id", headerName: "Message Id" },
                    {
                      field: "api_trans_id",
                      headerName: "Trans Id",
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
                              apiClient={normalAxios}
                            />
                          </Box>
                        );
                      },
                    },
                    {
                      field: "nphies_message_id",
                      headerName: "Nphies Message ID",
                    },
                    {
                      field: "nphies_message",
                      headerName: "Nphies Message",
                      flex: 5,
                    },
                    {
                      field: "error_element",
                      headerName: "Error Element",
                      flex: 3,
                    },
                    { field: "element_value", headerName: "Element Value" },
                    { field: "item_no", headerName: "Item No" },
                    { field: "response_id", headerName: "ResponseId" },
                  ] as GridColDef[]
                }
                getRowId={(row: TransError) => row.message_id}
                rowCount={transErrorsTotalRows}
                loading={transMonitorContextData.isLoading.getTransErrorsReq}
                paginationMode="server"
                paginationModel={{
                  page: transErrorsCurrentPage - 1,
                  pageSize: customLimit,
                }}
                onPaginationModelChange={(model) =>
                  setTransErrorsPage(model.page + 1)
                }
                pageSizeOptions={[customLimit]}
                slots={{
                  pagination: () => <CustomPagination rightSide={false} />,
                }}
                rowSelectionModel={
                  selectedTransErrorId != null ? [selectedTransErrorId] : []
                }
                onRowSelectionModelChange={(
                  selectionModel: GridRowSelectionModel,
                ) => {
                  const selected = selectionModel[0];
                  if (selected != null)
                    setSelectedTransErrorId(selected as any);
                }}
                onCellKeyDown={handleGridKeyNav(
                  transErrors,
                  (row) => row.message_id,
                  transErrorsApiRef,
                  setSelectedTransErrorId,
                )}
                sx={{ maxHeight: "35vh", flex: 1 }}
                hideFooterSelectedRowCount
              /> */}
          {/* </TabPanel> */}

          {/* <TabPanel value="response" sx={{ p: 1 }}> */}
          {/* <DataGrid
                apiRef={transResponsesApiRef}
                rows={transResponses}
                columns={
                  [
                    {
                      flex: 1,
                      field: "api_trans_id",
                      headerName: "Poll Trans ID",
                    },
                    {
                      flex: 1,
                      field: "response_seq",
                      headerName: "Response Seq",
                    },
                    {
                      flex: 1,
                      field: "response_type",
                      headerName: "Response Type",
                    },
                    { flex: 1, field: "status", headerName: "Status" },
                    {
                      flex: 1,
                      field: "creation_date",
                      headerName: "Created at",
                    },
                    {
                      flex: 1,
                      field: "error_message",
                      headerName: "Error Message",
                    },
                    {
                      field: " ",
                      headerName: "Response Bundle",
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
                                    console.log(res.data, "respinnnnnnse");
                                    toast.success(
                                      `Success ${
                                        res.data.req_id
                                          ? `(ServiceRequest ID ${res.data.req_id} )`
                                          : ""
                                      }`,
                                    );

                                    await getTransErrors(
                                      selectedTransDetailsId || "",
                                      transErrorsPage,
                                      limit,
                                    );

                                    await getPollDetails(
                                      selectedTransDetailsId || -1,
                                      pollDetailsPage,
                                      limit,
                                    );
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
                  ] as GridColDef[]
                }
                getRowId={(row: TransResponse) => row.response_seq}
                rowCount={transResponsesTotalRows}
                loading={transMonitorContextData.isLoading.getTransResponsesReq}
                paginationMode="server"
                paginationModel={{
                  page: transResponsesCurrentPage - 1,
                  pageSize: customLimit,
                }}
                onPaginationModelChange={(model) =>
                  setTransResponsesPage(model.page + 1)
                }
                pageSizeOptions={[customLimit]}
                slots={{
                  pagination: () => <CustomPagination rightSide={false} />,
                }}
                rowSelectionModel={
                  selectedTransResponseId != null
                    ? [selectedTransResponseId]
                    : []
                }
                onRowSelectionModelChange={(
                  selectionModel: GridRowSelectionModel,
                ) => {
                  const selected = selectionModel[0];
                  if (selected != null)
                    setSelectedTransResponseId(selected as any);
                }}
                onCellKeyDown={handleGridKeyNav(
                  transResponses,
                  (row) => row.response_seq,
                  transResponsesApiRef,
                  setSelectedTransResponseId,
                )}
                sx={{ maxHeight: "35vh", flex: 1 }}
                hideFooterSelectedRowCount
              /> */}
          {/* </TabPanel> */}

          {/* <TabPanel value="pollDetails" sx={{ p: 1 }}> */}
          {/* <DataGrid
                apiRef={pollDetailsApiRef}
                rows={pollDetails}
                columns={
                  [
                    {
                      flex: 1,
                      field: "response_seq",
                      headerName: "Response Seq",
                    },
                    {
                      flex: 1,
                      field: "response_type",
                      headerName: "Response Type",
                    },
                    {
                      flex: 1,
                      field: "response_id",
                      headerName: "Response id",
                    },

                    { flex: 1, field: "status", headerName: "Status" },

                    {
                      flex: 1,
                      field: "about_api_trans_id",
                      headerName: "About",
                    },
                    {
                      flex: 1,
                      field: "adjudication_outcome",
                      headerName: "Outcome",
                    },
                    {
                      flex: 1,
                      field: "creation_date",
                      headerName: "Created at",
                    },
                    {
                      flex: 1,
                      field: "error_message",
                      headerName: "Error Message",
                    },
                    {
                      field: " ",
                      headerName: "Actions",
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
                                    console.log(res.data, "respinnnnnnse");
                                    toast.success(
                                      `Success ${
                                        res.data.req_id
                                          ? `(ServiceRequest ID ${res.data.req_id} )`
                                          : ""
                                      }`,
                                    );

                                    await getTransErrors(
                                      selectedTransDetailsId || "",
                                      transErrorsPage,
                                      limit,
                                    );

                                    await getPollDetails(
                                      selectedTransDetailsId || -1,
                                      pollDetailsPage,
                                      limit,
                                    );
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
                  ] as GridColDef[]
                }
                getRowId={(row: PollDetails) => row.response_id}
                rowCount={pollDetailsTotalRows}
                loading={transMonitorContextData.isLoading.getPollDetailsReq}
                paginationMode="server"
                paginationModel={{
                  page: pollDetailsCurrentPage - 1,
                  pageSize: customLimit,
                }}
                onPaginationModelChange={(model) =>
                  setPollDetailsPage(model.page + 1)
                }
                pageSizeOptions={[customLimit]}
                slots={{
                  pagination: () => <CustomPagination rightSide={false} />,
                }}
                rowSelectionModel={
                  selectedPollDetailsId != null ? [selectedPollDetailsId] : []
                }
                onRowSelectionModelChange={(
                  selectionModel: GridRowSelectionModel,
                ) => {
                  const selected = selectionModel[0];
                  if (selected != null)
                    setSelectedPollDetailsId(selected as any);
                }}
                onCellKeyDown={handleGridKeyNav(
                  pollDetails,
                  (row) => row.response_id,
                  pollDetailsApiRef,
                  setSelectedPollDetailsId,
                )}
                sx={{ maxHeight: "35vh", flex: 1 }}
                hideFooterSelectedRowCount
              /> */}
          {/* </TabPanel>
          </TabContext> */}
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
