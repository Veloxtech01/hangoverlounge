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
