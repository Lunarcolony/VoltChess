import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  CircularProgress,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { Chess } from "chess.js";
import { useAtomValue, useSetAtom } from "jotai";
import { PageTitle } from "@/components/pageTitle";
import { SchemaOrg } from "@/components/SchemaOrg";
import { useCardSx, usePalette } from "@/hooks/usePalette";
import { useRouter } from "@/hooks/useRouter";
import { useChessActions } from "@/hooks/useChessActions";
import { prepareNewAnalysisSession } from "@/hooks/useAnalysisSession";
import {
  boardAtom,
  boardOrientationAtom,
  evaluationProgressAtom,
  gameAtom,
  gameEvalAtom,
} from "@/sections/analysis/states";
import HomeGameLoader from "@/sections/home/HomeGameLoader";
import FeatureCard from "@/sections/home/FeatureCard";
import {
  getBlogFaqs,
  getBlogPost,
  type BlogPost,
  type BlogSection,
} from "@/data/blogPosts";
import { SITE_URL, OG_IMAGE, TRUST_BULLETS } from "@/data/seo";
import NavLink from "@/components/NavLink";
import { GameOrigin } from "@/types/enums";
import { ENGINE_DEFAULTS } from "@/constants/engineDefaults";
import { preloadEngine } from "@/lib/engine/sharedEngine";

interface Props {
  post: BlogPost;
}

const TAB_MAP: Record<"chesscom" | "lichess" | "pgn", GameOrigin> = {
  chesscom: GameOrigin.ChessCom,
  lichess: GameOrigin.Lichess,
  pgn: GameOrigin.Pgn,
};

function resolveCta(post: BlogPost): { href: string; label: string } {
  const href =
    post.slug.includes("lichess") || post.slug === "lichess-game-review-free"
      ? "/free-lichess-game-review"
      : post.slug.includes("chesscom") ||
          post.slug === "voltchess-vs-chesscom-premium"
        ? "/free-chess-com-analysis"
        : "/free-chess-game-analysis";
  const label =
    href === "/free-chess-com-analysis"
      ? "Analyze your Chess.com games free"
      : href === "/free-lichess-game-review"
        ? "Review your Lichess games free"
        : "Analyze a game free";
  return { href, label };
}

