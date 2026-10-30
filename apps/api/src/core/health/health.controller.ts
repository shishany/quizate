import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import type { Health } from '@quizate/shared';
import type { Response } from 'express';
import { HealthService } from './health.service.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @ApiOkResponse({ description: 'Database, Redis and object storage are all up.' })
  @ApiServiceUnavailableResponse({
    description: 'At least one dependency is down; `checks` says which.',
  })
  async get(@Res({ passthrough: true }) res: Response): Promise<Health> {
    const result = await this.health.check();
    res.status(result.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);
    return result;
  }
}
