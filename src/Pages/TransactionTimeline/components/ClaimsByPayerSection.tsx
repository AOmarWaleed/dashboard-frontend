import { Box, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useContext } from "react";
import type { FC } from "react";
import type { TabProps } from "../TransactionTimeline";
import { AuthGuardContext, GlCustomTable } from "@givc/shared-components";
import { fetcher } from "../../../api";

const ClaimsByPayerSection: FC<Omit<TabProps, "page">> = ({
  searchParams,
}: Omit<TabProps, "page">) => {
  //==================  * Resources * ===================
  const ctx = useContext(AuthGuardContext);
  if (!ctx) {
    return null;
  }
  const { t } = ctx;

  const columns: GridColDef[] = [
    {
      field: "payer_id",
      headerName: t("transactionAnalysis_30_ColPayerID"),
      flex: 1,
      align: "right",
      maxWidth: 100,
      headerAlign: "center",
    },
    {
      field: "description",
      headerName: t("transactionAnalysis_30_ColDescription"),
      flex: 1,
      align: "left",
      maxWidth: 600,
      headerAlign: "center",
    },
    {
      field: "trans",
      headerName: t("transactionAnalysis_30_ColTrans"),
      flex: 1,
      align: "right",
      maxWidth: 100,
      headerAlign: "center",
    },
    {
      field: "succeded_count",
      headerName: t("transactionAnalysis_30_ColSucceededCount"),
      flex: 1,
      align: "right",
      maxWidth: 100,
      headerAlign: "center",
    },
    {
      field: "succeeded_percent",
      headerName: t("transactionAnalysis_30_ColSucceededPercent"),
      flex: 1,
      align: "right",
      maxWidth: 100,
      headerAlign: "center",
    },
    {
      field: "error_count",
      headerName: t("transactionAnalysis_30_ColErrorCount"),
      flex: 1,
      align: "right",
      maxWidth: 100,
      headerAlign: "center",
    },
    {
      field: "error_percent",
      headerName: t("transactionAnalysis_30_ColErrorPercent"),
      flex: 1,
      align: "right",
      maxWidth: 100,
      headerAlign: "center",
    },
    {
      field: "failed_count",
      headerName: t("transactionAnalysis_30_ColFailedCount"),
      flex: 1,
      align: "right",
      maxWidth: 100,
      headerAlign: "center",
    },
    {
      field: "failed_percent",
      headerName: t("transactionAnalysis_30_ColFailedPercent"),
      flex: 1,
      align: "right",
      maxWidth: 100,
      headerAlign: "center",
    },
    {
      field: "claims",
      headerName: t("transactionAnalysis_30_ColClaims"),
      flex: 1,
      align: "right",
      maxWidth: 100,
      headerAlign: "center",
    },
    {
      field: "approved",
      headerName: t("transactionAnalysis_30_ColApproved"),
      flex: 1,
      align: "right",
      maxWidth: 100,
      headerAlign: "center",
    },
    {
      field: "approved_percent",
      headerName: t("transactionAnalysis_30_ColApprovedPercent"),
      flex: 1,
      align: "right",
      maxWidth: 100,
      headerAlign: "center",
    },
    {
      field: "rejected",
      headerName: t("transactionAnalysis_30_ColRejected"),
      flex: 1,
      align: "right",
      maxWidth: 100,
      headerAlign: "center",
    },
    {
      field: "rejected_percent",
      headerName: t("transactionAnalysis_30_ColRejectedPercent"),
      flex: 1,
      align: "right",
      maxWidth: 100,
      headerAlign: "center",
    },
    {
      field: "time_s",
      headerName: t("transactionAnalysis_30_ColTimeSeconds"),
      flex: 1,
      align: "right",
      maxWidth: 100,
      headerAlign: "center",
    },
    {
      field: "local_time_s",
      headerName: t("transactionAnalysis_30_ColLocalTimeSeconds"),
      flex: 1,
      align: "right",
      maxWidth: 100,
      headerAlign: "center",
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Box>
        <Typography variant="h5" sx={{ mb: 3, mt: 3, fontWeight: 600 }}>
          {t("transactionAnalysis_30_ClaimsByPayerTitle")}
        </Typography>
        <GlCustomTable
          key={JSON.stringify(searchParams)}
          url="/transactionTimeline/getPayerPerformanceSummary"
          params={searchParams}
          columns={columns}
          fetcher={fetcher}
          limit={10}
          getRowId={(r) => r.payer_id}
          {...({ autoHeight: true } as object)}
        />
      </Box>
    </Box>
  );
};

export default ClaimsByPayerSection;
