import { useState } from "react";
import { Box, CircularProgress, Divider, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import type { GLGridColDef } from "@givc/shared-components";
import { useContext } from "react";
import type { FC } from "react";
import type { SearchParams } from "../TransactionTimeline";
import { AuthGuardContext, AuthGuardPermissions } from "@givc/shared-components";
import { Secure } from "@givc/shared-components";
import { PERMISSIONS_PREFIXES } from "../../../constants";
import type { pageType } from "../../../constants";
import { fetcher } from "../../../api";
import renderTruncatedCell from "../../../utils/renderTruncatedCell";
import FacilitiesChartsSection from "./FacilitiesChartsSection";

type FacilitiesSectionProps = {
  page: pageType;
  searchParams: SearchParams;
  error: string;
  loading: boolean;
};

const FacilitiesSection: FC<FacilitiesSectionProps> = ({
  searchParams,
  error,
  loading,
  page,
}: FacilitiesSectionProps) => {
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | null>(
    null,
  );
  const paramsKey = JSON.stringify(searchParams ?? {});

  const ctx = useContext(AuthGuardContext);
  if (!ctx) {
    return null;
  }
  const { t } = ctx;

  const handleSelectFacility = (facilityId: number | null) => {
    setSelectedFacilityId((prev) =>
      prev === facilityId ? null : facilityId,
    );
  };

  const summaryColumns: GridColDef[] = [
    {
      field: "facility_id",
      headerName: t("transactionAnalysis_30_ColFacilityId") || "Facility Id",
      align: "right",
      type: "number",
      flex: 0.7,
      headerAlign: "center",
    },
    {
      field: "facility_name",
      headerName: t("transactionAnalysis_30_ColFacility") || "Facility",
      flex: 1.5,
      headerAlign: "center",
      renderCell: renderTruncatedCell,
    },
    {
      field: "total",
      headerName: t("transactionAnalysis_30_ColTotal"),
      align: "right",
      type: "number",
      flex: 0.8,
      headerAlign: "center",
    },
    {
      field: "succeeded_count",
      headerName: t("transactionAnalysis_30_ColSucceededCount"),
      align: "right",
      type: "number",
      flex: 0.8,
      headerAlign: "center",
    },
    {
      field: "error_count",
      headerName: t("transactionAnalysis_30_ColErrorCount"),
      align: "right",
      type: "number",
      flex: 0.8,
      headerAlign: "center",
    },
    {
      field: "failed_count",
      headerName: t("transactionAnalysis_30_ColFailedCount"),
      align: "right",
      type: "number",
      flex: 0.8,
      headerAlign: "center",
    },
    {
      field: "succeeded_percent",
      headerName: t("transactionAnalysis_30_ColSucceededPercent"),
      align: "right",
      type: "number",
      flex: 0.8,
      headerAlign: "center",
    },
    {
      field: "error_percent",
      headerName: t("transactionAnalysis_30_ColErrorPercent"),
      align: "right",
      type: "number",
      flex: 0.8,
      headerAlign: "center",
    },
    {
      field: "failed_percent",
      headerName: t("transactionAnalysis_30_ColFailedPercent"),
      align: "right",
      type: "number",
      flex: 0.8,
      headerAlign: "center",
    },
    {
      field: "pre_sec",
      headerName:
        t("transactionAnalysis_30_ColPreprocessingTime") ||
        "Preprocessing Time",
      align: "right",
      type: "number",
      flex: 0.9,
      headerAlign: "center",
    },
    {
      field: "local_sec",
      headerName: t("transactionAnalysis_30_ColLocalTimeSeconds"),
      align: "right",
      type: "number",
      flex: 0.9,
      headerAlign: "center",
    },
    {
      field: "res_sec",
      headerName:
        t("transactionAnalysis_30_ColResponseTime") || "Response Time",
      align: "right",
      type: "number",
      flex: 0.9,
      headerAlign: "center",
    },
    {
      field: "tot_sec",
      headerName:
        t("transactionAnalysis_30_ColTotalElapsedTime") ||
        "Total Elapsed Time",
      align: "right",
      type: "number",
      flex: 0.9,
      headerAlign: "center",
    },
  ];

  const apiNameColumns: GridColDef[] = [
    {
      field: "api_name",
      headerName: t("transactionAnalysis_30_ColApiName"),
      flex: 1.2,
      headerAlign: "center",
      renderCell: renderTruncatedCell,
    },
    {
      field: "total",
      headerName: t("transactionAnalysis_30_ColTotal"),
      align: "right",
      type: "number",
      flex: 0.8,
      headerAlign: "center",
    },
    {
      field: "succeeded_count",
      headerName: t("transactionAnalysis_30_ColSucceededCount"),
      align: "right",
      type: "number",
      flex: 0.8,
      headerAlign: "center",
    },
    {
      field: "error_count",
      headerName: t("transactionAnalysis_30_ColErrorCount"),
      align: "right",
      type: "number",
      flex: 0.8,
      headerAlign: "center",
    },
    {
      field: "failed_count",
      headerName: t("transactionAnalysis_30_ColFailedCount"),
      align: "right",
      type: "number",
      flex: 0.8,
      headerAlign: "center",
    },
    {
      field: "succeeded_percent",
      headerName: t("transactionAnalysis_30_ColSucceededPercent"),
      align: "right",
      type: "number",
      flex: 0.8,
      headerAlign: "center",
    },
    {
      field: "error_percent",
      headerName: t("transactionAnalysis_30_ColErrorPercent"),
      align: "right",
      type: "number",
      flex: 0.8,
      headerAlign: "center",
    },
    {
      field: "failed_percent",
      headerName: t("transactionAnalysis_30_ColFailedPercent"),
      align: "right",
      type: "number",
      flex: 0.8,
      headerAlign: "center",
    },
    {
      field: "pre_sec",
      headerName:
        t("transactionAnalysis_30_ColPreprocessingTime") ||
        "Preprocessing Time",
      align: "right",
      type: "number",
      flex: 0.9,
      headerAlign: "center",
    },
    {
      field: "local_sec",
      headerName: t("transactionAnalysis_30_ColLocalTimeSeconds"),
      align: "right",
      type: "number",
      flex: 0.9,
      headerAlign: "center",
    },
    {
      field: "res_sec",
      headerName:
        t("transactionAnalysis_30_ColResponseTime") || "Response Time",
      align: "right",
      type: "number",
      flex: 0.9,
      headerAlign: "center",
    },
    {
      field: "tot_sec",
      headerName:
        t("transactionAnalysis_30_ColTotalElapsedTime") ||
        "Total Elapsed Time",
      align: "right",
      type: "number",
      flex: 0.9,
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
          <Secure.GLCustomTable2
            key={`facilities-${paramsKey}`}
            permission={`${PERMISSIONS_PREFIXES[page]}facilitiesSummaryTable`}
            url="/transactionTimeline/getFacilitySummary"
            params={searchParams}
            fetcher={fetcher}
            columns={summaryColumns as GLGridColDef[]}
            limit={10}
            getRowId={(r) => `${r.facility_id}`}
            enableUnselectRow={true}
            onRowSelected={(r) =>
              handleSelectFacility(
                r?.facility_id === undefined || r?.facility_id === null
                  ? null
                  : Number(r.facility_id),
              )
            }
          />

          <Divider sx={{ my: 1 }} />

          <Secure.GLCustomTable2
            key={`apiname-${selectedFacilityId ?? "all"}-${paramsKey}`}
            permission={`${PERMISSIONS_PREFIXES[page]}facilitiesApiNameTable`}
            url="/transactionTimeline/getFacilityApiNameGrid"
            params={
              selectedFacilityId === null
                ? searchParams
                : { ...searchParams, facility_id: selectedFacilityId }
            }
            fetcher={fetcher}
            columns={apiNameColumns as GLGridColDef[]}
            limit={10}
            getRowId={(r) => `${r.api_name}`}
          />

          <Divider sx={{ my: 1 }} />

          <AuthGuardPermissions
            secureId={`${PERMISSIONS_PREFIXES[page]}facilitiesChartsSection`}
          >
            {() => (
              <FacilitiesChartsSection
                searchParams={searchParams}
                facilityId={selectedFacilityId}
              />
            )}
          </AuthGuardPermissions>
        </Box>
      )}
    </Box>
  );
};

export default FacilitiesSection;
