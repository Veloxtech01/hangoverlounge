import { describe, it, expect, vi } from 'vitest';
import { getCodes } from './adminApi.js';
import { api } from './api.js';

vi.mock('./api.js', () => ({ api: { get: vi.fn() } }));

describe('adminApi codes calls', () => {
  it('getCodes GETs /api/admin/events/:id/codes', async () => {
    api.get.mockResolvedValue({
      data: [{ code: 'HL001', seatNumber: null, redeemedAt: null }],
    });
    const result = await getCodes('evt1');
    expect(api.get).toHaveBeenCalledWith('/api/admin/events/evt1/codes');
    expect(result).toEqual([{ code: 'HL001', seatNumber: null, redeemedAt: null }]);
  });
});
