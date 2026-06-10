import AnalyzeButton from "@/sections/analysis/panelHeader/analyzeButton";
import ProtectedRoute from "@/components/ProtectedRoute";
import AnalysisPageLayout from "@/sections/analysis/AnalysisPageLayout";
import AnalysisPanelTabs from "@/sections/analysis/AnalysisPanelTabs";
import AnalysisBottomNav from "@/sections/analysis/panel/AnalysisBottomNav";
import ReportTabPanel from "@/sections/analysis/panel/ReportTabPanel";
import AnalysisTabPanel from "@/sections/analysis/panel/AnalysisTabPanel";
import SettingsTabPanel from "@/sections/analysis/panel/SettingsTabPanel";
import { PageTitle } from "@/components/pageTitle";
import { useAnalysisSession } from "@/hooks/useAnalysisSession";
import { useAtomValue } from "jotai";
import { gameEvalAtom } from "@/sections/analysis/states";

function AnalysisPage() {
  useAnalysisSession();
  const gameEval = useAtomValue(gameEvalAtom);

  return (
    <>
      <PageTitle title="Game Analysis — VoltChess" />

      <AnalyzeButton />

      <AnalysisPageLayout useTabs panelFooter={<AnalysisBottomNav />}>
        <AnalysisPanelTabs
          defaultTab="report"
          tabs={[
            {
              id: "report",
              label: "Report",
              icon: "mdi:clipboard-text",
              content: <ReportTabPanel />,
            },
            {
              id: "engine",
              label: "Analysis",
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
