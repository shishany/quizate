# Quizate — project brief

Read this first in every session and keep it current. Update it whenever a decision changes.

"Quizate" (Arabic: كويزاتي) is a working name. The product name lives in one constant, `PRODUCT` in
`packages/shared/src/product.ts`; never type it anywhere else in code or UI strings.

## Product

Free, 18+ only, Arabic-first (then English, then Urdu) 1v1 trivia game for Saudi Arabia. Two players are matched
(nearest first, then nationwide), answer the same 10 questions under a server timer, and earn points. A monthly
leaderboard ranks qualified players. An engagement layer (XP levels, ranked ladder, daily loop, Mirror Challenge,
later clubs and team modes) drives retention. Revenue: sponsored questions/campaigns, ads, corporate SaaS. Cash prizes
(top 10 of Classic 1v1, SAR 55,000/month by default) are BUILT but DISABLED behind a feature flag until legal
clearance.

Source of truth: `docs/BRD.md` (v1.1), `docs/REGULATORY.md`, `docs/ENGAGEMENT.md`. Cite BR-/FR-/NFR- IDs in commits,
PR descriptions and tests. BRD section 8 lists the owner's open decisions; until one is closed, build the default as
configuration and do not invent values the documents do not give.

The build runs prompt by prompt from `docs/BUILD_PROMPTS.md`, one branch per prompt (`prompt-NN-<topic>`). The prompts
predate BRD v1.1: where they conflict (for example Prompt 3's phone-only sign-up and under-13 rule), BRD v1.1 and this
file win.

## Stack

- Monorepo: pnpm workspaces + Turborepo
- `apps/api`: NestJS (TypeScript strict), modular monolith, REST + WebSocket (socket.io)
- `apps/admin`: Next.js (App Router), Tailwind, RTL-first, admin + sponsor portals
- `apps/mobile`: Flutter (stable), Riverpod, go_router; locales ar (default), en, ur; RTL for ar/ur
- `apps/web`: the web sample version (see "Web demo")
- `packages/shared`: shared TS types, zod schemas, error codes; `packages/game`: game rules shared by web and API
- PostgreSQL 16 + PostGIS; Prisma for schema/migrations, raw SQL for geo queries
- Redis 7: matchmaking queues, sessions, leaderboards (sorted sets), rate limits, BullMQ jobs
- Object storage: S3-compatible (RustFS locally; see stack decisions)
- Tests: Vitest (api, admin, web, packages), Playwright (admin, web), flutter_test; k6 for load
- Local: docker compose. Deploy: containers, Saudi cloud region, Terraform (provider-neutral)

## Architecture rules (do not break)

1. The server is authoritative for timing, answers, scoring, ratings, eligibility and prizes. Never trust
   client-sent scores or timestamps.
2. Score, points, XP, coin and prize records are append-only ledgers. Corrections are new entries with reason, actor
   and approver. No UPDATE/DELETE on ledger tables.
3. All writes that move points, XP, coins or money are idempotent and transactional.
4. Every business default in BRD sections 3-4 and `docs/ENGAGEMENT.md` is configuration (config table + cache), not a
   constant in code. Changes are audited.
5. Feature flag `prizes.enabled` defaults to false in every environment. Prize endpoints must refuse to activate a
   campaign without an attached legal approval record. Never change this.
6. No in-app wallet, stored value, purchasable points or coins, paid attempts, paid entry or paid random rewards.
   Coins are earned only: never bought, gifted, traded, cashed or used as an entry fee. Points and XP have no cash
   value.
7. 18+ only. Identity comes from Nafath (verified date of birth); refuse under-18. One account per national ID /
   Iqama number. The IBAN must be verified as owned by the same ID number before it becomes active (config
   `identity.iban_required_at` = `signup` | `ranked` | `prize`, default `signup`). Prize payouts only by bank transfer
   to that verified IBAN.
8. Personal data stays in the Saudi region. Location is used only for an active queue ticket, rounded to ~1 km, and
   deleted when the match starts. Opponents see city + distance band only. National ID and IBAN are field-encrypted
   and never logged.
9. Sponsors only ever see aggregated data. No personal data in sponsor reports or exports.
10. Only Classic 1v1 ranked matches feed monthly ranked points and prizes. Engagement rewards, team modes and clubs
    never change monthly points.
11. Modules talk through service interfaces or domain events, never by reaching into another module's tables.
12. External providers (Nafath, IBAN verification, SMS/OTP, push, ads, payouts) sit behind interfaces with a fake
    implementation for local and test.

## API modules (`apps/api/src/modules`)

identity, consent, content, matchmaking, match, rating, leaderboard, progression, club, modes, fraud, sponsor, ads,
prize, config, audit, notification, analytics, admin

## Conventions

- Locales: ar (default), en, ur. Every user-facing string goes through i18n in all three. Urdu uses a Nastaliq font
  (Noto Nastaliq Urdu) with increased line height.
- Questions store text per language with a review status per language; a question is served in a language only when
  that language version is approved (FR-29: Urdu by a native reviewer).
- Errors: typed error codes from `packages/shared`; never leak stack traces.
- Time: store UTC; days and months computed in Asia/Riyadh.
- Money: integer halalas (SAR x 100); never floats.
- Migrations: one per change, reversible, with seed data for local only.
- Tests: unit tests for all business rules; integration tests against docker Postgres/Redis; every BR-xx has at least
  one test named after it.
- Commits: Conventional Commits, referencing BR/FR IDs.

## Definition of done

Lint + typecheck + tests pass; new config keys documented in `docs/CONFIG.md`; API changes in OpenAPI; audit log
written for every admin action; strings present in ar, en and ur; no TODOs in money, scoring or identity paths.

## Commands

`pnpm i` | `pnpm dev` | `pnpm test` | `pnpm lint` | `docker compose up -d` | `pnpm db:migrate` | `pnpm db:seed`

## Known ordering issues in the build prompts (decided 2026-10-30)

- Prompt 4 selects sponsored questions before campaigns exist (Prompt 9): use a `SponsoredQuestionSource` interface
  that returns none until Prompt 9.
- Prompts 5 and 7 need suspensions and fraud review cases before the fraud module (Prompt 8): call them through
  interfaces in `packages/shared` / module services, with a minimal implementation filled in by Prompt 8.
- Prompt 6's asynchronous practice opponent needs recorded matches; fall back to a bot until recordings exist.
- Prompt 2's 200 sample questions are local seed data only and must never reach staging or production.

## Stack decisions (Prompt 1, 2026-10-30)

- **NestJS 12 is ESM-only.** The API and `packages/shared` are ES modules (`"type": "module"`, `NodeNext`); relative
  imports end in `.js`. Following Nest 12's own template, the API is tested with **Vitest**, not Jest (Jest on ESM
  needs experimental flags). Unit tests: `src/**/*.spec.ts`; integration tests: `test/**/*.int-spec.ts`
  (`pnpm test:integration`, needs `docker compose up -d`).
