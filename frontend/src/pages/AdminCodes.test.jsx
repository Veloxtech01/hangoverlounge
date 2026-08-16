import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminCodes from './AdminCodes.jsx';
import { listEvents, getCodes } from '../lib/adminApi.js';

vi.mock('../lib/adminApi.js', () => ({
  listEvents: vi.fn(),
  getCodes: vi.fn(),
}));
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn() } }));

function renderCodes() {
  return render(
    <MemoryRouter initialEntries={['/admin/codes']}>
      <AdminCodes />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AdminCodes', () => {
  it('lists codes with redemption status and seat number', async () => {
    listEvents.mockResolvedValue([{ _id: 'evt1', isActive: true }]);
    getCodes.mockResolvedValue([
      { code: 'HL001', seatNumber: 1, redeemedAt: '2026-08-15T12:00:00.000Z' },
      { code: 'HL002', seatNumber: null, redeemedAt: null },
    ]);
    renderCodes();

    expect(await screen.findByText('HL001')).toBeInTheDocument();
    expect(screen.getByText('HL002')).toBeInTheDocument();
    expect(screen.getByText('Redeemed')).toBeInTheDocument();
    expect(screen.getByText('Not redeemed')).toBeInTheDocument();
  });

  it('shows a distinct message when there is no active event', async () => {
    listEvents.mockResolvedValue([]);
    renderCodes();
    expect(await screen.findByText(/no active event configured/i)).toBeInTheDocument();
  });

  it('downloads a CSV of the codes when the export button is clicked', async () => {
    listEvents.mockResolvedValue([{ _id: 'evt1', isActive: true }]);
    getCodes.mockResolvedValue([
      { code: 'HL001', seatNumber: 1, redeemedAt: '2026-08-15T12:00:00.000Z' },
    ]);

    const createObjectURL = vi.fn(() => 'blob:mock-url');
    const revokeObjectURL = vi.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    renderCodes();
    expect(await screen.findByText('HL001')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /download csv/i }));

    await waitFor(() => expect(createObjectURL).toHaveBeenCalled());
    const blobArg = createObjectURL.mock.calls[0][0];
    expect(blobArg.type).toBe('text/csv;charset=utf-8;');
    expect(clickSpy).toHaveBeenCalled();

    clickSpy.mockRestore();
  });
});
