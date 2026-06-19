import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePalette } from "@/hooks/usePalette";
import { fetchSyncOverview, triggerSync } from "@/lib/api/sync";
import { updateCoachLink } from "@/lib/api/academies";
import { getApiErrorMessage } from "@/lib/apiErrors";

type Platform = "chesscom" | "lichess";

function platformLabel(p: string): string {
  return p === "lichess" ? "Lichess" : "Chess.com";
}

/**
 * Student-owned chess account connection. The student (not the coach) picks
 * their Chess.com / Lichess username here; saving it immediately imports their
 * last 30 games and shows live import + analysis progress.
 */
export default function StudentPlatformCard() {
  const palette = usePalette();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [platform, setPlatform] = useState<Platform>("chesscom");
  const [username, setUsername] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["sync-overview"],
    queryFn: () => fetchSyncOverview(),
    // Poll faster while games are still importing / being analyzed so the
    // progress bar advances without a manual refresh.
    refetchInterval: (query) => {
      const d = query.state.data;
      const busy = d && (d.games_pending > 0 || d.games_in_progress > 0);
      return busy ? 8_000 : 60_000;
    },
  });

  const links = data?.platform_links ?? [];
  const connected = links.find((l) => l.platform && l.platform_username);
  const linkIds = links.map((l) => l.link_id);

  const saveMut = useMutation({
    mutationFn: async () => {
      const trimmed = username.trim();
      // A student may be linked to multiple coaches; connect the account for
      // all of them so every coach receives the imported games.
      await Promise.all(
        linkIds.map((id) =>
          updateCoachLink(id, {
            platform,
            platform_username: trimmed,
            sync_enabled: true,
          })
        )
      );
      return triggerSync();
    },
    onSuccess: () => {
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["sync-overview"] });
      qc.invalidateQueries({ queryKey: ["my-games"] });
    },
  });

  const syncMut = useMutation({
    mutationFn: () => triggerSync(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sync-overview"] });
      qc.invalidateQueries({ queryKey: ["my-games"] });
    },
  });

  const startEdit = () => {
    setPlatform((connected?.platform as Platform) || "chesscom");
    setUsername(connected?.platform_username ?? "");
    setEditing(true);
  };

  const total = data?.games_total ?? 0;
  const analyzed = data?.games_analyzed ?? 0;
  const remaining = (data?.games_pending ?? 0) + (data?.games_in_progress ?? 0);
  const failed = data?.games_failed ?? 0;
  const importing = saveMut.isPending || syncMut.isPending;
  const analyzing = remaining > 0;
  const progress = total > 0 ? Math.round((analyzed / total) * 100) : 0;

  const cardSx = useMemo(
    () => ({
      p: 2.5,
      borderRadius: 2,
      bgcolor: palette.surfaceRaised,
      border: `1px solid ${palette.border}`,
    }),
    [palette]
  );

  if (isLoading) {
    return (
      <Box sx={cardSx}>
        <CircularProgress size={26} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={cardSx}>
        <Alert severity="warning">{getApiErrorMessage(error)}</Alert>
      </Box>
    );
  }

  const noLinks = linkIds.length === 0;

  return (
    <Box sx={cardSx}>
      <Box sx={{ display: "flex", gap: 1, mb: 1.5, alignItems: "center" }}>
        <Icon
          icon="mdi:account-sync-outline"
          width={22}
          color={palette.accent}
        />
        <Typography variant="h6" fontWeight={700}>
          Your chess account
        </Typography>
      </Box>

      {noLinks ? (
        <Typography variant="body2" color="text.secondary">
          Join a classroom with your coach&apos;s code below, then connect your
          Chess.com or Lichess account here to import and analyze your games.
        </Typography>
      ) : editing ? (
        <Stack spacing={1.5}>
          <TextField
            select
            size="small"
            label="Platform"
            value={platform}
            onChange={(e) => setPlatform(e.target.value as Platform)}
            fullWidth
          >
            <MenuItem value="chesscom">Chess.com</MenuItem>
            <MenuItem value="lichess">Lichess</MenuItem>
          </TextField>
          <TextField
            size="small"
            label="Your username"
            placeholder={
              platform === "lichess"
                ? "e.g. DrNykterstein"
                : "e.g. MagnusCarlsen"
            }
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              disabled={!username.trim() || saveMut.isPending}
              onClick={() => saveMut.mutate()}
              sx={{ bgcolor: palette.accent, color: palette.onAccent }}
            >
              {saveMut.isPending ? "Connecting…" : "Connect & import"}
            </Button>
            <Button
              size="small"
              onClick={() => setEditing(false)}
              disabled={saveMut.isPending}
            >
              Cancel
            </Button>
          </Box>
          {saveMut.isError && (
            <Alert severity="error">{getApiErrorMessage(saveMut.error)}</Alert>
          )}
        </Stack>
      ) : connected ? (
        <>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Icon
              icon={
                connected.platform === "lichess"
                  ? "simple-icons:lichess"
                  : "simple-icons:chessdotcom"
              }
              width={18}
            />
            <Typography variant="body2">
              {platformLabel(connected.platform)}:{" "}
              <strong>{connected.platform_username}</strong>
            </Typography>
            <Button size="small" onClick={startEdit} sx={{ ml: "auto" }}>
              Change
            </Button>
          </Box>
          {connected.sync_status === "error" && connected.sync_error && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {connected.sync_error}
            </Alert>
          )}
        </>
      ) : (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Connect your Chess.com or Lichess account to automatically import
            your last 30 games and generate reports.
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={startEdit}
            sx={{ bgcolor: palette.accent, color: palette.onAccent }}
          >
            Connect account
          </Button>
        </Box>
      )}

      {connected && !editing && (
        <>
          <Stack
            direction="row"
            spacing={1}
            sx={{ flexWrap: "wrap", mt: 1.5, gap: 1 }}
          >
            <Chip
              size="small"
              color="success"
              variant="outlined"
              label={`${analyzed} report${analyzed === 1 ? "" : "s"} ready`}
            />
            {remaining > 0 && (
              <Chip
                size="small"
                color="warning"
                variant="outlined"
                label={`${remaining} analyzing`}
              />
            )}
            {failed > 0 && (
              <Chip
                size="small"
                color="error"
                variant="outlined"
                label={`${failed} failed`}
              />
            )}
            <Chip size="small" variant="outlined" label={`${total} synced`} />
          </Stack>

          {(importing || analyzing) && (
            <Box sx={{ mt: 1.5 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {importing
                    ? "Importing your last 30 games…"
                    : `Analyzing games — keep this tab open (${analyzed}/${total})`}
                </Typography>
                {!importing && total > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    {progress}%
                  </Typography>
                )}
              </Box>
              <LinearProgress
                variant={importing ? "indeterminate" : "determinate"}
                value={progress}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
          )}

          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1.5 }}
          >
            <Button
              size="small"
              variant="outlined"
              disabled={syncMut.isPending || saveMut.isPending}
              onClick={() => syncMut.mutate()}
              startIcon={<Icon icon="mdi:refresh" width={16} />}
            >
              {syncMut.isPending ? "Syncing…" : "Sync now"}
            </Button>
            {connected.last_sync_at && (
              <Typography variant="caption" color="text.secondary">
                Last sync {new Date(connected.last_sync_at).toLocaleString()}
              </Typography>
            )}
          </Box>
          {syncMut.isError && (
            <Alert severity="error" sx={{ mt: 1.5 }}>
              {getApiErrorMessage(syncMut.error)}
            </Alert>
          )}
        </>
      )}
    </Box>
  );
}
