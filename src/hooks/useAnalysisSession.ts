import { useCallback, useEffect, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { Chess } from "chess.js";
import { useChessActions } from "@/hooks/useChessActions";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { useRouter } from "@/hooks/useRouter";
import { decodeBase64, decodeBase64Utf8 } from "@/lib/helpers";
import { fenToPgn } from "@/sections/loadGame/gameFenInput";
import { fetchChessComGamePgn } from "@/lib/chessComGame";
import type { Game } from "@/types/game";
import type { GameEval } from "@/types/eval";
import {
  boardAtom,
  boardOrientationAtom,
  evaluationProgressAtom,
  gameAtom,
  gameEvalAtom,
} from "@/sections/analysis/states";
import { isVoltChessSiteHost, LEGACY_SITE_HOSTS, SITE_HOST } from "@/data/seo";

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
    const hasSetup =
      chess.getHeaders().SetUp === "1" || Boolean(chess.getHeaders().FEN);
    if (chess.history().length === 0 && !hasSetup) {
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

  // Load from URL ?gameId= / ?pgn= / ?pgnText= / ?fen= / ?chesscomGame=
  const {
    pgn: pgnParam,
    pgnText: pgnTextParam,
    fen: fenParam,
    chesscomGame: chesscomGameParam,
    chesscomType: chesscomTypeParam,
    orientation: orientationParam,
  } = router.query;

  useEffect(() => {
    let cancelled = false;

    const loadGameFromIdParam = (gameUrl: Game) => {
      const fromDb = new Chess();
      fromDb.loadPgn(gameUrl.pgn);
      if (game.history().join() === fromDb.history().join() && gameEval) return;

      applyGame(
        gameUrl.pgn,
        gameUrl.eval,
        !(gameUrl.black.name === "You" && isVoltChessSiteHost(gameUrl.site))
      );
    };

    const loadGameFromPgnString = (decodedPgn: string) => {
      const parsed = new Chess();
      parsed.loadPgn(decodedPgn);
      if (game.history().join() === parsed.history().join() && gameEval) return;

      applyGame(decodedPgn, undefined, orientationParam !== "black");
    };

    const loadGameFromPgnParam = (encodedPgn: string) => {
      const decodedPgn =
        decodeBase64Utf8(encodedPgn) ?? decodeBase64(encodedPgn);
      if (!decodedPgn) return;
      loadGameFromPgnString(decodedPgn);
    };

    const run = async () => {
      if (gameFromUrl) {
        loadGameFromIdParam(gameFromUrl);
        return;
      }
      if (serverGameFromUrl) {
        const fromServer = new Chess();
        fromServer.loadPgn(serverGameFromUrl.pgn);
        if (game.history().join() === fromServer.history().join() && gameEval)
          return;

        applyGame(
          serverGameFromUrl.pgn,
          serverGameFromUrl.eval,
          !(
            serverGameFromUrl.black.name === "You" &&
            [SITE_HOST, ...LEGACY_SITE_HOSTS].some((host) =>
              serverGameFromUrl.pgn.includes(host)
            )
          )
        );
        return;
      }
      if (typeof chesscomGameParam === "string" && chesscomGameParam.length) {
        try {
          const type =
            chesscomTypeParam === "daily" ? "daily" : ("live" as const);
          const pgn = await fetchChessComGamePgn(chesscomGameParam, type);
          if (!cancelled) loadGameFromPgnString(pgn);
        } catch (err) {
          console.warn("[voltchess] chesscomGame URL load failed", err);
        }
        return;
      }
      if (typeof pgnTextParam === "string" && pgnTextParam.length > 0) {
        try {
          loadGameFromPgnString(decodeURIComponent(pgnTextParam));
        } catch {
          loadGameFromPgnString(pgnTextParam);
        }
        return;
      }
      if (typeof fenParam === "string" && fenParam.length > 0) {
        try {
          const fen = decodeURIComponent(fenParam);
          loadGameFromPgnString(fenToPgn(fen));
        } catch {
          /* invalid fen in URL — ignore */
        }
        return;
      }
      if (typeof pgnParam === "string") {
        loadGameFromPgnParam(pgnParam);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    gameFromUrl,
    serverGameFromUrl,
    pgnParam,
    pgnTextParam,
    fenParam,
    chesscomGameParam,
    chesscomTypeParam,
    orientationParam,
    game,
    gameEval,
    applyGame,
  ]);

  // Persist session whenever game or eval changes
  useEffect(() => {
    const hasSetup =
      game.getHeaders().SetUp === "1" || Boolean(game.getHeaders().FEN);
    if (game.history().length === 0 && !hasSetup) return;
    saveAnalysisSession(game.pgn(), gameEval, boardOrientation);
  }, [game, gameEval, boardOrientation]);
}
