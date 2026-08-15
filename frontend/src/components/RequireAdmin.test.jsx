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
