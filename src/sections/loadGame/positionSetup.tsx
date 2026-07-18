import React, { useState } from "react";
import { Box, Button, Typography, Grid2 as Grid, Paper } from "@mui/material";
import { Icon } from "@iconify/react";
import { Chess } from "chess.js";

interface Props {
  imageUrl: string;
  onPositionSet: (pgn: string) => void;
  onBack: () => void;
}

const PIECES = ['K', 'Q', 'R', 'B', 'N', 'P', 'k', 'q', 'r', 'b', 'n', 'p'];
const PIECE_NAMES: Record<string, string> = {
  'K': 'White King', 'Q': 'White Queen', 'R': 'White Rook', 
  'B': 'White Bishop', 'N': 'White Knight', 'P': 'White Pawn',
  'k': 'Black King', 'q': 'Black Queen', 'r': 'Black Rook',
  'b': 'Black Bishop', 'n': 'Black Knight', 'p': 'Black Pawn'
};

export default function PositionSetup({ imageUrl, onPositionSet, onBack }: Props) {
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [boardPosition, setBoardPosition] = useState<(string | null)[][]>(
    Array(8).fill(null).map(() => Array(8).fill(null))
  );
  const [currentTurn, setCurrentTurn] = useState<'w' | 'b'>('w');

  const handleSquareClick = (row: number, col: number) => {
    if (selectedPiece) {
      const newPosition = [...boardPosition];
      newPosition[row][col] = selectedPiece;
      setBoardPosition(newPosition);
    } else {
      // Remove piece if clicking on occupied square
      const newPosition = [...boardPosition];
      newPosition[row][col] = null;
      setBoardPosition(newPosition);
    }
  };

  const clearBoard = () => {
    setBoardPosition(Array(8).fill(null).map(() => Array(8).fill(null)));
  };

  const setStartingPosition = () => {
    const startPos = [
      ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
      ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ];
    setBoardPosition(startPos);
  };

  const generateFEN = () => {
    let fen = '';
    
    // Board position
    for (let row = 0; row < 8; row++) {
      let emptyCount = 0;
      for (let col = 0; col < 8; col++) {
        const piece = boardPosition[row][col];
        if (piece) {
          if (emptyCount > 0) {
            fen += emptyCount;
            emptyCount = 0;
          }
          fen += piece;
        } else {
          emptyCount++;
        }
      }
      if (emptyCount > 0) {
        fen += emptyCount;
      }
      if (row < 7) fen += '/';
    }
    
    // Active color, castling, en passant, halfmove, fullmove
    fen += ` ${currentTurn} - - 0 1`;
    
    return fen;
  };

  const handleConfirm = () => {
    try {
      const fen = generateFEN();
      
      // Validate FEN by creating a Chess instance
      new Chess(fen);
      
      const pgn = `[Event "Position from Image"]
[Site "VoltChess"]
[Date "${new Date().toISOString().split('T')[0].replace(/-/g, '.')}"]
[Round "-"]
[White "Player"]
[Black "Player"]
[Result "*"]
[FEN "${fen}"]
[SetUp "1"]

*`;

      onPositionSet(pgn);
    } catch (error) {
      alert('Invalid position. Please ensure you have both kings on the board.');
    }
  };

  const renderSquare = (row: number, col: number) => {
    const isLight = (row + col) % 2 === 0;
    const piece = boardPosition[row][col];
    
    return (
      <Box
        key={`${row}-${col}`}
        sx={{
          width: 40,
          height: 40,
          backgroundColor: isLight ? '#f0d9b5' : '#b58863',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '24px',
          fontWeight: 'bold',
          '&:hover': {
            backgroundColor: isLight ? '#e5d4a9' : '#a97d5d',
          },
        }}
        onClick={() => handleSquareClick(row, col)}
      >
        {piece && getPieceSymbol(piece)}
      </Box>
    );
  };

  const getPieceSymbol = (piece: string) => {
    const symbols: Record<string, string> = {
      'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
      'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
    };
    return symbols[piece] || piece;
  };

  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <Typography variant="h6" align="center">
          Set up the chess position from your image
        </Typography>
        <Typography variant="body2" align="center" color="textSecondary">
          1. Look at your uploaded image  2. Select pieces and click on the board  3. Confirm position
        </Typography>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Your uploaded image:</Typography>
          <img
            src={imageUrl}
            alt="Chess position"
            style={{
              width: '100%',
              maxHeight: '300px',
              objectFit: 'contain',
              borderRadius: 4,
            }}
          />
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Set up position:</Typography>
          
          {/* Piece Selector */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" display="block" gutterBottom>
              Select piece: {selectedPiece && `${PIECE_NAMES[selectedPiece]} (${getPieceSymbol(selectedPiece)})`}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              {PIECES.map(piece => (
                <Button
                  key={piece}
                  variant={selectedPiece === piece ? "contained" : "outlined"}
                  size="small"
                  onClick={() => setSelectedPiece(piece === selectedPiece ? null : piece)}
                  sx={{ minWidth: 40, fontSize: '16px' }}
                >
                  {getPieceSymbol(piece)}
                </Button>
              ))}
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setSelectedPiece(null)}
              startIcon={<Icon icon="material-symbols:clear" />}
            >
              Clear Selection
            </Button>
          </Box>

          {/* Chess Board */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 0, mb: 2, border: 1, borderColor: 'divider' }}>
            {Array(8).fill(null).map((_, row) =>
              Array(8).fill(null).map((_, col) => renderSquare(row, col))
            )}
          </Box>

          {/* Controls */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Button size="small" onClick={setStartingPosition}>
              Starting Position
            </Button>
            <Button size="small" onClick={clearBoard}>
              Clear Board
            </Button>
            <Button
              size="small"
              variant={currentTurn === 'w' ? "contained" : "outlined"}
              onClick={() => setCurrentTurn(currentTurn === 'w' ? 'b' : 'w')}
            >
              Turn: {currentTurn === 'w' ? 'White' : 'Black'}
            </Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={onBack} fullWidth>
              Back to Upload
            </Button>
            <Button variant="contained" onClick={handleConfirm} fullWidth>
              Analyze Position
            </Button>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}