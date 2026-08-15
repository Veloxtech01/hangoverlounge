import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { api } from './api.js';
import { setToken, getToken } from './adminAuth.js';

// The response interceptor is registered once at module load (api.js).
// Rather than mocking axios (and reimplementing its interceptor plumbing),
// we grab the real registered "rejected" handler off the live axios
// instance and invoke it directly with a synthetic error — this exercises
// the exact logic that ships, not a re-description of it.
function getResponseRejectedHandler() {
  const handler = api.interceptors.response.handlers.find((h) => h && h.rejected);
  if (!handler) {
    throw new Error('No response interceptor registered on api instance');
  }
  return handler.rejected;
}

describe('api response interceptor (401 session-expiry handling)', () => {
  let originalLocation;

  beforeEach(() => {
    sessionStorage.clear();
    originalLocation = window.location;
    delete window.location;
    window.location = { href: '' };
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it('clears the token and redirects to /admin/login on a 401 for an admin route', async () => {
    setToken('secret-token');
    const rejected = getResponseRejectedHandler();
    const error = {
      response: { status: 401 },
      config: { url: '/api/admin/events' },
    };

    await expect(rejected(error)).rejects.toBe(error);

    expect(getToken()).toBeNull();
    expect(window.location.href).toBe('/admin/login');
  });

  it('does not clear the token or redirect on a 401 for the admin login route', async () => {
    setToken('secret-token');
    const rejected = getResponseRejectedHandler();
    const error = {
      response: { status: 401 },
      config: { url: '/api/admin/auth/login' },
    };

    await expect(rejected(error)).rejects.toBe(error);

    expect(getToken()).toBe('secret-token');
    expect(window.location.href).toBe('');
  });

  it('does not clear the token or redirect on a non-401 error', async () => {
    setToken('secret-token');
    const rejected = getResponseRejectedHandler();
    const error = {
      response: { status: 500 },
      config: { url: '/api/admin/events' },
    };

    await expect(rejected(error)).rejects.toBe(error);

    expect(getToken()).toBe('secret-token');
    expect(window.location.href).toBe('');
  });
});
