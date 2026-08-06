import { Icon } from "@iconify/react";
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useMediaQuery,
  useTheme,
  Link as MuiLink,
  Tooltip,
} from "@mui/material";
import { useState, useMemo } from "react";
import NavLink from "@/components/NavLink";
import VoltChessLogo from "@/components/VoltChessLogo";
import { useRouter } from "@/hooks/useRouter";
import { usePalette } from "@/hooks/usePalette";
import { alpha } from "@mui/material/styles";
import { SidebarAccount, MobileHeaderAccount } from "./SidebarAccount";
import { UserRole } from "@/types/user";
import { useAuth } from "@/contexts/AuthContext";

type NavItem = { label: string; icon: string; href: string };

const BASE_NAV: NavItem[] = [
  { label: "Home", icon: "mdi:home-outline", href: "/" },
  { label: "Analysis", icon: "mdi:magnify", href: "/analysis" },
  { label: "Tools", icon: "mdi:toolbox-outline", href: "/tools" },
  {
    label: "Openings",
    icon: "mdi:book-open-page-variant-outline",
    href: "/openings",
  },
  { label: "Puzzles", icon: "mdi:puzzle-outline", href: "/puzzles" },
  {
    label: "Guides",
    icon: "mdi:notebook-outline",
    href: "/blog",
  },
];

function navForRole(
  role: UserRole | undefined,
  isAuthenticated: boolean
): NavItem[] {
  if (!isAuthenticated || !role) return BASE_NAV;

  const items = [...BASE_NAV];
  if (role === UserRole.Coach || role === UserRole.Admin) {
    items.splice(1, 0, {
      label: "Coach Hub",
      icon: "mdi:view-dashboard-outline",
      href: "/coach",
    });
  }
  if (role === UserRole.Admin) {
    items.splice(1, 0, {
      label: "Ops",
      icon: "mdi:chart-box-outline",
      href: "/ops",
    });
  }
  if (role === UserRole.Student) {
    items.splice(1, 0, {
      label: "My Hub",
      icon: "mdi:school-outline",
      href: "/student",
    });
  }
  return items;
}

const SIDEBAR_WIDTH = 220;
const GITHUB_REPO_URL = "https://github.com/Lunarcolony/VoltChess";

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const palette = usePalette();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const navItems = useMemo(
    () => navForRole(user?.role, isAuthenticated),
    [user?.role, isAuthenticated]
  );

  return (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: palette.bg,
        borderRight: `1px solid ${palette.border}`,
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2.5,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <VoltChessLogo size={28} />
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, fontSize: "1.05rem", color: palette.text }}
        >
          VoltChess
        </Typography>
      </Box>

      <List sx={{ flex: 1, px: 1.5, py: 1 }}>
        {navItems.map(({ label, icon, href }) => {
          const isActive =
            href === "/"
              ? router.pathname === "/"
              : router.pathname.startsWith(href);

          return (
            <NavLink key={href} href={href}>
              <ListItemButton
                onClick={onNavigate}
                sx={{
                  borderRadius: 1.5,
                  mb: 0.5,
                  py: 1,
                  color: isActive ? palette.accent : palette.textMuted,
                  bgcolor: isActive
                    ? alpha(palette.accent, 0.1)
                    : "transparent",
                  "&:hover": {
                    bgcolor: isActive
                      ? alpha(palette.accent, 0.14)
                      : palette.surfaceRaised,
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
                  <Icon icon={icon} width={20} />
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  slotProps={{
                    primary: {
                      fontSize: "0.9rem",
                      fontWeight: isActive ? 600 : 500,
                    },
                  }}
                />
              </ListItemButton>
            </NavLink>
          );
        })}
      </List>

      <Box sx={{ mt: "auto" }}>
        <SidebarAccount onNavigate={onNavigate} />

        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderTop: `1px solid ${palette.borderSubtle}`,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 0.5,
            }}
          >
            <Typography
              fontSize="0.65rem"
              lineHeight={1.45}
              color="text.secondary"
              sx={{ flex: 1, minWidth: 0 }}
            >
              Free chess game review · Powered by{" "}
              <MuiLink
                href="https://github.com/GuillaumeSD/Chesskit"
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
                sx={{ color: palette.textMuted, fontSize: "inherit" }}
              >
                Chesskit
              </MuiLink>
            </Typography>
            <Tooltip title="View source on GitHub">
              <IconButton
                component="a"
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                aria-label="View source on GitHub"
                sx={{
                  color: palette.textMuted,
                  mt: -0.25,
                  flexShrink: 0,
                  "&:hover": {
                    color: palette.text,
                    bgcolor: palette.surfaceRaised,
                  },
                }}
              >
                <Icon icon="mdi:github" width={18} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function Sidebar() {
  const palette = usePalette();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isMobile) {
    return (
      <>
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: 52,
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            bgcolor: palette.bg,
            borderBottom: `1px solid ${palette.border}`,
            zIndex: theme.zIndex.appBar,
          }}
        >
          <IconButton
            onClick={() => setMobileOpen(true)}
            sx={{ color: palette.text, flexShrink: 0 }}
            aria-label="Open menu"
          >
            <Icon icon="mdi:menu" width={22} />
          </IconButton>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            <VoltChessLogo size={24} />
            <Typography
              fontWeight={700}
              fontSize="0.95rem"
              noWrap
              sx={{ minWidth: 0 }}
            >
              VoltChess
            </Typography>
          </Box>
          <MobileHeaderAccount />
        </Box>

        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          slotProps={{ paper: { sx: { bgcolor: palette.bg } } }}
        >
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </Drawer>
      </>
    );
  }

  return (
    <Box
      component="nav"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        zIndex: theme.zIndex.drawer,
      }}
    >
      <SidebarContent />
    </Box>
  );
}

export { SIDEBAR_WIDTH };
