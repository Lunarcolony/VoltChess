import { FormEvent, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import Link from "@/components/Link";
import GuestRoute from "@/components/GuestRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "@/hooks/useRouter";
import { usePalette } from "@/hooks/usePalette";
import AuthLayout from "@/sections/auth/AuthLayout";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { landingForRole } from "@/lib/auth";
import { debug } from "@/lib/debug";

function LoginForm() {
  const router = useRouter();
  const location = useLocation();
  const palette = usePalette();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    setLoading(true);
    debug.log("auth", "login form submit", { username: username.trim() });
    try {
      const me = await login(username.trim(), password);
      const from = (location.state as { from?: { pathname: string } })?.from
        ?.pathname;
      const target = from && from !== "/" ? from : landingForRole(me.role);
      debug.log("auth", "login form success — redirecting", {
        target,
        role: me.role,
      });
      router.push(target);
    } catch (err: unknown) {
      debug.warn("auth", "login form failed", {
        message: getApiErrorMessage(err),
      });
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Access your academy account to sync games and view student progress."
      banner={
        <Alert
          severity="warning"
          icon={<Icon icon="mdi:information-outline" width={22} />}
        >
          Sign-in is only required for <strong>chess academies</strong> and{" "}
          <strong>enrolled learners</strong>. Casual game review does not need
          an account.
        </Alert>
      }
    >
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          fullWidth
          autoComplete="username"
          autoFocus
          margin="normal"
          size="small"
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          autoComplete="current-password"
          margin="normal"
          size="small"
        />

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
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
              <Icon icon="mdi:login" width={20} />
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
          {loading ? "Signing in…" : "Sign in"}
        </Button>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 2.5, textAlign: "center" }}
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            style={{ color: palette.accent, fontWeight: 600 }}
          >
            Create one
          </Link>
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1.5, textAlign: "center" }}
        >
          <Link href="/" style={{ color: palette.textMuted }}>
            ← Back to VoltChess
          </Link>
        </Typography>
      </Box>
    </AuthLayout>
  );
}

export default function Login() {
  return (
    <GuestRoute>
      <LoginForm />
    </GuestRoute>
  );
}
