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
import { uciMoveParams } from "@/lib/chess";
import Board from "@/components/board";
import { useGameData } from "@/hooks/useGameData";
import { usePlayersData } from "@/hooks/usePlayersData";
import { sleep } from "@/lib/helpers";

export default function BoardContainer() {
  const screenSize = useScreenSize();
  const engineName = useAtomValue(enginePlayNameAtom);
  const engine = useEngine(engineName);
  const game = useAtomValue(gameAtom);
  const { white, black } = usePlayersData(gameAtom);
  const playerColor = useAtomValue(playerColorAtom);
  const { playMove } = useChessActions(gameAtom);
  const engineElo = useAtomValue(engineEloAtom);
  const isGameInProgress = useAtomValue(isGameInProgressAtom);

  const gameFen = game.fen();
  const isGameFinished = game.isGameOver();

  useEffect(() => {
    const playEngineMove = async () => {
      if (
        !engine?.getIsReady() ||
        game.turn() === playerColor ||
        isGameFinished ||
        !isGameInProgress
      ) {
        return;
      }

      const timePromise = sleep(1000);
      const move = await engine.getEngineNextMove(gameFen, engineElo);
      await timePromise;

      if (move) playMove(uciMoveParams(move));
    };
    playEngineMove();

    return () => {
      engine?.stopAllCurrentJobs();
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
