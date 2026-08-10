---
type: frontend domain
title: Authentication and billing UI
description: Login, session-aware navigation, pricing, Stripe client calls, and premium action gating in the browser.
tags: [frontend, auth, billing, premium]
---

# Authentication and billing UI

`Auth.tsx` calls `api.register`/`login`; `useAuth` owns startup refresh, periodic refresh, sign-out, and redirects. `Pricing.tsx` loads public products, starts checkout, or opens the billing portal through `src/lib/stripe.ts` and `ApiClient`. `Navbar`/`Sidebar` expose session-dependent navigation.

Premium UI checks are implemented by `usePremiumActions`: it loads role limits and usage before profile analysis, batch categorization, or post optimization, then records an action. These checks are advisory because the server action endpoint inserts without enforcing limits; see [premium and recommendations](../backend/premium-and-recommendations.md). Stripe failures surface to UI; absent server Stripe returns 503 and absent publishable key is logged by the client.

Validate register/login errors, startup with expired refresh token, logout, pricing with empty product response, checkout/portal errors, and premium checks at month/cycle boundaries. There are no repository-owned frontend tests.
