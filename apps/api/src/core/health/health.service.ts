import { Inject, Injectable } from '@nestjs/common';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import type { DependencyStatus, Health } from '@quizate/shared';
import { Redis } from 'ioredis';
import pg from 'pg';
import { EnvService } from '../env/env.service.js';
import { PG_POOL, REDIS, S3 } from '../infra/infra.tokens.js';

export const PROBE_TIMEOUT_MS = 2000;

/** Runs a probe with a time limit. The error text is a short reason, never connection strings or credentials. */
export async function probe(
  check: () => Promise<unknown>,
  timeoutMs = PROBE_TIMEOUT_MS,
): Promise<DependencyStatus> {
  const started = performance.now();
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      check(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);
      }),
    ]);
    return { status: 'up', latencyMs: Math.round(performance.now() - started) };
  } catch (err) {
    return {
      status: 'down',
      latencyMs: Math.round(performance.now() - started),
      error: reason(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

function reason(err: unknown): string {
  const e = err as { code?: string; name?: string; message?: string };
  if (e?.message === 'timeout') return 'timeout';
  return e?.code ?? e?.name ?? 'error';
}

@Injectable()
export class HealthService {
  constructor(
    @Inject(PG_POOL) private readonly pg: pg.Pool,
    @Inject(REDIS) private readonly redis: Redis,
    @Inject(S3) private readonly s3: S3Client,
    private readonly env: EnvService,
  ) {}

  async check(): Promise<Health> {
    const [db, redis, storage] = await Promise.all([
      probe(() => this.pg.query('SELECT 1')),
      probe(async () => {
        if (this.redis.status === 'wait' || this.redis.status === 'end') await this.redis.connect();
        await this.redis.ping();
      }),
      probe(() => this.s3.send(new HeadBucketCommand({ Bucket: this.env.get('S3_BUCKET') }))),
    ]);
    const checks = { db, redis, storage };
    const allUp = Object.values(checks).every((c) => c.status === 'up');
    return { status: allUp ? 'ok' : 'degraded', checks };
  }
}
