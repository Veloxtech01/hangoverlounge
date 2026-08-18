# QR Table Invitation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the shared-QR + invitation-code + seat-allocation system with 50 permanent per-table QR codes that link directly to a table number and show that table's invitation with zero guest input.

**Architecture:** Each table's QR encodes `/invitation/:tableNumber`. `GuestInvitation.jsx` fetches `GET /api/guest/table/:tableNumber` on mount; the backend validates the number against a `MAX_TABLES` env var, resolves the currently-active `Event`, and returns either `{ active: false }` (holding screen) or the event + drinks payload. The `Code`/`Seat` models, seat-assignment service, and all admin UI for codes/seats are deleted outright — tables carry no managed state.

**Tech Stack:** Express 4 / Mongoose 8 / vitest 4 / supertest (backend); React 19 / react-router-dom 7 / vitest 4 / @testing-library/react (frontend). No new dependencies.

## Global Constraints

- No new dependencies — this plan only removes/rearranges existing code.
- Follow existing per-file conventions exactly: `GuestInvitation.jsx` uses Tailwind theme tokens (`text-gold`, `bg-black`, `text-text-muted`, ...); other guest/admin pages use raw hex classes (`#1A1310`, `#F0E3CC`, ...). Do not unify them — match whichever file you're editing.
- Response shape convention: errors are `{ error: { code, message } }` via `ApiError`/`errorHandler.js`; keep using that, don't invent a new error shape.
- `backend/.env` is git-ignored and already exists on disk with real values — edit it directly rather than asking the user to.
- Default to no code comments; only add one where a non-obvious constraint would otherwise be lost.
- Do not touch the leaked-looking duplicate credential block at the bottom of `backend/.env.example` (lines 7-9) — out of scope for this plan; only add the one new line described in Task 1.

---

### Task 1: Add the `MAX_TABLES` env var

**Files:**
- Modify: `backend/src/config/env.js`
- Modify: `backend/.env` (local, git-ignored)
- Modify: `backend/.env.example`

**Interfaces:**
- Produces: `env.maxTables` (a positive integer), consumed by Task 2's controller.

- [ ] **Step 1: Add `MAX_TABLES` to the required env vars and parse it**

Edit `backend/src/config/env.js`:

```js
import 'dotenv/config';

const required = ['MONGODB_URI', 'ADMIN_PASSWORD', 'JWT_SECRET', 'MAX_TABLES'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

const maxTables = Number(process.env.MAX_TABLES);
if (!Number.isInteger(maxTables) || maxTables < 1) {
  throw new Error('MAX_TABLES must be a positive integer.');
}

export const env = {
  port: Number(process.env.PORT) || 4000,
  mongodbUri: process.env.MONGODB_URI,
  adminPassword: process.env.ADMIN_PASSWORD,
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV || 'development',
  maxTables,
};
```

- [ ] **Step 2: Add the var to the local `.env` so the dev server and test suite can start**

Edit `backend/.env`, appending a new line after `NODE_ENV=development`:

```
MAX_TABLES=50
```

- [ ] **Step 3: Add the var to the example file**

Edit `backend/.env.example`, inserting a line after `NODE_ENV=development` (the first occurrence, line 5) so the top block reads:

```
PORT=4000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/hangoverlounge
ADMIN_PASSWORD=changeme
JWT_SECRET=change-this-to-a-long-random-string
NODE_ENV=development
MAX_TABLES=50
```

Leave the rest of the file (the duplicate credential block below it) untouched.

- [ ] **Step 4: Verify the backend still boots**

Run: `cd backend && npm run dev`
Expected: server starts and logs listening on the configured port, no `Missing required env var` error. Stop it with Ctrl+C once confirmed.

- [ ] **Step 5: Commit**

```bash
git add backend/src/config/env.js backend/.env.example
git commit -m "feat: add MAX_TABLES env var for table-number validation"
```

