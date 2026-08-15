import { Schema, model } from 'mongoose';

const seatSchema = new Schema({
  event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  seatNumber: { type: Number, required: true, min: 1, max: 100 },
  status: { type: String, enum: ['available', 'assigned'], default: 'available' },
  code: { type: Schema.Types.ObjectId, ref: 'Code', default: null },
}, { timestamps: true });

seatSchema.index({ event: 1, seatNumber: 1 }, { unique: true });

export const Seat = model('Seat', seatSchema);
