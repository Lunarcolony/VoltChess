import Board from "@/sections/analysis/board";
import PanelHeader from "@/sections/analysis/panelHeader";
import PanelToolBar from "@/sections/analysis/panelToolbar";
import AnalysisTab from "@/sections/analysis/panelBody/analysisTab/engine";
import ClassificationTab from "@/sections/analysis/panelBody/classificationTab/moves";
import GraphTab from "@/sections/analysis/panelBody/graphTab";
import { boardAtom, gameAtom, gameEvalAtom } from "@/sections/analysis/states";
import {
  Box,
  Divider,
  Grid2 as Grid,
  Tab,
  Tabs,
  useMediaQuery,
  useTheme,
  Paper,
} from "@mui/material";
import { useAtomValue } from "jotai";
import { useEffect, useState, useMemo, Fragment } from "react";
import { Icon } from "@iconify/react";
import { PageTitle } from "@/components/pageTitle";

export default function GameAnalysis() {
  const theme = useTheme();
  const [tab, setTab] = useState<number>(0);
  const isLgOrGreater = useMediaQuery(theme.breakpoints.up("lg"));

  const gameEval = useAtomValue(gameEvalAtom);
  const game = useAtomValue(gameAtom);
  const board = useAtomValue(boardAtom);

  const showMovesTab = game.history().length > 0 || board.history().length > 0;

  useEffect(() => {
    if (tab === 1 && !showMovesTab) setTab(0);
  }, [showMovesTab, gameEval, tab]);

  const tabs = useMemo(
    () => [
      {
        label: "Analysis",
        icon: <Icon icon="mdi:magnify" height={18} />,
        show: true,
      },
      {
        label: "Moves",
        icon: <Icon icon="mdi:format-list-bulleted" height={18} />,
        show: showMovesTab,
      },
      {
        label: "Graph",
        icon: <Icon icon="mdi:chart-line" height={18} />,
        show: true,
      },
    ],
    [showMovesTab]
  );

  return (
    <Fragment>
      <Grid
        container
        gap={4}
        justifyContent="space-evenly"
        alignItems="start"
        sx={{
          background: "linear-gradient(135deg, #232526 0%, #414345 100%)",
          padding: { xs: 2, md: 4 },
        }}
      >
        <PageTitle title="VoltChess Game Analysis" />

        <Board />

        <Grid
          container
          justifyContent="start"
          alignItems="center"
          component={Paper}
          elevation={6}
          borderRadius={4}
          sx={{
            background: "rgba(40, 44, 52, 0.85)",
            backdropFilter: "blur(8px)",
            border: "1.5px solid #3a3f4b",
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
            maxWidth: 500,
            padding: 3,
            rowGap: 2,
            height: { xs: "40rem", lg: "calc(95vh - 90px)" },
            maxHeight: { xs: "40rem", lg: "calc(95vh - 90px)" },
            display: "flex",
            flexDirection: "column",
            flexWrap: "nowrap",
            overflow: "auto",
            transition: "box-shadow 0.2s",
          }}
        >
          {isLgOrGreater ? (
            <Box width="100%">
              <PanelHeader />
              <Divider sx={{ marginX: "5%", marginTop: 2.5 }} />
            </Box>
          ) : (
            <PanelToolBar />
          )}

          {!isLgOrGreater && !gameEval && <Divider sx={{ marginX: "5%" }} />}
          {!isLgOrGreater && !gameEval && <PanelHeader />}

          {!isLgOrGreater && (
            <Box
              width="95%"
              sx={{
                borderBottom: 1,
                borderColor: "divider",
                marginX: { sm: "5%", xs: undefined },
                marginBottom: 1,
              }}
            >
              <Tabs
                value={tab}
                onChange={(_, newValue) => setTab(newValue)}
                aria-label="analysis tabs"
                variant="fullWidth"
                sx={{ minHeight: 0 }}
              >
                {tabs.map(
                  (t, idx) =>
                    t.show && (
                      <Tab
                        key={t.label}
                        label={t.label}
                        id={`tab${idx}`}
                        icon={t.icon}
                        iconPosition="start"
                        sx={{
                          textTransform: "none",
                          minHeight: 20,
                          padding: "8px 0em 14px",
                          borderRadius: 2,
                          transition: "background 0.2s",
                          "&:hover": {
                            background: "rgba(255,255,255,0.05)",
                          },
                        }}
                        disableFocusRipple
                      />
                    )
                )}
              </Tabs>
            </Box>
          )}

          <Box
            sx={{
              flex: 1,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 2,
              borderRadius: 3,
              background: "rgba(255,255,255,0.01)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              padding: 2,
              minHeight: 0,
            }}
          >
            <AnalysisTab
              role="tabpanel"
              hidden={tab !== 0 && !isLgOrGreater}
              id="tabContent0"
            />
            <Divider sx={{ marginY: 2 }} />
            <ClassificationTab
              role="tabpanel"
              hidden={tab !== 1 && !isLgOrGreater}
              id="tabContent1"
            />
            <Divider sx={{ marginY: 2 }} />
            <GraphTab
              role="tabpanel"
              hidden={tab !== 2 && !isLgOrGreater}
              id="tabContent2"
            />
          </Box>

          {isLgOrGreater && (
            <Box width="100%">
              <Divider sx={{ marginX: "5%", marginBottom: 1.5 }} />
              <PanelToolBar />
            </Box>
          )}

          {!isLgOrGreater && gameEval && (
            <Box width="100%">
              <Divider sx={{ marginX: "5%", marginBottom: 2.5 }} />
              <PanelHeader />
            </Box>
          )}
        </Grid>

      </Grid>
    </Fragment>
  );
}