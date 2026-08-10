---
type: backend service
title: Express API overview
description: Route composition, middleware ordering, configuration, and shared request behavior for the Express backend.
tags: [backend, api, express]
---

# Express API overview

`server/index.js` loads `server/.env`, connects MongoDB, allows CORS from `APP_URL` (default `http://localhost:5173`), installs raw Stripe webhook parsing, then JSON parsing (10 MB), mounts routes, and listens on `process.env.PORT || 3001` on the default Node host. On Mongo failure `connectDB` logs and exits with status 1. `errorHandler.js` is final middleware.

Vite’s `/api` proxy preserves the `/api` prefix while forwarding to `http://localhost:3001`; therefore the client path `/api/auth/login` reaches Express mount `/api/auth` and route `/login` (no rewrite). Exact client mappings:

| `ApiClient` methods | Client path | Express route |
|---|---|---|
| `register/login/refresh/getMe/logout` | `/api/auth/{register,login,refresh,me,logout}` | `/api/auth` + route |
| `getUserProfile/updateUserProfile` | `/api/user/profile` | `/api/user/profile` |
| `getPosts/upsertPosts/updatePostCategory` | `/api/posts`, `/api/posts/upsert`, `/api/posts/{encodedUrl}/category` | `/api/posts` |
| premium getters/action | `/api/premium/{limits,usage,cycle-usage,actions}` | `/api/premium` |
| `getActiveProducts` | `/api/products` | `/api/products` |
| checkout/portal | `/api/stripe/{checkout,portal}` | `/api/stripe` |
| planner CRUD/optimization | `/api/planner/posts[/{id}[/optimizations]]` | `/api/planner` |
| recommendations | `/api/recommendations`, `/api/recommendations/latest` | `/api/recommendations` |

Protected handlers require `Authorization: Bearer <access JWT>`; products are public and webhook uses Stripe signature. In production `server/index.js` serves `dist` and sends `index.html` for unmatched routes. Root `server.js` is separate static-only port-3000 serving; see [operations](../operations/build-and-deploy.md).
