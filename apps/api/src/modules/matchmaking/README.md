# matchmaking

Queue tickets, the matcher worker that widens by wait time (distance, rating, city, nationwide), pairing eligibility (daily ranked limit, same-pair limits, suspensions, device fingerprint) and match proposals. Coordinates are rounded to about 1 km, kept only on an open ticket, and never leave the server.

- **BRD IDs:** FR-05, BR-06, BR-07, BRD section 4
- **Built in:** Prompt 5 (`docs/BUILD_PROMPTS.md`)
- **Talks to other modules** only through their exported services or domain events (architecture rule 11).
