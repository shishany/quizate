/** Defaults for integration tests: the docker compose services (or CI service containers) on localhost. */
const defaults: Record<string, string> = {
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  DATABASE_URL: 'postgresql://quizate:quizate@localhost:5432/quizate',
  REDIS_URL: 'redis://localhost:6379/15',
  S3_ENDPOINT: 'http://localhost:9000',
  S3_REGION: 'me-central-1',
  S3_ACCESS_KEY: 'quizate',
  S3_SECRET_KEY: 'quizate-local-secret',
  S3_BUCKET: 'quizate-test',
  S3_FORCE_PATH_STYLE: 'true',
};

for (const [key, value] of Object.entries(defaults)) {
  process.env[key] ??= value;
}
