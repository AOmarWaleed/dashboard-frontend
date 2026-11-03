import { Box } from "@mui/material";
import ErrorGraph from "./ErrorGraph";
import HandleTitle from "../../components/HandleTitle";

export default function TransActionAnalysis() {
  return (
    <Box>
      <HandleTitle titleKey="TRANS_ACTION_ANALYSIS" />
      <Box>
        <ErrorGraph
          apiUrl={`/transaction-analysis/error-graph`}
          title="Error Statistics Over Time"
        />
      </Box>
    </Box>
  );
}
