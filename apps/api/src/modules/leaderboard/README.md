# leaderboard

Monthly points ledger (append-only), the per-month match cap, eligibility, ranking with tie-breaks, the live Redis leaderboard rebuildable from the ledger, month close with review and appeals, and admin overrides with a second approver.

- **BRD IDs:** FR-10, FR-11, BR-04, BR-05, BR-08, BR-10, BR-16, BR-17, BR-18
- **Built in:** Prompt 7 (`docs/BUILD_PROMPTS.md`)
- **Talks to other modules** only through their exported services or domain events (architecture rule 11).
