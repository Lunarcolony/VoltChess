import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid2 as Grid,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  FormControlLabel,
  Checkbox,
  Alert,
  Tooltip,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { alpha } from "@mui/material/styles";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import type {
  BoardPosition,
  Piece,
  Square,
} from "react-chessboard/dist/chessboard/types";
import { PageTitle } from "@/components/pageTitle";
import PageContainer from "@/components/PageContainer";
import { useCardSx, usePalette } from "@/hooks/usePalette";
import { useRouter } from "@/hooks/useRouter";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1] as const;

const WHITE_TRAY: Piece[] = ["wK", "wQ", "wR", "wB", "wN", "wP"];
const BLACK_TRAY: Piece[] = ["bK", "bQ", "bR", "bB", "bN", "bP"];

interface CastlingRights {
  K: boolean;
  Q: boolean;
  k: boolean;
  q: boolean;
}

function defaultStartingPieces(): BoardPosition {
  const chess = new Chess();
  const pieces: BoardPosition = {};
  chess.board().forEach((row) => {
    row.forEach((sq) => {
      if (!sq) return;
      pieces[sq.square as Square] =
        `${sq.color}${sq.type.toUpperCase()}` as Piece;
    });
  });
  return pieces;
}

function parseFenPiecePlacement(placement: string): BoardPosition {
  const pieces: BoardPosition = {};
  const rows = placement.split("/");

  rows.forEach((row, rankIndex) => {
    const rank = 8 - rankIndex;
    let file = 0;
    for (const char of row) {
      if (/[1-8]/.test(char)) {
        file += Number(char);
        continue;
      }
      if (file > 7) break;
      const color = char === char.toUpperCase() ? "w" : "b";
      const square = `${FILES[file]}${rank}` as Square;
      pieces[square] = `${color}${char.toUpperCase()}` as Piece;
      file += 1;
    }
  });

  return pieces;
}

interface ParsedFen {
  pieces: BoardPosition;
  sideToMove: "w" | "b";
  castling: CastlingRights;
  enPassant: string;
}

function parseFen(fen: string): ParsedFen | null {
  const parts = fen.trim().split(/\s+/);
  if (!parts[0]) return null;

  try {
    const pieces = parseFenPiecePlacement(parts[0]);
    const sideToMove = parts[1] === "b" ? "b" : "w";
    const castlingField = parts[2] || "-";
    const castling: CastlingRights = {
      K: castlingField.includes("K"),
      Q: castlingField.includes("Q"),
      k: castlingField.includes("k"),
      q: castlingField.includes("q"),
    };
    const enPassant = parts[3] && parts[3] !== "-" ? parts[3] : "";
    return { pieces, sideToMove, castling, enPassant };
  } catch {
    return null;
  }
}

function buildPiecePlacement(pieces: BoardPosition): string {
  return RANKS.map((rank) => {
    let row = "";
    let empties = 0;

    FILES.forEach((file) => {
      const square = `${file}${rank}` as Square;
      const piece = pieces[square];
      if (!piece) {
        empties += 1;
        return;
      }
      if (empties > 0) {
        row += empties;
        empties = 0;
      }
      const letter = piece[1];
      row += piece[0] === "w" ? letter : letter.toLowerCase();
    });

    if (empties > 0) row += empties;
    return row || "8";
  }).join("/");
}

function buildFen(
  pieces: BoardPosition,
  sideToMove: "w" | "b",
  castling: CastlingRights,
  enPassant: string
): string {
  const placement = buildPiecePlacement(pieces);
  const castlingStr =
    `${castling.K ? "K" : ""}${castling.Q ? "Q" : ""}${castling.k ? "k" : ""}${
      castling.q ? "q" : ""
    }` || "-";
  const epField = enPassant.trim() || "-";
  return `${placement} ${sideToMove} ${castlingStr} ${epField} 0 1`;
}

