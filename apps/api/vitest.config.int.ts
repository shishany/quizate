import { defineConfig } from 'vitest/config';

/** Integration tests run against real PostgreSQL, Redis and object storage (docker compose or CI services). */
export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.int-spec.ts'],
    setupFiles: ['test/setup-env.ts'],
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
