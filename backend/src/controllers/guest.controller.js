import { Event } from '../models/Event.js';
import { Drink } from '../models/Drink.js';
import { redeemCode } from '../services/seatAssignment.service.js';
import { ApiError } from '../middleware/errorHandler.js';

export async function redeem(req, res, next) {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      throw new ApiError(400, 'CODE_REQUIRED', 'Enter your invitation code.');
    }
    const event = await Event.findOne({ isActive: true });
    if (!event) {
      throw new ApiError(503, 'NO_ACTIVE_EVENT', 'No event is open for check-in right now.');
    }
    const { seatNumber } = await redeemCode(event._id, code);
    const drinks = await Drink.find({ event: event._id }).sort({ order: 1 });
    res.json({
      event: { name: event.name, tagline: event.tagline, eventDate: event.eventDate, venue: event.venue },
      seatNumber,
      drinks: drinks.map((d) => ({ category: d.category, name: d.name, price: d.price })),
    });
  } catch (err) {
    next(err);
  }
}
