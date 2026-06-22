import { Avatar, Box, IconButton, Tooltip, Typography } from "@mui/material";
import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { boardAtom, gameAtom, gameEvalAtom } from "../states";
import { usePlayersData } from "@/hooks/usePlayersData";
import { useChessActions } from "@/hooks/useChessActions";
import {
  computePositionDominance,
  type PhaseId,
  type PlayerDominanceProfile,
} from "@/lib/positionDominance";
import { Icon } from "@iconify/react";
import ReportSection from "./ReportSection";
import SplitShareBar from "./SplitShareBar";
import { REPORT_COLORS, PHASE_COLORS } from "./reportColors";

const PHASE_LABELS: Record<PhaseId, string> = {
  opening: "Opening",
  middlegame: "Middle",
  endgame: "Endgame",
};

const INFO_TOOLTIP = (
  <Box sx={{ maxWidth: 260, p: 0.5 }}>
    <Typography fontSize="0.75rem" fontWeight={600} sx={{ mb: 0.5 }}>
      Position Dominance
    </Typography>
    <Typography fontSize="0.72rem" lineHeight={1.45}>
      Quality of positions each player created on their own moves. Shares always
      add to 100%. Phase bars show who owned each game phase. Tap a row to jump
      to that player&apos;s worst eval drop.
    </Typography>
  </Box>
);

function PhaseShareBar({
  phase,
  whiteShare,
  blackShare,
}: {
  phase: PhaseId;
  whiteShare: number;
  blackShare: number;
}) {
  const labelColor = PHASE_COLORS[phase];

  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        fontSize="0.68rem"
        fontWeight={600}
        textAlign="center"
        sx={{ mb: 0.35, color: labelColor }}
      >
        {PHASE_LABELS[phase]}
      </Typography>
      <SplitShareBar
        leftShare={whiteShare}
        rightShare={blackShare}
        height={8}
      />
    </Box>
  );
}

function MetricStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <Typography fontSize="0.72rem" component="span">
      <Box component="span" sx={{ color: REPORT_COLORS.textMuted }}>
        {label}{" "}
      </Box>
      <Box
        component="span"
        sx={{ color: color ?? REPORT_COLORS.text, fontWeight: 600 }}
      >
        {value}
      </Box>
    </Typography>
  );
}

function PlayerDominanceRow({
  name,
  profile,
  side,
  onJumpToWorst,
}: {
  name: string;
  profile: PlayerDominanceProfile;
  side: "white" | "black";
  onJumpToWorst: () => void;
}) {
  const isWhite = side === "white";
  const playerColor = isWhite
    ? REPORT_COLORS.whitePlayer
    : REPORT_COLORS.blackPlayer;
  const canJump =
    profile.worstLeakMoveIdx !== null && profile.worstLeakPct >= 5;

  return (
    <Box
      onClick={canJump ? onJumpToWorst : undefined}
      sx={{
        width: "100%",
        px: 1.25,
        py: 1,
        borderRadius: 1.5,
        bgcolor: REPORT_COLORS.rowBg,
        border: `1px solid ${REPORT_COLORS.rowBorder}`,
        cursor: canJump ? "pointer" : "default",
        transition: "border-color 0.15s ease",
        "&:hover": canJump ? { borderColor: playerColor } : undefined,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.85 }}>
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
        <Typography
          fontSize="0.82rem"
          fontWeight={600}
          noWrap
          sx={{ flex: 1, color: REPORT_COLORS.text }}
        >
          {name}
        </Typography>
        <Typography
          fontSize="1.1rem"
          fontWeight={800}
          sx={{ color: playerColor }}
        >
          {profile.dominanceShare.toFixed(0)}%
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25 }}>
        <MetricStat
          label="Control"
          value={`${profile.controlShare.toFixed(0)}%`}
          color={REPORT_COLORS.control}
        />
        <MetricStat
          label="Avg win"
          value={`${profile.avgWinPct.toFixed(0)}%`}
          color={REPORT_COLORS.peak}
        />
        <MetricStat
          label="Swing"
          value={`${profile.avgMoveSwing >= 0 ? "+" : ""}${profile.avgMoveSwing.toFixed(1)}`}
          color={
            profile.avgMoveSwing >= 0 ? REPORT_COLORS.good : REPORT_COLORS.bad
          }
        />
        {profile.worstLeakPct >= 5 && (
          <MetricStat
            label="Worst"
            value={`−${profile.worstLeakPct.toFixed(0)}%`}
            color={REPORT_COLORS.worst}
          />
        )}
      </Box>
    </Box>
  );
}

export default function CriticalAnalysis() {
  const gameEval = useAtomValue(gameEvalAtom);
  const game = useAtomValue(gameAtom);
  const { white, black } = usePlayersData(gameAtom);
  const { goToMove } = useChessActions(boardAtom);

  const profiles = useMemo(() => {
    if (!gameEval?.positions.length) return null;
    return computePositionDominance(gameEval.positions);
  }, [gameEval]);

  if (!profiles) return null;

  const jumpToWorst = (profile: PlayerDominanceProfile) => {
    if (profile.worstLeakMoveIdx === null) return;
    goToMove(profile.worstLeakMoveIdx, game);
  };

  return (
    <ReportSection
      title="Position Dominance"
      dotColor={REPORT_COLORS.endgame}
      tourId="position-dominance"
      headerExtra={
        <Tooltip title={INFO_TOOLTIP} placement="left" arrow>
          <IconButton
            size="small"
            aria-label="About Position Dominance"
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
        <Box sx={{ display: "flex", gap: 1 }}>
          {(["opening", "middlegame", "endgame"] as PhaseId[]).map((phase) => (
            <PhaseShareBar
              key={phase}
              phase={phase}
              whiteShare={profiles.white.phases[phase].phaseShare}
              blackShare={profiles.black.phases[phase].phaseShare}
            />
          ))}
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
          <PlayerDominanceRow
            name={white.name}
            profile={profiles.white}
            side="white"
            onJumpToWorst={() => jumpToWorst(profiles.white)}
          />
          <PlayerDominanceRow
            name={black.name}
            profile={profiles.black}
            side="black"
            onJumpToWorst={() => jumpToWorst(profiles.black)}
          />
        </Box>
      </Box>
    </ReportSection>
  );
}
