import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { env } from '../../src/config/env.js';

beforeAll(startTestDb, 30000);
afterAll(stopTestDb);
afterEach(clearTestDb);

describe('POST /api/admin/auth/login', () => {
  it('returns a token for the correct password', async () => {
    const app = createApp();
    const res = await request(app).post('/api/admin/auth/login').send({ password: env.adminPassword });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(() => jwt.verify(res.body.token, env.jwtSecret)).not.toThrow();
  });

  it('returns 401 for the wrong password', async () => {
    const app = createApp();
    const res = await request(app).post('/api/admin/auth/login').send({ password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_PASSWORD');
  });
});

describe('requireAdmin middleware (via a protected admin route)', () => {
  it('rejects requests with no token', async () => {
    const app = createApp();
    const res = await request(app).get('/api/admin/events');
    expect(res.status).toBe(401);
  });

  it('allows requests with a valid token', async () => {
    const app = createApp();
    const login = await request(app).post('/api/admin/auth/login').send({ password: env.adminPassword });
    const res = await request(app).get('/api/admin/events').set('Authorization', `Bearer ${login.body.token}`);
    expect(res.status).not.toBe(401);
  });
});
