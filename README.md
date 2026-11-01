# Defy for Claude Code

Idea to a deployed, paid SaaS, inside Claude Code.

```
/plugin marketplace add MaxPrehoda/defy
/plugin install defy@defy
```

| Command | What it does | Key needed |
|---|---|---|
| `/defy:new "<idea>"` | Pins down buyer, job and price, scaffolds Next.js + Supabase auth, writes CLAUDE.md, builds the landing page and app shell | No |
| `/defy:stripe` | Stripe Checkout, signed idempotent webhooks, subscriptions table with RLS, customer portal, tested end to end in test mode | Yes |
| `/defy:ship` | Pre-flight, preview then production on Vercel, Supabase redirects, live Stripe webhook, smoke test | Yes |
| `/defy:activate <key>` | Saves your key from https://www.learn-defy.com/pricing | – |

A `defy-reviewer` agent checks every step before you move on.

## UI skills included
- Design engineering and motion from Emil Kowalski's open-source skills (MIT, see `plugins/defy/THIRD-PARTY-NOTICES.md`): `emil-design-eng`, `animate`, `review-animations`, `improve-animations`, `break-ui` and more.
- The AI CSS Animations (Motif) set: `design-system`, `apply-transitions`, `beautify`, `empty-states`, `choose-icons` and the design-system phases.

Get a key: https://www.learn-defy.com/pricing
