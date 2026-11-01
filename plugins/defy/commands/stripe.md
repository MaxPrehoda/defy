---
description: Wire Stripe Checkout, webhooks and the customer portal into your Defy app, tested end to end
argument-hint: "[optional: path to the app, defaults to current folder]"
allowed-tools: Bash(node:*)
---

!`node "${CLAUDE_PLUGIN_ROOT}/bin/defy-license.mjs" check`

**License gate.** If the output above does not contain `DEFY_LICENSE=valid`, stop here: tell the user in one sentence what it said and that `/defy:stripe` needs a Defy key from https://www.learn-defy.com/pricing (activate with `/defy:activate <key>`). Do nothing else.

Otherwise you are running **/defy:stripe**, step 2 of Defy. App folder: `$ARGUMENTS` (current folder if empty). Read its CLAUDE.md first; the plan name and price come from there. Follow the `stripe-billing` skill for the exact patterns.

## 1. Preconditions
- Check `stripe` CLI is installed (`stripe --version`). If not, tell the user how to install it and stop.
- Everything in this step uses **Stripe test mode** only. Never ask for, read, or write a live key here.
- Ask the user to run `! stripe login` themselves if `stripe config --list` shows no test key. Do not handle their keys yourself beyond reading `.env.local`.

## 2. Product and price
Create the product and the monthly price in test mode with the Stripe CLI, using the name and price from CLAUDE.md. Put the price ID in `.env.local` as `STRIPE_PRICE_ID` and list the variable names (not values) in `.env.example`: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, `NEXT_PUBLIC_APP_URL`.

## 3. Code
- `POST /api/checkout`: signed-in only; creates a subscription Checkout Session for `STRIPE_PRICE_ID`, reusing the user's Stripe customer; `client_reference_id` = Supabase user id; success → `/app?checkout=success`, cancel → `/#pricing`.
- `POST /api/webhooks/stripe`: verifies the signature with the raw body, handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`; idempotent upserts into a `subscriptions` table keyed by user id (status, price id, current period end, stripe customer id).
- SQL migration in `supabase/migrations/` for `subscriptions` with row-level security: users can read only their own row; only the service role writes.
- `POST /api/portal`: opens the Stripe customer portal for the signed-in user.
- A `getSubscription()` server helper and a paywall: `/app` shows the upgrade CTA until the subscription is `active` or `trialing`.
- Pricing section CTA on the landing page posts to `/api/checkout` (or sends signed-out users to `/login` first).
- Follow `emil-design-eng` for the upgrade CTA, paywall and success states; use `empty-states` for the locked state.

## 4. Prove it works
- `stripe listen --forward-to 127.0.0.1:3000/api/webhooks/stripe` in the background; put its `whsec_` into `.env.local`.
- Run the app, sign in, go through Checkout with test card `4242 4242 4242 4242`, and confirm the webhook upserted an `active` row and `/app` unlocked. Then `stripe trigger customer.subscription.deleted` (or cancel in the portal) and confirm it locks again.
- `npm run build` passes.

## 5. Review and hand off
Launch the `defy-reviewer` agent with stage "stripe". Fix blocking findings. Commit ("Add Stripe billing"). End with what changed, what you verified (the actual results), and the next step: **`/defy:ship`**.
