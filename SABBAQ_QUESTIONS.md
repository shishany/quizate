# Sabbaq change request v3 — open questions for the owner

1. **Cash prizes vs architecture rule 5.** The request turns `prizes_cash_18plus` on, but CLAUDE.md says
   `prizes.enabled` stays false until a legal approval record exists ("never change this"). I kept `prizes.enabled`
   false: the payout queue works in the sample, but no campaign can be activated. Confirm the legal approval route.
2. **Identity for payouts.** CLAUDE.md rule 7 requires Nafath plus an IBAN verified to the same ID before the prize
   ranking (BR-15). The request defines `cash_eligible = age >= 18 AND id_verified` (set by an admin at payout). I
   followed the request. Is Nafath/IBAN verification still required, or is the manual check enough?
3. **Who enters the payout queue.** The queue lists the top 10 *cash-eligible* players, but `id_verified` is only set
   *at* payout. A real player therefore can't reach the queue. Should the queue list the top 10 qualified adults, with
   the ID check setting `id_verified`?
4. **Same-pair limit vs collusion rule.** BR-07 allows one match per pair per 24 h, so ≥ 5 matches in 24 h can't happen
   in normal play. Keep BR-07, or relax it now that collusion is detected instead?
5. **"One-sided result pattern".** No threshold was given; I used "one player wins ≥ 80%" (`collusion.oneSidedShare`).
6. **Youth award.** How many youth players get the badge and award (default 3)? Do they also need 60 matches?
7. **Ghost matches and monthly points.** Ghost matches count for rating, not qualification. Should they also earn
   monthly points (they do now)? And are monthly points still needed now that the board ranks by rating?
8. **Minimum age vs the BRD.** BRD v1.1, CLAUDE.md and the prize rules text say 18+. The request says 13+. The docs
   need the owner's update, and youth play needs legal review (minors' data under PDPL, guardian consent wording).
9. **Colour contrast.** White text on `action` #E7472E is about 3.6:1, below WCAG AA (4.5:1) for normal-size button
   text. Accept, darken the button shade, or use bold large text?
10. **Content.** The new Literature, Sport and History sample questions and the Urdu strings need a reviewer.
11. **Sponsor price.** The sample uses SAR 25 per 1,000 views and a 300,000-view quota per campaign. Real prices and
    quotas are per contract; confirm whether funding counts views or only answered views.
