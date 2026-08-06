import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  MenuItem,
  Select,
  CircularProgress,
  Alert,
  type SelectChangeEvent,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { alpha } from "@mui/material/styles";
import { Chess, DEFAULT_POSITION } from "chess.js";
import { Chessboard } from "react-chessboard";
import type {
  Arrow,
  Square as BoardSquare,
} from "react-chessboard/dist/chessboard/types";
import ToolsShell, {
  ToolPrimaryButton,
  ToolStat,
} from "@/sections/tools/ToolsShell";
import { usePalette } from "@/hooks/usePalette";
import { useRouter } from "@/hooks/useRouter";
import { getSharedEngine } from "@/lib/engine/sharedEngine";
import { waitForEngineReady } from "@/lib/engine/waitForEngine";
import { EngineName } from "@/types/enums";
import { LineEval, PositionEval } from "@/types/eval";
import { formatEvalScore } from "@/lib/formatEval";
import { moveLineUciToSan, uciMoveParams } from "@/lib/chess";

const DEPTH_OPTIONS = [12, 16, 20] as const;
const MULTI_PV = 3;

function sanFromUci(fen: string, uci: string): string | null {
  try {
    const chess = new Chess(fen);
    const move = chess.move(uciMoveParams(uci));
    return move.san;
  } catch {
    return null;
  }
}

function pvToSan(fen: string, pv: string[], limit = 6): string[] {
  const toSan = moveLineUciToSan(fen);
  return pv.slice(0, limit).map((uci) => toSan(uci));
}

function PvLineRow({
  line,
  fen,
  rank,
  onClick,
}: {
  line: LineEval;
  fen: string;
  rank: number;
  onClick: () => void;
}) {
  const palette = usePalette();
  const sanMoves = useMemo(() => pvToSan(fen, line.pv, 6), [fen, line.pv]);
  const isBest = rank === 1;

  return (
    <Box
      role="button"
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        p: 1,
        borderRadius: 1.5,
        cursor: sanMoves.length ? "pointer" : "default",
        mt: 0.75,
        border: `1px solid ${
          isBest ? alpha(palette.accent, 0.3) : palette.borderSubtle
        }`,
        bgcolor: isBest ? alpha(palette.accent, 0.06) : "transparent",
        transition: "border-color 0.15s ease, background-color 0.15s ease",
        "&:hover": {
          borderColor: alpha(palette.accent, 0.5),
          bgcolor: alpha(palette.accent, 0.08),
        },
      }}
    >
      <Typography
        sx={{
          width: 18,
          textAlign: "center",
          fontSize: "0.68rem",
          color: palette.textMuted,
          flexShrink: 0,
        }}
      >
        {rank}
      </Typography>
      <Typography
        sx={{
          minWidth: 52,
          fontWeight: 700,
          fontSize: "0.9rem",
          fontFamily: "ui-monospace, monospace",
          color: isBest ? palette.accent : palette.text,
          flexShrink: 0,
        }}
      >
        {formatEvalScore(line)}
      </Typography>
      <Typography
        noWrap
        sx={{
          fontSize: "0.82rem",
          color: palette.textMuted,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {sanMoves.join(" ") || "…"}
      </Typography>
    </Box>
  );
}

