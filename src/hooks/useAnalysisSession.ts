import { useCallback, useEffect, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { Chess } from "chess.js";
import { useChessActions } from "@/hooks/useChessActions";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { useRouter } from "@/hooks/useRouter";
import { decodeBase64 } from "@/lib/helpers";
import type { Game } from "@/types/game";
import type { GameEval } from "@/types/eval";
import {
  boardAtom,
  boardOrientationAtom,
  evaluationProgressAtom,
  gameAtom,
  gameEvalAtom,
} from "@/sections/analysis/states";

const SESSION_KEY = "voltchess-analysis-session";

interface AnalysisSession {
  pgn: string;
  eval?: GameEval;
  boardOrientation: boolean;
}

export function saveAnalysisSession(
  pgn: string,
  evalData: GameEval | undefined,
  boardOrientation: boolean
) {
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    if (chess.history().length === 0) {
      sessionStorage.removeItem(SESSION_KEY);
      return;
    }
    const session: AnalysisSession = { pgn, eval: evalData, boardOrientation };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

export function clearAnalysisSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

/** Write a fresh game to session before navigating to /analysis */
export function prepareNewAnalysisSession(
  pgn: string,
  boardOrientation = true
) {
  saveAnalysisSession(pgn, undefined, boardOrientation);
}

/** Restore analysis state from sessionStorage and URL query params. */
export function useAnalysisSession() {
  const router = useRouter();
  const game = useAtomValue(gameAtom);
  const gameEval = useAtomValue(gameEvalAtom);
  const boardOrientation = useAtomValue(boardOrientationAtom);
  const { setPgn: setGamePgn } = useChessActions(gameAtom);
  const { resetToStartingPosition: resetBoard } = useChessActions(boardAtom);
  const setEval = useSetAtom(gameEvalAtom);
  const setBoardOrientation = useSetAtom(boardOrientationAtom);
  const setEvaluationProgress = useSetAtom(evaluationProgressAtom);
  const { gameFromUrl, serverGameFromUrl } = useGameDatabase();
  const restoredRef = useRef(false);

  const applyGame = useCallback(
    (pgn: string, evalData?: GameEval, orientation = true) => {
      resetBoard(pgn);
      setGamePgn(pgn);
      setEval(evalData);
      setBoardOrientation(orientation);
      setEvaluationProgress(0);
    },
    [
      resetBoard,
      setGamePgn,
      setEval,
      setBoardOrientation,
      setEvaluationProgress,
    ]
  );

  // Restore session on first mount (survives page reload)
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    setEvaluationProgress(0);

    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        const session = JSON.parse(raw) as AnalysisSession;
        if (session.pgn) {
          applyGame(
            session.pgn,
            session.eval,
            session.boardOrientation ?? true
          );
          return;
        }
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
  }, [applyGame, setEvaluationProgress]);

  // Load from URL ?gameId= or ?pgn=
  const { pgn: pgnParam, orientation: orientationParam } = router.query;

  useEffect(() => {
    const loadGameFromIdParam = (gameUrl: Game) => {
      const fromDb = new Chess();
      fromDb.loadPgn(gameUrl.pgn);
      if (game.history().join() === fromDb.history().join() && gameEval) return;

      applyGame(
        gameUrl.pgn,
        gameUrl.eval,
        !(gameUrl.black.name === "You" && gameUrl.site === "voltchess.me")
      );
    };

    const loadGameFromPgnParam = (encodedPgn: string) => {
      const decodedPgn = decodeBase64(encodedPgn);
      if (!decodedPgn) return;

      const parsed = new Chess();
      parsed.loadPgn(decodedPgn);
      if (game.history().join() === parsed.history().join() && gameEval) return;

      applyGame(decodedPgn, undefined, orientationParam !== "black");
    };

    if (gameFromUrl) {
      loadGameFromIdParam(gameFromUrl);
    } else if (serverGameFromUrl) {
      const fromServer = new Chess();
      fromServer.loadPgn(serverGameFromUrl.pgn);
      if (game.history().join() === fromServer.history().join() && gameEval)
        return;

      applyGame(
        serverGameFromUrl.pgn,
        serverGameFromUrl.eval,
        !(
          serverGameFromUrl.black.name === "You" &&
          serverGameFromUrl.pgn.includes("voltchess.me")
        )
      );
    } else if (typeof pgnParam === "string") {
      loadGameFromPgnParam(pgnParam);
    }
  }, [
    gameFromUrl,
    serverGameFromUrl,
    pgnParam,
    orientationParam,
    game,
    gameEval,
    applyGame,
  ]);

  // Persist session whenever game or eval changes
  useEffect(() => {
    if (game.history().length === 0) return;
    saveAnalysisSession(game.pgn(), gameEval, boardOrientation);
  }, [game, gameEval, boardOrientation]);
}
