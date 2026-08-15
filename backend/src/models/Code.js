import { Schema, model } from 'mongoose';

const codeSchema = new Schema({
  event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  seatNumber: { type: Number, default: null },
  assignedAt: { type: Date, default: null },
}, { timestamps: true });

codeSchema.index({ event: 1, code: 1 }, { unique: true });

export const Code = model('Code', codeSchema);
