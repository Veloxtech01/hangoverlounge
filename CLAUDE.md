# CLAUDE.md

Project-specific instructions for Claude Code. Read this before making changes.

---

## Project overview

A MERN-stack application: **MongoDB + Express + React + Node**, structured as a
three-package repo — `frontend/`, `backend/`, and a small `shared/` folder of
code imported by both.

```
/frontend   React 19 + Vite 7 client
/backend    Express + Node API, Mongoose models
/shared     Code imported by both packages
```

**HANGOVER LOUNGE** is a mobile-first QR invitation and seat allocation app.
One shared QR code opens a guest page where a guest enters their unique
printed invitation code; the app validates it and assigns the next available
seat (001–100), permanently tied to that code. The guest page shows the
Hangover Lounge brand (no third-party co-branding), current event details
(name/date/venue), the assigned seat number, and a 7-item drinks list — no
personal data is collected or stored. An admin dashboard (single shared
admin password) manages invitation codes, seat status, and the drinks list.
Built to be **reusable across events**, not a one-off — data model needs an
`Event` concept, not a hardcoded single event. UI follows a dark/gold lounge
visual theme — see `docs/PROJECT-PLAN.md` for palette details and the full
feature plan; keep both in sync as the build evolves.

There is no real-time feature, and no socket server on the backend.
`socket.io-client` and `react-tooltip` are not part of the default stack —
if either is needed later, install and flag it first, per the dependency
rule below.

---

## Tech stack (frontend — from package.json)

| Concern   | Library                               | Notes that matter                                                |
| --------- | ------------------------------------- | ------------------------------------------------------------------ |
| Build/dev | `vite` 7                              | ESM-only, fast HMR                                                |
| UI        | `react` / `react-dom` 19              | New JSX transform — no `import React` needed for JSX             |
| Styling   | `tailwindcss` 4 + `@tailwindcss/vite` | **v4 — CSS-first config, NOT v3** (see below)                    |
| Routing   | `react-router-dom` 7                  | Data Router APIs available                                       |
| HTTP      | `axios` 1                             | Use one shared instance (see below)                               |
| Forms     | `react-hook-form` 7                   | Uncontrolled-first; prefer over manual `useState` forms          |
| Icons     | `react-icons` 5                       | Import per-icon from the specific set                            |
| Toasts    | `react-hot-toast`                     | Use `react-hot-toast` for toasts; `react-toastify` was never added |
| Animation | `motion` (Framer Motion)              | **Default animation library** — use for all animations           |

`react-tooltip` and `socket.io-client` are **not installed** by default.
Install and flag it first if either is needed.

## Tech stack (backend — from package.json)

| Concern     | Library               | Notes that matter                                  |
| ----------- | ---------------------- | --------------------------------------------------- |
| Server      | `express` 4            | Layered `routes/ → controllers/ → services/ → models/` |
| DB          | `mongoose` 8           | One schema per file in `backend/src/models`         |
| Security    | `helmet`, `cors`       | CORS has no `credentials: true` — keep it off unless cookie auth is added |
| Rate limits | `express-rate-limit` 8 | In-memory store; single-instance only               |
| PDF         | `@react-pdf/renderer` 4 | Available for PDF generation if the project needs it (not currently used) |
| Env         | `dotenv`               | `backend/src/config/env.js` reads and validates vars |
| Compression | `compression`          |                                                       |
| Logging     | `pino`                 | Structured JSON via `backend/src/config/logger.js`'s `logger`/`createLogger(module)`; `req.log` is a request-id-tagged child logger, set by `middleware/requestId.js` |
| Errors      | `@sentry/node`         | `backend/src/config/sentry.js`'s `captureError(err, context)`; no-ops until `SENTRY_DSN` is set. Wired into `errorHandler.js` (5xx only) and `server.js`'s `unhandledRejection` |
| Lint/test   | `eslint` 9 (flat config), `vitest` 4 | Mirrors the frontend's ESLint shape, Node globals instead of browser |

---

## Commands

```bash
# Frontend (run inside /frontend)
npm run dev             # Vite dev server
npm run build            # production build
npm run preview          # preview the build
npm run lint              # eslint
npm test                  # vitest run
npm run optimize-images  # scripts/optimize-images.mjs

# Backend (run inside /backend)
npm run dev        # node --watch src/server.js
npm start          # production start
npm run lint         # eslint
npm test              # vitest run
```

When unsure which package a command belongs to, check the `scripts` block of
the relevant `package.json` rather than guessing. Do not assume a root-level
script exists unless you've seen it.

---

## Frontend conventions

### Tailwind CSS v4 — read this carefully

This project uses **Tailwind v4**, which is configured very differently from v3.
Do **not** apply v3 patterns.

- The Vite plugin (`@tailwindcss/vite`) handles everything. It's registered in
  `frontend/vite.config.js`:

  ```js
  import { defineConfig } from "vite";
  import react from "@vitejs/plugin-react";
  import tailwindcss from "@tailwindcss/vite";

  export default defineConfig({
    plugins: [tailwindcss(), react()],
  });
  ```

