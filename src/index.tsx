import { withNeededDependencies } from './components/withNeededDependencies';
import Dashboard from './Pages/Dashboard/Dashboard';
import TransActionAnalysis from './Pages/TransActionAnalysis/TransActionAnalysis';
import TransactionTimeline from './Pages/TransactionTimeline/TransactionTimeline';
import TransMonitor from './Pages/TransMonitor/TransMonitor';
import { TransMonitorProvider } from './Pages/TransMonitor/Context/TransMonitorContext';
import ValidationDashboard from './Pages/ValidationDashboard/ValidationDashboard';
import { ValidationDashboardProvider } from './Pages/ValidationDashboard/ValidationDashboardContext';

// ================================================================= Exported Pages

function ValidationDashboardWithContext() {
  return (
    <ValidationDashboardProvider>
      <ValidationDashboard />
    </ValidationDashboardProvider>
  );
}

function TransMonitorWithContext() {
  return (
    <TransMonitorProvider>
      <TransMonitor />
    </TransMonitorProvider>
  );
}

export const DashboardPage = withNeededDependencies(Dashboard);
export const TransActionAnalysisPage = withNeededDependencies(TransActionAnalysis);
export const TransactionTimelinePage = withNeededDependencies(TransactionTimeline);
export const TransMonitorPage = withNeededDependencies(TransMonitorWithContext);
export const ValidationDashboardPage = withNeededDependencies(
  ValidationDashboardWithContext,
);

// ================================================================= Exported Viewers

export { FhirViewer } from './components/FhirViewer';
export { HL7Viewer } from './components/HL7Viewer';
