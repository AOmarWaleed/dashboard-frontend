import { useState, useEffect } from "react";
import StatusTimeline from "./StatusTimeline";
import TypesTimeline from "./TypesTimline";
import { useValidationDashboard } from "../ValidationDashboardContext";
import { Box } from "@mui/material";
import { dashboardAxios, fetcher } from "../../../api";
import { Secure } from "@givc/shared-components";
interface TimeLineProps {
  backendParam: string;
  dataKey: string;
}

const TimeLineTab = ({ backendParam, dataKey }: TimeLineProps) => {
  const [reqType, setReqType] = useState("");
  const [typesData, setTypesData] = useState<[] | Record<string, any>[]>([]);
  const [statusData, setStatusData] = useState<[] | Record<string, any>[]>([]);

  const { getAllFormValues } = useValidationDashboard();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await dashboardAxios.get(
          `/claim-validation/typesTimelineData/${backendParam}`,
          {
            params: {
              start_date: getAllFormValues.start_date,
              end_date: getAllFormValues.end_date,
              diagnosis_code: getAllFormValues.diagnosis_code,
              physician_emp_id: getAllFormValues.physician_emp_id,
              validation_code: getAllFormValues.validation_code,
              payer_id: getAllFormValues.payer_id,
              componentType: "chart",
            },
          },
        );
        setTypesData(data.data);
      } catch {
        console.log("Couldn't fetch timeline Data");
        setTypesData([]);
      }
    };
    fetchData();
  }, [
    backendParam,
    getAllFormValues.start_date,
    getAllFormValues.end_date,
    getAllFormValues.diagnosis_code,
    getAllFormValues.physician_emp_id,
    getAllFormValues.validation_code,
    getAllFormValues.payer_id,
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await dashboardAxios.get(
          `/claim-validation/statusTimelineData/${backendParam}`,
          {
            params: {
              start_date: getAllFormValues.start_date,
              end_date: getAllFormValues.end_date,
              diagnosis_code: getAllFormValues.diagnosis_code,
              physician_emp_id: getAllFormValues.physician_emp_id,
              validation_code: getAllFormValues.validation_code,
              payer_id: getAllFormValues.payer_id,
              status: getAllFormValues.status,
              req_type: reqType,
              componentType: "chart",
            },
          },
        );
        setStatusData(data.data);
      } catch {
        console.log("Couldn't fetch timeline Data");
        setStatusData([]);
      }
    };
    fetchData();
  }, [
    backendParam,
    getAllFormValues.start_date,
    getAllFormValues.end_date,
    getAllFormValues.diagnosis_code,
    getAllFormValues.physician_emp_id,
    getAllFormValues.validation_code,
    getAllFormValues.payer_id,
    getAllFormValues.status,
    reqType,
  ]);

  const handleReqTypeChange = (type: string) => {
    setReqType((prevState) => {
      return prevState === type ? "" : type;
    });
  };
  console.log("form values", getAllFormValues);
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        gap: 2,
        mb: 3,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          mb: 3,
          flex: 1,
        }}
      >
        <TypesTimeline
          chartData={typesData}
          dataKey={dataKey}
          handleReqTypeChange={handleReqTypeChange}
        />
        <Box>
          <Secure.GlCustomTable
            url={`/claim-validation/typesTimelineData/${backendParam}`}
            columns={[
              {
                field: dataKey,
                headerName: dataKey.charAt(0).toUpperCase() + dataKey.slice(1),
                flex: 1,
              },
              { field: "claim", headerName: "Claim", flex: 1, align: "right" },
              {
                field: "pre-auth",
                headerName: "Pre-auth",
                flex: 1,
                align: "right",
              },
              {
                field: "services",
                headerName: "Services",
                flex: 1,
                align: "right",
              },
              {
                field: "prescription",
                headerName: "Prescription",
                flex: 1,
                align: "right",
              },
            ]}
            fetcher={fetcher}
            resource_key="replace me"
            params={{
              start_date: getAllFormValues.start_date,
              end_date: getAllFormValues.end_date,
              diagnosis_code: getAllFormValues.diagnosis_code,
              physician_emp_id: getAllFormValues.physician_emp_id,
              validation_code: getAllFormValues.validation_code,
              payer_id: getAllFormValues.payer_id,
              status: getAllFormValues.status,
            }}
            getRowId={(row) => row[dataKey]}
            limit={10}
          />
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          mb: 3,
          flex: 1,
        }}
      >
        <StatusTimeline chartData={statusData} dataKey={dataKey} />
        <Box>
          <Secure.GlCustomTable
            url={`/claim-validation/statusTimelineData/${backendParam}`}
            columns={[
              {
                field: dataKey,
                headerName: dataKey.charAt(0).toUpperCase() + dataKey.slice(1),
                flex: 1,
              },
              { field: "new", headerName: "New", flex: 1, align: "right" },
              {
                field: "recheck",
                headerName: "Recheck",
                flex: 1,
                align: "right",
              },
              {
                field: "resolved",
                headerName: "Resolved",
                flex: 1,
                align: "right",
              },
              {
                field: "ignore",
                headerName: "Ignore",
                flex: 1,
                align: "right",
              },
            ]}
            fetcher={fetcher}
            resource_key="replace me"
            params={{
              start_date: getAllFormValues.start_date,
              end_date: getAllFormValues.end_date,
              diagnosis_code: getAllFormValues.diagnosis_code,
              physician_emp_id: getAllFormValues.physician_emp_id,
              validation_code: getAllFormValues.validation_code,
              payer_id: getAllFormValues.payer_id,
              status: getAllFormValues.status,
              req_type: reqType,
            }}
            getRowId={(row) => row[dataKey]}
            limit={10}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default TimeLineTab;
