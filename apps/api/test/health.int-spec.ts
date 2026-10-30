import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { healthSchema } from '@quizate/shared';
import { createApp } from './app.js';
import { createTestDatabase, type TestDatabase } from './db.js';
import { ensureBucket } from './storage.js';

describe('GET /health (NFR-11)', () => {
  let app: INestApplication;
  let db: TestDatabase;

  beforeAll(async () => {
    db = await createTestDatabase();
    await ensureBucket();
    app = await createApp({ DATABASE_URL: db.url });
  });

  afterAll(async () => {
    await app?.close();
    await db?.drop();
  });

  it('reports db, redis and storage as up', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    const body = healthSchema.parse(res.body);
    expect(body.status).toBe('ok');
    expect(body.checks.db.status).toBe('up');
    expect(body.checks.redis.status).toBe('up');
    expect(body.checks.storage.status).toBe('up');
  });

  it('echoes the request id', async () => {
    const res = await request(app.getHttpServer()).get('/health').set('x-request-id', 'int-test-1');
    expect(res.headers['x-request-id']).toBe('int-test-1');
  });

  it('returns typed, localized errors without stack traces', async () => {
    const res = await request(app.getHttpServer())
      .get('/nope')
      .set('accept-language', 'en')
      .expect(404);
    expect(res.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Not found.', requestId: expect.any(String) },
    });
    const ar = await request(app.getHttpServer()).get('/nope').expect(404);
    expect(ar.body.error.message).toBe('لم يتم العثور على المطلوب.');
  });

  it('serves the OpenAPI document', async () => {
    const res = await request(app.getHttpServer()).get('/docs/openapi.json').expect(200);
    expect(res.body.paths).toHaveProperty('/health');
  });
});

describe('GET /health with storage down', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp({ S3_ENDPOINT: 'http://127.0.0.1:1' });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('answers 503 and names the failing dependency', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.checks.storage.status).toBe('down');
    expect(JSON.stringify(res.body)).not.toContain('quizate-local-secret');
  });
});
