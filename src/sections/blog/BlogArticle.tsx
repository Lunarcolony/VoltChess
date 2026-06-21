import { Box, Button, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { PageTitle } from "@/components/pageTitle";
import { SchemaOrg } from "@/components/SchemaOrg";
import { usePalette } from "@/hooks/usePalette";
import type { BlogPost } from "@/data/blogPosts";
import { SITE_URL, OG_IMAGE } from "@/data/seo";
import NavLink from "@/components/NavLink";

interface Props {
  post: BlogPost;
}

export default function BlogArticle({ post }: Props) {
  const palette = usePalette();
  const url = `${SITE_URL}/blog/${post.slug}`;
  const ctaHref =
    post.slug.includes("lichess") || post.slug === "lichess-game-review-free"
      ? "/free-lichess-game-review"
      : post.slug.includes("chesscom") ||
          post.slug === "voltchess-vs-chesscom-premium"
        ? "/free-chess-com-analysis"
        : "/free-chess-game-analysis";
  const ctaLabel =
    ctaHref === "/free-chess-com-analysis"
      ? "Analyze your Chess.com games free"
      : ctaHref === "/free-lichess-game-review"
        ? "Review your Lichess games free"
        : "Analyze a game free";

  return (
    <>
      <PageTitle
        title={post.metaTitle}
        description={post.metaDescription}
        path={`/blog/${post.slug}`}
      />
      <SchemaOrg
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.metaDescription,
            datePublished: post.publishedAt,
            author: { "@type": "Organization", name: "VoltChess" },
            publisher: {
              "@type": "Organization",
              name: "VoltChess",
              logo: { "@type": "ImageObject", url: `${SITE_URL}/logo-512.png` },
            },
            mainEntityOfPage: url,
            keywords: post.keywords,
            image: OG_IMAGE,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: `${SITE_URL}/`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Guides",
                item: `${SITE_URL}/blog`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: post.title,
                item: url,
              },
            ],
          },
        ]}
      />

      <Box sx={{ maxWidth: 720, mx: "auto", pb: 4 }}>
        <NavLink href="/blog">
          <Typography
            fontSize="0.8rem"
            sx={{
              color: palette.textMuted,
              mb: 2,
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              "&:hover": { color: palette.accent },
            }}
          >
            <Icon icon="mdi:arrow-left" width={16} />
            All guides
          </Typography>
        </NavLink>

        <Typography
          component="h1"
          variant="h4"
          sx={{ fontWeight: 700, mb: 1.5, color: palette.text }}
        >
          {post.title}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {post.excerpt}
        </Typography>

        {post.sections.map((section, idx) => (
          <Box key={idx} sx={{ mb: 2.5 }}>
            {section.heading && (
              <Typography
                component="h2"
                variant="h6"
                sx={{ fontWeight: 600, mb: 1, color: palette.text }}
              >
                {section.heading}
              </Typography>
            )}
            {section.paragraphs.map((para, pIdx) => (
              <Typography
                key={pIdx}
                variant="body1"
                color="text.secondary"
                sx={{ mb: 1.25, lineHeight: 1.65 }}
              >
                {para}
              </Typography>
            ))}
          </Box>
        ))}

        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: palette.surface,
            border: `1px solid ${palette.border}`,
          }}
        >
          <Typography fontWeight={600} sx={{ mb: 1 }}>
            Try it now — free game review
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Load a Chess.com link, Lichess game, or PGN and get Stockfish
            analysis in your browser.
          </Typography>
          <Button
            component={Link}
            to={ctaHref}
            variant="contained"
            endIcon={<Icon icon="mdi:arrow-right" width={18} />}
          >
            {ctaLabel}
          </Button>
        </Box>
      </Box>
    </>
  );
}