export default function BoardEditor() {
  const palette = usePalette();
  const cardSx = useCardSx();
  const router = useRouter();

  const [pieces, setPieces] = useState<BoardPosition>(() =>
    defaultStartingPieces()
  );
  const [sideToMove, setSideToMove] = useState<"w" | "b">("w");
  const [castling, setCastling] = useState<CastlingRights>({
    K: true,
    Q: true,
    k: true,
    q: true,
  });
  const [enPassant, setEnPassant] = useState("");
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [eraserMode, setEraserMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadFenInput, setLoadFenInput] = useState("");
  const [loadFenError, setLoadFenError] = useState<string | null>(null);
  const appliedUrlFenRef = useRef(false);

  useEffect(() => {
    if (appliedUrlFenRef.current) return;
    appliedUrlFenRef.current = true;

    const fenParam = router.query.fen;
    const raw = Array.isArray(fenParam) ? fenParam[0] : fenParam;
    if (!raw) return;

    try {
      const decoded = decodeURIComponent(raw);
      const parsed = parseFen(decoded);
      if (parsed) {
        setPieces(parsed.pieces);
        setSideToMove(parsed.sideToMove);
        setCastling(parsed.castling);
        setEnPassant(parsed.enPassant);
      }
    } catch {
      /* ignore invalid fen in URL */
    }
  }, [router.query.fen]);

  const fen = useMemo(
    () => buildFen(pieces, sideToMove, castling, enPassant),
    [pieces, sideToMove, castling, enPassant]
  );

  const legality = useMemo(() => {
    try {
      new Chess(fen);
      return { valid: true, message: "" };
    } catch (err) {
      return {
        valid: false,
        message: err instanceof Error ? err.message : "Illegal position",
      };
    }
  }, [fen]);

  const pieceCount = Object.keys(pieces).length;

  const handleSquareClick = (square: Square) => {
    if (eraserMode) {
      setPieces((prev) => {
        if (!prev[square]) return prev;
        const next = { ...prev };
        delete next[square];
        return next;
      });
      return;
    }
    if (selectedPiece) {
      setPieces((prev) => ({ ...prev, [square]: selectedPiece }));
    }
  };

  const handlePieceDrop = (
    source: Square,
    target: Square,
    piece: Piece
  ): boolean => {
    if (source === target) return true;
    setPieces((prev) => {
      const next = { ...prev };
      delete next[source];
      next[target] = piece;
      return next;
    });
    return true;
  };

  const handleSelectTrayPiece = (piece: Piece) => {
    setEraserMode(false);
    setSelectedPiece((prev) => (prev === piece ? null : piece));
  };

  const handleToggleEraser = () => {
    setSelectedPiece(null);
    setEraserMode((prev) => !prev);
  };

  const handleClearBoard = () => {
    setPieces({});
  };

  const handleStartingPosition = () => {
    setPieces(defaultStartingPieces());
    setSideToMove("w");
    setCastling({ K: true, Q: true, k: true, q: true });
    setEnPassant("");
  };

  const handleCopyFen = async () => {
    try {
      await navigator.clipboard.writeText(fen);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  const handleLoadFen = () => {
    const parsed = parseFen(loadFenInput);
    if (!parsed) {
      setLoadFenError("Couldn't read that FEN's piece placement.");
      return;
    }
    setLoadFenError(null);
    setPieces(parsed.pieces);
    setSideToMove(parsed.sideToMove);
    setCastling(parsed.castling);
    setEnPassant(parsed.enPassant);
  };

  const analyzeHref = `/analysis?fen=${encodeURIComponent(fen)}`;
  const nextMoveHref = `/tools/next-move?fen=${encodeURIComponent(fen)}`;

  const renderTrayButton = (piece: Piece) => {
    const isSelected = selectedPiece === piece;
    return (
      <Tooltip key={piece} title={piece}>
        <Box
          role="button"
          onClick={() => handleSelectTrayPiece(piece)}
          sx={{
            width: 44,
            height: 44,
            display: "grid",
            placeItems: "center",
            borderRadius: 1.5,
            cursor: "pointer",
            border: `1px solid ${
              isSelected ? palette.accent : palette.borderSubtle
            }`,
            bgcolor: isSelected ? alpha(palette.accent, 0.14) : palette.surface,
            transition: "border-color 0.15s ease",
            "&:hover": { borderColor: alpha(palette.accent, 0.6) },
          }}
        >
          <Box
            component="img"
            src={`/piece/maestro/${piece}.svg`}
            alt={piece}
            sx={{ width: 32, height: 32 }}
          />
        </Box>
      </Tooltip>
    );
  };

  return (
    <>
      <PageTitle
        title="Board Editor — VoltChess"
        description="Set up any chess position piece by piece, configure castling rights and side to move, then copy the FEN or send it straight to analysis."
      />

      <PageContainer
        title="Board Editor"
        subtitle="Stamp pieces onto the board, set castling rights and side to move, then copy the FEN or hand it off to analysis."
      >
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Box sx={{ ...cardSx, display: "flex", justifyContent: "center" }}>
              <Box sx={{ width: "100%", maxWidth: 480 }}>
                <Chessboard
                  position={pieces}
                  arePiecesDraggable
                  onPieceDrop={handlePieceDrop}
                  onSquareClick={handleSquareClick}
                  customBoardStyle={{
                    borderRadius: "6px",
                    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.35)",
                  }}
                />

                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    flexWrap: "wrap",
                    mt: 2,
                    mb: 1.5,
                  }}
                >
                  {WHITE_TRAY.map(renderTrayButton)}
                  <Box
                    sx={{
                      width: 0,
                      borderLeft: `1px solid ${palette.borderSubtle}`,
                      mx: 0.5,
                    }}
                  />
                  <Tooltip title="Eraser — remove pieces">
                    <Box
                      role="button"
                      onClick={handleToggleEraser}
                      sx={{
                        width: 44,
                        height: 44,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: 1.5,
                        cursor: "pointer",
                        border: `1px solid ${
                          eraserMode ? palette.accent : palette.borderSubtle
                        }`,
                        bgcolor: eraserMode
                          ? alpha(palette.accent, 0.14)
                          : palette.surface,
                        color: eraserMode ? palette.accent : palette.textMuted,
                      }}
                    >
                      <Icon icon="mdi:eraser" width={22} />
                    </Box>
                  </Tooltip>
                </Box>

                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {BLACK_TRAY.map(renderTrayButton)}
                </Box>

                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Icon icon="mdi:restart" width={16} />}
                    onClick={handleStartingPosition}
                  >
                    Starting position
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={
                      <Icon icon="mdi:delete-sweep-outline" width={16} />
                    }
                    onClick={handleClearBoard}
                    disabled={pieceCount === 0}
                  >
                    Clear board
                  </Button>
                </Box>
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={{ ...cardSx, mb: 2.5 }}>
              <Typography variant="h3" sx={{ fontSize: "1rem", mb: 1.5 }}>
                Game state
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Side to move
              </Typography>
              <ToggleButtonGroup
                exclusive
                value={sideToMove}
                onChange={(_, value) => value && setSideToMove(value)}
                size="small"
                sx={{ mb: 2 }}
              >
                <ToggleButton value="w">White</ToggleButton>
                <ToggleButton value="b">Black</ToggleButton>
              </ToggleButtonGroup>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 0.5 }}
              >
                Castling rights (KQkq)
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={castling.K}
                      onChange={(e) =>
                        setCastling((prev) => ({
                          ...prev,
                          K: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="White O-O"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={castling.Q}
                      onChange={(e) =>
                        setCastling((prev) => ({
                          ...prev,
                          Q: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="White O-O-O"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={castling.k}
                      onChange={(e) =>
                        setCastling((prev) => ({
                          ...prev,
                          k: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="Black O-O"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={castling.q}
                      onChange={(e) =>
                        setCastling((prev) => ({
                          ...prev,
                          q: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="Black O-O-O"
                />
              </Box>

              <TextField
                fullWidth
                size="small"
                label="En passant square (optional)"
                placeholder="e.g. e3, or leave blank"
                value={enPassant}
                onChange={(e) =>
                  setEnPassant(e.target.value.trim().toLowerCase())
                }
                sx={{ mb: 1 }}
              />
            </Box>

            <Box sx={{ ...cardSx, mb: 2.5 }}>
              <Typography variant="h3" sx={{ fontSize: "1rem", mb: 1.5 }}>
                FEN
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={2}
                value={fen}
                slotProps={{ input: { readOnly: true } }}
                sx={{
                  mb: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    bgcolor: palette.bg,
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                  },
                }}
              />

              {!legality.valid && (
                <Alert severity="warning" sx={{ mb: 1.5 }}>
                  This position isn&apos;t fully legal ({legality.message}). You
                  can still copy the FEN, but analysis tools may not work
                  correctly until it&apos;s fixed.
                </Alert>
              )}

              <Button
                variant="outlined"
                startIcon={
                  <Icon
                    icon={copied ? "mdi:check" : "mdi:content-copy"}
                    width={16}
                  />
                }
                onClick={handleCopyFen}
                sx={{
                  borderRadius: 2,
                  borderColor: alpha(palette.accent, 0.35),
                  color: palette.text,
                }}
              >
                {copied ? "Copied!" : "Copy FEN"}
              </Button>

              <Box sx={{ mt: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Or paste a FEN to load it here
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Paste FEN…"
                    value={loadFenInput}
                    onChange={(e) => setLoadFenInput(e.target.value)}
                    error={!!loadFenError}
                    helperText={loadFenError || " "}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        fontFamily: "monospace",
                        fontSize: "0.78rem",
                      },
                    }}
                  />
                  <Button variant="outlined" onClick={handleLoadFen}>
                    Load
                  </Button>
                </Box>
              </Box>
            </Box>

            <Box
              sx={{
                ...cardSx,
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              <Typography variant="h3" sx={{ fontSize: "1rem", mb: 0.5 }}>
                Send this position to…
              </Typography>
              <Button
                variant="contained"
                startIcon={
                  <Icon icon="mdi:chart-timeline-variant" width={18} />
                }
                onClick={() => router.push(analyzeHref)}
              >
                Analyze position
              </Button>
              <Button
                variant="outlined"
                startIcon={<Icon icon="mdi:chess-queen" width={18} />}
                onClick={() => router.push(nextMoveHref)}
                sx={{
                  borderColor: alpha(palette.accent, 0.35),
                  color: palette.text,
                }}
              >
                Find best move
              </Button>
            </Box>
          </Grid>
        </Grid>
      </PageContainer>
    </>
  );
}
