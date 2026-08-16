import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { Event } from '../../src/models/Event.js';
import { Seat } from '../../src/models/Seat.js';
import { createSeatPool, createCodes } from '../../src/services/eventSetup.service.js';
import { redeemCode, unassignSeat } from '../../src/services/seatAssignment.service.js';
import { Code } from '../../src/models/Code.js';

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

  it('never double-assigns a seat when the same fresh code is redeemed concurrently', async () => {
    const { event } = await makeEventWithPool(5, 1);
    const [first, second] = await Promise.all([
      redeemCode(event._id, 'CODE1'),
      redeemCode(event._id, 'CODE1'),
    ]);
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

describe('unassignSeat', () => {
  it('frees the seat and clears the code on success', async () => {
    const { event } = await makeEventWithPool(5, 1);
    const { seatNumber } = await redeemCode(event._id, 'CODE1');

    await unassignSeat(event._id, seatNumber);

    const seat = await Seat.findOne({ event: event._id, seatNumber });
    expect(seat.status).toBe('available');
    expect(seat.code).toBeNull();

    const code = await Code.findOne({ event: event._id, code: 'CODE1' });
    expect(code.seatNumber).toBeNull();
    expect(code.assignedAt).toBeNull();
  });

  it('throws SEAT_NOT_ASSIGNED for an already-available seat', async () => {
    const { event } = await makeEventWithPool(5, 1);
    await expect(unassignSeat(event._id, 1)).rejects.toMatchObject({ code: 'SEAT_NOT_ASSIGNED' });
  });

  it('throws SEAT_NOT_FOUND for a nonexistent seat number', async () => {
    const { event } = await makeEventWithPool(5, 1);
    await expect(unassignSeat(event._id, 99)).rejects.toMatchObject({ code: 'SEAT_NOT_FOUND' });
  });

  it('only lets one of two concurrent unassign calls succeed', async () => {
    const { event } = await makeEventWithPool(5, 1);
    const { seatNumber } = await redeemCode(event._id, 'CODE1');

    const results = await Promise.allSettled([
      unassignSeat(event._id, seatNumber),
      unassignSeat(event._id, seatNumber),
    ]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toMatchObject({ code: 'SEAT_NOT_ASSIGNED' });

    const assignedCount = await Seat.countDocuments({ event: event._id, status: 'assigned' });
    expect(assignedCount).toBe(0);
  });
});
