import {
  Box,
  Typography,
  Grid2 as Grid,
  type SxProps,
  type Theme,
} from "@mui/material";

interface KpiCardProps {
  title: string;
  value: string | number | React.ReactNode;
  baseContainerSx?: SxProps<Theme>;
}

export default function KpiCard({
  title,
  value,
  baseContainerSx,
}: KpiCardProps) {
  return (
    <Box
      sx={{
        p: 2,
        height: 150,
        borderRadius: 2,
        boxShadow: 2,
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...baseContainerSx,
      }}
    >
      <Grid size={{ xs: 12, sm: 4 }}>
        <Typography
          variant="h6"
          sx={{ textAlign: "center", fontWeight: "bold", fontSize: "1.5rem" }}
        >
          {title}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            textAlign: "center",
            fontWeight: "bold",
            color: "primary.main",
            fontSize: "3rem",
          }}
        >
          {value}
        </Typography>
      </Grid>
    </Box>
  );
}
