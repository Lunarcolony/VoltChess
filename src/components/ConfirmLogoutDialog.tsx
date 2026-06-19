import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

type Props = {
  open: boolean;
  username?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmLogoutDialog({
  open,
  username,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>Sign out?</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {username
            ? `You'll need to sign in again to access ${username}'s academy account.`
            : "You'll need to sign in again to access your academy account."}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" color="error" onClick={onConfirm}>
          Sign out
        </Button>
      </DialogActions>
    </Dialog>
  );
}
