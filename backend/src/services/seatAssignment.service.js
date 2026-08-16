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

export async function unassignSeat(eventId, seatNumber) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const seat = await Seat.findOneAndUpdate(
        { event: eventId, seatNumber, status: 'assigned' },
        { $set: { status: 'available', code: null } },
        { session }
      );

      if (!seat) {
        const existing = await Seat.findOne({ event: eventId, seatNumber }).session(session);
        if (!existing) {
          throw new ApiError(404, 'SEAT_NOT_FOUND', 'Seat not found.');
        }
        throw new ApiError(409, 'SEAT_NOT_ASSIGNED', 'Seat is not currently assigned.');
      }

      if (seat.code) {
        await Code.updateOne(
          { _id: seat.code },
          { $set: { seatNumber: null, assignedAt: null } },
          { session }
        );
      }
      result = { seatNumber: seat.seatNumber };
    });
    return result;
  } finally {
    await session.endSession();
  }
}
