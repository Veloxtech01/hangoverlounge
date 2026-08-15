import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { requestId } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { guestRouter } from './routes/guest.routes.js';
import { authRouter } from './routes/auth.routes.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json());
  app.use(requestId);
  app.use(rateLimit({ windowMs: 60_000, max: 60 }));

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/guest', guestRouter);
  app.use('/api/admin/auth', authRouter);

  app.use(errorHandler);
  return app;
}
