import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid2 as Grid,
  Chip,
  LinearProgress,
  Alert,
  MenuItem,
  Select,
  CircularProgress,
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
import { atom, useAtomValue } from "jotai";
import { PageTitle } from "@/components/pageTitle";
import PageContainer from "@/components/PageContainer";
import { useCardSx, usePalette } from "@/hooks/usePalette";
import { useRouter } from "@/hooks/useRouter";
import { useChessActions } from "@/hooks/useChessActions";
import { useEngine } from "@/hooks/useEngine";
import { EngineName } from "@/types/enums";
import { PositionEval } from "@/types/eval";
import { formatEvalScore } from "@/lib/formatEval";
import { uciMoveParams } from "@/lib/chess";

const nextMoveGameAtom = atom(new Chess());

const DEPTH_OPTIONS = [10, 14, 16, 18, 20] as const;

function sanPvFromFen(fen: string, pv: string[], limit = 8): string {
  const chess = new Chess(fen);
  const sanMoves: string[] = [];
  for (const uci of pv.slice(0, limit)) {
    try {
      const move = chess.move(uciMoveParams(uci));
      sanMoves.push(move.san);
    } catch {
      break;
    }
  }
  return sanMoves.join(" ");
}

function sanFromUci(fen: string, uci: string): string | null {
  try {
    const chess = new Chess(fen);
    const move = chess.move(uciMoveParams(uci));
    return move.san;
  } catch {
    return null;
  }
}

