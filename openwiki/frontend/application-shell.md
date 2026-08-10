---
type: frontend application
title: React application shell
description: Browser bootstrap, routes, protected layout, session-aware navigation, theme, and extension synchronization.
tags: [frontend, react, routing, pwa]
---

# React application shell

`src/main.tsx` mounts `App` inside the router. `App.tsx` calls `useAuth`, shows a loading spinner while startup refresh runs, and uses `ProtectedRoute` for `/pricing`, `/analysis/*`, and `/planner/*`. Public routes are `/`, `/login`, and `/privacidad`; `/auth` redirects to login, `/dashboard/*` redirects to `/planner/calendar`, and unknown paths redirect home. Authenticated users landing on `/login` go to `/planner/calendar`.

Authenticated pages render `Sidebar`; public pages render `Navbar`; `ThemeProvider` wraps the layout. Session changes and route changes call `checkExtensionSync`, which may send credentials to the installed extension; see [AI and extension integration](../integrations/ai-and-extension.md). `src/lib/theme.tsx` owns theme persistence and `index.css`/Tailwind provide styling.

Vite registers a PWA with auto-update, shell navigation fallback, API denylist, install icons, and font cache-first rules. The proxy maps `/api` to port 3001. A route change must preserve both React fallback behavior and `public/.htaccess`/Workbox API exclusions. Validate deep links, unauthenticated redirects, session startup refresh, and offline shell loading with `npm run build` and a production preview.
