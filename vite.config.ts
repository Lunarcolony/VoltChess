import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Vercel serves from domain root; "./" for other static hosts
  base: process.env.VERCEL ? "/" : "./",
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
    assetsDir: "", // Place assets in root to avoid path issues
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined, // Disable code splitting for single file output
      },
    },
    cssCodeSplit: false, // Inline CSS into JS bundle
    // Ensure all assets are copied to output
    copyPublicDir: true,
  },
  publicDir: "public",
  optimizeDeps: {
    include: ["chess.js", "chessboardjsx"],
  },
});
