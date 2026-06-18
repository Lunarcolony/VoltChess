import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePalette } from "@/hooks/usePalette";
import { alpha } from "@mui/material/styles";
import {
  fetchMyClassroom,
  regenerateClassroomCode,
  updateMyClassroom,
} from "@/lib/api/classrooms";
import { getApiErrorMessage } from "@/lib/apiErrors";

export default function ClassroomPanel() {
  const palette = usePalette();
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [nameEdit, setNameEdit] = useState<string | null>(null);

  const { data: classroom, isLoading, error } = useQuery({
    queryKey: ["my-classroom"],
    queryFn: fetchMyClassroom,
  });

  const regenMut = useMutation({
    mutationFn: regenerateClassroomCode,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-classroom"] });
      setCopied(false);
    },
  });

  const saveNameMut = useMutation({
    mutationFn: (name: string) => updateMyClassroom({ name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-classroom"] });
      setNameEdit(null);
    },
  });

  const copyCode = async () => {
    if (!classroom?.join_code) return;
    try {
      await navigator.clipboard.writeText(classroom.join_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  if (isLoading) return <CircularProgress size={28} />;

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {getApiErrorMessage(error)}
      </Alert>
    );
  }

  if (!classroom) return null;

  const displayName = nameEdit ?? classroom.name;

  return (
    <Box
      sx={{
        p: 2.5,
        mb: 3,
        borderRadius: 2,
        bgcolor: palette.surfaceRaised,
        border: `1px solid ${alpha(palette.accent, 0.35)}`,
        background: `linear-gradient(135deg, ${alpha(palette.accent, 0.08)} 0%, transparent 60%)`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            bgcolor: alpha(palette.accent, 0.15),
          }}
        >
          <Icon icon="mdi:school-outline" width={22} color={palette.accent} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight={800} fontSize="1.05rem">
            Your classroom
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Share this code with students — they join from <strong>My Academy</strong> after
            verifying your name. No more typing usernames.
          </Typography>
        </Box>
        <Chip
          label={classroom.is_active ? "Open" : "Closed"}
          size="small"
          color={classroom.is_active ? "success" : "default"}
        />
      </Box>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center", mb: 2 }}>
        <TextField
          size="small"
          label="Classroom name"
          value={displayName}
          onChange={(e) => setNameEdit(e.target.value)}
          sx={{ minWidth: 200, flex: 1 }}
        />
        {nameEdit !== null && nameEdit !== classroom.name && (
          <Button
            size="small"
            variant="outlined"
            disabled={saveNameMut.isPending}
            onClick={() => saveNameMut.mutate(displayName.trim())}
          >
            Save name
          </Button>
        )}
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          flexWrap: "wrap",
          p: 2,
          borderRadius: 2,
          bgcolor: alpha(palette.bg, 0.6),
          border: `1px dashed ${palette.border}`,
        }}
      >
        <Typography
          variant="h4"
          fontWeight={800}
          letterSpacing="0.12em"
          sx={{ fontFamily: "monospace", color: palette.accent }}
        >
          {classroom.join_code}
        </Typography>
        <Tooltip title={copied ? "Copied!" : "Copy code"}>
          <IconButton onClick={copyCode} size="small" aria-label="Copy classroom code">
            <Icon icon={copied ? "mdi:check" : "mdi:content-copy"} width={20} />
          </IconButton>
        </Tooltip>
        <Button
          size="small"
          variant="outlined"
          disabled={regenMut.isPending}
          onClick={() => regenMut.mutate()}
          startIcon={<Icon icon="mdi:refresh" width={16} />}
        >
          New code
        </Button>
        <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
          {classroom.student_count} student{classroom.student_count === 1 ? "" : "s"} joined
        </Typography>
      </Box>

      {regenMut.isError && (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          {getApiErrorMessage(regenMut.error)}
        </Alert>
      )}
    </Box>
  );
}
