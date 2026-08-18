import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminEvents from './AdminEvents.jsx';
import { listEvents, createEvent, activateEvent } from '../lib/adminApi.js';

vi.mock('../lib/adminApi.js', () => ({
  listEvents: vi.fn(),
  createEvent: vi.fn(),
  activateEvent: vi.fn(),
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

function renderEvents() {
  return render(
    <MemoryRouter initialEntries={['/admin/events']}>
      <AdminEvents />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AdminEvents', () => {
  it('lists existing events with active status', async () => {
    listEvents.mockResolvedValue([
      { _id: 'evt1', name: 'One Year Anniversary', isActive: true },
      { _id: 'evt2', name: 'Next Event', isActive: false },
    ]);
    renderEvents();
    expect(await screen.findByText('One Year Anniversary')).toBeInTheDocument();
    expect(screen.getByText('Next Event')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('creates an event via the form', async () => {
    listEvents.mockResolvedValue([]);
    createEvent.mockResolvedValue({ id: 'evt3' });
    renderEvents();
    await waitFor(() => expect(listEvents).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText('Event name'), { target: { value: 'New Event' } });
    fireEvent.change(screen.getByPlaceholderText('Venue'), { target: { value: 'Hangover Lounge' } });
    fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2026-10-01T18:00' } });
    fireEvent.click(screen.getByRole('button', { name: /create event/i }));

    await waitFor(() => expect(createEvent).toHaveBeenCalled());
    const payload = createEvent.mock.calls[0][0];
    expect(payload.name).toBe('New Event');
    expect(payload.venue).toBe('Hangover Lounge');
    expect(payload.eventDate).toContain('2026-10-01T18:00');
  });

  it('shows required errors for empty fields on submit', async () => {
    listEvents.mockResolvedValue([]);
    renderEvents();
    await waitFor(() => expect(listEvents).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: /create event/i }));
    expect(await screen.findAllByText('Required')).not.toHaveLength(0);
    expect(createEvent).not.toHaveBeenCalled();
  });

  it('activates an inactive event', async () => {
    listEvents.mockResolvedValue([
      { _id: 'evt1', name: 'One Year Anniversary', isActive: true },
      { _id: 'evt2', name: 'Next Event', isActive: false },
    ]);
    activateEvent.mockResolvedValue({ id: 'evt2', isActive: true });
    renderEvents();
    await screen.findByText('Next Event');

    fireEvent.click(screen.getByRole('button', { name: /activate/i }));
    await waitFor(() => expect(activateEvent).toHaveBeenCalledWith('evt2'));
  });
});
