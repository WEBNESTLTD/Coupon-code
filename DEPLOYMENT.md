# Production Deployment Guide

This guide details how to deploy the static frontend application for free on popular hosting providers.

---

## 1. Building the Frontend

Run the production build command:

```bash
npm run build
```

This compiles TypeScript, bundles all assets, generates modern minified JavaScript, and outputs everything into the `dist/` directory.

---

## 2. Deploying to Free Static Hosts

### Option A: GitHub Pages (100% Free)

1. Push your repository to GitHub.
2. In your repository, go to **Settings** > **Pages**.
3. Under **Build and deployment**:
   - Source: **GitHub Actions**
4. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Apsara DVHIMSR Coupon App

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

### Option B: Vercel Free Tier (Fastest Setup)

1. Install Vercel CLI or import the repo on [vercel.com](https://vercel.com).
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. Deploy.

---

### Option C: Netlify Free Tier

1. Link repository to [Netlify](https://app.netlify.com).
2. Build command: `npm run build`.
3. Publish directory: `dist`.
4. Add a `_redirects` file in `public/` (or Vite config) if using HTML5 history routing:
   ```text
   /*    /index.html   200
   ```
   *(Note: The app defaults to hash routing `/#/claim`, so it works flawlessly on all static hosts without redirect rules!)*

---

## 3. Printing the Permanent Promotional Poster

1. Open your deployed site home page: `https://your-domain.com`.
2. Scroll to **Official Promotional Poster QR**.
3. Click **Download Print-Ready Poster QR**.
4. The QR points to:
   ```text
   https://your-domain.com/#/claim
   ```
5. Print this QR prominently on physical posters and standees at DVHIMSR campus and the Apsara Ice Creams store.
6. **Remember:** This poster QR is permanent. You never need to replace or re-print it.

---

## 4. Counter Staff Setup

1. On the counter phone or tablet, bookmark:
   ```text
   https://your-domain.com/#/staff
   ```
2. Tap **Start Camera Scanner** and allow browser camera permissions.
3. Keep the terminal ready. When a student shows their coupon QR, aim the camera at their screen for instant verification!
