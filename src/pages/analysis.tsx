import AnalyzeButton from "@/sections/analysis/panelHeader/analyzeButton";
import AnalysisPageLayout from "@/sections/analysis/AnalysisPageLayout";
import AnalysisPanelTabs from "@/sections/analysis/AnalysisPanelTabs";
import AnalysisBottomNav from "@/sections/analysis/panel/AnalysisBottomNav";
import ReportTabPanel from "@/sections/analysis/panel/ReportTabPanel";
import AnalysisTabPanel from "@/sections/analysis/panel/AnalysisTabPanel";
import SettingsTabPanel from "@/sections/analysis/panel/SettingsTabPanel";
import GameAnalysisOverlay from "@/components/GameAnalysisOverlay";
import { PageTitle } from "@/components/pageTitle";
import { useAnalysisSession } from "@/hooks/useAnalysisSession";
import { useAtomValue } from "jotai";
import {
  evaluationProgressAtom,
  gameAtom,
  gameEvalAtom,
} from "@/sections/analysis/states";

function AnalysisPage() {
  useAnalysisSession();
  const game = useAtomValue(gameAtom);
  const gameEval = useAtomValue(gameEvalAtom);
  const progress = useAtomValue(evaluationProgressAtom);

  const gameLoaded =
    (!!game.getHeaders().White && game.getHeaders().White !== "?") ||
    game.history().length > 0;
  const reportTabScrollable = !!gameEval || progress > 0 || gameLoaded;

  return (
    <>
      <PageTitle title="Game Analysis — VoltChess" />

      <AnalyzeButton />

      <GameAnalysisOverlay />

      <AnalysisPageLayout useTabs panelFooter={<AnalysisBottomNav />}>
        <AnalysisPanelTabs
          defaultTab="report"
          tabs={[
            {
              id: "report",
              label: "Report",
              tourId: "report-tab",
              icon: "mdi:clipboard-text",
              scrollable: reportTabScrollable,
              content: <ReportTabPanel />,
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

export default AnalysisPage;
