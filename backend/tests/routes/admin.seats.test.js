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

async function createEventWithGeneratedCodes(app, token, codeCount) {
  const res = await request(app)
    .post('/api/admin/events')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Test Event', eventDate: new Date(), venue: 'V', codeCount });
  return { eventId: res.body.id, codes: res.body.codes };
}

describe('Admin unassign seat API', () => {
  it('unassigns a redeemed seat and frees it back to available', async () => {
    const app = createApp();
    const token = await adminToken(app);
    const { eventId, codes } = await createEventWithGeneratedCodes(app, token, 1);
    await request(app)
      .post(`/api/admin/events/${eventId}/activate`)
      .set('Authorization', `Bearer ${token}`);
    const redeemRes = await request(app).post('/api/guest/redeem').send({ code: codes[0] });
    const { seatNumber } = redeemRes.body;

    const res = await request(app)
      .post(`/api/admin/events/${eventId}/seats/${seatNumber}/unassign`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ seatNumber, status: 'available' });

    const seatsRes = await request(app)
      .get(`/api/admin/events/${eventId}/seats`)
      .set('Authorization', `Bearer ${token}`);
    const seat = seatsRes.body.find((s) => s.seatNumber === seatNumber);
    expect(seat.status).toBe('available');
    expect(seat.code).toBeNull();
  });

  it('returns 409 when the seat is not currently assigned', async () => {
    const app = createApp();
    const token = await adminToken(app);
    const { eventId } = await createEventWithGeneratedCodes(app, token, 1);

    const res = await request(app)
      .post(`/api/admin/events/${eventId}/seats/1/unassign`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('SEAT_NOT_ASSIGNED');
  });

  it('returns 401 without an admin token', async () => {
    const app = createApp();
    const res = await request(app).post(
      '/api/admin/events/000000000000000000000000/seats/1/unassign'
    );
    expect(res.status).toBe(401);
  });
});