- **TypeScript 6** (Nest 12's tooling needs >= 6; TypeScript 7, the native port, is not yet supported by the tools).
- **Local object storage is RustFS** (`rustfs/rustfs`, S3-compatible, Apache-2.0): MinIO no longer publishes community
  images. The API speaks only the S3 API, so this is a local choice.
- **API i18n** is a small service (`src/core/i18n`) over `src/i18n/{ar,en}.ts`, not nestjs-i18n (which needs
  class-validator; validation here is zod). A test keeps both dictionaries' keys equal; the admin app has the same test.
- **Environment vs configuration:** `src/core/env` validates infrastructure env vars only. Business defaults go to the
  `config` module (Prompt 10), never env vars.
- **Mobile:** strings in `lib/l10n/app_{ar,en}.arb` (Arabic is the template; `app_ur.arb` still to add); `appName`
  mirrors `PRODUCT` by hand because Dart cannot import the TS constant.
- **Owner's CLAUDE.md of 2026-10-30** listed Jest and MinIO; the decisions above (Vitest, RustFS) stand because
  Nest 12 is ESM-only and MinIO no longer publishes images.

## Web demo (owner decision, 2026-10-30)

- **Live (since 2026-10-30):** https://quizate.algo-nova.com on Vercel (project `quizate`). DNS: CNAME `quizate` in the Hetzner konsoleH zone
  `algo-nova.com`. Vercel deploys on every push to the tracked branch (`main`, or `demo-web` while it is tracked).
  The demo is a static export (`apps/web/out`); the root `vercel.json` holds the build settings and headers.
- The owner presents the product with a **web demo on Vercel** before the full build: `apps/web`, described in
  `docs/DEMO.md`, deployed per `docs/DEPLOY_VERCEL.md`. Player app at `/play`, admin console at `/admin`.
- It runs in the browser on sample data (`localStorage`, key `quizate-demo-v1`); no server, no real personal data.
  Every screen carries the "Sample version" chip. Opponents are sample players; real 1v1 needs the match server.
- Game modes: ranked 1v1 (counts for monthly points), practice vs bot (free, unranked), speed round (unranked).
- **Game rules live in `packages/game`** (pure TypeScript, tests named after BR IDs). The demo uses them now and the
  API must use the same package later, so rules are written once.
- Wording: the UI never says "demo" or "test"; it says "Sample version" (نسخة تجريبية). Cash prizes appear only in
  the admin console, locked, as "planned".

- **Updated to BRD v1.1 (2026-10-30):**
  - Sign-up: sample Nafath (ID → number match → verified date of birth; IDs ending in 9 show the under-18 refusal),
    mobile + code `000000`, display name, IBAN with mod-97 check and simulated ownership verification (FR-01, FR-04;
    `identity.iban_required_at` editable in admin), consents. Signing out keeps the account on the device; the
    Sign in tab restores it (mobile + code, or Nafath ID).
  - Admin: one click into the console as super admin; other roles optional (production needs password + 2FA).
  - Urdu (FR-29): full UI dictionary `src/i18n/ur.ts` (draft, needs a native reviewer before go-live), Nastaliq font;
    questions show in Arabic with an "awaiting Urdu review" note until a reviewed Urdu text exists.
  - Engagement (FR-30): rules in `packages/game/src/engagement.ts` (XP, levels, ladder, streak + shields, daily
    claim, day seed); web helpers in `apps/web/src/lib/engagement.ts` (missions, badges, cosmetics, ladder road).
    Home: level/XP/coins/streak, daily claim, Mirror Challenge, missions, question of the day. `/play/ladder` is the
    road with rewards per division; `/play/mirror` the daily challenge. Elite = top 100 among players who reached
    the highest points tier (our reading; a 41-player sample would otherwise make everyone elite).
  - Partner gifts appear on the road locked: REGULATORY.md treats vouchers and products as prizes under the
    commercial-competition rules, so they wait for partner campaigns and legal approval. Coins and cosmetics work.
  - Image questions (`image` key, drawings in `src/data/images.tsx`): flags, and logo questions for fictional
    sample sponsors (`src/data/sponsors.ts`) that show the sponsor's message after the reveal. Real brands only with
    the brand's approval and its own uploaded logo.

## Progress

- [x] Prompt 1 — monorepo scaffold and local infrastructure (branch `prompt-01-scaffold`)
- [x] Web demo — `packages/game` and `apps/web` (branch `demo-web`)
