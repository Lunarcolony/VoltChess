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
  base: "./", // Use relative paths for static deployment
  server: {
    port: 3000,
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
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
