import { Schema, model } from 'mongoose';

const drinkSchema = new Schema({
  event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  category: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  order: { type: Number, default: 0 },
}, { timestamps: true });

export const Drink = model('Drink', drinkSchema);
