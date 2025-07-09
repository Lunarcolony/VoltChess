import React from "react";
import { Grid2 as Grid } from "@mui/material";
import {
  Typography,
  Card,
  CardContent,
  Box,
  Container,
  useTheme,
} from "@mui/material";

const Thanks: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "background.default",
        padding: 4,
      }}
    >
      <Container maxWidth="md">
        <Box textAlign="center" mb={6}>
          <Typography
            variant="h3"
            fontWeight="bold"
            gutterBottom
            sx={{ color: "primary.contrastText" }}
          >
            Thank You for Using VoltChess ♟️
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            VoltChess wouldn't be possible without the incredible contributions
            of open-source communities and developers.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Technologies & Resources */}
          <Grid xs={12} md={6}>
            <Card
              sx={{
                bgcolor: theme.palette.background.paper,
                borderRadius: 4,
                boxShadow: 6,
              }}
            >
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  🛠️ Technologies & Resources
                </Typography>
                <Typography variant="body1" paragraph>
                  • <strong>Stockfish</strong>: The world-class open-source
                  chess engine powering VoltChess analysis.
                </Typography>
                <Typography variant="body1" paragraph>
                  • <strong>Chesskit</strong>: Provided architectural inspiration
                  and integration examples.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Contributors */}
          <Grid xs={12} md={6}>
            <Card
              sx={{
                bgcolor: theme.palette.background.paper,
                borderRadius: 4,
                boxShadow: 6,
              }}
            >
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  👨‍💻 Contributors
                </Typography>
                <Typography variant="body1" paragraph>
                  • <strong>Jithesh</strong>: Founder & lead developer of
                  VoltChess.
                </Typography>
                <Typography variant="body1" paragraph>
                  • <strong>Nomoru</strong>: UI design and feature ideation.
                </Typography>
                <Typography variant="body1" paragraph>
                  • <strong>Quartx</strong>: Engine integration and optimization.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Final Words */}
          <Grid xs={12}>
            <Card
              sx={{
                bgcolor: theme.palette.background.paper,
                borderRadius: 4,
                boxShadow: 6,
              }}
            >
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  🚀 Final Words
                </Typography>
                <Typography variant="body1">
                  VoltChess is a community-driven project. We thank every
                  contributor, tester, and user. Keep playing, keep learning, and
                  never stop improving your game!
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Thanks;
