import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  FormControlLabel,
  Checkbox,
  Alert,
  Tooltip,
  Divider,
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
import ToolsShell, { ToolPrimaryButton } from "@/sections/tools/ToolsShell";
import { usePalette } from "@/hooks/usePalette";
import { useRouter } from "@/hooks/useRouter";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1] as const;

const WHITE_TRAY: Piece[] = ["wK", "wQ", "wR", "wB", "wN", "wP"];
const BLACK_TRAY: Piece[] = ["bK", "bQ", "bR", "bB", "bN", "bP"];

const EN_PASSANT_PATTERN = /^[a-h][36]$/;

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
  halfmove: number;
  fullmove: number;
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
    const halfmove = Number.isFinite(Number(parts[4])) ? Number(parts[4]) : 0;
    const fullmove = Number.isFinite(Number(parts[5])) ? Number(parts[5]) : 1;
    return {
      pieces,
      sideToMove,
      castling,
      enPassant,
      halfmove: Math.max(0, halfmove),
      fullmove: Math.max(1, fullmove),
    };
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
  enPassant: string,
  halfmove: number,
  fullmove: number
): string {
  const placement = buildPiecePlacement(pieces);
  const castlingStr =
    `${castling.K ? "K" : ""}${castling.Q ? "Q" : ""}${castling.k ? "k" : ""}${
      castling.q ? "q" : ""
    }` || "-";
  const epField = EN_PASSANT_PATTERN.test(enPassant) ? enPassant : "-";
  return `${placement} ${sideToMove} ${castlingStr} ${epField} ${Math.max(
    0,
    halfmove
  )} ${Math.max(1, fullmove)}`;
}

function checkLegality(fen: string): { valid: boolean; message: string } {
  const placement = fen.split(" ")[0] ?? "";
  const whiteKings = (placement.match(/K/g) || []).length;
  const blackKings = (placement.match(/k/g) || []).length;

  if (whiteKings !== 1) {
    return {
      valid: false,
      message:
        whiteKings === 0 ? "White is missing a king" : "White has two kings",
    };
  }
  if (blackKings !== 1) {
    return {
      valid: false,
      message:
        blackKings === 0 ? "Black is missing a king" : "Black has two kings",
    };
  }

  try {
    new Chess(fen);
    return { valid: true, message: "" };
  } catch (err) {
    return {
      valid: false,
      message:
        err instanceof Error
          ? err.message.replace(/^Invalid FEN:\s*/, "")
          : "Illegal position",
    };
  }
}

