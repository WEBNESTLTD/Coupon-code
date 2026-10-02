import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Coupon-code/',
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
