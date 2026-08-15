import { randomUUID } from 'crypto';
import { logger } from '../config/logger.js';

export function requestId(req, res, next) {
  req.id = randomUUID();
  req.log = logger.child({ reqId: req.id });
  res.setHeader('X-Request-Id', req.id);
  next();
}
