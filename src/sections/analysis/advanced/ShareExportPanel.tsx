import {
  Box,
  Button,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useAtomValue } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { boardAtom, gameAtom, gameEvalAtom } from "../states";
import { usePalette } from "@/hooks/usePalette";
import { buildAnnotatedPgn } from "./annotatedPgn";

function useCopy() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = useCallback(async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(
        () => setCopiedKey((prev) => (prev === key ? null : prev)),
        1500
      );
    } catch {
      // Clipboard unavailable (permissions) — nothing sensible to do
    }
  }, []);

  return { copy, copiedKey };
}

const downloadFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: "application/x-chess-pgn" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const encodePgnParam = (pgn: string): string => {
  const bytes = new TextEncoder().encode(pgn);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
};

export default function ShareExportPanel() {
  const palette = usePalette();
  const game = useAtomValue(gameAtom);
  const board = useAtomValue(boardAtom);
  const gameEval = useAtomValue(gameEvalAtom);
  const { copy, copiedKey } = useCopy();

  const fen = board.fen();
  const hasGame = game.history().length > 0;
  const pgn = useMemo(
    () => (hasGame ? game.pgn() : board.pgn()),
    [game, board, hasGame]
  );

  const annotatedPgn = useMemo(
    () => (hasGame && gameEval ? buildAnnotatedPgn(game, gameEval) : undefined),
    [game, gameEval, hasGame]
  );

  const analysisLink = useMemo(() => {
    if (!pgn.trim()) return undefined;
    return `${window.location.origin}/analysis?pgn=${encodeURIComponent(
      encodePgnParam(pgn)
    )}`;
  }, [pgn]);

  const sectionSx = {
    bgcolor: palette.surface,
    border: `1px solid ${palette.border}`,
    borderRadius: 1.5,
    p: 1.25,
  } as const;

  const fieldSx = {
    "& .MuiInputBase-root": {
      fontSize: "0.72rem",
      fontFamily: "monospace",
      bgcolor: palette.surfaceRaised,
    },
  } as const;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, pb: 1 }}>
      <Box sx={sectionSx}>
        <Typography
          fontSize="0.72rem"
          fontWeight={700}
          color="text.secondary"
          sx={{ mb: 0.75, textTransform: "uppercase", letterSpacing: "0.05em" }}
        >
          Current position (FEN)
        </Typography>
        <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
          <TextField
            fullWidth
            size="small"
            value={fen}
            slotProps={{ input: { readOnly: true } }}
            onFocus={(e) => e.target.select()}
            sx={fieldSx}
          />
          <Tooltip title={copiedKey === "fen" ? "Copied!" : "Copy FEN"}>
            <IconButton size="small" onClick={() => copy("fen", fen)}>
              <Icon
                icon={copiedKey === "fen" ? "mdi:check" : "mdi:content-copy"}
                width={16}
              />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={sectionSx}>
        <Typography
          fontSize="0.72rem"
          fontWeight={700}
          color="text.secondary"
          sx={{ mb: 0.75, textTransform: "uppercase", letterSpacing: "0.05em" }}
        >
          Share
        </Typography>
        <Button
          fullWidth
          size="small"
          variant="outlined"
          disabled={!analysisLink}
          startIcon={
            <Icon
              icon={copiedKey === "link" ? "mdi:check" : "mdi:link-variant"}
              width={16}
            />
          }
          onClick={() => analysisLink && copy("link", analysisLink)}
        >
          {copiedKey === "link" ? "Link copied!" : "Copy analysis link"}
        </Button>
      </Box>

      <Box sx={sectionSx}>
        <Typography
          fontSize="0.72rem"
          fontWeight={700}
          color="text.secondary"
          sx={{ mb: 0.75, textTransform: "uppercase", letterSpacing: "0.05em" }}
        >
          PGN
        </Typography>

        <TextField
          fullWidth
          multiline
          minRows={4}
          maxRows={10}
          size="small"
          value={pgn}
          slotProps={{ input: { readOnly: true } }}
          onFocus={(e) => e.target.select()}
          sx={{ ...fieldSx, mb: 1 }}
        />

        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
          <Button
            size="small"
            variant="outlined"
            disabled={!pgn.trim()}
            startIcon={
              <Icon
                icon={copiedKey === "pgn" ? "mdi:check" : "mdi:content-copy"}
                width={15}
              />
            }
            onClick={() => copy("pgn", pgn)}
          >
            Copy
          </Button>
          <Button
            size="small"
            variant="outlined"
            disabled={!pgn.trim()}
            startIcon={<Icon icon="mdi:download" width={15} />}
            onClick={() => downloadFile("voltchess-game.pgn", pgn)}
          >
            Download
          </Button>
          <Tooltip
            title={
              annotatedPgn
                ? "PGN with evals, glyphs and best-move variations"
                : "Analyze the game first"
            }
          >
            <span>
              <Button
                size="small"
                variant="outlined"
                disabled={!annotatedPgn}
                startIcon={<Icon icon="mdi:file-star-outline" width={15} />}
                onClick={() =>
                  annotatedPgn &&
                  downloadFile("voltchess-analysis.pgn", annotatedPgn)
                }
              >
                Annotated
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {annotatedPgn && (
        <Box sx={sectionSx}>
          <Typography
            fontSize="0.72rem"
            fontWeight={700}
            color="text.secondary"
            sx={{
              mb: 0.75,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Annotated PGN preview
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={4}
            maxRows={12}
            size="small"
            value={annotatedPgn}
            slotProps={{ input: { readOnly: true } }}
            onFocus={(e) => e.target.select()}
            sx={fieldSx}
          />
        </Box>
      )}
    </Box>
  );
}
