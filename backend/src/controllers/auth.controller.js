import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../middleware/errorHandler.js';

export function login(req, res, next) {
  try {
    const { password } = req.body;
    if (password !== env.adminPassword) {
      throw new ApiError(401, 'INVALID_PASSWORD', 'Incorrect password.');
    }
    const token = jwt.sign({ role: 'admin' }, env.jwtSecret, { expiresIn: '12h' });
    res.json({ token });
  } catch (err) {
    next(err);
  }
}
