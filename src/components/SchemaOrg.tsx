import { useEffect } from 'react';

interface SchemaOrgProps {
  data: Record<string, any>;
}

export const SchemaOrg: React.FC<SchemaOrgProps> = ({ data }) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
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
  "name": "VoltChess",
  "applicationCategory": "GameApplication",
  "applicationSubCategory": "Chess Analysis Software",
  "description": "Free chess analysis with AI feedback powered by Stockfish. Upload PGN files, get instant game analysis, find blunders and improve your chess rating.",
  "url": "https://voltchess.me/",
  "screenshot": "https://voltchess.me/social-networks-1200x630.png",
  "operatingSystem": "Any",
  "browserRequirements": "Requires JavaScript. Requires HTML5.",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  },
  "creator": {
    "@type": "Organization",
    "name": "VoltChess"
  },
  "keywords": [
    "chess analyzer",
    "chess analysis",
    "stockfish",
    "AI chess",
    "PGN analyzer",
    "chess.com alternative",
    "free chess analysis",
    "chess blunder finder",
    "chess game review"
  ],
  "featureList": [
    "Free chess game analysis",
    "AI-powered feedback",
    "Stockfish engine integration",
    "PGN file support",
    "Blunder detection",
    "Move accuracy analysis",
    "No registration required",
    "Real-time analysis",
    "Interactive charts",
    "Position evaluation"
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "150",
    "bestRating": "5",
    "worstRating": "1"
  }
};

export const chessAnalysisServiceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Chess Game Analysis",
  "description": "Professional chess game analysis with AI feedback. Analyze your games for free using advanced Stockfish engine.",
  "provider": {
    "@type": "Organization",
    "name": "VoltChess"
  },
  "serviceType": "Chess Analysis",
  "areaServed": "Worldwide",
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Chess Analysis Services",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "PGN Analysis",
          "description": "Upload and analyze chess games in PGN format"
        },
        "price": "0",
        "priceCurrency": "USD"
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Real-time Analysis",
          "description": "Get instant position evaluation and move suggestions"
        },
        "price": "0",
        "priceCurrency": "USD"
      }
    ]
  }
};
