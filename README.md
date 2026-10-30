# Quizate

Working name. A free, Arabic-first 1v1 trivia game for Saudi Arabia, with a monthly leaderboard. Cash prizes are built
behind a feature flag that stays off until legal clearance.

Start with `CLAUDE.md` (project brief and rules), then `docs/ARCHITECTURE.md`. The build follows
`docs/BUILD_PROMPTS.md`, one prompt per branch.

## Requirements

Node 22, pnpm 10, Docker, Flutter (stable).

## Run locally

```bash
docker compose up -d --wait
```

```bash
pnpm i
```

```bash
cp apps/api/.env.example apps/api/.env && cp apps/admin/.env.example apps/admin/.env.local
```

```bash
pnpm dev
```

- API: http://localhost:3001 (health at `/health`, OpenAPI at `/docs`)
- Admin: http://localhost:3000
- Local mail: http://localhost:8025 · storage console: http://localhost:9001

Player app:

```bash
cd apps/mobile && flutter run
```

## Checks

```bash
pnpm lint && pnpm typecheck && pnpm test
```

```bash
pnpm test:integration
```

```bash
cd apps/mobile && flutter analyze && flutter test
```
