import { describe, it, expect, vi } from 'vitest';
import { errorHandler, ApiError } from '../../src/middleware/errorHandler.js';

function mockRes() {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
}

describe('errorHandler', () => {
  it('never leaks a raw numeric error code (e.g. Mongo duplicate-key 11000) into the response', () => {
    const err = new Error('dup');
    err.code = 11000;
    const req = {};
    const res = mockRes();
    const next = vi.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' },
    });
  });

  it('surfaces the real status/code/message for an ApiError, even at 5xx', () => {
    const err = new ApiError(503, 'NO_ACTIVE_EVENT', 'No event is open for check-in right now.');
    const req = {};
    const res = mockRes();
    const next = vi.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'NO_ACTIVE_EVENT', message: 'No event is open for check-in right now.' },
    });
  });
});
