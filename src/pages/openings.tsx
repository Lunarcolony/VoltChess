import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  TextField,
  Paper,
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
    description: "One of the oldest chess openings, focusing on rapid development and central control.",
    difficulty: "beginner",
    popularity: 95,
    themes: ["development", "center control", "king safety"],
    famousGames: ["Morphy vs. Duke of Brunswick (1858)", "Kasparov vs. Anand (1995)"],
  },
  {
    name: "Ruy Lopez",
    eco: "C60-C99",
    moves: "1.e4 e5 2.Nf3 Nc6 3.Bb5",
    description: "The Spanish Opening, one of the most analyzed and strategic openings in chess.",
    difficulty: "intermediate",
    popularity: 90,
    themes: ["pressure", "positional play", "long-term planning"],
    famousGames: ["Fischer vs. Spassky (1972)", "Capablanca vs. Marshall (1909)"],
  },
  {
    name: "Sicilian Defense",
    eco: "B20-B99",
    moves: "1.e4 c5",
    description: "The most popular and complex defense against 1.e4, leading to sharp tactical games.",
    difficulty: "advanced",
    popularity: 85,
    themes: ["counterplay", "tactical complexity", "asymmetrical structure"],
    famousGames: ["Kasparov vs. Topalov (1999)", "Fischer vs. Reshevsky (1958)"],
  },
  {
    name: "Queen's Gambit",
    eco: "D06-D69",
    moves: "1.d4 d5 2.c4",
    description: "A positional opening offering a pawn to gain central control and piece activity.",
    difficulty: "intermediate",
    popularity: 80,
    themes: ["central control", "piece activity", "positional advantage"],
    famousGames: ["Alekhine vs. Capablanca (1927)", "Kramnik vs. Leko (2004)"],
  },
  {
    name: "King's Indian Defense",
    eco: "E60-E99",
    moves: "1.d4 Nf6 2.c4 g6 3.Nc3 Bg7",
    description: "A hypermodern defense allowing White central control while preparing counterattack.",
    difficulty: "advanced",
    popularity: 75,
    themes: ["hypermodern", "kingside attack", "central counterplay"],
    famousGames: ["Fischer vs. Petrosian (1971)", "Kasparov vs. Karpov (1986)"],
  },
  {
    name: "French Defense",
    eco: "C00-C19",
    moves: "1.e4 e6",
    description: "A solid defense creating a compact pawn structure with strategic complexity.",
    difficulty: "intermediate",
    popularity: 70,
    themes: ["solid structure", "strategic complexity", "space advantage"],
    famousGames: ["Morphy vs. Harrwitz (1858)", "Botvinnik vs. Capablanca (1938)"],
  },
  {
    name: "Caro-Kann Defense",
    eco: "B10-B19",
    moves: "1.e4 c6",
    description: "A reliable defense similar to French but avoiding the light-squared bishop problem.",
    difficulty: "beginner",
    popularity: 65,
    themes: ["solid play", "easy development", "endgame advantages"],
    famousGames: ["Capablanca vs. Kann (1909)", "Petrosian vs. Botvinnik (1963)"],
  },
  {
    name: "English Opening",
    eco: "A10-A39",
    moves: "1.c4",
    description: "A flexible opening controlling the center from the side and allowing transpositions.",
    difficulty: "intermediate",
    popularity: 60,
    themes: ["flexibility", "transposition", "positional control"],
    famousGames: ["Botvinnik vs. Smyslov (1957)", "Kramnik vs. Kasparov (2000)"],
  },
];

