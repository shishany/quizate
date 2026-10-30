# Configuration

Two kinds of settings, kept apart on purpose:

1. **Environment variables**: infrastructure only (addresses, credentials, log level). Validated at start-up by
   `apps/api/src/core/env/env.schema.ts`; the API refuses to start and lists every invalid key (never the values).
2. **Business configuration**: every default from BRD sections 3-4 (timers, limits, points, radii, prize table) and
   the feature flags. These live in the audited `config` module (config table + cache, Prompt 10), never in env vars
   or code constants (architecture rule 4).

## API environment (`apps/api/.env.example`)

| Key                               | Default       | Notes                                                              |
| --------------------------------- | ------------- | ------------------------------------------------------------------ |
| `NODE_ENV`                        | `development` | `development`, `test` or `production`                              |
| `PORT`                            | `3001`        | HTTP and, later, WebSocket port                                    |
| `LOG_LEVEL`                       | `info`        | pino level; `silent` in tests                                      |
| `CORS_ORIGINS`                    | empty         | Comma-separated origins allowed to call the API (the admin app)    |
| `DATABASE_URL`                    | required      | `postgresql://…`                                                   |
| `REDIS_URL`                       | required      | `redis://…` or `rediss://…`                                        |
| `S3_ENDPOINT`                     | required      | Any S3-compatible endpoint                                         |
| `S3_REGION`                       | required      | A Saudi region in every deployed environment (architecture rule 7) |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | required      | From the secrets manager when deployed                             |
| `S3_BUCKET`                       | required      | Checked by `/health`                                               |
| `S3_FORCE_PATH_STYLE`             | `false`       | `true` for the local store                                         |

## Admin environment (`apps/admin/.env.example`)

| Key       | Default                 | Notes            |
| --------- | ----------------------- | ---------------- |
| `API_URL` | `http://localhost:3001` | Server-side only |

## Mobile build settings (`apps/mobile/.env.example`)

Passed with `--dart-define`; anything compiled into the app is public, so never secrets.

| Key            | Default                | Notes                                      |
| -------------- | ---------------------- | ------------------------------------------ |
| `API_BASE_URL` | `http://10.0.2.2:3001` | The host machine from the Android emulator |

## Business configuration keys

None yet. Each prompt that adds a key lists it here with its BRD source, default, unit and who may change it.

## Feature flags

| Flag             | Default                      | Who may change it                                                                                       |
| ---------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| `prizes.enabled` | `false` in every environment | super_admin with a second super_admin's approval, after Gate G1 (Prompt 10). Never changed by an agent. |
