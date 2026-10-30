# prize

Prize campaigns, legal approvals, KYC, winner selection, payout batches with maker and checker, and the prize ledger. Inert while the `prizes.enabled` flag is false, which is its default everywhere.

- **BRD IDs:** FR-04, FR-20, FR-21, FR-22, FR-27, BR-15
- **Built in:** Prompt 10 (`docs/BUILD_PROMPTS.md`)
- **Talks to other modules** only through their exported services or domain events (architecture rule 9).
