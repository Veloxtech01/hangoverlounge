# Hangover Lounge — Backend Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Express/MongoDB backend for Hangover Lounge — event-scoped invitation codes, atomic 001–100 seat assignment, a guest redemption API, and an admin API (auth, event/code/seat/drink management) — as a standalone, tested service the frontend will consume later.

**Architecture:** Layered Express app (`routes/ → controllers/ → services/ → models/`) per root `CLAUDE.md`. Seat assignment is the core invariant and lives in one service function using a Mongoose transaction (`session.withTransaction`, which auto-retries on write conflicts) so concurrent redemptions can never collide on a seat. Events are first-class (not hardcoded) so the same backend can be reset/reused for future Hangover Lounge events.

**Tech Stack:** Node/Express 4, Mongoose 8, `jsonwebtoken` for admin auth, `pino` logging, `helmet`/`cors`/`compression`/`express-rate-limit`, `dotenv`. Tests: `vitest`, `supertest`, `mongodb-memory-server` in **replica-set mode** (required for transactions).

## Global Constraints

- Seats numbered **001–100** per event; assignment must be atomic — proven by a concurrency test, not just code review.
- A code always returns the **same seat** on every subsequent redemption — there is no "already used" error state.
- No personal-information fields anywhere in the guest-facing data model.
- Admin auth is a **single shared password** (`ADMIN_PASSWORD` env var), not per-user accounts.
- Secrets (`MONGODB_URI`, `ADMIN_PASSWORD`, `JWT_SECRET`) live only in `.env` (gitignored) / `.env.example` placeholders — never hardcoded, never logged, never committed.
- The app must support **multiple events over time** — an `Event` document per event, one `isActive` at a time — not a single hardcoded event.
- Follow root `CLAUDE.md` backend conventions: layered structure, one Mongoose schema per file, centralized error middleware, `pino` logging via `req.log`.

---

### Task 1: Backend scaffold, config, and health check

**Files:**
- Create: `backend/package.json`
- Create: `backend/.env.example`
- Create: `backend/.gitignore`
- Create: `.gitignore` (repo root)
- Create: `backend/src/config/env.js`
- Create: `backend/src/config/db.js`
- Create: `backend/src/config/logger.js`
- Create: `backend/src/middleware/requestId.js`
- Create: `backend/src/middleware/errorHandler.js`
- Create: `backend/src/app.js`
- Create: `backend/src/server.js`
- Test: `backend/tests/health.test.js`

**Interfaces:**
- Produces: `createApp()` from `backend/src/app.js` (Express instance, no DB connection needed) — every later test file imports this. `env` object from `backend/src/config/env.js`: `{port, mongodbUri, adminPassword, jwtSecret, nodeEnv}`. `logger` from `backend/src/config/logger.js`. `ApiError` class and `errorHandler` middleware from `backend/src/middleware/errorHandler.js`.

- [ ] **Step 1: Create `backend/package.json`**

```json
{
  "name": "hangover-lounge-backend",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js",
    "test": "vitest run",
    "seed": "node src/scripts/seed.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "mongoose": "^8.5.0",
    "dotenv": "^16.4.5",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "compression": "^1.7.4",
    "express-rate-limit": "^7.4.0",
    "pino": "^9.3.2",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "vitest": "^2.0.5",
    "supertest": "^7.0.0",
    "mongodb-memory-server": "^10.0.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `cd backend && npm install`

- [ ] **Step 3: Create `backend/.env.example`**

```
PORT=4000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/hangoverlounge
ADMIN_PASSWORD=changeme
JWT_SECRET=change-this-to-a-long-random-string
NODE_ENV=development
```

- [ ] **Step 4: Create `backend/.gitignore`**

```
node_modules/
.env
```

- [ ] **Step 5: Create root `.gitignore`**

```
node_modules/
.env
dist/
.DS_Store
```

- [ ] **Step 6: Create `backend/src/config/env.js`**

```js
import 'dotenv/config';

const required = ['MONGODB_URI', 'ADMIN_PASSWORD', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT) || 4000,
  mongodbUri: process.env.MONGODB_URI,
  adminPassword: process.env.ADMIN_PASSWORD,
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV || 'development',
};
```

- [ ] **Step 7: Create `backend/src/config/db.js`**

```js
import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDb(uri = env.mongodbUri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.disconnect();
}
```

- [ ] **Step 8: Create `backend/src/config/logger.js`**

```js
import pino from 'pino';
import { env } from './env.js';

export const logger = pino({
  level: env.nodeEnv === 'production' ? 'info' : 'debug',
});
```

- [ ] **Step 9: Create `backend/src/middleware/requestId.js`**

```js
import { randomUUID } from 'crypto';
import { logger } from '../config/logger.js';

