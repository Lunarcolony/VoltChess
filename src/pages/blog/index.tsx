import { Box, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { PageTitle } from "@/components/pageTitle";
import { SchemaOrg } from "@/components/SchemaOrg";
import { BLOG_POSTS } from "@/data/blogPosts";
import { DEFAULT_SEO, SITE_URL } from "@/data/seo";
import { usePalette } from "@/hooks/usePalette";

export default function BlogIndexPage() {
  const palette = usePalette();

  return (
    <>
      <PageTitle
        title="Chess Game Review & Analysis Guides | VoltChess Blog"
        description="Free guides on chess game review, Chess.com analysis, Stockfish game analysis, blunder finding, and PGN review. Learn how to study your games on VoltChess."
        path="/blog"
      />
      <SchemaOrg
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "VoltChess Guides",
          description:
            "Free chess game review and analysis guides powered by Stockfish.",
          url: `${SITE_URL}/blog`,
          publisher: { "@type": "Organization", name: "VoltChess" },
        }}
      />

      <Box sx={{ maxWidth: 720, mx: "auto", pb: 4 }}>
        <Typography
          component="h1"
          variant="h4"
          sx={{ fontWeight: 700, mb: 1, color: palette.text }}
        >
          Chess Analysis Guides
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {DEFAULT_SEO.description}
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {BLOG_POSTS.map((post) => (
            <Box
              key={post.slug}
              component={Link}
              to={`/blog/${post.slug}`}
              sx={{
                display: "block",
                p: 2,
                borderRadius: 2,
                textDecoration: "none",
                bgcolor: palette.surface,
                border: `1px solid ${palette.border}`,
                transition: "border-color 0.15s ease",
                "&:hover": { borderColor: palette.accent },
              }}
            >
              <Typography
                fontWeight={600}
                sx={{ color: palette.text, mb: 0.5 }}
              >
                {post.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {post.excerpt}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </>
  );
}
