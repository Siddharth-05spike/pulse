import { useState } from "react";

import AppShell from "./app/AppShell";
import Overview from "./pages/Overview";
import TelemetryPage from "./pages/TelemetryPage";
import DataExplorerPage from "./pages/DataExplorerPage";
import PerformancePage from "./pages/PerformancePage";

export type AppPage =
  | "overview"
  | "telemetry"
  | "explorer"
  | "performance";

export default function App() {
  const [activePage, setActivePage] =
    useState<AppPage>("overview");

  return (
    <AppShell
      activePage={activePage}
      onNavigate={setActivePage}
    >
      {activePage === "overview" && (
        <Overview
          onOpenExplorer={() =>
            setActivePage("explorer")
          }
        />
      )}

      {activePage === "telemetry" && (
        <TelemetryPage
          onOpenExplorer={() =>
            setActivePage("explorer")
          }
        />
      )}

      {activePage === "explorer" && (
        <DataExplorerPage
          onBack={() =>
            setActivePage("overview")
          }
        />
      )}

      {activePage === "performance" && (
        <PerformancePage />
      )}
    </AppShell>
  );
}