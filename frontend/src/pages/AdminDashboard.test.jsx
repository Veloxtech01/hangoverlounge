import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminDashboard from './AdminDashboard.jsx';
import { listEvents, getSeats } from '../lib/adminApi.js';

vi.mock('../lib/adminApi.js', () => ({ listEvents: vi.fn(), getSeats: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn() } }));

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <AdminDashboard />
    </MemoryRouter>
  );
}

describe('AdminDashboard', () => {
  it('shows the assigned/total seat count for the active event', async () => {
    listEvents.mockResolvedValue([{ _id: 'evt1', isActive: true }, { _id: 'evt0', isActive: false }]);
    getSeats.mockResolvedValue([
      { seatNumber: 1, status: 'assigned', code: 'HL001' },
      { seatNumber: 2, status: 'available', code: null },
    ]);
    renderDashboard();
    await waitFor(() => expect(getSeats).toHaveBeenCalledWith('evt1'));
    expect(await screen.findByText('1 / 2 seats assigned')).toBeInTheDocument();
  });

  it('stops loading and shows a toast error when fetching seats fails', async () => {
    listEvents.mockRejectedValue(new Error('network down'));
    renderDashboard();
    await waitFor(() => expect(screen.queryByText('Loading seats…')).not.toBeInTheDocument());
    expect(toast.error).toHaveBeenCalledWith('Failed to load seat status.');
  });

  it('shows a distinct message when there is no active event', async () => {
    listEvents.mockResolvedValue([{ _id: 'evt0', isActive: false }]);
    renderDashboard();
    expect(await screen.findByText('No active event configured.')).toBeInTheDocument();
    expect(screen.queryByText(/seats assigned/)).not.toBeInTheDocument();
  });
});
