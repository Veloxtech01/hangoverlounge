# Hangover Lounge — Frontend UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the mobile-first React frontend — a guest code-entry/invitation flow and a password-gated admin dashboard — that consumes the backend API from `docs/superpowers/plans/2026-08-15-backend-core.md`.

**Architecture:** Vite + React 19 + React Router 7 (data router) + a single shared Axios instance. Pages hold state/data-fetching (no loaders, to match a small app with no existing loader convention). Component logic/markup structure below is fixed; **visual styling is intentionally left minimal** in this plan — every task that renders UI ends with a step requiring `ui-ux-pro-max` to be invoked and the dark/gold palette from `docs/PROJECT-PLAN.md` applied, per root `CLAUDE.md`'s mandate that UI work always goes through that skill first.

**Tech Stack:** React 19, Vite 7, `react-router-dom` 7, `axios`, `react-hook-form`, `react-hot-toast`, Tailwind v4 (`@tailwindcss/vite`), `motion`. Tests: `vitest`, `@testing-library/react`, `jsdom`.

## Global Constraints

- Mobile-first, highly responsive — this is the primary device class guests will use.
- No personal information is collected anywhere in the guest flow — only the invitation code (text input), never name/email/phone.
- Guest flow has no "download" affordance — guests screenshot the result page manually. Do not build a save/share button.
- Read the API base URL from `import.meta.env.VITE_API_URL` — never hardcode `localhost:PORT`.
- One shared Axios instance (`src/lib/api.js`) — no bare `axios.get(...)` calls scattered around.
- Use `react-hook-form` for any form with more than one field (the admin drinks form qualifies; the single-field guest/login forms may use plain `useState`).
- Use `react-hot-toast` for transient errors/confirmations; one `<Toaster />` at the app root.
- **Every UI-rendering task must invoke the `ui-ux-pro-max` skill and apply the dark/gold lounge palette documented in `docs/PROJECT-PLAN.md` before the task is considered done** — this plan fixes structure/logic, not final Tailwind classes.
- New JSX transform — do not `import React from 'react'`.

---

### Task 1: Frontend scaffold, Tailwind v4, and a smoke test

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.js`
- Create: `frontend/index.html`
- Create: `frontend/.env.example`
- Create: `frontend/.gitignore`
- Create: `frontend/src/index.css`
- Create: `frontend/src/main.jsx`
- Create: `frontend/src/App.jsx`
- Create: `frontend/src/test/setup.js`
- Test: `frontend/src/test/App.test.jsx`

**Interfaces:**
- Produces: a working Vite dev server and test runner. `App.jsx`/`main.jsx` here are a placeholder — Task 8 replaces `main.jsx`'s contents with the router and deletes `App.jsx`.

- [ ] **Step 1: Create `frontend/package.json`**

```json
{
  "name": "hangover-lounge-frontend",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",
    "axios": "^1.7.7",
    "react-hook-form": "^7.53.0",
    "react-hot-toast": "^2.4.1",
    "motion": "^11.11.0"
  },
  "devDependencies": {
    "vite": "^7.0.0",
    "@vitejs/plugin-react": "^4.3.1",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "vitest": "^2.0.5",
    "@testing-library/react": "^16.0.1",
    "@testing-library/jest-dom": "^6.5.0",
    "jsdom": "^25.0.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `cd frontend && npm install`

- [ ] **Step 3: Create `frontend/vite.config.js`**

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.js",
  },
});
```

- [ ] **Step 4: Create `frontend/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hangover Lounge</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `frontend/.env.example`**

```
VITE_API_URL=http://localhost:4000
```

- [ ] **Step 6: Create `frontend/.gitignore`**

```
node_modules/
dist/
.env
```

- [ ] **Step 7: Create `frontend/src/index.css`**

```css
@import "tailwindcss";
```

- [ ] **Step 8: Create `frontend/src/test/setup.js`**

```js
import '@testing-library/jest-dom';
```

- [ ] **Step 9: Write the failing test — `frontend/src/test/App.test.jsx`**

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App.jsx';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText(/Hangover Lounge/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 10: Run test, verify it fails**

Run: `cd frontend && npx vitest run src/test/App.test.jsx`
Expected: FAIL — `App.jsx` does not exist.

- [ ] **Step 11: Create `frontend/src/App.jsx`**

```jsx
export default function App() {
  return <div>Hangover Lounge</div>;
}
```

- [ ] **Step 12: Create `frontend/src/main.jsx`**

```jsx
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(<App />);
```

- [ ] **Step 13: Run test, verify it passes**

