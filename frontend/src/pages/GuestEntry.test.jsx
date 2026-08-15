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
