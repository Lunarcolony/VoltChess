import { Box, Button, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import NavLink from "@/components/NavLink";
import { useCardSx, usePalette } from "@/hooks/usePalette";
import { alpha } from "@mui/material/styles";

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
  const palette = usePalette();
  const cardSx = useCardSx();

  return (
    <Box
      sx={{
        ...cardSx,
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: alpha(palette.accent, 0.1),
          color: palette.accent,
          mb: 2,
        }}
      >
        <Icon icon={icon} width={22} />
      </Box>

      <Typography variant="h3" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 2.5, flex: 1 }}
      >
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
