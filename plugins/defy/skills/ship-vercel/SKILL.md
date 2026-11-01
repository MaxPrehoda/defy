---
name: ship-vercel
description: Checklist for taking a Defy app from local to production on Vercel - pre-flight checks, preview then production deploys, env vars, Supabase redirect URLs, switching Stripe to live with a live webhook, custom domains, and a production smoke test. Use when deploying or re-deploying a Defy app.
---

# Ship to Vercel (Defy pattern)

## Pre-flight
- `npm run build` passes; lint clean.
- No secrets in git: `git grep -nE "sk_(live|test)_|whsec_|service_role"` finds nothing.
- `.env.example` is complete; every name has a production value ready.

## Deploy order
1. `vercel link` (create the project if needed).
2. Preview deploy: `vercel`. Check `/`, `/login`, `/app` on the preview URL.
3. Production env: `vercel env add <NAME> production` for each variable. Secrets are entered by the user if their tooling blocks agents from writing them.
4. Supabase → Auth → URL configuration: site URL = production URL; add `<url>/auth/callback` to redirect URLs.
5. Stripe live: live product + price (same name and amount as CLAUDE.md), live webhook endpoint `https://<domain>/api/webhooks/stripe` for `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`; set `STRIPE_SECRET_KEY` (live), `STRIPE_PRICE_ID` (live), `STRIPE_WEBHOOK_SECRET` (live endpoint's secret) in production only.
6. `vercel --prod`.
7. Optional domain: `vercel domains add <domain>`; set `NEXT_PUBLIC_APP_URL` to it and redeploy.

## Smoke test (production)
- Landing page renders with real copy; no console errors.
- Magic-link email arrives and signs in; `/app` is gated when signed out.
- Checkout button opens a live Stripe Checkout page for the right amount.
- Stripe dashboard shows the live webhook endpoint as enabled.

Every step that changes a real account (env vars, Supabase settings, Stripe live objects, domains) is confirmed with the user first.
