# admin

Endpoints that serve the admin and sponsor portals and are not owned by another module, such as player search and support tickets.

- **BRD IDs:** FR-25, FR-26, FR-27, FR-28
- **Built in:** Prompt 11 (`docs/BUILD_PROMPTS.md`)
- **Talks to other modules** only through their exported services or domain events (architecture rule 9).
