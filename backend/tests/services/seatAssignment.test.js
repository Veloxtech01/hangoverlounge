import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { Event } from '../../src/models/Event.js';
import { Seat } from '../../src/models/Seat.js';
import { createSeatPool, createCodes } from '../../src/services/eventSetup.service.js';
import { redeemCode } from '../../src/services/seatAssignment.service.js';

beforeAll(startTestDb, 30000);
afterAll(stopTestDb);
afterEach(clearTestDb);

async function makeEventWithPool(poolSize, codeCount) {
  const event = await Event.create({ name: 'Test Event', eventDate: new Date(), venue: 'V' });
  await createSeatPool(event._id, poolSize);
  const codes = Array.from({ length: codeCount }, (_, i) => `CODE${i + 1}`);
  await createCodes(event._id, codes);
  return { event, codes };
}

describe('redeemCode', () => {
  it('assigns the lowest available seat to a fresh code', async () => {
    const { event } = await makeEventWithPool(5, 1);
    const result = await redeemCode(event._id, 'code1');
    expect(result.seatNumber).toBe(1);
  });

  it('returns the same seat on repeat redemption without consuming another seat', async () => {
    const { event } = await makeEventWithPool(5, 1);
    const first = await redeemCode(event._id, 'CODE1');
    const second = await redeemCode(event._id, 'CODE1');
    expect(second.seatNumber).toBe(first.seatNumber);
    const assignedCount = await Seat.countDocuments({ event: event._id, status: 'assigned' });
    expect(assignedCount).toBe(1);
  });

  it('throws CODE_NOT_FOUND for an unrecognized code', async () => {
    const { event } = await makeEventWithPool(5, 1);
    await expect(redeemCode(event._id, 'NOPE')).rejects.toMatchObject({ code: 'CODE_NOT_FOUND' });
  });

  it('never assigns the same seat to two concurrent distinct codes', async () => {
    const { event, codes } = await makeEventWithPool(5, 5);
    const results = await Promise.all(codes.map((c) => redeemCode(event._id, c)));
    const seatNumbers = results.map((r) => r.seatNumber).sort((a, b) => a - b);
    expect(seatNumbers).toEqual([1, 2, 3, 4, 5]);
    expect(new Set(seatNumbers).size).toBe(5);
  });

  it('throws SEATS_FULL once the pool is exhausted', async () => {
    const { event, codes } = await makeEventWithPool(2, 3);
    await Promise.all(codes.slice(0, 2).map((c) => redeemCode(event._id, c)));
    await expect(redeemCode(event._id, codes[2])).rejects.toMatchObject({ code: 'SEATS_FULL' });
  });
});
