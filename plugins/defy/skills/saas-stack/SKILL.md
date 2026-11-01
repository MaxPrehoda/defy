---
name: saas-stack
description: The default stack and conventions for apps built with Defy (Next.js App Router, Supabase auth, Stripe subscriptions, Vercel), plus the CLAUDE.md template that keeps every agent on-product. Use when scaffolding a Defy app, writing its CLAUDE.md, or deciding where code goes in one.
---

# Defy SaaS stack

## Defaults
- Next.js App Router, TypeScript, Tailwind, `src/` layout, npm.
- Supabase: `@supabase/ssr` clients in `src/lib/supabase/{client,server,middleware}.ts`; email magic-link auth; row-level security on every table.
- Stripe: one product, one monthly price, Checkout + webhooks + customer portal (see `stripe-billing`).
- Vercel for hosting (see `ship-vercel`). Dev server on `127.0.0.1` only.
- Secrets live in `.env.local` (gitignored); `.env.example` lists names only.

## Layout
```
src/app/(marketing)/page.tsx      landing page
src/app/login/page.tsx            magic-link sign-in
src/app/auth/callback/route.ts    code exchange
src/app/app/                      signed-in product (gated)
src/app/api/checkout|portal|webhooks/stripe/route.ts
src/lib/supabase/  src/lib/stripe.ts  src/lib/subscription.ts
supabase/migrations/
```

## CLAUDE.md template
Write this into the app root, filled in. Keep it under 60 lines.

```markdown
# <Name>

## Product
- **Buyer:** <the specific person who pays, and where to reach them>
- **The one job:** <the single thing it does that they pay for>
- **Price:** <$X/month, one plan>
- **Not building (yet):** <tempting features that wait until someone has paid>

## Stack
Next.js App Router + TypeScript + Tailwind, Supabase auth (@supabase/ssr) with RLS on every table,
Stripe subscriptions (Checkout, webhooks, portal), deployed on Vercel. Built with the Defy plugin:
/defy:new → /defy:stripe → /defy:ship.

## Rules for agents
- Build only the one job. Anything else goes in "Not building (yet)".
- Access to paid features comes from the `subscriptions` table written by the Stripe webhook.
- Never commit secrets; add new env var names to `.env.example`.
- UI: follow the `emil-design-eng` skill; motion follows `animate` and must pass `review-animations`;
  empty screens follow `empty-states`. Copy names the buyer's real situation, never lorem ipsum.
- Dev server binds to 127.0.0.1.

## Commands
npm run dev · npm run build · stripe listen --forward-to 127.0.0.1:3000/api/webhooks/stripe
```
