import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useDebounce } from "@/hooks/useDebounce";
import {
  PLATFORM_CONFIG,
  type PlatformId,
} from "@/sections/loadGame/platformGameConfig";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

function parseStoredUsernames(raw: string | null | undefined): string[] {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function useUsernameGames(
  platform: PlatformId,
  presetUsername?: string
) {
  const config = PLATFORM_CONFIG[platform];
  const [rawStoredValue, setStoredValues] = useLocalStorage<string>(
    config.storageKey,
    ""
  );
  const [username, setUsername] = useState("");
  const [hasEdited, setHasEdited] = useState(false);

  const storedUsernames = useMemo(
    () => parseStoredUsernames(rawStoredValue),
    [rawStoredValue]
  );

  useEffect(() => {
    if (presetUsername) {
      setUsername(presetUsername);
      setHasEdited(true);
      return;
    }
    if (!hasEdited && storedUsernames.length) {
      setUsername(storedUsernames[0].trim());
    }
  }, [presetUsername, hasEdited, storedUsernames]);

  const debouncedUsername = useDebounce(username, 300);

  const {
    data: games,
    isFetching,
    isError,
  } = useQuery({
    queryKey: [platform, "UserGames", debouncedUsername],
    enabled: !!debouncedUsername.trim(),
    queryFn: ({ signal }) =>
      config.fetchGames(debouncedUsername.trim(), signal),
    retry: 1,
  });

  const saveUsername = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    const updated = [
      trimmed,
      ...storedUsernames.filter((u) => u.toLowerCase() !== lower),
    ].slice(0, 8);
    setStoredValues(updated.join(","));
  };

  const removeUsername = (value: string) => {
    setStoredValues(storedUsernames.filter((u) => u !== value).join(","));
  };

  const boardOrientationFor = (opponentBlackName?: string) =>
    debouncedUsername.trim().toLowerCase() !== opponentBlackName?.toLowerCase();

  return {
    config,
    username,
    setUsername: (value: string) => {
      setUsername(value);
      setHasEdited(true);
    },
    debouncedUsername,
    storedUsernames,
    games,
    isFetching,
    isError,
    saveUsername,
    removeUsername,
    boardOrientationFor,
  };
}
