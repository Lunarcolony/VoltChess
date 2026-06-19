import { Box, Tab, Tabs } from "@mui/material";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useRouter } from "@/hooks/useRouter";
import { usePalette } from "@/hooks/usePalette";
import { alpha } from "@mui/material/styles";
import { COACH_NAV } from "./constants";

export default function CoachShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const palette = usePalette();
  const router = useRouter();
  const navigate = useNavigate();

  const active =
    COACH_NAV.find((item) =>
      item.href === "/coach"
        ? router.pathname === "/coach"
        : router.pathname.startsWith(item.href)
    )?.href ?? "/coach";

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", pb: 4 }}>
      <Tabs
        value={active}
        onChange={(_, v) => navigate(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 3,
          minHeight: 44,
          borderBottom: `1px solid ${palette.border}`,
          "& .MuiTabs-indicator": { bgcolor: palette.accent, height: 3 },
          "& .MuiTab-root": {
            minHeight: 44,
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.85rem",
            color: palette.textMuted,
            gap: 0.75,
            "&.Mui-selected": { color: palette.text },
            "&:hover": { bgcolor: alpha(palette.accent, 0.06) },
          },
        }}
      >
        {COACH_NAV.map((item) => (
          <Tab
            key={item.href}
            value={item.href}
            label={item.label}
            icon={<Icon icon={item.icon} width={16} />}
            iconPosition="start"
          />
        ))}
      </Tabs>
      {children}
    </Box>
  );
}
