import { Icon } from "@iconify/react";
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import NavLink from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { usePalette } from "@/hooks/usePalette";
import { useRouter } from "@/hooks/useRouter";
import { USER_ROLE_LABELS } from "@/types/user";

function roleIcon(role: string) {
  switch (role) {
    case "coach":
      return "mdi:whistle-outline";
    case "admin":
      return "mdi:shield-account-outline";
    default:
      return "mdi:school-outline";
  }
}

export function SidebarAccount({ onNavigate }: { onNavigate?: () => void }) {
  const palette = usePalette();
  const router = useRouter();
  const { user, logout, isAuthenticated, loading } = useAuth();

  const handleSignOut = () => {
    logout();
    onNavigate?.();
    router.push("/login");
  };

  if (loading) {
    return <Box sx={{ px: 1.5, py: 1.25 }} />;
  }

  if (!isAuthenticated || !user) {
    return (
      <Box sx={{ px: 1.5, pt: 1.25, pb: 0.5 }}>
        <NavLink href="/login">
          <Button
            fullWidth
            variant="contained"
            onClick={onNavigate}
            startIcon={<Icon icon="mdi:login" width={18} />}
            sx={{
              py: 1,
              fontWeight: 600,
              fontSize: "0.85rem",
              textTransform: "none",
              borderRadius: 1.5,
              bgcolor: palette.accent,
              color: palette.onAccent,
              boxShadow: "none",
              "&:hover": { bgcolor: palette.accentHover, boxShadow: "none" },
            }}
          >
            Sign in
          </Button>
        </NavLink>
      </Box>
    );
  }

  const initial = user.username.charAt(0).toUpperCase();
  const roleLabel = USER_ROLE_LABELS[user.role] ?? user.role;

  return (
    <Box sx={{ px: 1.5, pt: 1.25, pb: 0.5 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          px: 1,
          py: 0.75,
          borderRadius: 1.5,
          transition: "background-color 0.15s ease",
          "&:hover": { bgcolor: alpha(palette.text, 0.04) },
        }}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: "0.8rem",
            bgcolor: alpha(palette.accent, 0.15),
            color: palette.accent,
            border: `1px solid ${alpha(palette.accent, 0.25)}`,
          }}
        >
          {initial}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            noWrap
            sx={{
              fontSize: "0.82rem",
              fontWeight: 600,
              lineHeight: 1.3,
              color: palette.text,
            }}
          >
            {user.username}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.15 }}>
            <Icon
              icon={roleIcon(user.role)}
              width={12}
              style={{ color: palette.textMuted, flexShrink: 0 }}
            />
            <Typography
              noWrap
              sx={{
                fontSize: "0.7rem",
                lineHeight: 1.2,
                color: palette.textMuted,
                fontWeight: 500,
              }}
            >
              {roleLabel}
            </Typography>
          </Box>
        </Box>

        <Tooltip title="Sign out" placement="top">
          <IconButton
            onClick={handleSignOut}
            size="small"
            aria-label="Sign out"
            sx={{
              flexShrink: 0,
              width: 30,
              height: 30,
              color: palette.textMuted,
              "&:hover": {
                color: palette.text,
                bgcolor: alpha(palette.text, 0.06),
              },
            }}
          >
            <Icon icon="mdi:logout" width={17} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

export function MobileSignInButton() {
  const palette = usePalette();
  const { isAuthenticated, loading } = useAuth();

  if (loading || isAuthenticated) return null;

  return (
    <NavLink href="/login">
      <Button
        size="small"
        variant="contained"
        startIcon={<Icon icon="mdi:login" width={16} />}
        sx={{
          fontWeight: 600,
          fontSize: "0.8rem",
          textTransform: "none",
          borderRadius: 1.5,
          bgcolor: palette.accent,
          color: palette.onAccent,
          boxShadow: "none",
          "&:hover": { bgcolor: palette.accentHover, boxShadow: "none" },
        }}
      >
        Sign in
      </Button>
    </NavLink>
  );
}
