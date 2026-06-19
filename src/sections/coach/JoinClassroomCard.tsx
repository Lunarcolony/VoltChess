import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePalette } from "@/hooks/usePalette";
import { alpha } from "@mui/material/styles";
import {
  joinClassroom,
  previewClassroomJoin,
  type ClassroomPreview,
} from "@/lib/api/classrooms";
import { getApiErrorMessage } from "@/lib/apiErrors";

export default function JoinClassroomCard() {
  const palette = usePalette();
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [preview, setPreview] = useState<ClassroomPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const joinMut = useMutation({
    mutationFn: () => joinClassroom(preview!.join_code),
    onSuccess: (result) => {
      setSuccessMsg(
        result.created
          ? `You joined ${result.coach_username}'s classroom!`
          : `You're already in ${result.coach_username}'s classroom.`
      );
      setPreview(null);
      setCode("");
      qc.invalidateQueries({ queryKey: ["coach-links"] });
      qc.invalidateQueries({ queryKey: ["assignments"] });
    },
  });

  const handleVerify = async () => {
    setPreviewError(null);
    setSuccessMsg(null);
    setPreview(null);
    if (!code.trim()) {
      setPreviewError("Enter your classroom code.");
      return;
    }
    setChecking(true);
    try {
      const result = await previewClassroomJoin(code.trim());
      setPreview(result);
    } catch (err) {
      setPreviewError(getApiErrorMessage(err));
    } finally {
      setChecking(false);
    }
  };

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
        <Icon icon="mdi:school-outline" width={24} color={palette.accent} />
        <Typography variant="h6" fontWeight={700}>
          Join your coach&apos;s classroom
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Ask your coach for their classroom code (e.g. <strong>VC-ABC123</strong>
        ). We&apos;ll show you their name before you join — so you never connect
        to the wrong coach.
      </Typography>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
        <TextField
          size="small"
          label="Classroom code"
          placeholder="VC-ABC123"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setPreview(null);
            setPreviewError(null);
          }}
          sx={{ minWidth: 200, flex: 1 }}
          inputProps={{
            style: { fontFamily: "monospace", letterSpacing: "0.08em" },
          }}
        />
        <Button
          variant="outlined"
          disabled={checking || !code.trim()}
          onClick={handleVerify}
        >
          {checking ? "Checking…" : "Verify code"}
        </Button>
      </Box>

      {previewError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {previewError}
        </Alert>
      )}

      {successMsg && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccessMsg(null)}
        >
          {successMsg}
        </Alert>
      )}

      {preview && (
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: alpha(palette.accent, 0.08),
            border: `1px solid ${alpha(palette.accent, 0.3)}`,
          }}
        >
          <Typography fontWeight={700} sx={{ mb: 0.5 }}>
            {preview.already_member ? "Already enrolled" : "Confirm join"}
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            Classroom: <strong>{preview.classroom_name}</strong>
          </Typography>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            Coach: <strong>{preview.coach_username}</strong>
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mb: 1.5 }}
          >
            Code: {preview.join_code}
          </Typography>
          {!preview.already_member && (
            <Button
              variant="contained"
              disabled={joinMut.isPending}
              onClick={() => joinMut.mutate()}
              startIcon={
                joinMut.isPending ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Icon icon="mdi:login" width={18} />
                )
              }
            >
              Join this classroom
            </Button>
          )}
          {joinMut.isError && (
            <Alert severity="error" sx={{ mt: 1.5 }}>
              {getApiErrorMessage(joinMut.error)}
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
}
