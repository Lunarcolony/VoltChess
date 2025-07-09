import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <meta
          name="description"
          content="Get you analysis to the next level with the power of AI and stockfish!!!"
        />

        {/* OG (Social networks) */}
        <meta property="og:title" content="volthchess.com" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="voltchess.com" />
        <meta property="og:url" content="https://voltchess.com/" />
        <meta
          property="og:image"
          content="https://chesskit.org/social-networks-1200x630.png"
        />
        <meta
          property="og:description"
          content="Get you analysis to the next level with the power of AI and stockfish!!!"
        />

        {/* Twitter */}
        <meta name="twitter:title" content="voltchess.com" />
        <meta name="twitter:domain" content="voltchess.com" />
        <meta name="twitter:url" content="https://voltchess.com/" />
        <meta
          name="twitter:description"
          content="Get you analysis to the next level with the power of AI and stockfish!!!"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:image"
          content="https://chesskit.org/social-networks-1200x630.png"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
