import { Box, Button, Chip, CircularProgress, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Icon } from "@iconify/react";
import { useAtomValue, useSetAtom } from "jotai";
import { Chess, type Move } from "chess.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  boardAtom,
  boardOrientationAtom,
  currentPositionAtom,
  engineDepthAtom,
  gameAtom,
  gameEvalAtom,
} from "../states";
import { advancedEngineOnAtom, threatModeAtom } from "./states";
import { usePalette } from "@/hooks/usePalette";
import { useChessActions } from "@/hooks/useChessActions";
import { moveLineUciToSan, uciMoveParams } from "@/lib/chess";
import { playSoundFromMove } from "@/lib/sounds";
import { getPositionWinPercentage } from "@/lib/engine/helpers/winPercentage";
import { MoveClassification } from "@/types/enums";
import { CLASSIFICATION_GLYPHS, LICHESS_COLORS } from "./lichess";

const JUDGED = new Set<MoveClassification>([
  MoveClassification.Inaccuracy,
  MoveClassification.Mistake,
  MoveClassification.Blunder,
]);

/** Win threshold: your try may be at most 4 win-% worse than the best move */
const WIN_TOLERANCE = -4;

type Phase = "find" | "checking" | "win" | "fail" | "view" | "done";

interface RetroSession {
  color: "w" | "b";
  queue: number[];
  pointer: number;
  phase: Phase;
  solved: number;
  failReason?: string;
}