Run: `cd frontend && npx vitest run src/test/App.test.jsx`
Expected: PASS

- [ ] **Step 14: Create `frontend/.env` from `.env.example`, pointing at the local backend (`http://localhost:4000`) during development.**

- [ ] **Step 15: Commit**

```bash
git add frontend/package.json frontend/vite.config.js frontend/index.html frontend/.env.example frontend/.gitignore frontend/src
git commit -m "feat: frontend scaffold with Tailwind v4 and smoke test"
```

---

### Task 2: Shared API client + guest API module

**Files:**
- Create: `frontend/src/lib/api.js`
- Create: `frontend/src/lib/guestApi.js`
- Test: `frontend/src/lib/guestApi.test.js`

**Interfaces:**
- Produces: `api` (shared Axios instance) from `api.js`. `redeemCode(code) → Promise<{event, seatNumber, drinks}>` from `guestApi.js` — used by Task 3's `GuestEntry`.

- [ ] **Step 1: Create `frontend/src/lib/api.js`**

```js
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});
```

- [ ] **Step 2: Write the failing test — `frontend/src/lib/guestApi.test.js`**

```js
import { describe, it, expect, vi } from 'vitest';
import { redeemCode } from './guestApi.js';
import { api } from './api.js';

vi.mock('./api.js', () => ({ api: { post: vi.fn() } }));

describe('redeemCode', () => {
  it('posts the code and returns the response data', async () => {
    api.post.mockResolvedValue({ data: { seatNumber: 7 } });
    const result = await redeemCode('HL001');
    expect(api.post).toHaveBeenCalledWith('/api/guest/redeem', { code: 'HL001' });
    expect(result).toEqual({ seatNumber: 7 });
  });
});
```

- [ ] **Step 3: Run test, verify it fails**

Run: `cd frontend && npx vitest run src/lib/guestApi.test.js`
Expected: FAIL — `guestApi.js` does not exist.

- [ ] **Step 4: Create `frontend/src/lib/guestApi.js`**

```js
import { api } from './api.js';

export async function redeemCode(code) {
  const { data } = await api.post('/api/guest/redeem', { code });
  return data;
}
```

- [ ] **Step 5: Run test, verify it passes**

Run: `cd frontend && npx vitest run src/lib/guestApi.test.js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/api.js frontend/src/lib/guestApi.js frontend/src/lib/guestApi.test.js
git commit -m "feat: shared API client and guest redeem API module"
```

---

### Task 3: Guest code-entry page

**Files:**
- Create: `frontend/src/pages/GuestEntry.jsx`
- Test: `frontend/src/pages/GuestEntry.test.jsx`

**Interfaces:**
- Consumes: `redeemCode` (Task 2).
- Produces: `<GuestEntry />` — a form that, on success, navigates to `/invitation` passing `{event, seatNumber, drinks}` as router state; on failure, shows a `react-hot-toast` error with the backend's message.

- [ ] **Step 1: Write the failing test — `frontend/src/pages/GuestEntry.test.jsx`**

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import GuestEntry from './GuestEntry.jsx';
import { redeemCode } from '../lib/guestApi.js';

vi.mock('../lib/guestApi.js', () => ({ redeemCode: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn() } }));

