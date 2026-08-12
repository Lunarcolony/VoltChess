import { useAtomValue } from "jotai";
import {
  engineEloAtom,
  gameAtom,
  playerColorAtom,
  isGameInProgressAtom,
  gameDataAtom,
  enginePlayNameAtom,
} from "./states";
import { useChessActions } from "@/hooks/useChessActions";
import { useEffect, useMemo } from "react";
import { getPlayBoardSize, useScreenSize } from "@/hooks/useScreenSize";
import { useEngine } from "@/hooks/useEngine";
import { getSharedEngine } from "@/lib/engine/sharedEngine";
import { waitForEngineReady } from "@/lib/engine/waitForEngine";
import { uciMoveParams } from "@/lib/chess";
import Board from "@/components/board";
import { useGameData } from "@/hooks/useGameData";
import { usePlayersData } from "@/hooks/usePlayersData";
import { sleep } from "@/lib/helpers";

export default function BoardContainer() {
  const screenSize = useScreenSize();
  const engineName = useAtomValue(enginePlayNameAtom);
  useEngine(engineName); // preload the shared engine
  const game = useAtomValue(gameAtom);
  const { white, black } = usePlayersData(gameAtom);
  const playerColor = useAtomValue(playerColorAtom);
  const { playMove } = useChessActions(gameAtom);
  const engineElo = useAtomValue(engineEloAtom);
  const isGameInProgress = useAtomValue(isGameInProgressAtom);

  const gameFen = game.fen();
  const isGameFinished = game.isGameOver();

  useEffect(() => {
    let cancelled = false;

    const playEngineMove = async () => {
      if (game.turn() === playerColor || isGameFinished || !isGameInProgress) {
        return;
      }

      try {
        // Waits for the engine to finish loading (e.g. user starts as Black
        // right after page load) instead of silently skipping the move.
        const engine = await waitForEngineReady(engineName);
        if (cancelled) return;

        const timePromise = sleep(1000);
        const move = await engine.getEngineNextMove(gameFen, engineElo);
        await timePromise;

        if (!cancelled && move) playMove(uciMoveParams(move));
      } catch {
        /* engine unavailable — user can retry by making a move */
      }
    };
    playEngineMove();

    return () => {
      cancelled = true;
      getSharedEngine()?.stopAllCurrentJobs();
    };
  }, [gameFen, isGameInProgress]); // eslint-disable-line react-hooks/exhaustive-deps

  const boardSize = useMemo(
    () => getPlayBoardSize(screenSize.width, screenSize.height),
    [screenSize]
  );

  useGameData(gameAtom, gameDataAtom);

  return (
    <Board
      id="PlayBoard"
      canPlay={isGameInProgress ? playerColor : false}
      gameAtom={gameAtom}
      boardSize={boardSize}
      whitePlayer={white}
      blackPlayer={black}
      boardOrientation={playerColor}
      currentPositionAtom={gameDataAtom}
    />
  );
}
