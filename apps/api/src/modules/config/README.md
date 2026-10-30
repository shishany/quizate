# config

Business configuration (every BRD section 3-4 default) and feature flags, cached, with an audit of who changed what, when and why. `prizes.enabled` needs two super admins to change.

- **BRD IDs:** Architecture rules 4 and 5, FR-27
- **Built in:** Prompt 10 (`docs/BUILD_PROMPTS.md`)
- **Talks to other modules** only through their exported services or domain events (architecture rule 11).
