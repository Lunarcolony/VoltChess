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
} from "@mui/material";
import { useState } from "react";
import NavLink from "@/components/NavLink";
import { useRouter } from "@/hooks/useRouter";
import { usePalette } from "@/hooks/usePalette";
import { alpha } from "@mui/material/styles";
import { Link as MuiLink } from "@mui/material";

const NAV_ITEMS = [
  { label: "Home", icon: "mdi:home-outline", href: "/" },
  { label: "Analysis", icon: "mdi:magnify", href: "/reanalysis" },
  { label: "Database", icon: "mdi:database-outline", href: "/database" },
] as const;

const SIDEBAR_WIDTH = 220;

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const palette = usePalette();
  const router = useRouter();

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
      <Box sx={{ px: 2.5, py: 2.5, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          component="img"
          src="/favicon-32x32.png"
          alt=""
          sx={{ width: 28, height: 28 }}
        />
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, fontSize: "1.05rem", color: palette.text }}
        >
          VoltChess
        </Typography>
      </Box>

 

      <List sx={{ flex: 1, px: 1.5, py: 1 }}>
        {NAV_ITEMS.map(({ label, icon, href }) => {
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
                  bgcolor: isActive ? alpha(palette.accent, 0.1) : "transparent",
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
                  primaryTypographyProps={{
                    fontSize: "0.9rem",
                    fontWeight: isActive ? 600 : 500,
                  }}
                />
              </ListItemButton>
            </NavLink>
          );
        })}
      </List>

      <Box
        sx={{
          mt: "auto",
          px: 2,
          py: 1.75,
          borderTop: `1px solid ${palette.borderSubtle}`,
        }}
      >
        <Typography
          fontSize="0.65rem"
          lineHeight={1.45}
          color="text.secondary"
        >
          Powered by{" "}
          <MuiLink
            href="https://github.com/GuillaumeSD/Chesskit"
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{ color: palette.textMuted, fontSize: "inherit" }}
          >
            Chesskit
          </MuiLink>
          . Thank you to the Chesskit team.
        </Typography>
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
            px: 1.5,
            bgcolor: palette.bg,
            borderBottom: `1px solid ${palette.border}`,
            zIndex: theme.zIndex.appBar,
          }}
        >
          <IconButton
            onClick={() => setMobileOpen(true)}
            sx={{ color: palette.text }}
            aria-label="Open menu"
          >
            <Icon icon="mdi:menu" width={22} />
          </IconButton>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 0.5 }}>
            <Box component="img" src="/favicon-32x32.png" alt="" sx={{ width: 24, height: 24 }} />
            <Typography fontWeight={700} fontSize="0.95rem">
              VoltChess
            </Typography>
          </Box>
        </Box>

        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          PaperProps={{ sx: { bgcolor: palette.bg } }}
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
