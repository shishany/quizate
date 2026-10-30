# audit

Append-only audit log of every admin action: actor, action, entity, before and after, reason and IP.

- **BRD IDs:** FR-25
- **Built in:** Prompt 3 (`docs/BUILD_PROMPTS.md`)
- **Talks to other modules** only through their exported services or domain events (architecture rule 9).
