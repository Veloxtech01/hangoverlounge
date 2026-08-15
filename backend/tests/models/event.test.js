import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { Event } from '../../src/models/Event.js';

beforeAll(startTestDb, 30000);
afterAll(stopTestDb);
afterEach(clearTestDb);

describe('Event model', () => {
  it('requires name, eventDate, and venue', async () => {
    await expect(new Event({}).validate()).rejects.toThrow();
  });

  it('defaults isActive to false', async () => {
    const event = await Event.create({
      name: 'One Year Anniversary',
      eventDate: new Date('2026-09-11T18:00:00+01:00'),
      venue: 'Hangover Lounge, Umuahia',
    });
    expect(event.isActive).toBe(false);
  });
});
