# Web demo (`apps/web`)

A browser version of the player app and the admin console, built to present the product before the full build. It
runs entirely in the browser on sample data and is hosted on Vercel as static pages.

## Updated to BRD v1.1

Sign-up with a sample Nafath identity and a verified IBAN, a Sign in tab for returning players, Urdu as a third
language, the engagement layer (levels, XP, coins, streaks, daily claim, missions, question of the day, badges,
cosmetics), the Mirror Challenge, the ladder road with rewards, image questions (flags and sponsor logos) and a
one-click admin entry. Details in CLAUDE.md ("Web demo"). Some sections below describe the first version.

## What it shows

**Player** (`/play`, phone-first, Arabic RTL by default, English on the toggle)

- Sign-up with a Saudi mobile number and a one-time code (shown on screen; no SMS), display name moderation, date of
  birth (under 13 blocked, under 18 not prize-eligible), city and versioned consents (FR-01, FR-02).
- **Ranked 1v1:** the matchmaking widening steps of BRD section 4 with an optional, rounded, single-use location;
  opponent card with city and distance band only; 10-second accept window; a 10-question match with the 15-second
  server timer; result with monthly points, rating change, review, share, follow and a friendly rematch (FR-05 to
  FR-08). Daily limit (BR-06), same-pair limits (BR-07), monthly cap (BR-05), abandon rules (BR-11, BR-12).
- **Practice vs bot:** three bot levels; free, unlimited, never touches points or rating (FR-09).
- **Speed round:** as many correct answers as possible in 60 seconds (configurable); unranked; personal best.
- Leaderboard (this month, all time, following) with the BR-10 order, eligibility (BR-08) and the gap to the top 10
  (FR-10); match history; account with consents, data export and deletion (FR-03).

**Admin** (`/admin`, sign in by choosing a role; the two-factor code is shown on screen)

- Navigation per role (FR-25). Overview with live counts and the BRD section 7 KPIs (sample figures, labelled).
- Question bank: filters, bilingual detail, version history, two-person review with the checklist, retire and void
  (FR-12 to FR-14). New drafts.
- Ranking and month close: full table with the tie-break columns, prize rank for eligible players only (BR-17), and
  the BR-16 schedule.
- Fair play: sample flags plus any raised by your own matches; decisions need a reason; no automatic bans (FR-26).
- Sponsors: one sample campaign and its city report with small-cell suppression (FR-16, FR-17).
- Configuration: every BRD default editable by the super admin with a reason, with history (FR-27); `prizes.enabled`
  shown off and locked.
- Prizes: locked; prize table (integer halalas), payout workflow and the official-rules outline from the Regulatory
  Dossier.
- Audit log of every admin action.

## How it differs from the real platform

| Real platform (build prompts)                                   | Web demo                                                                                                                                        |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Server is authoritative for timing, answers and scores (rule 1) | The browser plays the server's part. Same rules code (`packages/game`), but nothing is tamper-proof.                                            |
| Real opponents over WebSocket                                   | Sample players. The matchmaking rules are real; the queue is simulated.                                                                         |
| PostgreSQL, ledgers, audit in the database                      | Browser storage (`localStorage`), per visitor; "Reset sample version" restores it.                                                              |
| SMS and TOTP providers                                          | Codes shown on screen.                                                                                                                          |
| Personal data in a Saudi region (rule 7)                        | No real personal data. The sample chip asks visitors not to enter any. Vercel is outside the Kingdom, which is acceptable only for sample data. |

## Decisions taken for the demo

- **BR-13 in unranked modes.** The 90-day no-repeat rule is applied to ranked matches. Practice and the speed round
  may repeat questions, and do not mark questions as seen. Open question for the owner: should practice also count
  toward BR-13 (stronger leak protection, faster bank exhaustion)?
- **Speed round** is a demo mode not in the BRD. It is unranked and has its own config key (`speedRound.seconds`).
- **Monthly points are not rounded** (a loser's 25% of 70 is 17.5): the BRD gives no rounding rule.
- **Sample questions** (100 general-knowledge questions plus 3 sponsored and 3 drafts) were written for the demo,
  leave out religious topics, and are not production content.

## Run locally

```bash
pnpm i && pnpm --filter @quizate/web... build
```

```bash
pnpm --filter @quizate/web dev
```

Open http://localhost:3002. Deployment: `docs/DEPLOY_VERCEL.md`.
