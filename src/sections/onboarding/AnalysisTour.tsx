import { useCallback, useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useAtomValue } from "jotai";
import { useRouter } from "@/hooks/useRouter";
import { gameEvalAtom } from "@/sections/analysis/states";
import { usePalette } from "@/hooks/usePalette";
import { ANALYSIS_TOUR_STEPS } from "./constants";
import { markOnboardingComplete } from "./onboardingStorage";
import SpotlightTour, { type TourStep } from "./SpotlightTour";

interface Props {
  onTabChange?: (tab: "report") => void;
}

export default function AnalysisTour({ onTabChange }: Props) {
  const palette = usePalette();
  const router = useRouter();
  const gameEval = useAtomValue(gameEvalAtom);
  const tourRequested = router.query.tour === "1";
  const [tourActive, setTourActive] = useState(false);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    if (!tourRequested) return;

    if (gameEval) {
      setWaiting(false);
      setTourActive(true);
      return;
    }

    setWaiting(true);
    const timeout = setTimeout(() => {
      setWaiting(false);
      setTourActive(true);
    }, 12000);

    return () => clearTimeout(timeout);
  }, [tourRequested, gameEval]);

  const finishTour = useCallback(() => {
    markOnboardingComplete();
    setTourActive(false);
    router.replace("/analysis");
  }, [router]);

  const handleStepChange = useCallback(
    (step: TourStep) => {
      if (
        step.id === "report-tab" ||
        step.id === "eval-graph" ||
        step.id === "accuracy" ||
        step.id === "classification" ||
        step.id === "eval-lead" ||
        step.id === "position-dominance"
      ) {
        onTabChange?.("report");
      }
    },
    [onTabChange]
  );

  if (!tourRequested) return null;

  return (
    <>
      {waiting && !tourActive && (
        <Box
          sx={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1300,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 2,
            py: 1.25,
            borderRadius: 2,
            bgcolor: palette.surfaceRaised,
            border: `1px solid ${palette.border}`,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <CircularProgress size={18} sx={{ color: palette.accent }} />
          <Typography variant="body2" color="text.secondary">
            Analyzing your game for the tour…
          </Typography>
        </Box>
      )}

      <SpotlightTour
        steps={ANALYSIS_TOUR_STEPS}
        active={tourActive}
        onComplete={finishTour}
        onSkip={finishTour}
        onStepChange={handleStepChange}
        waitForTarget
      />
    </>
  );
}
