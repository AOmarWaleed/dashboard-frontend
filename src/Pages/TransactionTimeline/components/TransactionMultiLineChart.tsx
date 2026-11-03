// import React from "react";
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

// interface TransactionMultiLineChartProps {
//   data: any[];
// }

// const TransactionMultiLineChart: React.FC<TransactionMultiLineChartProps> = ({ data }) => {
//     const chartData = data
//     .filter((item) => Number(item.total) > 0)
//     .map((item) => ({
//       HOUR: item["hour"],
//       DATE: new Date(item["Created"]),
//       TOTAL: Number(item.total),
//       SUCCEEDED: isNaN(Number(item["Succeeded%"])) ? 0 : Number(item["Succeeded%"]),
//       APPROVAL: Number(item["approval"]) || 0,
//       ELIGIBILITY: Number(item["eligibility"]) || 0,
//       CLAIM: Number(item["claim"]) || 0,
//       PULL: Number(item["pull"]) || 0,
//       COMMUNICATION: Number(item["communication"]) || 0,
//       "TIME S": Number(item["time_s"]) || 0,
//     }));

//     const COLORS = {
//         TOTAL: "#2f4b7c",
//         APPROVAL: "#50C878",
//         ELIGIBILITY: "#d45087",
//         CLAIM: "#0b9aff",
//         PULL: "#2ca02c",
//         COMMUNICATION: "#ffcc00",
//         TIME_S: "#ab63fa",
//       };

//       return (
//         <ResponsiveContainer width="100%" height={500}>
//           <LineChart data={chartData} margin={{ top: 30, right: 40, left: 10, bottom: 5 }}>
//             <CartesianGrid strokeDasharray="3 3" />
            
//             {/* X-Axis with Hour */}
//             <XAxis dataKey="HOUR" label={{ value: "Hour", position: "insideBottomRight", offset: -5 }} />
//             <XAxis dataKey="DATE" label={{ value: "Date", position: "insideBottomRight", offset: -5 }} />

            
//             {/* Left Y-Axis: for counts */}
//             <YAxis yAxisId="left" />
            
//             {/* Right Y-Axis: for TIME_S (seconds) */}
//             <YAxis dataKey="TIME S" yAxisId="right" orientation="right" domain={[0, 3.5]} label={{ value: "Time (s)", angle: -90, position: "insideRight" }} />
            
//             <Tooltip />
//             <Legend verticalAlign="top" />
    
//             {/* Lines */}
//             <Line yAxisId="left" type="monotone" dataKey="TOTAL" stroke={COLORS.TOTAL} dot={true} />
//             <Line yAxisId="left" type="monotone" dataKey="SUCCEEDED" stroke={COLORS.PULL} dot={true} />

//             <Line yAxisId="left" type="monotone" dataKey="APPROVAL" stroke={COLORS.APPROVAL} dot={true} />
//             <Line yAxisId="left" type="monotone" dataKey="ELIGIBILITY" stroke={COLORS.ELIGIBILITY} dot={true} />
//             <Line yAxisId="left" type="monotone" dataKey="CLAIM" stroke={COLORS.CLAIM} dot={true} />


//             {/* <Line yAxisId="left" type="monotone" dataKey="PULL" stroke={COLORS.PULL} dot={true} /> */}
//             {/* <Line yAxisId="left" type="monotone" dataKey="COMMUNICATION" stroke={COLORS.COMMUNICATION} dot={true} /> */}
//             {/* <Line yAxisId="right" type="monotone" dataKey="TIME S" stroke={COLORS.TIME_S} strokeWidth={2} dot={true} /> */}
//           </LineChart>
//         </ResponsiveContainer>
//       );
// };

// export default TransactionMultiLineChart;
