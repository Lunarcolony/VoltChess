import { useEffect, useState } from "react";
import * as React from "react";
import { useRouter } from "next/router";
import {
  Box,
  Divider,
  Grid2 as Grid,
  Button,
  Typography,
  useTheme,
} from "@mui/material";

import Board from "@/sections/analysis/board";
import PanelHeader from "@/sections/analysis/panelHeader";
import PanelToolBar from "@/sections/analysis/panelToolbar";
import AnalysisTab from "@/sections/analysis/panelBody/analysisTab/accuracy";
import AnalyzeButton from "@/sections/analysis/panelHeader/treegame";
import ClassificationTab from "@/sections/analysis/panelBody/classificationTab/report";
import GraphTab from "@/sections/analysis/panelBody/graphTab";
import EngineSettingsButton from "@/sections/engineSettings/engineSettingsButton";

import { PageTitle } from "@/components/pageTitle";
import LinearProgressBar from "@/components/LinearProgressBar";

import { boardAtom, gameAtom, gameEvalAtom } from "@/sections/analysis/states";
import { useAtomValue } from "jotai";
import { evaluationProgressAtom } from "../sections/analysis/states";

export default function Homes() {
  const theme = useTheme();
  const [value, setValue] = React.useState(0);
  const router = useRouter();

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Grid container gap={4} justifyContent="space-evenly" alignItems="start">
      <PageTitle title="VoltChess Game Analysis" />

      <Board />

      <Grid
        container
        justifyContent="start"
        alignItems="center"
        borderRadius={1}
        border={1}
        borderColor="secondary.main"
        overflow="auto"
        sx={{
          backgroundColor: "secondary.main",
          borderColor: "primary.main",
          borderWidth: 3,
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
        }}
        padding={2}
        style={{ maxWidth: "500px" }}
        rowGap={2}
        height={{
          xs: value === 1 ? "40rem" : "auto",
          lg: "calc(95vh - 60px)",
        }}
        display="flex"
        flexDirection="column"
        flexWrap="nowrap"
        size={{
          xs: 12,
          lg: "grow",
        }}
      >
        <AnalyzeButton />

        {/* Title */}
        <Grid container justifyContent="center" alignItems="center" columnGap={1}>
          <Typography variant="h5" align="center">
            Game Analysis
          </Typography>
        </Grid>

        <Box width="100%">
          <Divider sx={{ marginX: "5%", marginBottom: 2.5 }} />

          {/* Graph */}
          <GraphTab />

          {/* Spacer */}
          <Grid container justifyContent="center" alignItems="center" columnGap={1}>
            <Typography variant="h5" align="center">
              ‎ ‎ ‎ ‎ ‎ ‎
            </Typography>
          </Grid>

          {/* Accuracy Tab */}
          <AnalysisTab />

          {/* Spacer */}
          <Grid container justifyContent="center" alignItems="center" columnGap={1}>
            <Typography variant="h5" align="center">
              ‎ ‎ ‎ ‎ ‎ ‎
            </Typography>
          </Grid>

          {/* Classification Tab */}
          <ClassificationTab />

          {/* Spacer */}
          <Grid container justifyContent="center" alignItems="center" columnGap={1}>
            <Typography variant="h5" align="center">
              ‎ ‎ ‎ ‎ ‎ ‎
            </Typography>
          </Grid>

          {/* Game Review Button */}
          <Grid container justifyContent="center" alignItems="center" columnGap={1}>
            <Button
              variant="contained"
              size="large"
              onClick={() => router.push("/reanalysis")}
              sx={{
                backgroundColor: "#3b9ac6",
                textTransform: "none",
                fontWeight: "bold",
                fontSize: "1rem",
                borderRadius: "12px",
                paddingX: "28px",
                paddingY: "14px",
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3)",
                transition: "all 0.2s ease-in-out",
                transform: "translateY(0)",
                "&:hover": {
                  backgroundColor: "#3385ad",
                  boxShadow: "0 12px 24px rgba(0, 0, 0, 0.35)",
                  transform: "translateY(-2px)",
                },
                "&:active": {
                  transform: "translateY(1px)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                },
              }}
            >
              <Typography fontSize="1rem" fontWeight={600}>
                Game Review
              </Typography>
            </Button>
          </Grid>
        </Box>

        {/* Toolbar */}
        <Box width="100%">
          <Divider sx={{ marginX: "5%", marginBottom: 2.5 }} />
          <PanelToolBar key="review-panel-toolbar" />
        </Box>
      </Grid>

      <EngineSettingsButton />
    </Grid>
  );
}
