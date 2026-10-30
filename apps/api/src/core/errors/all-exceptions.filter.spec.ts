import { ArgumentsHost, Logger, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@quizate/shared';
import { z } from 'zod';
import { I18nService } from '../i18n/i18n.service.js';
import { AllExceptionsFilter } from './all-exceptions.filter.js';
import { AppException } from './app.exception.js';
import { ZodValidationPipe } from './zod-validation.pipe.js';

function run(exception: unknown, query: Record<string, string> = {}) {
  const sent: { status?: number; body?: unknown } = {};
  const res = {
    status(s: number) {
      sent.status = s;
      return this;
    },
    json(b: unknown) {
      sent.body = b;
    },
  };
  const req = { id: 'req-1', query, headers: {} };
  const host = {
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
  } as unknown as ArgumentsHost;
  new AllExceptionsFilter(new I18nService()).catch(exception, host);
  return sent;
}

describe('AllExceptionsFilter', () => {
  beforeAll(() => Logger.overrideLogger(false));

  it('maps Nest HTTP exceptions to shared codes, in Arabic by default', () => {
    expect(run(new NotFoundException())).toEqual({
      status: 404,
      body: {
        error: { code: 'NOT_FOUND', message: 'لم يتم العثور على المطلوب.', requestId: 'req-1' },
      },
    });
  });

  it('never leaks internal messages or stacks', () => {
    const { status, body } = run(new Error('password=hunter2 at db.ts:12'), { lang: 'en' });
    expect(status).toBe(500);
    expect(JSON.stringify(body)).not.toMatch(/hunter2|db\.ts/);
    expect(body).toMatchObject({ error: { code: 'INTERNAL' } });
  });

  it('returns validation details from the zod pipe', () => {
    const pipe = new ZodValidationPipe(z.object({ name: z.string() }));
    let caught: unknown;
    try {
      pipe.transform({ name: 3 });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(AppException);
    const { status, body } = run(caught, { lang: 'en' });
    expect(status).toBe(400);
    expect(body).toMatchObject({
      error: { code: ErrorCode.VALIDATION_FAILED, details: [{ path: 'name' }] },
    });
  });
});
