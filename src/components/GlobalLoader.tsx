import { Box, CircularProgress } from "@mui/material";

const GlobalLoader = () => {
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.25)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999999,
      }}
    >
      <CircularProgress />
    </Box>
  );
};

export default GlobalLoader;
