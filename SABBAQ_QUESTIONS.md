# Sabbaq change request v3 — questions for the owner

## Answered (owner decisions, 15 Nov 2026)

- **Cash prizes vs architecture rule 5:** keep `prizes.enabled=false` until legal approval. Applied.
- **Identity for payouts:** an admin's ID + IBAN-name check sets `id_verified`; with 18+ that makes the player cash
  eligible. Applied.
- **Who enters the payout queue:** built at month close from the top 10 with ≥ 60 matches whose date of birth says
  18+, status `id_check_pending`; a failed check or under-18 ID passes the place to the next eligible player and is
  logged. Applied.
- **Same-pair limit vs collusion rule:** BR-07 (1 match per pair per 24 h) stays; the alert is ≥ 3 matches within
  7 days with the same winner every time. Applied.
- **"One-sided result pattern":** the same winner every time. Applied.
- **Minimum age vs the BRD:** 13+, guardian consent for 13–17, cash only for ID-verified 18+, in-kind youth award.
  CLAUDE.md and docs/BRD.md updated.
- **Colour contrast:** `action` #E7472E only for large bold labels (≥ 18.66px bold); new `action-strong` #C93A22 for
  buttons with smaller white text. Applied.
- **Friend matches:** count for no rating, qualification or prizes. Applied.
- **Youth award:** top 3 youth (13–17) per month, qualifying at 30 completed matches (adults 60); in-kind values
  entered by an admin per month, no cash fields. Applied.
- **Ghost matches:** no rating, qualification or prizes while ghost answers are generated; flag
  `ghost_counts_for_rating` (default false) for real replays. Applied.
- **Content:** the 30 new sample questions are `needs_review` until approved; Urdu behind `locale_ur` (default
  false); MVP languages Arabic and English. Applied.
- **Sponsor price:** billable view = shown ≥ 3 s; answers and % correct are quality metrics only; price per 1,000 set
  per campaign in admin, default SAR 40; funding = billable views × campaign price. Applied.

## Still open

1. **Legal review of youth data and consent wording.** Minors' data under PDPL and the guardian consent wording need
   legal review before launch. Owner: the association's legal adviser.
