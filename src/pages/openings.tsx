import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  TextField,
  Grid2 as Grid,
  Chip,
  Card,
  CardContent,
  InputAdornment,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { PageTitle } from "@/components/pageTitle";
import PageContainer from "@/components/PageContainer";
import { cardSx, palette } from "@/theme/voltchessTheme";

interface OpeningData {
  name: string;
  eco: string;
  moves: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  popularity: number;
  themes: string[];
  famousGames?: string[];
}

const openingsDatabase: OpeningData[] = [
  {
    name: "Italian Game",
    eco: "C50-C59",
    moves: "1.e4 e5 2.Nf3 Nc6 3.Bc4",
    description:
      "One of the oldest chess openings, focusing on rapid development and central control.",
    difficulty: "beginner",
    popularity: 95,
    themes: ["development", "center control", "king safety"],
    famousGames: [
      "Morphy vs. Duke of Brunswick (1858)",
      "Kasparov vs. Anand (1995)",
    ],
  },
  {
    name: "Ruy Lopez",
    eco: "C60-C99",
    moves: "1.e4 e5 2.Nf3 Nc6 3.Bb5",
    description:
      "The Spanish Opening, one of the most analyzed and strategic openings in chess.",
    difficulty: "intermediate",
    popularity: 90,
    themes: ["pressure", "positional play", "long-term planning"],
    famousGames: [
      "Fischer vs. Spassky (1972)",
      "Capablanca vs. Marshall (1909)",
    ],
  },
  {
    name: "Sicilian Defense",
    eco: "B20-B99",
    moves: "1.e4 c5",
    description:
      "The most popular defense against 1.e4, leading to sharp tactical games.",
    difficulty: "advanced",
    popularity: 85,
    themes: ["counterplay", "tactical complexity", "asymmetrical structure"],
    famousGames: [
      "Kasparov vs. Topalov (1999)",
      "Fischer vs. Reshevsky (1958)",
    ],
  },
  {
    name: "Queen's Gambit",
    eco: "D06-D69",
    moves: "1.d4 d5 2.c4",
    description:
      "A positional opening offering a pawn to gain central control and piece activity.",
    difficulty: "intermediate",
    popularity: 80,
    themes: ["central control", "piece activity", "positional advantage"],
    famousGames: [
      "Alekhine vs. Capablanca (1927)",
      "Kramnik vs. Leko (2004)",
    ],
  },
  {
    name: "King's Indian Defense",
    eco: "E60-E99",
    moves: "1.d4 Nf6 2.c4 g6 3.Nc3 Bg7",
    description:
      "A hypermodern defense allowing White central control while preparing counterattack.",
    difficulty: "advanced",
    popularity: 75,
    themes: ["hypermodern", "kingside attack", "central counterplay"],
    famousGames: [
      "Fischer vs. Petrosian (1971)",
      "Kasparov vs. Karpov (1986)",
    ],
  },
  {
    name: "French Defense",
    eco: "C00-C19",
    moves: "1.e4 e6",
    description:
      "A solid defense creating a compact pawn structure with strategic complexity.",
    difficulty: "intermediate",
    popularity: 70,
    themes: ["solid structure", "strategic complexity", "space advantage"],
    famousGames: [
      "Morphy vs. Harrwitz (1858)",
      "Botvinnik vs. Capablanca (1938)",
    ],
  },
  {
    name: "Caro-Kann Defense",
    eco: "B10-B19",
    moves: "1.e4 c6",
    description:
      "A reliable defense similar to French but avoiding the light-squared bishop problem.",
    difficulty: "beginner",
    popularity: 65,
    themes: ["solid play", "easy development", "endgame advantages"],
    famousGames: [
      "Capablanca vs. Kann (1909)",
      "Petrosian vs. Botvinnik (1963)",
    ],
  },
  {
    name: "English Opening",
    eco: "A10-A39",
    moves: "1.c4",
    description:
      "A flexible opening controlling the center from the side and allowing transpositions.",
    difficulty: "intermediate",
    popularity: 60,
    themes: ["flexibility", "transposition", "positional control"],
    famousGames: [
      "Botvinnik vs. Smyslov (1957)",
      "Kramnik vs. Kasparov (2000)",
    ],
  },
];

