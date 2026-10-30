# Deploy the web demo to Vercel

The demo (`apps/web`) is a static Next.js app inside the pnpm monorepo. `apps/web/vercel.json` already sets the
install and build commands, so the import is mostly clicks.

## 1. Import the project

1. In Vercel, **Add New → Project**, and import the GitHub repository `shishany/quizate`.
2. **Root Directory:** `apps/web`. Leave "Include files outside the root directory" on (the build needs
   `packages/game` and `packages/shared`).
3. **Framework preset:** Next.js (detected). Leave the build and install commands empty; `vercel.json` sets them:
   - install: `cd ../.. && pnpm install --frozen-lockfile`
   - build: `cd ../.. && pnpm turbo run build --filter=@quizate/web`
4. **Production branch:** `main` (Settings → Git after the first deploy). Until the demo branch is merged, deploy
   the branch as a preview, or set the production branch to `demo-web` temporarily.
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
