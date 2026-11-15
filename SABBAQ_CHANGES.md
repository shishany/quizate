# Sabbaq change request v3 — what was done

Scope note: `apps/api` is still a scaffold (module READMEs only), so every rule was written once in `packages/game`
(pure TypeScript, with tests) and wired into the web sample version (`apps/web`). The API must use the same package
when its modules are built. Flutter, deployment, the repo rename and the subdomain were out of scope.

1. **Rebrand** — done. `PRODUCT` is Sabbaq / سبّاق; new tagline (ar, en, ur); initiative line in the footer; palette
   tokens in `apps/web/src/app/globals.css` (older token names map onto the new ones) and `apps/admin`; favicon
   (`icon.svg`); metadata and theme colour; main buttons use `action`. The admin header reads `PRODUCT`.
2. **Feature flags** — done. `packages/game/src/features.ts`; the player app hides ladder, Mirror Challenge, practice,
   speed round, daily claim and missions (code kept); location matching off.
3. **Age 13+** — done in the web sample. `packages/game/src/age.ts`: under 13 blocked, 13–17 `age_group='youth'` with
   `consent_status='pending'`, guardian mobile + OTP, consent record (time, SHA-256 of the guardian's number); play is
   blocked until `granted`; `cash_eligible = age >= 18 AND id_verified`. Nafath stays optional. Partly: the real OTP
   to the guardian and a later "guardian confirms" link need the server.
4. **Categories** — done. Six categories (`categories.ts`), picked before "ابدأ التحدي"; Mixed = all. Added 30
   sample questions (13 Literature, 10 Sport, 7 History; the earlier count of 29 was wrong). They now start as
   `needs_review` (see below).
5. **Match rules** — done. 10 questions, 10 s, speed points clamp(round(10 − 0.5·s), 5, 10), max 100; tie → lower total
   answer time.
6. **Monthly rating and leaderboard** — done. Monthly Elo from 1,000, K=32, history per match (`monthlyRating`);
   qualification ≥ 60 completed non-ghost matches; the 20-match / 10-opponent rule removed; everyone ranks together
   by monthly rating; prize-zone badge (top 10 qualified cash-eligible) and youth badge (top 3 qualified youth).
7. **Matching** — partly done. Rating-only search ±100 widening by 100 every 5 s; ghost opponent after 20 s labelled
   "منافس مسجّل" (counts for nothing while its answers are generated, see below); invite links. Partly: the sample has no stored matches, so the
   ghost's answers are generated, and a private match from an invite link needs the match server.
8. **Sponsored questions** — done in the web sample. `Sponsor`, `Campaign` (quota, price per 1,000 views), questions'
   `campaignId`; sponsor bar "برعاية {sponsor}" under the question; view/answer events appended once per match;
   admin campaign report by day with CSV; public `/stats` page. Partly: the Postgres events table/migration waits for
   the API; other players' views are sample daily totals.
9. **Prizes and fair play** — done in the web sample. 16,500 table, pool = min(16,500, sponsor funding), ranks scaled
   and rounded down to SAR 10; payout queue (reworked at month close, see owner decisions below), every action in
   the audit log; youth in-kind award (no cash fields); collusion alerts on the fair-play page. `prizes.enabled` stays
   false (architecture rule 5), so nothing is paid; see question 1.

## Owner decisions applied (15 Nov 2026)

1. **Age** — done. CLAUDE.md rule 7 and docs/BRD.md now say: open from 13, guardian consent for 13–17, cash only for
   ID-verified 18+, in-kind youth award. `prizes.enabled` stays false until legal approval.
2. **Payout queue** — done. Built at month close (`payoutQueue`) from the top 10 with ≥ 60 matches whose date of birth
   says 18+, each `id_check_pending`. A passed ID + IBAN-name check sets `id_verified` → cash eligible → can be marked
   paid. A failed check (ID mismatch, IBAN name mismatch, ID shows under 18) or an under-18 date of birth passes the
   place to the next eligible player; both are logged (queue log and audit). Tests in `payouts.test.ts`.
3. **Collusion** — done. BR-07 (1 match per pair per 24 h) kept; alert at ≥ 3 matches between the same pair within
   7 days with the same winner every time. Friend matches (`friend: true`) count for no rating, qualification,
   points or prizes. Tests in `payouts.test.ts`.
4. **Contrast** — done. New token `action-strong` #C93A22 (about 5.1:1 with white) for sm/md primary buttons; `action`
   #E7472E kept for lg buttons, whose labels are now 19px bold (large text, 3:1 needed).

## Owner answers to the open items (15 Nov 2026)

1. **Youth award** — done. Top 3 youth (13–17) per month with ≥ 30 completed matches (`eligibility.youthMinMatches`);
   adults stay at 60. The award is in kind, entered by an admin per month; no cash fields, no amounts in config.
2. **Ghost matches** — done. No rating change, no qualification count, no points or prizes while ghost answers are
   generated. Flag `ghost_counts_for_rating` (default false) with a TODO for when real replays exist.
3. **Content** — done. The 30 new sample questions start as `needs_review` and enter matches only once approved in
   the question-review screen; categories without 10 published questions are disabled in the picker until then
   (Literature, Sport and History in the fresh sample). Urdu is behind flag `locale_ur` (default false); the MVP
   languages are Arabic (default) and English.
4. **Sponsored questions** — done. A billable view = shown on screen ≥ 3 s (time to answer, or the full 10 s on a
   timeout). Answers and % correct are reported as quality metrics only. Price per 1,000 billable views is set per
   campaign in admin (audited), default SAR 40. Prize-pool funding = billable views × campaign price.
5. **Legal review of youth data and consent wording** — open, owner: the association's legal adviser.

Tests: `packages/game` 56 passing; `apps/web` 26 passing; typecheck and lint clean.
