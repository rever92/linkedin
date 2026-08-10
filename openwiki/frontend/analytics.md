---
type: frontend domain
title: Analytics and LinkedIn insights
description: Client analytics pipeline from imported LinkedIn posts through metrics, categorization, dashboards, and AI recommendations.
tags: [frontend, analytics, linkedin, metrics]
---

# Analytics and LinkedIn insights

`FileUpload.tsx` parses CSV and calls `api.upsertPosts`; `Analysis.tsx` loads posts and composes dashboard/table views. `PostsTable` sorts/searches/pages, categorizes, and updates categories. `Dashboard`, `PostsAnalysis`, `TypesAnalysis`, advanced metric views, and `CategoriesTable` each derive display aggregates; there is no single universal engagement formula.

`metrics-analyzer.ts` computes `totalViews = sum views`, interaction totals, averages as total divided by `posts.length`, and overall rate as `(likes+comments+shares)/totalViews*100` with no universal zero guard (empty input can produce `NaN`). Per type defaults missing type to `unknown`, averages sums by count, and rate uses average interactions/average views. Categories default missing category to `uncategorized`, average views/interactions divide by count, and rate divides average engagement by average views. Time groups by local `getDay()` and `getHours()`, averages per slot, discards slots with fewer than 3 posts, and sorts descending rate; the best/worst arrays are first/last three. Content buckets are `<500`, `500–1499`, and `>=1500` characters. Trends split sorted posts at the midpoint, compare second/first averages, mark increasing only when second exceeds first by 10%, and calculate frequency as post count divided by elapsed weeks (which can be zero); fewer than two posts returns default trends.

Dashboard/table/category views commonly calculate rate as `views > 0 ? interactions/views*100 : 0`, while the analyzer has unguarded divisions. `AdvancedContent` uses `... || 0` after its rate; these differences matter when changing a display. Validate empty posts, zero views, boundary lengths, missing categories/types, fewer-than-three timing posts, and zero-week trends.

Categorization sends ten uncategorized `{url,text}` records to Gemini REST with JSON content headers, requires a fenced JSON response, retries three attempts and waits 60 seconds on 429, then updates returned categories one by one; failures can leave partial writes. Profile recommendations send the analyzer result and 25 latest texts to Gemini and persist five tagged fields through `/api/recommendations`; see [AI integration](../integrations/ai-and-extension.md). No automated tests exist.
