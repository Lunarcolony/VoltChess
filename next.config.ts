import { withSentryConfig } from "@sentry/nextjs";
import { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

const isProd = process.env.NODE_ENV === "production";

// ⚠️ IF USING GITHUB PAGES, use this:
const base = "";

// ✅ IF USING A CUSTOM DOMAIN (e.g. voltchess.me), use this instead:
// const base = "";

const nextConfig = (phase: string): NextConfig => ({
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
  basePath: isProd ? base : "",
  assetPrefix: isProd ? base + "/" : "",
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ["chesskit.org", "voltchess.me"],
  },
  headers:
    phase === PHASE_PRODUCTION_BUILD
      ? undefined
      : async () => [
          ...["/", "/analysis", "/database", "/login", "/play", "/reanalysis", "/register", "/terms-and-conditions", "/thanks"].map(
            (path) => ({
              source: path,
              headers: [
                {
                  key: "Cross-Origin-Embedder-Policy",
                  value: "require-corp",
                },
                {
                  key: "Cross-Origin-Opener-Policy",
                  value: "same-origin",
                },
              ],
            })
          ),
          {
            source: "/engines/:blob*",
            headers: [
              {
                key: "Cross-Origin-Embedder-Policy",
                value: "require-corp",
              },
              {
                key: "Cross-Origin-Opener-Policy",
                value: "same-origin",
              },
              {
                key: "Cache-Control",
                value: "public, max-age=31536000, immutable",
              },
              {
                key: "Age",
                value: "181921",
              },
            ],
          },
        ],
});

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: "javascript-nextjs",
  widenClientFileUpload: true,
  reactComponentAnnotation: {
    enabled: true,
  },
  hideSourceMaps: true,
  disableLogger: true,
});
