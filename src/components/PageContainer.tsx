import { Box, Typography } from "@mui/material";
import { PropsWithChildren, ReactNode } from "react";

interface Props extends PropsWithChildren {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function PageContainer({
  title,
  subtitle,
  action,
  children,
}: Props) {
  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h1" sx={{ mb: subtitle ? 0.5 : 0 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {action}
      </Box>
      {children}
    </Box>
  );
}
