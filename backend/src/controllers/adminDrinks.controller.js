import { Drink } from '../models/Drink.js';
import { ApiError } from '../middleware/errorHandler.js';

export async function listDrinks(req, res, next) {
  try {
    const drinks = await Drink.find({ event: req.params.eventId }).sort({ order: 1 });
    res.json(drinks);
  } catch (err) {
    next(err);
  }
}

export async function createDrink(req, res, next) {
  try {
    const { category, name, price, order } = req.body;
    const drink = await Drink.create({ event: req.params.eventId, category, name, price, order: order || 0 });
    res.status(201).json(drink);
  } catch (err) {
    next(err);
  }
}

export async function updateDrink(req, res, next) {
  try {
    const drink = await Drink.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!drink) throw new ApiError(404, 'DRINK_NOT_FOUND', 'Drink not found.');
    res.json(drink);
  } catch (err) {
    next(err);
  }
}

export async function deleteDrink(req, res, next) {
  try {
    await Drink.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
