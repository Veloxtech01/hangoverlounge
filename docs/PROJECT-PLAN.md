# HANGOVER LOUNGE — QR Invitation & Seat Allocation

Reference doc for the planned build. Update this file whenever a feature is
added, changed, or a decision below is revisited — keep it in sync with
reality, not just the initial brainstorm.

---

## Concept

One shared QR code across all invitations. Scanning it opens a mobile-first
guest page where the guest types their unique invitation code (printed on a
physical card, handed out alongside the QR). The system validates the code
and assigns the next available seat from **001–100**. A code always maps to
the same seat on every future visit — assignment is permanent, one-time, and
deterministic.

No personal information is collected or displayed anywhere in the guest flow.
No entrance check-in / re-scan requirement — the guest screenshots the result
page and shows it at the door.

## Guest-facing page shows

- "HANGOVER LOUNGE" branding + "LIQUID THERAPY" tagline (Hangover Lounge
  only — no co-branding with third-party venues/partners, even if a given
  event's flyer is co-branded)
- Current event details: event name, date/time, venue address
- Assigned seat number
- 7-item drinks list (content to be provided by the user; not yet final)

Reference event (first real event this will run for): "One Year
Anniversary", Sept. 11, 6PM, Hangover Lounge — beside Chaise World Hotel,
Umuahia, Abia State. Sourced from the event flyer; co-branded there with
Paradice Nightclub, but per the branding decision above the app itself
stays Hangover Lounge-only.

## Visual design

- Dark/gold lounge theme, per the reference screenshot: near-black background
  (~`#1A1310`), cream/ivory headings (~`#F0E3CC`) with a warm glow, muted
  tan tagline text (~`#9C8F80`), bronze price pills (~`#453626`), thin
  bronze/gold divider lines (~`#6B5842`), cocktail-glass icon beside the
  wordmark.
- This is the actual design target for the guest-facing UI (and likely the
  admin dashboard), not just brand inspiration — build to it via
  `ui-ux-pro-max`.

## Code distribution

- Exactly **100 codes**, printed on physical invitation cards, one per card.
- No overbooking, no waitlist tier — printed count == seat count.
- Because of this, "all 100 seats taken" is not a real guest-facing scenario
  under normal use; it can only happen from a bug (e.g. a race condition
  double-assigning). Treat it as a defensive/admin-facing state, not a
  designed guest experience.

## Seat assignment logic

- "Next available seat" must be **atomic** — two guests entering codes at
  the same moment must not be able to receive the same seat. Needs a DB-level
  transaction / row lock / atomic increment, not an app-level read-then-write.
- Once a code has a seat, re-entering that code just re-displays the same
  seat. There is no "already used" error state — a valid code is always
  either "new" (gets assigned) or "already assigned" (shows existing seat),
  never blocked.

## Error states (guest-facing)

Only one real failure mode given fixed 100-code printing: **code not
recognized** (typo, mistyped, made up).

- Copy should match the invitation's fun/lounge tone rather than reading as
  a generic form-validation error.
- Normalize input before matching (trim whitespace, case-insensitive) to
  avoid false negatives from mobile typing/autocorrect.
- "All seats taken" (the bug-only case) does not need guest-facing copy
  investment — keep it simple/functional since it shouldn't occur in
  practice.

## Admin dashboard

- Auth-gated via a **single shared admin password** (single-event app — no
  multi-user RBAC needed).
- View invitation/seat status: which of 001–100 are assigned vs available.
- Manage invitation codes.
- Manage the drinks shown to guests.

## Infrastructure

- MongoDB: connection string (Atlas or similar) to be provided by the user
  via `MONGODB_URI`.

## Reusability across events

This is **not** a one-off build for Sept 11 — it needs to support running
again for future Hangover Lounge events. Implication for the data model: an
`Event` concept (name, date/time, venue, drinks list, its own 100
codes/seats) rather than hardcoding a single event's data, so the admin can
configure/reset for a new event without a code change. Exact shape (one
active event at a time vs. multiple events with history) still to be
designed.

## Open decisions

- [ ] Exact copy for the "code not recognized" fun-tone message.
- [ ] Data model / schema for events, codes, seats, drinks (not yet designed).
- [ ] Final drinks list content (7 items — pending from the user).
- [ ] Whether the admin dashboard supports one active event at a time, or
      multiple events with history/switching.

---

*Tech stack: per root `CLAUDE.md` (MERN — MongoDB/Express/React/Node).*
