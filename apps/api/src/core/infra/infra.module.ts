import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { Redis } from 'ioredis';
import pg from 'pg';
import { EnvService } from '../env/env.service.js';
import { PG_POOL, REDIS, S3 } from './infra.tokens.js';

/**
 * Shared connections to PostgreSQL, Redis and S3-compatible storage. Clients connect lazily so the API can start
 * (and report "down" on /health) while a dependency is unavailable.
 */
@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [EnvService],
      useFactory: (env: EnvService) =>
        new pg.Pool({
          connectionString: env.get('DATABASE_URL'),
          max: 10,
          connectionTimeoutMillis: 2000,
        }),
    },
    {
      provide: REDIS,
      inject: [EnvService],
      useFactory: (env: EnvService) =>
        new Redis(env.get('REDIS_URL'), {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          connectTimeout: 2000,
          enableOfflineQueue: false,
        }),
    },
    {
      provide: S3,
      inject: [EnvService],
      useFactory: (env: EnvService) =>
        new S3Client({
          endpoint: env.get('S3_ENDPOINT'),
          region: env.get('S3_REGION'),
          forcePathStyle: env.get('S3_FORCE_PATH_STYLE'),
          credentials: {
            accessKeyId: env.get('S3_ACCESS_KEY'),
            secretAccessKey: env.get('S3_SECRET_KEY'),
          },
          maxAttempts: 1,
        }),
    },
  ],
  exports: [PG_POOL, REDIS, S3],
})
export class InfraModule implements OnApplicationShutdown {
  constructor(
    @Inject(PG_POOL) private readonly pg: pg.Pool,
    @Inject(REDIS) private readonly redis: Redis,
    @Inject(S3) private readonly s3: S3Client,
  ) {}

  async onApplicationShutdown(): Promise<void> {
    this.redis.disconnect();
    this.s3.destroy();
    await this.pg.end();
  }
}