(`backend/.env` is git-ignored and won't be staged.)

---

### Task 2: Replace guest code redemption with table lookup

**Files:**
- Modify: `backend/src/controllers/guest.controller.js`
- Modify: `backend/src/routes/guest.routes.js`
- Modify: `backend/tests/routes/guest.test.js`

**Interfaces:**
- Produces: `GET /api/guest/table/:tableNumber` → `200 { active: true, tableNumber, event: { name, tagline, eventDate, venue }, drinks: [{ category, name, price }] }` when an event is active; `200 { active: false }` when none is active; `400 { error: { code: 'INVALID_TABLE_NUMBER', message } }` for a non-integer or out-of-range table number.
- Consumes: `env.maxTables` from Task 1.

- [ ] **Step 1: Rewrite the test file with failing tests for the new endpoint**

Replace the full contents of `backend/tests/routes/guest.test.js`:

```js
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { Event } from '../../src/models/Event.js';
import { Drink } from '../../src/models/Drink.js';

beforeAll(startTestDb, 30000);
afterAll(stopTestDb);
afterEach(clearTestDb);

async function seedActiveEvent() {
  const event = await Event.create({
    name: 'One Year Anniversary', eventDate: new Date(), venue: 'Hangover Lounge', isActive: true,
  });
  await Drink.create({ event: event._id, category: 'Whisky', name: 'Glenfiddich 18 Years', price: 300000, order: 0 });
  return event;
}

describe('GET /api/guest/table/:tableNumber', () => {
  it('returns event + drinks for a valid table when an event is active', async () => {
    await seedActiveEvent();
    const app = createApp();
    const res = await request(app).get('/api/guest/table/7');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      active: true,
      tableNumber: 7,
      event: { name: 'One Year Anniversary', tagline: '', eventDate: expect.any(String), venue: 'Hangover Lounge' },
      drinks: [{ category: 'Whisky', name: 'Glenfiddich 18 Years', price: 300000 }],
    });
  });

  it('returns { active: false } when no event is active', async () => {
    const app = createApp();
    const res = await request(app).get('/api/guest/table/7');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ active: false });
  });

  it('returns 400 INVALID_TABLE_NUMBER for a table number above MAX_TABLES', async () => {
    const app = createApp();
    const res = await request(app).get('/api/guest/table/9999');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_TABLE_NUMBER');
  });

  it('returns 400 INVALID_TABLE_NUMBER for a non-numeric table number', async () => {
    const app = createApp();
    const res = await request(app).get('/api/guest/table/abc');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_TABLE_NUMBER');
  });

  it('returns 400 INVALID_TABLE_NUMBER for table 0', async () => {
    const app = createApp();
    const res = await request(app).get('/api/guest/table/0');
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `cd backend && npx vitest run tests/routes/guest.test.js`
Expected: FAIL — `GET /api/guest/table/7` 404s because the route doesn't exist yet.

- [ ] **Step 3: Replace the controller**

Replace the full contents of `backend/src/controllers/guest.controller.js`:

```js
import { Event } from '../models/Event.js';
import { Drink } from '../models/Drink.js';
import { ApiError } from '../middleware/errorHandler.js';
import { env } from '../config/env.js';

export async function getTableInvitation(req, res, next) {
  try {
    const tableNumber = Number(req.params.tableNumber);
    if (!Number.isInteger(tableNumber) || tableNumber < 1 || tableNumber > env.maxTables) {
      throw new ApiError(
        400,
        'INVALID_TABLE_NUMBER',
        `Table number must be between 1 and ${env.maxTables}.`
      );
    }

    const event = await Event.findOne({ isActive: true });
    if (!event) {
      res.json({ active: false });
      return;
    }

    const drinks = await Drink.find({ event: event._id }).sort({ order: 1 });
    res.json({
      active: true,
      tableNumber,
      event: { name: event.name, tagline: event.tagline, eventDate: event.eventDate, venue: event.venue },
      drinks: drinks.map((d) => ({ category: d.category, name: d.name, price: d.price })),
    });
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 4: Replace the route**

Replace the full contents of `backend/src/routes/guest.routes.js`:

```js
import { Router } from 'express';
import { getTableInvitation } from '../controllers/guest.controller.js';

export const guestRouter = Router();
guestRouter.get('/table/:tableNumber', getTableInvitation);
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `cd backend && npx vitest run tests/routes/guest.test.js`
Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```bash
git add backend/src/controllers/guest.controller.js backend/src/routes/guest.routes.js backend/tests/routes/guest.test.js
git commit -m "feat: replace guest code redemption with table-number lookup"
```

---

### Task 3: Remove the invitation-code/seat-allocation system

**Files:**
- Delete: `backend/src/models/Code.js`
- Delete: `backend/src/models/Seat.js`
- Delete: `backend/src/services/seatAssignment.service.js`
- Delete: `backend/src/services/eventSetup.service.js`
- Delete: `backend/src/scripts/regenerateCodes.js`
- Delete: `backend/tests/services/seatAssignment.test.js`
- Delete: `backend/tests/services/eventSetup.test.js`
- Delete: `backend/tests/routes/admin.codes.test.js`
- Delete: `backend/tests/routes/admin.seats.test.js`
- Modify: `backend/src/controllers/admin.controller.js`
- Modify: `backend/src/routes/admin.routes.js`
- Modify: `backend/src/scripts/seed.js`
- Modify: `backend/package.json`
- Modify: `backend/tests/routes/admin.events.test.js`

**Interfaces:**
- Produces: `createEvent` now returns `201 { id }` only (no `codes`); `POST /api/admin/events` no longer accepts/needs `codeCount`.
- Removes: `admin.controller.js`'s `seatStatus`, `unassignSeat`, `listCodes`; routes `GET /events/:eventId/seats`, `POST /events/:eventId/seats/:seatNumber/unassign`, `GET /events/:eventId/codes`.

- [ ] **Step 1: Delete the models, services, and script**

```bash
git rm backend/src/models/Code.js backend/src/models/Seat.js backend/src/services/seatAssignment.service.js backend/src/services/eventSetup.service.js backend/src/scripts/regenerateCodes.js
```

- [ ] **Step 2: Delete the tests for the removed code**

```bash
git rm backend/tests/services/seatAssignment.test.js backend/tests/services/eventSetup.test.js backend/tests/routes/admin.codes.test.js backend/tests/routes/admin.seats.test.js
```

- [ ] **Step 3: Simplify the admin controller**

Replace the full contents of `backend/src/controllers/admin.controller.js`:

```js
import { Event } from '../models/Event.js';
import { ApiError } from '../middleware/errorHandler.js';

export async function createEvent(req, res, next) {
  try {
    const { name, tagline, eventDate, venue } = req.body;
    const event = await Event.create({ name, tagline, eventDate, venue, isActive: false });
    res.status(201).json({ id: event._id });
  } catch (err) {
    next(err);
  }
}

export async function activateEvent(req, res, next) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) throw new ApiError(404, 'EVENT_NOT_FOUND', 'Event not found.');
    await Event.updateMany({ _id: { $ne: event._id } }, { isActive: false });
    event.isActive = true;
    await event.save();
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
```

- [ ] **Step 4: Trim the admin routes**

Replace the full contents of `backend/src/routes/admin.routes.js`:

```js
import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { createEvent, activateEvent, listEvents } from '../controllers/admin.controller.js';
import { listDrinks, createDrink, updateDrink, deleteDrink } from '../controllers/adminDrinks.controller.js';

export const adminRouter = Router();
adminRouter.use(requireAdmin);

adminRouter.post('/events', createEvent);
adminRouter.get('/events', listEvents);
adminRouter.post('/events/:id/activate', activateEvent);

adminRouter.get('/events/:eventId/drinks', listDrinks);
adminRouter.post('/events/:eventId/drinks', createDrink);
adminRouter.put('/drinks/:id', updateDrink);
adminRouter.delete('/drinks/:id', deleteDrink);
```

- [ ] **Step 5: Update the seed script to stop creating seats/codes**

Replace the full contents of `backend/src/scripts/seed.js`:

```js
import { connectDb, disconnectDb } from '../config/db.js';
import { Event } from '../models/Event.js';
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
  await Drink.insertMany(DRINKS.map((d, i) => ({ ...d, event: event._id, order: i })));
  console.log(`Seeded event ${event._id} with ${DRINKS.length} drinks.`);
  await disconnectDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 6: Remove the `regenerate-codes` npm script**

Edit `backend/package.json`, removing the `"regenerate-codes"` line from `scripts` so it reads:

```json
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js",
    "test": "vitest run",
    "seed": "node src/scripts/seed.js"
  },
```

- [ ] **Step 7: Rewrite the admin events test to match the simplified `createEvent`**

Replace the full contents of `backend/tests/routes/admin.events.test.js`:

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
  it('creates an event', async () => {
    const app = createApp();
    const token = await adminToken(app);
    const res = await request(app)
      .post('/api/admin/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'One Year Anniversary',
        eventDate: '2026-09-11T18:00:00+01:00',
        venue: 'Hangover Lounge, Umuahia',
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();

    const created = await Event.findById(res.body.id);
    expect(created.name).toBe('One Year Anniversary');
    expect(created.isActive).toBe(false);
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

  it('activating a nonexistent event id returns 404 and leaves the active event untouched', async () => {
    const app = createApp();
    const token = await adminToken(app);
    const a = await Event.create({ name: 'A', eventDate: new Date(), venue: 'V', isActive: true });
    const nonexistentButValidId = '507f1f77bcf86cd799439011';

    const res = await request(app)
      .post(`/api/admin/events/${nonexistentButValidId}/activate`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect((await Event.findById(a._id)).isActive).toBe(true);
  });
});
```

- [ ] **Step 8: Run the full backend test suite**

Run: `cd backend && npm test`
Expected: PASS, with the seat/code test files gone from the run (no failures, no lingering imports of deleted modules).

- [ ] **Step 9: Commit**

```bash
git add -A backend/src backend/tests backend/package.json
git commit -m "refactor: remove invitation-code and seat-allocation system"
```

---

### Task 4: Add `getTableInvitation` to the guest API client

**Files:**
- Modify: `frontend/src/lib/guestApi.js`
- Modify: `frontend/src/lib/guestApi.test.js`

**Interfaces:**
- Produces: `getTableInvitation(tableNumber): Promise<{ active, tableNumber?, event?, drinks? }>`, consumed by Task 5.

- [ ] **Step 1: Write the failing test**

Replace the full contents of `frontend/src/lib/guestApi.test.js`:

```js
import { describe, it, expect, vi } from 'vitest';
import { getTableInvitation } from './guestApi.js';
import { api } from './api.js';

vi.mock('./api.js', () => ({ api: { get: vi.fn() } }));

describe('getTableInvitation', () => {
  it('GETs the table endpoint and returns the response data', async () => {
    api.get.mockResolvedValue({ data: { active: true, tableNumber: 7, event: {}, drinks: [] } });
    const result = await getTableInvitation(7);
    expect(api.get).toHaveBeenCalledWith('/api/guest/table/7');
    expect(result).toEqual({ active: true, tableNumber: 7, event: {}, drinks: [] });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx vitest run src/lib/guestApi.test.js`
Expected: FAIL — `getTableInvitation is not a function` (or similar; `redeemCode` still exists but is unused by the test now).

- [ ] **Step 3: Replace the implementation**

Replace the full contents of `frontend/src/lib/guestApi.js`:

```js
import { api } from './api.js';

export async function getTableInvitation(tableNumber) {
  const { data } = await api.get(`/api/guest/table/${tableNumber}`);
  return data;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd frontend && npx vitest run src/lib/guestApi.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/guestApi.js frontend/src/lib/guestApi.test.js
git commit -m "feat: add getTableInvitation guest API client"
```

---

### Task 5: Rewrite `GuestInvitation.jsx` to fetch by table number

**Files:**
- Modify: `frontend/src/pages/GuestInvitation.jsx`
- Modify: `frontend/src/pages/GuestInvitation.test.jsx`

**Interfaces:**
- Consumes: `getTableInvitation(tableNumber)` from Task 4; route param `tableNumber` from `/invitation/:tableNumber` (wired in Task 6).
- Produces: `GuestInvitation` default export, rendered at `/invitation/:tableNumber` — no more `location.state` dependency.

- [ ] **Step 1: Write the failing tests**

Replace the full contents of `frontend/src/pages/GuestInvitation.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import GuestInvitation from './GuestInvitation.jsx';
import { getTableInvitation } from '../lib/guestApi.js';

vi.mock('../lib/guestApi.js', () => ({ getTableInvitation: vi.fn() }));

function renderAtTable(tableNumber) {
  return render(
    <MemoryRouter initialEntries={[`/invitation/${tableNumber}`]}>
      <Routes>
        <Route path="/invitation/:tableNumber" element={<GuestInvitation />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('GuestInvitation', () => {
  it('fetches by the table number in the URL and renders the invitation', async () => {
    getTableInvitation.mockResolvedValue({
      active: true,
      tableNumber: 7,
      event: {
        name: 'One Year Anniversary',
        tagline: 'Liquid Therapy',
        eventDate: '2026-09-11T18:00:00.000Z',
        venue: 'Hangover Lounge',
      },
      drinks: [{ category: 'Whisky', name: 'Glenfiddich 18 Years', price: 300000 }],
    });
    renderAtTable(7);
    expect(await screen.findByText('Table 007')).toBeInTheDocument();
    expect(screen.getByText(/Glenfiddich 18 Years/)).toBeInTheDocument();
    expect(getTableInvitation).toHaveBeenCalledWith('7');
  });

  it('shows a holding screen without a table number when no event is active', async () => {
    getTableInvitation.mockResolvedValue({ active: false });
    renderAtTable(12);
    expect(await screen.findByText(/no event right now/i)).toBeInTheDocument();
    expect(screen.queryByText(/table 012/i)).not.toBeInTheDocument();
  });

  it('shows a not-recognized message when the table number is invalid', async () => {
    getTableInvitation.mockRejectedValue({ response: { status: 400 } });
    renderAtTable(9999);
    expect(await screen.findByText(/isn't recognized/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd frontend && npx vitest run src/pages/GuestInvitation.test.jsx`
Expected: FAIL — current component reads `location.state`, which is `undefined` at `/invitation/7`, so it redirects instead of fetching.

- [ ] **Step 3: Replace the implementation**

Replace the full contents of `frontend/src/pages/GuestInvitation.jsx`:

```jsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { getTableInvitation } from "../lib/guestApi.js";

const MotionCard = motion.div;

function formatEventDate(value) {
  if (!value) return null;
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(isDateOnly ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  if (isDateOnly) {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
  return date.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
    timeZoneName: "short",
  });
}

function HoldingScreen({ message }) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-black px-6 py-12 text-center">
      <p className="text-sm font-semibold tracking-[0.2em] text-gold [text-shadow:0_0_18px_rgba(250,208,100,0.4)]">
        HANGOVER LOUNGE
      </p>
      <p className="max-w-xs text-sm text-text-muted">{message}</p>
    </div>
  );
}

export default function GuestInvitation() {
  const { tableNumber } = useParams();
  const [status, setStatus] = useState("loading");
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    getTableInvitation(tableNumber)
      .then((data) => {
        if (cancelled) return;
        if (data.active) {
          setPayload(data);
          setStatus("ready");
        } else {
          setStatus("inactive");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("invalid");
      });
    return () => {
      cancelled = true;
    };
  }, [tableNumber]);

  if (status === "loading") {
    return <HoldingScreen message="Loading your invitation…" />;
  }
  if (status === "invalid") {
    return <HoldingScreen message="This table number isn't recognized." />;
  }
  if (status === "inactive") {
    return <HoldingScreen message="No event right now — check back soon." />;
  }

  const { event, tableNumber: table, drinks } = payload;
  const tableLabel = String(table).padStart(3, "0");
  const formattedDate = formatEventDate(event.eventDate);

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center overflow-hidden bg-black px-6 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="h-72 w-72 rounded-full bg-bg-primary/50 blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
        <div className="mb-2 flex items-center gap-3">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 shrink-0 text-gold"
          >
            <path d="M4 4h16" />
            <path d="M4 4l8 8 8-8" />
            <path d="M12 12v8" />
            <path d="M8 20h8" />
          </svg>
          <p className="text-lg font-semibold tracking-[0.2em] text-gold [text-shadow:0_0_18px_rgba(250,208,100,0.4)]">
            HANGOVER LOUNGE
          </p>
        </div>
        <p className="mb-8 text-xs uppercase tracking-[0.35em] text-text-muted">
          Liquid Therapy
        </p>

        <MotionCard
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full overflow-hidden rounded-2xl border border-bg-warm bg-bg-dark shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]"
        >
          <div className="flex flex-col items-center gap-1.5 px-6 pt-7 pb-6 text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-text-muted">
              You&rsquo;re Invited To
            </p>
            <h1 className="text-2xl font-semibold text-text-cream [text-shadow:0_0_16px_rgba(250,232,191,0.3)]">
              {event.name}
            </h1>
            {event.tagline && (
              <p className="text-xs italic text-text-muted">{event.tagline}</p>
            )}
            <div className="mt-3 flex flex-col gap-0.5 text-sm text-text-primary/90">
              {formattedDate && <span>{formattedDate}</span>}
              {event.venue && <span>{event.venue}</span>}
            </div>
          </div>

          <div aria-hidden="true" className="relative flex items-center">
            <div className="-ml-3 h-6 w-6 shrink-0 rounded-full bg-black" />
            <div className="h-px flex-1 border-t border-dashed border-bg-warm" />
            <div className="-mr-3 h-6 w-6 shrink-0 rounded-full bg-black" />
          </div>

          <div className="flex flex-col items-center gap-1.5 px-6 py-7">
            <p className="text-xs uppercase tracking-[0.35em] text-text-muted">
              Your Table
            </p>
            <p className="text-5xl font-bold tracking-widest text-pink [text-shadow:0_0_30px_rgba(253,46,134,0.5)]">
              Table {tableLabel}
            </p>
          </div>

          <div aria-hidden="true" className="relative flex items-center">
            <div className="-ml-3 h-6 w-6 shrink-0 rounded-full bg-black" />
            <div className="h-px flex-1 border-t border-dashed border-bg-warm" />
            <div className="-mr-3 h-6 w-6 shrink-0 rounded-full bg-black" />
          </div>

          <div className="flex flex-col gap-3 px-6 py-6 text-left">
            <p className="text-center text-xs uppercase tracking-[0.3em] text-text-muted">
              Drinks On The Menu
            </p>
            <ul className="flex flex-col gap-3">
              {drinks.map((drink, index) => (
                <li
                  key={`${drink.category ?? ""}-${drink.name}-${drink.price}-${index}`}
                  className="flex items-center justify-between gap-3 border-b border-bg-warm/60 pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="flex min-w-0 flex-col">
                    {drink.category && (
                      <span className="text-[10px] uppercase tracking-wide text-text-muted">
                        {drink.category}
                      </span>
                    )}
                    <span className="truncate text-sm font-medium text-text-cream">
                      {drink.name}
                    </span>
                  </div>
                  <span className="shrink-0 rounded-full border border-gold/60 bg-bg-warm px-3 py-1 text-xs font-semibold tracking-wide text-gold">
                    ₦{drink.price.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </MotionCard>

        <p className="mt-6 text-[11px] tracking-wide text-gray-400">
          Screenshot this page and show it at the door.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd frontend && npx vitest run src/pages/GuestInvitation.test.jsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/GuestInvitation.jsx frontend/src/pages/GuestInvitation.test.jsx
git commit -m "feat: fetch GuestInvitation by table number instead of router state"
```

---

### Task 6: Add the scan-prompt root page and update routing

**Files:**
- Create: `frontend/src/pages/ScanPrompt.jsx`
- Create: `frontend/src/pages/ScanPrompt.test.jsx`
- Modify: `frontend/src/router.jsx`
- Modify: `frontend/src/router.test.jsx`
- Delete: `frontend/src/pages/GuestEntry.jsx`
- Delete: `frontend/src/pages/GuestEntry.test.jsx`

**Interfaces:**
- Produces: `ScanPrompt` default export, mounted at `/`.
- Consumes: `GuestInvitation` (Task 5, now at `/invitation/:tableNumber`).

- [ ] **Step 1: Write the failing test for the new page**

Create `frontend/src/pages/ScanPrompt.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScanPrompt from './ScanPrompt.jsx';

describe('ScanPrompt', () => {
  it('tells the guest to scan the QR on their invitation card', () => {
    render(<ScanPrompt />);
    expect(screen.getByText(/scan the qr code on your invitation card/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx vitest run src/pages/ScanPrompt.test.jsx`
Expected: FAIL — `./ScanPrompt.jsx` doesn't exist.

- [ ] **Step 3: Create the page**

Create `frontend/src/pages/ScanPrompt.jsx`:

```jsx
export default function ScanPrompt() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-black px-6 py-12 text-center">
      <p className="text-sm font-semibold tracking-[0.2em] text-gold [text-shadow:0_0_18px_rgba(250,208,100,0.4)]">
        HANGOVER LOUNGE
      </p>
      <p className="max-w-xs text-sm text-text-muted">
        Please scan the QR code on your Invitation card.
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd frontend && npx vitest run src/pages/ScanPrompt.test.jsx`
Expected: PASS

- [ ] **Step 5: Delete `GuestEntry` and its test**

```bash
git rm frontend/src/pages/GuestEntry.jsx frontend/src/pages/GuestEntry.test.jsx
```

- [ ] **Step 6: Update the router**

Replace the full contents of `frontend/src/router.jsx`:

```jsx
import { createBrowserRouter } from 'react-router-dom';
import ScanPrompt from './pages/ScanPrompt.jsx';
import GuestInvitation from './pages/GuestInvitation.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminDrinks from './pages/AdminDrinks.jsx';
import AdminEvents from './pages/AdminEvents.jsx';
import RequireAdmin from './components/RequireAdmin.jsx';
import NotFound from './pages/NotFound.jsx';

export const routes = [
  { path: '/', element: <ScanPrompt /> },
  { path: '/invitation/:tableNumber', element: <GuestInvitation /> },
  { path: '/admin/login', element: <AdminLogin /> },
  { path: '/admin', element: <RequireAdmin><AdminDashboard /></RequireAdmin> },
  { path: '/admin/drinks', element: <RequireAdmin><AdminDrinks /></RequireAdmin> },
  { path: '/admin/events', element: <RequireAdmin><AdminEvents /></RequireAdmin> },
  { path: '*', element: <NotFound /> },
];

export const router = createBrowserRouter(routes);
```

- [ ] **Step 7: Rewrite the router test**

Replace the full contents of `frontend/src/router.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from './router.jsx';
import * as adminAuth from './lib/adminAuth.js';
import { getTableInvitation } from './lib/guestApi.js';

vi.mock('./lib/guestApi.js', () => ({ getTableInvitation: vi.fn() }));

function testRouter(initialPath) {
  return createMemoryRouter(routes, { initialEntries: [initialPath] });
}

describe('routing', () => {
  it('renders the scan prompt at /', () => {
    render(<RouterProvider router={testRouter('/')} />);
    expect(screen.getByText(/scan the qr code/i)).toBeInTheDocument();
  });

  it('redirects unauthenticated /admin to /admin/login', () => {
    vi.spyOn(adminAuth, 'isAuthenticated').mockReturnValue(false);
    render(<RouterProvider router={testRouter('/admin')} />);
    expect(screen.getByLabelText(/admin password/i)).toBeInTheDocument();
  });

  it('guards /admin/drinks the same way as /admin', () => {
    vi.spyOn(adminAuth, 'isAuthenticated').mockReturnValue(false);
    render(<RouterProvider router={testRouter('/admin/drinks')} />);
    expect(screen.getByLabelText(/admin password/i)).toBeInTheDocument();
  });

  it('guards /admin/events the same way as /admin', () => {
    vi.spyOn(adminAuth, 'isAuthenticated').mockReturnValue(false);
    render(<RouterProvider router={testRouter('/admin/events')} />);
    expect(screen.getByLabelText(/admin password/i)).toBeInTheDocument();
  });

  it('renders GuestInvitation at /invitation/:tableNumber', async () => {
    getTableInvitation.mockResolvedValue({
      active: true,
      tableNumber: 3,
      event: { name: 'Test Event', eventDate: '2026-09-11T18:00:00.000Z', venue: 'Hangover Lounge' },
      drinks: [],
    });
    render(<RouterProvider router={testRouter('/invitation/3')} />);
    expect(await screen.findByText('Table 003')).toBeInTheDocument();
  });

  it('renders a not-found page for an unknown path', () => {
    render(<RouterProvider router={testRouter('/does-not-exist')} />);
    expect(screen.getByText(/page not found/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 8: Run the router test to verify it passes**

Run: `cd frontend && npx vitest run src/router.test.jsx`
Expected: PASS (6 tests)

- [ ] **Step 9: Commit**

```bash
git add -A frontend/src/pages/ScanPrompt.jsx frontend/src/pages/ScanPrompt.test.jsx frontend/src/router.jsx frontend/src/router.test.jsx frontend/src/pages/GuestEntry.jsx frontend/src/pages/GuestEntry.test.jsx
git commit -m "feat: add scan-prompt root page, route /invitation by table number"
```

---

### Task 7: Remove the admin codes/seats UI

**Files:**
- Delete: `frontend/src/pages/AdminCodes.jsx`
- Delete: `frontend/src/pages/AdminCodes.test.jsx`
- Delete: `frontend/src/components/SeatGrid.jsx`
- Delete: `frontend/src/components/ConfirmDialog.jsx`
- Delete: `frontend/src/lib/adminApi.codes.test.js`
- Modify: `frontend/src/lib/adminApi.js`
- Modify: `frontend/src/lib/adminApi.dashboard.test.js`
- Modify: `frontend/src/components/AdminHeader.jsx`

**Interfaces:**
- Removes: `getSeats`, `unassignSeat`, `getCodes` from `adminApi.js`.
- Produces: `adminApi.js` retains `login`, `listEvents`, `listDrinks`, `createDrink`, `deleteDrink`, `createEvent`, `activateEvent` — consumed by Task 8/9 and the untouched `AdminDrinks.jsx`.

- [ ] **Step 1: Delete the codes/seats page, its test, and the shared components they alone used**

```bash
git rm frontend/src/pages/AdminCodes.jsx frontend/src/pages/AdminCodes.test.jsx frontend/src/components/SeatGrid.jsx frontend/src/components/ConfirmDialog.jsx frontend/src/lib/adminApi.codes.test.js
```

- [ ] **Step 2: Trim the admin API client**

Replace the full contents of `frontend/src/lib/adminApi.js`:

```js
import { api } from './api.js';
import { setToken } from './adminAuth.js';

export async function login(password) {
  const { data } = await api.post('/api/admin/auth/login', { password });
  setToken(data.token);
  return data;
}

export async function listEvents() {
  const { data } = await api.get('/api/admin/events');
  return data;
}

export async function listDrinks(eventId) {
  const { data } = await api.get(`/api/admin/events/${eventId}/drinks`);
  return data;
}

export async function createDrink(eventId, drink) {
  const { data } = await api.post(`/api/admin/events/${eventId}/drinks`, drink);
  return data;
}

export async function deleteDrink(id) {
  await api.delete(`/api/admin/drinks/${id}`);
}

export async function createEvent(payload) {
  const { data } = await api.post('/api/admin/events', payload);
  return data;
}

export async function activateEvent(eventId) {
  const { data } = await api.post(`/api/admin/events/${eventId}/activate`);
  return data;
}
```

- [ ] **Step 3: Update the dashboard-calls test to drop `getSeats`**

Replace the full contents of `frontend/src/lib/adminApi.dashboard.test.js`:

```js
import { describe, it, expect, vi } from 'vitest';
import { listEvents } from './adminApi.js';
import { api } from './api.js';

vi.mock('./api.js', () => ({ api: { get: vi.fn(), post: vi.fn() } }));

describe('adminApi dashboard calls', () => {
  it('listEvents GETs /api/admin/events', async () => {
    api.get.mockResolvedValue({ data: [{ _id: '1', isActive: true }] });
    const result = await listEvents();
    expect(api.get).toHaveBeenCalledWith('/api/admin/events');
    expect(result).toEqual([{ _id: '1', isActive: true }]);
  });
});
```

- [ ] **Step 4: Remove the "Codes" nav link**

Edit `frontend/src/components/AdminHeader.jsx`, removing the `<NavLink to="/admin/codes">` block so the `<nav>` reads:

```jsx
      <nav className="flex items-center gap-5">
        <NavLink to="/admin" end className={navLinkClasses}>
          Dashboard
        </NavLink>
        <NavLink to="/admin/events" className={navLinkClasses}>
          Events
        </NavLink>
        <NavLink to="/admin/drinks" className={navLinkClasses}>
          Drinks
        </NavLink>
        <button
          type="button"
          onClick={handleLogout}
          className="cursor-pointer text-[11px] font-medium uppercase tracking-[0.2em] text-[#9C8F80] transition-colors duration-200 hover:text-[#F0E3CC]"
        >
          Log out
        </button>
      </nav>
```

- [ ] **Step 5: Run the frontend test suite**

Run: `cd frontend && npm test`
Expected: FAIL only in `AdminDashboard.test.jsx` (it still imports `getSeats`, removed in Step 2) — this is expected and fixed in Task 8. All other suites pass.

- [ ] **Step 6: Commit**

```bash
git add -A frontend/src/pages frontend/src/components frontend/src/lib
git commit -m "refactor: remove admin codes/seats UI"
```

---

### Task 8: Rewrite `AdminDashboard.jsx` to show the active event

**Files:**
- Modify: `frontend/src/pages/AdminDashboard.jsx`
- Modify: `frontend/src/pages/AdminDashboard.test.jsx`

**Interfaces:**
- Consumes: `listEvents()` from `adminApi.js` (Task 7).

- [ ] **Step 1: Rewrite the failing tests**

Replace the full contents of `frontend/src/pages/AdminDashboard.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminDashboard from './AdminDashboard.jsx';
import { listEvents } from '../lib/adminApi.js';

vi.mock('../lib/adminApi.js', () => ({ listEvents: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn() } }));

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <AdminDashboard />
    </MemoryRouter>
  );
}

describe('AdminDashboard', () => {
  it('shows the active event summary', async () => {
    listEvents.mockResolvedValue([
      { _id: 'evt1', name: 'One Year Anniversary', eventDate: '2026-09-11T18:00:00.000Z', venue: 'Hangover Lounge', isActive: true },
      { _id: 'evt0', name: 'Old Event', isActive: false },
    ]);
    renderDashboard();
    expect(await screen.findByText('One Year Anniversary')).toBeInTheDocument();
    expect(screen.getByText('Hangover Lounge')).toBeInTheDocument();
  });

  it('shows a distinct message when there is no active event', async () => {
    listEvents.mockResolvedValue([{ _id: 'evt0', name: 'Old Event', isActive: false }]);
    renderDashboard();
    expect(await screen.findByText('No active event configured.')).toBeInTheDocument();
  });

  it('always shows a link to Manage Events', async () => {
    listEvents.mockResolvedValue([]);
    renderDashboard();
    await waitFor(() => expect(listEvents).toHaveBeenCalled());
    expect(screen.getByRole('link', { name: /manage events/i })).toHaveAttribute('href', '/admin/events');
  });

  it('shows a toast error when fetching events fails', async () => {
    listEvents.mockRejectedValue(new Error('network down'));
    renderDashboard();
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to load event data.'));
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd frontend && npx vitest run src/pages/AdminDashboard.test.jsx`
Expected: FAIL — current component still imports `getSeats`/`SeatGrid`, which no longer exist.

- [ ] **Step 3: Replace the implementation**

Replace the full contents of `frontend/src/pages/AdminDashboard.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listEvents } from '../lib/adminApi.js';
import AdminHeader from '../components/AdminHeader.jsx';

function formatEventDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function AdminDashboard() {
  const [activeEvent, setActiveEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadActiveEvent() {
      setLoading(true);
      try {
        const events = await listEvents();
        if (!cancelled) {
          setActiveEvent(events.find((e) => e.isActive) || null);
        }
      } catch {
        if (!cancelled) {
          toast.error('Failed to load event data.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadActiveEvent();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#1A1310] px-4 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <AdminHeader subtitle="Dashboard" />

        {loading ? (
          <p className="text-center text-sm text-[#9C8F80]">Loading event…</p>
        ) : activeEvent ? (
          <div className="rounded-2xl border border-[#453626] bg-[#241A15] p-5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#9C8F80]">Active Event</p>
            <p className="mt-2 text-lg font-semibold text-[#F0E3CC]">{activeEvent.name}</p>
            <div className="mt-1 flex flex-col gap-0.5 text-sm text-[#9C8F80]">
              {activeEvent.eventDate && <span>{formatEventDate(activeEvent.eventDate)}</span>}
              {activeEvent.venue && <span>{activeEvent.venue}</span>}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#453626] bg-[#241A15] p-5 text-center text-sm text-[#9C8F80]">
            No active event configured.
          </div>
        )}

        <Link
          to="/admin/events"
          className="self-start rounded-full border border-[#6B5842] bg-[#453626] px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#F0E3CC] transition-colors duration-200 hover:bg-[#54432f]"
        >
          Manage Events
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd frontend && npx vitest run src/pages/AdminDashboard.test.jsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Run the full frontend test suite**

Run: `cd frontend && npm test`
Expected: PASS across all suites.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/AdminDashboard.jsx frontend/src/pages/AdminDashboard.test.jsx
git commit -m "feat: rebuild AdminDashboard around active event summary"
```

---

### Task 9: Update `AdminEvents.jsx` copy for the simplified `createEvent` response

**Files:**
- Modify: `frontend/src/pages/AdminEvents.jsx`
- Modify: `frontend/src/pages/AdminEvents.test.jsx`

**Interfaces:**
- Consumes: `createEvent(payload)` from Task 3/7, which now resolves `{ id }` (no `codes`).

- [ ] **Step 1: Update the test's mock return value**

In `frontend/src/pages/AdminEvents.test.jsx`, in the `'creates an event via the form'` test, change:

```js
    createEvent.mockResolvedValue({ id: 'evt3', codes: Array(100).fill('000000') });
```

to:

```js
    createEvent.mockResolvedValue({ id: 'evt3' });
```

- [ ] **Step 2: Run the test to verify it still passes with the old component (sanity check) then fails after Step 3's edit if it referenced `.codes`**

Run: `cd frontend && npx vitest run src/pages/AdminEvents.test.jsx`
Expected: PASS — the test doesn't assert on toast text, so this alone doesn't fail yet. This step just confirms the baseline before editing the component.

- [ ] **Step 3: Update the component**

In `frontend/src/pages/AdminEvents.jsx`, change the success toast call from:

```js
      toast.success(`Event created with ${result.codes.length} invitation codes.`);
```

to:

```js
      toast.success('Event created.');
```

Then remove this paragraph entirely (directly below the submit button):

```jsx
          <p className="text-[11px] text-[#6B5842]">
            100 unique 6-digit invitation codes are generated automatically.
          </p>
```

- [ ] **Step 4: Run the test to verify it still passes**

Run: `cd frontend && npx vitest run src/pages/AdminEvents.test.jsx`
Expected: PASS (4 tests) — `result.codes` is no longer referenced, so the trimmed mock in Step 1 is sufficient.

- [ ] **Step 5: Run the full frontend test suite one more time**

Run: `cd frontend && npm test`
Expected: PASS across all suites — this is the final state of the frontend changes.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/AdminEvents.jsx frontend/src/pages/AdminEvents.test.jsx
git commit -m "chore: drop invitation-code copy from AdminEvents now that events don't generate codes"
```

---

## Post-plan manual step (not part of this codebase)

Generating and printing the 50 physical QR images (each encoding `https://<production-domain>/invitation/<n>` for `n` in `1..MAX_TABLES`) is out of scope for this plan — see the design spec's "Out of scope" section. Any standard QR generator can produce them once a production domain is set.
