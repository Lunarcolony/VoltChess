import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Vercel serves from domain root; "./" for other static hosts
  // Absolute paths in production so deep links (/coach/students) load assets correctly.
  base: process.env.VERCEL || process.env.NODE_ENV === "production" ? "/" : "./",
  server: {
    port: 3000,
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
    // Dev-only: proxy /api to your local or Pi backend without exposing LAN IPs in client code.
    // Set API_PROXY_TARGET in .env (not VITE_*) — e.g. http://127.0.0.1:8000
    proxy: {
      "/api": {
        target: process.env.API_PROXY_TARGET || "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: "dist",
    // JS/CSS ship as external files so index.html stays small: crawlers such as
    // Bingbot stop reading large HTML documents before reaching <body>.
    assetsDir: "assets",
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined,
      },
    },
    cssCodeSplit: false,
    // Ensure all assets are copied to output
    copyPublicDir: true,
  },
  publicDir: "public",
  optimizeDeps: {
    include: ["chess.js", "chessboardjsx"],
  },
});
