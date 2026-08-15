import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { createEvent, activateEvent, listEvents, seatStatus } from '../controllers/admin.controller.js';

export const adminRouter = Router();
adminRouter.use(requireAdmin);

adminRouter.post('/events', createEvent);
adminRouter.get('/events', listEvents);
adminRouter.post('/events/:id/activate', activateEvent);
adminRouter.get('/events/:eventId/seats', seatStatus);
