import Head from "@/components/Head";

export const PageTitle = ({ title, description }: { title: string; description?: string }) => {
  const defaultDescription = "Free chess analysis with AI feedback powered by Stockfish. Upload PGN files, get instant game analysis, find blunders and improve your chess.";
  
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description || defaultDescription} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:type" content="website" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description || defaultDescription} />
    </Head>
  );
};
