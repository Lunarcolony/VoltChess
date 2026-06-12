import { useEffect } from "react";

interface SchemaOrgProps {
  data: Record<string, unknown>;
}

export const SchemaOrg: React.FC<SchemaOrgProps> = ({ data }) => {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [data]);

  return null;
};

export const chessSoftwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "VoltChess",
  applicationCategory: "GameApplication",
  applicationSubCategory: "Chess Analysis Software",
  description:
    "Free chess game review and analysis powered by Stockfish. Upload PGN files, import Chess.com and Lichess games, find blunders, and improve your chess.",
  url: "https://voltchess.me/",
  screenshot: "https://voltchess.me/og-image.svg",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript. Requires HTML5.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
  creator: {
    "@type": "Organization",
    name: "VoltChess",
  },
  keywords: [
    "chess game review",
    "chess analysis",
    "stockfish",
    "PGN analyzer",
    "chess.com game review free",
    "free chess analysis",
    "chess blunder finder",
    "lichess game review",
  ],
  featureList: [
    "Free chess game review",
    "Stockfish engine analysis",
    "Chess.com and Lichess import",
    "PGN file support",
    "Blunder detection",
    "Move accuracy analysis",
    "No registration required",
    "Evaluation graph",
    "Interactive move navigation",
  ],
};

export const chessAnalysisServiceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Chess Game Review & Analysis",
  description:
    "Free professional chess game review and analysis using the Stockfish engine. Analyze Chess.com, Lichess, and PGN games.",
  provider: {
    "@type": "Organization",
    name: "VoltChess",
  },
  serviceType: "Chess Game Analysis",
  areaServed: "Worldwide",
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Chess Analysis Services",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "PGN Game Review",
          description: "Upload and review chess games in PGN format",
        },
        price: "0",
        priceCurrency: "USD",
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Chess.com Game Import",
          description: "Import and review Chess.com games for free",
        },
        price: "0",
        priceCurrency: "USD",
      },
    ],
  },
};
