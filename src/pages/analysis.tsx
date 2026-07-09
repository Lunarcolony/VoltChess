import AnalyzeButton from "@/sections/analysis/panelHeader/analyzeButton";
import AnalysisPageLayout from "@/sections/analysis/AnalysisPageLayout";
import AnalysisPanelTabs from "@/sections/analysis/AnalysisPanelTabs";
import AnalysisBottomNav from "@/sections/analysis/panel/AnalysisBottomNav";
import ReportTabPanel from "@/sections/analysis/panel/ReportTabPanel";
import AnalysisTabPanel from "@/sections/analysis/panel/AnalysisTabPanel";
import SettingsTabPanel from "@/sections/analysis/panel/SettingsTabPanel";
import AdvancedAnalysisTab from "@/sections/analysis/advanced/AdvancedAnalysisTab";
import ComputerAnalysisPanel from "@/sections/analysis/advanced/ComputerAnalysisPanel";
import MoveTimesPanel from "@/sections/analysis/advanced/MoveTimesPanel";
import ShareExportPanel from "@/sections/analysis/advanced/ShareExportPanel";
import AdvancedModeToggle from "@/sections/analysis/advanced/AdvancedModeToggle";
import KeyboardShortcutsDialog from "@/sections/analysis/advanced/KeyboardShortcutsDialog";
import { advancedModeAtom } from "@/sections/analysis/advanced/states";
import { useAdvancedKeyboard } from "@/sections/analysis/advanced/useAdvancedKeyboard";
import { computeMoveTimes } from "@/sections/analysis/advanced/moveTimes";
import GameAnalysisOverlay from "@/components/GameAnalysisOverlay";
import { PageTitle } from "@/components/pageTitle";
import { useAnalysisSession } from "@/hooks/useAnalysisSession";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
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
  const advancedMode = useAtomValue(advancedModeAtom);

  useAdvancedKeyboard(advancedMode);

  const gameLoaded =
    (!!game.getHeaders().White && game.getHeaders().White !== "?") ||
    game.history().length > 0;
  const reportTabScrollable = !!gameEval || progress > 0 || gameLoaded;

  const hasClockData = useMemo(
    () => advancedMode && computeMoveTimes(game).available,
    [advancedMode, game]
  );

  return (
    <>
      <PageTitle title="Game Analysis — VoltChess" />

      <AnalyzeButton />

      <GameAnalysisOverlay />

      <KeyboardShortcutsDialog />

      <AnalysisPageLayout
        useTabs
        panelHeader={<AdvancedModeToggle />}
        panelFooter={<AnalysisBottomNav />}
      >
        {advancedMode ? (
          <AnalysisPanelTabs
            key="advanced"
            defaultTab="engine"
            tabs={[
              {
                id: "engine",
                label: "Analysis",
                tourId: "analysis-tab",
                icon: "mdi:magnify",
                scrollable: false,
                content: <AdvancedAnalysisTab />,
              },
              {
                id: "report",
                label: "Report",
                tourId: "report-tab",
                icon: "mdi:clipboard-text",
                scrollable: reportTabScrollable,
                content: <ComputerAnalysisPanel />,
              },
              {
                id: "times",
                label: "Times",
                icon: "mdi:clock-outline",
                show: hasClockData,
                content: <MoveTimesPanel />,
              },
              {
                id: "export",
                label: "Export",
                icon: "mdi:share-variant",
                content: <ShareExportPanel />,
              },
              {
                id: "settings",
                label: "Settings",
                icon: "mdi:cog-outline",
                content: <SettingsTabPanel />,
              },
            ]}
          />
        ) : (
          <AnalysisPanelTabs
            key="standard"
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
        )}
      </AnalysisPageLayout>
    </>
  );
}

export default AnalysisPage;
