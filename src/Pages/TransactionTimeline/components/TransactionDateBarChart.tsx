// import React from "react";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
//   LabelList,
// } from "recharts";
// import { Box } from "@mui/material";

// interface RawChartData {
//   first_at: string;
//   last_at: string;
//   total: number | string;
//   succeededPercent: number | string;
//   created?: string;
// }

// interface DateBarChartProps {
//   data: RawChartData[];
// }

// const TransactionDateChart: React.FC<DateBarChartProps> = ({ data }) => {
//   // chart data
//   const formattedData = Array.isArray(data)
//     ? data.map((item) => {
//         const dateLabel = item.first_at?.split(" ")[0] || "N/A";
//         const createdMonth = item.created || "";
//         return {
//           date: dateLabel,
//           total: Number(item.total) || 0,
//           succeededPercent: isNaN(Number(item.succeededPercent)),
//           created: createdMonth,
//         };
//       })
//     : [];

//   return (
//     <Box sx={{ p: 3 }}>
//       <ResponsiveContainer width="100%" height={400}>
//         <BarChart
//           data={formattedData}
//           margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
//         >
//           <CartesianGrid strokeDasharray="3 3" />
//           <XAxis
//             dataKey="date"
//             interval={4}
//             tickFormatter={(tick) => (tick === "N/A" ? "" : tick)}
//           />
//           <YAxis yAxisId="left" />
//           <YAxis
//             yAxisId="right"
//             orientation="right"
//             domain={[0, 1]}
//             tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
//           />
//           <Tooltip
//             formatter={(value: number, name: string) =>
//               name === "SUCCEEDED%" ? `${(value * 100).toFixed(2)}%` : value
//             }
//           />
//           <Legend />
//           <Bar
//             yAxisId="right"
//             dataKey="succeededPercent"
//             fill="#f5a623"
//             name="SUCCEEDED%"
//           >
//             <LabelList
//               dataKey="succeededPercent"
//               position="top"
//               formatter={(val: any) => `${(val * 100).toFixed(2)}%`}
//             />
//           </Bar>

//           <Bar yAxisId="left" dataKey="total" fill="#2f5597" name="TOTAL">
//             <LabelList
//               dataKey="total"
//               position="top"
//               formatter={(val:any) => val.toLocaleString()}
//             />
//           </Bar>
//         </BarChart>
//       </ResponsiveContainer>
//     </Box>
//   );
// };

// export default TransactionDateChart;
