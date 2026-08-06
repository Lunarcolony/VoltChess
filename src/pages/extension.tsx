import { Box, Typography, Grid2 as Grid, Chip, Divider } from "@mui/material";
import { Icon } from "@iconify/react";
import { alpha } from "@mui/material/styles";
import { PageTitle } from "@/components/pageTitle";
import PageContainer from "@/components/PageContainer";
import NavLink from "@/components/NavLink";
import { useCardSx, usePalette } from "@/hooks/usePalette";

const GITHUB_EXTENSION_URL =
  "https://github.com/Lunarcolony/VoltChess/tree/main/extension";

const FEATURES = [
  {
    icon: "mdi:cursor-default-click-outline",
    title: "One-click Analyze buttons",
    description:
      "Adds an Analyze button next to every game in your Chess.com history — just like Chess It Up.",
  },
  {
    icon: "mdi:rocket-launch-outline",
    title: "Floating button on live games",
    description:
      "A floating Analyze with VoltChess button appears on live and daily game pages while you play.",
  },
  {
    icon: "mdi:trophy-outline",
    title: "Post-game modal shortcut",
    description:
      "When Chess.com shows the game-over screen, jump straight into a Stockfish review with one click.",
  },
  {
    icon: "mdi:content-paste",
    title: "No copy/paste required",
    description:
      "The extension opens VoltChess with the full PGN already loaded — no manual export step.",
  },
  {
    icon: "mdi:cog-outline",
    title: "Configurable analyzer URL",
    description:
      "Point the extension at production VoltChess or your local npm run dev server from the options page.",
  },
  {
    icon: "mdi:shield-check-outline",
    title: "Privacy-first",
    description:
      "No analytics, no accounts. It only reads the public game data for the game you click, and stores just the analyzer URL setting.",
  },
] as const;

const INSTALL_STEPS = [
  {
    label: "Open chrome://extensions",
    description: "In Chrome, Edge, or Brave, navigate to the extensions page.",
  },
  {
    label: "Enable Developer mode",
    description: "Toggle Developer mode on, usually in the top-right corner.",
  },
  {
    label: "Click Load unpacked",
    description: "Choose Load unpacked from the buttons that appear.",
  },
  {
    label: "Select the extension/ folder",
    description:
      "Pick the extension/ folder from your local clone of the VoltChess repository.",
  },
  {
    label: "Pin it and go analyze",
    description:
      "Pin the VoltChess icon to your toolbar, then head to Chess.com to see Analyze buttons appear.",
  },
] as const;

export default function ExtensionPage() {
  const palette = usePalette();
  const cardSx = useCardSx();

  return (
    <>
      <PageTitle
        title="Browser Extension — VoltChess"
        description="Install the free VoltChess browser extension for one-click Stockfish analysis of your Chess.com games, Chess It Up style."
      />

      <PageContainer
        title="Browser Extension"
        subtitle="One-click Analyze buttons on Chess.com — the source lives in the extension/ folder of this repository."
        action={
          <Chip
            icon={<Icon icon="mdi:github" width={16} />}
            label="View source"
            component="a"
            href={GITHUB_EXTENSION_URL}
            target="_blank"
            rel="noopener noreferrer"
            clickable
            variant="outlined"
          />
        }
      >
        <Box sx={{ ...cardSx, mb: 3 }}>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                bgcolor: alpha(palette.accent, 0.12),
                color: palette.accent,
              }}
            >
              <Icon icon="mdi:puzzle-outline" width={24} />
            </Box>
            <Box>
              <Typography variant="h3" sx={{ fontSize: "1.1rem" }}>
                VoltChess — Analyze Chess.com Games
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Free, open-source, unlimited. No accounts, no analytics.
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary">
            The extension source ships in this repository at{" "}
            <Box
              component="code"
              sx={{
                fontFamily: "monospace",
                bgcolor: palette.surface,
                px: 0.75,
                py: 0.25,
                borderRadius: 0.75,
                border: `1px solid ${palette.borderSubtle}`,
              }}
            >
              extension/
            </Box>
            . It isn&apos;t published to the Chrome Web Store yet, so install it
            as an unpacked extension using the steps below.
          </Typography>
        </Box>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ ...cardSx, height: "100%" }}>
              <Typography variant="h3" sx={{ fontSize: "1.05rem", mb: 2 }}>
                Install in Chrome / Edge / Brave
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {INSTALL_STEPS.map((step, index) => (
                  <Box key={step.label} sx={{ display: "flex", gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 26,
                        height: 26,
                        flexShrink: 0,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        bgcolor: alpha(palette.accent, 0.14),
                        color: palette.accent,
                        fontSize: "0.8rem",
                        fontWeight: 700,
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {step.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {step.description}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>

              <Divider sx={{ my: 2.5, borderColor: palette.borderSubtle }} />

              <Typography variant="h3" sx={{ fontSize: "1.05rem", mb: 1.5 }}>
                Install in Firefox
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 0.5 }}
              >
                1. Open{" "}
                <Box component="code" sx={{ fontFamily: "monospace" }}>
                  about:debugging#/runtime/this-firefox
                </Box>
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 0.5 }}
              >
                2. Click <strong>Load Temporary Add-on…</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                3. Pick{" "}
                <Box component="code" sx={{ fontFamily: "monospace" }}>
                  extension/manifest.json
                </Box>
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {FEATURES.map((feature) => (
                <Box
                  key={feature.title}
                  sx={{
                    ...cardSx,
                    p: 2,
                    display: "flex",
                    gap: 1.5,
                    alignItems: "flex-start",
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      flexShrink: 0,
                      borderRadius: 1.5,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: alpha(palette.accent, 0.12),
                      color: palette.accent,
                    }}
                  >
                    <Icon icon={feature.icon} width={18} />
                  </Box>
                  <Box>
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: 600, mb: 0.25 }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>

        <Box
          sx={{
            ...cardSx,
            mt: 2.5,
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="h3" sx={{ fontSize: "1rem", mb: 0.5 }}>
              Prefer to analyze right here?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You don&apos;t need the extension to use VoltChess — every tool
              runs free and unlimited in your browser.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <NavLink href="/tools" fullWidth={false}>
              <Chip
                icon={<Icon icon="mdi:toolbox-outline" width={16} />}
                label="Browse tools"
                clickable
                variant="outlined"
              />
            </NavLink>
            <NavLink href="/analysis" fullWidth={false}>
              <Chip
                icon={<Icon icon="mdi:chart-timeline-variant" width={16} />}
                label="Open analysis"
                clickable
                color="primary"
                variant="outlined"
              />
            </NavLink>
          </Box>
        </Box>
      </PageContainer>
    </>
  );
}
