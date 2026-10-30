# Deploy the web demo to Vercel

The demo (`apps/web`) is a static Next.js app inside the pnpm monorepo. `apps/web/vercel.json` already sets the
install and build commands, so the import is mostly clicks.

## 1. Import the project

The demo is a **static export** (`output: 'export'` in `apps/web/next.config.ts`): plain files in `apps/web/out`,
no server. The root `vercel.json` sets everything, so the defaults work:

1. In Vercel, **Add New → Project**, and import the GitHub repository `shishany/quizate`.
2. **Root Directory:** leave it as the repository root. (`apps/web` also works; `apps/web/vercel.json` mirrors the
   settings.)
3. **Framework preset:** leave as detected; `vercel.json` sets `framework: null`, the install and build commands, the
   output directory (`apps/web/out`), clean URLs and the security headers.
4. **Production branch:** `main` (Settings → Environments → Production → Branch Tracking).
5. No environment variables are needed.

## 2. Add the subdomain

1. Project → **Settings → Domains → Add**, enter the subdomain (for example `quiz.algo-nova.com`).
2. Vercel shows the record to create. For a subdomain it is a **CNAME** to the target Vercel gives you.
3. In Hetzner konsoleH (the `algo-nova.com` zone), add that CNAME. The zone's default TTL is 24 hours, so a fresh
   record can take a while to reach every resolver.
4. Vercel issues the HTTPS certificate once the record resolves.

## 3. Check

- `/` shows the two entry cards; `/play` opens sign-up; `/admin` opens the role sign-in.
- The header carries the "Sample version" chip on every screen.

## Plan note

Vercel's Hobby plan is for personal, non-commercial use. A demo used to win client work may count as commercial; the
Pro plan covers that. Check Vercel's current terms before relying on Hobby.
