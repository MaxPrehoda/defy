---
description: Deploy your Defy app to Vercel with production env, live Stripe and a smoke test
argument-hint: "[optional: path to the app, defaults to current folder]"
allowed-tools: Bash(node:*)
---

!`node "${CLAUDE_PLUGIN_ROOT}/bin/defy-license.mjs" check`

**License gate.** If the output above does not contain `DEFY_LICENSE=valid`, stop here: tell the user in one sentence what it said and that `/defy:ship` needs a Defy key from https://www.learn-defy.com/pricing (activate with `/defy:activate <key>`). Do nothing else.

Otherwise you are running **/defy:ship**, step 3 of Defy. App folder: `$ARGUMENTS` (current folder if empty). Read its CLAUDE.md, then follow the `ship-vercel` skill.

## 1. Pre-flight (fix before deploying)
- `npm run build` and lint pass; no secrets in git (`git grep -nE "sk_(live|test)_|whsec_|service_role"` must find nothing).
- Every variable in `.env.example` has a value ready for production.
- Run the `break-ui` skill on the landing page and the paywall, and `review-animations` on any motion. Fix what's broken.

## 2. Deploy
- Check the Vercel CLI (`vercel --version`) and login (`vercel whoami`). If not logged in, ask the user to run `! vercel login`.
- `vercel link`, then a **preview** deploy first. Load the preview URL and check `/`, `/login`, `/app`.

## 3. Production settings — ask before each outward step
These change real accounts, so confirm with the user before each one:
- Production env vars on Vercel. The user adds secrets themselves if their tooling blocks you; give them the exact `vercel env add` commands.
- Supabase: add the production URL to Auth → URL configuration (site URL + `/auth/callback` redirect).
- Stripe **live** mode: the user creates the live product/price (or `stripe products create --live` after they confirm), and a live webhook endpoint at `https://<domain>/api/webhooks/stripe` with the same three events; its signing secret becomes `STRIPE_WEBHOOK_SECRET` in production.
- Optional custom domain: `vercel domains add`.

## 4. Go live and smoke test
- `vercel --prod`. Load the production URL: landing page renders, sign-in email arrives, `/app` is gated, and the checkout button opens a **live** Stripe Checkout page (don't pay unless the user wants to test with a real card and refund).
- Launch the `defy-reviewer` agent with stage "ship" and the production URL. Fix blocking findings and redeploy.

## 5. Hand off
Report the live URL, what you verified (actual results), anything the user still has to do by hand, and the first thing to do with it: message the buyers they named in CLAUDE.md and ask for the sale.
