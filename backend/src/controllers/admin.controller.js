import { Event } from '../models/Event.js';
import { Seat } from '../models/Seat.js';
import { createSeatPool, createCodes } from '../services/eventSetup.service.js';
import { ApiError } from '../middleware/errorHandler.js';

export async function createEvent(req, res, next) {
  try {
    const { name, tagline, eventDate, venue, codes } = req.body;
    if (!Array.isArray(codes) || codes.length === 0) {
      throw new ApiError(400, 'CODES_REQUIRED', 'Provide the list of invitation codes.');
    }
    const event = await Event.create({ name, tagline, eventDate, venue, isActive: false });
    await createSeatPool(event._id, 100);
    await createCodes(event._id, codes);
    res.status(201).json({ id: event._id });
  } catch (err) {
    next(err);
  }
}

export async function activateEvent(req, res, next) {
  try {
    await Event.updateMany({}, { isActive: false });
    const event = await Event.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
    if (!event) throw new ApiError(404, 'EVENT_NOT_FOUND', 'Event not found.');
    res.json({ id: event._id, isActive: event.isActive });
  } catch (err) {
    next(err);
  }
}

export async function listEvents(req, res, next) {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json(events);
  } catch (err) {
    next(err);
  }
}

export async function seatStatus(req, res, next) {
  try {
    const seats = await Seat.find({ event: req.params.eventId })
      .sort({ seatNumber: 1 })
      .populate('code', 'code');
    res.json(seats.map((s) => ({
      seatNumber: s.seatNumber,
      status: s.status,
      code: s.code?.code || null,
    })));
  } catch (err) {
    next(err);
  }
}
