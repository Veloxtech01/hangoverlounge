import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { env } from '../../src/config/env.js';
import { Event } from '../../src/models/Event.js';

beforeAll(startTestDb, 30000);
afterAll(stopTestDb);
afterEach(clearTestDb);

async function adminToken(app) {
  const res = await request(app).post('/api/admin/auth/login').send({ password: env.adminPassword });
  return res.body.token;
}

describe('Admin events API', () => {
  it('creates an event with a 100-seat pool and 100 auto-generated 6-digit codes', async () => {
    const app = createApp();
    const token = await adminToken(app);
    const res = await request(app)
      .post('/api/admin/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'One Year Anniversary',
        eventDate: '2026-09-11T18:00:00+01:00',
        venue: 'Hangover Lounge, Umuahia',
      });
    expect(res.status).toBe(201);
    expect(res.body.codes).toHaveLength(100);
    expect(new Set(res.body.codes).size).toBe(100);
    for (const code of res.body.codes) {
      expect(code).toMatch(/^\d{6}$/);
    }

    const seatsRes = await request(app)
      .get(`/api/admin/events/${res.body.id}/seats`)
      .set('Authorization', `Bearer ${token}`);
    expect(seatsRes.body).toHaveLength(100);
    expect(seatsRes.body.every((s) => s.status === 'available')).toBe(true);
  });

  it('generates a custom code count when codeCount is given', async () => {
    const app = createApp();
    const token = await adminToken(app);
    const res = await request(app)
      .post('/api/admin/events')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Small Event', eventDate: new Date(), venue: 'V', codeCount: 10 });
    expect(res.status).toBe(201);
    expect(res.body.codes).toHaveLength(10);
  });

  it('rejects a codeCount that is not a positive integer', async () => {
    const app = createApp();
    const token = await adminToken(app);
    const res = await request(app)
      .post('/api/admin/events')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'X', eventDate: new Date(), venue: 'V', codeCount: 0 });
    expect(res.status).toBe(400);
  });

  it('activating one event deactivates all others', async () => {
    const app = createApp();
    const token = await adminToken(app);
    const a = await Event.create({ name: 'A', eventDate: new Date(), venue: 'V', isActive: true });
    const b = await Event.create({ name: 'B', eventDate: new Date(), venue: 'V', isActive: false });

    await request(app).post(`/api/admin/events/${b._id}/activate`).set('Authorization', `Bearer ${token}`);

    expect((await Event.findById(a._id)).isActive).toBe(false);
    expect((await Event.findById(b._id)).isActive).toBe(true);
  });

  it('activating a nonexistent event id returns 404 and leaves the active event untouched', async () => {
    const app = createApp();
    const token = await adminToken(app);
    const a = await Event.create({ name: 'A', eventDate: new Date(), venue: 'V', isActive: true });
    const nonexistentButValidId = '507f1f77bcf86cd799439011';

    const res = await request(app)
      .post(`/api/admin/events/${nonexistentButValidId}/activate`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect((await Event.findById(a._id)).isActive).toBe(true);
  });
});
