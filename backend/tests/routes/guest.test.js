import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { Event } from '../../src/models/Event.js';
import { Drink } from '../../src/models/Drink.js';
import { createSeatPool, createCodes } from '../../src/services/eventSetup.service.js';

beforeAll(startTestDb, 30000);
afterAll(stopTestDb);
afterEach(clearTestDb);

async function seedActiveEvent() {
  const event = await Event.create({
    name: 'One Year Anniversary', eventDate: new Date(), venue: 'Hangover Lounge', isActive: true,
  });
  await createSeatPool(event._id, 5);
  await createCodes(event._id, ['GOOD1']);
  await Drink.create({ event: event._id, category: 'Whisky', name: 'Glenfiddich 18 Years', price: 300000, order: 0 });
  return event;
}

describe('POST /api/guest/redeem', () => {
  it('assigns a seat and returns event + drinks for a valid code', async () => {
    await seedActiveEvent();
    const app = createApp();
    const res = await request(app).post('/api/guest/redeem').send({ code: 'good1' });
    expect(res.status).toBe(200);
    expect(res.body.seatNumber).toBe(1);
    expect(res.body.event.name).toBe('One Year Anniversary');
    expect(res.body.drinks).toHaveLength(1);
  });

  it('returns 404 CODE_NOT_FOUND for an unknown code', async () => {
    await seedActiveEvent();
    const app = createApp();
    const res = await request(app).post('/api/guest/redeem').send({ code: 'NOPE' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('CODE_NOT_FOUND');
  });

  it('returns 400 CODE_REQUIRED when code is missing', async () => {
    await seedActiveEvent();
    const app = createApp();
    const res = await request(app).post('/api/guest/redeem').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CODE_REQUIRED');
  });

  it('returns 503 NO_ACTIVE_EVENT when no event is active', async () => {
    const app = createApp();
    const res = await request(app).post('/api/guest/redeem').send({ code: 'ANY' });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('NO_ACTIVE_EVENT');
  });
});
