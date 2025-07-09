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
import { motion } from "framer-motion";

const MotionCard = motion(Card);
const MotionBox = motion(Box);

const Thanks: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        background: "radial-gradient(ellipse at center, #0d0d0d 0%, #000000 100%)",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
        px: 2,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glowing background chess piece */}
      <motion.div
        initial={{ opacity: 0.1, scale: 0.9 }}
        animate={{ opacity: 0.12, scale: [0.9, 1, 0.9] }}
        transition={{ duration: 10, repeat: Infinity }}
        style={{
          position: "absolute",
          fontSize: "25rem",
          left: "50%",
          top: "40%",
          transform: "translate(-50%, -50%)",
          color: "#8236ff",
          filter: "blur(80px)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        ♟️
      </motion.div>

      <Container maxWidth="md" sx={{ zIndex: 1 }}>
        <MotionBox
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          textAlign="center"
          mb={6}
        >
          <Typography
            variant="h3"
            fontWeight="bold"
            gutterBottom
            sx={{
              color: "#d4bfff",
              textShadow: "0 0 10px #a16eff",
              fontFamily: "Orbitron, sans-serif",
            }}
          >
            ⚡ Thank You for Using VoltChess
          </Typography>
          <Typography variant="subtitle1" sx={{ color: "#ccc" }}>
            Empowered by code, powered by community.
          </Typography>
        </MotionBox>

        <Grid container spacing={4}>
          {/* Technologies */}
          <Grid xs={12} md={6}>
            <MotionCard
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px #4bffef" }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              sx={{
                bgcolor: "#1b1b1b",
                border: "1px solid #4bffef33",
                borderRadius: 4,
                boxShadow: "0 0 10px #4bffef22",
                backdropFilter: "blur(4px)",
              }}
            >
              <CardContent>
                <Typography variant="h5" gutterBottom sx={{ color: "#4bffef" }}>
                  🛠️ Technologies
                </Typography>
                <Typography variant="body1" paragraph>
                  • <strong>Stockfish</strong>: Advanced chess engine for real-time analysis.
                </Typography>
                <Typography variant="body1" paragraph>
                  • <strong>Chesskit</strong>: UI + engine integration inspiration.
                </Typography>
              </CardContent>
            </MotionCard>
          </Grid>

          {/* Contributors */}
          <Grid xs={12} md={6}>
            <MotionCard
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px #ff4bf5" }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              sx={{
                bgcolor: "#1b1b1b",
                border: "1px solid #ff4bf533",
                borderRadius: 4,
                boxShadow: "0 0 10px #ff4bf522",
                backdropFilter: "blur(4px)",
              }}
            >
              <CardContent>
                <Typography variant="h5" gutterBottom sx={{ color: "#ff4bf5" }}>
                  🧑‍🚀 Contributors
                </Typography>
                <Typography variant="body1" paragraph>
                  • <strong>Jithesh</strong>: Lead developer, architecture.
                </Typography>
                <Typography variant="body1" paragraph>
                  • <strong>Nomoru</strong>: UX design + animations.
                </Typography>
                <Typography variant="body1" paragraph>
                  • <strong>Quartx</strong>: Engine integration wizardry.
                </Typography>
              </CardContent>
            </MotionCard>
          </Grid>

          {/* Final Words */}
          <Grid xs={12}>
            <MotionCard
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              sx={{
                bgcolor: "#1b1b1b",
                borderRadius: 4,
                boxShadow: "0 0 20px #ffffff22",
                border: "1px solid #ffffff22",
              }}
            >
              <CardContent>
                <Typography variant="h5" gutterBottom sx={{ color: "#fff" }}>
                  🚀 Final Words
                </Typography>
                <Typography variant="body1">
                  VoltChess is a community of creators. Stay sharp, stay curious,
                  and may your games be legendary.
                </Typography>
              </CardContent>
            </MotionCard>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Thanks;
