---
type: frontend domain
title: Content planner
description: List/calendar planner UI, post state transitions, scheduling, and AI optimization workflow.
tags: [frontend, planner, scheduling, ai]
---

# Content planner

`PlannerView` mounts under `/planner/*`, starts with `posts=[]`, and runs `loadPosts` once on mount. Loading failures are logged and leave the current list unchanged; there is no loading indicator. It selects `/planner` list versus `/planner/calendar`, passes only `planificado` posts to `Calendar`, opens `PostEditor` for new/date-selected/existing posts, and calls `loadPosts` after save before closing the editor.

`PostEditor` creates or updates content with states `borrador`, `listo`, `planificado`, or `eliminado`. Selecting a date forces `planificado`; a missing time becomes `00:00`. Normal save makes one create or update request. The UI has delete state/dialog behavior, but there is no dedicated delete API call: deletion is represented by updating state to `eliminado`, which the GET route excludes. Optimization can create a temporary draft, update pending content, register a premium action, call Gemini, and save an optimization. A failure midway can leave partial writes; there is no transaction. API details and ownership caveat are in [planner API](../backend/planner-api.md).

Focused validation: create/schedule/edit/delete-state a post, verify list exclusion and calendar filtering, select a date, optimize new and existing posts, and simulate failure after each write. No planner test files exist.
