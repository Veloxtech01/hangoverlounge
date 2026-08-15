import { Seat } from '../models/Seat.js';
import { Code } from '../models/Code.js';

export async function createSeatPool(eventId, size = 100) {
  const seats = Array.from({ length: size }, (_, i) => ({
    event: eventId,
    seatNumber: i + 1,
  }));
  return Seat.insertMany(seats, { ordered: true });
}

export async function createCodes(eventId, codeStrings) {
  const docs = codeStrings.map((code) => ({ event: eventId, code: code.trim().toUpperCase() }));
  return Code.insertMany(docs, { ordered: true });
}
