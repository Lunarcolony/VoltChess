import PanelHeader from "@/sections/analysis/panelHeader";
import PanelToolBar from "@/sections/analysis/panelToolbar";
import AnalysisTab from "@/sections/analysis/panelBody/analysisTab/engine";
import ClassificationTab from "@/sections/analysis/panelBody/classificationTab/moves";
import {
  boardAtom,
  gameAtom,
  gameEvalAtom,
} from "@/sections/analysis/states";
import {
  Box,
  Divider,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useAtomValue } from "jotai";
import { useEffect, useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import { PageTitle } from "@/components/pageTitle";
import ProtectedRoute from "@/components/ProtectedRoute";
import AnalysisPageLayout from "@/sections/analysis/AnalysisPageLayout";
import EvaluationProgress from "@/sections/analysis/EvaluationProgress";
import EvaluationGraphSection from "@/sections/analysis/EvaluationGraphSection";
import { palette } from "@/theme/voltchessTheme";

function ReanalysisPage() {
  const theme = useTheme();
  const [tab, setTab] = useState(0);
  const isMdOrGreater = useMediaQuery(theme.breakpoints.up("md"));

  const gameEval = useAtomValue(gameEvalAtom);
  const game = useAtomValue(gameAtom);
  const board = useAtomValue(boardAtom);

  const showMovesTab = game.history().length > 0 || board.history().length > 0;

  useEffect(() => {
    if (tab === 1 && !showMovesTab) setTab(0);
  }, [showMovesTab, gameEval, tab]);

  const tabs = useMemo(
    () => [
      { label: "Engine", icon: "mdi:magnify", show: true },
      { label: "Moves", icon: "mdi:format-list-bulleted", show: showMovesTab },
    ],
    [showMovesTab]
  );

  return (
    <>
      <PageTitle title="Game Review — VoltChess" />

      <Typography variant="h2" sx={{ mb: { xs: 1.5, sm: 2 } }}>
        Game Review
      </Typography>

      <AnalysisPageLayout
        panelPinned={
          <>
            <EvaluationProgress />
            <EvaluationGraphSection sticky={false} />
          </>
        }
        panelFooter={isMdOrGreater ? <PanelToolBar /> : undefined}
      >
        {!isMdOrGreater && (
          <Box sx={{ mb: 2 }}>
            <PanelToolBar />
            <Divider sx={{ my: 2, borderColor: palette.borderSubtle }} />
          </Box>
        )}

        <PanelHeader />

        {!isMdOrGreater && (
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="fullWidth"
            sx={{
              mb: 2,
              minHeight: 40,
              borderBottom: `1px solid ${palette.border}`,
              "& .MuiTab-root": {
                minHeight: 40,
                py: 1,
                fontSize: "0.8rem",
                color: palette.textMuted,
                "&.Mui-selected": { color: palette.accent },
              },
            }}
          >
            {tabs.map(
              (t, idx) =>
                t.show && (
                  <Tab
                    key={t.label}
                    label={t.label}
                    icon={<Icon icon={t.icon} width={16} />}
                    iconPosition="start"
                    id={`tab${idx}`}
                  />
                )
            )}
          </Tabs>
        )}

        <AnalysisTab
          role="tabpanel"
          hidden={tab !== 0 && !isMdOrGreater}
          id="tabContent0"
        />

        {isMdOrGreater && (
          <Divider sx={{ my: 2, borderColor: palette.borderSubtle }} />
        )}

        <ClassificationTab
          role="tabpanel"
          hidden={tab !== 1 && !isMdOrGreater}
          id="tabContent1"
        />
      </AnalysisPageLayout>

      {!isMdOrGreater && (
        <Box sx={{ mt: 2, maxWidth: 520, mx: "auto", width: "100%" }}>
          <PanelToolBar />
        </Box>
      )}
    </>
  );
}

export default function ProtectedReanalysis() {
  return (
    <ProtectedRoute>
      <ReanalysisPage />
    </ProtectedRoute>
  );
}
