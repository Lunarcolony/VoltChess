import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePalette } from "@/hooks/usePalette";
import { fetchSyncOverview, triggerSync } from "@/lib/api/sync";
import { getApiErrorMessage } from "@/lib/apiErrors";
import NavLink from "@/components/NavLink";

function platformLabel(platform: string, username: string) {
  if (!platform || !username) return "Not configured by coach";
  const name = platform === "lichess" ? "Lichess" : "Chess.com";
  return `${name}: ${username}`;
}

export default function StudentSyncPanel() {
  const palette = usePalette();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["sync-overview"],
    queryFn: () => fetchSyncOverview(),
    refetchInterval: 60_000,
  });

  const syncMut = useMutation({
    mutationFn: () => triggerSync(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sync-overview"] });
      qc.invalidateQueries({ queryKey: ["my-games"] });
    },
  });

  if (isLoading) return <CircularProgress size={28} sx={{ mb: 3 }} />;

  if (error) {
    return (
      <Alert severity="warning" sx={{ mb: 3 }}>
        {getApiErrorMessage(error)}
      </Alert>
    );
  }

  if (!data) return null;

  const configured = data.platform_links.filter(
    (l) => l.platform && l.platform_username
  );

  return (
    <Box
      sx={{
        p: 2.5,
        mb: 3,
        borderRadius: 2,
        bgcolor: palette.surfaceRaised,
        border: `1px solid ${palette.border}`,
      }}
    >
      <Box sx={{ display: "flex", gap: 1.25, mb: 1.5, alignItems: "center" }}>
        <Icon icon="mdi:cloud-sync-outline" width={24} color={palette.accent} />
        <Typography variant="h6" fontWeight={700}>
          Synced games & reports
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Your coach links your Chess.com or Lichess account. VoltChess imports
        your last 30 games, analyzes them in your browser when you&apos;re
        online, or on the academy server when you&apos;re away.
      </Typography>

      {configured.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No platform account configured yet — ask your coach to set it on your
          roster profile.
        </Typography>
      ) : (
        <>
          {configured.map((link) => (
            <Box key={link.link_id} sx={{ mb: 1.5 }}>
              <Typography fontWeight={600} fontSize="0.95rem">
                Coach {link.coach_username}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {platformLabel(link.platform, link.platform_username)}
              </Typography>
              {link.sync_status === "error" && link.sync_error && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {link.sync_error}
                </Alert>
              )}
              {link.last_sync_at && (
                <Typography variant="caption" color="text.secondary">
                  Last sync: {new Date(link.last_sync_at).toLocaleString()}
                </Typography>
              )}
            </Box>
          ))}

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2, mt: 1 }}>
            <Chip
              label={`${data.games_analyzed} analyzed`}
              size="small"
              color="success"
              variant="outlined"
            />
            <Chip
              label={`${data.games_pending} pending analysis`}
              size="small"
              color={data.games_pending ? "warning" : "default"}
              variant="outlined"
            />
            <Chip
              label={`${data.games_total} total synced`}
              size="small"
              variant="outlined"
            />
          </Box>

          <Button
            size="small"
            variant="outlined"
            disabled={syncMut.isPending}
            onClick={() => syncMut.mutate()}
            startIcon={<Icon icon="mdi:refresh" width={16} />}
          >
            {syncMut.isPending ? "Syncing…" : "Sync now"}
          </Button>
          {syncMut.isError && (
            <Alert severity="error" sx={{ mt: 1.5 }}>
              {getApiErrorMessage(syncMut.error)}
            </Alert>
          )}
        </>
      )}

      {data.games_total > 0 && (
        <Box sx={{ mt: 2 }}>
          <NavLink href="/student#synced-games">
            <Typography
              sx={{
                color: palette.accent,
                fontWeight: 600,
                fontSize: "0.9rem",
              }}
            >
              View all synced games →
            </Typography>
          </NavLink>
        </Box>
      )}
    </Box>
  );
}
