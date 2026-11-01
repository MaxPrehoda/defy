---
name: stripe-billing
description: Exact patterns for Stripe subscription billing in a Next.js + Supabase app: Checkout sessions, signature-verified idempotent webhooks, a subscriptions table with RLS, the customer portal, and end-to-end testing with the Stripe CLI in test mode. Use when adding or fixing billing in a Defy app.
---

# Stripe billing (Defy pattern)

## Rules
- Test mode until `/defy:ship`. Never touch live keys while building.
- Access comes from the `subscriptions` table, written only by the webhook. The success redirect is just UX.
- Webhook handlers are idempotent upserts keyed by `user_id`.

## Webhook route (App Router)
```ts
// src/app/api/webhooks/stripe/route.ts
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new Response("Bad signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    if (s.mode === "subscription" && s.client_reference_id && s.subscription) {
      const sub = await stripe.subscriptions.retrieve(s.subscription as string);
      await upsert(s.client_reference_id, sub);
    }
  }
  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const { data } = await admin.from("subscriptions").select("user_id").eq("stripe_customer_id", sub.customer).maybeSingle();
    if (data) await upsert(data.user_id, sub);
  }
  return Response.json({ received: true });
}

async function upsert(userId: string, sub: Stripe.Subscription) {
  await admin.from("subscriptions").upsert({
    user_id: userId,
    stripe_customer_id: sub.customer as string,
    stripe_subscription_id: sub.id,
    status: sub.status,
    price_id: sub.items.data[0]?.price.id,
    current_period_end: new Date(sub.items.data[0]!.current_period_end * 1000).toISOString(),
  });
}
```
`SUPABASE_SERVICE_ROLE_KEY` is server-only; it must never appear in client code or a `NEXT_PUBLIC_` variable.

## Migration
```sql
create table public.subscriptions (
  user_id uuid primary key references auth.users on delete cascade,
  stripe_customer_id text unique not null,
  stripe_subscription_id text unique,
  status text not null,
  price_id text,
  current_period_end timestamptz,
  updated_at timestamptz default now()
);
alter table public.subscriptions enable row level security;
create policy "read own subscription" on public.subscriptions for select using (auth.uid() = user_id);
```

## Checkout
Create a session with `mode: "subscription"`, `line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }]`, `client_reference_id: user.id`, `customer` when you already have one (else `customer_email`), `allow_promotion_codes: true`, success and cancel URLs from `NEXT_PUBLIC_APP_URL`. Return a 303 redirect to `session.url`.

## Portal
`stripe.billingPortal.sessions.create({ customer, return_url: \`${APP_URL}/app\` })` → 303 to its URL. Enable cancellation and plan display in the Stripe dashboard's portal settings (test mode first).

## Testing
1. `stripe listen --forward-to 127.0.0.1:3000/api/webhooks/stripe` → copy `whsec_…` into `.env.local`.
2. Sign in, check out with `4242 4242 4242 4242`, any future date, any CVC.
3. Confirm a row with `status = active`, and that `/app` unlocks.
4. Cancel in the portal (or `stripe trigger customer.subscription.deleted`) and confirm it locks.
5. Replay an event (`stripe events resend <id>`) and confirm nothing duplicates.
