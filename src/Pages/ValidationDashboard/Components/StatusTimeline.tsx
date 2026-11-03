import { Box } from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { TimelineChartProps } from "./timelineTypes";

const StatusTimeline = ({ chartData, dataKey }: TimelineChartProps) => {
  const COLORS = {
    RED: "#FF0000",
    GREEN: "#00FF00",
    BLUE: "#0000FF",
    ORANGE: "#FFA500",
  };

  const maxLabels = 24;
  const xAxisInterval =
    chartData.length > maxLabels
      ? Math.ceil(chartData.length / maxLabels) - 1
      : 0;

  return (
    <Box
      sx={{
        flex: 1,
        p: 2,
        borderRadius: 2,
        boxShadow: 2,
        height: "480px",
        maxHeight: "480px",
      }}
    >
      <Box sx={{ p: 3 }}>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={chartData}
            margin={{ top: 30, right: 40, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey={dataKey}
              interval={xAxisInterval}
              label={{
                value: dataKey,
                position: "insideBottomRight",
                offset: 0,
              }}
              angle={-45}
              textAnchor="end"
              height={100}
            />

            {/* Left Y-Axis: for counts */}

            <YAxis
              yAxisId="left"
              label={{
                value: "status",
                angle: -90,
                position: "insideLeft",
              }}
              stroke="#000000"
              domain={[0, "auto"]}
              tickCount={6}
            />
            <Tooltip />
            <Legend verticalAlign="top" />

            <Line
              yAxisId="left"
              type="monotone"
              dataKey="new"
              stroke={COLORS.RED}
              dot={true}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="recheck"
              stroke={COLORS.GREEN}
              dot={true}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="resolved"
              stroke={COLORS.BLUE}
              dot={true}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="ignore"
              stroke={COLORS.ORANGE}
              dot={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default StatusTimeline;
