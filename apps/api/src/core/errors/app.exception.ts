import { ERROR_HTTP_STATUS, type ErrorCode } from '@quizate/shared';

export interface ErrorDetail {
  path: string;
  message: string;
}

/** The one exception type business code throws. The message shown to clients comes from i18n, not from here. */
export class AppException extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly details?: ErrorDetail[],
    readonly status: number = ERROR_HTTP_STATUS[code],
  ) {
    super(code);
    this.name = 'AppException';
  }
}
