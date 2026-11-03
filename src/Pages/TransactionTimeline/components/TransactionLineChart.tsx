// import React, { useEffect } from "react";
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
// } from "recharts";
// import { Box } from "@mui/material";

// interface ChartData {
//   "api name": string;
//   total: number | string;
//   "succeeded count": number | string;
//   "Succeeded%": string;
//   approval: string;
//   eligibility: string;
//   claim: string;
//   pull: string;
//   communication: string;
//   time_s: string;
// }

// interface TransactionLineChartProps {
//   data: ChartData[];
// }


// const TransactionLineChart: React.FC<TransactionLineChartProps> = ({ data }) => {

//   const chartData = data
//     .filter((item) => Number(item.total) > 0)
//     .map((item) => ({
//       NAME: item["api name"],
//       TOTAL: Number(item.total),
//       SUCCEEDED: isNaN(Number(item["Succeeded%"])) ? 0 : Number(item["Succeeded%"]),
//       APPROVAL: Number(item["approval"]) || 0,
//       ELIGIBILITY: Number(item["eligibility"]) || 0,
//       CLAIM: Number(item["claim"]) || 0,
//       PULL: Number(item["pull"]) || 0,
//       COMMUNICATION: Number(item["communication"]) || 0,
//       "TIME S": Number(item["time_s"]) || 0,
//     }));

//   return (
//     <Box sx={{ p: 3 }}>
//       <ResponsiveContainer width="100%" height={400}>
//         <LineChart
//           data={chartData}
//           margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
//         >
//           <CartesianGrid strokeDasharray="3 3" />
//           <XAxis dataKey="NAME" />
//           <YAxis allowDecimals={true} />
//           <Tooltip />
//           <Legend />
//           <Line type="monotone" dataKey="TOTAL" stroke="#8884d8" />
//           <Line type="monotone" dataKey="SUCCEEDED" stroke="#82ca9d" />
//           <Line type="monotone" dataKey="APPROVAL" stroke="#f7b731" />
//           <Line type="monotone" dataKey="ELIGIBILITY" stroke="#eb3b5a" />
//           <Line type="monotone" dataKey="CLAIM" stroke="#20c997" />
//           <Line type="monotone" dataKey="PULL" stroke="#4caf50" />
//           <Line type="monotone" dataKey="COMMUNICATION" stroke="#feca57" />
//           <Line type="monotone" dataKey="TIME S" stroke="#a29bfe" />
//         </LineChart>
//       </ResponsiveContainer>
//     </Box>
//   );
// };

// export default TransactionLineChart;
