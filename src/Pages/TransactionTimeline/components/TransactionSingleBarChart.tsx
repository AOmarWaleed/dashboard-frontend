// import React from "react";
// import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from "recharts";
// import { Box, Typography } from "@mui/material";

// interface TransactionSingleBarChartProps {
//   data: any;
// }


// const TransactionSingleBarChart: React.FC<TransactionSingleBarChartProps> = ({ data }) => {
//   const chartData = data
//     .filter((item: any) => Number(item.total) > 0)
//     .map((item: any) => ({
//       NAME: item["api name"],
//       TOTAL: Number(item.total),
//       SUCCEEDED: isNaN(Number(item["Succeeded%"])) ? 0 : Number(item["Succeeded%"]),
//       ERROR: isNaN(Number(item["Error%"])) ? 0 : Number(item["Error%"]),
//       FAILED: isNaN(Number(item["Failed%"])) ? 0 : Number(item["Failed%"]),

//       APPROVAL: Number(item["approval"]) || 0,
//       ELIGIBILITY: Number(item["eligibility"]) || 0,
//       CLAIM: Number(item["claim"]) || 0,
//       PULL: Number(item["pull"]) || 0,
//       COMMUNICATION: Number(item["communication"]) || 0,
//       "TIME S": Number(item["time_s"]) || 0,
//     }));

//   const colors = {
//     succeeded: "#4caf50", // green
//     error: "#f44336",     // red
//     failed: "#ff9800",    // orange
//   };

//   return (
//     <Box sx={{ p: 3 }}>
//     <ResponsiveContainer width="105%" height={400}>
  
//       <BarChart
//         data={chartData}
//         margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
//       >
//         <CartesianGrid strokeDasharray="3 3" />
        
//         <XAxis dataKey="NAME" angle={-45} textAnchor="end" interval={0} height={60} />
        
//         <YAxis domain={[0, 100]} />
//         <Tooltip />
//         <Legend />
//         <Bar dataKey="SUCCEEDED" stackId="a" fill={colors.succeeded} barSize={30} />
//         <Bar dataKey="ERROR" stackId="a" fill={colors.error} barSize={30} />
//         <Bar dataKey="FAILED" stackId="a" fill={colors.failed} barSize={30} />
//       </BarChart>
//       </ResponsiveContainer>
//     </Box>
//   );
// };

// export default TransactionSingleBarChart;
