---
type: backend domain API
title: Analytics API
description: Authenticated LinkedIn post retrieval, batch import/upsert, category updates, and persistence contract.
tags: [backend, api, analytics, linkedin]
---

# Analytics API

`routes/posts.js` mounts under `/api/posts` and applies `auth` to every endpoint. `GET /` returns the caller’s posts sorted by date descending. `POST /upsert` requires a `posts` array, builds Mongoose `bulkWrite` updates, defaults text and numeric metrics, upserts by `url`, assigns `req.userId`, then returns all caller posts. `PUT /:url/category` decodes the URL and updates only `{url,user_id}`; missing rows return 404.

`LinkedInPost` requires globally unique URL, owner, and date; metrics default to zero and category/type are optional. Important boundary: batch upsert’s filter is only `{url}`, despite assigning the current owner in `$set`; because URL is globally unique, the same URL can overwrite ownership/data across users. Category update does include ownership. Treat this as a security/data-integrity issue when changing import identity.

The browser callers are `api.getPosts`, `upsertPosts`, and `updatePostCategory`, used by file upload, table, and analysis components. Validate malformed non-array payloads (400), missing/cross-user category (404), duplicate URLs, and metric defaults with a disposable database; no automated tests prove these invariants.
