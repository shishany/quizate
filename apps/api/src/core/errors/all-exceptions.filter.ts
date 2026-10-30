import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ErrorCode, ERROR_HTTP_STATUS, type ErrorBody } from '@quizate/shared';
import { I18nService, resolveLocale } from '../i18n/i18n.service.js';
import { AppException } from './app.exception.js';

const CODE_BY_STATUS: Record<number, ErrorCode> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.VALIDATION_FAILED,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHENTICATED,
  [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
  [HttpStatus.CONFLICT]: ErrorCode.CONFLICT,
  [HttpStatus.TOO_MANY_REQUESTS]: ErrorCode.RATE_LIMITED,
  [HttpStatus.SERVICE_UNAVAILABLE]: ErrorCode.SERVICE_UNAVAILABLE,
};

/**
 * Turns every error into `{ error: { code, message, requestId, details? } }` in the caller's language.
 * Stack traces and internal messages are logged, never returned.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Errors');

  constructor(private readonly i18n: I18nService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const req = http.getRequest<Request & { id?: string }>();
    const res = http.getResponse<Response>();

    let code: ErrorCode = ErrorCode.INTERNAL;
    let status: number = ERROR_HTTP_STATUS.INTERNAL;
    let details: AppException['details'];

    if (exception instanceof AppException) {
      ({ code, status, details } = exception);
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      code =
        CODE_BY_STATUS[status] ??
        (status >= 500 ? ErrorCode.INTERNAL : ErrorCode.VALIDATION_FAILED);
    }

    if (status >= 500) {
      this.logger.error({ err: exception, requestId: req.id }, 'Unhandled error');
    }

    const locale = resolveLocale(req.query?.lang, req.headers['accept-language']);
    const body: ErrorBody = {
      error: {
        code,
        message: this.i18n.t(locale, `errors.${code}`),
        ...(req.id ? { requestId: String(req.id) } : {}),
        ...(details?.length ? { details } : {}),
      },
    };
    res.status(status).json(body);
  }
}
