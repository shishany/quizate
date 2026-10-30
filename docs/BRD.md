# Quiz & Rewards Platform — Business Requirements Document

Version 1.0 · 30 Oct 2026 · AlgoNova Technologies

This BRD turns the owner's concept — free 1v1 location-matched trivia, ten questions per match, a monthly top-10 leaderboard paying SAR 55,000 — into buildable, testable requirements. Cash prizes are designed in but switched off until legal clearance (see docs/REGULATORY.md).

## 1. Scope and decisions built in

The MVP is a secure, Arabic-first 1v1 trivia game with sponsors and a monthly leaderboard. The cash-prize engine is built but stays off in production until Gate G1 (written legal classification) is passed.

| Area      | In MVP                                                                                         | Later / conditional                                   |
| --------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Platforms | iOS + Android app (Flutter); web admin & sponsor portal                                        | Web player app                                        |
| Market    | Saudi Arabia, Arabic first, English second                                                     | GCC / Arab region, country by country                 |
| Game      | 1v1, 10 questions, synchronous, location-preferred matching with nationwide fallback           | Tournaments, team play, live events                   |
| Ranking   | Skill rating + monthly qualified score + leaderboard                                           | Seasons, divisions, city leaderboards                 |
| Revenue   | Sponsored questions & campaigns (admin-configured), rewarded/interstitial ads, corporate pilot | Sponsor self-service, white-label, SAR 7 subscription |
| Prizes    | Prize campaign set-up, winner verification and payout workflow, **feature-flagged OFF**        | Activation after G1 + app-store clearance             |
| Payments  | None in-app; prize payouts by bank transfer outside the app                                    | Payout provider integration                           |

Decisions this BRD takes as given (owner to confirm in section 8):

- Participation is free. No purchase, paid attempt or paid advantage affects prize eligibility.
- Cash-prize eligibility at launch is limited to Saudi residents aged 18+ with verified identity and a Saudi IBAN.
- The legal organizer of any prize competition is a Saudi CR holder appointed by the owner, not AlgoNova.
- All scoring, timing and ranking are computed on the server. The client app is never trusted for results.
- Prize rules, amounts and schedule are configuration, not code. SAR 55,000 is a default value, not hard-coded.

## 2. Actors and player journey

| Actor                      | What they do                                             | Access                       |
| -------------------------- | -------------------------------------------------------- | ---------------------------- |
| Player                     | Registers, plays matches, sees ranking, claims prizes    | Mobile app                   |
| Content editor             | Writes, reviews and publishes questions                  | Admin portal                 |
| Content reviewer           | Second-person check of every question before release     | Admin portal                 |
| Sponsor manager (internal) | Sets up sponsor campaigns and sponsored questions        | Admin portal                 |
| Sponsor (external)         | Views own campaign reports; approves branded content     | Sponsor portal (read-mostly) |
| Fraud analyst              | Reviews flags, suspends accounts, handles appeals        | Admin portal                 |
| Prize officer              | Verifies winners, prepares payout batch                  | Admin portal                 |
| Finance approver           | Approves payout batch (cannot be the prize officer)      | Admin portal                 |
| Super admin                | Roles, configuration, feature flags; all actions audited | Admin portal + MFA           |

End-to-end journey (happy path):

1. Player installs the app and registers with a Saudi mobile number (OTP), display name, date of birth and consents.
2. Player optionally grants approximate location while matching; declining keeps nationwide matching.
3. Player taps Play; the system places a queue ticket and finds an eligible opponent (section 4).
4. Both players confirm; the server assigns one fixed set of 10 questions, which may include up to 2 labelled sponsor questions.
5. Each question is shown to both players at the same server time with a 15-second limit (configurable).
6. The server scores each answer on receipt and shows the result screen with points, rating change and ranking.
7. Qualified matches add to the player's monthly score; the leaderboard updates within 60 seconds.
8. At month close, the leaderboard freezes, fraud review runs, and the provisional top 10 is published.
9. When prizes are active: provisional winners already hold verified identity and IBAN (required to enter prize ranking); finance approves; payment is made within 7 days of the result, and results are announced on the same channels as the competition.

## 3. Business rules

The owner's "points out of 100" is kept, but ranking is on capped, quality-weighted results so that the best players win rather than the players who play most. Every value below is a configurable default for the beta to tune.

