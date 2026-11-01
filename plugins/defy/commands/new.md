---
description: Turn an idea into a scaffolded SaaS with auth, a landing page and a CLAUDE.md
argument-hint: "<one-line idea, e.g. invoice chaser for plumbers>"
---

You are running **/defy:new**, step 1 of Defy: idea to a deployed, paid SaaS. The idea: **$ARGUMENTS**

Work through these stages in order. Keep the user informed in short lines; don't narrate tool calls.

## 1. Pin down the product (ask, don't assume)
Use the AskUserQuestion tool, one question at a time, each with concrete options you propose from the idea:
1. **Who pays?** A specific buyer you can name and reach (e.g. "solo plumbers in the US who invoice from their phone"), not a category.
2. **The one job.** The single thing it does that the buyer would pay for this month.
3. **Price.** One plan, one monthly price. Propose a number from what the buyer pays for today's alternative.
4. **Name and folder.** Suggest a short name; the folder is its slug inside the current directory.
If the idea was empty, ask for it first.

## 2. Scaffold the app
Stack (the defaults Defy's later steps expect; only change it if the user insists):
- Next.js App Router, TypeScript, Tailwind, ESLint, `src/` dir: `npx create-next-app@latest <slug> --ts --tailwind --eslint --app --src-dir --use-npm --yes`
- Supabase auth with `@supabase/ssr` (email magic link): browser + server clients in `src/lib/supabase/`, middleware that refreshes the session, `/login` page, `/auth/callback` route, a protected `/app` route that redirects signed-out users.
- `.env.example` listing `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Never write real keys into committed files.
- Dev server binds to localhost only: `"dev": "next dev -H 127.0.0.1"`.

## 3. Write CLAUDE.md
Create `<slug>/CLAUDE.md` from the template in the `saas-stack` skill, filled in with the answers from stage 1. This file is what keeps every later agent on-product.

## 4. Build the landing page and the app shell
- Landing page at `/`: headline that names the buyer and the job, one paragraph, a waitlist/sign-up CTA, a pricing section showing the single plan, a short FAQ. Real copy from stage 1, never lorem ipsum.
- `/app`: a signed-in shell with an empty state for the one job (use the `empty-states` skill).
- **UI quality is part of the job.** Before writing UI, read and follow the `emil-design-eng` skill. For any motion, follow `animate`; then run the checks in `review-animations` on what you built. If the user wants a real design system, offer `design-system`.

## 5. Verify and commit
- `npm run build` must pass. Start the dev server, load `/` and `/login`, and fix anything broken.
- `git init` if needed, commit with a plain title like "Scaffold <name>".
- Launch the `defy-reviewer` agent with: the stage ("new"), the folder, and the CLAUDE.md. Fix every blocking finding it returns, then re-run the build.

## 6. Hand off
End with: what was built (3–5 bullets), how to run it (`npm run dev`), what the user must do themselves (create a Supabase project and paste its URL and anon key into `.env.local`), and the next step: **`/defy:stripe`** to start charging.
