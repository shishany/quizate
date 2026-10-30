# Quizate — project brief

Read this first in every session and keep it current. Update it whenever a decision changes.

"Quizate" is a working name. The product name lives in one constant, `PRODUCT.name` in
`packages/shared/src/product.ts`; never type it anywhere else in code or UI strings.

## Product

Free, Arabic-first, 1v1 trivia game for Saudi Arabia. Two players are matched (nearest first, then nationwide),
answer the same 10 questions under a server timer, and earn points. A monthly leaderboard ranks qualified players.
Revenue: sponsored questions/campaigns, ads, corporate SaaS. Cash prizes (top 10, SAR 55,000/month by default) are
BUILT but DISABLED behind a feature flag until legal clearance.

Source of truth: `docs/BRD.md` and `docs/REGULATORY.md`. Cite BR-/FR-/NFR- IDs in commits, PR descriptions and tests.
**Status:** both documents are still to be added by the owner. Until they are, do not invent requirement text or
business values; anything that needs them is marked `TODO(BRD)`.

The build runs prompt by prompt from `docs/BUILD_PROMPTS.md`, one branch per prompt (`prompt-NN-<topic>`).

## Stack

- Monorepo: pnpm workspaces + Turborepo
- `apps/api`: NestJS (TypeScript strict), modular monolith, REST + WebSocket (socket.io)
- `apps/admin`: Next.js (App Router), Tailwind, RTL-first, admin + sponsor portals
- `apps/mobile`: Flutter (stable), Riverpod, go_router, Arabic/English, RTL default
- `packages/shared`: shared TS types, zod schemas, error codes
- PostgreSQL 16 + PostGIS; Prisma for schema/migrations, raw SQL for geo queries
- Redis 7: matchmaking queues, sessions, leaderboards (sorted sets), rate limits, BullMQ jobs
- Object storage: S3-compatible (RustFS locally; see decisions below)
- Tests: Vitest (api and admin), Playwright (admin), flutter_test; k6 for load
- Local: docker compose. Deploy: containers, Saudi cloud region, Terraform (provider-neutral)

## Architecture rules (do not break)

1. The server is authoritative for timing, answers, scoring, ratings, eligibility and prizes. Never trust
   client-sent scores or timestamps.
2. Score, points and prize records are append-only ledgers. Corrections are new entries with reason, actor and
   approver. No UPDATE/DELETE on ledger tables.
3. All writes that move points or money are idempotent (idempotency key) and transactional.
4. Every business default in BRD sections 3-4 is configuration (config table + cache), not a constant in code.
   Changes are audited.
5. Feature flag `prizes.enabled` defaults to false in every environment. Prize endpoints must refuse to activate a
   campaign without an attached legal approval record. Never change this.
6. No in-app wallet, stored value, purchasable points, paid attempts or paid entry. Points have no cash value.
7. Personal data stays in the Saudi region. Location is used only for an active queue ticket, rounded to ~1 km, and
   deleted when the match starts. Opponents see city + distance band only.
8. Sponsors only ever see aggregated data. No personal data in sponsor reports or exports.
9. Modules talk through service interfaces or domain events, never by reaching into another module's tables.
10. External providers (SMS/OTP, KYC, push, ads, payouts) sit behind interfaces with a fake implementation for local
    and test.

## API modules (`apps/api/src/modules`)

identity, consent, content, matchmaking, match, rating, leaderboard, fraud, sponsor, ads, prize, config, audit,
notification, analytics, admin

## Conventions

- Arabic is the default locale; every user-facing string goes through i18n (ar, en).
- Errors: typed error codes from `packages/shared`; never leak stack traces.
- Time: store UTC; month boundaries computed in Asia/Riyadh.
- Money: integer halalas (SAR x 100); never floats.
- Migrations: one per change, reversible, with seed data for local only.
- Tests: unit tests for all business rules; integration tests against docker Postgres/Redis; every BR-xx has at least
  one test named after it.
- Commits: Conventional Commits, referencing BR/FR IDs.

## Definition of done

Lint + typecheck + tests pass; new config keys documented in `docs/CONFIG.md`; API changes in OpenAPI; audit log
written for every admin action; no TODOs in money or scoring paths.

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
- **Mobile:** strings in `lib/l10n/app_{ar,en}.arb` (Arabic is the template); `appName` mirrors `PRODUCT` by hand
  because Dart cannot import the TS constant.

## Progress

- [x] Prompt 1 — monorepo scaffold and local infrastructure (branch `prompt-01-scaffold`)
