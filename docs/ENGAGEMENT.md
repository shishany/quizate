# Quiz & Rewards Platform — Engagement & Gamification Design

Version 1.0 · 30 Oct 2026 · AlgoNova Technologies · Companion to docs/BRD.md (FR-29, FR-30)

This design wraps the owner's 1v1 trivia game in five engagement loops: progression, a daily habit, clubs (Majlis), team game modes and rewards. Every mode stays knowledge-based, and every reward is earned through play. Nothing a player buys can affect a competition or a prize. **Classic 1v1 is the only mode that feeds the individual monthly cash ranking**; team modes feed club levels and trophies. All numbers below are configurable defaults.

## 1. Policy changes adopted

| Rule                    | Design                                                                                                                                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 18+ only                | Sign-up through Nafath (citizens and Iqama holders). Verified date of birth is read from Nafath; under-18 sign-ups are refused. An IBAN alone does not prove age (minors 15+ can hold bank accounts). |
| Verified IBAN           | Player enters a Saudi IBAN; an IBAN-ownership verification service confirms it belongs to the same national ID / Iqama number.                                                                        |
| When IBAN is required   | Config `identity.iban_required_at` = `signup` (default, owner's choice) \| `ranked` \| `prize`.                                                                                                       |
| Payouts                 | Bank transfer only, from the organizer's account to the verified IBAN. No wallet, no in-app cash-out.                                                                                                 |
| One person, one account | National ID / Iqama number unique per account; duplicates blocked.                                                                                                                                    |
| Languages               | Arabic (default, RTL), English, Urdu (RTL, Nastaliq font). Every question needs a native-reviewed Urdu version before it is served in Urdu.                                                           |

## 2. Borrow / avoid (from card-game apps with clubs and coins)

| Pattern                                   | Use?              | Adaptation                                              |
| ----------------------------------------- | ----------------- | ------------------------------------------------------- |
| Player level with % bar                   | Yes               | XP levels 1–100                                         |
| Club leveling with cycle reset            | Yes               | Majlis clubs, 14-day cycles                             |
| Per-member contribution cap (10,000)      | Yes               | Same, toward club level                                 |
| Separate cap for non-competition XP       | Yes               | Daily bonus-XP cap                                      |
| Top clubs, leaderboards, trophies         | Yes               | National + city boards, trophy cabinet                  |
| Daily claim                               | Yes               | 7-day calendar + streak                                 |
| "Mirror" competitions (same deal for all) | Yes               | Mirror Challenge: same 10 questions for everyone daily  |
| Events tab                                | Yes               | Seasonal events                                         |
| Coin entry-fee competitions               | **No**            | Free daily tickets instead                              |
| Random packs                              | **Free only**     | Free chests with known contents; no paid random rewards |
| Boosters                                  | **Cosmetic only** | No ranked gameplay advantage                            |
| Purchasable premium currency              | **Not at launch** | Earned-only coins                                       |

## 3. Progression

XP sources:

| Source                      | XP                        | Cap              |
| --------------------------- | ------------------------- | ---------------- |
| Ranked match completed      | 20 + 2 per correct answer | none             |
| Ranked win                  | +15                       | —                |
| Practice / team-mode match  | 10                        | 200/day          |
| Daily Mirror Challenge      | 30                        | 1/day            |
| Missions, events, referrals | varies                    | 300/day combined |

Level curve: level n requires 100 × n XP (cumulative), levels 1–100, never reset.

Monthly ranked ladder, derived from BR-04 monthly points (does not change prize eligibility). Three divisions per tier. Soft reset: start each month one tier below last month's finish.

| Tier    | Arabic | Urdu (verify with native reviewer) | Entry monthly points |
| ------- | ------ | ---------------------------------- | -------------------- |
| 1       | مبتدئ  | نوآموز                             | 0                    |
| 2       | قارئ   | قاری                               | 300                  |
| 3       | مثقف   | باشعور                             | 800                  |
| 4       | متمكن  | ماہر                               | 1,500                |
| 5       | خبير   | ماہرِ خاص                          | 2,500                |
| 6       | عالِم  | عالم                               | 3,500                |
| 7       | حكيم   | حکیم                               | 4,500                |
| Top 100 | نخبة   | اشرافیہ                            | rank-based           |

Promotion: frame + title. Month-end tier: season badge.

## 4. Daily habit loop

- Daily claim: 7-day calendar (coins, XP, cosmetic on day 7). Missing a day restarts the calendar, not the streak.
- Streak: consecutive days with ≥1 completed match or Mirror Challenge. Streak shields earned at 7 and 30 days protect one missed day.
- Mirror Challenge (تحدي المرآة): same 10 questions for all players per Riyadh day, async; daily board ranked by score then time; share card with a correct/wrong grid (no answers revealed).
- Daily missions: 3 a day from a pool; weekly challenge: 1 bigger goal with a cosmetic.
- Question of the day: one question on home, instant feedback, small XP.
- None of these affect monthly ranked points.

## 5. Majlis clubs, City League, Club Wars (Phase 2–3)

| Element          | Default                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| Size / roles     | Up to 30 members; leader + 2 deputies; open / request / invite                                    |
| Identity         | Name, emblem, home city, language; names moderated                                                |
| Club XP          | Members' ranked and team-mode XP during a 14-day cycle                                            |
| Contribution cap | 10,000 XP per member per cycle toward club level                                                  |
| Club levels      | 1–10 per cycle; each level opens a chest with known contents for members who contributed ≥ 500 XP |
| Leaderboards     | National and per city                                                                             |
| Joining cooldown | 7 days before a new member's XP counts                                                            |
| Chat             | Text + quick phrases in ar/en/ur; profanity filter; report/mute                                   |

City League (كأس المدن): every player's monthly points also count for their home city; monthly city table; "Neighbourhood Champion" badge for the top player in each self-chosen home district (never from tracked location).

Club Wars (Phase 3): weekend pairing of clubs of similar level; 10 members per side play 1v1 against the other club; total points win. Rewards: trophies and XP, no cash.

## 6. Game modes

| Mode                          | How it plays                                                                                                                                | Players      | Feeds                                                  | Phase |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------ | ----- |
| Classic 1v1                   | Owner's core: 10 questions, nearest opponent first                                                                                          | 1v1          | Monthly ranking, XP, club XP                           | MVP   |
| Mirror Challenge              | Same 10 questions for all daily, async                                                                                                      | Solo         | Daily board, XP                                        | MVP   |
| Duo Trivia                    | 2v2; either teammate answers; quick-emoji chat                                                                                              | 2v2          | XP, club XP                                            | 2     |
| Letter Hive (خلية الحروف)     | 5×5 hex board of letters; answer a question whose answer starts with the cell's letter to capture it; first team to link its two sides wins | 2–5 per team | XP, club XP                                            | 2     |
| Knowledge Grid (شبكة المعرفة) | 3×3 grid, category per row and column; fill each cell with an answer fitting both; rarer answers score more; also a daily solo grid         | 1–4          | XP, club XP                                            | 2     |
| Word Builder (كلمات)          | Team scrabble with Arabic (or Urdu) letter tiles; theme bonus                                                                               | 2v2          | XP, club XP                                            | 3     |
| Club Crossword                | Weekly cultural crossword solved by the club                                                                                                | Club         | Club XP, trophy                                        | 3     |
| Map Hunt                      | Locate a Saudi landmark on a map; closer = more points                                                                                      | 1–5          | XP, City League                                        | 3     |
| Co-op Sudoku                  | Number sudoku split between two players (each sees half the givens)                                                                         | 2            | XP only                                                | 3     |
| Majlis Night                  | Weekly scheduled live quiz, elimination, sponsor-branded                                                                                    | All          | XP, trophies; cash only in a licensed sponsor campaign | 3     |

Build notes: Letter Hive and Knowledge Grid reuse the question bank with extra tags (answer first letter per language, category facets). Word Builder needs an Arabic dictionary with morphology support. Map Hunt uses MapLibre + OpenStreetMap tiles, not Google Maps. Letter Hive and Word Builder run per language with their own letter sets.

## 7. Rewards, team fair play, rollout

| Reward          | Earned by                          | Used for                                  | Hard rule                                                           |
| --------------- | ---------------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| XP              | Playing                            | Levels, club levels                       | No value conversion                                                 |
| Coins           | Claim, missions, chests, level-ups | Cosmetics, extra practice, streak shields | Earned only; never bought, transferred, cashed or used as entry fee |
| Tickets         | 3 free/day                         | Team-room entry                           | Free only                                                           |
| Cosmetics       | Ladder, levels, events, chests     | Avatars, frames, titles, emblems, themes  | No gameplay advantage                                               |
| Trophies/badges | Mastery, seasons, wars, league     | Profile cabinet                           | —                                                                   |
| Sponsor perks   | Completing a sponsor challenge     | Guaranteed discount code                  | Never random                                                        |
| Cash prizes     | Classic 1v1 monthly top 10         | Bank transfer to verified IBAN            | Only after Gate G1                                                  |

Team fair play: BR-07 pair limits apply across clubs; contribution caps + 7-day cooldown; no gifting/trading; team rooms matched by average rating with reduced XP for large gaps; chat filtered in three languages.

| Phase   | Scope                                                                                                   | Indicative effort |
| ------- | ------------------------------------------------------------------------------------------------------- | ----------------- |
| MVP     | Nafath, verified IBAN, Urdu, XP levels, ladder, daily claim, streak, Mirror Challenge, missions, badges | +4–6 weeks        |
| Phase 2 | Clubs, club levels/chests, City League, Duo Trivia, Letter Hive, Knowledge Grid                         | 10–12 weeks       |
| Phase 3 | Club Wars, Word Builder, Club Crossword, Map Hunt, Co-op Sudoku, Majlis Night                           | 12–16 weeks       |

KPIs: D1/D7/D30 retention 40%/20%/10%; ≥ 3 active days per week; ≥ 35% of players in a club after Phase 2; Mirror share rate ≥ 5%; measure Nafath + IBAN sign-up completion and switch `iban_required_at` to `ranked` if below 60%.

Open for counsel: Q-12 — do earned-only coins and free team-room tickets raise any competition question; Q-06 — any future cosmetic purchase.
