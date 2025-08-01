import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'path'

// Configuration for GitHub Pages deployment
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // For GitHub Pages: use repository name if deploying to username.github.io/repository-name
  // Change this to './' for local testing or if deploying to a custom domain
  base: process.env.NODE_ENV === 'production' ? '/VoltChess/' : './',
  server: {
    port: 3000,
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: '', // Place assets in root to avoid path issues
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined,
      },
    },
    cssCodeSplit: false,
    copyPublicDir: true,
  },
  publicDir: 'public',
  optimizeDeps: {
    include: ['chess.js', 'chessboardjsx'],
  },
})
