import {
  Autocomplete,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { alpha } from "@mui/material/styles";
import GameReviewCard from "@/components/GameReviewCard";
import { usePalette } from "@/hooks/usePalette";
import { useUsernameGames } from "@/hooks/useUsernameGames";
import type { PlatformId } from "@/sections/loadGame/platformGameConfig";

export type GameSearchVariant = "home" | "inline" | "dialog";

interface Props {
  platform: PlatformId;
  onSelect: (pgn: string, boardOrientation?: boolean) => void;
  presetUsername?: string;
  variant?: GameSearchVariant;
  fillHeight?: boolean;
}

export default function UsernameGameSearch({
  platform,
  onSelect,
  presetUsername,
  variant = "home",
  fillHeight = false,
}: Props) {
  const palette = usePalette();
  const compact = variant === "inline";
  const {
    config,
    username,
    setUsername,
    debouncedUsername,
    storedUsernames,
    games,
    isFetching,
    isError,
    saveUsername,
    removeUsername,
    boardOrientationFor,
  } = useUsernameGames(platform, presetUsername);

  const showGrid = !!debouncedUsername.trim();
  const gridColumns =
    variant === "inline"
      ? "1fr"
      : variant === "dialog"
        ? { xs: "1fr", sm: "repeat(2, 1fr)" }
        : { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: fillHeight ? 1 : undefined,
        minHeight: fillHeight ? 0 : undefined,
        width: "100%",
        gap: compact ? 1.25 : 2,
      }}
    >
      {!compact && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ lineHeight: 1.6 }}
        >
          {config.description}
        </Typography>
      )}

      <Autocomplete
        freeSolo
        options={storedUsernames}
        inputValue={username}
        onInputChange={(_, value) => setUsername(value ?? "")}
        onChange={(_, value) => setUsername(value ?? "")}
        renderOption={(props, option) => {
          const { key, ...rest } = props;
          return (
            <Box
              component="li"
              key={key}
              {...rest}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Typography fontSize="0.875rem">{option}</Typography>
              <IconButton
                size="small"
                aria-label={`Remove ${option}`}
                onClick={(e) => {
                  e.stopPropagation();
                  removeUsername(option);
                }}
              >
                <Icon icon="mdi:close" width={16} />
              </IconButton>
            </Box>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={config.placeholder}
            size={compact ? "small" : "medium"}
            slotProps={{
              input: {
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <Icon
                        icon={config.icon}
                        width={20}
                        color={palette.accent}
                      />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: palette.bg,
              },
            }}
          />
        )}
      />

      {showGrid && (
        <Box
          sx={{
            flex: fillHeight ? 1 : undefined,
            minHeight: fillHeight ? 0 : undefined,
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{ color: palette.text }}
            >
              {isFetching ? "Loading games…" : "Recent games"}
            </Typography>
            {!isFetching && games?.length ? (
              <Typography variant="caption" color="text.secondary">
                {games.length} found for{" "}
                <Box
                  component="span"
                  sx={{ color: palette.accent, fontWeight: 600 }}
                >
                  {debouncedUsername}
                </Box>
              </Typography>
            ) : null}
          </Box>

          {isFetching ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                py: variant === "inline" ? 3 : 5,
              }}
            >
              <CircularProgress size={28} sx={{ color: palette.accent }} />
            </Box>
          ) : isError ? (
            <Box
              sx={{
                py: 2.5,
                px: 2,
                borderRadius: 2,
                bgcolor: alpha(palette.accent, 0.06),
                border: `1px dashed ${palette.border}`,
                textAlign: "center",
              }}
            >
              <Typography variant="body2" color="error">
                User not found. Check the username and try again.
              </Typography>
            </Box>
          ) : !games?.length ? (
            <Box
              sx={{
                py: 2.5,
                px: 2,
                borderRadius: 2,
                bgcolor: alpha(palette.accent, 0.06),
                border: `1px dashed ${palette.border}`,
                textAlign: "center",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No recent games found for this username.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: gridColumns,
                gap: { xs: 1.25, sm: 1.5 },
                maxHeight: fillHeight ? "100%" : undefined,
                overflowY: fillHeight ? "auto" : "visible",
                pr: fillHeight ? 0.5 : 0,
                "&::-webkit-scrollbar": { width: 6 },
                "&::-webkit-scrollbar-thumb": {
                  bgcolor: palette.border,
                  borderRadius: 3,
                },
              }}
            >
              {games.map((game) => (
                <GameReviewCard
                  key={game.id}
                  game={game}
                  username={debouncedUsername}
                  analysisLabel="Click to analyze"
                  onClick={() => {
                    onSelect(game.pgn, boardOrientationFor(game.black?.name));
                    saveUsername(debouncedUsername);
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
      )}

      {!showGrid && storedUsernames.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          {storedUsernames.slice(0, 6).map((stored) => (
            <Chip
              key={stored}
              label={stored}
              size="small"
              onClick={() => setUsername(stored)}
              sx={{
                bgcolor: alpha(palette.accent, 0.08),
                border: `1px solid ${alpha(palette.accent, 0.2)}`,
                "&:hover": { bgcolor: alpha(palette.accent, 0.14) },
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