| ID    | Rule                                                                                                                                                                             | Default            |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| BR-01 | Match score: 10 points per correct answer, 0 for wrong or timeout. Max 100.                                                                                                      | 10 / question      |
| BR-02 | Speed bonus is NOT added to the 100; response time is used only as a tie-break.                                                                                                  | Off                |
| BR-03 | Match outcome: higher score wins; equal score = draw.                                                                                                                            | —                  |
| BR-04 | Monthly points per match: winner earns own match score (0–100); loser earns 25% of own score; draw earns 50% of own score each.                                                  | 100% / 25% / 50%   |
| BR-05 | Only the first N ranked matches per player per month count toward the monthly score (the cap). Later matches still affect skill rating.                                          | N = 60             |
| BR-06 | Daily ranked-match limit per player.                                                                                                                                             | 10 / day           |
| BR-07 | Same-opponent rule: a pair can meet in ranked play at most once per 24 hours and 4 times per month.                                                                              | 1 / 24h, 4 / month |
| BR-08 | Prize-ranking eligibility: at least 20 qualified matches in the month, against at least 10 distinct opponents.                                                                   | 20 / 10            |
| BR-09 | Skill rating (Elo-type, start 1,200) is updated after every completed match and used for matchmaking only.                                                                       | K = 24             |
| BR-10 | Monthly ranking order: monthly points; tie-break 1 = accuracy %; tie-break 2 = average server-measured response time; tie-break 3 = earliest time the final points were reached. | —                  |
| BR-11 | Abandonment: a player who leaves or loses connection for more than 20 s forfeits; the opponent is scored on answered questions and credited a win.                               | 20 s grace         |
| BR-12 | Repeat abandoners (3 in 24 h) are blocked from ranked play for 24 h.                                                                                                             | 3 / 24 h           |
| BR-13 | Question integrity: each question appears at most once per player per 90 days; leaked or disputed questions are voided and both players re-scored.                               | 90 days            |
| BR-14 | Sponsor questions are labelled "Sponsored", count the same as any other question, and never exceed 2 of 10.                                                                      | Max 2              |
| BR-15 | Prize eligibility: Saudi resident, 18+, verified Absher/Nafath-level identity or equivalent KYC, Saudi IBAN in own name, not an employee or relative of the organizer.           | —                  |
| BR-16 | Month close: leaderboard freezes at 23:59:59 Riyadh time on the last day; provisional results after fraud review within 3 days; final after a 48-hour appeal window.             | 3 days + 48 h      |
| BR-17 | Disqualified players are removed and the next eligible player moves up; the reason is recorded in the audit log.                                                                 | —                  |
| BR-18 | Admin overrides of any score or rank require a reason, a second approver and are written to an immutable ledger.                                                                 | 4-eyes             |

Fair-play signals that raise a fraud flag (each scored, combined into a risk score):

- Answers faster than a human could read the question (default < 800 ms) more than twice in a match.
- Win/loss patterns between the same two accounts that look arranged (collusion graph).
- Several accounts on one device, SIM swaps, emulators, rooted/jailbroken devices.
- GPS spoofing or location jumps that are physically impossible.
- Accuracy far above the player's history on new question sets (possible question leak).

## 4. Matchmaking and location

Proximity is a preference, not a condition: a player is never left waiting because nobody is nearby. Google Maps is not used to find players; locations are matched in our own database (PostGIS).

| Step | Wait time | Search rule                                               |
| ---- | --------- | --------------------------------------------------------- |
| 1    | 0–10 s    | Within 10 km, rating within ±150                          |
| 2    | 10–20 s   | Within 50 km, rating within ±250                          |
| 3    | 20–30 s   | Same city/region, any rating band                         |
| 4    | > 30 s    | Nationwide queue                                          |
| 5    | > 60 s    | Offer practice match vs. asynchronous opponent (unranked) |

Location rules:

- Location is requested only when the player taps Play, and used only for that queue ticket.
- Coordinates are rounded to about 1 km before storage and deleted when the match starts (retain city only).
- Opponents see city name and an approximate distance band (e.g. "under 10 km"), never a map pin or exact distance.
- Players can switch off location at any time and still play nationwide.
- A map view, if the owner wants one, shows only the player's own area; Maps API cost is modelled only if this is kept.

## 5. Functional requirements

Priority: **M** = MVP must-have, **C** = MVP but behind a feature flag, **L** = later release.

