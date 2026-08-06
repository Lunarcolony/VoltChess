import { Box, Typography, Grid2 as Grid } from "@mui/material";
import { Icon } from "@iconify/react";
import { alpha } from "@mui/material/styles";
import { PageTitle } from "@/components/pageTitle";
import NavLink from "@/components/NavLink";
import { usePalette } from "@/hooks/usePalette";

interface ToolDef {
  href: string;
  icon: string;
  title: string;
  description: string;
}

interface ToolGroup {
  id: string;
  label: string;
  tools: ToolDef[];
}

const GROUPS: ToolGroup[] = [
  {
    id: "analyze",
    label: "Analyze",
    tools: [
      {
        href: "/tools/next-move",
        icon: "mdi:chess-queen",
        title: "Next Move Calculator",
        description:
          "Find the best move in any position, with eval and top lines.",
      },
      {
        href: "/tools/editor",
        icon: "mdi:pencil-ruler",
        title: "Board Editor",
        description:
          "Set up any position piece by piece and send it to analysis.",
      },
      {
        href: "/analysis",
        icon: "mdi:chart-timeline-variant",
        title: "Game Review",
        description:
          "Import a Chess.com, Lichess, or PGN game for move-by-move review.",
      },
    ],
  },
  {
    id: "train",
    label: "Train",
    tools: [
      {
        href: "/openings",
        icon: "mdi:book-open-page-variant",
        title: "Opening Trainer",
        description:
          "Drill repertoire lines move by move against common replies.",
      },
      {
        href: "/puzzles",
        icon: "mdi:puzzle",
        title: "Puzzles",
        description:
          "Tactics puzzles matched to your rating, solved in the browser.",
      },
      {
        href: "/training",
        icon: "mdi:robot-happy-outline",
        title: "AI Training Coach",
        description:
          "Import recent games and get a training plan from your patterns.",
      },
    ],
  },
  {
    id: "play",
    label: "Play",
    tools: [
      {
        href: "/play",
        icon: "mdi:robot",
        title: "Play vs Engine",
        description: "Challenge Stockfish at a rating that matches your level.",
      },
      {
        href: "/tools/elo-calculator",
        icon: "mdi:calculator-variant",
        title: "Elo Calculator",
        description: "Work out expected score and rating change for a result.",
      },
    ],
  },
  {
    id: "extension",
    label: "Extension",
    tools: [
      {
        href: "/extension",
        icon: "mdi:puzzle-outline",
        title: "Browser Extension",
        description: "Adds an Analyze button to your Chess.com game history.",
      },
    ],
  },
];

function ToolCard({ tool }: { tool: ToolDef }) {
  const palette = usePalette();
  return (
    <NavLink href={tool.href}>
      <Box
        sx={{
          height: "100%",
          borderRadius: 2,
          border: `1px solid ${palette.borderSubtle}`,
          bgcolor: palette.surfaceRaised,
          p: 2.25,
          display: "flex",
          flexDirection: "column",
          gap: 1,
          transition: "border-color 0.15s ease, transform 0.15s ease",
          "&:hover": {
            borderColor: alpha(palette.accent, 0.4),
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Icon icon={tool.icon} width={22} color={palette.textMuted} />
          <Icon
            icon="mdi:arrow-top-right"
            width={16}
            color={palette.textMuted}
          />
        </Box>
        <Typography sx={{ fontWeight: 650, fontSize: "0.98rem" }}>
          {tool.title}
        </Typography>
        <Typography
          sx={{
            color: palette.textMuted,
            fontSize: "0.85rem",
            lineHeight: 1.5,
          }}
        >
          {tool.description}
        </Typography>
      </Box>
    </NavLink>
  );
}

export default function ToolsHub() {
  const palette = usePalette();

  return (
    <>
      <PageTitle
        title="Chess Tools — VoltChess"
        description="Stockfish tools that run in your browser: a next-move calculator, board editor, Elo calculator, opening trainer, puzzles, and more."
      />
      <Box
        sx={{
          maxWidth: 1120,
          mx: "auto",
          width: "100%",
          px: { xs: 0.5, sm: 0 },
        }}
      >
        <Box sx={{ mb: { xs: 3, md: 4 }, maxWidth: 640 }}>
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
              mb: 0.75,
            }}
          >
            Tools
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: palette.textMuted,
              fontSize: "0.95rem",
              lineHeight: 1.55,
            }}
          >
            A Stockfish engine and a handful of focused tools, all running in
            your browser.
          </Typography>
        </Box>

        {GROUPS.map((group, idx) => (
          <Box key={group.id} sx={{ mb: idx === GROUPS.length - 1 ? 0 : 4 }}>
            <Typography
              variant="overline"
              sx={{
                color: palette.textMuted,
                letterSpacing: "0.1em",
                fontSize: "0.7rem",
                display: "block",
                mb: 1.5,
                pb: 1,
                borderBottom: `1px solid ${palette.borderSubtle}`,
              }}
            >
              {group.label}
            </Typography>
            <Grid container spacing={2}>
              {group.tools.map((tool) => (
                <Grid key={tool.href} size={{ xs: 12, sm: 6, md: 4 }}>
                  <ToolCard tool={tool} />
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}
      </Box>
    </>
  );
}
