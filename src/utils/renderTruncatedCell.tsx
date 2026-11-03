import { Box, Tooltip } from "@mui/material";
import type { GridRenderCellParams } from "@mui/x-data-grid";

const renderTruncatedCell = (params: GridRenderCellParams) => {
  const value = params.value == null ? "-" : String(params.value);
  const isLongValue = value.length > 35;

  return (
    <Tooltip title={isLongValue ? value : ""}>
      <Box
        sx={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          width: "100%",
        }}
      >
        {value}
      </Box>
    </Tooltip>
  );
};

export default renderTruncatedCell;
