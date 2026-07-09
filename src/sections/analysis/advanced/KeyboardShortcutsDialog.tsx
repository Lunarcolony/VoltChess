import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useAtom } from "jotai";
import { shortcutsDialogOpenAtom } from "./states";
import { usePalette } from "@/hooks/usePalette";

const SHORTCUTS: { keys: string[]; action: string }[] = [
  { keys: ["←", "→"], action: "Previous / next move" },
  { keys: ["↓", "↑"], action: "Go to start / end" },
  { keys: ["Space"], action: "Play the best engine move" },
  { keys: ["f"], action: "Flip board" },
  { keys: ["l"], action: "Toggle local engine" },
  { keys: ["a"], action: "Toggle best-move arrows" },
  { keys: ["x"], action: "Show threat (opponent's plan)" },
  { keys: ["?"], action: "This help dialog" },
];

export default function KeyboardShortcutsDialog() {
  const palette = usePalette();
  const [open, setOpen] = useAtom(shortcutsDialogOpenAtom);

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        Keyboard shortcuts
      </DialogTitle>
      <DialogContent>
        {SHORTCUTS.map(({ keys, action }) => (
          <Box
            key={action}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              py: 0.6,
              borderBottom: `1px solid ${palette.borderSubtle}`,
              "&:last-of-type": { borderBottom: "none" },
            }}
          >
            <Typography fontSize="0.85rem">{action}</Typography>
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {keys.map((key) => (
                <Box
                  key={key}
                  sx={{
                    px: 1,
                    py: 0.25,
                    minWidth: 28,
                    textAlign: "center",
                    borderRadius: 0.75,
                    bgcolor: palette.surfaceRaised,
                    border: `1px solid ${palette.border}`,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    fontFamily: "monospace",
                  }}
                >
                  {key}
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </DialogContent>
    </Dialog>
  );
}
