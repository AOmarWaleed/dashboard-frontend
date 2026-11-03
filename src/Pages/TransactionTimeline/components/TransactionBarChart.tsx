// import React from "react";
// import {
//   ComposedChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
// } from "recharts";
// import { Box, Typography } from "@mui/material";

// interface ChartData {
//   api_name: string;
//   total: number | string;
//   succeeded_count: number | string;
// }

// interface TransactionBarChartProps {
//   data: ChartData[];
// }

// type P = {
//   dataKey: "Total" | "Succeeded" | "SucceededPercent";
//   value: number;
//   payload: any;
// }[];

// const TransactionBarChart: React.FC<TransactionBarChartProps> = ({ data }) => {
//   // Handle case where data might be undefined or null
//   const safeData = data || [];

//   // Filter and simplify the data to show only APIs with some total > 0
//   const chartData = safeData
//     .filter((item) => item && Number(item.total) > 0)
//     .map((item) => ({
//       name: item.api_name,
//       Total: Number(item.total),
//       Succeeded: Number(item.succeeded_count),
//       SucceededPercent:
//         Number(item.total) > 0
//           ? Number(item.succeeded_count) / Number(item.total)
//           : 0,
//     }));

//   // Custom tooltip to show Succeeded value
//   const CustomTooltip = ({
//     active,
//     payload,
//     label,
//   }: {
//     active?: boolean;
//     payload?: P;
//     label?: string;
//   }) => {
//     if (active && payload && payload.length) {
//       const totalValue = payload.find((p) => p.dataKey === "Total")?.value || 0;
//       const succeededValue =
//         payload.find((p) => p.dataKey === "Succeeded")?.value || 0;
//       const percentValue =
//         payload.find((p) => p.dataKey === "SucceededPercent")?.value || 0;

//       return (
//         <Box
//           sx={{
//             backgroundColor: "#fff",
//             p: 2,
//             border: "1px solid #e5e7eb",
//             borderRadius: 1,
//             boxShadow: 2,
//           }}
//         >
//           <Typography variant="subtitle1" fontWeight="bold">
//             {label}
//           </Typography>
//           <Typography variant="body1" color="primary">
//             {`Total: ${totalValue}`}
//           </Typography>
//           <Typography variant="body1" sx={{ color: "#f97316" }}>
//             {`Succeeded Count: ${succeededValue}`}
//           </Typography>
//           <Typography
//             variant="body1"
//             sx={{ color: "#16a34a", fontWeight: 600 }}
//           >
//             {`Success: ${(percentValue * 100).toFixed(1)}%`}
//           </Typography>
//         </Box>
//       );
//     }
//     return null;
//   };

//   return (
//     <Box sx={{ p: 3 }}>
//       <ResponsiveContainer width="105%" height={400}>
//         <ComposedChart
//           data={chartData}
//           margin={{
//             right: 30,
//             left: 20,
//             bottom: 5,
//           }}
//         >
//           <CartesianGrid strokeDasharray="3 3" />
//           <XAxis dataKey="name" />
//           <YAxis
//             yAxisId="left"
//             orientation="left"
//             allowDecimals={false}
//             label={{ angle: -90, position: "insideLeft" }}
//           />
//           <YAxis
//             yAxisId="right"
//             orientation="right"
//             domain={[0, 1]}
//             tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
//             label={{ angle: 90, position: "insideRight" }}
//           />
//           <Tooltip content={<CustomTooltip />} />
//           <Legend />
//             <Bar yAxisId="left" dataKey="Total" fill="#8884d8" name="TOTAL" />
//             <Bar
//               yAxisId="right"
//               dataKey="SucceededPercent"
//               fill="#16a34a"
//               name="SUCCESS"
//             />
//             <Bar
//               yAxisId="left"
//               dataKey="Succeeded"
//               fill="#f97316"
//               name="Count"
//             />
//         </ComposedChart>
//       </ResponsiveContainer>
//     </Box>
//   );
// };

// export default TransactionBarChart;
