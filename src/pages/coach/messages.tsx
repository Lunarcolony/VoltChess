import { useState } from "react";
import Head from "@/components/Head";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import CoachShell from "@/sections/coach/CoachShell";
import { CoachPageHeader, CoachEmptyState } from "@/sections/coach/CoachUi";
import { usePalette } from "@/hooks/usePalette";
import { fetchCoachLinks } from "@/lib/api/academies";
import { fetchCoachMessages, sendCoachMessage } from "@/lib/api/coaching";

export default function CoachMessagesPage() {
  const palette = usePalette();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const { data: links = [] } = useQuery({
    queryKey: ["coach-links"],
    queryFn: fetchCoachLinks,
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["coach-messages"],
    queryFn: fetchCoachMessages,
  });

  const sendMut = useMutation({
    mutationFn: () =>
      sendCoachMessage({
        student_id: studentId,
        subject: subject.trim(),
        body: body.trim(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coach-messages"] });
      qc.invalidateQueries({ queryKey: ["coach-dashboard"] });
      setOpen(false);
      setSubject("");
      setBody("");
      setStudentId("");
    },
  });

  return (
    <>
      <Head>
        <title>Messages · VoltChess Academy</title>
      </Head>
      <CoachShell>
        <CoachPageHeader
          title="Student messaging"
          subtitle="Send feedback, reminders, and study notes directly to your students."
          action={
            <Button variant="contained" onClick={() => setOpen(true)}>
              Compose
            </Button>
          }
        />

        {isLoading ? (
          <CircularProgress />
        ) : messages.length === 0 ? (
          <CoachEmptyState
            icon="mdi:email-outline"
            title="No messages sent"
            description="Students will see your messages in their academy inbox."
          />
        ) : (
          messages.map((m) => (
            <Box
              key={m.id}
              sx={{
                p: 2,
                mb: 1.5,
                borderRadius: 2,
                bgcolor: palette.surfaceRaised,
                border: `1px solid ${palette.border}`,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Typography fontWeight={700}>{m.subject}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(m.created_at).toLocaleString()}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 0.75 }}
              >
                To {m.student_username}
              </Typography>
              <Typography variant="body2">{m.body}</Typography>
            </Box>
          ))
        )}

        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Compose message</DialogTitle>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
          >
            <TextField
              select
              label="Student"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              size="small"
            >
              {links.map((l) => (
                <MenuItem key={l.id} value={l.student.id}>
                  {l.student.username}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              size="small"
            />
            <TextField
              label="Message"
              multiline
              minRows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              size="small"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              disabled={
                !studentId ||
                !subject.trim() ||
                !body.trim() ||
                sendMut.isPending
              }
              onClick={() => sendMut.mutate()}
            >
              Send
            </Button>
          </DialogActions>
        </Dialog>
      </CoachShell>
    </>
  );
}
