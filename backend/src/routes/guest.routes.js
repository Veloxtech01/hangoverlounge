import { Router } from 'express';
import { getTableInvitation } from '../controllers/guest.controller.js';

export const guestRouter = Router();
guestRouter.get('/table/:tableNumber', getTableInvitation);
