import { formatGameToDatabase } from "@/lib/chess";
import { fetchGame } from "@/lib/api/games";
import { isServerGameId } from "@/lib/gameSync";
import { debug } from "@/lib/debug";
import { isAxiosError } from "axios";
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
      debug.log("idb", "opening IndexedDB games v1");
      const db = await openDB<GameDatabaseSchema>("games", 1, {
        upgrade(db) {
          debug.log("idb", "IndexedDB upgrade — creating games object store");
          db.createObjectStore("games", { keyPath: "id", autoIncrement: true });
        },
      });
      debug.log("idb", "IndexedDB ready");
      setDb(db);
    };

    initDatabase();
  }, []);

  const loadGames = useCallback(async () => {
    if (db && fetchGames) {
      const games = await db.getAll("games");
      debug.log("idb", "loaded local games from IndexedDB", {
        count: games.length,
      });
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
      debug.log("idb", "added local game", { gameId });

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
      debug.log("idb", "saved eval for local game", { gameId });

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
      debug.log("idb", "deleted local game", { gameId });

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
      return undefined;
    }

    debug.log("idb", "gameId from URL changed", {
      gameId,
      isServer: isServerGameId(gameId),
    });

    if (isServerGameId(gameId)) {
      setGameFromUrl(undefined);

      let cancelled = false;
      let pollId: ReturnType<typeof setInterval> | undefined;

      const load = async (): Promise<"ok" | "pending" | "gone"> => {
        try {
          debug.log("idb", "fetchGame from server", { gameId });
          const serverGame = await fetchGame(gameId);
          if (cancelled) return "pending";
          const hasEval = !!serverGame.eval;
          debug.log("idb", "fetchGame result", {
            gameId,
            hasEval,
            white: serverGame.white?.name,
            black: serverGame.black?.name,
          });
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
          return serverGame.eval ? "ok" : "pending";
        } catch (err) {
          if (!cancelled) setServerGameFromUrl(undefined);
          if (isAxiosError(err) && err.response?.status === 404) {
            debug.warn("idb", "fetchGame 404 — stopping poll", { gameId });
            return "gone";
          }
          debug.warn("idb", "fetchGame failed — will retry poll", {
            gameId,
            status: isAxiosError(err) ? err.response?.status : undefined,
          });
          return "pending";
        }
      };

      void load().then((state) => {
        if (cancelled || state === "ok") return;
        if (state === "gone") return;
        debug.log("idb", "starting eval poll (5s interval)", { gameId });
        pollId = setInterval(async () => {
          const next = await load();
          if (next === "ok" || next === "gone") {
            if (pollId) clearInterval(pollId);
            debug.log("idb", "eval poll stopped", { gameId, reason: next });
          }
        }, 5000);
      });

      return () => {
        cancelled = true;
        if (pollId) clearInterval(pollId);
      };
    }

    setServerGameFromUrl(undefined);
    const localId = parseInt(gameId, 10);
    if (Number.isNaN(localId)) {
      setGameFromUrl(undefined);
      return undefined;
    }
    getGame(localId).then((game) => {
      debug.log("idb", "loaded local game from URL", {
        localId,
        found: !!game,
      });
      setGameFromUrl(game);
    });
    return undefined;
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
