---
type: backend domain API
title: Premium limits and recommendations
description: Plan limits, usage aggregation, premium action recording, and recommendation persistence, including enforcement boundaries.
tags: [backend, premium, recommendations, usage]
---

# Premium limits and recommendations

`PremiumLimit` rows are queried with `role.toUpperCase()`. `getRoleLimits` folds rows by `action_type` into `profile_analysis` (`days_between_analysis`, `monthly_limit`), `post_optimization` (`max_per_post`, `monthly_limit`), and `batch_analysis` (`monthly_limit`); no rows returns `null`. `GET /limits` exposes this object.

`getMonthlyActions` matches `user_id` and `createdAt >=` local first-day-of-month midnight, groups by `action_type`, and returns `{action_type,count}`. `getCurrentCycleActions` starts at `subscription_start_date`, advances calendar months until the current cycle, and applies the same grouping. `/cycle-usage` falls back to natural-month aggregation when no subscription start date exists.

The critical trust boundary is client-side. `usePremiumActions` checks cycle profile count against profile monthly limit (but only approximates spacing), natural-month optimization count against optimization monthly limit (not max-per-post), and natural-month batch count against batch limit. It then calls `POST /actions`, which only requires `action_type` and persists `PremiumAction`; it does not reject quotas, spacing, role mismatch, or duplicates. Concurrent clients can both pass checks. Recommendations `POST /` accepts `tipos_de_contenido`, `mejores_horarios`, `longitud_optima`, `frecuencia_recomendada`, and `estrategias_de_engagement`, always sets `req.userId` and `date_generated`; `/latest` filters that user and sorts date descending. No automated tests exist.
