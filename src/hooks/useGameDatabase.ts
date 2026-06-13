import { formatGameToDatabase } from "@/lib/chess";
import { fetchGame } from "@/lib/api/games";
import { isServerGameId } from "@/lib/gameSync";
import { GameEval } from "@/types/eval";
import { Game } from "@/types/game";
import { Chess } from "chess.js";
import { openDB, DBSchema, IDBPDatabase } from "idb";
import { atom, useAtom } from "jotai";
import { useRouter } from "@/hooks/useRouter";
import { useCallback, useEffect, useState } from "react";

interface GameDatabaseSchema extends DBSchema {
  games: {
    value: Game;
    key: number;
  };
}

export type LoadedServerGame = {
  serverId: string;
  pgn: string;
  eval?: GameEval;
  white: Game["white"];
  black: Game["black"];
};

const gamesAtom = atom<Game[]>([]);
const fetchGamesAtom = atom<boolean>(false);

export const useGameDatabase = (shouldFetchGames?: boolean) => {
  const [db, setDb] = useState<IDBPDatabase<GameDatabaseSchema> | null>(null);
  const [games, setGames] = useAtom(gamesAtom);
  const [fetchGames, setFetchGames] = useAtom(fetchGamesAtom);
  const [gameFromUrl, setGameFromUrl] = useState<Game | undefined>(undefined);
  const [serverGameFromUrl, setServerGameFromUrl] = useState<
    LoadedServerGame | undefined
  >(undefined);

  useEffect(() => {
    if (shouldFetchGames !== undefined) {
      setFetchGames(shouldFetchGames);
    }
  }, [shouldFetchGames, setFetchGames]);

  useEffect(() => {
    const initDatabase = async () => {
      const db = await openDB<GameDatabaseSchema>("games", 1, {
        upgrade(db) {
          db.createObjectStore("games", { keyPath: "id", autoIncrement: true });
        },
      });
      setDb(db);
    };

    initDatabase();
  }, []);

  const loadGames = useCallback(async () => {
    if (db && fetchGames) {
      const games = await db.getAll("games");
      setGames(games);
    }
  }, [db, fetchGames, setGames]);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const addGame = useCallback(
    async (game: Chess) => {
      if (!db) throw new Error("Database not initialized");

      const gameToAdd = formatGameToDatabase(game);
      const gameId = await db.add("games", gameToAdd as Game);

      loadGames();

      return gameId;
    },
    [db, loadGames]
  );

  const setGameEval = useCallback(
    async (gameId: number, evaluation: GameEval) => {
      if (!db) throw new Error("Database not initialized");

      const game = await db.get("games", gameId);
      if (!game) throw new Error("Game not found");

      await db.put("games", { ...game, eval: evaluation });

      loadGames();
    },
    [db, loadGames]
  );

  const getGame = useCallback(
    async (gameId: number) => {
      if (!db) return undefined;

      return db.get("games", gameId);
    },
    [db]
  );

  const deleteGame = useCallback(
    async (gameId: number) => {
      if (!db) throw new Error("Database not initialized");

      await db.delete("games", gameId);

      loadGames();
    },
    [db, loadGames]
  );

  const router = useRouter();
  const { gameId } = router.query;

  useEffect(() => {
    if (typeof gameId !== "string") {
      setGameFromUrl(undefined);
      setServerGameFromUrl(undefined);
      return;
    }

    if (isServerGameId(gameId)) {
      setGameFromUrl(undefined);
      fetchGame(gameId)
        .then((serverGame) => {
          setServerGameFromUrl({
            serverId: serverGame.id,
            pgn: serverGame.pgn,
            white: serverGame.white,
            black: serverGame.black,
            eval: serverGame.eval
              ? {
                  positions: serverGame.eval.positions,
                  accuracy: serverGame.eval.accuracy,
                  estimatedElo: serverGame.eval.estimated_elo,
                  settings: serverGame.eval.settings,
                }
              : undefined,
          });
        })
        .catch(() => setServerGameFromUrl(undefined));
      return;
    }

    setServerGameFromUrl(undefined);
    const localId = parseInt(gameId, 10);
    if (Number.isNaN(localId)) {
      setGameFromUrl(undefined);
      return;
    }
    getGame(localId).then((game) => setGameFromUrl(game));
  }, [gameId, getGame]);

  const isReady = db !== null;

  return {
    addGame,
    setGameEval,
    getGame,
    deleteGame,
    games,
    isReady,
    gameFromUrl,
    serverGameFromUrl,
  };
};
