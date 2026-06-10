import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "path";

const VERCEL_ANALYTICS_SNIPPET = `<!-- Vercel Web Analytics -->
    <script>
      window.va =
        window.va ||
        function () {
          (window.vaq = window.vaq || []).push(arguments);
        };
    </script>
    <script defer src="/_vercel/insights/script.js"></script>`;

/** Ensures Vercel Web Analytics scripts are present in every production build. */
function vercelAnalyticsPlugin(): Plugin {
  return {
    name: "vercel-analytics-inject",
    transformIndexHtml(html) {
      if (html.includes("_vercel/insights/script.js")) return html;
      return html.replace("</body>", `    ${VERCEL_ANALYTICS_SNIPPET}\n  </body>`);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), vercelAnalyticsPlugin(), viteSingleFile()],
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
