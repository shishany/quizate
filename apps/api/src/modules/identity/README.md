# identity

Player sign-up and sign-in with a Saudi mobile number and OTP, device-bound refresh tokens, display-name moderation, age gating, account deletion and data export; admin sign-in with mandatory TOTP MFA and role-based access.

- **BRD IDs:** FR-01, FR-02, FR-03, FR-25, BR-15, NFR-09
- **Built in:** Prompt 3 (`docs/BUILD_PROMPTS.md`)
- **Talks to other modules** only through their exported services or domain events (architecture rule 11).
