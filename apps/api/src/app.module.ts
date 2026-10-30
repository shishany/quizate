import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { EnvModule } from './core/env/env.module.js';
import { AllExceptionsFilter } from './core/errors/all-exceptions.filter.js';
import { HealthModule } from './core/health/health.module.js';
import { I18nModule } from './core/i18n/i18n.module.js';
import { InfraModule } from './core/infra/infra.module.js';
import { LoggingModule } from './core/logging/logging.module.js';

@Module({
  imports: [EnvModule, LoggingModule, I18nModule, InfraModule, HealthModule],
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}
