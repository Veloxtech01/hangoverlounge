import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { Event } from '../../src/models/Event.js';
import { Drink } from '../../src/models/Drink.js';

beforeAll(startTestDb, 30000);
afterAll(stopTestDb);
afterEach(clearTestDb);

async function seedActiveEvent() {
  const event = await Event.create({
    name: 'One Year Anniversary', eventDate: new Date(), venue: 'Hangover Lounge', isActive: true,
  });
  await Drink.create({ event: event._id, category: 'Whisky', name: 'Glenfiddich 18 Years', price: 300000, order: 0 });
  return event;
}

describe('GET /api/guest/table/:tableNumber', () => {
  it('returns event + drinks for a valid table when an event is active', async () => {
    await seedActiveEvent();
    const app = createApp();
    const res = await request(app).get('/api/guest/table/7');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      active: true,
      tableNumber: 7,
      event: { name: 'One Year Anniversary', tagline: '', eventDate: expect.any(String), venue: 'Hangover Lounge' },
      drinks: [{ category: 'Whisky', name: 'Glenfiddich 18 Years', price: 300000 }],
    });
  });

  it('returns { active: false } when no event is active', async () => {
    const app = createApp();
    const res = await request(app).get('/api/guest/table/7');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ active: false });
  });

  it('returns 400 INVALID_TABLE_NUMBER for a table number above MAX_TABLES', async () => {
    const app = createApp();
    const res = await request(app).get('/api/guest/table/9999');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_TABLE_NUMBER');
  });

  it('returns 400 INVALID_TABLE_NUMBER for a non-numeric table number', async () => {
    const app = createApp();
    const res = await request(app).get('/api/guest/table/abc');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_TABLE_NUMBER');
  });

  it('returns 400 INVALID_TABLE_NUMBER for table 0', async () => {
    const app = createApp();
    const res = await request(app).get('/api/guest/table/0');
    expect(res.status).toBe(400);
  });
});
