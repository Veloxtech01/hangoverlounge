import { connectDb, disconnectDb } from '../config/db.js';
import { Event } from '../models/Event.js';
import { Seat } from '../models/Seat.js';
import { Code } from '../models/Code.js';
import { createCodes, generateUniqueCodes } from '../services/eventSetup.service.js';

async function main() {
  await connectDb();
  const event = await Event.findOne({ isActive: true });
  if (!event) {
    throw new Error('No active event found — nothing to regenerate.');
  }

  const seatCount = await Seat.countDocuments({ event: event._id });
  if (seatCount === 0) {
    throw new Error(`Active event "${event.name}" has no seat pool — nothing to regenerate.`);
  }

  await Code.deleteMany({ event: event._id });
  await Seat.updateMany({ event: event._id }, { $set: { status: 'available', code: null } });

  const codes = generateUniqueCodes(seatCount);
  await createCodes(event._id, codes);

  console.log(`Regenerated ${codes.length} codes for "${event.name}" (${event._id}).`);
  console.log('View/export the full list at /admin/codes.');
  await disconnectDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
