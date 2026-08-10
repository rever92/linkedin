---
type: operations guide
title: Build, deployment, and documentation automation
description: Local scripts, Vite/PWA production behavior, server entrypoints, Apache fallback, environment boundaries, and OpenWiki CI automation.
tags: [operations, deployment, vite, pwa, ci]
---

# Build, deployment, and documentation automation

Scripts are `npm run dev` (Vite), `dev:server` (nodemon `server/index.js`), `dev:all`, `build` (`tsc && vite build`), `lint`, `preview`, and `start` (`server/index.js`). `server/index.js` loads env, connects MongoDB, listens on `process.env.PORT || 3001` on the default Node host, and in production serves `../dist` plus `index.html` for every unmatched path. Root `server.js` is separate static-only `dist` serving on `process.env.PORT || 3000`; it does not mount APIs.

Vite proxies `/api` to `http://localhost:3001`, outputs `dist/assets`, and PWA registers with `registerType: 'autoUpdate'`. Manifest metadata is name/short name `Linksight`, description `LinkedIn Analytics & AI Optimization`, start `/`, standalone display, white background, blue `#0A66C2` theme, and `/icons/icon-192.png` (192x192), `/icons/icon-512.png` (512x512), plus maskable 512 icon. Workbox precaches `**/*.{js,css,html,svg,png,woff2}`, uses `/index.html` navigation fallback, denies `/^\/api\//`, and cache-first caches Google fonts (max 10, one year). `public/.htaccess` similarly leaves `/api/` alone, serves files/directories, and rewrites other paths to `index.html`.

Required runtime configuration includes MongoDB, JWT, Stripe server settings, `APP_URL`, port, and browser `VITE_*` build values. Never commit real values. Migration/reset utilities live in `server/scripts` and should be run only with backups. Stripe checkout redirects to `/success`, but React has no matching route.

`.github/workflows/openwiki-update.yml` runs manually or daily at `0 8 * * *`, grants contents/PR write permissions, checks out full history, installs pinned Node 22/OpenWiki 0.3.1/Mermaid/jsdom, runs `openwiki code --update --print` with OpenRouter and LangSmith secrets, and creates/updates branch `openwiki/update` with a PR limited to `openwiki`, agent files, and workflow. Missing secrets or failed OpenWiki prevents a valid PR.

Validate `npm run lint`, `npm run build`, deep links, API proxy/static separation, offline shell, and generated automation changes.
