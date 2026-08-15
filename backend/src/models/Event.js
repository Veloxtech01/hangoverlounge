import { Schema, model } from 'mongoose';

const eventSchema = new Schema({
  name: { type: String, required: true, trim: true },
  tagline: { type: String, trim: true, default: '' },
  eventDate: { type: Date, required: true },
  venue: { type: String, required: true, trim: true },
  isActive: { type: Boolean, default: false },
}, { timestamps: true });

export const Event = model('Event', eventSchema);
