import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap.js';
import { validateEnv, type Env } from '../src/core/env/env.schema.js';
import { EnvService } from '../src/core/env/env.service.js';

/**
 * Boots the real application. `env` overrides individual settings for one app instance (the config module reads
 * process.env only once per test file).
 */
export async function createApp(env: Partial<Env> = {}): Promise<INestApplication> {
  const values = { ...validateEnv(process.env), ...env };
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(EnvService)
    .useValue({ get: <K extends keyof Env>(key: K) => values[key] })
    .compile();
  const app = moduleRef.createNestApplication({ bufferLogs: true });
  configureApp(app);
  await app.init();
  return app;
}
