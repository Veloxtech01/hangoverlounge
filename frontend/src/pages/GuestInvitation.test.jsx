import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import GuestInvitation from './GuestInvitation.jsx';

const sampleState = {
  event: { name: 'One Year Anniversary', tagline: 'Liquid Therapy', eventDate: '2026-09-11T18:00:00.000Z', venue: 'Hangover Lounge' },
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

  it('includes the event time-of-day alongside the date', () => {
    renderWithState(sampleState);
    expect(screen.getByText(/\d{1,2}:\d{2}\s?(AM|PM)/i)).toBeInTheDocument();
  });

  it('redirects to entry when no state is present', () => {
    renderWithState(undefined);
    expect(screen.getByText('Entry Page')).toBeInTheDocument();
  });
});
