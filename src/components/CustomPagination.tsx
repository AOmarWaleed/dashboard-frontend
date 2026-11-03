import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Box, IconButton, TextField } from "@mui/material";
import type { TablePaginationProps } from "@mui/material";
import { useGridApiContext } from "@mui/x-data-grid";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import LastPageIcon from "@mui/icons-material/LastPage";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

type CustomPaginationProps = Partial<TablePaginationProps> & {
  rightSide?: boolean;
};

export const CustomPagination = (props: CustomPaginationProps) => {
  const { rightSide = true } = props;
  const apiRef = useGridApiContext();
  const [pageInput, setPageInput] = useState("");

  const getPaginationValues = () => {
    if (!apiRef.current) {
      return { page: 0, pageCount: 1, pageSize: 19, rowCount: 0 };
    }

    try {
      const paginationModel = apiRef.current.state.pagination.paginationModel;
      const rowCount = apiRef.current.getRowsCount();
      const pageCount = Math.max(
        1,
        Math.ceil(rowCount / paginationModel.pageSize),
      );

      return {
        page: paginationModel.page,
        pageCount,
        pageSize: paginationModel.pageSize,
        rowCount,
      };
    } catch {
      return { page: 0, pageCount: 1, pageSize: 19, rowCount: 0 };
    }
  };

  const paginationState = getPaginationValues();

  const handleFirstPage = () => {
    apiRef.current?.setPage(0);
  };

  const handleLastPage = () => {
    apiRef.current?.setPage(Math.max(0, paginationState.pageCount - 1));
  };

  const handlePageInput = (e: ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageSubmit = (e: FormEvent) => {
    e.preventDefault();
    const page = parseInt(pageInput, 10) - 1;

    if (
      !isNaN(page) &&
      page >= 0 &&
      page < paginationState.pageCount &&
      apiRef.current
    ) {
      apiRef.current.setPage(page);
    }
    setPageInput("");
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        width: !rightSide ? "100%" : "auto",
      }}
    >
      <IconButton
        onClick={handleFirstPage}
        disabled={paginationState.page === 0}
        size="small"
      >
        <FirstPageIcon sx={{ fontSize: "15px" }} />
      </IconButton>

      <IconButton
        onClick={() => apiRef.current?.setPage(paginationState.page - 1)}
        disabled={paginationState.page === 0}
        size="small"
      >
        <ChevronLeftIcon sx={{ fontSize: "15px" }} />
      </IconButton>

      <form onSubmit={handlePageSubmit}>
        <TextField
          size="small"
          value={pageInput}
          onChange={handlePageInput}
          placeholder={`${paginationState.page + 1}`}
          inputProps={{
            style: { width: "50px", textAlign: "center", padding: "5px 0px" },
            type: "number",
            min: 1,
            max: paginationState.pageCount,
          }}
        />
      </form>

      <span style={{ padding: "0px 5px", fontSize: "0.875rem" }}>
        of {paginationState.pageCount}
      </span>

      <IconButton
        onClick={() => apiRef.current?.setPage(paginationState.page + 1)}
        disabled={paginationState.page >= paginationState.pageCount - 1}
        size="small"
      >
        <ChevronRightIcon sx={{ fontSize: "15px" }} />
      </IconButton>

      <IconButton
        onClick={handleLastPage}
        disabled={paginationState.page >= paginationState.pageCount - 1}
        size="small"
      >
        <LastPageIcon sx={{ fontSize: "15px" }} />
      </IconButton>
    </Box>
  );
};
