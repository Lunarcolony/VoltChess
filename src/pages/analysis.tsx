import { Typography } from "@mui/material";
import PanelToolBar from "@/sections/analysis/panelToolbar";
import AnalysisTab from "@/sections/analysis/panelBody/analysisTab/accuracy";
import AnalyzeButton from "@/sections/analysis/panelHeader/analyzeButton";
import ClassificationTab from "@/sections/analysis/panelBody/classificationTab/report";
import LoadGame from "@/sections/analysis/panelHeader/loadGame";
import ProtectedRoute from "@/components/ProtectedRoute";
import AnalysisPageLayout from "@/sections/analysis/AnalysisPageLayout";
import EvaluationProgress from "@/sections/analysis/EvaluationProgress";
import EvaluationGraphSection from "@/sections/analysis/EvaluationGraphSection";
import AnalysisStatusBar from "@/sections/analysis/AnalysisStatusBar";
import AnalysisEmptyState from "@/sections/analysis/AnalysisEmptyState";
import { PageTitle } from "@/components/pageTitle";
import { useAnalysisSession } from "@/hooks/useAnalysisSession";

function AnalysisPage() {
  useAnalysisSession();

  return (
    <>
      <PageTitle title="Game Analysis — VoltChess" />

      <Typography variant="h2" sx={{ mb: { xs: 1.5, sm: 2 } }}>
        Game Analysis
      </Typography>

      <AnalysisPageLayout
        panelPinned={
          <>
            <EvaluationProgress />
            <EvaluationGraphSection sticky={false} />
          </>
        }
        panelFooter={<PanelToolBar key="analysis-toolbar" />}
      >
        <LoadGame />
        <AnalysisStatusBar />
        <AnalyzeButton />
        <AnalysisEmptyState />
        <AnalysisTab />
        <ClassificationTab />
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
