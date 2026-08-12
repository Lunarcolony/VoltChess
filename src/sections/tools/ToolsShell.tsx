import { Box, Typography, Button, Stack } from "@mui/material";
import { Icon } from "@iconify/react";
import { alpha } from "@mui/material/styles";
import { PropsWithChildren, ReactNode } from "react";
import { PageTitle } from "@/components/pageTitle";
import NavLink from "@/components/NavLink";
import { usePalette } from "@/hooks/usePalette";

interface ToolsShellProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  seoTitle: string;
  seoDescription: string;
  /** Dominant board / visual column */
  board: ReactNode;
  /** Slim right rail — status + primary actions */
  panel: ReactNode;
  /** Optional footer links under the composition */
  related?: { href: string; label: string }[];
}

/**
 * Chessigma-inspired board-first layout: one composition, large board,
 * quiet side panel, premium restraint within VoltChess dark palette.
 */
export default function ToolsShell({
  title,
  subtitle,
  seoTitle,
  seoDescription,
  board,
  panel,
  related,
  children,
}: ToolsShellProps) {
  const palette = usePalette();

  return (
    <>
      <PageTitle title={seoTitle} description={seoDescription} />
      <Box
        sx={{
          maxWidth: 1120,
          mx: "auto",
          width: "100%",
          px: { xs: 0.5, sm: 0 },
        }}
      >
        <Box sx={{ mb: { xs: 2.5, md: 3.5 }, maxWidth: 640 }}>
          <Typography
            variant="overline"
            sx={{
              color: palette.textMuted,
              letterSpacing: "0.14em",
              fontSize: "0.68rem",
              display: "block",
              mb: 0.75,
            }}
          >
            VoltChess
          </Typography>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: "1.55rem", md: "1.85rem" },
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              mb: subtitle ? 0.75 : 0,
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body1"
              sx={{
                color: palette.textMuted,
                fontSize: "0.95rem",
                lineHeight: 1.55,
                maxWidth: 520,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "minmax(0, 1.15fr) minmax(280px, 0.85fr)",
            },
            gap: { xs: 2.5, md: 3.5 },
            alignItems: "start",
          }}
        >
          <Box
            sx={{
              borderRadius: 2.5,
              border: `1px solid ${palette.borderSubtle}`,
              bgcolor: alpha(palette.surfaceRaised, 0.55),
              p: { xs: 1.25, sm: 1.75 },
              backgroundImage: `radial-gradient(ellipse at 30% 0%, ${alpha(
                palette.accent,
                0.06
              )} 0%, transparent 55%)`,
            }}
          >
            {board}
          </Box>

          <Box
            sx={{
              borderRadius: 2.5,
              border: `1px solid ${palette.border}`,
              bgcolor: palette.surfaceRaised,
              p: { xs: 2, sm: 2.5 },
              display: "flex",
              flexDirection: "column",
              gap: 2,
              minHeight: { md: 420 },
            }}
          >
            {panel}
          </Box>
        </Box>

        {children}

        {related && related.length > 0 && (
          <Stack
            direction="row"
            flexWrap="wrap"
            gap={1}
            sx={{
              mt: 3.5,
              pt: 2.5,
              borderTop: `1px solid ${palette.borderSubtle}`,
            }}
          >
            {related.map((link) => (
              <NavLink key={link.href} href={link.href}>
                <Button
                  size="small"
                  variant="text"
                  endIcon={<Icon icon="mdi:arrow-right" width={14} />}
                  sx={{
                    color: palette.textMuted,
                    textTransform: "none",
                    fontWeight: 500,
                    "&:hover": { color: palette.text },
                  }}
                >
                  {link.label}
                </Button>
              </NavLink>
            ))}
          </Stack>
        )}
      </Box>
    </>
  );
}

export function ToolPrimaryButton({
  children,
  loading,
  disabled,
  onClick,
  startIcon,
}: {
  children: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  startIcon?: ReactNode;
}) {
  const palette = usePalette();
  return (
    <Button
      fullWidth
      variant="contained"
      size="large"
      disabled={disabled || loading}
      onClick={onClick}
      startIcon={startIcon}
      sx={{
        py: 1.35,
        borderRadius: 2,
        bgcolor: palette.accent,
        color: palette.onAccent,
        fontWeight: 700,
        fontSize: "0.95rem",
        letterSpacing: "0.01em",
        boxShadow: `0 8px 28px ${alpha(palette.accent, 0.22)}`,
        "&:hover": {
          bgcolor: palette.accentHover,
          boxShadow: `0 10px 32px ${alpha(palette.accent, 0.28)}`,
        },
        "&.Mui-disabled": {
          bgcolor: alpha(palette.accent, 0.25),
          color: alpha(palette.onAccent, 0.5),
        },
      }}
    >
      {loading ? "Working…" : children}
    </Button>
  );
}

export function ToolStat({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: ReactNode;
  emphasize?: boolean;
}) {
  const palette = usePalette();
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        py: 1.25,
        px: 1.5,
        borderRadius: 1.5,
        bgcolor: alpha(palette.bg, 0.55),
        border: `1px solid ${palette.borderSubtle}`,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: palette.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontSize: "0.65rem",
          display: "block",
          mb: 0.35,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontWeight: emphasize ? 700 : 600,
          fontSize: emphasize ? "1.35rem" : "1.05rem",
          fontFamily: emphasize ? "inherit" : "ui-monospace, monospace",
          color: palette.text,
          lineHeight: 1.2,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
