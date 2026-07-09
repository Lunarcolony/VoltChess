import {
  Box,
  IconButton,
  LinearProgress,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Icon } from "@iconify/react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useMemo, useState } from "react";
import {
  boardAtom,
  currentPositionAtom,
  engineDepthAtom,
  engineMultiPvAtom,
  engineNameAtom,
} from "../states";
import {
  advancedEngineOnAtom,
  hoveredLineUciAtom,
  shortcutsDialogOpenAtom,
  threatEvalAtom,
  threatModeAtom,
} from "./states";
import { getFlippedFen } from "./useThreatEval";
import {
  LICHESS_COLORS,
  buildSanTokens,
  formatKnps,
  renderLichessEval,
} from "./lichess";
import { usePalette } from "@/hooks/usePalette";
import { useChessActions } from "@/hooks/useChessActions";
import { ENGINE_LABELS } from "@/constants";
import { EngineName } from "@/types/enums";
import type { LineEval } from "@/types/eval";
import EngineSettingsDialog from "@/sections/engineSettings/engineSettingsDialog";
import PrettyMoveSan from "@/components/prettyMoveSan";

const NNUE_ENGINES = new Set<EngineName>([
  EngineName.Stockfish17,
  EngineName.Stockfish17Lite,
  EngineName.Stockfish16_1,
  EngineName.Stockfish16_1Lite,
  EngineName.Stockfish16NNUE,
]);

const MAX_PV_MOVES = 16;

function PvRow({
  line,
  fen,
  isThreat,
  isBest,
}: {
  line: LineEval | undefined;
  fen: string;
  isThreat: boolean;
  isBest: boolean;
}) {
  const palette = usePalette();
  const { addMoves } = useChessActions(boardAtom);
  const setHoveredUci = useSetAtom(hoveredLineUciAtom);
  const [wrapped, setWrapped] = useState(false);

  const tokens = useMemo(
    () => (line?.pv.length ? buildSanTokens(fen, line.pv, MAX_PV_MOVES) : []),
    [line, fen]
  );

  const evalLabel = renderLichessEval(line);
  const lineColor = isThreat ? LICHESS_COLORS.threat : LICHESS_COLORS.primary;

  return (
    <Box
      onMouseEnter={() => line?.pv[0] && setHoveredUci(line.pv[0])}
      onMouseLeave={() => setHoveredUci(undefined)}
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 0.75,
        px: 1,
        py: 0.6,
        minHeight: 30,
        borderTop: `1px solid ${palette.borderSubtle}`,
        bgcolor: isBest ? alpha(lineColor, 0.05) : "transparent",
        "&:hover": { bgcolor: alpha(lineColor, 0.1) },
      }}
    >
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: "0.8rem",
          fontVariantNumeric: "tabular-nums",
          color: isBest ? lineColor : palette.textMuted,
          minWidth: 42,
          flexShrink: 0,
          pt: 0.1,
        }}
      >
        {evalLabel}
      </Typography>

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          whiteSpace: wrapped ? "normal" : "nowrap",
          textOverflow: "ellipsis",
        }}
      >
        {tokens.length === 0 ? (
          <Typography fontSize="0.8rem" color="text.secondary">
            {line ? "…" : "—"}
          </Typography>
        ) : (
          tokens.map((token, i) => (
            <Box
              key={`${token.san}-${i}`}
              component="span"
              onClick={() => !isThreat && addMoves(token.uciSequence)}
              sx={{
                cursor: isThreat ? "default" : "pointer",
                borderRadius: 0.5,
                px: 0.2,
                "&:hover": isThreat
                  ? undefined
                  : { bgcolor: alpha(lineColor, 0.25) },
              }}
            >
              {token.numberLabel && (
                <Typography
                  component="span"
                  sx={{
                    fontSize: "0.72rem",
                    color: palette.textMuted,
                    mr: 0.25,
                  }}
                >
                  {token.numberLabel}
                </Typography>
              )}
              <PrettyMoveSan
                san={token.san}
                color={token.color}
                typographyProps={{ fontSize: "0.8rem" }}
              />{" "}
            </Box>
          ))
        )}
      </Box>

      {tokens.length > 3 && (
        <IconButton
          size="small"
          onClick={() => setWrapped((prev) => !prev)}
          sx={{ p: 0.25, color: palette.textMuted, flexShrink: 0 }}
        >
          <Icon
            icon={wrapped ? "mdi:chevron-up" : "mdi:chevron-down"}
            width={14}
          />
        </IconButton>
      )}
    </Box>
  );
}