export function requestId(req, res, next) {
  req.id = randomUUID();
  req.log = logger.child({ reqId: req.id });
  res.setHeader('X-Request-Id', req.id);
  next();
}
```

- [ ] **Step 10: Create `backend/src/middleware/errorHandler.js`**

```js
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) {
    (req.log || console).error({ err }, 'unhandled error');
  }
  res.status(status).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: status >= 500 ? 'Something went wrong.' : err.message,
    },
  });
}
```

- [ ] **Step 11: Write the failing test — `backend/tests/health.test.js`**

```js
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('GET /api/health', () => {
  it('returns ok status', async () => {
    const app = createApp();
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
```

- [ ] **Step 12: Run test, verify it fails**

Run: `cd backend && npx vitest run tests/health.test.js`
Expected: FAIL — `backend/src/app.js` does not exist yet.

- [ ] **Step 13: Create `backend/src/app.js`**

```js
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { requestId } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json());
  app.use(requestId);
  app.use(rateLimit({ windowMs: 60_000, max: 60 }));

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  app.use(errorHandler);
  return app;
}
```

- [ ] **Step 14: Create `backend/src/server.js`**

```js
import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

async function main() {
  await connectDb();
  const app = createApp();
  app.listen(env.port, () => logger.info(`listening on ${env.port}`));
}

process.on('unhandledRejection', (err) => {
  logger.error({ err }, 'unhandledRejection');
  process.exit(1);
});

main();
```

- [ ] **Step 15: Run test, verify it passes**

Run: `cd backend && npx vitest run tests/health.test.js`
Expected: PASS

- [ ] **Step 16: Create `backend/.env` from `.env.example`, fill in the real `MONGODB_URI`, `ADMIN_PASSWORD`, `JWT_SECRET` (generate a random string for the JWT secret — do not reuse the admin password). Confirm `.env` is not tracked: `git status` should not list it once git is initialized.**

- [ ] **Step 17: Commit**

```bash
git add backend/package.json backend/.env.example backend/.gitignore .gitignore backend/src backend/tests
git commit -m "feat: backend scaffold with health check"
```

---

### Task 2: Event model

**Files:**
- Create: `backend/src/models/Event.js`
- Create: `backend/tests/helpers/db.js`
- Test: `backend/tests/models/event.test.js`

**Interfaces:**
- Consumes: nothing new.
- Produces: `Event` Mongoose model with fields `{name, tagline, eventDate, venue, isActive, createdAt, updatedAt}`. `startTestDb()`, `stopTestDb()`, `clearTestDb()` from `backend/tests/helpers/db.js` — reused by every later DB test.

- [ ] **Step 1: Create the shared test DB helper — `backend/tests/helpers/db.js`**

```js
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let replSet;

export async function startTestDb() {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replSet.getUri());
}

export async function stopTestDb() {
  await mongoose.disconnect();
  if (replSet) await replSet.stop();
}

export async function clearTestDb() {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}
```

Replica-set mode is required here (not the default standalone memory server) because Task 4's transaction tests need it — using it from the start keeps every DB test on the same helper.

- [ ] **Step 2: Write the failing test — `backend/tests/models/event.test.js`**

```js
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { Event } from '../../src/models/Event.js';

beforeAll(startTestDb, 30000);
afterAll(stopTestDb);
afterEach(clearTestDb);

describe('Event model', () => {
  it('requires name, eventDate, and venue', async () => {
    await expect(new Event({}).validate()).rejects.toThrow();
  });

  it('defaults isActive to false', async () => {
    const event = await Event.create({
      name: 'One Year Anniversary',
      eventDate: new Date('2026-09-11T18:00:00+01:00'),
      venue: 'Hangover Lounge, Umuahia',
    });
    expect(event.isActive).toBe(false);
  });
});
```

- [ ] **Step 3: Run test, verify it fails**

Run: `cd backend && npx vitest run tests/models/event.test.js`
Expected: FAIL — `backend/src/models/Event.js` does not exist.

- [ ] **Step 4: Create `backend/src/models/Event.js`**

```js
import { Schema, model } from 'mongoose';

const eventSchema = new Schema({
  name: { type: String, required: true, trim: true },
  tagline: { type: String, trim: true, default: '' },
  eventDate: { type: Date, required: true },
  venue: { type: String, required: true, trim: true },
  isActive: { type: Boolean, default: false },
}, { timestamps: true });

export const Event = model('Event', eventSchema);
```

- [ ] **Step 5: Run test, verify it passes**

Run: `cd backend && npx vitest run tests/models/event.test.js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/models/Event.js backend/tests/helpers backend/tests/models/event.test.js
git commit -m "feat: add Event model and shared test DB helper"
```

---

### Task 3: Code & Seat models + seat-pool setup service

**Files:**
- Create: `backend/src/models/Code.js`
- Create: `backend/src/models/Seat.js`
- Create: `backend/src/services/eventSetup.service.js`
- Test: `backend/tests/services/eventSetup.test.js`

**Interfaces:**
- Consumes: `Event` model (Task 2), `startTestDb`/`stopTestDb`/`clearTestDb` (Task 2).
- Produces: `Code` model `{event, code, seatNumber, assignedAt}` with unique `{event, code}` index. `Seat` model `{event, seatNumber, status: 'available'|'assigned', code}` with unique `{event, seatNumber}` index. `createSeatPool(eventId, size)` and `createCodes(eventId, codeStrings)` from `eventSetup.service.js` — both used by Task 7 (admin event creation) and Task 9 (seed script).

- [ ] **Step 1: Write the failing test — `backend/tests/services/eventSetup.test.js`**

```js
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { Event } from '../../src/models/Event.js';
import { Seat } from '../../src/models/Seat.js';
import { Code } from '../../src/models/Code.js';
import { createSeatPool, createCodes } from '../../src/services/eventSetup.service.js';

beforeAll(startTestDb, 30000);
afterAll(stopTestDb);
afterEach(clearTestDb);

async function makeEvent() {
  return Event.create({ name: 'Test Event', eventDate: new Date(), venue: 'Test Venue' });
}

describe('eventSetup.service', () => {
  it('creates a seat pool numbered 1..size, all available', async () => {
    const event = await makeEvent();
    await createSeatPool(event._id, 10);
    const seats = await Seat.find({ event: event._id }).sort({ seatNumber: 1 });
    expect(seats).toHaveLength(10);
    expect(seats.map((s) => s.seatNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(seats.every((s) => s.status === 'available')).toBe(true);
  });

  it('creates codes normalized to uppercase, trimmed', async () => {
    const event = await makeEvent();
    await createCodes(event._id, [' abc123 ', 'xyz789']);
    const codes = await Code.find({ event: event._id }).sort({ code: 1 });
    expect(codes.map((c) => c.code)).toEqual(['ABC123', 'XYZ789']);
  });

  it('rejects duplicate codes within the same event', async () => {
    const event = await makeEvent();
    await createCodes(event._id, ['DUP1']);
    await expect(createCodes(event._id, ['DUP1'])).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd backend && npx vitest run tests/services/eventSetup.test.js`
Expected: FAIL — models/service don't exist.

- [ ] **Step 3: Create `backend/src/models/Code.js`**

```js
import { Schema, model } from 'mongoose';

const codeSchema = new Schema({
  event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  seatNumber: { type: Number, default: null },
  assignedAt: { type: Date, default: null },
}, { timestamps: true });

codeSchema.index({ event: 1, code: 1 }, { unique: true });

export const Code = model('Code', codeSchema);
```

- [ ] **Step 4: Create `backend/src/models/Seat.js`**

```js
import { Schema, model } from 'mongoose';

const seatSchema = new Schema({
  event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  seatNumber: { type: Number, required: true, min: 1, max: 100 },
  status: { type: String, enum: ['available', 'assigned'], default: 'available' },
  code: { type: Schema.Types.ObjectId, ref: 'Code', default: null },
}, { timestamps: true });

seatSchema.index({ event: 1, seatNumber: 1 }, { unique: true });

export const Seat = model('Seat', seatSchema);
```

- [ ] **Step 5: Create `backend/src/services/eventSetup.service.js`**

```js
import { Seat } from '../models/Seat.js';
import { Code } from '../models/Code.js';

export async function createSeatPool(eventId, size = 100) {
  const seats = Array.from({ length: size }, (_, i) => ({
    event: eventId,
    seatNumber: i + 1,
  }));
  return Seat.insertMany(seats, { ordered: true });
}

export async function createCodes(eventId, codeStrings) {
  const docs = codeStrings.map((code) => ({ event: eventId, code: code.trim().toUpperCase() }));
  return Code.insertMany(docs, { ordered: true });
}
```

- [ ] **Step 6: Run test, verify it passes**

Run: `cd backend && npx vitest run tests/services/eventSetup.test.js`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add backend/src/models/Code.js backend/src/models/Seat.js backend/src/services/eventSetup.service.js backend/tests/services/eventSetup.test.js
git commit -m "feat: add Code/Seat models and seat-pool setup service"
```

---

### Task 4: Atomic seat assignment service (the critical invariant)

**Files:**
- Create: `backend/src/services/seatAssignment.service.js`
- Test: `backend/tests/services/seatAssignment.test.js`

**Interfaces:**
- Consumes: `Code`, `Seat` models (Task 3), `ApiError` (Task 1), `createSeatPool`/`createCodes` (Task 3), test DB helper (Task 2).
- Produces: `redeemCode(eventId, rawCode) → Promise<{seatNumber: number, code: string}>` — throws `ApiError(404, 'CODE_NOT_FOUND', ...)` for an unrecognized code, `ApiError(409, 'SEATS_FULL', ...)` if the pool is exhausted. Used by Task 5's guest controller.

- [ ] **Step 1: Write the failing test — `backend/tests/services/seatAssignment.test.js`**

```js
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { Event } from '../../src/models/Event.js';
import { Seat } from '../../src/models/Seat.js';
import { createSeatPool, createCodes } from '../../src/services/eventSetup.service.js';
import { redeemCode } from '../../src/services/seatAssignment.service.js';

beforeAll(startTestDb, 30000);
afterAll(stopTestDb);
afterEach(clearTestDb);

async function makeEventWithPool(poolSize, codeCount) {
  const event = await Event.create({ name: 'Test Event', eventDate: new Date(), venue: 'V' });
  await createSeatPool(event._id, poolSize);
  const codes = Array.from({ length: codeCount }, (_, i) => `CODE${i + 1}`);
  await createCodes(event._id, codes);
  return { event, codes };
}

describe('redeemCode', () => {
  it('assigns the lowest available seat to a fresh code', async () => {
    const { event } = await makeEventWithPool(5, 1);
    const result = await redeemCode(event._id, 'code1');
    expect(result.seatNumber).toBe(1);
  });

  it('returns the same seat on repeat redemption without consuming another seat', async () => {
    const { event } = await makeEventWithPool(5, 1);
    const first = await redeemCode(event._id, 'CODE1');
    const second = await redeemCode(event._id, 'CODE1');
    expect(second.seatNumber).toBe(first.seatNumber);
    const assignedCount = await Seat.countDocuments({ event: event._id, status: 'assigned' });
    expect(assignedCount).toBe(1);
  });

  it('throws CODE_NOT_FOUND for an unrecognized code', async () => {
    const { event } = await makeEventWithPool(5, 1);
    await expect(redeemCode(event._id, 'NOPE')).rejects.toMatchObject({ code: 'CODE_NOT_FOUND' });
  });

  it('never assigns the same seat to two concurrent distinct codes', async () => {
    const { event, codes } = await makeEventWithPool(5, 5);
    const results = await Promise.all(codes.map((c) => redeemCode(event._id, c)));
    const seatNumbers = results.map((r) => r.seatNumber).sort((a, b) => a - b);
    expect(seatNumbers).toEqual([1, 2, 3, 4, 5]);
    expect(new Set(seatNumbers).size).toBe(5);
  });

  it('throws SEATS_FULL once the pool is exhausted', async () => {
    const { event, codes } = await makeEventWithPool(2, 3);
    await Promise.all(codes.slice(0, 2).map((c) => redeemCode(event._id, c)));
    await expect(redeemCode(event._id, codes[2])).rejects.toMatchObject({ code: 'SEATS_FULL' });
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd backend && npx vitest run tests/services/seatAssignment.test.js`
Expected: FAIL — `seatAssignment.service.js` does not exist.

- [ ] **Step 3: Create `backend/src/services/seatAssignment.service.js`**

```js
import mongoose from 'mongoose';
import { Code } from '../models/Code.js';
import { Seat } from '../models/Seat.js';
import { ApiError } from '../middleware/errorHandler.js';

export async function redeemCode(eventId, rawCode) {
  const normalized = rawCode.trim().toUpperCase();

  const existing = await Code.findOne({ event: eventId, code: normalized });
  if (!existing) {
    throw new ApiError(
      404,
      'CODE_NOT_FOUND',
      "That code doesn't match an invitation. Double-check the card and try again."
    );
  }
  if (existing.seatNumber) {
    return { seatNumber: existing.seatNumber, code: existing.code };
  }

  const session = await mongoose.startSession();
  try {
    let seatNumber;
    await session.withTransaction(async () => {
      const code = await Code.findOne({ _id: existing._id }).session(session);
      if (code.seatNumber) {
        seatNumber = code.seatNumber;
        return;
      }
      const seat = await Seat.findOneAndUpdate(
        { event: eventId, status: 'available' },
        { $set: { status: 'assigned', code: code._id } },
        { sort: { seatNumber: 1 }, new: true, session }
      );
      if (!seat) {
        throw new ApiError(409, 'SEATS_FULL', 'All seats are taken.');
      }
      code.seatNumber = seat.seatNumber;
      code.assignedAt = new Date();
      await code.save({ session });
      seatNumber = seat.seatNumber;
    });
    return { seatNumber, code: normalized };
  } finally {
    await session.endSession();
  }
}
```

`session.withTransaction` retries the whole callback automatically on a `TransientTransactionError` (MongoDB write conflict), so two concurrent redemptions of the *same* code are also safe — one transaction commits, the other retries and finds `code.seatNumber` already set on re-read.

- [ ] **Step 4: Run test, verify it passes**

Run: `cd backend && npx vitest run tests/services/seatAssignment.test.js`
Expected: PASS — including the concurrency test.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/seatAssignment.service.js backend/tests/services/seatAssignment.test.js
git commit -m "feat: atomic seat assignment service"
```

---

### Task 5: Drink model + guest redemption API

**Files:**
- Create: `backend/src/models/Drink.js`
- Create: `backend/src/controllers/guest.controller.js`
- Create: `backend/src/routes/guest.routes.js`
- Modify: `backend/src/app.js` — mount `guestRouter`
- Test: `backend/tests/routes/guest.test.js`

**Interfaces:**
- Consumes: `Event` (Task 2), `redeemCode` (Task 4), `ApiError` (Task 1).
- Produces: `Drink` model `{event, category, name, price, order}`. `POST /api/guest/redeem` — body `{code}`, success `200 {event, seatNumber, drinks}`, `400 CODE_REQUIRED`, `404 CODE_NOT_FOUND`, `503 NO_ACTIVE_EVENT`.

- [ ] **Step 1: Write the failing test — `backend/tests/routes/guest.test.js`**

```js
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { Event } from '../../src/models/Event.js';
import { Drink } from '../../src/models/Drink.js';
import { createSeatPool, createCodes } from '../../src/services/eventSetup.service.js';

beforeAll(startTestDb, 30000);
afterAll(stopTestDb);
afterEach(clearTestDb);

async function seedActiveEvent() {
  const event = await Event.create({
    name: 'One Year Anniversary', eventDate: new Date(), venue: 'Hangover Lounge', isActive: true,
  });
  await createSeatPool(event._id, 5);
  await createCodes(event._id, ['GOOD1']);
  await Drink.create({ event: event._id, category: 'Whisky', name: 'Glenfiddich 18 Years', price: 300000, order: 0 });
  return event;
}

describe('POST /api/guest/redeem', () => {
  it('assigns a seat and returns event + drinks for a valid code', async () => {
    await seedActiveEvent();
    const app = createApp();
    const res = await request(app).post('/api/guest/redeem').send({ code: 'good1' });
    expect(res.status).toBe(200);
    expect(res.body.seatNumber).toBe(1);
    expect(res.body.event.name).toBe('One Year Anniversary');
    expect(res.body.drinks).toHaveLength(1);
  });

  it('returns 404 CODE_NOT_FOUND for an unknown code', async () => {
    await seedActiveEvent();
    const app = createApp();
    const res = await request(app).post('/api/guest/redeem').send({ code: 'NOPE' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('CODE_NOT_FOUND');
  });

  it('returns 400 CODE_REQUIRED when code is missing', async () => {
    await seedActiveEvent();
    const app = createApp();
    const res = await request(app).post('/api/guest/redeem').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CODE_REQUIRED');
  });

  it('returns 503 NO_ACTIVE_EVENT when no event is active', async () => {
    const app = createApp();
    const res = await request(app).post('/api/guest/redeem').send({ code: 'ANY' });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('NO_ACTIVE_EVENT');
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd backend && npx vitest run tests/routes/guest.test.js`
Expected: FAIL — route/model don't exist.

- [ ] **Step 3: Create `backend/src/models/Drink.js`**

```js
import { Schema, model } from 'mongoose';

const drinkSchema = new Schema({
  event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  category: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  order: { type: Number, default: 0 },
}, { timestamps: true });

export const Drink = model('Drink', drinkSchema);
```

- [ ] **Step 4: Create `backend/src/controllers/guest.controller.js`**

```js
import { Event } from '../models/Event.js';
import { Drink } from '../models/Drink.js';
import { redeemCode } from '../services/seatAssignment.service.js';
import { ApiError } from '../middleware/errorHandler.js';

export async function redeem(req, res, next) {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      throw new ApiError(400, 'CODE_REQUIRED', 'Enter your invitation code.');
    }
    const event = await Event.findOne({ isActive: true });
    if (!event) {
      throw new ApiError(503, 'NO_ACTIVE_EVENT', 'No event is open for check-in right now.');
    }
    const { seatNumber } = await redeemCode(event._id, code);
    const drinks = await Drink.find({ event: event._id }).sort({ order: 1 });
    res.json({
      event: { name: event.name, tagline: event.tagline, eventDate: event.eventDate, venue: event.venue },
      seatNumber,
      drinks: drinks.map((d) => ({ category: d.category, name: d.name, price: d.price })),
    });
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 5: Create `backend/src/routes/guest.routes.js`**

```js
import { Router } from 'express';
import { redeem } from '../controllers/guest.controller.js';

export const guestRouter = Router();
guestRouter.post('/redeem', redeem);
```

- [ ] **Step 6: Modify `backend/src/app.js`** — add the import and mount line

```js
import { guestRouter } from './routes/guest.routes.js';
```

```js
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/guest', guestRouter);
```

- [ ] **Step 7: Run test, verify it passes**

Run: `cd backend && npx vitest run tests/routes/guest.test.js`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add backend/src/models/Drink.js backend/src/controllers/guest.controller.js backend/src/routes/guest.routes.js backend/src/app.js backend/tests/routes/guest.test.js
git commit -m "feat: guest redemption API"
```

---

### Task 6: Admin auth (shared password + JWT)

**Files:**
- Create: `backend/src/controllers/auth.controller.js`
- Create: `backend/src/routes/auth.routes.js`
- Create: `backend/src/middleware/requireAdmin.js`
- Modify: `backend/src/app.js` — mount `authRouter`
- Test: `backend/tests/routes/auth.test.js`

**Interfaces:**
- Consumes: `env` (Task 1), `ApiError` (Task 1).
- Produces: `POST /api/admin/auth/login` — body `{password}`, success `200 {token}`, failure `401 INVALID_PASSWORD`. `requireAdmin` middleware — `401 UNAUTHORIZED` on missing/invalid Bearer token, else `next()`. Used by Task 7/8's admin routes.

- [ ] **Step 1: Write the failing test — `backend/tests/routes/auth.test.js`**

```js
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app.js';
import { env } from '../../src/config/env.js';

describe('POST /api/admin/auth/login', () => {
  it('returns a token for the correct password', async () => {
    const app = createApp();
    const res = await request(app).post('/api/admin/auth/login').send({ password: env.adminPassword });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(() => jwt.verify(res.body.token, env.jwtSecret)).not.toThrow();
  });

  it('returns 401 for the wrong password', async () => {
    const app = createApp();
    const res = await request(app).post('/api/admin/auth/login').send({ password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_PASSWORD');
  });
});

describe('requireAdmin middleware (via a protected admin route)', () => {
  it('rejects requests with no token', async () => {
    const app = createApp();
    const res = await request(app).get('/api/admin/events');
    expect(res.status).toBe(401);
  });

  it('allows requests with a valid token', async () => {
    const app = createApp();
    const login = await request(app).post('/api/admin/auth/login').send({ password: env.adminPassword });
    const res = await request(app).get('/api/admin/events').set('Authorization', `Bearer ${login.body.token}`);
    expect(res.status).not.toBe(401);
  });
});
```

Note: the last two tests reference `GET /api/admin/events`, which Task 7 adds. This test file is extended, not fully runnable, until Task 7 lands — run only the first two `describe` blocks' tests until then, or write this file now and skip (`.skip`) the last `describe` block, un-skipping it in Task 7.

- [ ] **Step 2: Adjust the test file to skip the not-yet-existing route** — wrap the second `describe` block in `describe.skip(...)` for now; Task 7 will change it back to `describe(...)`.

- [ ] **Step 3: Run test, verify it fails**

Run: `cd backend && npx vitest run tests/routes/auth.test.js`
Expected: FAIL — route doesn't exist yet.

- [ ] **Step 4: Create `backend/src/controllers/auth.controller.js`**

```js
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
```

- [ ] **Step 5: Create `backend/src/routes/auth.routes.js`**

```js
import { Router } from 'express';
import { login } from '../controllers/auth.controller.js';

export const authRouter = Router();
authRouter.post('/login', login);
```

- [ ] **Step 6: Create `backend/src/middleware/requireAdmin.js`**

```js
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from './errorHandler.js';

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new ApiError(401, 'UNAUTHORIZED', 'Missing token.'));
  try {
    jwt.verify(token, env.jwtSecret);
    next();
  } catch {
    next(new ApiError(401, 'UNAUTHORIZED', 'Invalid or expired token.'));
  }
}
```

- [ ] **Step 7: Modify `backend/src/app.js`** — add import and mount line

```js
import { authRouter } from './routes/auth.routes.js';
```

```js
  app.use('/api/guest', guestRouter);
  app.use('/api/admin/auth', authRouter);
```

- [ ] **Step 8: Run test, verify the first two `describe` blocks pass** (the skipped one stays pending)

Run: `cd backend && npx vitest run tests/routes/auth.test.js`
Expected: PASS (2 tests), 2 skipped.

- [ ] **Step 9: Commit**

```bash
git add backend/src/controllers/auth.controller.js backend/src/routes/auth.routes.js backend/src/middleware/requireAdmin.js backend/src/app.js backend/tests/routes/auth.test.js
git commit -m "feat: admin auth (shared password + JWT)"
```

---

### Task 7: Admin event and seat-status endpoints

**Files:**
- Create: `backend/src/controllers/admin.controller.js`
- Create: `backend/src/routes/admin.routes.js`
- Modify: `backend/src/app.js` — mount `adminRouter`
- Modify: `backend/tests/routes/auth.test.js` — un-skip the protected-route `describe` block
- Test: `backend/tests/routes/admin.events.test.js`

**Interfaces:**
- Consumes: `Event`, `Seat`, `Code` models, `createSeatPool`/`createCodes` (Task 3), `requireAdmin` (Task 6).
- Produces: `POST /api/admin/events` (create event + seed pool + codes), `GET /api/admin/events` (list), `POST /api/admin/events/:id/activate` (deactivate all, activate one), `GET /api/admin/events/:eventId/seats` (status list). All behind `requireAdmin`.

- [ ] **Step 1: Un-skip the protected-route test** — in `backend/tests/routes/auth.test.js`, change `describe.skip('requireAdmin middleware...` back to `describe('requireAdmin middleware...`.

- [ ] **Step 2: Write the failing test — `backend/tests/routes/admin.events.test.js`**

```js
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { env } from '../../src/config/env.js';
import { Event } from '../../src/models/Event.js';

beforeAll(startTestDb, 30000);
afterAll(stopTestDb);
afterEach(clearTestDb);

async function adminToken(app) {
  const res = await request(app).post('/api/admin/auth/login').send({ password: env.adminPassword });
  return res.body.token;
}

describe('Admin events API', () => {
  it('creates an event with a 100-seat pool and given codes', async () => {
    const app = createApp();
    const token = await adminToken(app);
    const res = await request(app)
      .post('/api/admin/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'One Year Anniversary',
        eventDate: '2026-09-11T18:00:00+01:00',
        venue: 'Hangover Lounge, Umuahia',
        codes: ['HL001', 'HL002'],
      });
    expect(res.status).toBe(201);

    const seatsRes = await request(app)
      .get(`/api/admin/events/${res.body.id}/seats`)
      .set('Authorization', `Bearer ${token}`);
    expect(seatsRes.body).toHaveLength(100);
    expect(seatsRes.body.every((s) => s.status === 'available')).toBe(true);
  });

  it('rejects event creation without codes', async () => {
    const app = createApp();
    const token = await adminToken(app);
    const res = await request(app)
      .post('/api/admin/events')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'X', eventDate: new Date(), venue: 'V', codes: [] });
    expect(res.status).toBe(400);
  });

  it('activating one event deactivates all others', async () => {
    const app = createApp();
    const token = await adminToken(app);
    const a = await Event.create({ name: 'A', eventDate: new Date(), venue: 'V', isActive: true });
    const b = await Event.create({ name: 'B', eventDate: new Date(), venue: 'V', isActive: false });

    await request(app).post(`/api/admin/events/${b._id}/activate`).set('Authorization', `Bearer ${token}`);

    expect((await Event.findById(a._id)).isActive).toBe(false);
    expect((await Event.findById(b._id)).isActive).toBe(true);
  });
});
```

- [ ] **Step 3: Run test, verify it fails**

Run: `cd backend && npx vitest run tests/routes/admin.events.test.js tests/routes/auth.test.js`
Expected: FAIL — admin routes don't exist yet.

- [ ] **Step 4: Create `backend/src/controllers/admin.controller.js`**

```js
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
```

- [ ] **Step 5: Create `backend/src/routes/admin.routes.js`**

```js
import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { createEvent, activateEvent, listEvents, seatStatus } from '../controllers/admin.controller.js';

export const adminRouter = Router();
adminRouter.use(requireAdmin);

adminRouter.post('/events', createEvent);
adminRouter.get('/events', listEvents);
adminRouter.post('/events/:id/activate', activateEvent);
adminRouter.get('/events/:eventId/seats', seatStatus);
```

- [ ] **Step 6: Modify `backend/src/app.js`** — add import and mount line

```js
import { adminRouter } from './routes/admin.routes.js';
```

```js
  app.use('/api/admin/auth', authRouter);
  app.use('/api/admin', adminRouter);
```

- [ ] **Step 7: Run tests, verify they pass**

Run: `cd backend && npx vitest run tests/routes/admin.events.test.js tests/routes/auth.test.js`
Expected: PASS, no skipped tests remaining.

- [ ] **Step 8: Commit**

```bash
git add backend/src/controllers/admin.controller.js backend/src/routes/admin.routes.js backend/src/app.js backend/tests/routes/admin.events.test.js backend/tests/routes/auth.test.js
git commit -m "feat: admin event and seat-status endpoints"
```

---

### Task 8: Admin drinks CRUD endpoints

**Files:**
- Create: `backend/src/controllers/adminDrinks.controller.js`
- Modify: `backend/src/routes/admin.routes.js` — add drink routes
- Test: `backend/tests/routes/admin.drinks.test.js`

**Interfaces:**
- Consumes: `Drink` model (Task 5), `requireAdmin` (Task 6), `ApiError` (Task 1).
- Produces: `GET /api/admin/events/:eventId/drinks`, `POST /api/admin/events/:eventId/drinks`, `PUT /api/admin/drinks/:id`, `DELETE /api/admin/drinks/:id` — all behind `requireAdmin`.

- [ ] **Step 1: Write the failing test — `backend/tests/routes/admin.drinks.test.js`**

```js
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { env } from '../../src/config/env.js';
import { Event } from '../../src/models/Event.js';

beforeAll(startTestDb, 30000);
afterAll(stopTestDb);
afterEach(clearTestDb);

async function adminToken(app) {
  const res = await request(app).post('/api/admin/auth/login').send({ password: env.adminPassword });
  return res.body.token;
}

describe('Admin drinks API', () => {
  it('creates, lists, updates, and deletes a drink', async () => {
    const app = createApp();
    const token = await adminToken(app);
    const event = await Event.create({ name: 'E', eventDate: new Date(), venue: 'V' });
    const auth = { Authorization: `Bearer ${token}` };

    const created = await request(app)
      .post(`/api/admin/events/${event._id}/drinks`)
      .set(auth)
      .send({ category: 'Whisky', name: 'Glenfiddich 18 Years', price: 300000, order: 0 });
    expect(created.status).toBe(201);

    const list = await request(app).get(`/api/admin/events/${event._id}/drinks`).set(auth);
    expect(list.body).toHaveLength(1);

    const updated = await request(app)
      .put(`/api/admin/drinks/${created.body._id}`)
      .set(auth)
      .send({ price: 350000 });
    expect(updated.body.price).toBe(350000);

    const deleted = await request(app).delete(`/api/admin/drinks/${created.body._id}`).set(auth);
    expect(deleted.status).toBe(204);

    const listAfter = await request(app).get(`/api/admin/events/${event._id}/drinks`).set(auth);
    expect(listAfter.body).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd backend && npx vitest run tests/routes/admin.drinks.test.js`
Expected: FAIL — routes don't exist yet.

- [ ] **Step 3: Create `backend/src/controllers/adminDrinks.controller.js`**

```js
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
```

- [ ] **Step 4: Modify `backend/src/routes/admin.routes.js`** — add import and routes

```js
import { listDrinks, createDrink, updateDrink, deleteDrink } from '../controllers/adminDrinks.controller.js';
```

```js
adminRouter.get('/events/:eventId/seats', seatStatus);

adminRouter.get('/events/:eventId/drinks', listDrinks);
adminRouter.post('/events/:eventId/drinks', createDrink);
adminRouter.put('/drinks/:id', updateDrink);
adminRouter.delete('/drinks/:id', deleteDrink);
```

- [ ] **Step 5: Run test, verify it passes**

Run: `cd backend && npx vitest run tests/routes/admin.drinks.test.js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/controllers/adminDrinks.controller.js backend/src/routes/admin.routes.js backend/tests/routes/admin.drinks.test.js
git commit -m "feat: admin drinks CRUD"
```

---

### Task 9: Seed script for the real event

**Files:**
- Create: `backend/src/scripts/seed.js`

**Interfaces:**
- Consumes: `connectDb`/`disconnectDb` (Task 1), `Event` (Task 2), `createSeatPool`/`createCodes` (Task 3), `Drink` (Task 5).
- Produces: a one-off script run via `npm run seed` that seeds the real "One Year Anniversary" event, drinks (from `hangover_data.txt`, UTF-8 corrected), and 100 dev-placeholder codes (`HL001`–`HL100`) — the real printed-card codes will be loaded later via the admin `POST /api/admin/events` endpoint (Task 7) once they're finalized.

- [ ] **Step 1: Create `backend/src/scripts/seed.js`**

```js
import { connectDb, disconnectDb } from '../config/db.js';
import { Event } from '../models/Event.js';
import { createSeatPool, createCodes } from '../services/eventSetup.service.js';
import { Drink } from '../models/Drink.js';

const DRINKS = [
  { category: 'Whisky', name: 'Glenfiddich 18 Years', price: 300000 },
  { category: 'Whisky', name: 'Glenfiddich 21 Years', price: 800000 },
  { category: 'Tequila', name: 'Casamigos Tequila', price: 300000 },
  { category: 'Tequila', name: 'Don Julio', price: 800000 },
  { category: 'Tequila', name: 'Azul', price: 800000 },
  { category: 'Champagne & Sparkling', name: 'Moët Brut', price: 300000 },
  { category: 'Champagne & Sparkling', name: 'Moët Rosé', price: 300000 },
];

function generateDevCodes(count) {
  return Array.from({ length: count }, (_, i) => `HL${String(i + 1).padStart(3, '0')}`);
}

async function main() {
  await connectDb();
  await Event.updateMany({}, { isActive: false });
  const event = await Event.create({
    name: 'One Year Anniversary',
    tagline: 'Music · Hype · Baddies',
    eventDate: new Date('2026-09-11T18:00:00+01:00'),
    venue: 'Hangover Lounge, beside Chaise World Hotel, Umuahia, Abia State',
    isActive: true,
  });
  await createSeatPool(event._id, 100);
  await createCodes(event._id, generateDevCodes(100));
  await Drink.insertMany(DRINKS.map((d, i) => ({ ...d, event: event._id, order: i })));
  console.log(`Seeded event ${event._id} with 100 codes/seats and ${DRINKS.length} drinks.`);
  await disconnectDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Run it against the real database**

Run: `cd backend && npm run seed`
Expected: prints `Seeded event <id> with 100 codes/seats and 7 drinks.` — verify in MongoDB Atlas (or `mongosh`) that `events`, `seats`, `codes`, and `drinks` collections are populated.

- [ ] **Step 3: Commit**

```bash
git add backend/src/scripts/seed.js
git commit -m "feat: seed script for the One Year Anniversary event"
```

---

## Self-Review Notes

- Seat atomicity: proven by Task 4's concurrency test (5 concurrent distinct codes → 5 unique seats, no collisions).
- Idempotent repeat redemption: proven by Task 4's second test.
- No personal data: no name/email/phone field exists on any model.
- Event reusability: `Event` is a first-class model with `isActive`; Task 7's `activateEvent` swaps the active event without code changes.
- Secrets: never written to a tracked file — `.env` is gitignored from Task 1, step 4/5, before any secret is written to it in step 16.
- Real printed-card codes: not yet known at plan-writing time — the seed script uses generated dev placeholders; production codes load via the admin API once finalized.
