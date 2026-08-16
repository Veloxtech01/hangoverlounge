import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { env } from '../../src/config/env.js';

beforeAll(startTestDb, 30000);
afterAll(stopTestDb);
afterEach(clearTestDb);

async function adminToken(app) {
  const res = await request(app).post('/api/admin/auth/login').send({ password: env.adminPassword });
  return res.body.token;
}

async function createEventWithCodes(app, token, codes) {
  const res = await request(app)
    .post('/api/admin/events')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Test Event', eventDate: new Date(), venue: 'V', codes });
  return res.body.id;
}

describe('Admin codes API', () => {
  it('lists all codes for an event, sorted, with redemption status', async () => {
    const app = createApp();
    const token = await adminToken(app);
    const eventId = await createEventWithCodes(app, token, ['HL002', 'HL001']);

    const res = await request(app)
      .get(`/api/admin/events/${eventId}/codes`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { code: 'HL001', seatNumber: null, redeemedAt: null },
      { code: 'HL002', seatNumber: null, redeemedAt: null },
    ]);
  });

  it('reflects a redeemed code with its seat number and timestamp', async () => {
    const app = createApp();
    const token = await adminToken(app);
    const eventId = await createEventWithCodes(app, token, ['HL001']);
    await request(app)
      .post(`/api/admin/events/${eventId}/activate`)
      .set('Authorization', `Bearer ${token}`);
    await request(app).post('/api/guest/redeem').send({ code: 'HL001' });

    const res = await request(app)
      .get(`/api/admin/events/${eventId}/codes`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].code).toBe('HL001');
    expect(res.body[0].seatNumber).toBe(1);
    expect(res.body[0].redeemedAt).not.toBeNull();
  });

  it('returns 401 without an admin token', async () => {
    const app = createApp();
    const res = await request(app).get('/api/admin/events/000000000000000000000000/codes');
    expect(res.status).toBe(401);
  });
});
