import { randomBytes } from 'node:crypto';
import pg from 'pg';

export interface TestDatabase {
  /** Connection string of the throwaway database. */
  url: string;
  drop(): Promise<void>;
}

/**
 * Creates an empty database for one test file, on the server named by DATABASE_URL, so test files never share
 * state. Prompt 2 adds `migrate` here once the schema exists. Refuses to run outside NODE_ENV=test.
 */
export async function createTestDatabase(
  baseUrl = process.env.DATABASE_URL,
): Promise<TestDatabase> {
  if (process.env.NODE_ENV !== 'test')
    throw new Error('createTestDatabase runs only with NODE_ENV=test');
  if (!baseUrl) throw new Error('DATABASE_URL is not set');

  const name = `quizate_test_${randomBytes(6).toString('hex')}`;
  const admin = new pg.Client({ connectionString: baseUrl });
  await admin.connect();
  await admin.query(`CREATE DATABASE ${name}`);
  await admin.end();

  const url = new URL(baseUrl);
  url.pathname = `/${name}`;

  return {
    url: url.toString(),
    async drop() {
      const client = new pg.Client({ connectionString: baseUrl });
      await client.connect();
      await client.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
      await client.end();
    },
  };
}
