import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Typography,
  Portal,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { usePalette } from "@/hooks/usePalette";

export interface TourStep {
  id: string;
  title: string;
  content: string;
  target?: string;
  placement?: "top" | "bottom" | "left" | "right";
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Props {
  steps: readonly TourStep[];
  active: boolean;
  onComplete: () => void;
  onSkip: () => void;
  onStepChange?: (step: TourStep, index: number) => void;
  waitForTarget?: boolean;
}

const PADDING = 8;
const TOOLTIP_GAP = 14;

function getTargetRect(targetId: string): Rect | null {
  const el = document.querySelector(`[data-tour-id="${targetId}"]`);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

function getTooltipPosition(
  target: Rect | null,
  placement: TourStep["placement"],
  tooltipWidth: number,
  tooltipHeight: number
): { top: number; left: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const margin = 12;

  if (!target) {
    return {
      top: Math.max(margin, (vh - tooltipHeight) / 2),
      left: Math.max(margin, (vw - tooltipWidth) / 2),
    };
  }

  const padded = {
    top: target.top - PADDING,
    left: target.left - PADDING,
    width: target.width + PADDING * 2,
    height: target.height + PADDING * 2,
  };

  let top = padded.top + padded.height + TOOLTIP_GAP;
  let left = padded.left + padded.width / 2 - tooltipWidth / 2;

  if (placement === "top") {
    top = padded.top - tooltipHeight - TOOLTIP_GAP;
  } else if (placement === "left") {
    top = padded.top + padded.height / 2 - tooltipHeight / 2;
    left = padded.left - tooltipWidth - TOOLTIP_GAP;
  } else if (placement === "right") {
    top = padded.top + padded.height / 2 - tooltipHeight / 2;
    left = padded.left + padded.width + TOOLTIP_GAP;
  }

  left = Math.min(Math.max(margin, left), vw - tooltipWidth - margin);
  top = Math.min(Math.max(margin, top), vh - tooltipHeight - margin);

  return { top, left };
}

export default function SpotlightTour({
  steps,
  active,
  onComplete,
  onSkip,
  onStepChange,
  waitForTarget = true,
}: Props) {
  const palette = usePalette();
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [tooltipSize, setTooltipSize] = useState({ width: 320, height: 200 });

  const step = steps[stepIndex];
  const isLast = stepIndex >= steps.length - 1;

  const updateRects = useCallback(() => {
    if (!step?.target) {
      setTargetRect(null);
      return;
    }
    setTargetRect(getTargetRect(step.target));
  }, [step]);

  useEffect(() => {
    if (!active) return;
    setStepIndex(0);
  }, [active]);

  useEffect(() => {
    if (!active || !step) return;
    onStepChange?.(step, stepIndex);
  }, [active, step, stepIndex, onStepChange]);

  useLayoutEffect(() => {
    if (!active || !step) return;

    updateRects();

    const onResize = () => updateRects();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);

    let interval: ReturnType<typeof setInterval> | undefined;
    if (step.target && waitForTarget) {
      interval = setInterval(updateRects, 250);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      if (interval) clearInterval(interval);
    };
  }, [active, step, updateRects, waitForTarget]);

  useEffect(() => {
    if (!active || !step?.target || !waitForTarget) return;
    if (targetRect) return;

    const timeout = setTimeout(updateRects, 100);
    return () => clearTimeout(timeout);
  }, [active, step, targetRect, updateRects, waitForTarget]);

  if (!active || !step) return null;

  const canAdvance =
    !step.target || !waitForTarget || targetRect !== null || isLast;

  const handleNext = () => {
    if (isLast) {
      onComplete();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const handleBack = () => {
    setStepIndex((i) => Math.max(0, i - 1));
  };

  const tooltipPos = getTooltipPosition(
    targetRect,
    step.placement ?? "bottom",
    tooltipSize.width,
    tooltipSize.height
  );

  return (
    <Portal>
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 1400,
          pointerEvents: "auto",
        }}
      >
        {!targetRect && (
          <Box
            onClick={onSkip}
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: "rgba(0, 0, 0, 0.72)",
            }}
          />
        )}

        {targetRect && (
          <Box
            sx={{
              position: "fixed",
              top: targetRect.top - PADDING,
              left: targetRect.left - PADDING,
              width: targetRect.width + PADDING * 2,
              height: targetRect.height + PADDING * 2,
              borderRadius: 2,
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.72)",
              border: `2px solid ${palette.accent}`,
              pointerEvents: "none",
              zIndex: 1401,
              transition: "all 0.2s ease",
            }}
          />
        )}

        <Paper
          ref={(node) => {
            if (!node) return;
            const { offsetWidth, offsetHeight } = node;
            if (
              offsetWidth !== tooltipSize.width ||
              offsetHeight !== tooltipSize.height
            ) {
              setTooltipSize({ width: offsetWidth, height: offsetHeight });
            }
          }}
          elevation={8}
          sx={{
            position: "fixed",
            top: tooltipPos.top,
            left: tooltipPos.left,
            width: { xs: "min(340px, calc(100vw - 24px))", sm: 360 },
            zIndex: 1402,
            p: 2.5,
            bgcolor: palette.surfaceRaised,
            border: `1px solid ${palette.border}`,
            borderRadius: 2.5,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              mb: 1,
            }}
          >
            <Typography
              variant="h3"
              sx={{ fontSize: "1.05rem", color: palette.text, pr: 1 }}
            >
              {step.title}
            </Typography>
            <IconButton
              size="small"
              onClick={onSkip}
              aria-label="Skip tour"
              sx={{ color: palette.textMuted, mt: -0.5, mr: -0.5 }}
            >
              <Icon icon="mdi:close" width={18} />
            </IconButton>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, lineHeight: 1.55 }}
          >
            {step.content}
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Button
              size="small"
              onClick={onSkip}
              sx={{ color: palette.textMuted, minWidth: 0 }}
            >
              Skip tour
            </Button>

            <Box sx={{ display: "flex", gap: 1 }}>
              {stepIndex > 0 && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleBack}
                  sx={{
                    borderColor: palette.border,
                    color: palette.text,
                  }}
                >
                  Back
                </Button>
              )}
              <Button
                size="small"
                variant="contained"
                color="primary"
                disabled={!canAdvance}
                onClick={handleNext}
              >
                {isLast ? "Done" : "Next"}
              </Button>
            </Box>
          </Box>

          <Typography
            variant="caption"
            sx={{
              display: "block",
              mt: 1.5,
              textAlign: "center",
              color: palette.textMuted,
            }}
          >
            {stepIndex + 1} of {steps.length}
          </Typography>
        </Paper>
      </Box>
    </Portal>
  );
}
