import { FormEvent, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import Link from "@/components/Link";
import GuestRoute from "@/components/GuestRoute";
import { PageTitle } from "@/components/pageTitle";
import { useRouter } from "@/hooks/useRouter";
import { usePalette } from "@/hooks/usePalette";
import { useAuth } from "@/contexts/AuthContext";
import AuthLayout from "@/sections/auth/AuthLayout";
import RoleSelector from "@/sections/auth/RoleSelector";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { landingForRole } from "@/lib/auth";
import { UserRole } from "@/types/user";
import api from "@/api";

type SelectableRole = UserRole.Coach | UserRole.Student;

function RegisterForm() {
  const router = useRouter();
  const palette = usePalette();
  const { login } = useAuth();

  const [role, setRole] = useState<SelectableRole | null>(UserRole.Student);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordsMatch =
    confirmPassword.length === 0 || password === confirmPassword;

  const canSubmit = useMemo(
    () =>
      !!role &&
      username.trim().length > 0 &&
      email.trim().length > 0 &&
      password.length >= 8 &&
      password === confirmPassword &&
      acceptTerms,
    [role, username, email, password, confirmPassword, acceptTerms]
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!role) {
      setError("Please choose whether you're a coach or a student.");
      return;
    }
    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
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
      await api.post("/api/register/", {
        username: username.trim(),
        email: email.trim(),
        password,
        role,
      });

      // Sign the new user straight in so they land on their role's dashboard
      // without a separate login step. If auto-login somehow fails, fall back
      // to the sign-in page rather than leaving them stuck.
      setSuccess("Account created! Signing you in…");
      try {
        const me = await login(username.trim(), password);
        router.push(landingForRole(me.role));
      } catch {
        setSuccess("Account created. Redirecting to sign in…");
        setTimeout(() => router.push("/login"), 1200);
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Tell us how you'll use VoltChess Academy, then set up your login."
    >
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, mb: 1, color: palette.text }}
        >
          I'm joining as a…
        </Typography>
        <RoleSelector value={role} onChange={setRole} />

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
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          autoComplete="new-password"
          margin="normal"
          size="small"
          helperText="At least 8 characters."
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword((v) => !v)}
                    edge="end"
                    size="small"
                  >
                    <Icon
                      icon={showPassword ? "mdi:eye-off" : "mdi:eye"}
                      width={20}
                    />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          label="Confirm password"
          type={showPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          fullWidth
          autoComplete="new-password"
          margin="normal"
          size="small"
          error={!passwordsMatch}
          helperText={!passwordsMatch ? "Passwords do not match." : " "}
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
              <Link
                href="/terms-and-conditions"
                style={{ color: palette.accent }}
              >
                Terms and Conditions
              </Link>
            </Typography>
          }
          sx={{ mt: 0.5, alignItems: "flex-start" }}
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
          disabled={loading || !canSubmit}
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
          <Link
            href="/login"
            style={{ color: palette.accent, fontWeight: 600 }}
          >
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
      <PageTitle title="Create Account — VoltChess Academy" noindex />
      <RegisterForm />
    </GuestRoute>
  );
}
