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

describe('Admin drinks API', () => {
  it('creates, lists, updates, and deletes a drink', async () => {
    const app = createApp();
    const token = await adminToken(app);
    const event = await Event.create({ name: 'E', eventDate: new Date(), venue: 'V' });
    const auth = { Authorization: `Bearer ${token}` };

    const created = await request(app)
      .post(`/api/admin/events/${event._id}/drinks`)
      .set(auth)
      .send({ category: 'Whisky', name: 'Glenfiddich 18 Years', price: 300000, order: 0 });
    expect(created.status).toBe(201);

    const list = await request(app).get(`/api/admin/events/${event._id}/drinks`).set(auth);
    expect(list.body).toHaveLength(1);

    const updated = await request(app)
      .put(`/api/admin/drinks/${created.body._id}`)
      .set(auth)
      .send({ price: 350000 });
    expect(updated.body.price).toBe(350000);

    const deleted = await request(app).delete(`/api/admin/drinks/${created.body._id}`).set(auth);
    expect(deleted.status).toBe(204);

    const listAfter = await request(app).get(`/api/admin/events/${event._id}/drinks`).set(auth);
    expect(listAfter.body).toHaveLength(0);
  });
});
