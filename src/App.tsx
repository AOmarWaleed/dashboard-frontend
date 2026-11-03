import { useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ToastContainer } from "react-toastify";
import {
  Box,
  createTheme,
  CssBaseline,
  ThemeProvider,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import ValidationDashboard from "./Pages/ValidationDashboard/ValidationDashboard";
import { ValidationDashboardProvider } from "./Pages/ValidationDashboard/ValidationDashboardContext";
import TransActionAnalysis from "./Pages/TransActionAnalysis/TransActionAnalysis";
import TransactionTimeline from "./Pages/TransactionTimeline/TransactionTimeline";
import TransMonitor from "./Pages/TransMonitor/TransMonitor";
import { TransMonitorProvider } from "./Pages/TransMonitor/Context/TransMonitorContext";
import { HL7Viewer } from "./components/HL7Viewer";
import FhirViewer from "./components/FhirViewer";
import { TxtViewer } from "./components/TxtViewer";
import XmlViewer from "./components/XmlViewer";
import { JsonViewer } from "./components/JsonViewer";

type DevView =
  | "validation"
  | "transactionTimeline"
  | "transActionAnalysis"
  | "transMonitor"
  | "hl7Viewer"
  | "fhirViewer";

function App() {
  const theme = createTheme();
  const [view, setView] = useState<DevView>("transactionTimeline");

  return (
    <>
      <BrowserRouter>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <ToastContainer />
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ position: "fixed", bottom: 16, right: 16, zIndex: 9999 }}>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={view}
                onChange={(_, nextView: DevView | null) => {
                  if (nextView) setView(nextView);
                }}
              >
                <ToggleButton value="validation">Validation</ToggleButton>
                <ToggleButton value="transactionTimeline">
                  Transaction Timeline
                </ToggleButton>
                <ToggleButton value="transActionAnalysis">
                  TransAction Analysis
                </ToggleButton>
                <ToggleButton value="transMonitor">TransMonitor</ToggleButton>
                <ToggleButton value="hl7Viewer">HL7 Viewer</ToggleButton>
                <ToggleButton value="fhirViewer">FHIR Viewer</ToggleButton>
                <ToggleButton value="txtViewer">Txt Viewer</ToggleButton>
                <ToggleButton value="xmlViewer">XML Viewer</ToggleButton>
                <ToggleButton value="jsonViewer">JSON Viewer</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            {view === "validation" ? (
              <ValidationDashboardProvider>
                <ValidationDashboard />
              </ValidationDashboardProvider>
            ) : view === "transactionTimeline" ? (
              <TransactionTimeline />
            ) : view === "transActionAnalysis" ? (
              <TransActionAnalysis />
            ) : view === "transMonitor" ? (
              <TransMonitorProvider>
                <TransMonitor />
              </TransMonitorProvider>
            ) : view === "hl7Viewer" ? (
              <HL7Viewer />
            ) : view === "fhirViewer" ? (
              <FhirViewer />
            ) : view === "txtViewer" ? (
              <TxtViewer />
            ) : view === "xmlViewer" ? (
              <XmlViewer />
            ) : view === "jsonViewer" ? (
              <JsonViewer />
            ) : null}
          </ThemeProvider>
        </LocalizationProvider>
      </BrowserRouter>
    </>
  );
}   

export default App;
