import { Router } from 'express';
import { redeem } from '../controllers/guest.controller.js';

export const guestRouter = Router();
guestRouter.post('/redeem', redeem);
