import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from './router.jsx';
import * as adminAuth from './lib/adminAuth.js';

function testRouter(initialPath) {
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

  it('guards /admin/drinks the same way as /admin', () => {
    vi.spyOn(adminAuth, 'isAuthenticated').mockReturnValue(false);
    render(<RouterProvider router={testRouter('/admin/drinks')} />);
    expect(screen.getByLabelText(/admin password/i)).toBeInTheDocument();
  });

  it('renders GuestInvitation at /invitation when given guest state', () => {
    const router = createMemoryRouter(routes, {
      initialEntries: [
        {
          pathname: '/invitation',
          state: {
            event: { name: 'Test Event', eventDate: '2026-09-11T18:00:00.000Z', venue: 'Hangover Lounge' },
            seatNumber: 3,
            drinks: [],
          },
        },
      ],
    });
    render(<RouterProvider router={router} />);
    expect(screen.getByText('Seat 003')).toBeInTheDocument();
  });

  it('redirects /invitation to / when no guest state is present', () => {
    render(<RouterProvider router={testRouter('/invitation')} />);
    expect(screen.getByLabelText(/invitation code/i)).toBeInTheDocument();
  });

  it('renders a not-found page for an unknown path', () => {
    render(<RouterProvider router={testRouter('/does-not-exist')} />);
    expect(screen.getByText(/page not found/i)).toBeInTheDocument();
  });
});
