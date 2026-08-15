import { describe, it, expect, beforeEach } from 'vitest';
import { getToken, setToken, clearToken, isAuthenticated } from './adminAuth.js';

beforeEach(() => sessionStorage.clear());

describe('adminAuth', () => {
  it('stores and retrieves a token', () => {
    expect(isAuthenticated()).toBe(false);
    setToken('abc');
    expect(getToken()).toBe('abc');
    expect(isAuthenticated()).toBe(true);
    clearToken();
    expect(isAuthenticated()).toBe(false);
  });
});