| ID    | Module        | Requirement                                                                                 | Pri       | Acceptance criterion                                           |
| ----- | ------------- | ------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------- |
| FR-01 | Identity      | Register with Saudi mobile + OTP; display name; date of birth                               | M         | Under-13 blocked; under-18 flagged non-prize-eligible          |
| FR-02 | Identity      | Record each consent (terms, privacy, location, marketing) with version and timestamp        | M         | Consent history exportable per user                            |
| FR-03 | Identity      | Self-service account deletion and data export                                               | M         | Deletion completes in 30 days; audit entry kept                |
| FR-04 | Identity      | Prize KYC: national ID/Iqama verification and IBAN capture                                  | C         | Name on IBAN matches verified identity                         |
| FR-05 | Matchmaking   | Queue, widen search by wait time (section 4), cancel, timeout                               | M         | Median wait < 30 s in beta                                     |
| FR-06 | Gameplay      | Synchronised 10-question match over WebSocket with server timer                             | M         | Both clients receive each question within 300 ms of each other |
| FR-07 | Gameplay      | Reconnect within grace period resumes the match                                             | M         | Drop of < 20 s does not forfeit                                |
| FR-08 | Gameplay      | Result screen: score, monthly points earned, rating change, rematch, share                  | M         | Values match server ledger                                     |
| FR-09 | Gameplay      | Practice / unranked mode, including asynchronous opponent                                   | M         | Practice never affects monthly score                           |
| FR-10 | Leaderboard   | Monthly, all-time and friends views; my position and gap to top 10                          | M         | Updates within 60 s of a match                                 |
| FR-11 | Leaderboard   | Month close job: freeze, fraud review queue, provisional and final results                  | M         | Runs automatically; re-runnable without double counting        |
| FR-12 | Content       | Question bank: category, difficulty, Arabic/English text, answers, source reference, expiry | M         | No question published without reviewer approval                |
| FR-13 | Content       | Two-step workflow: draft → review → published → retired; version history                    | M         | Edits after publishing create a new version                    |
| FR-14 | Content       | Player can report a question; dispute queue; void and re-score                              | M         | Re-score updates monthly points and ranks                      |
| FR-15 | Content       | Bulk import (CSV) and AI-assisted drafting for editors                                      | L         | Drafts always require human review                             |
| FR-16 | Sponsors      | Sponsor record, campaign dates, budget, targeting (city, category), questions, creative     | M         | Campaign cannot go live without internal approval              |
| FR-17 | Sponsors      | Sponsor report: impressions, answers, correct %, completion, city split (aggregated)        | M         | No personal data shown to sponsors                             |
| FR-18 | Sponsors      | Sponsor self-service portal with payment                                                    | L         | —                                                              |
| FR-19 | Ads           | Rewarded video (e.g. extra practice), interstitial between matches, frequency caps          | M         | Never inside a ranked match; max 1 interstitial per 3 matches  |
| FR-20 | Prizes        | Prize campaign: rules text, permit number, dates, pool, rank table, eligibility             | C         | Cannot activate without legal approval record attached         |
| FR-21 | Prizes        | Winner verification, payout batch, 4-eyes approval, bank file, proof of payment             | C         | Officer and approver must be different users                   |
| FR-22 | Prizes        | Prize liability ledger: accrued, approved, paid, forfeited                                  | C         | Reconciles to bank statement monthly                           |
| FR-23 | Corporate     | Private tenant: company branding, private question sets, employee leaderboard               | L (pilot) | Tenant data isolated from public game                          |
| FR-24 | Notifications | Push for match found, month close, results, campaign launches                               | M         | Opt-out per type                                               |
| FR-25 | Admin         | RBAC with the roles in section 2; MFA for all admin users                                   | M         | Every admin action in audit log                                |
| FR-26 | Admin         | Fraud console: risk score, evidence, suspend, appeal decision                               | M         | Decisions recorded with reason                                 |
| FR-27 | Admin         | Feature flags and configuration for every default in sections 3–4                           | M         | Change requires reason; logged                                 |
| FR-28 | Support       | In-app help, ticket form, FAQ, complaint log with SLA timer                                 | M         | First response < 1 business day                                |

## 6. Sponsor, advertising and prize workflows

Sponsored campaign (MVP, run by AlgoNova/owner staff):

1. Sales agrees package, dates and price with the sponsor; contract and PO received.
2. Sponsor manager creates the campaign and up to 20 sponsored questions per month.
3. Content reviewer checks accuracy, Sharia and content-policy compliance, and that no question gives an unfair advantage.
4. Sponsor approves branded wording in the sponsor portal.
5. Campaign goes live on its dates; questions are labelled "Sponsored".
6. Weekly and end-of-campaign aggregated report; invoice issued (ZATCA e-invoice).

Sponsor-funded prize (only when prizes are active): the sponsor pays prize money into a dedicated account before the campaign is announced. The model counts sponsor funding only when it is contractually committed.

