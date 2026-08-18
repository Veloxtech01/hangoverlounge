import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import GuestInvitation from './GuestInvitation.jsx';
import { getTableInvitation } from '../lib/guestApi.js';

vi.mock('../lib/guestApi.js', () => ({ getTableInvitation: vi.fn() }));

function renderAtTable(tableNumber) {
  return render(
    <MemoryRouter initialEntries={[`/invitation/${tableNumber}`]}>
      <Routes>
        <Route path="/invitation/:tableNumber" element={<GuestInvitation />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('GuestInvitation', () => {
  it('fetches by the table number in the URL and renders the invitation', async () => {
    getTableInvitation.mockResolvedValue({
      active: true,
      tableNumber: 7,
      event: {
        name: 'One Year Anniversary',
        tagline: 'Liquid Therapy',
        eventDate: '2026-09-11T18:00:00.000Z',
        venue: 'Hangover Lounge',
      },
      drinks: [{ category: 'Whisky', name: 'Glenfiddich 18 Years', price: 300000 }],
    });
    renderAtTable(7);
    expect(await screen.findByText('Table 007')).toBeInTheDocument();
    expect(screen.getByText(/Glenfiddich 18 Years/)).toBeInTheDocument();
    expect(getTableInvitation).toHaveBeenCalledWith('7');
  });

  it('shows a holding screen without a table number when no event is active', async () => {
    getTableInvitation.mockResolvedValue({ active: false });
    renderAtTable(12);
    expect(await screen.findByText(/no event right now/i)).toBeInTheDocument();
    expect(screen.queryByText(/table 012/i)).not.toBeInTheDocument();
  });

  it('shows a not-recognized message when the table number is invalid', async () => {
    getTableInvitation.mockRejectedValue({ response: { status: 400 } });
    renderAtTable(9999);
    expect(await screen.findByText(/isn't recognized/i)).toBeInTheDocument();
  });
});
