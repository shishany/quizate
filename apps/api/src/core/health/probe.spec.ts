import { probe } from './health.service.js';

describe('probe', () => {
  it('reports up with latency', async () => {
    await expect(probe(async () => 1)).resolves.toMatchObject({ status: 'up' });
  });

  it('reports a short reason, not the error message', async () => {
    const err = Object.assign(new Error('connect ECONNREFUSED postgres://user:secret@db'), {
      code: 'ECONNREFUSED',
    });
    const result = await probe(() => Promise.reject(err));
    expect(result).toMatchObject({ status: 'down', error: 'ECONNREFUSED' });
    expect(JSON.stringify(result)).not.toMatch(/secret/);
  });

  it('times out', async () => {
    const result = await probe(() => new Promise(() => undefined), 20);
    expect(result).toMatchObject({ status: 'down', error: 'timeout' });
  });
});
