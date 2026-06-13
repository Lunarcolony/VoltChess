import AnalysisPageLayout from "@/sections/analysis/AnalysisPageLayout";
import AnalysisPanelTabs from "@/sections/analysis/AnalysisPanelTabs";
import AnalysisBottomNav from "@/sections/analysis/panel/AnalysisBottomNav";
import ReportTabPanel from "@/sections/analysis/panel/ReportTabPanel";
import AnalysisTabPanel from "@/sections/analysis/panel/AnalysisTabPanel";
import SettingsTabPanel from "@/sections/analysis/panel/SettingsTabPanel";
import AnalyzeButton from "@/sections/analysis/panelHeader/analyzeButton";
import { gameEvalAtom } from "@/sections/analysis/states";
import { PageTitle } from "@/components/pageTitle";
import { useAnalysisSession } from "@/hooks/useAnalysisSession";
import { useAtomValue } from "jotai";
import { useMemo } from "react";

function ReanalysisPage() {
  useAnalysisSession();
  const gameEval = useAtomValue(gameEvalAtom);

  const tabs = useMemo(
    () => [
      {
        id: "report" as const,
        label: "Report",
        icon: "mdi:clipboard-text",
        content: <ReportTabPanel />,
      },
      {
        id: "engine" as const,
        label: "Analysis",
        icon: "mdi:magnify",
        show: !!gameEval,
        scrollable: false,
        content: <AnalysisTabPanel />,
      },
      {
        id: "settings" as const,
        label: "Settings",
        icon: "mdi:cog-outline",
        content: <SettingsTabPanel />,
      },
    ],
    [gameEval]
  );

  return (
    <>
      <PageTitle title="Game Review — VoltChess" />

      <AnalyzeButton />

      <AnalysisPageLayout useTabs panelFooter={<AnalysisBottomNav />}>
        <AnalysisPanelTabs defaultTab="report" tabs={tabs} />
      </AnalysisPageLayout>
    </>
  );
}

export default ReanalysisPage;
