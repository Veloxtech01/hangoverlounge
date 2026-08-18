# QR Table Invitation — Design

## Background

The app currently uses a single shared QR code that opens a guest page where
the guest types a printed invitation code. The backend validates the code
and assigns the next available seat (001–100) from a per-event pool,
permanently tying that seat to the code.

The client has changed the flow: there will be **50 distinct, physical QR
codes, one per table**. Each QR encodes a URL containing that table's
number. Scanning it opens the guest invitation page showing that table
number directly — no code entry, no allocation, no "claiming" step of any
kind. The 50 printed QR codes are permanent and get reused for every future
event; only the *event* behind them changes via the admin's existing
activate-event flow.

This removes the invitation-code system entirely: no more codes, no more
seat assignment, no more seat scarcity or contention. A table is a bare
number with no managed state — nothing to create, edit, or delete in the
admin.

## Goals

- Scanning a table's QR immediately shows that table's invitation page: an
  event's name/date/venue, the table number, and the drinks list — with
  zero user input.
- The same 50 QR codes work forever, across every future event.
- Remove the invitation-code/seat-allocation system completely (data model,
  services, admin UI) rather than deprecating it in place.

## Non-goals

- No re-introduction of per-guest identity, uniqueness, or scarcity control.
  Anyone who scans (or guesses) a valid table URL sees the same read-only
  information; that's an accepted trade-off of dropping codes.
- No support for per-event QR reprinting. Table numbers are not stored
  per-event; they're pure input validated against a fixed range.

## Architecture & data flow

- Each printed QR encodes `https://<domain>/invitation/:tableNumber` (e.g.
  `/invitation/7`).
- On load, `GuestInvitation.jsx` reads `tableNumber` from the URL param and
  calls `GET /api/guest/table/:tableNumber`.
- The backend validates `tableNumber` is an integer within `1..MAX_TABLES`
  (new env var) — `400` if not.
- The backend looks up the currently active `Event`
  (`Event.findOne({ isActive: true })`, unchanged from today).
  - If none is active, it responds `200 { active: false }` — an expected
    steady state between events, not an error.
  - If one is active, it loads that event's `Drink`s and responds
    `{ tableNumber, event: { name, tagline, eventDate, venue }, drinks }`.
- The frontend renders:
  - the existing invitation card markup (unchanged look) when an event is
    active,
  - a holding screen ("No event right now — check back soon") with the
    table number **hidden**, when `active: false`,
  - a plain "This table number isn't recognized" message for a `400`.
- Root `/` becomes a static page: "Please scan the QR code on your
  Invitation card."
- Refreshing `/invitation/:tableNumber` now re-fetches from the URL param
  instead of relying on router `state`, which also fixes today's behavior
  of losing the invitation on refresh.

## Backend changes

- **New:** `MAX_TABLES` env var, read/validated in
  `backend/src/config/env.js` alongside the other env vars.
- **New:** `GET /api/guest/table/:tableNumber` in `guest.routes.js` →
  a new controller function (e.g. `getTableInvitation`) replacing
  `redeem()`. Logic: validate range → find active event → if none, return
  `{ active: false }` → else load drinks and return
  `{ tableNumber, event, drinks }`.
- **Removed:** `Code.js` and `Seat.js` models; `seatAssignment.service.js`;
  the old `redeem()` controller; `POST /api/guest/redeem` route.
- **Simplified:** `eventSetup.service.js` — `createEvent` (in
  `admin.controller.js`) no longer calls `createSeatPool`,
  `generateUniqueCodes`, or `createCodes`. It only creates the `Event` doc.
  Drinks remain managed separately via the existing Manage Drinks flow,
  unaffected by this change.
- **Removed:** admin routes/controllers for codes and seats — `listCodes`,
  `seatStatus`, `unassignSeat`, and their routes.

## Frontend changes

- `GuestInvitation.jsx`: rewritten to fetch on mount via `useParams()` for
  `tableNumber` and a new `getTableInvitation(tableNumber)` call in
  `guestApi.js`, with local loading/error/no-active-event states, instead
  of reading `location.state`. Invalid table number, no active event, and
  success are three distinct render states (see Architecture section).
- `router.jsx`: `/invitation` becomes `/invitation/:tableNumber`. `/` swaps
  `GuestEntry.jsx` for a new small static page.
- **Removed:** `GuestEntry.jsx` (code-entry form), `AdminCodes.jsx` (Manage
  Codes page, route, and nav link), `SeatGrid.jsx` component,
  `redeemCode`/`getCodes`/`getSeats`/`unassignSeat` from
  `guestApi.js`/`adminApi.js`.
- `AdminDashboard.jsx`: gutted of seat-grid/unassign logic; rebuilt to show
  the active event's summary (name/date/venue) plus a link to Manage
  Events.

## Edge cases

- Table number out of `1..MAX_TABLES` (or non-numeric, e.g.
  `/invitation/abc`) → `400`, distinct "not recognized" message.
- No active event → `200 { active: false }`, holding screen, table number
  hidden.
- Concurrent scans of the same table's QR → no contention: every request is
  a pure read of the current event and drinks, no writes, no transaction —
  strictly simpler than today's seat-claiming logic.

## Testing

- Backend (vitest): new controller — valid table + active event → correct
  payload; valid table + no active event → `{ active: false }`;
  out-of-range/non-numeric table → `400`. Delete tests covering the removed
  redeem/seat-assignment code.
- Frontend (vitest): update or replace tests touching `GuestEntry`,
  `GuestInvitation`, `AdminCodes`, and `AdminDashboard` to match the new
  components and remove tests for deleted ones.

## Out of scope for this spec

- Actually generating/printing the 50 QR images — a separate follow-up
  (could reuse `@react-pdf/renderer`, already a backend dependency, if a
  printable sheet is wanted later).
