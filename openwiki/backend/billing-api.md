---
type: backend integration API
title: Products and Stripe billing API
description: Public product catalog, authenticated checkout/portal sessions, and signed webhook subscription synchronization.
tags: [backend, billing, stripe, webhooks]
---

# Products and Stripe billing API

`GET /api/products` returns active `StripePrice` rows sorted by `unit_amount`, joins `StripeProduct` by Stripe product ID, and is public. Checkout requires `STRIPE_SECRET_KEY`, `price_id`, authenticated user, and `APP_URL`; it reuses or creates a Stripe customer with email and `metadata.user_id`, then creates subscription mode with card payment, promotion codes, client reference ID, subscription metadata, success URL `${APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`, and cancel URL `${APP_URL}/pricing`. Missing key returns 503; missing price returns 400; Stripe/client failures reach the error handler.

Portal also requires configured Stripe and a stored `stripe_customer_id`; otherwise it returns 503 or 400. It returns a URL with return URL `${APP_URL}/pricing`.

`POST /webhook` receives raw JSON before `express.json`, verifies `stripe-signature` with `STRIPE_WEBHOOK_SECRET`, and returns 400 on signature failure. Checkout completion retrieves subscription/price/product, derives `(product.metadata.role || 'FREE').toLowerCase()`, finds user by customer or client reference, updates user IDs/role/plan/status/start/end, and upserts `StripeSubscription`. Created/updated subscription events repeat role/status/date synchronization by customer; deleted sets user role/plan `free`, status `canceled`, and local subscription canceled. No matching user still permits a subscription upsert with undefined user; thrown processing returns 500. Unknown events are logged and acknowledged. React has no `/success` route. Validate duplicate delivery and all failure paths; no automated tests exist.
