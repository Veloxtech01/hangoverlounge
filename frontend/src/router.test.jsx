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
