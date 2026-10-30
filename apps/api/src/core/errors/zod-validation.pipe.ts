import { Injectable, PipeTransform } from '@nestjs/common';
import { ErrorCode } from '@quizate/shared';
import type { ZodType } from 'zod';
import { AppException } from './app.exception.js';

/** Validates a request part with a zod schema from packages/shared: `@Body(new ZodValidationPipe(schema))`. */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;
    throw new AppException(
      ErrorCode.VALIDATION_FAILED,
      result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    );
  }
}
