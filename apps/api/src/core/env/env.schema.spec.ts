import { validateEnv } from './env.schema.js';

const valid = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  REDIS_URL: 'redis://localhost:6379',
  S3_ENDPOINT: 'http://localhost:9000',
  S3_REGION: 'me-central-1',
  S3_ACCESS_KEY: 'k',
  S3_SECRET_KEY: 's',
  S3_BUCKET: 'bucket',
};

describe('validateEnv', () => {
  it('applies defaults', () => {
    const env = validateEnv(valid);
    expect(env.PORT).toBe(3001);
    expect(env.NODE_ENV).toBe('development');
    expect(env.S3_FORCE_PATH_STYLE).toBe(false);
    expect(env.CORS_ORIGINS).toEqual([]);
  });

  it('lists every invalid key without echoing secret values', () => {
    const run = () => validateEnv({ ...valid, DATABASE_URL: 'mysql://x', S3_SECRET_KEY: '' });
    expect(run).toThrow(/DATABASE_URL/);
    expect(run).toThrow(/S3_SECRET_KEY/);
  });

  it('splits CORS origins', () => {
    expect(validateEnv({ ...valid, CORS_ORIGINS: 'http://a, http://b' }).CORS_ORIGINS).toEqual([
      'http://a',
      'http://b',
    ]);
  });
});
