import { Avatar, Box, IconButton, Tooltip, Typography } from "@mui/material";
import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { gameAtom, gameEvalAtom } from "../states";
import { usePlayersData } from "@/hooks/usePlayersData";
import { computeEvalLead } from "@/lib/evalLead";
import { Icon } from "@iconify/react";
import ReportSection from "./ReportSection";
import SplitShareBar from "./SplitShareBar";
import { REPORT_COLORS } from "./reportColors";

const INFO_TOOLTIP = (
  <Box sx={{ maxWidth: 260, p: 0.5 }}>
    <Typography fontSize="0.75rem" fontWeight={600} sx={{ mb: 0.5 }}>
      Eval Lead
    </Typography>
    <Typography fontSize="0.72rem" lineHeight={1.45}>
      How much of the game each player spent with the better engine evaluation.
      Shares always add to 100%. Peak is the best win chance held while ahead;
      Longest is consecutive moves in the lead; Comebacks counts recoveries from
      below 45% to above 55%.
    </Typography>
  </Box>
);

function StatChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <Box sx={{ flex: 1, minWidth: 0, textAlign: "center" }}>
      <Typography
        fontSize="0.65rem"
        sx={{ mb: 0.2, color: REPORT_COLORS.textMuted }}
      >
        {label}
      </Typography>
      <Typography
        fontSize="0.82rem"
        fontWeight={700}
        sx={{ color: color ?? REPORT_COLORS.text }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function PlayerSide({
  name,
  share,
  side,
  peak,
  longestRun,
  comebacks,
  align,
}: {
  name: string;
  share: number;
  side: "white" | "black";
  peak: number;
  longestRun: number;
  comebacks: number;
  align: "left" | "right";
}) {
  const isWhite = side === "white";
  const playerColor = isWhite
    ? REPORT_COLORS.whitePlayer
    : REPORT_COLORS.blackPlayer;

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        alignItems: align === "left" ? "flex-start" : "flex-end",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          flexDirection: align === "right" ? "row-reverse" : "row",
        }}
      >
        <Avatar
          sx={{
            width: 26,
            height: 26,
            fontSize: "0.75rem",
            bgcolor: playerColor,
            color: REPORT_COLORS.whiteAvatarText,
            border: `1px solid ${isWhite ? REPORT_COLORS.whitePlayerDark : REPORT_COLORS.blackPlayerDark}`,
          }}
        >
          {name[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0, textAlign: align }}>
          <Typography
            fontSize="0.78rem"
            fontWeight={600}
            noWrap
            sx={{ color: REPORT_COLORS.text }}
          >
            {name}
          </Typography>
          <Typography
            fontSize="1.15rem"
            fontWeight={800}
            sx={{ color: playerColor, lineHeight: 1.1 }}
          >
            {share.toFixed(0)}%
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          width: "100%",
          gap: 0.5,
          flexDirection: align === "right" ? "row-reverse" : "row",
        }}
      >
        <StatChip
          label="Peak"
          value={`${peak.toFixed(0)}%`}
          color={REPORT_COLORS.peak}
        />
        <StatChip label="Longest" value={`${longestRun}`} />
        <StatChip
          label="Comebacks"
          value={`${comebacks}`}
          color={comebacks > 0 ? REPORT_COLORS.recovery : undefined}
        />
      </Box>
    </Box>
  );
}

export default function EvalLeadPanel() {
  const gameEval = useAtomValue(gameEvalAtom);
  const { white, black } = usePlayersData(gameAtom);

  const lead = useMemo(() => {
    if (!gameEval?.positions.length) return null;
    return computeEvalLead(gameEval.positions);
  }, [gameEval]);

  if (!lead) return null;

  return (
    <ReportSection
      title="Eval Lead"
      dotColor={REPORT_COLORS.whitePlayer}
      tourId="eval-lead"
      headerExtra={
        <Tooltip title={INFO_TOOLTIP} placement="left" arrow>
          <IconButton
            size="small"
            aria-label="About Eval Lead"
            sx={{
              p: 0.35,
              color: REPORT_COLORS.textMuted,
              "&:hover": { color: REPORT_COLORS.text },
            }}
          >
            <Icon icon="mdi:information-outline" width={18} />
          </IconButton>
        </Tooltip>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        <SplitShareBar
          leftShare={lead.white.leadShare}
          rightShare={lead.black.leadShare}
          height={12}
        />

        <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
          <PlayerSide
            name={white.name}
            share={lead.white.leadShare}
            side="white"
            peak={lead.white.peakAdvantage}
            longestRun={lead.white.longestRun}
            comebacks={lead.white.comebacks}
            align="left"
          />
          <PlayerSide
            name={black.name}
            share={lead.black.leadShare}
            side="black"
            peak={lead.black.peakAdvantage}
            longestRun={lead.black.longestRun}
            comebacks={lead.black.comebacks}
            align="right"
          />
        </Box>

        <Typography
          fontSize="0.68rem"
          textAlign="center"
          sx={{ color: REPORT_COLORS.textMuted }}
        >
          Share of moves with the evaluation advantage
        </Typography>
      </Box>
    </ReportSection>
  );
}
