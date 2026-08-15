import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { Event } from '../../src/models/Event.js';
import { Seat } from '../../src/models/Seat.js';
import { Code } from '../../src/models/Code.js';
import { createSeatPool, createCodes } from '../../src/services/eventSetup.service.js';

beforeAll(startTestDb, 30000);
afterAll(stopTestDb);
afterEach(clearTestDb);

async function makeEvent() {
  return Event.create({ name: 'Test Event', eventDate: new Date(), venue: 'Test Venue' });
}

describe('eventSetup.service', () => {
  it('creates a seat pool numbered 1..size, all available', async () => {
    const event = await makeEvent();
    await createSeatPool(event._id, 10);
    const seats = await Seat.find({ event: event._id }).sort({ seatNumber: 1 });
    expect(seats).toHaveLength(10);
    expect(seats.map((s) => s.seatNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(seats.every((s) => s.status === 'available')).toBe(true);
  });

  it('creates codes normalized to uppercase, trimmed', async () => {
    const event = await makeEvent();
    await createCodes(event._id, [' abc123 ', 'xyz789']);
    const codes = await Code.find({ event: event._id }).sort({ code: 1 });
    expect(codes.map((c) => c.code)).toEqual(['ABC123', 'XYZ789']);
  });

  it('rejects duplicate codes within the same event', async () => {
    const event = await makeEvent();
    await createCodes(event._id, ['DUP1']);
    await expect(createCodes(event._id, ['DUP1'])).rejects.toThrow();
  });
});