Prize competition (feature-flagged; requires Gate G1):

1. Legal organizer obtains the permit or written authority required; permit number is entered in FR-20.
2. Official rules are published in the app, always visible, stating that Apple and Google are not sponsors.
3. Competition runs; the rules say how winners are chosen, the prize table and the dates.
4. Month close (BR-16) produces final ranks.
5. Prize officer prepares the payout batch from verified winners; finance approves.
6. Bank transfers are made within 7 days of the result; proof of payment is attached to each winner record.
7. Results are announced on the same channels used to announce the competition.
8. Unclaimed or forfeited prizes follow the published rules; the ledger records the outcome.

The workflow must also support the narrower model the regulator may require, such as a few licensed campaigns a year of no more than 60 days each with a supervised selection. Campaign length, frequency and winner-selection method are therefore configuration.

## 7. Non-functional requirements and pilot KPIs

| ID     | Area          | Requirement                                                                                            |
| ------ | ------------- | ------------------------------------------------------------------------------------------------------ |
| NFR-01 | Performance   | P95 API latency < 300 ms in Saudi region; answer acknowledgement < 150 ms                              |
| NFR-02 | Scale         | Load-tested at 1,000 concurrent matches (2,000 players) before launch; auto-scaling to 5,000           |
| NFR-03 | Availability  | 99.9% monthly after stabilisation; month-close job has a tested rerun procedure                        |
| NFR-04 | Recovery      | RPO 15 min, RTO 4 h; daily backups kept 35 days; quarterly restore test                                |
| NFR-05 | Hosting       | Personal data hosted in a Saudi cloud region; any transfer abroad documented (PDPL)                    |
| NFR-06 | Security      | TLS 1.2+, encryption at rest, secrets vault, WAF, rate limits, MFA for admins, OWASP MASVS for the app |
| NFR-07 | Assurance     | SAST/DAST in CI; external penetration test before launch and before prize activation                   |
| NFR-08 | Integrity     | Score and prize ledgers append-only; idempotent writes; server-signed match events                     |
| NFR-09 | Privacy       | Data minimisation, retention schedule, consent records, breach response within 72 h to SDAIA           |
| NFR-10 | Usability     | Arabic RTL first; accessible contrast and font scaling; works on 3G with resume                        |
| NFR-11 | Observability | Central logs, metrics and alerts; cloud spend alerts; fraud dashboard                                  |
| NFR-12 | Age rating    | Store and GAMR age rating set before launch; 18+ gate for prize features                               |

Pilot KPIs that decide whether to scale (Gate G2/G3):

| KPI                                | Target in closed beta  | Why it matters                      |
| ---------------------------------- | ---------------------- | ----------------------------------- |
| Completed-match rate               | ≥ 85%                  | Matchmaking and connection quality  |
| Median match wait                  | < 30 s                 | Proximity concept works in practice |
| Day-7 retention                    | ≥ 20%                  | Drives MAU and ad revenue           |
| Matches per active player per week | ≥ 5                    | Inventory for sponsors and ads      |
| Fraud-flagged qualified matches    | < 1% after review      | Ranking can be defended             |
| Paid sponsor pilots                | ≥ 2                    | B2B revenue engine is real          |
| Implied CAC                        | Below model assumption | Marketing budget is sufficient      |

## 8. Open decisions for the owner

These must be closed before requirements freeze; each changes scope, cost or legal route.

- [ ] Accept the scoring and cap rules in BR-01 to BR-08, or give alternative values.
- [ ] Confirm proximity is a preference with nationwide fallback.
- [ ] Name the Saudi legal entity that will organise prize competitions.
- [ ] Confirm whether SAR 55,000 a month is guaranteed even with no sponsor income, and fund a 6-month reserve (SAR 330,000).
- [ ] Accept that prizes stay off until the legal opinion is received, and that the regulator may only permit periodic campaigns rather than a monthly prize.
- [ ] Decide whether non-Saudi residents may play (yes) and win prizes (recommended: no at launch).
- [ ] Name who writes and verifies questions, and who owns question copyright.
- [ ] Name who sells sponsorships and who runs support and moderation.
- [ ] Confirm ownership of app-store accounts, cloud subscription, source code and data.
- [ ] Keep or drop the map view (affects Google Maps cost).
- [ ] Confirm the SAR 7 subscription stays out of the plan until counsel and app stores clear it.

Related deliverables: 36-month financial model (Excel), Regulatory Dossier (docs/REGULATORY.md), Feasibility Study v1.1 (Word).
