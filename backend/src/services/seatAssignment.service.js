import mongoose from 'mongoose';
import { Code } from '../models/Code.js';
import { Seat } from '../models/Seat.js';
import { ApiError } from '../middleware/errorHandler.js';

export async function redeemCode(eventId, rawCode) {
  const normalized = rawCode.trim().toUpperCase();

  const existing = await Code.findOne({ event: eventId, code: normalized });
  if (!existing) {
    throw new ApiError(
      404,
      'CODE_NOT_FOUND',
      "That code doesn't match an invitation. Double-check the card and try again."
    );
  }
  if (existing.seatNumber) {
    return { seatNumber: existing.seatNumber, code: existing.code };
  }

  const session = await mongoose.startSession();
  try {
    let seatNumber;
    await session.withTransaction(async () => {
      const code = await Code.findOne({ _id: existing._id }).session(session);
      if (code.seatNumber) {
        seatNumber = code.seatNumber;
        return;
      }
      const seat = await Seat.findOneAndUpdate(
        { event: eventId, status: 'available' },
        { $set: { status: 'assigned', code: code._id } },
        { sort: { seatNumber: 1 }, new: true, session }
      );
      if (!seat) {
        throw new ApiError(409, 'SEATS_FULL', 'All seats are taken.');
      }
      code.seatNumber = seat.seatNumber;
      code.assignedAt = new Date();
      await code.save({ session });
      seatNumber = seat.seatNumber;
    });
    return { seatNumber, code: normalized };
  } finally {
    await session.endSession();
  }
}
