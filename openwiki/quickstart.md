---
type: guide
title: Linksight code wiki quickstart
description: Navigation and task routing for the React, Express, MongoDB, analytics, planner, billing, and integration codebase.
tags: [quickstart, navigation, development]
---

# Linksight code wiki quickstart

Linksight is a React 18/Vite PWA backed by Express, MongoDB/Mongoose, Stripe, and browser-side Gemini. Start with [runtime architecture](architecture/overview.md), then use the domain pages below.

## Map

- [Application shell](frontend/application-shell.md): routes, protected layout, session integration, PWA boundary.
- [Analytics](frontend/analytics.md): CSV import, metrics formulas, dashboards, categorization, recommendation handoff.
- [Planner](frontend/planner.md): list/calendar/editor lifecycle and multi-write AI optimization.
- [Frontend auth/billing](frontend/auth-and-billing.md): UI session and pricing behavior.
- [API overview](backend/api-overview.md): composition and complete client-to-route map.
- [Authentication](backend/authentication.md): JWT, refresh rotation, and failure contracts.
- [Analytics API](backend/analytics-api.md), [Planner API](backend/planner-api.md), [Premium/recommendations](backend/premium-and-recommendations.md), and [Billing](backend/billing-api.md): backend domains.
- [Data models](data-models.md): Mongo schema and ownership invariants.
- [AI/extension](integrations/ai-and-extension.md): Gemini consumers and Chrome messages.
- [Operations](operations/build-and-deploy.md): commands, PWA, deployment, and OpenWiki automation.

## Task routing

| Intent | Owning page/source | Focused validation | Minimal command |
|---|---|---|---|
| Add/change route | API overview + domain API; `server/index.js`, route file, `src/lib/api.ts` | authenticated/public status and payload checks | `npm run lint` |
| Change auth/session | Authentication; `server/routes/auth.js`, `server/middleware/auth.js`, `src/lib/api.ts`, `useAuth.ts` | refresh rotation, expired access, replay/failure | `npm run build` |
| Change analytics | Analytics; `metrics-analyzer.ts`, `Dashboard.tsx`, analysis components | empty/zero data, formula and boundary cases | `npm run lint` |
| Change AI | AI integration + analytics/planner; named consumer | malformed output, 429, no-key, partial writes | `npm run build` |
| Change planner | Planner pages; `PlannerView.tsx`, `PostEditor.tsx`, planner routes/models | schedule, state filtering, multi-write failure | `npm run lint` |
| Change plans/Stripe | Premium + billing pages; routes/services/models | 503, signature failure, webhook transitions, quota race | `npm run build` |
| Change deployment/PWA | Operations + shell; `vite.config.ts`, `server/index.js`, `.htaccess` | deep links, API exclusion, offline shell | `npm run build` |
| Change extension sync | AI/extension; `extensionCommunication.ts`, `App.tsx` | absent API, unsynced response, rejected message | `npm run lint` |

## Local lifecycle

Install with `npm install`; run `npm run dev:all` for Vite on 5173 and API on 3001. Configure placeholder-based environment values outside source control, run `npm run build` for `dist`, and use `npm start` for the Mongo-backed production server. There are no repository-owned automated test files; focused checks in each domain page are the validation contract.

## Backlog / known boundaries

- Browser Gemini keys are exposed by design in current code; moving calls server-side requires a new API boundary.
- Premium quotas are client-gated and not atomically enforced by `POST /api/premium/actions`.
- Root `server.js` and `server/index.js` are competing entrypoints; deployment must choose the API server.
- Stripe success redirects to `/success`, which is not a React route.
- Planner optimization references are not ownership-validated and can orphan.
