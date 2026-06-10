import { Box, Button, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import NavLink from "@/components/NavLink";
import { cardSx, palette } from "@/theme/voltchessTheme";

interface Props {
  title: string;
  description: string;
  icon: string;
  href: string;
  actionLabel: string;
}

export default function FeatureCard({
  title,
  description,
  icon,
  href,
  actionLabel,
}: Props) {
  return (
    <Box sx={{ ...cardSx, display: "flex", flexDirection: "column", height: "100%" }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "rgba(232, 185, 35, 0.1)",
          color: palette.accent,
          mb: 2,
        }}
      >
        <Icon icon={icon} width={22} />
      </Box>

      <Typography variant="h3" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, flex: 1 }}>
        {description}
      </Typography>

      <NavLink href={href}>
        <Button
          variant="contained"
          color="primary"
          size="small"
          endIcon={<Icon icon="mdi:arrow-right" width={16} />}
          sx={{ alignSelf: "flex-start", px: 2 }}
        >
          {actionLabel}
        </Button>
      </NavLink>
    </Box>
  );
}
