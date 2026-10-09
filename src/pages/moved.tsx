import { useState } from "react";
import { Box, Button, Container, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { Link as RouterLink } from "react-router-dom";
import { PageTitle } from "@/components/pageTitle";
import { SITE_URL } from "@/data/seo";
import { usePalette } from "@/hooks/usePalette";

export default function Moved() {
  const palette = usePalette();
  const [copied, setCopied] = useState(false);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(SITE_URL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <PageTitle
        title="DawvioChess moved — new official URL"
        description="DawvioChess free chess analysis has moved to dawvio.com — same app, no sign-up."
        path="/moved"
      />
      <Box
        sx={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          py: { xs: 6, md: 10 },
          px: 2,
        }}
      >
        <Container maxWidth="sm">
          <Typography
            component="h1"
            variant="h3"
            fontWeight={700}
            gutterBottom
            sx={{ color: palette.accent }}
          >
            DawvioChess moved
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary", mb: 2 }}>
            DawvioChess has a new home. The old addresses{" "}
            <strong>voltchess.me</strong> and{" "}
            <strong>voltchess.vercel.app</strong> are retired. The free
            Stockfish analyzer is the same app — now at:
          </Typography>
          <Typography
            component="p"
            variant="h6"
            sx={{
              fontFamily: "monospace",
              wordBreak: "break-all",
              mb: 3,
              color: "text.primary",
            }}
          >
            {SITE_URL}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 4 }}>
            Please update bookmarks. Sorry for the downtime. Source code:{" "}
            <Box
              component="a"
              href="https://github.com/Lunarcolony/VoltChess"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: palette.accent }}
            >
              github.com/Lunarcolony/VoltChess
            </Box>
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
            <Button
              variant="contained"
              onClick={copyUrl}
              startIcon={
                <Icon icon={copied ? "mdi:check" : "mdi:content-copy"} />
              }
            >
              {copied ? "Copied" : "Copy link"}
            </Button>
            <Button
              component={RouterLink}
              to="/"
              variant="outlined"
              startIcon={<Icon icon="mdi:chess-king" />}
            >
              Open analyzer
            </Button>
            <Button
              href="https://github.com/Lunarcolony/VoltChess"
              target="_blank"
              rel="noopener noreferrer"
              variant="outlined"
              startIcon={<Icon icon="mdi:github" />}
            >
              GitHub
            </Button>
          </Box>
        </Container>
      </Box>
    </>
  );
}
