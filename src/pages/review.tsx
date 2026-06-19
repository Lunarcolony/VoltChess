import AnalysisPageLayout from "@/sections/analysis/AnalysisPageLayout";
import AnalysisPanelTabs from "@/sections/analysis/AnalysisPanelTabs";
import AnalysisBottomNav from "@/sections/analysis/panel/AnalysisBottomNav";
import ReportViewerPanel from "@/sections/analysis/panel/ReportViewerPanel";
import { PageTitle } from "@/components/pageTitle";
import { useAnalysisSession } from "@/hooks/useAnalysisSession";
import { useCurrentPosition } from "@/sections/analysis/hooks/useCurrentPosition";

/**
 * Read-only game report viewer. Same UI as the analysis page, but it only
 * displays a synced game's saved report and per-move classifications — there is
 * no Stockfish engine, no analysis, and no re-analysis. Stepping through the
 * moves shows each move's saved classification.
 */
function ReviewPage() {
  // Loads the game (and its saved eval) from ?gameId=.
  useAnalysisSession();
  // Populates the current position (incl. saved move classification) as the
  // user navigates — passing `null` guarantees no engine is ever created.
  useCurrentPosition(null);

  return (
    <>
      <PageTitle title="Game Report — VoltChess" />

      <AnalysisPageLayout useTabs panelFooter={<AnalysisBottomNav />}>
        <AnalysisPanelTabs
          defaultTab="report"
          tabs={[
            {
              id: "report",
              label: "Report",
              icon: "mdi:clipboard-text",
              content: <ReportViewerPanel />,
            },
          ]}
        />
      </AnalysisPageLayout>
    </>
  );
}

export default ReviewPage;
