# Configuration

Two kinds of settings, kept apart on purpose:

1. **Environment variables**: infrastructure only (addresses, credentials, log level). Validated at start-up by
   `apps/api/src/core/env/env.schema.ts`; the API refuses to start and lists every invalid key (never the values).
2. **Business configuration**: every default from BRD sections 3-4 (timers, limits, points, radii, prize table) and
   the feature flags. These live in the audited `config` module (config table + cache, Prompt 10), never in env vars
   or code constants (architecture rule 4).

## API environment (`apps/api/.env.example`)

| Key                               | Default       | Notes                                                              |
| --------------------------------- | ------------- | ------------------------------------------------------------------ |
| `NODE_ENV`                        | `development` | `development`, `test` or `production`                              |
| `PORT`                            | `3001`        | HTTP and, later, WebSocket port                                    |
| `LOG_LEVEL`                       | `info`        | pino level; `silent` in tests                                      |
| `CORS_ORIGINS`                    | empty         | Comma-separated origins allowed to call the API (the admin app)    |
| `DATABASE_URL`                    | required      | `postgresql://…`                                                   |
| `REDIS_URL`                       | required      | `redis://…` or `rediss://…`                                        |
| `S3_ENDPOINT`                     | required      | Any S3-compatible endpoint                                         |
| `S3_REGION`                       | required      | A Saudi region in every deployed environment (architecture rule 7) |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | required      | From the secrets manager when deployed                             |
| `S3_BUCKET`                       | required      | Checked by `/health`                                               |
| `S3_FORCE_PATH_STYLE`             | `false`       | `true` for the local store                                         |

## Admin environment (`apps/admin/.env.example`)

| Key       | Default                 | Notes            |
| --------- | ----------------------- | ---------------- |
| `API_URL` | `http://localhost:3001` | Server-side only |

## Mobile build settings (`apps/mobile/.env.example`)

Passed with `--dart-define`; anything compiled into the app is public, so never secrets.

| Key            | Default                | Notes                                      |
| -------------- | ---------------------- | ------------------------------------------ |
| `API_BASE_URL` | `http://10.0.2.2:3001` | The host machine from the Android emulator |

## Business configuration keys

None yet. Each prompt that adds a key lists it here with its BRD source, default, unit and who may change it.

## Identity configuration

| Key                         | Default | Notes                                                                                                                                                                                                                      |
| --------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `identity.iban_required_at` | `prize` | `signup` \| `ranked` \| `prize`: when Nafath identity and a verified IBAN (same ID number) are required. Owner decision 2026-10-30: a mobile number is enough to play, so the default is `prize` (BRD v1.1 said `signup`). |
| Minimum age to play         | 13      | Sabbaq CR v3: under 13 blocked; 13-17 `age_group=youth`, plays once guardian OTP consent is `granted`; cash needs 18+ and `id_verified` (admin, at payout). |

## Engagement configuration (`packages/game/src/engagement.ts`, FR-30)

| Key                                               | Default                                                        | Source              |
| ------------------------------------------------- | -------------------------------------------------------------- | ------------------- |
| `xp.rankedBase` / `xp.perCorrect` / `xp.winBonus` | 20 / 2 / 15                                                    | ENGAGEMENT.md §3    |
| `xp.practice` / `xp.practiceDailyCap`             | 10 / 200 per day                                               | ENGAGEMENT.md §3    |
| `xp.mirror`                                       | 30, once a day                                                 | ENGAGEMENT.md §3    |
| `xp.bonusDailyCap`                                | 300 per day (missions, daily claim, question of the day, road) | ENGAGEMENT.md §3    |
| `xp.questionOfDay`                                | 5                                                              | sample ("small XP") |
| `levels.perLevel` / `levels.max`                  | 100 × n per level / 100                                        | ENGAGEMENT.md §3    |
| `ladder.tiers`                                    | 0, 300, 800, 1,500, 2,500, 3,500, 4,500; Elite = top 100       | ENGAGEMENT.md §3    |
| `ladder.divisions`                                | 3                                                              | ENGAGEMENT.md §3    |
| `claim` (7 days)                                  | coins 10–60, XP 10–30, frame on day 7                          | sample amounts      |
| `streakShieldsAt`                                 | 7 and 30 days                                                  | ENGAGEMENT.md §4    |
| `missionsPerDay`                                  | 3                                                              | ENGAGEMENT.md §4    |

## Feature flags

| Flag             | Default                      | Who may change it                                                                                       |
| ---------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| `prizes.enabled` | `false` in every environment | super_admin with a second super_admin's approval, after Gate G1 (Prompt 10). Never changed by an agent. |

## Sabbaq change request v3 (2026-11-15)

These defaults replace the BRD values in the rows above where they differ. All live in `packages/game/src/config.ts`
(`DEFAULT_CONFIG`) and `packages/game/src/features.ts` (`FEATURE_FLAGS`).

| Key | Default | Rule |
| --- | --- | --- |
| `questionSeconds` | 10 | Section 5: 10 s per question, server-timed |
| `speedPoints` | base 10, perSecond 0.5, min 5 | Section 5: correct = clamp(round(10 - 0.5 x s), 5, 10); wrong/timeout 0 |
| `rating` | start 1000, K 32 | Section 6: monthly Elo, everyone restarts at 1,000 each Riyadh month |
| `eligibility` | 60 matches, 0 opponents | Section 6: >= 60 completed non-ghost matches; distinct-opponent rule removed |
| `matchmaking` | ±100, +100 every 5 s | Section 7: rating only (`nearby_matching` off) |
| `ghostAfterSeconds` | 20 | Section 7: then a ghost opponent ("منافس مسجّل") |
| `youthAwardSlots` | 3 | Owner decision 15 Nov 2026: top 3 youth (13-17) per month; in-kind award entered by an admin, no amounts |
| `eligibility.youthMinMatches` | 30 | Owner decision 15 Nov 2026: youth award qualification (adults stay at 60) |
| `prizeTableHalalas` | 5,000 … 100 SAR (16,500) | Section 9; pool = min(16,500, sponsor funding), ranks scaled, rounded down to SAR 10 |
| `collusion` | 3 matches, 7 days, same winner every time | Owner decision 15 Nov 2026; BR-07 (1 match per pair per 24 h) stays. Friend matches count for nothing monthly |
| Minimum age | 13 (`AGE` in `age.ts`) | Section 3 |
| Feature flags | see `features.ts` | Section 2 |
