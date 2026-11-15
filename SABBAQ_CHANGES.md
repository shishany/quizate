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
4. **Categories** — done. Six categories (`categories.ts`), picked before "ابدأ التحدي"; Mixed = all. Added 13
   Literature, 9 Sport and 7 History sample questions so each category fills a match (need content review).
5. **Match rules** — done. 10 questions, 10 s, speed points clamp(round(10 − 0.5·s), 5, 10), max 100; tie → lower total
   answer time.
6. **Monthly rating and leaderboard** — done. Monthly Elo from 1,000, K=32, history per match (`monthlyRating`);
   qualification ≥ 60 completed non-ghost matches; the 20-match / 10-opponent rule removed; everyone ranks together
   by monthly rating; prize-zone badge (top 10 qualified cash-eligible) and youth badge (top 3 qualified youth).
7. **Matching** — partly done. Rating-only search ±100 widening by 100 every 5 s; ghost opponent after 20 s labelled
   "منافس مسجّل" (counts for rating, not qualification); invite links. Partly: the sample has no stored matches, so the
   ghost's answers are generated, and a private match from an invite link needs the match server.
8. **Sponsored questions** — done in the web sample. `Sponsor`, `Campaign` (quota, price per 1,000 views), questions'
   `campaignId`; sponsor bar "برعاية {sponsor}" under the question; view/answer events appended once per match;
   admin campaign report by day with CSV; public `/stats` page. Partly: the Postgres events table/migration waits for
   the API; other players' views are sample daily totals.
9. **Prizes and fair play** — done in the web sample. 16,500 table, pool = min(16,500, sponsor funding), ranks scaled
   and rounded down to SAR 10; payout queue with ID and IBAN-name checks before approve/paid, every action in the
   audit log; youth in-kind award (no cash fields); collusion alerts on the fair-play page. `prizes.enabled` stays
   false (architecture rule 5), so nothing is paid; see question 1.

Tests: `packages/game` 51 passing; `apps/web` 26 passing; typecheck, lint and `next build` clean.
