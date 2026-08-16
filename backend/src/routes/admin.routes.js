import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { createEvent, activateEvent, listEvents, seatStatus, listCodes } from '../controllers/admin.controller.js';
import { listDrinks, createDrink, updateDrink, deleteDrink } from '../controllers/adminDrinks.controller.js';

export const adminRouter = Router();
adminRouter.use(requireAdmin);

adminRouter.post('/events', createEvent);
adminRouter.get('/events', listEvents);
adminRouter.post('/events/:id/activate', activateEvent);
adminRouter.get('/events/:eventId/seats', seatStatus);
adminRouter.get('/events/:eventId/codes', listCodes);

adminRouter.get('/events/:eventId/drinks', listDrinks);
adminRouter.post('/events/:eventId/drinks', createDrink);
adminRouter.put('/drinks/:id', updateDrink);
adminRouter.delete('/drinks/:id', deleteDrink);
