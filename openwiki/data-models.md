---
type: data model reference
title: MongoDB data models
description: Mongoose schemas, indexes, ownership relationships, and persistence invariants used by Linksight.
tags: [data, mongodb, mongoose, schemas]
---

# MongoDB data models

`server/config/db.js` connects Mongoose using `MONGODB_URI`. Schemas use timestamps unless noted. `User` is the identity and subscription projection: bcrypt hashes passwords in a pre-save hook, stores one hashed refresh token, role (`free`, `pro`, `business`), subscription dates/status, and Stripe IDs. `toProfile()` deliberately excludes password and refresh token.

| Model | Ownership / key fields | Index or lifecycle |
|---|---|---|
| `LinkedInPost` | `user_id`, globally unique `url`, date, metrics, category | `{user_id:1,date:-1}`; URL uniqueness is global |
| `PlannerPost` | `user_id`, content, state `borrador/listo/planificado/eliminado`, schedule | user index; deleted state is filtered at read |
| `PostOptimization` | `post_id`, `user_id`, original/optimized content | reference is not validated by route |
| `PremiumAction` | user, action type, metadata, timestamps | aggregated by `createdAt` |
| `PremiumLimit` | uppercase role, action type, limit type/value | `{role:1,action_type:1}` |
| `Recommendation` | user and five recommendation fields, generation date | latest selected by date |
| `StripeProduct` / `StripePrice` | Stripe IDs, active catalog data | active prices are public |
| `StripeSubscription` | user, customer/subscription/price IDs, status and period | upserted by Stripe subscription ID |

Most routes filter by `req.userId`, but this is not universal protection: posts batch upsert filters only by URL before assigning the caller, so a globally unique URL can overwrite another user’s row; category update adds user ownership. Planner optimization stores the caller’s ID but does not prove the referenced planner post belongs to that caller, allowing orphan/mismatched references. Recommendations ignore caller-supplied identity and use `req.userId`. These are implementation invariants, not guarantees to strengthen in prose.

Review schema changes with the route payloads and `src/types`. There are no repository-owned automated model tests; validate indexes, cross-user IDs, deleted planner states, and webhook upserts against a disposable MongoDB.