export default function NextMoveTool() {
  const palette = usePalette();
  const cardSx = useCardSx();
  const router = useRouter();
  const engine = useEngine(EngineName.Stockfish17Lite);
  const game = useAtomValue(nextMoveGameAtom);
  const { reset, playMove, undoMove } = useChessActions(nextMoveGameAtom);

  const fen = game.fen();

  const [fenInput, setFenInput] = useState(fen);
  const [fenError, setFenError] = useState<string | null>(null);
  const [depth, setDepth] = useState<number>(16);
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
    if (appliedUrlFenRef.current) return;
    appliedUrlFenRef.current = true;

    const fenParam = router.query.fen;
    const rawFen = Array.isArray(fenParam) ? fenParam[0] : fenParam;
    if (!rawFen) return;

    try {
      const decoded = decodeURIComponent(rawFen);
      new Chess(decoded);
      reset({ fen: decoded, noHeaders: true });
    } catch {
      /* ignore invalid fen in URL */
    }
  }, [router.query.fen, reset]);

  useEffect(() => {
    return () => {
      engine?.stopAllCurrentJobs();
    };
  }, [engine]);

  const onDrop = (
    source: BoardSquare,
    target: BoardSquare,
    piece: string
  ): boolean => {
    const move = playMove({
      from: source,
      to: target,
      promotion: piece[1]?.toLowerCase() ?? "q",
    });
    return !!move;
  };

  const handleLoadFen = () => {
    const trimmed = fenInput.trim();
    try {
      new Chess(trimmed);
      setFenError(null);
      reset({ fen: trimmed, noHeaders: true });
    } catch {
      setFenError("Invalid FEN — check piece placement and fields.");
    }
  };

  const handleReset = () => {
    setFenError(null);
    reset();
  };

  const handleUndo = () => {
    undoMove();
  };

  const handleFindBestMove = async () => {
    setThinkError(null);

    if (!engine) {
      setThinkError("Engine is still loading — try again in a moment.");
      return;
    }
    if (!engine.getIsReady()) {
      setThinkError("Engine is busy — try again in a moment.");
      return;
    }
    if (game.isGameOver()) {
      setThinkError("This position is already over — no moves to find.");
      return;
    }

    setIsThinking(true);
    try {
      const result = await engine.evaluatePositionWithUpdate({
        fen,
        depth,
        multiPv: 1,
        setPartialEval: setEvaluation,
      });
      setEvaluation(result);
    } catch {
      setThinkError("Couldn't evaluate this position. Try again.");
    } finally {
      setIsThinking(false);
    }
  };

  const bestLine = evaluation?.lines?.[0];
  const bestMoveUci = evaluation?.bestMove || bestLine?.pv?.[0];
  const bestMoveSan = useMemo(
    () => (bestMoveUci ? sanFromUci(fen, bestMoveUci) : null),
    [fen, bestMoveUci]
  );
  const pvSan = useMemo(
    () => (bestLine?.pv?.length ? sanPvFromFen(fen, bestLine.pv) : ""),
    [fen, bestLine]
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

  const turnLabel = game.turn() === "w" ? "White to move" : "Black to move";
  const isGameOver = game.isGameOver();

  const openInEditor = () =>
    router.push(`/tools/editor?fen=${encodeURIComponent(fen)}`);
  const analyzePosition = () =>
    router.push(`/analysis?fen=${encodeURIComponent(fen)}`);

  return (
    <>
      <PageTitle
        title="Next Move Calculator — VoltChess"
        description="Paste a FEN or play moves on the board and let Stockfish find the best next move instantly, free and unlimited."
      />

      <PageContainer
        title="Next Move Calculator"
        subtitle="Play a position or paste a FEN — Stockfish suggests the best move, with eval, depth, and the full line."
      >
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Box sx={{ ...cardSx, display: "flex", justifyContent: "center" }}>
              <Box sx={{ width: "100%", maxWidth: 480 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1.5,
                  }}
                >
                  <Chip
                    label={turnLabel}
                    size="small"
                    variant="outlined"
                    icon={
                      <Icon
                        icon={
                          game.turn() === "w"
                            ? "mdi:circle-outline"
                            : "mdi:circle"
                        }
                        width={14}
                      />
                    }
                  />
                  {isGameOver && (
                    <Chip label="Game over" size="small" color="warning" />
                  )}
                </Box>
                <Chessboard
                  position={fen}
                  onPieceDrop={onDrop}
                  customArrows={boardArrows}
                  customBoardStyle={{
                    borderRadius: "6px",
                    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.35)",
                  }}
                />
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    flexWrap: "wrap",
                    mt: 1.5,
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
                    disabled={game.history().length === 0}
                  >
                    Undo
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Icon icon="mdi:pencil-ruler" width={16} />}
                    onClick={openInEditor}
                  >
                    Open in editor
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={
                      <Icon icon="mdi:chart-timeline-variant" width={16} />
                    }
                    onClick={analyzePosition}
                  >
                    Analyze
                  </Button>
                </Box>
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={{ ...cardSx, mb: 2.5 }}>
              <Typography variant="h3" sx={{ fontSize: "1rem", mb: 1.5 }}>
                Position (FEN)
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={2}
                value={fenInput}
                onChange={(e) => setFenInput(e.target.value)}
                placeholder={DEFAULT_POSITION}
                error={!!fenError}
                helperText={fenError || " "}
                sx={{
                  mb: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    bgcolor: palette.bg,
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                  },
                }}
              />
              <Button
                variant="outlined"
                startIcon={<Icon icon="mdi:tray-arrow-down" width={18} />}
                onClick={handleLoadFen}
                sx={{
                  borderRadius: 2,
                  borderColor: alpha(palette.accent, 0.35),
                  color: palette.text,
                }}
              >
                Load position
              </Button>
            </Box>

            <Box sx={cardSx}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                <Typography variant="h3" sx={{ fontSize: "1rem" }}>
                  Best move
                </Typography>
                <Select
                  size="small"
                  value={depth}
                  onChange={(e: SelectChangeEvent<number>) =>
                    setDepth(Number(e.target.value))
                  }
                  disabled={isThinking}
                  sx={{ minWidth: 110 }}
                >
                  {DEPTH_OPTIONS.map((d) => (
                    <MenuItem key={d} value={d}>
                      Depth {d}
                    </MenuItem>
                  ))}
                </Select>
              </Box>

              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={
                  isThinking ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <Icon icon="mdi:chess-queen" width={18} />
                  )
                }
                onClick={handleFindBestMove}
                disabled={isThinking || isGameOver}
                sx={{ mb: 2 }}
              >
                {isThinking ? "Thinking…" : "Find best move"}
              </Button>

              {isThinking && (
                <LinearProgress
                  sx={{
                    mb: 2,
                    height: 4,
                    borderRadius: 2,
                    bgcolor: palette.surface,
                    "& .MuiLinearProgress-bar": { bgcolor: palette.accent },
                  }}
                />
              )}

              {!engine && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Loading Stockfish in your browser…
                </Alert>
              )}

              {thinkError && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {thinkError}
                </Alert>
              )}

              {evaluation && bestLine && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.25,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.5,
                      borderRadius: 1.5,
                      bgcolor: palette.surface,
                      border: `1px solid ${palette.borderSubtle}`,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        Best move
                      </Typography>
                      <Typography
                        variant="h3"
                        sx={{ fontSize: "1.4rem", color: palette.accent }}
                      >
                        {bestMoveSan ?? bestMoveUci ?? "—"}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        Eval
                      </Typography>
                      <Typography variant="h3" sx={{ fontSize: "1.4rem" }}>
                        {formatEvalScore(bestLine)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`Depth ${bestLine.depth}`}
                    />
                    {typeof bestLine.nodes === "number" && (
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`${bestLine.nodes.toLocaleString()} nodes`}
                      />
                    )}
                    <Chip
                      size="small"
                      variant="outlined"
                      label={EngineName.Stockfish17Lite.replace(/_/g, " ")}
                    />
                  </Box>

                  {pvSan && (
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 0.5 }}
                      >
                        Principal line
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "monospace",
                          bgcolor: palette.surface,
                          p: 1,
                          borderRadius: 1,
                          border: `1px solid ${palette.borderSubtle}`,
                        }}
                      >
                        {pvSan}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {!evaluation && !isThinking && !thinkError && (
                <Typography variant="body2" color="text.secondary">
                  Set up a position on the board or load a FEN, then click
                  &quot;Find best move&quot; to get Stockfish&apos;s
                  recommendation.
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </PageContainer>
    </>
  );
}
