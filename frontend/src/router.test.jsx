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