function OpeningsDatabase() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [expandedOpening, setExpandedOpening] = useState<string | null>(null);

  const filteredOpenings = useMemo(() => {
    return openingsDatabase.filter((opening) => {
      const matchesSearch = 
        opening.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opening.eco.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opening.moves.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opening.themes.some(theme => theme.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesDifficulty = !selectedDifficulty || opening.difficulty === selectedDifficulty;
      
      return matchesSearch && matchesDifficulty;
    });
  }, [searchTerm, selectedDifficulty]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "success";
      case "intermediate": return "warning";
      case "advanced": return "error";
      default: return "default";
    }
  };

  const getPopularityColor = (popularity: number) => {
    if (popularity >= 80) return "#4caf50";
    if (popularity >= 60) return "#ff9800";
    return "#f44336";
  };

  return (
    <>
      <PageTitle 
        title="Chess Openings Database - VoltChess" 
        description="Explore and learn chess openings with our comprehensive database. Study popular openings, ECO codes, and famous games from chess history."
      />
      
      <Box
        sx={{
          background: "linear-gradient(135deg, #232526 0%, #414345 100%)",
          minHeight: "100vh",
          padding: { xs: 2, md: 4 },
        }}
      >
        <Grid container spacing={4} justifyContent="center">
          {/* Header */}
          <Grid size={12}>
            <Typography
              variant="h3"
              component="h1"
              align="center"
              sx={{
                fontWeight: 700,
                background: "linear-gradient(90deg, #3b9ac6, #7fddff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 2,
              }}
            >
              Chess Openings Database 📚
            </Typography>
            
            <Typography
              variant="h6"
              align="center"
              color="text.secondary"
              sx={{ mb: 4, maxWidth: 600, mx: "auto" }}
            >
              Master chess openings with our comprehensive database featuring ECO codes, 
              strategic themes, and famous games from chess history.
            </Typography>
          </Grid>

          {/* Search and Filters */}
          <Grid size={12}>
            <Paper
              elevation={6}
              sx={{
                background: "rgba(40, 44, 52, 0.85)",
                backdropFilter: "blur(8px)",
                border: "1.5px solid #3a3f4b",
                borderRadius: 4,
                p: 3,
                mb: 4,
              }}
            >
              <Grid container spacing={3} alignItems="center">
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Search openings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Icon icon="mdi:magnify" />
                        </InputAdornment>
                      ),
                    }}
                    placeholder="Search by name, ECO code, moves, or themes"
                  />
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 2, alignSelf: "center" }}>
                      Difficulty:
                    </Typography>
                    {["beginner", "intermediate", "advanced"].map((difficulty) => (
                      <Chip
                        key={difficulty}
                        label={difficulty}
                        onClick={() => setSelectedDifficulty(
                          selectedDifficulty === difficulty ? null : difficulty
                        )}
                        color={selectedDifficulty === difficulty ? getDifficultyColor(difficulty) : "default"}
                        variant={selectedDifficulty === difficulty ? "filled" : "outlined"}
                        sx={{ textTransform: "capitalize" }}
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Results */}
          <Grid size={12}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Found {filteredOpenings.length} opening{filteredOpenings.length !== 1 ? "s" : ""}
            </Typography>
            
            <Grid container spacing={3}>
              {filteredOpenings.map((opening) => (
                <Grid key={opening.name} size={{ xs: 12, md: 6, lg: 4 }}>
                  <Card
                    elevation={4}
                    sx={{
                      background: "rgba(40, 44, 52, 0.85)",
                      backdropFilter: "blur(8px)",
                      border: "1.5px solid #3a3f4b",
                      borderRadius: 3,
                      height: "100%",
                      transition: "all 0.2s",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 8px 25px rgba(59, 154, 198, 0.3)",
                        border: "2px solid #3b9ac6",
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      {/* Header */}
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: "#7fddff" }}>
                          {opening.name}
                        </Typography>
                        <Chip
                          label={opening.eco}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                      
                      {/* Moves */}
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "monospace",
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          p: 1,
                          borderRadius: 1,
                          mb: 2,
                        }}
                      >
                        {opening.moves}
                      </Typography>
                      
                      {/* Description */}
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
                        {opening.description}
                      </Typography>
                      
                      {/* Metadata */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                        <Chip
                          label={opening.difficulty}
                          size="small"
                          color={getDifficultyColor(opening.difficulty)}
                          variant="filled"
                          sx={{ textTransform: "capitalize" }}
                        />
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Icon icon="mdi:star" color={getPopularityColor(opening.popularity)} />
                          <Typography variant="caption" color="text.secondary">
                            {opening.popularity}%
                          </Typography>
                        </Box>
                      </Box>
                      
                      {/* Themes */}
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 2 }}>
                        {opening.themes.map((theme) => (
                          <Chip
                            key={theme}
                            label={theme}
                            size="small"
                            variant="outlined"
                            color="secondary"
                          />
                        ))}
                      </Box>
                      
                      {/* Famous Games Accordion */}
                      {opening.famousGames && (
                        <Accordion
                          expanded={expandedOpening === opening.name}
                          onChange={() => setExpandedOpening(
                            expandedOpening === opening.name ? null : opening.name
                          )}
                          sx={{
                            backgroundColor: "transparent",
                            boxShadow: "none",
                            "&:before": { display: "none" },
                          }}
                        >
                          <AccordionSummary sx={{ p: 0, minHeight: "auto" }}>
                            <Button
                              size="small"
                              startIcon={<Icon icon="mdi:chess-king" />}
                              sx={{ textTransform: "none" }}
                            >
                              Famous Games ({opening.famousGames.length})
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
                                • {game}
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
              <Box sx={{ textAlign: "center", py: 8 }}>
                <Icon icon="mdi:book-open-variant" style={{ fontSize: "4rem", color: "#3b9ac6" }} />
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                  No openings found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your search terms or filters
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>
    </>
  );
}

export default OpeningsDatabase;