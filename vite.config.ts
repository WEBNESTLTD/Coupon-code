import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Relative base path ensures deployment works out of the box on GitHub Pages, Vercel, Netlify, or subfolders
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild'
  },
  server: {
    port: 3000,
    open: false
  }
});