export default function AdvancedEnginePanel() {
  const palette = usePalette();
  const board = useAtomValue(boardAtom);
  const position = useAtomValue(currentPositionAtom);
  const engineName = useAtomValue(engineNameAtom);
  const targetDepth = useAtomValue(engineDepthAtom);
  const multiPv = useAtomValue(engineMultiPvAtom);
  const [engineOn, setEngineOn] = useAtom(advancedEngineOnAtom);
  const [threatMode, setThreatMode] = useAtom(threatModeAtom);
  const threatEval = useAtomValue(threatEvalAtom);
  const setShortcutsOpen = useSetAtom(shortcutsDialogOpenAtom);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const boardFen = board.fen();
  const flippedFen = useMemo(() => getFlippedFen(boardFen), [boardFen]);

  const showThreat = threatMode && !!threatEval;
  const activeEval = showThreat ? threatEval : position?.eval;
  const activeFen = showThreat ? (flippedFen ?? boardFen) : boardFen;
  const bestLine = activeEval?.lines?.[0];
  const currentDepth = bestLine?.depth ?? 0;
  const gameOver = board.isGameOver();

  const engineLabel = ENGINE_LABELS[engineName]?.small ?? "Stockfish";
  const isNnue = NNUE_ENGINES.has(engineName);
  const knps = formatKnps(bestLine?.nps);
  const searching =
    engineOn && !gameOver && currentDepth > 0 && currentDepth < targetDepth;
  const progress = gameOver
    ? 0
    : Math.min(100, (currentDepth / Math.max(1, targetDepth)) * 100);

  const pearl = gameOver
    ? board.isCheckmate()
      ? board.turn() === "w"
        ? "0-1"
        : "1-0"
      : "½-½"
    : renderLichessEval(bestLine);

  const threatDisabled =
    !engineOn || gameOver || board.inCheck() || !flippedFen;

  const infoLine = !engineOn
    ? "in local browser"
    : gameOver
      ? "Game over"
      : showThreat
        ? `Threat · Depth ${currentDepth}/${targetDepth}`
        : `Depth ${currentDepth}/${targetDepth}${knps && searching ? ` · ${knps}` : ""}`;

  const linesToRender: (LineEval | undefined)[] = gameOver
    ? []
    : Array.from(
        { length: multiPv },
        (_, i) => activeEval?.lines?.[i] ?? undefined
      );

  return (
    <>
      <Box
        sx={{
          bgcolor: palette.surface,
          border: `1px solid ${threatMode ? alpha(LICHESS_COLORS.threat, 0.5) : palette.border}`,
          borderRadius: 1.5,
          overflow: "hidden",
          mb: 1,
          flexShrink: 0,
        }}
      >
        {engineOn && !gameOver && (
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 3,
              bgcolor: "transparent",
              "& .MuiLinearProgress-bar": {
                bgcolor: showThreat
                  ? LICHESS_COLORS.threat
                  : LICHESS_COLORS.goodMove,
              },
            }}
          />
        )}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            px: 1,
            py: 0.75,
          }}
        >
          <Tooltip
            title={engineOn ? "Disable engine (l)" : "Enable engine (l)"}
          >
            <Switch
              size="small"
              checked={engineOn}
              onChange={(_, value) => {
                setEngineOn(value);
                if (!value) setThreatMode(false);
              }}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": {
                  color: LICHESS_COLORS.primary,
                },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  bgcolor: LICHESS_COLORS.primary,
                },
              }}
            />
          </Tooltip>

          <Typography
            sx={{
              fontSize: { xs: "1.35rem", sm: "1.55rem" },
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              minWidth: 58,
              color: showThreat ? LICHESS_COLORS.threat : palette.text,
            }}
          >
            {pearl}
          </Typography>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Typography fontSize="0.78rem" fontWeight={600} noWrap>
                {showThreat ? "Show threat" : engineLabel}
              </Typography>
              {!showThreat && (
                <Typography
                  sx={{
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    px: 0.5,
                    borderRadius: 0.5,
                    color: isNnue ? LICHESS_COLORS.goodMove : palette.textMuted,
                    border: `1px solid ${
                      isNnue
                        ? alpha(LICHESS_COLORS.goodMove, 0.5)
                        : palette.border
                    }`,
                    flexShrink: 0,
                  }}
                >
                  {isNnue ? "NNUE" : "HCE"}
                </Typography>
              )}
            </Box>
            <Typography fontSize="0.7rem" color="text.secondary" noWrap>
              {infoLine}
            </Typography>
          </Box>

          <Tooltip title="Show threat (x)">
            <span>
              <IconButton
                size="small"
                disabled={threatDisabled}
                onClick={() => setThreatMode((prev) => !prev)}
                sx={{
                  color: threatMode ? LICHESS_COLORS.threat : palette.textMuted,
                }}
              >
                <Icon icon="mdi:crosshairs" width={18} />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Keyboard shortcuts (?)">
            <IconButton
              size="small"
              onClick={() => setShortcutsOpen(true)}
              sx={{ color: palette.textMuted }}
            >
              <Icon icon="mdi:keyboard-outline" width={18} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Engine settings">
            <IconButton
              size="small"
              onClick={() => setSettingsOpen(true)}
              sx={{ color: palette.textMuted }}
            >
              <Icon icon="mdi:cog-outline" width={18} />
            </IconButton>
          </Tooltip>
        </Box>

        {gameOver && (
          <Typography
            sx={{
              px: 1.25,
              pb: 1,
              fontSize: "0.78rem",
              color: palette.textMuted,
            }}
          >
            {board.isCheckmate()
              ? `Checkmate — ${board.turn() === "w" ? "Black" : "White"} wins`
              : board.isStalemate()
                ? "Stalemate — draw"
                : "Game over — draw"}
          </Typography>
        )}

        {linesToRender.map((line, index) => (
          <PvRow
            key={index}
            line={line}
            fen={activeFen}
            isThreat={showThreat}
            isBest={index === 0}
          />
        ))}
      </Box>

      <EngineSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
