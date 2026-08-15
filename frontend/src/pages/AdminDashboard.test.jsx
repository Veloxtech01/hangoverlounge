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
