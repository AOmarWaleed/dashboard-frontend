import type { GridColDef } from "@mui/x-data-grid";
import type { GLGridColDef } from "@givc/shared-components";
import { Box, CircularProgress, Divider, Typography } from "@mui/material";
import { useState, useContext } from "react";
import type { FC } from "react";
import type { SearchParams } from "../TransactionTimeline";
import { AuthGuardContext, AuthGuardPermissions } from "@givc/shared-components";
import { Secure } from "@givc/shared-components";
import { PERMISSIONS_PREFIXES } from "../../../constants";
import type { pageType } from "../../../constants";
import { fetcher } from "../../../api";
import renderTruncatedCell from "../../../utils/renderTruncatedCell";
import DownloadTransData from "../../../components/DownloadTransData/DownloadTransData";
import ErrorsChartsSection from "./ErrorsChartsSection";

type EligibilityTopErrorSectionProps = {
  page: pageType;
  searchParams: SearchParams;
  error: string;
  loading: boolean;
};

const EligibilityTopErrorSection: FC<EligibilityTopErrorSectionProps> = ({
  searchParams,
  error,
  loading,
  page,
}: EligibilityTopErrorSectionProps) => {
  const [nphiesMessageId, setNphiesMessageId] = useState<string | null>(null);
  const [nphiesMessage, setNphiesMessage] = useState<string | null>(null);
  const [selectedTransId, setSelectedTransId] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const ctx = useContext(AuthGuardContext);
  if (!ctx) {
    return null;
  }
  const { t } = ctx;

  const columns: GridColDef[] = [
    {
      field: "nphies_message_id",
      headerName: t("transactionAnalysis_30_ColNphiesCode"),
      flex: 1,
      headerAlign: "center",
    },
    {
      field: "nphies_message",
      headerName: t("transactionAnalysis_30_ColMessage"),
      flex: 3,
      align: "left",
      minWidth: 300,
      headerAlign: "center",
    },
    {
      field: "total",
      headerName: t("transactionAnalysis_30_ColTotal"),
      align: "right",
      type: "number",
      flex: 0.7,
      headerAlign: "center",
    },
    {
      field: "last_trans_id",
      headerName: t("transactionAnalysis_30_ColLastTransID"),
      align: "right",
      type: "number",
      flex: 1,
      headerAlign: "center",
    },
    {
      field: "last_at",
      headerName: t("transactionAnalysis_30_ColLastAt"),
      flex: 1,
      headerAlign: "center",
    },
    {
      field: "first_trans_id",
      headerName: t("transactionAnalysis_30_ColFirstTransID"),
      align: "right",
      type: "number",
      flex: 1,
      headerAlign: "center",
    },
    {
      field: "first_at",
      headerName: t("transactionAnalysis_30_ColFirstAt"),
      flex: 1,
      headerAlign: "center",
    },
  ];

  const codeColumns: GridColDef[] = [
    {
      field: "nphies_message_id",
      headerName: t("transactionAnalysis_30_ColMessageId"),
      flex: 1,
      headerAlign: "center",
    },
    {
      field: "total",
      headerName: t("transactionAnalysis_30_ColTotal"),
      align: "right",
      type: "number",
      flex: 0.7,
      headerAlign: "center",
    },
    {
      field: "pct",
      headerName: "%",
      align: "right",
      type: "number",
      flex: 0.7,
      headerAlign: "center",
    },
    {
      field: "last_at",
      headerName: t("transactionAnalysis_30_ColLastAt"),
      flex: 1,
      headerAlign: "center",
    },
  ];

  // const { allFacilities, ...restParams } = searchParams;
  const paramsKey = JSON.stringify(searchParams ?? {});

  const handleSelectCode = (code: string | null) => {
    setSelectedCode((prev) => (prev === code ? null : code));
    setNphiesMessageId(null);
    setNphiesMessage(null);
    setSelectedTransId(null);
  };

  // const detailsColumns: GridColDef[] = [
  //   {
  //     field: "message_id",
  //     headerName: "Message ID",
  //     width: 80,
  //     renderCell: renderTruncatedCell,
  //   },
  //   {
  //     field: "nphies_message_id",
  //     headerName: "NPHIES Message ID",
  //     width: 80,
  //     renderCell: renderTruncatedCell,
  //   },
  //   {
  //     field: "nphies_message",
  //     headerName: "NPHIES Message",
  //     minWidth: 100,
  //     flex: 1,
  //     renderCell: renderTruncatedCell,
  //   },
  //   {
  //     field: "error_element",
  //     headerName: "Error Element",
  //     minWidth: 80,
  //     flex: 1,
  //     renderCell: renderTruncatedCell,
  //   },
  //   {
  //     field: "element_value",
  //     headerName: "Element Value",
  //     minWidth: 80,
  //     flex: 1,
  //     renderCell: renderTruncatedCell,
  //   },
  //   {
  //     field: "resource",
  //     headerName: "Resource",
  //     width: 80,
  //     renderCell: renderTruncatedCell,
  //   },
  //   {
  //     field: "item_no",
  //     headerName: "Item No.",
  //     width: 80,
  //     renderCell: renderTruncatedCell,
  //   },
  //   {
  //     field: "response_id",
  //     headerName: "Response ID",
  //     width: 80,
  //     renderCell: renderTruncatedCell,
  //   },
  //   {
  //     field: "api_trans_id",
  //     headerName: "API Transaction ID",
  //     width: 80,
  //     renderCell: renderTruncatedCell,
  //   },
  //   {
  //     field: "api_name",
  //     headerName: "API Name",
  //     width: 100,
  //     renderCell: renderTruncatedCell,
  //   },
  //   {
  //     field: "api_provider",
  //     headerName: "API Provider",
  //     width: 100,
  //     renderCell: renderTruncatedCell,
  //   },
  //   {
  //     field: "status",
  //     headerName: "Status",
  //     width: 80,
  //     renderCell: renderTruncatedCell,
  //   },
  //   {
  //     field: "url",
  //     headerName: "URL",
  //     minWidth: 100,
  //     flex: 1,
  //     renderCell: renderTruncatedCell,
  //   },
  //   {
  //     field: "creation_date",
  //     headerName: "Creation Date",
  //     width: 100,
  //     renderCell: renderTruncatedCell,
  //   },
  //   {
  //     field: "payer_id",
  //     headerName: "Payer ID",
  //     width: 80,
  //     renderCell: renderTruncatedCell,
  //   },
  //   {
  //     field: "facility_id",
  //     headerName: "Facility ID",
  //     width: 80,
  //     renderCell: renderTruncatedCell,
  //   },
  //   {
  //     field: "transaction_id",
  //     headerName: "Transaction ID",
  //     width: 80,
  //     renderCell: renderTruncatedCell,
  //   },
  // ];

  const detailsColumns: GridColDef[] = [
    {
      field: "api_trans_id",
      headerName: "Api Trans Id",
      align: "right",
      type: "number",
      width: 100,
      headerAlign: "center",
      renderCell: (params) => {
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
              permission={`${PERMISSIONS_PREFIXES.transactionTimeline}downloadTransDataEligibility`}
              fallBackText="Download"
              transId={params.row.api_trans_id}
            />
          </Box>
        );
      },
    },
    {
      field: "facility_id",
      headerName: "Facility Id",
      align: "right",
      type: "number",
      headerAlign: "center",
      width: 100,
      renderCell: renderTruncatedCell,
    },
    {
      field: "api_name",
      headerName: "Api Name",
      headerAlign: "center",
      width: 120,
      renderCell: renderTruncatedCell,
    },
    {
      field: "api_function",
      headerName: "Api Function",
      headerAlign: "center",
      width: 140,
      renderCell: renderTruncatedCell,
    },
    {
      field: "creation_date",
      headerName: "Creation Date",
      headerAlign: "center",
      width: 130,
      renderCell: renderTruncatedCell,
    },
    {
      field: "status",
      headerName: "Status",
      headerAlign: "center",
      width: 90,
      renderCell: renderTruncatedCell,
    },
    {
      field: "outcome",
      headerName: "Outcome",
      headerAlign: "center",
      width: 100,
      renderCell: renderTruncatedCell,
    },
    {
      field: "adjudication_outcome",
      headerName: "Adjudication",
      headerAlign: "center",
      width: 120,
      renderCell: renderTruncatedCell,
    },
    {
      field: "patient_id",
      headerName: "Patient Id",
      align: "right",
      type: "number",
      headerAlign: "center",
      width: 100,
      renderCell: renderTruncatedCell,
    },
    {
      field: "episode_no",
      headerName: "Episode No",
      align: "right",
      type: "number",
      headerAlign: "center",
      width: 100,
      renderCell: renderTruncatedCell,
    },
    {
      field: "transaction_id",
      headerName: "Transaction Id",
      align: "right",
      type: "number",
      headerAlign: "center",
      width: 100,
      renderCell: renderTruncatedCell,
    },
    {
      field: "payer_id",
      headerName: "Payer Id",
      align: "right",
      type: "number",
      headerAlign: "center",
      width: 100,
      renderCell: renderTruncatedCell,
    },
    {
      field: "bundle_count",
      headerName: "Bundle Count",
      align: "right",
      type: "number",
      headerAlign: "center",
      width: 100,
      renderCell: renderTruncatedCell,
    },
    {
      field: "res_kb",
      headerName: "Res Kb",
      align: "right",
      type: "number",
      headerAlign: "center",
      width: 90,
      renderCell: renderTruncatedCell,
    },
    {
      field: "dest_url",
      headerName: "Dest Url",
      headerAlign: "center",
      minWidth: 150,
      flex: 1,
      renderCell: renderTruncatedCell,
    },
    {
      field: "cancel_api_trans_id",
      headerName: "Cancel Trans Id",
      align: "right",
      type: "number",
      headerAlign: "center",
      width: 80,
      renderCell: renderTruncatedCell,
    },
    {
      field: "error_message",
      headerName: "Error Message",
      headerAlign: "center",
      minWidth: 100,
      flex: 1,
      renderCell: renderTruncatedCell,
    },
  ];

  const messageColumns: GridColDef[] = [
    {
      field: "message_id",
      headerName: "Message Id",
      align: "right",
      type: "number",
      width: 100,
      headerAlign: "center",
    },
    {
      field: "api_trans_id",
      headerName: "Trans Id",
      align: "right",
      type: "number",
      width: 120,
      headerAlign: "center",
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 1,
            alignItems: "center",
          }}
        >
          <span>{params.row.api_trans_id}</span>
          <DownloadTransData
            permission={`${PERMISSIONS_PREFIXES[page]}downloadTransDataEligibility`}
            fallBackText="Download"
            transId={params.row.api_trans_id}
          />
        </Box>
      ),
    },
    {
      field: "nphies_message_id",
      headerName: t("transactionAnalysis_30_ColNphiesCode"),
      width: 140,
      headerAlign: "center",
    },
    {
      field: "nphies_message",
      headerName: t("transactionAnalysis_30_ColMessage"),
      flex: 5,
      minWidth: 300,
      headerAlign: "center",
      renderCell: renderTruncatedCell,
    },
    {
      field: "error_element",
      headerName: "Error Element",
      flex: 1,
      headerAlign: "center",
      renderCell: renderTruncatedCell,
    },
    {
      field: "element_value",
      headerName: "Element Value",
      width: 140,
      headerAlign: "center",
      renderCell: renderTruncatedCell,
    },
    {
      field: "item_no",
      headerName: "Item No",
      align: "right",
      type: "number",
      width: 100,
      headerAlign: "center",
    },
    {
      field: "response_id",
      headerName: "Response Id",
      align: "right",
      type: "number",
      width: 120,
      headerAlign: "center",
    },
  ];

  return (
    <Box>
      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 300,
          }}
        >
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" variant="body1" align="center">
          {error}
        </Typography>
      ) : (
        <Box>
          <Box sx={{ display: "flex", flexDirection: "row", gap: 2 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
          <Secure.GLCustomTable2
            key={`codes-${paramsKey}`}
            permission={`${PERMISSIONS_PREFIXES[page]}eligibilityErrorCodeTable`}
            url="/transactionTimeline/getErrorCodeSummary"
            params={searchParams}
            fetcher={fetcher}
            columns={codeColumns as GLGridColDef[]}
            limit={10}
            getRowId={(r) => `${r.nphies_message_id}`}
            enableUnselectRow={true}
            onRowSelected={(r) =>
              handleSelectCode(r?.nphies_message_id ?? null)
            }
          />
            </Box>

            <Box sx={{ flex: 2, minWidth: 0 }}>
              <Secure.GLCustomTable2
                key={`summary-${selectedCode ?? "all"}-${paramsKey}`}
                permission={`${PERMISSIONS_PREFIXES[page]}eligibilityErrorSummaryTable`}
                url="/transactionTimeline/getErrorMessageSummary"
                params={
                  selectedCode
                    ? { ...searchParams, nphies_code: selectedCode }
                    : searchParams
                }
                fetcher={fetcher}
                columns={columns as GLGridColDef[]}
                limit={10}
                getRowId={(r) => `${r.nphies_message_id}::${r.nphies_message}`}
                onRowSelected={(r) => {
                  setNphiesMessageId(r?.nphies_message_id);
                  setNphiesMessage(r?.nphies_message);
                  setSelectedTransId(null);
                }}
              />
            </Box>
          </Box>

          <Divider sx={{ my: 1 }} />

          <AuthGuardPermissions
            secureId={`${PERMISSIONS_PREFIXES[page]}errorsChartsSection`}
          >
            {() => (
              <ErrorsChartsSection
                searchParams={searchParams}
                nphiesCode={selectedCode}
              />
            )}
          </AuthGuardPermissions>

          <Divider sx={{ my: 1 }} />

          <Box sx={{ px: 1 }}>
            <Secure.GLCustomTable2
              key={`details-${nphiesMessageId}-${nphiesMessage}-${paramsKey}`}
              permission={`${PERMISSIONS_PREFIXES[page]}eligibilityErrorDetailsTable`}
              url="/transactionTimeline/getErrorMessageDetails"
              params={{
                ...searchParams,
                nphies_message_id: nphiesMessageId,
                nphies_message: nphiesMessage,
              }}
              fetcher={fetcher}
              columns={detailsColumns as GLGridColDef[]}
              limit={10}
              getRowId={(row) => row.api_trans_id ?? row.transaction_id}
              autoSelectFirstRow={true}
              onRowSelected={(r) => setSelectedTransId(r?.api_trans_id ?? null)}
            />
          </Box>

          <Divider sx={{ my: 1 }} />

          <Box sx={{ px: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t("transactionAnalysis_30_ApiMessagesTitle") || "API Messages"}
            </Typography>
            <Secure.GLCustomTable2
              key={`messages-${nphiesMessageId}-${selectedTransId}-${paramsKey}`}
              permission={`${PERMISSIONS_PREFIXES[page]}eligibilityErrorMessageTable`}
              url="/transactionTimeline/getErrorMessageMessages"
              params={
                selectedTransId
                  ? { api_trans_id: selectedTransId }
                  : nphiesMessageId
                  ? { ...searchParams, nphies_message_id: nphiesMessageId, empty_tables: "Y" }
                  : { ...searchParams, empty_tables: "Y" }
              }
              fetcher={fetcher}
              columns={messageColumns as GLGridColDef[]}
              limit={10}
              getRowId={(row) => row.message_id ?? `${row.api_trans_id}-${row.response_id}`}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default EligibilityTopErrorSection;
