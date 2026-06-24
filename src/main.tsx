import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import LocalGameMigrationPrompt from "./components/LocalGameMigrationPrompt";
import { AnalysisQueueProvider } from "./contexts/AnalysisQueueContext";
import { loadApiConfig } from "./config/apiUrl";
import { syncEngineSettingsDefaults } from "./lib/syncEngineSettingsDefaults";
import { debug, initDebugConsole } from "./lib/debug";

initDebugConsole();
syncEngineSettingsDefaults();

const queryClient = new QueryClient();

queryClient.getQueryCache().subscribe((event) => {
  if (event.type !== "updated") return;
  const q = event.query;
  debug.log("query", "react-query updated", {
    queryKey: q.queryKey,
    status: q.state.status,
    fetchStatus: q.state.fetchStatus,
    isStale: q.isStale(),
    dataUpdatedAt: q.state.dataUpdatedAt
      ? new Date(q.state.dataUpdatedAt).toISOString()
      : null,
  });
});

async function bootstrap() {
  debug.log("bootstrap", "app bootstrap start");
  const apiUrl = await loadApiConfig();
  debug.log("bootstrap", "API config loaded", {
    apiUrl: apiUrl || "(same-origin proxy)",
  });

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <AnalysisQueueProvider>
              <LocalGameMigrationPrompt />
              <App />
            </AnalysisQueueProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>
  );
  debug.log("bootstrap", "React root rendered");
}

void bootstrap();
