import { Box, Link, Typography } from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { usePalette } from "@/hooks/usePalette";

interface Props {
  content: string;
  fontSize: number;
  maxWidth: number;
}

export default function ArticleBody({ content, fontSize, maxWidth }: Props) {
  const palette = usePalette();

  return (
    <Box
      sx={{
        maxWidth,
        mx: "auto",
        px: { xs: 2, sm: 3 },
        py: { xs: 3, sm: 4 },
        "& p, & li": {
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize,
          lineHeight: 1.75,
          color: palette.text,
          mb: 1.75,
        },
        "& h1, & h2, & h3": {
          fontFamily: "Roboto, system-ui, sans-serif",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: palette.text,
          mt: 3,
          mb: 1.5,
        },
        "& h1": { fontSize: fontSize * 1.55 },
        "& h2": { fontSize: fontSize * 1.3 },
        "& h3": { fontSize: fontSize * 1.12 },
        "& a": {
          color: palette.accent,
          textDecoration: "underline",
          textUnderlineOffset: "2px",
        },
        "& blockquote": {
          borderLeft: `3px solid ${palette.accent}`,
          pl: 2,
          ml: 0,
          color: palette.textMuted,
          fontStyle: "italic",
        },
        "& img": {
          maxWidth: "100%",
          height: "auto",
          borderRadius: 1,
          my: 2,
        },
        "& pre, & code": {
          fontFamily: "ui-monospace, monospace",
          fontSize: fontSize * 0.85,
        },
        "& pre": {
          overflow: "auto",
          p: 2,
          borderRadius: 1,
          bgcolor: palette.surfaceRaised,
          border: `1px solid ${palette.border}`,
        },
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <Link href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </Link>
          ),
          img: ({ src, alt }) => (
            <Box
              component="img"
              src={src}
              alt={alt || ""}
              loading="lazy"
              sx={{ display: "block" }}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
      {!content.trim() && (
        <Typography sx={{ color: palette.textMuted }}>
          No readable content was returned for this article.
        </Typography>
      )}
    </Box>
  );
}