describe('GuestEntry', () => {
  it('submits the entered code', async () => {
    redeemCode.mockResolvedValue({ seatNumber: 12 });
    render(<MemoryRouter><GuestEntry /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText(/invitation code/i), { target: { value: 'HL001' } });
    fireEvent.click(screen.getByRole('button', { name: /enter/i }));
    await waitFor(() => expect(redeemCode).toHaveBeenCalledWith('HL001'));
  });

  it('shows an error toast for an invalid code', async () => {
    const toast = (await import('react-hot-toast')).default;
    redeemCode.mockRejectedValue({
      response: { data: { error: { message: "That code doesn't match an invitation." } } },
    });
    render(<MemoryRouter><GuestEntry /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText(/invitation code/i), { target: { value: 'NOPE' } });
    fireEvent.click(screen.getByRole('button', { name: /enter/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd frontend && npx vitest run src/pages/GuestEntry.test.jsx`
Expected: FAIL — `GuestEntry.jsx` does not exist.

- [ ] **Step 3: Create `frontend/src/pages/GuestEntry.jsx`**

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { redeemCode } from '../lib/guestApi.js';

export default function GuestEntry() {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!code.trim()) return;
    setSubmitting(true);
    try {
      const result = await redeemCode(code);
      navigate('/invitation', { state: result });
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Something went wrong. Try again.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="invitation-code">Enter your invitation code</label>
      <input
        id="invitation-code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        disabled={submitting}
      />
      <button type="submit" disabled={submitting}>
        {submitting ? 'Checking…' : 'Enter'}
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `cd frontend && npx vitest run src/pages/GuestEntry.test.jsx`
Expected: PASS

- [ ] **Step 5: Invoke `ui-ux-pro-max`** to design the actual guest entry screen using the dark/gold palette in `docs/PROJECT-PLAN.md` (near-black background, cream heading, bronze accents, cocktail-glass icon). Apply the resulting Tailwind classes to the JSX above without changing its `id`/`role`/text-content contract (so Step 4's test keeps passing) or its submit logic.

- [ ] **Step 6: Re-run the test after styling to confirm nothing broke**

Run: `cd frontend && npx vitest run src/pages/GuestEntry.test.jsx`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/GuestEntry.jsx frontend/src/pages/GuestEntry.test.jsx
git commit -m "feat: guest invitation-code entry page"
```

---

### Task 4: Guest invitation/result page

**Files:**
- Create: `frontend/src/pages/GuestInvitation.jsx`
- Test: `frontend/src/pages/GuestInvitation.test.jsx`

**Interfaces:**
- Consumes: router state shaped `{event: {name, tagline, eventDate, venue}, seatNumber, drinks: [{category, name, price}]}`, produced by Task 3's successful navigation.
- Produces: `<GuestInvitation />` — shows event name/date/venue, seat number (zero-padded to 3 digits), and the drinks list; redirects to `/` if loaded with no state (e.g. a direct URL visit).

- [ ] **Step 1: Write the failing test — `frontend/src/pages/GuestInvitation.test.jsx`**

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import GuestInvitation from './GuestInvitation.jsx';

const sampleState = {
  event: { name: 'One Year Anniversary', tagline: 'Liquid Therapy', eventDate: '2026-09-11', venue: 'Hangover Lounge' },
  seatNumber: 7,
  drinks: [{ category: 'Whisky', name: 'Glenfiddich 18 Years', price: 300000 }],
};

function renderWithState(state) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/invitation', state }]}>
      <Routes>
        <Route path="/invitation" element={<GuestInvitation />} />
        <Route path="/" element={<div>Entry Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('GuestInvitation', () => {
  it('renders seat number padded to 3 digits and drinks', () => {
    renderWithState(sampleState);
    expect(screen.getByText('Seat 007')).toBeInTheDocument();
    expect(screen.getByText(/Glenfiddich 18 Years/)).toBeInTheDocument();
  });

  it('redirects to entry when no state is present', () => {
    renderWithState(undefined);
    expect(screen.getByText('Entry Page')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd frontend && npx vitest run src/pages/GuestInvitation.test.jsx`
Expected: FAIL — `GuestInvitation.jsx` does not exist.

- [ ] **Step 3: Create `frontend/src/pages/GuestInvitation.jsx`**

```jsx
import { Navigate, useLocation } from 'react-router-dom';

export default function GuestInvitation() {
  const { state } = useLocation();

  if (!state) {
    return <Navigate to="/" replace />;
  }

  const { event, seatNumber, drinks } = state;

  return (
    <div>
      <h1>{event.name}</h1>
      <p>Seat {String(seatNumber).padStart(3, '0')}</p>
      <ul>
        {drinks.map((drink) => (
          <li key={drink.name}>
            {drink.name} — ₦{drink.price.toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `cd frontend && npx vitest run src/pages/GuestInvitation.test.jsx`
Expected: PASS

- [ ] **Step 5: Invoke `ui-ux-pro-max`** to design the screenshot-worthy invitation card — this is the page guests actually save, so it should read as a finished, on-brand card, not a plain list. Apply the dark/gold palette; keep the seat number visually dominant. Preserve the `Seat 007`-style text content and drink text content so Step 4's test keeps passing.

- [ ] **Step 6: Re-run the test after styling**

Run: `cd frontend && npx vitest run src/pages/GuestInvitation.test.jsx`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/GuestInvitation.jsx frontend/src/pages/GuestInvitation.test.jsx
git commit -m "feat: guest invitation result page"
```

---

### Task 5: Admin auth (login page + token storage + route guard)

**Files:**
- Create: `frontend/src/lib/adminAuth.js`
- Modify: `frontend/src/lib/api.js` — attach a Bearer-token request interceptor
- Create: `frontend/src/lib/adminApi.js`
- Create: `frontend/src/pages/AdminLogin.jsx`
- Create: `frontend/src/components/RequireAdmin.jsx`
- Test: `frontend/src/lib/adminAuth.test.js`
- Test: `frontend/src/pages/AdminLogin.test.jsx`
- Test: `frontend/src/components/RequireAdmin.test.jsx`

**Interfaces:**
- Produces: `getToken()/setToken()/clearToken()/isAuthenticated()` from `adminAuth.js`. `login(password) → Promise<{token}>` from `adminApi.js` (also used by Task 6/7's extensions to `adminApi.js`). `<RequireAdmin>{children}</RequireAdmin>` — redirects to `/admin/login` when unauthenticated, used by Task 8's router.

- [ ] **Step 1: Write the failing test — `frontend/src/lib/adminAuth.test.js`**

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { getToken, setToken, clearToken, isAuthenticated } from './adminAuth.js';

beforeEach(() => sessionStorage.clear());

describe('adminAuth', () => {
  it('stores and retrieves a token', () => {
    expect(isAuthenticated()).toBe(false);
    setToken('abc');
    expect(getToken()).toBe('abc');
    expect(isAuthenticated()).toBe(true);
    clearToken();
    expect(isAuthenticated()).toBe(false);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd frontend && npx vitest run src/lib/adminAuth.test.js`
Expected: FAIL — `adminAuth.js` does not exist.

- [ ] **Step 3: Create `frontend/src/lib/adminAuth.js`**

```js
const TOKEN_KEY = 'hl_admin_token';

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `cd frontend && npx vitest run src/lib/adminAuth.test.js`
Expected: PASS

- [ ] **Step 5: Modify `frontend/src/lib/api.js`** to attach the admin token on admin requests

```js
import axios from 'axios';
import { getToken } from './adminAuth.js';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token && config.url?.startsWith('/api/admin')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

- [ ] **Step 6: Create `frontend/src/lib/adminApi.js`**

```js
import { api } from './api.js';
import { setToken } from './adminAuth.js';

export async function login(password) {
  const { data } = await api.post('/api/admin/auth/login', { password });
  setToken(data.token);
  return data;
}
```

- [ ] **Step 7: Write the failing test — `frontend/src/pages/AdminLogin.test.jsx`**

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminLogin from './AdminLogin.jsx';
import { login } from '../lib/adminApi.js';

vi.mock('../lib/adminApi.js', () => ({ login: vi.fn() }));

describe('AdminLogin', () => {
  it('logs in with the entered password', async () => {
    login.mockResolvedValue({ token: 'abc' });
    render(<MemoryRouter><AdminLogin /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText(/admin password/i), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    await waitFor(() => expect(login).toHaveBeenCalledWith('secret'));
  });
});
```

- [ ] **Step 8: Run test, verify it fails**

Run: `cd frontend && npx vitest run src/pages/AdminLogin.test.jsx`
Expected: FAIL — `AdminLogin.jsx` does not exist.

- [ ] **Step 9: Create `frontend/src/pages/AdminLogin.jsx`**

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { login } from '../lib/adminApi.js';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(password);
      navigate('/admin');
    } catch {
      toast.error('Incorrect password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="admin-password">Admin password</label>
      <input
        id="admin-password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={submitting}
      />
      <button type="submit" disabled={submitting}>Log in</button>
    </form>
  );
}
```

- [ ] **Step 10: Run test, verify it passes**

Run: `cd frontend && npx vitest run src/pages/AdminLogin.test.jsx`
Expected: PASS

- [ ] **Step 11: Write the failing test — `frontend/src/components/RequireAdmin.test.jsx`**

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RequireAdmin from './RequireAdmin.jsx';
import * as adminAuth from '../lib/adminAuth.js';

function renderGuarded() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/admin" element={<RequireAdmin><div>Dashboard</div></RequireAdmin>} />
        <Route path="/admin/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('RequireAdmin', () => {
  it('redirects to login when not authenticated', () => {
    vi.spyOn(adminAuth, 'isAuthenticated').mockReturnValue(false);
    renderGuarded();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    vi.spyOn(adminAuth, 'isAuthenticated').mockReturnValue(true);
    renderGuarded();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
```

- [ ] **Step 12: Run test, verify it fails**

Run: `cd frontend && npx vitest run src/components/RequireAdmin.test.jsx`
Expected: FAIL — `RequireAdmin.jsx` does not exist.

- [ ] **Step 13: Create `frontend/src/components/RequireAdmin.jsx`**

```jsx
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../lib/adminAuth.js';

export default function RequireAdmin({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}
```

- [ ] **Step 14: Run test, verify it passes**

Run: `cd frontend && npx vitest run src/components/RequireAdmin.test.jsx`
Expected: PASS

- [ ] **Step 15: Invoke `ui-ux-pro-max`** to design the admin login screen (can be simpler/more utilitarian than the guest flow, but stay on-brand). Apply styling without breaking the `id`/`role`/text contracts the tests rely on.

- [ ] **Step 16: Re-run all three test files after styling**

Run: `cd frontend && npx vitest run src/lib/adminAuth.test.js src/pages/AdminLogin.test.jsx src/components/RequireAdmin.test.jsx`
Expected: PASS

- [ ] **Step 17: Commit**

```bash
git add frontend/src/lib/adminAuth.js frontend/src/lib/api.js frontend/src/lib/adminApi.js frontend/src/pages/AdminLogin.jsx frontend/src/components/RequireAdmin.jsx frontend/src/lib/adminAuth.test.js frontend/src/pages/AdminLogin.test.jsx frontend/src/components/RequireAdmin.test.jsx
git commit -m "feat: admin auth (login page, token storage, route guard)"
```

---

### Task 6: Admin dashboard (seat status)

**Files:**
- Modify: `frontend/src/lib/adminApi.js` — add `listEvents`, `getSeats`
- Create: `frontend/src/components/SeatGrid.jsx`
- Create: `frontend/src/pages/AdminDashboard.jsx`
- Test: `frontend/src/lib/adminApi.dashboard.test.js`
- Test: `frontend/src/pages/AdminDashboard.test.jsx`

**Interfaces:**
- Consumes: `api` (Task 2/5).
- Produces: `listEvents() → Promise<Event[]>`, `getSeats(eventId) → Promise<{seatNumber, status, code}[]>` appended to `adminApi.js`. `<SeatGrid seats={...} />` and `<AdminDashboard />` — fetches the active event's seats on mount and shows an assigned/total count plus the grid.

- [ ] **Step 1: Write the failing test — `frontend/src/lib/adminApi.dashboard.test.js`**

```js
import { describe, it, expect, vi } from 'vitest';
import { listEvents, getSeats } from './adminApi.js';
import { api } from './api.js';

vi.mock('./api.js', () => ({ api: { get: vi.fn(), post: vi.fn() } }));

describe('adminApi dashboard calls', () => {
  it('listEvents GETs /api/admin/events', async () => {
    api.get.mockResolvedValue({ data: [{ _id: '1', isActive: true }] });
    const result = await listEvents();
    expect(api.get).toHaveBeenCalledWith('/api/admin/events');
    expect(result).toEqual([{ _id: '1', isActive: true }]);
  });

  it('getSeats GETs /api/admin/events/:id/seats', async () => {
    api.get.mockResolvedValue({ data: [{ seatNumber: 1, status: 'available', code: null }] });
    const result = await getSeats('evt1');
    expect(api.get).toHaveBeenCalledWith('/api/admin/events/evt1/seats');
    expect(result).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd frontend && npx vitest run src/lib/adminApi.dashboard.test.js`
Expected: FAIL — `listEvents`/`getSeats` not exported yet.

- [ ] **Step 3: Modify `frontend/src/lib/adminApi.js`** — append

```js
export async function listEvents() {
  const { data } = await api.get('/api/admin/events');
  return data;
}

export async function getSeats(eventId) {
  const { data } = await api.get(`/api/admin/events/${eventId}/seats`);
  return data;
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `cd frontend && npx vitest run src/lib/adminApi.dashboard.test.js`
Expected: PASS

- [ ] **Step 5: Create `frontend/src/components/SeatGrid.jsx`**

```jsx
export default function SeatGrid({ seats }) {
  return (
    <div>
      {seats.map((seat) => (
        <div key={seat.seatNumber} data-status={seat.status}>
          {String(seat.seatNumber).padStart(3, '0')}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Write the failing test — `frontend/src/pages/AdminDashboard.test.jsx`**

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AdminDashboard from './AdminDashboard.jsx';
import { listEvents, getSeats } from '../lib/adminApi.js';

vi.mock('../lib/adminApi.js', () => ({ listEvents: vi.fn(), getSeats: vi.fn() }));

describe('AdminDashboard', () => {
  it('shows the assigned/total seat count for the active event', async () => {
    listEvents.mockResolvedValue([{ _id: 'evt1', isActive: true }, { _id: 'evt0', isActive: false }]);
    getSeats.mockResolvedValue([
      { seatNumber: 1, status: 'assigned', code: 'HL001' },
      { seatNumber: 2, status: 'available', code: null },
    ]);
    render(<AdminDashboard />);
    await waitFor(() => expect(getSeats).toHaveBeenCalledWith('evt1'));
    expect(await screen.findByText('1 / 2 seats assigned')).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Run test, verify it fails**

Run: `cd frontend && npx vitest run src/pages/AdminDashboard.test.jsx`
Expected: FAIL — `AdminDashboard.jsx` does not exist.

- [ ] **Step 8: Create `frontend/src/pages/AdminDashboard.jsx`**

```jsx
import { useEffect, useState } from 'react';
import { listEvents, getSeats } from '../lib/adminApi.js';
import SeatGrid from '../components/SeatGrid.jsx';

export default function AdminDashboard() {
  const [seats, setSeats] = useState([]);

  useEffect(() => {
    listEvents().then((events) => {
      const active = events.find((e) => e.isActive);
      if (active) getSeats(active._id).then(setSeats);
    });
  }, []);

  const assignedCount = seats.filter((s) => s.status === 'assigned').length;

  return (
    <div>
      <p>{assignedCount} / {seats.length} seats assigned</p>
      <SeatGrid seats={seats} />
    </div>
  );
}
```

- [ ] **Step 9: Run test, verify it passes**

Run: `cd frontend && npx vitest run src/pages/AdminDashboard.test.jsx`
Expected: PASS

- [ ] **Step 10: Invoke `ui-ux-pro-max`** to design the seat-grid layout (100 cells, clear available/assigned visual distinction, mobile-first — admin may check this from a phone at the door) using the palette from `docs/PROJECT-PLAN.md`. Keep `data-status` attributes and the `"N / M seats assigned"` text intact so the tests above keep passing.

- [ ] **Step 11: Re-run tests after styling**

Run: `cd frontend && npx vitest run src/lib/adminApi.dashboard.test.js src/pages/AdminDashboard.test.jsx`
Expected: PASS

- [ ] **Step 12: Commit**

```bash
git add frontend/src/lib/adminApi.js frontend/src/components/SeatGrid.jsx frontend/src/pages/AdminDashboard.jsx frontend/src/lib/adminApi.dashboard.test.js frontend/src/pages/AdminDashboard.test.jsx
git commit -m "feat: admin dashboard seat status"
```

---

### Task 7: Admin drinks management

**Files:**
- Modify: `frontend/src/lib/adminApi.js` — add `listDrinks`, `createDrink`, `deleteDrink`
- Create: `frontend/src/pages/AdminDrinks.jsx`
- Test: `frontend/src/lib/adminApi.drinks.test.js`
- Test: `frontend/src/pages/AdminDrinks.test.jsx`

**Interfaces:**
- Consumes: `api` (Task 2/5), `listEvents` (Task 6).
- Produces: `listDrinks(eventId)`, `createDrink(eventId, drink)`, `deleteDrink(id)` appended to `adminApi.js`. `<AdminDrinks />` — fetches the active event, lists its drinks, and supports adding/removing a drink via a `react-hook-form` form.

- [ ] **Step 1: Write the failing test — `frontend/src/lib/adminApi.drinks.test.js`**

```js
import { describe, it, expect, vi } from 'vitest';
import { listDrinks, createDrink, deleteDrink } from './adminApi.js';
import { api } from './api.js';

vi.mock('./api.js', () => ({ api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }));

describe('adminApi drinks calls', () => {
  it('listDrinks GETs the event drinks', async () => {
    api.get.mockResolvedValue({ data: [] });
    await listDrinks('evt1');
    expect(api.get).toHaveBeenCalledWith('/api/admin/events/evt1/drinks');
  });

  it('createDrink POSTs a new drink', async () => {
    api.post.mockResolvedValue({ data: { _id: 'd1' } });
    const result = await createDrink('evt1', { category: 'Whisky', name: 'X', price: 1, order: 0 });
    expect(api.post).toHaveBeenCalledWith('/api/admin/events/evt1/drinks', { category: 'Whisky', name: 'X', price: 1, order: 0 });
    expect(result).toEqual({ _id: 'd1' });
  });

  it('deleteDrink DELETEs by id', async () => {
    api.delete.mockResolvedValue({});
    await deleteDrink('d1');
    expect(api.delete).toHaveBeenCalledWith('/api/admin/drinks/d1');
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd frontend && npx vitest run src/lib/adminApi.drinks.test.js`
Expected: FAIL — functions not exported yet.

- [ ] **Step 3: Modify `frontend/src/lib/adminApi.js`** — append

```js
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
```

- [ ] **Step 4: Run test, verify it passes**

Run: `cd frontend && npx vitest run src/lib/adminApi.drinks.test.js`
Expected: PASS

- [ ] **Step 5: Write the failing test — `frontend/src/pages/AdminDrinks.test.jsx`**

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminDrinks from './AdminDrinks.jsx';
import { listEvents, listDrinks, createDrink, deleteDrink } from '../lib/adminApi.js';

vi.mock('../lib/adminApi.js', () => ({
  listEvents: vi.fn(), listDrinks: vi.fn(), createDrink: vi.fn(), deleteDrink: vi.fn(),
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }));

describe('AdminDrinks', () => {
  it('lists existing drinks for the active event', async () => {
    listEvents.mockResolvedValue([{ _id: 'evt1', isActive: true }]);
    listDrinks.mockResolvedValue([{ _id: 'd1', category: 'Whisky', name: 'Glenfiddich 18 Years', price: 300000 }]);
    render(<AdminDrinks />);
    expect(await screen.findByText(/Glenfiddich 18 Years/)).toBeInTheDocument();
  });

  it('adds a drink via the form', async () => {
    listEvents.mockResolvedValue([{ _id: 'evt1', isActive: true }]);
    listDrinks.mockResolvedValue([]);
    createDrink.mockResolvedValue({ _id: 'd2', category: 'Tequila', name: 'Azul', price: 800000, order: 0 });
    render(<AdminDrinks />);
    await waitFor(() => expect(listDrinks).toHaveBeenCalled());
    fireEvent.change(screen.getByPlaceholderText('Category'), { target: { value: 'Tequila' } });
    fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'Azul' } });
    fireEvent.change(screen.getByPlaceholderText('Price'), { target: { value: '800000' } });
    fireEvent.click(screen.getByRole('button', { name: /add drink/i }));
    await waitFor(() => expect(createDrink).toHaveBeenCalledWith('evt1', { category: 'Tequila', name: 'Azul', price: 800000, order: 0 }));
  });
});
```

- [ ] **Step 6: Run test, verify it fails**

Run: `cd frontend && npx vitest run src/pages/AdminDrinks.test.jsx`
Expected: FAIL — `AdminDrinks.jsx` does not exist.

- [ ] **Step 7: Create `frontend/src/pages/AdminDrinks.jsx`**

```jsx
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { listEvents, listDrinks, createDrink, deleteDrink } from '../lib/adminApi.js';

export default function AdminDrinks() {
  const [eventId, setEventId] = useState(null);
  const [drinks, setDrinks] = useState([]);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    listEvents().then((events) => {
      const active = events.find((e) => e.isActive);
      if (active) {
        setEventId(active._id);
        listDrinks(active._id).then(setDrinks);
      }
    });
  }, []);

  async function onSubmit(values) {
    const drink = await createDrink(eventId, {
      category: values.category,
      name: values.name,
      price: Number(values.price),
      order: drinks.length,
    });
    setDrinks((prev) => [...prev, drink]);
    reset();
    toast.success('Drink added.');
  }

  async function handleDelete(id) {
    await deleteDrink(id);
    setDrinks((prev) => prev.filter((d) => d._id !== id));
  }

  if (!eventId) return <p>Loading…</p>;

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input placeholder="Category" {...register('category', { required: true })} />
        <input placeholder="Name" {...register('name', { required: true })} />
        <input placeholder="Price" type="number" {...register('price', { required: true })} />
        <button type="submit">Add drink</button>
      </form>
      <ul>
        {drinks.map((drink) => (
          <li key={drink._id}>
            {drink.category} — {drink.name} — ₦{drink.price.toLocaleString()}
            <button onClick={() => handleDelete(drink._id)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 8: Run test, verify it passes**

Run: `cd frontend && npx vitest run src/pages/AdminDrinks.test.jsx`
Expected: PASS

- [ ] **Step 9: Invoke `ui-ux-pro-max`** to design the drinks-management form/list (this is an internal admin tool — clarity and speed of editing matter more than the guest-facing polish, but stay on-brand). Keep placeholders/roles/text intact for the tests above.

- [ ] **Step 10: Re-run tests after styling**

Run: `cd frontend && npx vitest run src/lib/adminApi.drinks.test.js src/pages/AdminDrinks.test.jsx`
Expected: PASS

- [ ] **Step 11: Commit**

```bash
git add frontend/src/lib/adminApi.js frontend/src/pages/AdminDrinks.jsx frontend/src/lib/adminApi.drinks.test.js frontend/src/pages/AdminDrinks.test.jsx
git commit -m "feat: admin drinks management"
```

---

### Task 8: Router wiring

**Files:**
- Create: `frontend/src/router.jsx`
- Modify: `frontend/src/main.jsx` — mount the router + `<Toaster />` instead of the placeholder `App`
- Delete: `frontend/src/App.jsx`
- Delete: `frontend/src/test/App.test.jsx`
- Test: `frontend/src/router.test.jsx`

**Interfaces:**
- Consumes: `GuestEntry` (Task 3), `GuestInvitation` (Task 4), `AdminLogin`/`RequireAdmin` (Task 5), `AdminDashboard` (Task 6), `AdminDrinks` (Task 7).
- Produces: `router` (a `createBrowserRouter` instance) from `router.jsx`, mounted in `main.jsx`.

- [ ] **Step 1: Write the failing test — `frontend/src/router.test.jsx`** (uses `createMemoryRouter` directly rather than importing the browser router, since jsdom has no real browser navigation)

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import GuestEntry from './pages/GuestEntry.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import RequireAdmin from './components/RequireAdmin.jsx';
import * as adminAuth from './lib/adminAuth.js';

function testRouter(initialPath) {
  const routes = [
    { path: '/', element: <GuestEntry /> },
    { path: '/admin/login', element: <AdminLogin /> },
    { path: '/admin', element: <RequireAdmin><AdminDashboard /></RequireAdmin> },
  ];
  return createMemoryRouter(routes, { initialEntries: [initialPath] });
}

describe('routing', () => {
  it('renders the guest entry form at /', () => {
    render(<RouterProvider router={testRouter('/')} />);
    expect(screen.getByLabelText(/invitation code/i)).toBeInTheDocument();
  });

  it('redirects unauthenticated /admin to /admin/login', () => {
    vi.spyOn(adminAuth, 'isAuthenticated').mockReturnValue(false);
    render(<RouterProvider router={testRouter('/admin')} />);
    expect(screen.getByLabelText(/admin password/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test, verify it fails or errors** (the referenced page components exist from earlier tasks, so this may partially pass already — the point of this task is `router.jsx` itself, checked in the next step)

Run: `cd frontend && npx vitest run src/router.test.jsx`
Expected: PASS (this test only exercises the page components directly, not `router.jsx`, so it should already pass — proceed to wire the real router)

- [ ] **Step 3: Create `frontend/src/router.jsx`**

```jsx
import { createBrowserRouter } from 'react-router-dom';
import GuestEntry from './pages/GuestEntry.jsx';
import GuestInvitation from './pages/GuestInvitation.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminDrinks from './pages/AdminDrinks.jsx';
import RequireAdmin from './components/RequireAdmin.jsx';

export const router = createBrowserRouter([
  { path: '/', element: <GuestEntry /> },
  { path: '/invitation', element: <GuestInvitation /> },
  { path: '/admin/login', element: <AdminLogin /> },
  { path: '/admin', element: <RequireAdmin><AdminDashboard /></RequireAdmin> },
  { path: '/admin/drinks', element: <RequireAdmin><AdminDrinks /></RequireAdmin> },
]);
```

- [ ] **Step 4: Modify `frontend/src/main.jsx`**

```jsx
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { router } from './router.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <>
    <Toaster />
    <RouterProvider router={router} />
  </>
);
```

- [ ] **Step 5: Delete `frontend/src/App.jsx` and `frontend/src/test/App.test.jsx`** — superseded by the router.

- [ ] **Step 6: Run the full frontend test suite**

Run: `cd frontend && npm test`
Expected: PASS, no references to the deleted `App.jsx` remain.

- [ ] **Step 7: Run the dev server and manually click through the golden path**

Run: `cd frontend && npm run dev` (with the backend from the other plan running and seeded — see backend plan Task 9)
Manually verify on a mobile-width viewport: enter a valid code at `/` → land on `/invitation` with the correct seat/drinks → log in at `/admin/login` with the shared password → see the seat grid at `/admin` → manage drinks at `/admin/drinks`.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/router.jsx frontend/src/main.jsx frontend/src/router.test.jsx
git rm frontend/src/App.jsx frontend/src/test/App.test.jsx
git commit -m "feat: wire up guest and admin routing"
```

---

## Self-Review Notes

- Mobile-first: enforced at the `ui-ux-pro-max` step in every UI task rather than baked into this plan's placeholder markup — final responsive classes come from that skill, per root `CLAUDE.md`.
- No PII: `GuestEntry`'s only field is the invitation code; no name/email/phone field exists anywhere in the frontend.
- No download/save button: intentionally absent from `GuestInvitation.jsx` — confirmed against the spec.
- Single shared Axios instance: `api.js` created once in Task 2, extended (interceptor) in Task 5, never re-instantiated elsewhere.
- `VITE_API_URL` read from env, never hardcoded — confirmed in `api.js`.