export default function LearnFromMistakes() {
  const palette = usePalette();
  const gameEval = useAtomValue(gameEvalAtom);
  const game = useAtomValue(gameAtom);
  const board = useAtomValue(boardAtom);
  const currentPosition = useAtomValue(currentPositionAtom);
  const engineDepth = useAtomValue(engineDepthAtom);
  const setEngineOn = useSetAtom(advancedEngineOnAtom);
  const setThreatMode = useSetAtom(threatModeAtom);
  const setBoardOrientation = useSetAtom(boardOrientationAtom);
  const setBoard = useSetAtom(boardAtom);
  const { goToMove } = useChessActions(boardAtom);

  const [session, setSession] = useState<RetroSession | null>(null);
  const gradedFenRef = useRef<string | null>(null);

  const gameHistory = useMemo(() => game.history({ verbose: true }), [game]);

  const mistakesByColor = useMemo(() => {
    const result: Record<"w" | "b", number[]> = { w: [], b: [] };
    if (!gameEval) return result;

    gameEval.positions.forEach((positionEval, idx) => {
      if (idx === 0 || !positionEval.moveClassification) return;
      if (!JUDGED.has(positionEval.moveClassification)) return;
      const side = idx % 2 === 1 ? "w" : "b";
      result[side].push(idx);
    });
    return result;
  }, [gameEval]);

  // Reset when a different game/analysis loads
  useEffect(() => {
    setSession(null);
  }, [gameEval]);

  const currentMistakeIdx = session?.queue[session.pointer];
  const mistakeMove: Move | undefined =
    currentMistakeIdx !== undefined
      ? gameHistory[currentMistakeIdx - 1]
      : undefined;

  const bestUci =
    currentMistakeIdx !== undefined
      ? (gameEval?.positions[currentMistakeIdx - 1]?.bestMove ??
        gameEval?.positions[currentMistakeIdx - 1]?.lines[0]?.pv[0])
      : undefined;
  const bestSan =
    bestUci && mistakeMove
      ? moveLineUciToSan(mistakeMove.before)(bestUci)
      : undefined;

  const jumpToMistake = useCallback(
    (mistakeIdx: number) => {
      goToMove(mistakeIdx - 1, game);
      gradedFenRef.current = null;
    },
    [goToMove, game]
  );

  const start = useCallback(
    (color: "w" | "b") => {
      const queue = mistakesByColor[color];
      if (!queue.length) return;

      setEngineOn(true);
      setThreatMode(false);
      setBoardOrientation(color === "w");
      setSession({
        color,
        queue,
        pointer: 0,
        phase: "find",
        solved: 0,
      });
      jumpToMistake(queue[0]);
    },
    [
      mistakesByColor,
      setEngineOn,
      setThreatMode,
      setBoardOrientation,
      jumpToMistake,
    ]
  );

  const advance = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      const nextPointer = prev.pointer + 1;
      if (nextPointer >= prev.queue.length) {
        return { ...prev, phase: "done" };
      }
      jumpToMistake(prev.queue[nextPointer]);
      return { ...prev, pointer: nextPointer, phase: "find" };
    });
  }, [jumpToMistake]);

  const retry = useCallback(() => {
    if (currentMistakeIdx === undefined) return;
    jumpToMistake(currentMistakeIdx);
    setSession((prev) => (prev ? { ...prev, phase: "find" } : prev));
  }, [currentMistakeIdx, jumpToMistake]);

  const viewSolution = useCallback(() => {
    if (currentMistakeIdx === undefined || !bestUci) return;
    try {
      const newGame = new Chess();
      newGame.loadPgn(game.pgn());
      while (newGame.history().length > currentMistakeIdx - 1) newGame.undo();
      const move = newGame.move(uciMoveParams(bestUci));
      setBoard(newGame);
      playSoundFromMove(move);
      setSession((prev) => (prev ? { ...prev, phase: "view" } : prev));
    } catch {
      advance();
    }
  }, [currentMistakeIdx, bestUci, game, setBoard, advance]);

  // Detect and grade the user's try
  useEffect(() => {
    if (!session || !gameEval || currentMistakeIdx === undefined) return;
    if (session.phase !== "find" && session.phase !== "checking") return;

    const boardHistory = board.history({ verbose: true });
    if (boardHistory.length !== currentMistakeIdx) return;

    // Must still be on the mainline prefix + one try move
    for (let i = 0; i < currentMistakeIdx - 1; i++) {
      if (boardHistory[i].san !== gameHistory[i]?.san) return;
    }

    const tryMove = boardHistory[currentMistakeIdx - 1];
    const tryUci = tryMove.from + tryMove.to + (tryMove.promotion ?? "");
    const boardFen = board.fen();

    if (gradedFenRef.current === boardFen) return;

    // Same mistake as in the game
    if (mistakeMove && tryMove.san === mistakeMove.san) {
      gradedFenRef.current = boardFen;
      setSession((prev) =>
        prev
          ? {
              ...prev,
              phase: "fail",
              failReason: "You played the game move. Find a better one!",
            }
          : prev
      );
      return;
    }

    // Engine best move — instant win
    if (bestUci && tryUci === bestUci) {
      gradedFenRef.current = boardFen;
      setSession((prev) =>
        prev ? { ...prev, phase: "win", solved: prev.solved + 1 } : prev
      );
      return;
    }

    // Checkmate delivered by the player is always a win
    if (board.isCheckmate()) {
      gradedFenRef.current = boardFen;
      setSession((prev) =>
        prev ? { ...prev, phase: "win", solved: prev.solved + 1 } : prev
      );
      return;
    }

    if (session.phase === "find") {
      setSession((prev) => (prev ? { ...prev, phase: "checking" } : prev));
      return;
    }

    // Grade using the live evaluation once deep enough
    const prevPositionEval = gameEval.positions[currentMistakeIdx - 1];
    let tryWinPercentage: number | undefined;

    if (board.isStalemate() || board.isDraw()) {
      tryWinPercentage = 50;
    } else {
      const evalNow = currentPosition.eval;
      const lastMove = currentPosition.lastMove;
      const minDepth = Math.min(10, engineDepth);
      if (
        !evalNow?.lines?.length ||
        !lastMove ||
        lastMove.from !== tryMove.from ||
        lastMove.to !== tryMove.to ||
        (evalNow.lines[0].depth ?? 0) < minDepth
      ) {
        return;
      }
      tryWinPercentage = getPositionWinPercentage(evalNow);
    }

    const prevWinPercentage = getPositionWinPercentage(prevPositionEval);
    const diff =
      (tryWinPercentage - prevWinPercentage) * (session.color === "w" ? 1 : -1);

    gradedFenRef.current = boardFen;
    if (diff > WIN_TOLERANCE) {
      setSession((prev) =>
        prev ? { ...prev, phase: "win", solved: prev.solved + 1 } : prev
      );
    } else {
      setSession((prev) =>
        prev
          ? { ...prev, phase: "fail", failReason: "You can do better." }
          : prev
      );
    }
  }, [
    session,
    board,
    gameEval,
    gameHistory,
    currentPosition,
    currentMistakeIdx,
    mistakeMove,
    bestUci,
    engineDepth,
  ]);

  if (!gameEval) return null;

  const whiteCount = mistakesByColor.w.length;
  const blackCount = mistakesByColor.b.length;

  if (!session) {
    return (
      <Box
        sx={{
          bgcolor: palette.surface,
          border: `1px solid ${palette.border}`,
          borderRadius: 1.5,
          p: 1.25,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1 }}>
          <Icon icon="mdi:school-outline" width={18} color={palette.accent} />
          <Typography fontSize="0.82rem" fontWeight={700}>
            Learn from your mistakes
          </Typography>
        </Box>

        {whiteCount === 0 && blackCount === 0 ? (
          <Typography fontSize="0.78rem" color="text.secondary">
            No inaccuracies, mistakes or blunders in this game — nothing to
            review!
          </Typography>
        ) : (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              fullWidth
              size="small"
              variant="outlined"
              disabled={whiteCount === 0}
              onClick={() => start("w")}
              startIcon={
                <Box
                  component="img"
                  src="/piece/maestro/wK.svg"
                  sx={{ width: 16, height: 16 }}
                />
              }
            >
              White ({whiteCount})
            </Button>
            <Button
              fullWidth
              size="small"
              variant="outlined"
              disabled={blackCount === 0}
              onClick={() => start("b")}
              startIcon={
                <Box
                  component="img"
                  src="/piece/maestro/bK.svg"
                  sx={{ width: 16, height: 16 }}
                />
              }
            >
              Black ({blackCount})
            </Button>
          </Box>
        )}
      </Box>
    );
  }

  const glyph = mistakeMove
    ? CLASSIFICATION_GLYPHS[
        gameEval.positions[currentMistakeIdx ?? 0]?.moveClassification ??
          MoveClassification.Mistake
      ]
    : undefined;
  const colorLabel = session.color === "w" ? "White" : "Black";

  const statusContent = (() => {
    switch (session.phase) {
      case "find":
        return (
          <Typography fontSize="0.8rem" sx={{ color: LICHESS_COLORS.mistake }}>
            {mistakeMove
              ? `${colorLabel} played ${mistakeMove.san}${glyph?.symbol ?? ""} here.`
              : ""}{" "}
            Find a better move for {colorLabel.toLowerCase()}.
          </Typography>
        );
      case "checking":
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={14} />
            <Typography fontSize="0.8rem" color="text.secondary">
              Evaluating your move…
            </Typography>
          </Box>
        );
      case "win":
        return (
          <Typography
            fontSize="0.8rem"
            fontWeight={700}
            sx={{ color: LICHESS_COLORS.goodMove }}
          >
            Good move!
          </Typography>
        );
      case "fail":
        return (
          <Typography
            fontSize="0.8rem"
            fontWeight={600}
            sx={{ color: LICHESS_COLORS.blunder }}
          >
            {session.failReason ?? "You can do better."}
          </Typography>
        );
      case "view":
        return (
          <Typography fontSize="0.8rem" sx={{ color: LICHESS_COLORS.primary }}>
            {bestSan} was best. Study the idea, then continue.
          </Typography>
        );
      case "done":
        return (
          <Typography
            fontSize="0.8rem"
            fontWeight={700}
            sx={{ color: LICHESS_COLORS.goodMove }}
          >
            Done! You solved {session.solved}/{session.queue.length}.
          </Typography>
        );
    }
  })();

  return (
    <Box
      sx={{
        bgcolor: palette.surface,
        border: `1px solid ${alpha(palette.accent, 0.45)}`,
        borderRadius: 1.5,
        p: 1.25,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.75 }}>
        <Icon icon="mdi:school-outline" width={18} color={palette.accent} />
        <Typography fontSize="0.82rem" fontWeight={700} sx={{ flex: 1 }}>
          Learn from your mistakes
        </Typography>
        <Chip
          size="small"
          label={
            session.phase === "done"
              ? "Complete"
              : `${session.pointer + 1} / ${session.queue.length}`
          }
          sx={{
            height: 20,
            fontSize: "0.68rem",
            bgcolor: alpha(palette.accent, 0.15),
            color: palette.text,
          }}
        />
      </Box>

      <Box sx={{ minHeight: 26, mb: 1 }}>{statusContent}</Box>

      <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
        {session.phase === "done" ? (
          <>
            <Button
              size="small"
              variant="outlined"
              onClick={() => start(session.color)}
            >
              Restart
            </Button>
            <Button
              size="small"
              variant="text"
              onClick={() => setSession(null)}
            >
              Close
            </Button>
          </>
        ) : (
          <>
            {(session.phase === "fail" || session.phase === "checking") && (
              <Button size="small" variant="outlined" onClick={retry}>
                Retry
              </Button>
            )}
            {(session.phase === "win" || session.phase === "view") && (
              <Button
                size="small"
                variant="contained"
                onClick={advance}
                sx={{ bgcolor: palette.accent, color: palette.onAccent }}
              >
                Next
              </Button>
            )}
            {(session.phase === "find" || session.phase === "fail") && (
              <Button size="small" variant="text" onClick={viewSolution}>
                View solution
              </Button>
            )}
            <Button size="small" variant="text" onClick={advance}>
              Skip
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button
              size="small"
              variant="text"
              onClick={() => setSession(null)}
              sx={{ color: palette.textMuted, minWidth: 0 }}
            >
              <Icon icon="mdi:close" width={16} />
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}