export default function NextMoveTool() {
  const palette = usePalette();
  const router = useRouter();

  const [game, setGame] = useState<Chess>(() => new Chess());
  const [fenHistory, setFenHistory] = useState<string[]>([]);
  const fen = game.fen();

  const [fenInput, setFenInput] = useState(fen);
  const [fenError, setFenError] = useState<string | null>(null);
  const [depth, setDepth] = useState<number>(16);
  const [manualFlip, setManualFlip] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [evaluation, setEvaluation] = useState<PositionEval | null>(null);
  const [thinkError, setThinkError] = useState<string | null>(null);
  const appliedUrlFenRef = useRef(false);

  useEffect(() => {
    setFenInput(fen);
  }, [fen]);

  useEffect(() => {
    setEvaluation(null);
    setThinkError(null);
  }, [fen]);

  useEffect(() => {
    let cancelled = false;
    waitForEngineReady(EngineName.Stockfish17Lite)
      .then(() => {
        if (!cancelled) setEngineReady(true);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      getSharedEngine()?.stopAllCurrentJobs();
    };
  }, []);

  useEffect(() => {
    if (appliedUrlFenRef.current) return;
    appliedUrlFenRef.current = true;

    const fenParam = router.query.fen;
    const raw = Array.isArray(fenParam) ? fenParam[0] : fenParam;
    if (!raw) return;

    try {
      const decoded = decodeURIComponent(raw);
      const loaded = new Chess(decoded);
      setGame(loaded);
      setFenHistory([]);
    } catch {
      /* ignore invalid fen in URL */
    }
  }, [router.query.fen]);

  const attemptMove = useCallback(
    (from: string, to: string, promotion?: string): boolean => {
      const next = new Chess(game.fen());
      try {
        next.move({ from, to, promotion: promotion || "q" });
      } catch {
        return false;
      }
      setFenHistory((prev) => [...prev, game.fen()]);
      setGame(next);
      return true;
    },
    [game]
  );

  const playUci = useCallback(
    (uci: string) => {
      if (uci.length < 4) return;
      const { from, to, promotion } = uciMoveParams(uci);
      attemptMove(from, to, promotion);
    },
    [attemptMove]
  );

  const onDrop = (
    source: BoardSquare,
    target: BoardSquare,
    piece: string
  ): boolean => attemptMove(source, target, piece[1]?.toLowerCase());

  const handleReset = () => {
    setFenError(null);
    setGame(new Chess());
    setFenHistory([]);
  };

  const handleUndo = () => {
    setFenHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setGame(new Chess(last));
      return prev.slice(0, -1);
    });
  };

  const handleLoadFen = () => {
    const trimmed = fenInput.trim();
    try {
      const loaded = new Chess(trimmed);
      setFenError(null);
      setGame(loaded);
      setFenHistory([]);
    } catch {
      setFenError("Invalid FEN — check piece placement and fields.");
    }
  };

  const handleFindBestMove = async () => {
    setThinkError(null);

    if (game.isGameOver()) {
      setThinkError("This position is already over — no moves to find.");
      return;
    }

    setIsThinking(true);
    try {
      const engine = await waitForEngineReady(EngineName.Stockfish17Lite);
      setEngineReady(true);
      const result = await engine.evaluatePositionWithUpdate({
        fen,
        depth,
        multiPv: MULTI_PV,
        setPartialEval: setEvaluation,
      });
      setEvaluation(result);
    } catch {
      setThinkError("Couldn't evaluate this position. Try again.");
    } finally {
      setIsThinking(false);
    }
  };

  const lines = evaluation?.lines ?? [];
  const bestLine = lines[0];
  const bestMoveUci = evaluation?.bestMove || bestLine?.pv?.[0];
  const bestMoveSan = useMemo(
    () => (bestMoveUci ? sanFromUci(fen, bestMoveUci) : null),
    [fen, bestMoveUci]
  );

  const boardArrows: Arrow[] = useMemo(() => {
    if (!bestMoveUci || bestMoveUci.length < 4) return [];
    return [
      [
        bestMoveUci.slice(0, 2) as BoardSquare,
        bestMoveUci.slice(2, 4) as BoardSquare,
        palette.accent,
      ],
    ];
  }, [bestMoveUci, palette.accent]);

  const autoOrientation: "white" | "black" =
    game.turn() === "b" ? "black" : "white";
  const orientation: "white" | "black" = manualFlip
    ? autoOrientation === "white"
      ? "black"
      : "white"
    : autoOrientation;

  const isGameOver = game.isGameOver();
  const turnLabel = game.turn() === "w" ? "White to move" : "Black to move";

  const engineStatusLabel = isThinking
    ? "Thinking…"
    : engineReady
      ? "Ready"
      : "Loading…";
  const engineStatusIcon = isThinking
    ? "mdi:cog-clockwise"
    : engineReady
      ? "mdi:check-circle-outline"
      : "mdi:progress-clock";

  const handlePlayLine = (line: LineEval) => {
    if (line.pv[0]) playUci(line.pv[0]);
  };

  const board = (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Chip
          label={turnLabel}
          size="small"
          variant="outlined"
          icon={
            <Icon
              icon={game.turn() === "w" ? "mdi:circle-outline" : "mdi:circle"}
              width={14}
            />
          }
        />
        {isGameOver && <Chip label="Game over" size="small" color="warning" />}
      </Box>

      <Box sx={{ width: "100%", maxWidth: 560, mx: "auto" }}>
        <Chessboard
          position={fen}
          onPieceDrop={onDrop}
          boardOrientation={orientation}
          customArrows={boardArrows}
          customBoardStyle={{
            borderRadius: "8px",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
          }}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <Button
          size="small"
          variant="outlined"
          startIcon={<Icon icon="mdi:restart" width={16} />}
          onClick={handleReset}
        >
          Reset
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Icon icon="mdi:undo" width={16} />}
          onClick={handleUndo}
          disabled={fenHistory.length === 0}
        >
          Undo
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Icon icon="mdi:swap-vertical" width={16} />}
          onClick={() => setManualFlip((v) => !v)}
        >
          Flip board
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
        <TextField
          fullWidth
          size="small"
          value={fenInput}
          onChange={(e) => setFenInput(e.target.value)}
          placeholder={DEFAULT_POSITION}
          error={!!fenError}
          helperText={fenError || " "}
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: palette.bg,
              fontFamily: "ui-monospace, monospace",
              fontSize: "0.78rem",
            },
          }}
        />
        <Button
          variant="outlined"
          onClick={handleLoadFen}
          sx={{ flexShrink: 0, borderColor: alpha(palette.accent, 0.35) }}
        >
          Load
        </Button>
      </Box>
    </Box>
  );

  const panel = (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          variant="overline"
          sx={{
            color: palette.textMuted,
            letterSpacing: "0.1em",
            fontSize: "0.66rem",
          }}
        >
          Engine
        </Typography>
        <Chip
          size="small"
          label={engineStatusLabel}
          icon={
            isThinking ? (
              <CircularProgress size={12} sx={{ ml: 0.5 }} />
            ) : (
              <Icon icon={engineStatusIcon} width={14} />
            )
          }
          sx={{
            color: engineReady ? palette.accent : palette.textMuted,
            borderColor: alpha(
              engineReady ? palette.accent : palette.textMuted,
              0.35
            ),
          }}
          variant="outlined"
        />
      </Box>

      <ToolPrimaryButton
        onClick={handleFindBestMove}
        loading={isThinking}
        disabled={isThinking || isGameOver}
        startIcon={<Icon icon="mdi:chess-queen" width={18} />}
      >
        Find best move
      </ToolPrimaryButton>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Typography variant="body2" sx={{ color: palette.textMuted }}>
          Search depth
        </Typography>
        <Select
          size="small"
          value={depth}
          disabled={isThinking}
          onChange={(e: SelectChangeEvent<number>) =>
            setDepth(Number(e.target.value))
          }
          sx={{ minWidth: 110 }}
        >
          {DEPTH_OPTIONS.map((d) => (
            <MenuItem key={d} value={d}>
              Depth {d}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {thinkError && <Alert severity="warning">{thinkError}</Alert>}

      {evaluation && bestLine ? (
        <>
          <Box sx={{ textAlign: "center", py: 0.5 }}>
            <Typography
              variant="caption"
              sx={{
                color: palette.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontSize: "0.65rem",
              }}
            >
              Best move
            </Typography>
            <Typography
              sx={{
                fontSize: "2.35rem",
                fontWeight: 800,
                letterSpacing: "-0.01em",
                color: palette.accent,
                lineHeight: 1.15,
              }}
            >
              {bestMoveSan ?? bestMoveUci ?? "—"}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <ToolStat
              label="Eval"
              value={formatEvalScore(bestLine)}
              emphasize
            />
            <ToolStat label="Depth" value={bestLine.depth} />
          </Box>

          <Box>
            <Typography
              variant="caption"
              sx={{
                color: palette.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontSize: "0.65rem",
              }}
            >
              Top {MULTI_PV} lines
            </Typography>
            {lines.map((line, idx) => (
              <PvLineRow
                key={line.multiPv}
                line={line}
                fen={fen}
                rank={idx + 1}
                onClick={() => handlePlayLine(line)}
              />
            ))}
          </Box>
        </>
      ) : (
        !isThinking && (
          <Typography variant="body2" sx={{ color: palette.textMuted }}>
            Set up a position on the board or load a FEN, then click &quot;Find
            best move&quot; to see Stockfish&apos;s top {MULTI_PV} lines.
          </Typography>
        )
      )}
    </>
  );

  return (
    <ToolsShell
      title="Next Move Calculator"
      subtitle="Play a position or paste a FEN — Stockfish suggests the best move, with eval, depth, and the top lines."
      seoTitle="Next Move Calculator — VoltChess"
      seoDescription="Paste a FEN or play moves on the board and let Stockfish find the best next move instantly, free and unlimited."
      board={board}
      panel={panel}
      related={[
        { href: "/tools/editor", label: "Board editor" },
        { href: "/analysis", label: "Full analysis" },
        { href: "/openings", label: "Opening trainer" },
        { href: "/tools/elo-calculator", label: "Elo calculator" },
      ]}
    />
  );
}
