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

const CODE_SPACE_SIZE = 1_000_000;

export function generateUniqueCodes(count) {
  if (count > CODE_SPACE_SIZE) {
    throw new Error(`Cannot generate ${count} unique 6-digit codes (space only holds ${CODE_SPACE_SIZE}).`);
  }
  const codes = new Set();
  while (codes.size < count) {
    const n = Math.floor(Math.random() * CODE_SPACE_SIZE);
    codes.add(String(n).padStart(6, '0'));
  }
  return [...codes];
}
