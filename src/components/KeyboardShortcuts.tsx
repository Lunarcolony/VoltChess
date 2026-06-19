import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Fab,
} from "@mui/material";
import { Icon } from "@iconify/react";

interface Shortcut {
  key: string;
  description: string;
  category: "navigation" | "analysis" | "game";
}

const shortcuts: Shortcut[] = [
  {
    key: "?",
    description: "Show/hide keyboard shortcuts",
    category: "navigation",
  },
  { key: "←", description: "Previous move", category: "analysis" },
  { key: "→", description: "Next move", category: "analysis" },
  { key: "↑", description: "Go to first move", category: "analysis" },
  { key: "↓", description: "Go to last move", category: "analysis" },
  { key: "Space", description: "Auto-play moves", category: "analysis" },
  { key: "F", description: "Flip board", category: "game" },
  { key: "A", description: "Start/stop analysis", category: "analysis" },
  { key: "H", description: "Show hint", category: "game" },
  { key: "R", description: "Reset to start position", category: "game" },
  { key: "Esc", description: "Close modals", category: "navigation" },
];

interface KeyboardShortcutsProps {
  onShortcut?: (key: string) => void;
}

export function KeyboardShortcuts({ onShortcut }: KeyboardShortcutsProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const key = event.key;

      switch (key) {
        case "?":
          event.preventDefault();
          setOpen(!open);
          break;
        case "Escape":
          event.preventDefault();
          setOpen(false);
          break;
        case "ArrowLeft":
        case "ArrowRight":
        case "ArrowUp":
        case "ArrowDown":
        case " ":
        case "f":
        case "F":
        case "a":
        case "A":
        case "h":
        case "H":
        case "r":
        case "R":
          event.preventDefault();
          onShortcut?.(key);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onShortcut]);

  const getCategoryColor = (category: Shortcut["category"]) => {
    switch (category) {
      case "navigation":
        return "primary";
      case "analysis":
        return "secondary";
      case "game":
        return "success";
      default:
        return "default";
    }
  };

  return (
    <>
      <Fab
        color="primary"
        size="small"
        onClick={() => setOpen(true)}
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: 1000,
          backgroundColor: "#3b9ac6",
          "&:hover": { backgroundColor: "#3385ad" },
        }}
        title="Keyboard shortcuts (?)"
      >
        <Icon icon="mdi:keyboard" />
      </Fab>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              background: "rgba(40, 44, 52, 0.95)",
              backdropFilter: "blur(8px)",
              border: "1.5px solid #3a3f4b",
            },
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Icon icon="mdi:keyboard" />
          <Typography variant="h6">Keyboard Shortcuts</Typography>
          <IconButton
            onClick={() => setOpen(false)}
            sx={{ ml: "auto" }}
            size="small"
          >
            <Icon icon="mdi:close" />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Use these keyboard shortcuts to navigate VoltChess more efficiently:
          </Typography>

          {["navigation", "analysis", "game"].map((category) => (
            <Box key={category} sx={{ mb: 3 }}>
              <Typography
                variant="h6"
                sx={{ mb: 2, textTransform: "capitalize" }}
                color="primary.main"
              >
                {category}
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {shortcuts
                  .filter((shortcut) => shortcut.category === category)
                  .map((shortcut) => (
                    <Box
                      key={shortcut.key}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 1,
                        borderRadius: 1,
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                      }}
                    >
                      <Typography variant="body2">
                        {shortcut.description}
                      </Typography>
                      <Chip
                        label={shortcut.key === " " ? "Space" : shortcut.key}
                        size="small"
                        color={getCategoryColor(shortcut.category)}
                        variant="outlined"
                        sx={{ fontFamily: "monospace", minWidth: 60 }}
                      />
                    </Box>
                  ))}
              </Box>
            </Box>
          ))}

          <Box
            sx={{
              mt: 3,
              p: 2,
              backgroundColor: "rgba(59, 154, 198, 0.1)",
              borderRadius: 2,
              border: "1px solid #3b9ac6",
            }}
          >
            <Typography variant="body2" color="primary.main">
              💡 <strong>Pro tip:</strong> Press <code>?</code> anytime to
              toggle this shortcuts panel!
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
