---
type: backend domain API
title: Planner API
description: Authenticated planner post CRUD, state filtering, scheduling fields, and optimization persistence.
tags: [backend, api, planner]
---

# Planner API

`routes/planner.js` mounts `/api/planner`. `GET /posts` returns the caller’s non-`eliminado` posts newest first. `POST /posts` creates owner-scoped content with default `borrador`; `PUT /posts/:id` applies only supplied content/state/schedule fields and returns 404 when the ID is not owned. `POST /posts/:id/optimizations` stores original and optimized content in `PostOptimization` with the caller’s user ID.

`PlannerPost` states are `borrador`, `listo`, `planificado`, and `eliminado`; `scheduled_datetime` is optional. The optimization route does not verify that `:id` names a planner post owned by the caller, nor does the schema enforce a reference. It can therefore create an orphan or cross-user-associated optimization. The frontend may issue several calls around this route; there is no transaction.

Validate state enum rejection, owner isolation on reads/updates, nonexistent IDs (404), and optimization requests against another user’s post. No automated API tests exist.