function OpeningsDatabase() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(
    null
  );
  const [expandedOpening, setExpandedOpening] = useState<string | null>(null);

  const filteredOpenings = useMemo(() => {
    return openingsDatabase.filter((opening) => {
      const matchesSearch =
        opening.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opening.eco.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opening.moves.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opening.themes.some((theme) =>
          theme.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesDifficulty =
        !selectedDifficulty || opening.difficulty === selectedDifficulty;

      return matchesSearch && matchesDifficulty;
    });
  }, [searchTerm, selectedDifficulty]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "success";
      case "intermediate":
        return "warning";
      case "advanced":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <>
      <PageTitle
        title="Chess Openings — VoltChess"
        description="Explore popular chess openings with ECO codes and strategic themes."
      />

      <PageContainer
        title="Openings"
        subtitle="Browse openings by name, ECO code, or theme."
      >
        <Box sx={{ ...cardSx, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Search openings"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Icon icon="mdi:magnify" />
                      </InputAdornment>
                    ),
                  },
                }}
                placeholder="Name, ECO, moves, or themes"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Difficulty:
                </Typography>
                {["beginner", "intermediate", "advanced"].map((difficulty) => (
                  <Chip
                    key={difficulty}
                    label={difficulty}
                    onClick={() =>
                      setSelectedDifficulty(
                        selectedDifficulty === difficulty ? null : difficulty
                      )
                    }
                    color={
                      selectedDifficulty === difficulty
                        ? getDifficultyColor(difficulty)
                        : "default"
                    }
                    variant={
                      selectedDifficulty === difficulty ? "filled" : "outlined"
                    }
                    sx={{ textTransform: "capitalize" }}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {filteredOpenings.length} opening
          {filteredOpenings.length !== 1 ? "s" : ""} found
        </Typography>

        <Grid container spacing={2}>
          {filteredOpenings.map((opening) => (
            <Grid key={opening.name} size={{ xs: 12, md: 6, lg: 4 }}>
              <Card
                elevation={0}
                sx={{
                  ...cardSx,
                  height: "100%",
                  p: 0,
                  "&:hover": { borderColor: palette.accent },
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 1.5,
                    }}
                  >
                    <Typography variant="h3">{opening.name}</Typography>
                    <Chip
                      label={opening.eco}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: "monospace",
                      bgcolor: palette.surface,
                      p: 1,
                      borderRadius: 1,
                      mb: 1.5,
                      border: `1px solid ${palette.borderSubtle}`,
                    }}
                  >
                    {opening.moves}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2, lineHeight: 1.5 }}
                  >
                    {opening.description}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1.5,
                    }}
                  >
                    <Chip
                      label={opening.difficulty}
                      size="small"
                      color={getDifficultyColor(opening.difficulty)}
                      sx={{ textTransform: "capitalize" }}
                    />
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Icon icon="mdi:star" color={palette.accent} width={14} />
                      <Typography variant="caption" color="text.secondary">
                        {opening.popularity}%
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 1 }}>
                    {opening.themes.map((theme) => (
                      <Chip
                        key={theme}
                        label={theme}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>

                  {opening.famousGames && (
                    <Accordion
                      expanded={expandedOpening === opening.name}
                      onChange={() =>
                        setExpandedOpening(
                          expandedOpening === opening.name ? null : opening.name
                        )
                      }
                      sx={{
                        bgcolor: "transparent",
                        boxShadow: "none",
                        "&:before": { display: "none" },
                      }}
                    >
                      <AccordionSummary sx={{ p: 0, minHeight: "auto" }}>
                        <Button
                          size="small"
                          startIcon={<Icon icon="mdi:chess-king" />}
                        >
                          Famous games ({opening.famousGames.length})
                        </Button>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 0, pt: 1 }}>
                        {opening.famousGames.map((game, index) => (
                          <Typography
                            key={index}
                            variant="caption"
                            display="block"
                            color="text.secondary"
                            sx={{ mb: 0.5 }}
                          >
                            {game}
                          </Typography>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {filteredOpenings.length === 0 && (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Icon
              icon="mdi:book-open-variant"
              width={48}
              color={palette.textMuted}
            />
            <Typography variant="h3" sx={{ mt: 2, mb: 0.5 }}>
              No openings found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search or filters.
            </Typography>
          </Box>
        )}
      </PageContainer>
    </>
  );
}

export default OpeningsDatabase;
