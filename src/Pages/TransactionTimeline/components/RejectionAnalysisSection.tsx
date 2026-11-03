import { useState, useContext } from "react";
import { Box, Button } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { GlCustomTable, AuthGuardContext } from "@givc/shared-components";
import { fetcher } from "../../../api";
import dayjs from "dayjs";
import DownloadTransData from "../../../components/DownloadTransData/DownloadTransData";
import type { TabProps } from "../TransactionTimeline";
import { PERMISSIONS_PREFIXES } from "../../../constants";

type RejectionAnalysisRow = {
  msg_id?: string | number;
  first?: string | null;
  last?: string | null;
  payer_id?: string | null;
};

const RejectionAnalysisSection = ({ searchParams, page }: TabProps) => {
  const [selectedRejectionAna, setSelectedRejectionAna] =
    useState<RejectionAnalysisRow | null>(null);

  const selectedHasDetails =
    !!(selectedRejectionAna?.msg_id && selectedRejectionAna?.first);

  //==================  * Resources * ===================
  const ctx = useContext(AuthGuardContext);
  if (!ctx) {
    return null;
  }
  const { t } = ctx;

  function goToClaim(
    apiTransId: string,
    payerId: string,
    startDate: string | null
  ) {
    window.open(
      `/claim?trans=${encodeURIComponent(
        apiTransId
      )}&payer_id=${encodeURIComponent(payerId)}&creation_date=${dayjs(
        startDate
      ).format("DD-MM-YYYY")}`
    );
  }

  const columns: GridColDef[] = [
    {
      field: "msg_id",
      headerName: t("transactionAnalysis_30_ColMsgId"),
      width: 150,
    },
    {
      field: "display",
      headerName: t("transactionAnalysis_30_ColDisplay"),
      width: 250,
      flex: 1,
    },
    {
      field: "first",
      headerName: t("transactionAnalysis_30_ColFirst"),
      width: 150,
    },
    {
      field: "last",
      headerName: t("transactionAnalysis_30_ColLast"),
      width: 150,
    },
    {
      field: "payer_count",
      headerName: t("transactionAnalysis_30_ColPayers"),
      width: 200,
      align: "right",
    },
    {
      field: "claim_count",
      headerName: t("transactionAnalysis_30_ColClaims"),
      width: 200,
      align: "right",
    },
    {
      field: "record_count",
      headerName: t("transactionAnalysis_30_ColCount"),
      width: 200,
      align: "right",
      type: "number",
    },
    {
      field: "total_amount",
      headerName: t("transactionAnalysis_30_ColAmount"),
      width: 200,
      align: "right",
      type: "number",
    },
  ];

  const detailsColumns: GridColDef[] = [
    {
      field: "api_trans_id",
      headerName: t("transactionAnalysis_30_ColAPITransactionID"),
      width: 100,
      type: "string",
      hideable: true,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 0, alignItems: "center" }}>
          <Button
            onClick={() => {
              goToClaim(
                params.row.api_trans_id,
                params.row.payer_id,
                searchParams.start_date
              );
            }}
            variant="contained"
            sx={{ p: 0 }}
          >
            {params.row.api_trans_id}
          </Button>
          <DownloadTransData
            permission={`${PERMISSIONS_PREFIXES[page]}downloadTransData`}
            fallBackText="Download Transaction Data"
            transId={params.row.api_trans_id}
          />
        </Box>
      ),
    },
    {
      field: "id",
      headerName: t("transactionAnalysis_30_ColServiceID"),
      width: 140,
      type: "string",
      align: "center",
      renderCell: (params) => (
        <Button variant="contained" sx={{ px: 1 }}>
          {params.row.service_code}
        </Button>
      ),
    },
    {
      field: "creation_date",
      headerName: t("transactionAnalysis_30_ColDate"),
      width: 80,
      type: "string",
    },
    {
      field: "service_code",
      headerName: t("transactionAnalysis_30_ColServiceCode"),
      width: 90,
      type: "string",
    },
    {
      field: "diagnosis_code",
      headerName: t("transactionAnalysis_30_ColDiagnosis"),
      width: 80,
      type: "string",
    },
    {
      field: "treatment_type",
      headerName: t("transactionAnalysis_30_ColTreatment"),
      width: 100,
      type: "string",
    },
    {
      field: "specialty",
      headerName: t("transactionAnalysis_30_ColSpecialty"),
      width: 50,
      type: "string",
      hideable: true,
    },
    {
      field: "age",
      headerName: t("transactionAnalysis_30_ColAge"),
      width: 50,
      type: "number",
    },
    {
      field: "gender",
      headerName: t("transactionAnalysis_30_ColGender"),
      width: 50,
      type: "singleSelect",
      valueOptions: ["M", "F"],
    },
    {
      field: "payer_id",
      headerName: t("transactionAnalysis_30_ColPayerID"),
      width: 50,
      type: "number",
    },
    {
      field: "payer_description",
      headerName: t("transactionAnalysis_30_ColPayerDescription"),
      width: 160,
      type: "string",
    },
    {
      field: "patient_full_name",
      headerName: t("transactionAnalysis_30_ColPatient"),
      width: 160,
      type: "string",
    },
    {
      field: "amount",
      headerName: t("transactionAnalysis_30_ColAmount"),
      width: 90,
      type: "number",
      renderCell: (params) => `$${(+params.row.amount || 0)?.toFixed(2)}`,
    },
    {
      field: "chief_complaint",
      headerName: t("transactionAnalysis_30_ColChiefComplaint"),
      flex: 1,
      type: "string",
      hideable: true,
    },
    {
      field: "reason",
      headerName: t("transactionAnalysis_30_ColReason"),
      flex: 1,
      type: "string",
      hideable: true,
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <GlCustomTable
        key={JSON.stringify(searchParams)}
        url="/transactionTimeline/getClaimRejectionSummary"
        params={searchParams}
        columns={columns}
        fetcher={fetcher}
        limit={10}
        getRowId={(r) => r.msg_id ?? ""}
        onRowSelected={(row: RejectionAnalysisRow | null) =>
          setSelectedRejectionAna(row)
        }
        autoSelectFirstRow
        {...({ autoHeight: true } as object)}
      />

      <GlCustomTable
        key={`details-${JSON.stringify(selectedRejectionAna ?? {})}`}
        url={selectedHasDetails ? "/transactionTimeline/getClaimRejectionDetails" : ""}
        params={{
          ...(selectedHasDetails
            ? {
                ...searchParams,
                first: selectedRejectionAna.first,
                last: selectedRejectionAna.last,
                payer_id: selectedRejectionAna.payer_id,
                msg_id: selectedRejectionAna.msg_id,
              }
            : {}),
        }}
        columns={detailsColumns}
        fetcher={fetcher}
        limit={10}
        getRowId={(r) => r.id ?? r.api_trans_id}
        autoSelectFirstRow={false}
        {...({ autoHeight: true } as object)}
      />
    </Box>
  );
};

export default RejectionAnalysisSection;