export default function BoardEditor() {
  const palette = usePalette();
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
  const [halfmove, setHalfmove] = useState(0);
  const [fullmove, setFullmove] = useState(1);
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
      new Chess(decoded);
      const parsed = parseFen(decoded);
      if (parsed) {
        setPieces(parsed.pieces);
        setSideToMove(parsed.sideToMove);
        setCastling(parsed.castling);
        setEnPassant(parsed.enPassant);
        setHalfmove(parsed.halfmove);
        setFullmove(parsed.fullmove);
      }
    } catch {
      /* ignore invalid fen in URL */
    }
  }, [router.query.fen]);

  const fen = useMemo(
    () => buildFen(pieces, sideToMove, castling, enPassant, halfmove, fullmove),
    [pieces, sideToMove, castling, enPassant, halfmove, fullmove]
  );

  const legality = useMemo(() => checkLegality(fen), [fen]);
  const enPassantValid = enPassant === "" || EN_PASSANT_PATTERN.test(enPassant);
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
    setHalfmove(0);
    setFullmove(1);
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
    const trimmed = loadFenInput.trim();
    try {
      new Chess(trimmed);
    } catch {
      setLoadFenError("Invalid FEN — check piece placement and fields.");
      return;
    }

    const parsed = parseFen(trimmed);
    if (!parsed) {
      setLoadFenError("Couldn't read that FEN's piece placement.");
      return;
    }
    setLoadFenError(null);
    setPieces(parsed.pieces);
    setSideToMove(parsed.sideToMove);
    setCastling(parsed.castling);
    setEnPassant(parsed.enPassant);
    setHalfmove(parsed.halfmove);
    setFullmove(parsed.fullmove);
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
            width: 42,
            height: 42,
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
            sx={{ width: 30, height: 30 }}
          />
        </Box>
      </Tooltip>
    );
  };

  const board = (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ width: "100%", maxWidth: 560, mx: "auto" }}>
        <Chessboard
          position={pieces}
          arePiecesDraggable
          onPieceDrop={handlePieceDrop}
          onSquareClick={handleSquareClick}
          customBoardStyle={{
            borderRadius: "8px",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
          }}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
          justifyContent: "center",
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
              width: 42,
              height: 42,
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
            <Icon icon="mdi:eraser" width={20} />
          </Box>
        </Tooltip>
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {BLACK_TRAY.map(renderTrayButton)}
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
          justifyContent: "center",
          mt: 0.5,
        }}
      >
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
          startIcon={<Icon icon="mdi:delete-sweep-outline" width={16} />}
          onClick={handleClearBoard}
          disabled={pieceCount === 0}
        >
          Clear board
        </Button>
      </Box>
    </Box>
  );

  const panel = (
    <>
      <Box>
        <Typography
          variant="overline"
          sx={{
            color: palette.textMuted,
            letterSpacing: "0.1em",
            fontSize: "0.66rem",
            display: "block",
            mb: 1,
          }}
        >
          Side to move
        </Typography>
        <ToggleButtonGroup
          exclusive
          fullWidth
          value={sideToMove}
          onChange={(_, value) => value && setSideToMove(value)}
          size="small"
        >
          <ToggleButton value="w">White</ToggleButton>
          <ToggleButton value="b">Black</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box>
        <Typography
          variant="overline"
          sx={{
            color: palette.textMuted,
            letterSpacing: "0.1em",
            fontSize: "0.66rem",
            display: "block",
            mb: 0.5,
          }}
        >
          Castling rights
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap" }}>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={castling.K}
                onChange={(e) =>
                  setCastling((prev) => ({ ...prev, K: e.target.checked }))
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
                  setCastling((prev) => ({ ...prev, Q: e.target.checked }))
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
                  setCastling((prev) => ({ ...prev, k: e.target.checked }))
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
                  setCastling((prev) => ({ ...prev, q: e.target.checked }))
                }
              />
            }
            label="Black O-O-O"
          />
        </Box>
      </Box>

      <TextField
        fullWidth
        size="small"
        label="En passant square"
        placeholder="e.g. e6, or leave blank"
        value={enPassant}
        onChange={(e) => setEnPassant(e.target.value.trim().toLowerCase())}
        error={!enPassantValid}
        helperText={enPassantValid ? " " : "Must be a file a–h and rank 3 or 6"}
      />

      <Divider sx={{ borderColor: palette.borderSubtle }} />

      <Box>
        <Typography
          variant="overline"
          sx={{
            color: palette.textMuted,
            letterSpacing: "0.1em",
            fontSize: "0.66rem",
            display: "block",
            mb: 1,
          }}
        >
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
              fontFamily: "ui-monospace, monospace",
              fontSize: "0.78rem",
            },
          }}
        />

        {!legality.valid && (
          <Alert severity="warning" sx={{ mb: 1.5 }}>
            Illegal position — {legality.message}. Fix it before analyzing.
          </Alert>
        )}

        <Button
          size="small"
          variant="outlined"
          startIcon={
            <Icon icon={copied ? "mdi:check" : "mdi:content-copy"} width={16} />
          }
          onClick={handleCopyFen}
          sx={{
            borderColor: alpha(palette.accent, 0.35),
            color: palette.text,
          }}
        >
          {copied ? "Copied!" : "Copy FEN"}
        </Button>
      </Box>

      <Box>
        <Typography variant="body2" sx={{ color: palette.textMuted, mb: 1 }}>
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
                fontFamily: "ui-monospace, monospace",
                fontSize: "0.78rem",
              },
            }}
          />
          <Button variant="outlined" onClick={handleLoadFen}>
            Load
          </Button>
        </Box>
      </Box>

      <Box
        sx={{ display: "flex", flexDirection: "column", gap: 1, mt: "auto" }}
      >
        <ToolPrimaryButton
          disabled={!legality.valid}
          startIcon={<Icon icon="mdi:chart-timeline-variant" width={18} />}
          onClick={() => router.push(analyzeHref)}
        >
          Analyze position
        </ToolPrimaryButton>
        <Button
          fullWidth
          variant="outlined"
          disabled={!legality.valid}
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
    </>
  );

  return (
    <ToolsShell
      title="Board Editor"
      subtitle="Stamp pieces onto the board, set castling rights and side to move, then copy the FEN or hand it off to analysis."
      seoTitle="Board Editor — VoltChess"
      seoDescription="Set up any chess position piece by piece, configure castling rights and side to move, then copy the FEN or send it straight to analysis."
      board={board}
      panel={panel}
      related={[
        { href: "/tools/next-move", label: "Next move calculator" },
        { href: "/analysis", label: "Full analysis" },
        { href: "/openings", label: "Opening trainer" },
        { href: "/tools/elo-calculator", label: "Elo calculator" },
      ]}
    />
  );
}
