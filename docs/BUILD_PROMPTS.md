# Build prompts

Source: "Quiz & Rewards Platform — Claude Code Build Prompts" (owner, 2026-10-30), converted to text. The CLAUDE.md block in it now lives in the repo root as CLAUDE.md.

```text
Quiz & Rewards Platform — Claude Code Build Prompts

Oct 30, 2026 · @Moneer Shishani

Fifteen prompts take Claude Code from an empty repository to a deployable MVP of the platform, run in order, one per session. Each one cites the BRD requirement IDs it delivers and ends with acceptance checks. Cash prizes are built behind a feature flag that stays off, as the Regulatory Dossier requires. The prompts are in English, which works best for coding agents; all player-facing text is Arabic-first.

How to run the build

Run one prompt per Claude Code session, in order, on a branch per prompt. Review and merge before starting the next one. The agent works best when the requirements live inside the repo, so put them there first.

1.  Create an empty Git repository named quiz-platform and open Claude Code in it.

2.  Export the BRD (English tab) and the Regulatory Dossier as Markdown, and save them as docs/BRD.md and docs/REGULATORY.md.

3.  Save the CLAUDE.md block below as CLAUDE.md in the repo root. Claude Code reads it at the start of every session.

4.  Paste Prompt 1. When the agent finishes, run the review prompt at the end of this doc, fix what it finds, commit, and merge.

5.  Repeat for Prompts 2–15. Prompts 11 and 12 (admin portal and Flutter app) can run in parallel sessions once Prompt 10 is merged.

Ground rules for every session:

-   Ask the agent to show its plan before writing code on Prompts 6, 7 and 10 — these hold the scoring and money logic.

-   Never let the agent turn on the prizes.enabled flag or remove its guard. That is a business decision after Gate G1.

-   Keep secrets out of the repo; use .env.example with placeholders.

-   If a prompt is too large for one session, tell the agent: "Stop at a clean commit point, list what remains, and I will continue in a new session."

  ---------------------------------------------------------------------------------------------------------
  #     Prompt                                       Main BRD IDs                            Est. effort
  ----- -------------------------------------------- --------------------------------------- --------------
  1     Monorepo scaffold and local infrastructure   NFR-05, NFR-11                          1 session

  2     Data model and migrations                    all                                     1 session

  3     Identity, consent and roles                  FR-01–FR-03, FR-25                      1–2 sessions

  4     Question bank and review workflow            FR-12–FR-14, BR-13                      1 session

  5     Matchmaking with proximity                   FR-05, section 4                        1 session

  6     Real-time match engine and scoring           FR-06–FR-09, BR-01–BR-03, BR-11–BR-12   2 sessions

  7     Rating, monthly ranking, month close         FR-10–FR-11, BR-04–BR-10, BR-16–BR-18   2 sessions

  8     Fraud and risk engine                        FR-26, fair-play signals                1 session

  9     Sponsors and ads                             FR-16–FR-19, BR-14                      1 session

  10    Prize module behind a feature flag           FR-04, FR-20–FR-22, FR-27, BR-15        2 sessions

  11    Admin and sponsor web portal                 FR-25–FR-28                             2–3 sessions

  12    Flutter player app                           FR-01–FR-10, FR-24                      3–4 sessions

  13    Notifications, analytics, observability      FR-24, NFR-11                           1 session

  14    Security hardening and load testing          NFR-01–NFR-09                           1–2 sessions

  15    Infrastructure as code and deployment        NFR-03–NFR-05                           1–2 sessions
  ---------------------------------------------------------------------------------------------------------

CLAUDE.md — project context file

Save this as CLAUDE.md in the repo root before Prompt 1. Update it whenever a decision changes.

# Quiz & Rewards Platform
Free, Arabic-first, 1v1 trivia game for Saudi Arabia. Two players are matched (nearest first,
then nationwide), answer the same 10 questions under a server timer, and earn points. A monthly
leaderboard ranks qualified players. Revenue: sponsored questions/campaigns, ads, corporate SaaS.
Cash prizes (top 10, SAR 55,000/month by default) are BUILT but DISABLED behind a feature flag
until legal clearance. Source of truth: docs/BRD.md and docs/REGULATORY.md. Cite BR-/FR-/NFR-
IDs in commits, PR descriptions and tests.
## Stack
- Monorepo: pnpm workspaces + Turborepo
- apps/api: NestJS (TypeScript strict), modular monolith, REST + WebSocket (socket.io)
- apps/admin: Next.js (App Router), Tailwind, RTL-first, admin + sponsor portals
- apps/mobile: Flutter (stable), Riverpod, go_router, Arabic/English, RTL default
- packages/shared: shared TS types, zod schemas, error codes
- PostgreSQL 16 + PostGIS; Prisma for schema/migrations, raw SQL for geo queries
- Redis 7: matchmaking queues, sessions, leaderboards (sorted sets), rate limits, BullMQ jobs
- Object storage: S3-compatible (MinIO locally)
- Tests: Jest (api), Vitest + Playwright (admin), flutter_test; k6 for load
- Local: docker compose. Deploy: containers, Saudi cloud region, Terraform (provider-neutral)
## Architecture rules (do not break)
1. The server is authoritative for timing, answers, scoring, ratings, eligibility and prizes.
Never trust client-sent scores or timestamps.
2. Score, points and prize records are append-only ledgers. Corrections are new entries
with reason, actor and approver. No UPDATE/DELETE on ledger tables.
3. All writes that move points or money are idempotent (idempotency key) and transactional.
4. Every business default in BRD sections 3-4 is configuration (config table + cache), not a
constant in code. Changes are audited.
5. Feature flag `prizes.enabled` defaults to false in every environment. Prize endpoints must
refuse to activate a campaign without an attached legal approval record. Never change this.
6. No in-app wallet, stored value, purchasable points, paid attempts or paid entry. Points have
no cash value.
7. Personal data stays in the Saudi region. Location is used only for an active queue ticket,
rounded to ~1 km, and deleted when the match starts. Opponents see city + distance band only.
8. Sponsors only ever see aggregated data. No personal data in sponsor reports or exports.
9. Modules talk through service interfaces or domain events, never by reaching into another
module's tables.
10. External providers (SMS/OTP, KYC, push, ads, payouts) sit behind interfaces with a fake
implementation for local and test.
## API modules (apps/api/src/modules)
identity, consent, content, matchmaking, match, rating, leaderboard, fraud, sponsor, ads,
prize, config, audit, notification, analytics, admin
## Conventions
- Arabic is the default locale; every user-facing string goes through i18n (ar, en).
- Errors: typed error codes from packages/shared; never leak stack traces.
- Time: store UTC; month boundaries computed in Asia/Riyadh.
- Money: integer halalas (SAR x 100); never floats.
- Migrations: one per change, reversible, with seed data for local only.
- Tests: unit tests for all business rules; integration tests against docker Postgres/Redis;
every BR-xx has at least one test named after it.
- Commits: Conventional Commits, referencing BR/FR IDs.
## Definition of done
Lint + typecheck + tests pass; new config keys documented in docs/CONFIG.md; API changes in
OpenAPI; audit log written for every admin action; no TODOs in money or scoring paths.
## Commands
pnpm i | pnpm dev | pnpm test | pnpm lint | docker compose up -d | pnpm db:migrate | pnpm db:seed

Prompts 1–4: foundation

Prompt 1 — Monorepo scaffold and local infrastructure

Read CLAUDE.md, docs/BRD.md and docs/REGULATORY.md fully before doing anything.
Goal: create the monorepo skeleton so every later prompt has a working base.
Build:
1. pnpm workspace + Turborepo with apps/api (NestJS), apps/admin (Next.js App Router,
Tailwind, RTL default), apps/mobile (Flutter, created with flutter create, org
com.algonova.quiz), packages/shared (TS types, zod, error codes).
2. docker-compose.yml: postgis/postgis:16, redis:7, minio, mailpit. Health checks.
3. apps/api: config module (env validation with zod), health endpoint, structured JSON
logging with request IDs, global error filter using shared error codes, OpenAPI at
/docs, i18n (ar default, en).
4. Empty module folders for every module listed in CLAUDE.md, each with a README of its
responsibility and BRD IDs.
5. Tooling: ESLint + Prettier, TypeScript strict, Husky + lint-staged, commitlint
(Conventional Commits), Jest setup with a test DB helper.
6. GitHub Actions CI: install, lint, typecheck, unit tests, API integration tests with
service containers, flutter analyze + flutter test.
7. .env.example for every app; docs/CONFIG.md and docs/ARCHITECTURE.md (one-page summary
of the rules in CLAUDE.md, with a module diagram in Mermaid).
Acceptance:
- docker compose up -d && pnpm i && pnpm dev starts api, admin; flutter run works.
- GET /health returns db, redis and minio status.
- CI passes on a clean clone.
Do not build any business features yet. Show me the folder tree when done.

Prompt 2 — Data model and migrations

Read CLAUDE.md and docs/BRD.md (sections 2-6).
Goal: design the complete Prisma schema for the MVP and create migrations. Before writing
it, show me an entity list with relations and the ledger tables, and wait for my OK.
Entities (minimum): User, Device, PhoneVerification, Consent (type, version, granted_at,
revoked_at), Role/UserRole, AdminUser (MFA secret), City/Region, Category, Question,
QuestionVersion (ar/en text, 4 options, correct index, difficulty, source ref, expiry,
sponsor_campaign_id nullable), QuestionReview, QuestionReport, QueueTicket, Match,
MatchPlayer, MatchQuestion, Answer (server_received_at, latency_ms, is_correct),
RatingHistory, MonthlyScoreLedger (append-only), MonthlyStanding (materialised),
LeaderboardSnapshot, FraudSignal, FraudCase, Appeal, Sponsor, SponsorUser, Campaign,
CampaignQuestion, CampaignReport, AdPlacementConfig, ConfigEntry + ConfigChange (audited),
FeatureFlag, PrizeCampaign, LegalApproval, PrizeRankRule, PrizeWinner, KycRecord,
PayoutBatch, PayoutItem, PrizeLedger (append-only), AuditLog, Notification, SupportTicket.
Rules:
- Ledger tables: no update/delete. Enforce with a Postgres trigger that raises on
UPDATE/DELETE, and a test that proves it.
- Money in integer halalas. Timestamps UTC (timestamptz).
- Location: store only city_id and a short-lived queue_ticket.geo (geography(Point)),
with a job that nulls geo once the ticket is closed. Add a PostGIS GIST index via raw
SQL migration.
- Seed: 10 cities, 8 categories, 200 sample Arabic questions with English translations,
1 super admin, config defaults for every value in BRD sections 3-4, feature flag
prizes.enabled=false.
Acceptance: pnpm db:migrate && pnpm db:seed run clean; ERD exported to docs/ERD.md
(Mermaid); trigger test passes.

Prompt 3 — Identity, consent and roles

Read CLAUDE.md and BRD FR-01, FR-02, FR-03, FR-25, BR-15, NFR-09.
Build in apps/api:
1. Player auth: Saudi mobile (+966) + OTP. OtpProvider interface with a fake provider
(logs code) and a stub for a real SMS gateway. Rate limits: 3 OTP/10 min per number,
10/hour per IP. JWT access (15 min) + rotating refresh tokens bound to device.
2. Registration: display name (moderated against a banned-words list, ar+en), date of
birth. Under 13 blocked. Under 18 flagged prize_eligible=false.
3. Consent service: record every consent with document version; endpoints to view and
revoke; location consent separate; marketing opt-in separate.
4. Account deletion: request -> 30-day job that anonymises personal data while keeping
ledger integrity (replace PII with tombstone id). Data export endpoint (JSON).
5. Admin auth: email + password (argon2) + mandatory TOTP MFA. RBAC roles from BRD
section 2: super_admin, content_editor, content_reviewer, sponsor_manager,
fraud_analyst, prize_officer, finance_approver, support_agent; sponsor_user for the
sponsor portal. Guard decorators and a permission matrix in docs/RBAC.md.
6. AuditLog interceptor: every admin mutation writes actor, action, entity, before/after
diff, reason, IP.
Acceptance: tests for OTP limits, age gating, consent versioning, deletion anonymisation,
MFA enforcement, and that prize_officer and finance_approver cannot be the same user on
the same batch (prepare the check now; prize module comes later).

Prompt 4 — Question bank and review workflow

Read CLAUDE.md and BRD FR-12 to FR-15, BR-13, BR-14.
Build the content module:
1. Question lifecycle: draft -> in_review -> published -> retired. Editing a published
question creates a new QuestionVersion; matches always reference the exact version.
2. Two-person rule: the reviewer cannot be the author. Review checklist stored with the
review: factual accuracy, source cited, Arabic language quality, Sharia/content
policy, no sponsor bias.
3. Selection service: getQuestionSet(playerA, playerB, categoryHint) returns 10
published, non-expired questions with balanced difficulty (configurable mix, default
3 easy / 4 medium / 3 hard), none seen by either player in the last 90 days (BR-13),
and at most 2 sponsored questions (BR-14) from active campaigns.
4. Player reports and disputes: report reasons, dispute queue, decision: keep or void.
Voiding emits a domain event QuestionVoided {questionVersionId} that the ranking
module will consume later to re-score affected matches.
5. CSV bulk import with validation report (no auto-publish).
6. Admin REST endpoints with RBAC; OpenAPI documented.
Acceptance: tests for the 90-day exclusion, max-2-sponsored rule, difficulty mix, two-person
review, and version pinning. Selection must run under 50 ms with 20,000 questions (add a
benchmark test with seeded data).

Prompts 5–8: the game core

Prompt 5 — Matchmaking with proximity

Read CLAUDE.md, BRD section 4 and FR-05, BR-06, BR-07.
Build the matchmaking module:
1. POST /match/queue with optional {lat, lng} (only if location consent is active) and
mode=ranked|practice. Round coordinates to ~1 km before storing. Create QueueTicket in
Postgres (geo) and Redis (fast lookup). One open ticket per player.
2. Matcher worker (runs every 500 ms, horizontally safe with Redis locks): widen search by
wait time using config keys:
0-10 s: <=10 km and rating +-150; 10-20 s: <=50 km and +-250; 20-30 s: same city;
>30 s: nationwide; >60 s: offer practice vs asynchronous opponent.
Use PostGIS ST_DWithin on geography for radius steps.
3. Eligibility before pairing: daily ranked limit (BR-06), same-pair limits (BR-07: once
per 24 h, 4 per month), both players not suspended, not same device fingerprint.
4. On pair: reserve both tickets atomically, null the geo, emit MatchProposed to both via
WebSocket; both must accept within 10 s or the ticket requeues.
5. Opponent info returned: display name, avatar, city, distance band (<10 km, 10-50 km,
same city, Saudi Arabia). Never coordinates or exact distance.
6. Cancel endpoint; ticket TTL 120 s.
Acceptance: integration tests simulating 500 queued players across 5 cities verify the
widening steps, pair limits and that no coordinates leave the server. Report median and
P95 simulated wait time.

Prompt 6 — Real-time match engine and scoring

Read CLAUDE.md and BRD FR-06 to FR-09, BR-01 to BR-03, BR-11, BR-12, NFR-01, NFR-08.
First show me a sequence diagram (Mermaid) of the match lifecycle and the WebSocket event
contract, and wait for my OK before coding.
Build the match module (socket.io namespace /match, JWT auth on connect, Redis adapter so
it scales across instances):
1. Match start: fetch the question set (content module), persist Match + MatchQuestion
pinned to question versions, emit match.start with a server timestamp.
2. Per question: emit question.show {index, text, options, deadline} to both players at
the same server time; never send the correct answer before both answered or the
deadline passed. Default 15 s per question (config).
3. answer.submit {matchId, index, option, idempotencyKey}: server records
server_received_at and latency; ignore late or duplicate answers; respond with
ack only (no correctness) until the question closes; then emit question.result.
4. Scoring BR-01: 10 per correct, max 100. Speed is stored for tie-breaks only (BR-02).
Outcome BR-03: higher score wins, equal = draw.
5. Disconnects BR-11: 20 s grace (config); reconnect resumes at current question with
remaining time; beyond grace = forfeit, opponent wins and is scored on answered
questions. BR-12: 3 abandons in 24 h blocks ranked play for 24 h.
6. Match end: in one DB transaction write final MatchPlayer scores, emit domain event
MatchCompleted {matchId, players, scores, outcome, answers summary}. The rating and
leaderboard modules consume it (next prompt) - do not compute monthly points here.
7. Practice mode reuses the engine but MatchCompleted carries ranked=false.
8. Asynchronous practice opponent: replay a recorded human match (anonymised).
Acceptance: tests for timing (answers after deadline rejected), duplicate submissions,
reconnect within/after grace, simultaneous answers, draw, forfeit, abandon block; a
socket load test script for 200 concurrent matches locally with P95 answer ack < 150 ms.

Prompt 7 — Rating, monthly ranking and month close

Read CLAUDE.md and BRD FR-10, FR-11, BR-04 to BR-10, BR-16 to BR-18.
Show me the points formulas as pseudo-code and wait for my OK.
Build rating + leaderboard modules consuming MatchCompleted (idempotent by matchId):
1. Rating BR-09: Elo-type, start 1200, K=24 (config), RatingHistory row per match. Used
only by matchmaking.
2. Monthly points BR-04: winner 100% of own score, loser 25%, draw 50% each (config).
Only the first 60 ranked matches per player per Riyadh calendar month count (BR-05).
Write MonthlyScoreLedger entries (append-only) with matchId, points, reason.
3. Eligibility BR-08: >=20 qualified matches and >=10 distinct opponents; computed and
stored on MonthlyStanding.
4. Ranking BR-10: monthly points desc, then accuracy %, then average server latency asc,
then earliest time final points were reached. Live leaderboard in Redis sorted set
with a composite score encoding; rebuildable from the ledger at any time.
5. Endpoints: monthly, all-time, friends (follow list), my position and gap to rank 10.
Leaderboard updates within 60 s of a match.
6. QuestionVoided consumer: re-score affected matches by writing compensating ledger
entries, never edits.
7. Month close job (BullMQ, cron 00:00:05 Asia/Riyadh on day 1): freeze snapshot,
create FraudCase review queue for the top 50, provisional results after review
(target 3 days), 48 h appeal window, then final snapshot. Job must be re-runnable
without double counting.
8. Admin override BR-18: requires reason + second approver; writes ledger entries.
Acceptance: property-based tests for the cap and tie-breaks; a full simulated month with
2,000 players and 60,000 matches verifying that rebuild-from-ledger equals the live
leaderboard; month-close rerun test.

Prompt 8 — Fraud and risk engine

Read CLAUDE.md, BRD section 3 (fair-play signals) and FR-26.
Build the fraud module:
1. Signals computed on MatchCompleted and on login/device events, each with a weight
(config): inhuman speed (<800 ms answers more than twice in a match), repeated pair
results consistent with collusion (graph of pair win/loss asymmetry), shared device or
IP across accounts, emulator/root/jailbreak flags reported by the app, impossible
location jumps, accuracy far above the player's history on new questions.
2. Risk score per player per month; thresholds: watch, review, auto-hold from prize
ranking (never auto-ban without a human).
3. FraudCase workflow: open -> investigating -> cleared | sanctioned (warning, ranked
suspension, disqualification for the month, ban). Evidence attached. Sanctions write
ledger entries and AuditLog.
4. Appeals: player submits once per case; decision by a different analyst.
5. Endpoints for the admin console (list, filter, case detail with match replays).
Acceptance: seeded scenarios for each signal produce the expected flags; a collusion ring
of 5 accounts is detected in a simulated month; false-positive rate on honest synthetic
players is below 1%.

Prompts 9–12: revenue, prizes and the two front ends

Prompt 9 — Sponsors and ads

Read CLAUDE.md, BRD FR-16 to FR-19, BR-14 and BRD section 6 (sponsored campaign flow).
Build sponsor + ads modules:
1. Sponsor, SponsorUser, Campaign (dates, budget in halalas, targeting by city and
category, status: draft -> internal_review -> sponsor_approval -> scheduled -> live ->
ended), CampaignQuestion (goes through the same content review as any question, plus a
sponsor approval step).
2. Injection: the content selection service includes at most 2 sponsored questions per
match from live campaigns matching the players' city/category, with pacing so a
campaign's impressions spread evenly across its dates. Labelled sponsored=true in the
question payload so the app shows a "Sponsored / برعاية" badge.
3. Reporting: impressions, answers, correct %, completions, by day and city - aggregated
with a minimum group size of 20 (suppress smaller cells). No user IDs ever.
4. Sponsor portal API (read-mostly): campaigns, reports, approve wording, download CSV.
5. Ads config: rewarded (grants practice or cosmetic only - never ranked points) and
interstitial (max 1 per 3 completed matches, never during a match); ad unit IDs per
platform from config; server-side frequency cap counter.
6. Invoice export per campaign (data needed for a ZATCA e-invoice; actual e-invoicing
integration is out of scope - leave an interface).
Acceptance: tests for the 2-question cap, targeting, pacing, small-cell suppression, and
that rewarded ads cannot affect ranked points.

Prompt 10 — Prize module behind a feature flag

Read CLAUDE.md (rules 2, 3, 5, 6), BRD FR-04, FR-20 to FR-22, FR-27, BR-15, BRD section 6
(prize competition flow) and docs/REGULATORY.md sections 1, 3 and 6.
Show me the state machine and data flow and wait for my OK before coding.
Build the prize + config modules. Everything here must be inert while
prizes.enabled=false.
1. FeatureFlag + Config services with audit (who, when, reason). prizes.enabled can only
be changed by super_admin with a second super_admin approval, and the change is logged.
Seed value false. Do not change it.
2. PrizeCampaign: name, organizer legal name + CR number, permit number, rules text
(ar/en, versioned), start/end dates, max duration check (default 60 days from
announcement to delivery - config), winner selection method (ranking | supervised
draw), rank table in halalas (default 10,000 down to 1,000 SAR = 55,000 total),
eligibility rules, sponsor funding source. Cannot move to active without a LegalApproval
record (document upload to object storage, approver, date) and prizes.enabled=true.
3. KYC: KycProvider interface (fake + stub), national ID/Iqama verification, IBAN capture
and name match, age >= 18, Saudi residency, exclusion of organizer staff/relatives
(declaration). KYC must be complete before a player can enter prize ranking.
4. Winners: from the final month snapshot, apply eligibility, fraud holds and
disqualifications, move the next eligible player up (BR-17).
5. Payout: PayoutBatch prepared by prize_officer, approved by a different
finance_approver, export a bank transfer file (CSV in a generic format; bank-specific
adapters later), record proof of payment per item, 7-day delivery SLA timer with
alerts.
6. PrizeLedger (append-only): accrued, approved, paid, forfeited; monthly reconciliation
report.
7. Official rules page endpoint (always available when a campaign is active), including
the statement that Apple and Google are not sponsors.
Acceptance: tests proving that with the flag off no prize endpoint changes state; that a
campaign cannot activate without legal approval; 60-day check; same-user maker/checker
blocked; idempotent payout; ledger reconciliation equals the paid totals.

Prompt 11 — Admin and sponsor web portal

Read CLAUDE.md, BRD section 2 (actors) and FR-12 to FR-28; use the OpenAPI from apps/api.
Build apps/admin (Next.js App Router, Tailwind, shadcn/ui, RTL-first with an EN toggle,
generated typed API client from OpenAPI):
1. Auth with MFA; role-based navigation per docs/RBAC.md.
2. Content: question list with filters, editor (ar/en side by side), review queue with
checklist, reports/disputes, CSV import with validation results.
3. Players: search, profile, matches, rating, consents, suspend (with reason).
4. Leaderboard: live month, snapshots, month-close status, appeals.
5. Fraud console: risk list, case detail with match timeline and answer latencies,
decisions.
6. Sponsors: sponsors, campaigns wizard, approvals, reports with charts.
7. Prizes (visible but locked with a banner while prizes.enabled=false): campaigns, legal
approvals, KYC queue, winners, payout batches maker/checker, ledger.
8. Config and feature flags: every key with description, current value, history; change
requires a reason.
9. Support: tickets with SLA timer.
10. Sponsor portal (separate route group, sponsor_user role): campaigns, reports, wording
approval, CSV download.
Acceptance: Playwright tests for login+MFA, question review, campaign creation, prize
screens locked when flag is off, and RBAC (a content_editor cannot open fraud or prizes).
Lighthouse accessibility >= 90 on main pages.

Prompt 12 — Flutter player app

Read CLAUDE.md and BRD sections 2, 4, 5 and 7; use the OpenAPI and the WebSocket contract
from Prompt 6.
Build apps/mobile (Flutter, Riverpod, go_router, flutter_localizations with ar default
and RTL, en secondary; dio client generated from OpenAPI; socket_io_client):
Screens: splash; onboarding (3 slides); phone + OTP; profile setup (name, DOB, avatar);
consents (terms, privacy, optional location, optional marketing); home (Play ranked,
Practice, my rank, month countdown); matchmaking (searching animation, widening status,
opponent card with city + distance band, accept/decline); match (question, 4 options,
countdown ring synced to server deadline, sponsored badge, opponent progress, reconnect
overlay); result (score, monthly points earned, rating change, rematch, share card);
leaderboard (monthly, all-time, friends; my position and gap to top 10); profile and
history; prize rules page (hidden unless the API reports an active prize campaign);
settings (language, notifications, location toggle, data export, delete account); help
and report a question.
Rules: request location only when tapping Play, never in background; never compute
scores client-side; handle 3G and app backgrounding with resume; secure token storage;
root/jailbreak and emulator detection reported to the API (fraud signal only, do not
block); ads only between matches per server frequency cap; Arabic typography (e.g.
IBM Plex Sans Arabic or Tajawal).
Acceptance: widget tests for match screen timing and RTL layout; integration test of a
full match against the local API with two emulators or a test bot; flutter analyze clean.

Prompts 13–15 and the review prompt

Prompt 13 — Notifications, analytics and observability

Read CLAUDE.md and BRD FR-24, NFR-11 and section 7 (pilot KPIs).
Build:
1. Notification module: PushProvider interface (FCM/APNs stub + fake), templates ar/en,
per-type opt-out, quiet hours (23:00-08:00 Riyadh), events: match found, month close,
provisional/final results, campaign launch, account notices.
2. Analytics: server-side event stream (match_started, match_completed, queue_wait_ms,
abandon, ad_shown, sponsored_question_answered, signup_step) into a Postgres events
table partitioned by month; daily aggregates job; KPI endpoints for the admin dashboard:
completed-match rate, median wait, D1/D7/D30 retention cohorts, matches per active
player per week, fraud-flag rate, sponsor impressions.
3. Observability: OpenTelemetry traces and metrics from api (HTTP, WebSocket, DB, Redis,
jobs), Prometheus metrics endpoint, Grafana dashboards as JSON in infra/grafana,
alert rules: P95 latency, error rate, queue wait > 30 s, month-close job failure,
payout SLA breach, cloud spend placeholder.
Acceptance: KPI endpoints return correct values on a seeded dataset with known answers;
dashboards load in local docker compose (add grafana + prometheus services).

Prompt 14 — Security hardening and load testing

Read CLAUDE.md and BRD NFR-01 to NFR-10.
Do a security pass across the repo and fix what you find:
1. Threat model in docs/THREAT_MODEL.md (STRIDE) covering: account takeover, bots, question
scraping, score tampering, replay, GPS spoofing, collusion, prize fraud, sponsor data
leakage, admin abuse.
2. Controls: helmet/security headers, strict CORS, rate limits per route class, input
validation everywhere (zod/class-validator), parameterised SQL only, secrets via env +
vault interface, PII field encryption for national ID and IBAN (envelope encryption
with a KMS interface), signed WebSocket events, refresh-token reuse detection, admin
session timeout, OWASP MASVS checklist for the Flutter app (certificate pinning, secure
storage, obfuscation).
3. CI security: dependency audit, Semgrep/CodeQL SAST, secret scanning, OWASP ZAP baseline
DAST against the local stack, container image scanning.
4. Privacy: retention jobs per docs/RETENTION.md (write it), data subject request flows
tested end to end, breach-response runbook in docs/RUNBOOKS.md.
5. Load tests (k6) in tests/load: 1,000 concurrent matches (2,000 sockets) for 15 minutes
with targets P95 API < 300 ms, answer ack < 150 ms, zero lost answers; matchmaking
burst of 5,000 queue joins in 60 s; month-close with 100,000 players.
Deliver a findings table (issue, severity, fix, commit) and load-test results.

Prompt 15 — Infrastructure as code and deployment

Read CLAUDE.md (rule 7), BRD NFR-03 to NFR-05 and docs/REGULATORY.md section 5.
Build infra/ with Terraform, provider-neutral modules plus one concrete implementation
for a Saudi cloud region (ask me which provider before writing provider-specific code):
1. Environments: staging and production, separate accounts/projects.
2. Containers for api (autoscaled, min 2) and admin; managed PostgreSQL with PostGIS and
point-in-time recovery; managed Redis; object storage; CDN; WAF; private networking;
secrets manager; KMS keys.
3. CI/CD: build images, run migrations as a gated job, blue/green or rolling deploy,
automatic rollback on failed health checks; mobile builds via Fastlane to TestFlight
and Play internal testing.
4. Backups: daily snapshots kept 35 days, PITR 7 days; restore runbook and a scripted
restore test (RPO 15 min, RTO 4 h targets).
5. Data residency: all storage and backups in the Saudi region; document every external
service that receives personal data (SMS, push, KYC, analytics) in
docs/DATA_FLOWS.md for the PDPL record of processing.
6. Cost tags on every resource and a monthly budget alert.
Acceptance: terraform plan clean for staging; deploy pipeline dry run documented;
docs/OPERATIONS.md covers deploy, rollback, restore, on-call alerts and month-close checks.

Review prompt — run after every prompt

Act as a strict senior reviewer who did not write this code. Review the changes on this
branch against CLAUDE.md, docs/BRD.md and the prompt we just completed.
Check and report in a table (finding, file:line, severity, fix):
1. Every BR/FR/NFR ID the prompt names is implemented and has a test named after it.
2. Any violation of the 10 architecture rules in CLAUDE.md, especially: client-trusted
scores or times, updates/deletes on ledgers, non-idempotent money/points writes,
hard-coded business values, anything that can enable prizes or paid entry, personal
data leaving the Saudi region, coordinates exposed, sponsor access to personal data.
3. Missing tests, flaky timing tests, untested error paths.
4. Security issues (authz gaps, injection, secrets, PII in logs).
5. Arabic/RTL and i18n gaps in user-facing strings.
Then fix every high and medium finding, rerun lint, typecheck and tests, and give me a
short summary of what changed and what you deliberately left.
```