function formatPublishedDate(iso: string): string {
  const date = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function SectionHeading({
  children,
  palette,
}: {
  children: ReactNode;
  palette: ReturnType<typeof usePalette>;
}) {
  return (
    <Typography
      component="h2"
      sx={{
        fontSize: "1.15rem",
        fontWeight: 700,
        mb: 1.5,
        color: palette.text,
        letterSpacing: "-0.01em",
      }}
    >
      {children}
    </Typography>
  );
}

function ProseBlock({
  section,
  palette,
}: {
  section: Extract<BlogSection, { type: "prose" }>;
  palette: ReturnType<typeof usePalette>;
}) {
  return (
    <Box sx={{ mb: 3 }}>
      {section.heading && (
        <SectionHeading palette={palette}>{section.heading}</SectionHeading>
      )}
      {section.paragraphs.map((para, pIdx) => (
        <Typography
          key={pIdx}
          variant="body1"
          color="text.secondary"
          sx={{ mb: 1.5, lineHeight: 1.7, fontSize: "1.02rem" }}
        >
          {para}
        </Typography>
      ))}
    </Box>
  );
}

function StepsBlock({
  section,
  palette,
}: {
  section: Extract<BlogSection, { type: "steps" }>;
  palette: ReturnType<typeof usePalette>;
}) {
  return (
    <Box sx={{ mb: 3.5 }}>
      {section.heading && (
        <SectionHeading palette={palette}>{section.heading}</SectionHeading>
      )}
      <Box
        sx={{
          position: "relative",
          pl: { xs: 0, sm: 1 },
          "&::before": {
            content: { xs: '""', sm: '""' },
            display: { xs: "none", sm: "block" },
            position: "absolute",
            left: 28,
            top: 16,
            bottom: 16,
            width: 2,
            bgcolor: alpha(palette.accent, 0.25),
          },
        }}
      >
        {section.steps.map((step, idx) => (
          <Box
            key={step.title}
            sx={{
              display: "flex",
              gap: 2,
              mb: idx === section.steps.length - 1 ? 0 : 2,
              position: "relative",
            }}
          >
            <Box
              sx={{
                flexShrink: 0,
                width: 40,
                height: 40,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: palette.accent,
                color: palette.onAccent,
                fontWeight: 800,
                fontSize: "0.95rem",
                zIndex: 1,
                boxShadow: `0 0 0 4px ${palette.bg}`,
              }}
            >
              {idx + 1}
            </Box>
            <Box
              sx={{
                flex: 1,
                p: 2,
                borderRadius: 2,
                bgcolor: palette.surfaceRaised,
                border: `1px solid ${palette.border}`,
              }}
            >
              <Typography
                component="h3"
                fontWeight={700}
                sx={{ mb: 0.5, color: palette.text }}
              >
                {step.title}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ lineHeight: 1.65 }}
              >
                {step.body}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function ChecklistBlock({
  section,
  palette,
}: {
  section: Extract<BlogSection, { type: "checklist" }>;
  palette: ReturnType<typeof usePalette>;
}) {
  return (
    <Box sx={{ mb: 3.5 }}>
      {section.heading && (
        <SectionHeading palette={palette}>{section.heading}</SectionHeading>
      )}
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        }}
      >
        {section.items.map((item) => (
          <Box
            key={item.title}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: palette.surfaceRaised,
              border: `1px solid ${palette.border}`,
              transition: "border-color 0.15s ease",
              "&:hover": { borderColor: alpha(palette.accent, 0.45) },
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: alpha(palette.accent, 0.12),
                color: palette.accent,
                mb: 1.25,
              }}
            >
              <Icon icon={item.icon ?? "mdi:check-circle-outline"} width={20} />
            </Box>
            <Typography
              component="h3"
              fontWeight={700}
              sx={{ mb: 0.5, color: palette.text }}
            >
              {item.title}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ lineHeight: 1.65 }}
            >
              {item.body}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function CalloutBlock({
  section,
  palette,
}: {
  section: Extract<BlogSection, { type: "callout" }>;
  palette: ReturnType<typeof usePalette>;
}) {
  const isTip = section.variant === "tip";
  return (
    <Box
      sx={{
        mb: 3.5,
        p: 2.25,
        borderRadius: 2,
        bgcolor: alpha(palette.accent, isTip ? 0.08 : 0.05),
        border: `1px solid ${alpha(palette.accent, 0.22)}`,
      }}
    >
      <Typography
        fontWeight={700}
        sx={{
          mb: 0.75,
          color: palette.text,
          display: "flex",
          alignItems: "center",
          gap: 0.75,
        }}
      >
        <Icon
          icon={isTip ? "mdi:lightbulb-on-outline" : "mdi:information-outline"}
          width={20}
          color={palette.accent}
        />
        {section.title ?? (isTip ? "Tip" : "Note")}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ lineHeight: 1.7 }}
      >
        {section.body}
      </Typography>
    </Box>
  );
}

function GradesBlock({
  section,
  palette,
}: {
  section: Extract<BlogSection, { type: "grades" }>;
  palette: ReturnType<typeof usePalette>;
}) {
  return (
    <Box sx={{ mb: 3.5 }}>
      {section.heading && (
        <SectionHeading palette={palette}>{section.heading}</SectionHeading>
      )}
      <Box
        sx={{
          display: "grid",
          gap: 1,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            md: "repeat(auto-fit, minmax(160px, 1fr))",
          },
        }}
      >
        {section.items.map((item) => (
          <Box
            key={item.label}
            sx={{
              display: "flex",
              gap: 1.25,
              alignItems: "flex-start",
              p: 1.5,
              borderRadius: 2,
              bgcolor: palette.surfaceRaised,
              border: `1px solid ${palette.border}`,
            }}
          >
            <Box
              component="img"
              src={`/icons/${item.classification}.png`}
              alt={item.label}
              sx={{ width: 28, height: 28, mt: 0.15, flexShrink: 0 }}
            />
            <Box>
              <Typography fontWeight={700} sx={{ color: palette.text }}>
                {item.label}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ lineHeight: 1.45, display: "block" }}
              >
                {item.description}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function CompareBlock({
  section,
  palette,
}: {
  section: Extract<BlogSection, { type: "compare" }>;
  palette: ReturnType<typeof usePalette>;
}) {
  return (
    <Box sx={{ mb: 3.5 }}>
      {section.heading && (
        <SectionHeading palette={palette}>{section.heading}</SectionHeading>
      )}
      <Box
        sx={{
          borderRadius: 2,
          overflow: "hidden",
          border: `1px solid ${palette.border}`,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr 1fr",
            gap: 0,
            bgcolor: alpha(palette.accent, 0.1),
            px: 1.5,
            py: 1.25,
          }}
        >
          <Typography fontWeight={700} fontSize="0.8rem" color="text.secondary">
            Feature
          </Typography>
          <Typography
            fontWeight={700}
            fontSize="0.8rem"
            sx={{ color: palette.text }}
          >
            {section.leftLabel}
          </Typography>
          <Typography
            fontWeight={700}
            fontSize="0.8rem"
            sx={{ color: palette.accent }}
          >
            {section.rightLabel}
          </Typography>
        </Box>
        {section.rows.map((row, idx) => (
          <Box
            key={row.feature}
            sx={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr 1fr",
              gap: 0,
              px: 1.5,
              py: 1.25,
              bgcolor: idx % 2 === 0 ? palette.surface : palette.surfaceRaised,
              borderTop: `1px solid ${palette.borderSubtle}`,
            }}
          >
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{ color: palette.text }}
            >
              {row.feature}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {row.left}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: palette.text, fontWeight: 600 }}
            >
              {row.right}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function FaqBlock({
  section,
  palette,
}: {
  section: Extract<BlogSection, { type: "faq" }>;
  palette: ReturnType<typeof usePalette>;
}) {
  return (
    <Box sx={{ mb: 3.5 }}>
      <SectionHeading palette={palette}>
        {section.heading ?? "Frequently asked questions"}
      </SectionHeading>
      {section.items.map((faq) => (
        <Accordion
          key={faq.question}
          disableGutters
          elevation={0}
          sx={{
            mb: 1,
            bgcolor: palette.surfaceRaised,
            border: `1px solid ${palette.border}`,
            borderRadius: "8px !important",
            "&:before": { display: "none" },
            overflow: "hidden",
          }}
        >
          <AccordionSummary
            expandIcon={
              <Icon
                icon="mdi:chevron-down"
                width={22}
                color={palette.textMuted}
              />
            }
            sx={{ px: 2, minHeight: 52 }}
          >
            <Typography fontWeight={600} sx={{ color: palette.text, pr: 1 }}>
              {faq.question}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 2, pt: 0, pb: 2 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ lineHeight: 1.7 }}
            >
              {faq.answer}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}

function LoaderBlock({
  section,
  palette,
  defaultTab,
  onGameLoaded,
}: {
  section: Extract<BlogSection, { type: "loader" }>;
  palette: ReturnType<typeof usePalette>;
  defaultTab: GameOrigin;
  onGameLoaded: (game: Chess, boardOrientation?: boolean) => void;
}) {
  return (
    <Box
      sx={{
        mb: 3.5,
        p: { xs: 1.5, sm: 2.5 },
        borderRadius: 2,
        bgcolor: palette.surface,
        border: `1px solid ${palette.border}`,
      }}
    >
      {section.heading && (
        <SectionHeading palette={palette}>{section.heading}</SectionHeading>
      )}
      {section.caption && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2, lineHeight: 1.65 }}
        >
          {section.caption}
        </Typography>
      )}
      <HomeGameLoader onGameLoaded={onGameLoaded} defaultTab={defaultTab} />
    </Box>
  );
}

export default function BlogArticle({ post }: Props) {
  const palette = usePalette();
  const cardSx = useCardSx();
  const router = useRouter();
  const url = `${SITE_URL}/blog/${post.slug}`;
  const { href: ctaHref, label: ctaLabel } = resolveCta(post);
  const faqs = getBlogFaqs(post);
  const hasLoader =
    Boolean(post.showGameLoader) ||
    post.sections.some((section) => section.type === "loader");
  const defaultTab = TAB_MAP[post.defaultLoaderTab ?? "pgn"];

  const evaluationProgress = useAtomValue(evaluationProgressAtom);
  const { setPgn: setGamePgn } = useChessActions(gameAtom);
  const { resetToStartingPosition: resetBoard } = useChessActions(boardAtom);
  const setEval = useSetAtom(gameEvalAtom);
  const setBoardOrientation = useSetAtom(boardOrientationAtom);
  const setEvaluationProgress = useSetAtom(evaluationProgressAtom);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

  useEffect(() => {
    if (hasLoader) void preloadEngine(ENGINE_DEFAULTS.engine);
  }, [hasLoader]);

  const startAnalysis = useCallback(
    async (loadedGame: Chess, boardOrientation = true) => {
      const pgn = loadedGame.pgn();
      setBoardOrientation(boardOrientation);
      resetBoard(pgn);
      setEval(undefined);
      setGamePgn(pgn);
      setEvaluationProgress(0);
      prepareNewAnalysisSession(pgn, boardOrientation);
      setLoadingMessage("Preparing your game analysis…");
      await router.push("/analysis");
    },
    [
      router,
      resetBoard,
      setGamePgn,
      setEval,
      setBoardOrientation,
      setEvaluationProgress,
    ]
  );

  const schemaData: Record<string, unknown>[] = [
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
  ];

  if (faqs.length > 0) {
    schemaData.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    });
  }

  if (loadingMessage || evaluationProgress) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "40vh",
          gap: 2,
        }}
      >
        <CircularProgress size={32} />
        <Typography color="text.secondary">{loadingMessage}</Typography>
      </Box>
    );
  }

  return (
    <>
      <PageTitle
        title={post.metaTitle}
        description={post.metaDescription}
        path={`/blog/${post.slug}`}
      />
      <SchemaOrg data={schemaData} />

      <Box sx={{ maxWidth: 960, mx: "auto", pb: 5 }}>
        <NavLink href="/blog">
          <Typography
            fontSize="0.8rem"
            sx={{
              color: palette.textMuted,
              mb: 2.5,
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

        <Box
          sx={{
            mb: 3.5,
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            bgcolor: palette.surface,
            border: `1px solid ${palette.border}`,
            backgroundImage: `radial-gradient(ellipse at top right, ${alpha(palette.accent, 0.12)}, transparent 55%)`,
          }}
        >
          {post.icon && (
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: alpha(palette.accent, 0.12),
                color: palette.accent,
                mb: 2,
              }}
            >
              <Icon icon={post.icon} width={24} />
            </Box>
          )}

          <Typography
            component="h1"
            sx={{
              fontWeight: 800,
              mb: 1.25,
              color: palette.text,
              fontSize: { xs: "1.65rem", sm: "2rem" },
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
            }}
          >
            {post.title}
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 2, lineHeight: 1.65, maxWidth: 720 }}
          >
            {post.excerpt}
          </Typography>

          <Typography
            variant="caption"
            sx={{ display: "block", mb: 2, color: palette.textMuted }}
          >
            Updated {formatPublishedDate(post.publishedAt)} · Free Stockfish
            review
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {TRUST_BULLETS.map((bullet) => (
              <Chip
                key={bullet}
                icon={<Icon icon="mdi:check-circle-outline" width={16} />}
                label={bullet}
                size="small"
                sx={{
                  height: "auto",
                  py: 0.75,
                  bgcolor: alpha(palette.accent, 0.08),
                  border: `1px solid ${alpha(palette.accent, 0.18)}`,
                  color: palette.textMuted,
                  "& .MuiChip-icon": { color: palette.accent },
                  "& .MuiChip-label": {
                    whiteSpace: "normal",
                    lineHeight: 1.35,
                  },
                }}
              />
            ))}
          </Box>
        </Box>

        {post.sections.map((section, idx) => {
          switch (section.type) {
            case "prose":
              return (
                <ProseBlock key={idx} section={section} palette={palette} />
              );
            case "steps":
              return (
                <StepsBlock key={idx} section={section} palette={palette} />
              );
            case "checklist":
              return (
                <ChecklistBlock key={idx} section={section} palette={palette} />
              );
            case "callout":
              return (
                <CalloutBlock key={idx} section={section} palette={palette} />
              );
            case "grades":
              return (
                <GradesBlock key={idx} section={section} palette={palette} />
              );
            case "compare":
              return (
                <CompareBlock key={idx} section={section} palette={palette} />
              );
            case "faq":
              return <FaqBlock key={idx} section={section} palette={palette} />;
            case "loader":
              return (
                <LoaderBlock
                  key={idx}
                  section={section}
                  palette={palette}
                  defaultTab={defaultTab}
                  onGameLoaded={startAnalysis}
                />
              );
            default:
              return null;
          }
        })}

        {post.relatedSlugs && post.relatedSlugs.length > 0 && (
          <Box sx={{ mb: 3.5 }}>
            <SectionHeading palette={palette}>Related guides</SectionHeading>
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "1fr 1fr",
                  md: "1fr 1fr 1fr",
                },
              }}
            >
              {post.relatedSlugs.map((slug) => {
                const related = getBlogPost(slug);
                if (!related) return null;
                return (
                  <FeatureCard
                    key={slug}
                    title={related.title}
                    description={related.excerpt}
                    icon={related.icon ?? "mdi:book-open-page-variant"}
                    href={`/blog/${slug}`}
                    actionLabel="Read guide"
                  />
                );
              })}
            </Box>
          </Box>
        )}

        <Box
          sx={{
            ...cardSx,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { sm: "center" },
            justifyContent: "space-between",
            gap: 2,
            backgroundImage: `linear-gradient(135deg, ${alpha(palette.accent, 0.1)}, transparent 60%)`,
          }}
        >
          <Box>
            <Typography fontWeight={700} sx={{ mb: 0.5, color: palette.text }}>
              Ready to review a game?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Load Chess.com, Lichess, or PGN — Stockfish runs in your browser.
            </Typography>
          </Box>
          <Button
            component={Link}
            to={ctaHref}
            variant="contained"
            endIcon={<Icon icon="mdi:arrow-right" width={18} />}
            sx={{ flexShrink: 0 }}
          >
            {ctaLabel}
          </Button>
        </Box>
      </Box>
    </>
  );
}
