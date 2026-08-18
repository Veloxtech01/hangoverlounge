import { Event } from '../models/Event.js';
import { Drink } from '../models/Drink.js';
import { ApiError } from '../middleware/errorHandler.js';
import { env } from '../config/env.js';

export async function getTableInvitation(req, res, next) {
  try {
    const tableNumber = Number(req.params.tableNumber);
    if (!Number.isInteger(tableNumber) || tableNumber < 1 || tableNumber > env.maxTables) {
      throw new ApiError(
        400,
        'INVALID_TABLE_NUMBER',
        `Table number must be between 1 and ${env.maxTables}.`
      );
    }

    const event = await Event.findOne({ isActive: true });
    if (!event) {
      res.json({ active: false });
      return;
    }

    const drinks = await Drink.find({ event: event._id }).sort({ order: 1 });
    res.json({
      active: true,
      tableNumber,
      event: { name: event.name, tagline: event.tagline, eventDate: event.eventDate, venue: event.venue },
      drinks: drinks.map((d) => ({ category: d.category, name: d.name, price: d.price })),
    });
  } catch (err) {
    next(err);
  }
}
