import { Box, Grid2 as Grid, Typography, Button } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageTitle } from "@/components/pageTitle";
import PageContainer from "@/components/PageContainer";
import NavLink from "@/components/NavLink";
import { useCardSx, usePalette } from "@/hooks/usePalette";
import { alpha } from "@mui/material/styles";

const TOOLS = [
  {
    href: "/tools/next-move",
    icon: "mdi:chess-queen",
    title: "Next Move Calculator",
    description:
      "Paste a FEN or play moves — Stockfish returns the best next move instantly.",
  },
  {
    href: "/tools/editor",
    icon: "mdi:pencil-ruler",
    title: "Board Editor",
    description:
      "Set up any position, copy the FEN, and hand it off to analysis in one click.",
  },
  {
    href: "/tools/elo-calculator",
    icon: "mdi:calculator-variant",
    title: "Elo Calculator",
    description:
      "Estimate rating change and win probability for FIDE-style Elo math.",
  },
  {
    href: "/openings",
    icon: "mdi:book-open-page-variant",
    title: "Opening Trainer",
    description:
      "Drill repertoire lines move by move — the board answers with common replies.",
  },
  {
    href: "/puzzles",
    icon: "mdi:puzzle",
    title: "Unlimited Puzzles",
    description:
      "Elo-rated tactics with no daily cap. Track your puzzle rating as you solve.",
  },
  {
    href: "/training",
    icon: "mdi:robot-happy-outline",
    title: "AI Training Coach",
    description:
      "Import your recent games and get a personalized training plan from your patterns.",
  },
  {
    href: "/analysis",
    icon: "mdi:chart-timeline-variant",
    title: "Game Review",
    description:
      "Unlimited Stockfish game analysis for Chess.com, Lichess, PGN, and FEN.",
  },
  {
    href: "/play",
    icon: "mdi:robot",
    title: "Play vs Engine",
    description: "Challenge Stockfish at a rating that matches your level.",
  },
  {
    href: "/extension",
    icon: "mdi:puzzle-outline",
    title: "Browser Extension",
    description:
      "Chess It Up–style one-click Analyze buttons on Chess.com game history.",
  },
] as const;

export default function ToolsHub() {
  const palette = usePalette();
  const cardSx = useCardSx();

  return (
    <>
      <PageTitle
        title="Chess Tools — VoltChess"
        description="Free Stockfish tools: next-move calculator, board editor, Elo calculator, opening trainer, puzzles, and more."
      />
      <PageContainer
        title="Tools"
        subtitle="Everything Chessigma-style — free, unlimited, running in your browser."
      >
        <Grid container spacing={2}>
          {TOOLS.map((tool) => (
            <Grid key={tool.href} size={{ xs: 12, sm: 6, md: 4 }}>
              <Box
                sx={{
                  ...cardSx,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: alpha(palette.accent, 0.12),
                    color: palette.accent,
                  }}
                >
                  <Icon icon={tool.icon} width={22} />
                </Box>
                <Typography variant="h3" sx={{ fontSize: "1.05rem" }}>
                  {tool.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ flex: 1 }}
                >
                  {tool.description}
                </Typography>
                <NavLink href={tool.href}>
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{
                      alignSelf: "flex-start",
                      borderColor: alpha(palette.accent, 0.35),
                      color: palette.text,
                    }}
                  >
                    Open
                  </Button>
                </NavLink>
              </Box>
            </Grid>
          ))}
        </Grid>
      </PageContainer>
    </>
  );
}
