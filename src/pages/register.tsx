import { FormEvent, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import Link from "@/components/Link";
import GuestRoute from "@/components/GuestRoute";
import { useRouter } from "@/hooks/useRouter";
import { usePalette } from "@/hooks/usePalette";
import AuthLayout from "@/sections/auth/AuthLayout";
import api from "@/api";

function RegisterForm() {
  const router = useRouter();
  const palette = usePalette();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!password.trim()) {
      setError("Password is required");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!acceptTerms) {
      setError("You must accept the Terms and Conditions");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/register/", { username, email, password });
      setSuccess("Account created. Redirecting to sign in…");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: unknown) {
      const detail =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "detail" in err.response.data
          ? String(err.response.data.detail)
          : "Registration failed";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create account"
      subtitle="Join your academy to sync games and track progress."
    >
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          fullWidth
          autoComplete="username"
          margin="normal"
          size="small"
        />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          autoComplete="email"
          margin="normal"
          size="small"
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          autoComplete="new-password"
          margin="normal"
          size="small"
        />
        <TextField
          label="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          fullWidth
          autoComplete="new-password"
          margin="normal"
          size="small"
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              size="small"
            />
          }
          label={
            <Typography variant="body2" color="text.secondary">
              I accept the{" "}
              <Link href="/terms-and-conditions" style={{ color: palette.accent }}>
                Terms and Conditions
              </Link>
            </Typography>
          }
          sx={{ mt: 1, alignItems: "flex-start" }}
        />

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          startIcon={
            loading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <Icon icon="mdi:account-plus" width={20} />
            )
          }
          sx={{
            mt: 2.5,
            py: 1.2,
            fontWeight: 600,
            bgcolor: palette.accent,
            color: palette.onAccent,
            "&:hover": { bgcolor: palette.accentHover },
          }}
        >
          {loading ? "Creating account…" : "Create account"}
        </Button>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 2.5, textAlign: "center" }}
        >
          Already have an account?{" "}
          <Link href="/login" style={{ color: palette.accent, fontWeight: 600 }}>
            Sign in
          </Link>
        </Typography>
      </Box>
    </AuthLayout>
  );
}

export default function Register() {
  return (
    <GuestRoute>
      <RegisterForm />
    </GuestRoute>
  );
}
