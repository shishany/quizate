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

## Still open

1. **Youth award.** How many youth players get the badge and award (default 3)? Do they also need 60 matches?
2. **Ghost matches and monthly points.** Ghost matches count for rating, not qualification. Should they also earn
   monthly points (they do now)? And are monthly points still needed now that the board ranks by rating?
3. **Content.** The new Literature, Sport and History sample questions and the Urdu strings need a reviewer.
4. **Sponsor price.** The sample uses SAR 25 per 1,000 views and a 300,000-view quota per campaign. Real prices and
   quotas are per contract; confirm whether funding counts views or only answered views.
5. **Youth play, legal.** Minors' data under PDPL and the guardian consent wording still need legal review before
   launch.
