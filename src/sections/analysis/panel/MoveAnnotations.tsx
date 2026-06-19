import { useState } from "react";
import { Box, Button, IconButton, TextField, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useAuth } from "@/contexts/AuthContext";
import { ENABLE_AUTHENTICATION } from "@/constants";
import {
  createAnnotation,
  deleteAnnotation,
  fetchAnnotations,
} from "@/lib/api/annotations";
import { usePalette } from "@/hooks/usePalette";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { syncAnalysisResult } from "@/lib/gameSync";
import { UserRole } from "@/types/user";
import { boardAtom, gameAtom, gameEvalAtom } from "@/sections/analysis/states";

type Props = {
  serverGameId?: string;
};

export default function MoveAnnotations({ serverGameId }: Props) {
  const palette = usePalette();
  const { isAuthenticated, loading, user } = useAuth();
  const canAccessSection =
    user?.role === UserRole.Coach || user?.role === UserRole.Admin;
  const board = useAtomValue(boardAtom);
  const game = useAtomValue(gameAtom);
  const gameEval = useAtomValue(gameEvalAtom);
  const { serverGameFromUrl } = useGameDatabase();
  const queryClient = useQueryClient();

  const activeGameId = serverGameId ?? serverGameFromUrl?.serverId;
  const moveIndex = Math.max(0, board.history().length - 1);
  const fen = board.fen();

  const { data: annotations = [] } = useQuery({
    queryKey: ["annotations", activeGameId],
    queryFn: () => fetchAnnotations(activeGameId!),
    enabled:
      ENABLE_AUTHENTICATION &&
      isAuthenticated &&
      !!activeGameId &&
      canAccessSection,
  });

  const [draft, setDraft] = useState("");
  const moveAnnotations = annotations.filter((a) => a.move_index === moveIndex);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["annotations", activeGameId] });

  const createMut = useMutation({
    mutationFn: async (body: string) => {
      let gameId = activeGameId;
      if (!gameId && isAuthenticated) {
        gameId = await syncAnalysisResult(
          game,
          gameEval!,
          undefined,
          undefined
        );
      }
      if (!gameId) throw new Error("Save game to server first");
      return createAnnotation({
        game: gameId,
        move_index: moveIndex,
        fen,
        body,
      });
    },
    onSuccess: () => {
      setDraft("");
      invalidate();
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteAnnotation,
    onSuccess: invalidate,
  });

  if (
    !ENABLE_AUTHENTICATION ||
    loading ||
    !isAuthenticated ||
    !user ||
    !canAccessSection
  )
    return null;

  if (!activeGameId && !gameEval) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
        Analyze and sync this game to add coach notes on moves.
      </Typography>
    );
  }

  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
        Move notes (move {moveIndex + 1})
      </Typography>

      {moveAnnotations.map((a) => (
        <Box
          key={a.id}
          sx={{
            mb: 1,
            p: 1,
            borderRadius: 1,
            bgcolor: palette.surfaceRaised,
            border: `1px solid ${palette.borderSubtle}`,
          }}
        >
          <Box
            sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
          >
            <Typography variant="caption" color="text.secondary">
              {a.author.username}
            </Typography>
            <IconButton
              size="small"
              onClick={() => deleteMut.mutate(a.id)}
              aria-label="Delete note"
            >
              <Icon icon="mdi:delete-outline" width={16} />
            </IconButton>
          </Box>
          <Typography variant="body2">{a.body}</Typography>
        </Box>
      ))}

      <TextField
        fullWidth
        size="small"
        multiline
        minRows={2}
        placeholder="Add a note on this move…"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        sx={{ mb: 1 }}
      />
      <Button
        size="small"
        variant="outlined"
        disabled={
          !draft.trim() || createMut.isPending || (!activeGameId && !gameEval)
        }
        onClick={() => createMut.mutate(draft.trim())}
      >
        Add note
      </Button>
    </Box>
  );
}
