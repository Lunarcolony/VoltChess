import { useRouter } from "next/router";
import {
  Box,
  Divider,
  Grid2 as Grid,
  Button,
  Typography,
  Paper,
} from "@mui/material";

import Board from "@/sections/analysis/board";
import PanelToolBar from "@/sections/analysis/panelToolbar";
import AnalysisTab from "@/sections/analysis/panelBody/analysisTab/accuracy";
import AnalyzeButton from "@/sections/analysis/panelHeader/treegame";
import ClassificationTab from "@/sections/analysis/panelBody/classificationTab/report";
import GraphTab from "@/sections/analysis/panelBody/graphTab";
import ProtectedRoute from "@/components/ProtectedRoute";

import { PageTitle } from "@/components/pageTitle";

function Homes() {
  const router = useRouter();

  return (
    <Grid
      container
      gap={4}
      justifyContent="space-evenly"
      alignItems="start"
      sx={{
        background: "linear-gradient(135deg, #232526 0%, #414345 100%)",
        padding: { xs: 2, md: 4 },
        overflow: "auto",
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
        <AnalyzeButton />

        {/* Title */}
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          columnGap={1}
        >
          <Typography variant="h5" align="center" sx={{ fontWeight: 600 }}>
            Game Analysis
          </Typography>
        </Grid>

        <Divider sx={{ marginX: "5%", marginBottom: 2.5 }} />

        {/* Graph */}
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
          <GraphTab />
          <AnalysisTab />
          <ClassificationTab />
        </Box>

        {/* Game Review Button */}
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          columnGap={1}
        >
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

        {/* Toolbar */}
        <Box width="100%">
          <Divider sx={{ marginX: "5%", marginBottom: 2.5 }} />
          <PanelToolBar key="review-panel-toolbar" />
        </Box>
      </Grid>
    </Grid>
  );
}

export default function ProtectedAnalysis() {
  return (
    <ProtectedRoute>
      <Homes />
    </ProtectedRoute>
  );
}
