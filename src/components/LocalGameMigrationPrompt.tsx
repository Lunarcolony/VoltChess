import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ENABLE_AUTHENTICATION } from "@/constants";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import {
  hasMigratedLocalGames,
  migrateLocalGamesToServer,
} from "@/lib/gameSync";

export default function LocalGameMigrationPrompt() {
  const { isAuthenticated, loading } = useAuth();
  const { games, isReady } = useGameDatabase(true);
  const [open, setOpen] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => {
    if (
      !ENABLE_AUTHENTICATION ||
      loading ||
      !isAuthenticated ||
      !isReady ||
      hasMigratedLocalGames()
    ) {
      return;
    }
    if (games.length > 0) {
      setOpen(true);
    }
  }, [isAuthenticated, loading, isReady, games.length]);

  const handleMigrate = useCallback(async () => {
    setMigrating(true);
    try {
      const count = await migrateLocalGamesToServer();
      setResult(count);
    } catch (err) {
      console.error(err);
      setResult(0);
    } finally {
      setMigrating(false);
    }
  }, []);

  const handleClose = useCallback(() => {
    if (!migrating) {
      if (result === null) {
        import("@/lib/gameSync").then((m) => m.markLocalGamesMigrated());
      }
      setOpen(false);
    }
  }, [migrating, result]);

  if (!open) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upload games from this device?</DialogTitle>
      <DialogContent>
        {result !== null ? (
          <Typography>
            {result > 0
              ? `Uploaded ${result} game${result !== 1 ? "s" : ""} to your academy account.`
              : "No games were uploaded."}
          </Typography>
        ) : (
          <Typography color="text.secondary">
            You have {games.length} game{games.length !== 1 ? "s" : ""} saved
            locally. Upload them to the VoltChess server so your coach can
            review them?
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        {result !== null ? (
          <Button onClick={handleClose}>Done</Button>
        ) : (
          <>
            <Button onClick={handleClose} disabled={migrating}>
              Not now
            </Button>
            <Button
              variant="contained"
              onClick={handleMigrate}
              disabled={migrating}
            >
              {migrating ? "Uploading…" : "Upload games"}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