### React 19

- New JSX transform: don't add `import React from 'react'` just to use JSX.
  Import hooks directly: `import { useState, useEffect } from 'react'`.
- `ref` is a regular prop on function components — **don't reach for
  `forwardRef`** unless interacting with older code that needs it.
- Prefer modern primitives where they fit: `use()`, `useActionState`,
  `useOptimistic`, form actions. Don't force them where a plain handler is clearer.

### Routing (React Router v7)

- Centralize routes in one place (`createBrowserRouter` or a `<Routes>` tree —
  match whatever the repo already uses; don't mix the two styles).
- Use `<Link>` / `<NavLink>` for navigation and `useNavigate` for imperative
  navigation. Never use raw `<a href>` for internal routes.
- If the project uses loaders/actions, keep data-fetching in them; otherwise
  fetch in components. Follow the existing pattern — don't introduce loaders
  into a codebase that doesn't use them.

### Data fetching (Axios)

- Use a **single shared Axios instance**, not bare `axios.get(...)` scattered
  around. Lives at `frontend/src/lib/api.js`:
  ```js
  import axios from "axios";
  export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
  });
  ```
  Do **not** add `withCredentials: true`. There is no cookie auth, and the
  server's CORS config has no `credentials: true`. If cookie auth ever
  lands, both flags go back together — neither works alone.
- Put auth headers, error normalization, and 401 handling in **interceptors**,
  not in every call site.
- Read the base URL from `import.meta.env.VITE_API_URL`. Never hardcode
  `localhost:PORT`.

### Forms (react-hook-form)

- Use `react-hook-form` for any form with more than one field. Don't build
  manual `useState`-per-input forms.
- Validate via the library's `register` rules (or a resolver if one is added —
  none is installed yet, so no Zod/Yup unless added). Surface errors near fields.

### Realtime

No real-time feature exists yet. If one is added: install `socket.io-client`,
flag it first, use one socket connection for the whole app created once and shared
via React context (never call `io()` inside multiple components), clean up
listeners in `useEffect` returns, and match client and server **event names**
exactly.

### Icons & tooltips

- `react-icons`: import the specific icon from its set,
  e.g. `import { FiMenu } from 'react-icons/fi'`. Don't import the whole set.
- `react-tooltip` is not part of the default stack. Install and flag it
  first if a tooltip is actually needed; v5 uses the `data-tooltip-id`
  API plus a single `<Tooltip />` instance, not the legacy `data-tip` attribute.

### Toasts (react-hot-toast)

- Use `react-hot-toast` for transient notifications. `react-toastify` has been removed from the frontend dependencies.
- Create a single `<Toaster />` near your app root and call `toast()` from components or hooks.

---

## Backend conventions (Express/Node)

- Layered structure: `backend/src/routes/ → controllers/ → services/ → models/`.
  Keep route files thin; business logic goes in controllers/services.
- Mongoose models in `backend/src/models`, one schema per file, PascalCase model names.
- All secrets and connection strings come from environment variables via
  `process.env`. **Never** commit or hardcode them, and never put them in client
  code (only `VITE_`-prefixed vars reach the browser, by design).
- Centralized error-handling middleware; controllers should `throw` or
  `next(err)` rather than sending ad-hoc error responses.
- Validate request input at the boundary before it reaches the database.
- Consistent JSON response shape across endpoints (pick one and stick to it).

---

## Design & UI tools — always use these for UI work

When building any page, component, or UI feature:

1. **Invoke `ui-ux-pro-max` skill first** — establishes style, palette, font pairing, layout, and component choices before writing code. Never skip this for page-level or component-level UI tasks.
2. **Use the shadcn/ui MCP server** — query it for accurate component examples and usage patterns. Don't rely on memory for shadcn component APIs.

These tools are always available and must be referenced for any UI/UX work, regardless of whether the user specifies them.

---

## Code style

- Match existing formatting (Prettier/ESLint config if present) — don't reformat
  unrelated lines in a diff.
- Components: PascalCase files for components, camelCase for hooks/utilities.
- Keep components focused; extract shared logic into hooks (`useX`) rather than
  duplicating.
- No new dependencies without flagging it first — call out the addition and why.

# Token-saving rules

- Keep responses under 100 words.
- Do not narrate actions.
- Do not explain code unless asked.
- Make changes directly.
- Summarize edits in bullet points only.
- When working, provide status updates in one sentence only.
- Highlight every line of code you edit or add (e.g. via a code-link reference or inline callout) so the user can spot exactly what changed.

---

## When unsure

- Read the relevant `package.json`, `vite.config.js`, and existing files in the
  same folder before introducing a new pattern.
- Prefer matching an established pattern in the repo over a "more correct" one
  from scratch.
- If a request conflicts with these notes, ask rather than silently choosing.
