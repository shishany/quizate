import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PRODUCT } from '@quizate/shared';
import { Logger } from 'nestjs-pino';
import { EnvService } from './core/env/env.service.js';

/** Everything main.ts and the integration tests share, so tests run the same app as production. */
export function configureApp(app: INestApplication): void {
  const env = app.get(EnvService);
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  app.enableCors({ origin: env.get('CORS_ORIGINS'), credentials: true });

  const openapi = new DocumentBuilder()
    .setTitle(`${PRODUCT.name} API`)
    .setVersion('0.0.0')
    .addTag('health')
    .build();
  SwaggerModule.setup('docs', app, () => SwaggerModule.createDocument(app, openapi), {
    jsonDocumentUrl: 'docs/openapi.json',
  });
}
