import AnalyzeButton from "@/sections/analysis/panelHeader/analyzeButton";
import ProtectedRoute from "@/components/ProtectedRoute";
import AnalysisPageLayout from "@/sections/analysis/AnalysisPageLayout";
import AnalysisPanelTabs from "@/sections/analysis/AnalysisPanelTabs";
import AnalysisBottomNav from "@/sections/analysis/panel/AnalysisBottomNav";
import ReportTabPanel from "@/sections/analysis/panel/ReportTabPanel";
import AnalysisTabPanel from "@/sections/analysis/panel/AnalysisTabPanel";
import SettingsTabPanel from "@/sections/analysis/panel/SettingsTabPanel";
import AnalysisTour from "@/sections/onboarding/AnalysisTour";
import { PageTitle } from "@/components/pageTitle";
import { useAnalysisSession } from "@/hooks/useAnalysisSession";
import { useAtomValue } from "jotai";
import { gameEvalAtom } from "@/sections/analysis/states";
import { useCallback, useState } from "react";
import type { AnalysisTabId } from "@/sections/analysis/AnalysisPanelTabs";

function AnalysisPage() {
  useAnalysisSession();
  const gameEval = useAtomValue(gameEvalAtom);
  const [activeTab, setActiveTab] = useState<AnalysisTabId>("report");

  const handleTourTabChange = useCallback((tab: "report" | "engine") => {
    setActiveTab(tab);
  }, []);

  return (
    <>
      <PageTitle title="Game Analysis — VoltChess" />

      <AnalyzeButton />

      <AnalysisTour onTabChange={handleTourTabChange} />

      <AnalysisPageLayout useTabs panelFooter={<AnalysisBottomNav />}>
        <AnalysisPanelTabs
          defaultTab="report"
          activeTab={activeTab}
          onActiveTabChange={setActiveTab}
          tabs={[
            {
              id: "report",
              label: "Report",
              tourId: "report-tab",
              icon: "mdi:clipboard-text",
              content: (
                <ReportTabPanel onOpenAnalysis={() => setActiveTab("engine")} />
              ),
            },
            {
              id: "engine",
              label: "Analysis",
              tourId: "analysis-tab",
              icon: "mdi:magnify",
              show: !!gameEval,
              scrollable: false,
              content: <AnalysisTabPanel />,
            },
            {
              id: "settings",
              label: "Settings",
              icon: "mdi:cog-outline",
              content: <SettingsTabPanel />,
            },
          ]}
        />
      </AnalysisPageLayout>
    </>
  );
}

export default function ProtectedAnalysis() {
  return (
    <ProtectedRoute>
      <AnalysisPage />
    </ProtectedRoute>
  );
}
