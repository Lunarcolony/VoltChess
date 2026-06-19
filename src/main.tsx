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
import PlatformSyncOrchestrator from "./components/PlatformSyncOrchestrator";
import { loadApiConfig } from "./config/apiUrl";
import { syncEngineSettingsDefaults } from "./lib/syncEngineSettingsDefaults";

syncEngineSettingsDefaults();

const queryClient = new QueryClient();

async function bootstrap() {
  await loadApiConfig();

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <LocalGameMigrationPrompt />
            <PlatformSyncOrchestrator />
            <App />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

void bootstrap();
