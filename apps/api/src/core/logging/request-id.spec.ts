import type { IncomingMessage, ServerResponse } from 'node:http';
import { requestId } from './logging.module.js';

function call(header?: string) {
  const headers: Record<string, string> = {};
  const req = { headers: header ? { 'x-request-id': header } : {} } as unknown as IncomingMessage;
  const res = {
    setHeader: (k: string, v: string) => (headers[k] = v),
  } as unknown as ServerResponse;
  return { id: requestId(req, res), headers };
}

describe('requestId', () => {
  it('keeps a well-formed incoming id and echoes it', () => {
    expect(call('abc-123')).toEqual({ id: 'abc-123', headers: { 'x-request-id': 'abc-123' } });
  });

  it('replaces a malformed id (log injection) with a fresh UUID', () => {
    const { id } = call('bad\nid');
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('issues an id when none is sent', () => {
    expect(call().id).toMatch(/^[0-9a-f-]{36}$/);
  });
});
