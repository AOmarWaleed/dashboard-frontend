import { Box, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { GlCustomTable } from "@givc/shared-components";
import { fetcher } from "../../../api";

interface GenericTableProps<T extends Record<string, unknown>> {
  title?: string;
  url: string;
  params?: Record<string, unknown>;
  columns: GridColDef[];
  getRowId?: (row: T) => string | number;
}

function GenericTable<T extends Record<string, unknown>>({
  title,
  url,
  params,
  columns,
  getRowId,
}: GenericTableProps<T>) {
  return (
    <Box sx={{ p: 2 }}>
      <Box>
        {title && (
          <Typography variant="h5" sx={{ mb: 3, mt: 3, fontWeight: 600 }}>
            {title}
          </Typography>
        )}
        <GlCustomTable
          // key={JSON.stringify(params)}
          url={url}
          params={params}
          columns={columns}
          fetcher={fetcher}
          clientPagination
          limit={10}
          getRowId={getRowId}
        />
      </Box>
    </Box>
  );
};

export default GenericTable;
