import { useLocalStorage } from "@/hooks/useLocalStorage";
import { getLichessUserRecentGames } from "@/lib/lichess";
import {
  Box,
  CircularProgress,
  FormControl,
  TextField,
  List,
  Autocomplete,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useDebounce } from "@/hooks/useDebounce";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { GameItem } from "./gameItem";

interface Props {
  onSelect: (pgn: string, boardOrientation?: boolean) => void;
  fullWidth?: boolean;
  fillHeight?: boolean;
}

export default function LichessInput({ onSelect, fullWidth, fillHeight }: Props) {
  const [rawStoredValue, setStoredValues] = useLocalStorage<string>(
    "lichess-username",
    ""
  );
  const [lichessUsername, setLichessUsername] = useState("");
  const [hasEdited, setHasEdited] = useState(false);

  const storedValues = useMemo(() => {
    if (typeof rawStoredValue === "string") {
      return rawStoredValue
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    return [];
  }, [rawStoredValue]);

  if (
    !hasEdited &&
    storedValues.length &&
    lichessUsername.trim().toLowerCase() != storedValues[0].trim().toLowerCase()
  ) {
    setLichessUsername(storedValues[0].trim());
  }

  const updateHistory = (username: string) => {
    const trimmed = username.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();

    const updated = [
      trimmed,
      ...storedValues.filter((u) => u.toLowerCase() !== lower),
    ].slice(0, 8);

    setStoredValues(updated.join(","));
  };

  const deleteUsername = (usernameToDelete: string) => {
    const updated = storedValues.filter((u) => u !== usernameToDelete);
    setStoredValues(updated.join(","));
  };

  const handleChange = (_: React.SyntheticEvent, newValue: string | null) => {
    const newInputValue = newValue ?? "";
    setLichessUsername(newInputValue.trim());
    setHasEdited(true);
  };

  const debouncedUsername = useDebounce(lichessUsername, 500);

  const {
    data: games,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ["LichessUserGames", debouncedUsername],
    enabled: !!debouncedUsername,
    queryFn: ({ signal }) =>
      getLichessUserRecentGames(debouncedUsername ?? "", signal),
    retry: 1,
  });

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: fillHeight ? 1 : undefined,
        minHeight: fillHeight ? 0 : undefined,
        width: "100%",
      }}
    >
      <FormControl
        sx={{
          my: fillHeight ? 0 : 1,
          mb: 1,
          width: fullWidth ? "100%" : 300,
          flexShrink: 0,
        }}
      >
        <Autocomplete
          freeSolo
          options={storedValues}
          inputValue={lichessUsername}
          onInputChange={handleChange}
          onChange={handleChange}
          renderOption={(props, option) => {
            const { key, ...rest } = props;
            return (
              <li
                key={key}
                {...rest}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingRight: 8,
                }}
              >
                <span>{option}</span>
                <Icon
                  icon="mdi:close"
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteUsername(option);
                  }}
                />
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Enter your Lichess username..."
              variant="outlined"
            />
          )}
        />
      </FormControl>

      {debouncedUsername && (
        <Box
          sx={{
            flex: fillHeight ? 1 : undefined,
            minHeight: fillHeight ? 0 : 100,
            display: "flex",
            flexDirection: "column",
            justifyContent: fillHeight ? "stretch" : "center",
            alignItems: fillHeight ? "stretch" : "center",
            overflow: fillHeight ? "hidden" : "visible",
          }}
        >
          {isFetching ? (
            <CircularProgress sx={{ alignSelf: "center", my: 2 }} />
          ) : isError ? (
            <Typography color="error" variant="body2" sx={{ py: 1 }}>
              User not found. Please check your username.
            </Typography>
          ) : !games?.length ? (
            <Typography color="error" variant="body2" sx={{ py: 1 }}>
              No games found. Please check your username.
            </Typography>
          ) : (
            <List
              sx={{
                width: "100%",
                flex: fillHeight ? 1 : undefined,
                minHeight: 0,
                overflow: "auto",
                pr: 0.5,
                m: 0,
                py: 0,
              }}
            >
              {games.map((game) => {
                const perspectiveUserColor =
                  game.white.name.toLowerCase() ===
                  debouncedUsername.toLowerCase()
                    ? "white"
                    : "black";

                return (
                  <GameItem
                    key={game.id}
                    game={game}
                    perspectiveUserColor={perspectiveUserColor}
                    onClick={() => {
                      const boardOrientation =
                        debouncedUsername.toLowerCase() !==
                        game.black.name.toLowerCase();
                      onSelect(game.pgn, boardOrientation);
                      updateHistory(debouncedUsername);
                    }}
                  />
                );
              })}
            </List>
          )}
        </Box>
      )}
    </Box>
  );
}
