import AnalysisPageLayout from "@/sections/analysis/AnalysisPageLayout";
import AnalysisPanelTabs from "@/sections/analysis/AnalysisPanelTabs";
import AnalysisBottomNav from "@/sections/analysis/panel/AnalysisBottomNav";
import ReportViewerPanel from "@/sections/analysis/panel/ReportViewerPanel";
import { PageTitle } from "@/components/pageTitle";
import { useAnalysisSession } from "@/hooks/useAnalysisSession";
import { useCurrentPosition } from "@/sections/analysis/hooks/useCurrentPosition";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { useRouter } from "@/hooks/useRouter";
import { useAtomValue } from "jotai";
import { gameEvalAtom } from "@/sections/analysis/states";
import { useEffect } from "react";
import { isServerGameId } from "@/lib/gameSync";

/**
 * Read-only report viewer for games that already have a saved eval.
 * Unanalyzed synced games redirect to /analysis so Stockfish runs in-browser.
 */
function ReviewPage() {
  useAnalysisSession();
  useCurrentPosition(null);
  const router = useRouter();
  const gameEval = useAtomValue(gameEvalAtom);
  const { serverGameFromUrl } = useGameDatabase();
  const gameId = router.query.gameId;

  useEffect(() => {
    if (typeof gameId !== "string" || !isServerGameId(gameId)) return;
    if (gameEval || serverGameFromUrl?.eval) return;
    if (!serverGameFromUrl) return;

    console.log(
      "[voltchess] unanalyzed game opened on /review — redirecting to /analysis"
    );
    void router.replace(`/analysis?gameId=${gameId}`);
  }, [gameId, gameEval, serverGameFromUrl, router]);

  return (
    <>
      <PageTitle title="Game Report — VoltChess" noindex />

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
