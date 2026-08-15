import { describe, it, expect, vi } from 'vitest';
import { listEvents, getSeats } from './adminApi.js';
import { api } from './api.js';

vi.mock('./api.js', () => ({ api: { get: vi.fn(), post: vi.fn() } }));

describe('adminApi dashboard calls', () => {
  it('listEvents GETs /api/admin/events', async () => {
    api.get.mockResolvedValue({ data: [{ _id: '1', isActive: true }] });
    const result = await listEvents();
    expect(api.get).toHaveBeenCalledWith('/api/admin/events');
    expect(result).toEqual([{ _id: '1', isActive: true }]);
  });

  it('getSeats GETs /api/admin/events/:id/seats', async () => {
    api.get.mockResolvedValue({ data: [{ seatNumber: 1, status: 'available', code: null }] });
    const result = await getSeats('evt1');
    expect(api.get).toHaveBeenCalledWith('/api/admin/events/evt1/seats');
    expect(result).toHaveLength(1);
  });
});
