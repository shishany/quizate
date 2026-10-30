# match

The real-time match engine over socket.io: server-timed questions, answer intake with server timestamps, scoring, outcomes, disconnect grace, forfeits and abandon blocks. Emits MatchCompleted; computes no monthly points.

- **BRD IDs:** FR-06, FR-07, FR-08, FR-09, BR-01, BR-02, BR-03, BR-11, BR-12, NFR-01, NFR-08
- **Built in:** Prompt 6 (`docs/BUILD_PROMPTS.md`)
- **Talks to other modules** only through their exported services or domain events (architecture rule 11).
