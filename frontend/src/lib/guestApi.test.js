import { describe, it, expect, vi } from 'vitest';
import { getTableInvitation } from './guestApi.js';
import { api } from './api.js';

vi.mock('./api.js', () => ({ api: { get: vi.fn() } }));

describe('getTableInvitation', () => {
  it('GETs the table endpoint and returns the response data', async () => {
    api.get.mockResolvedValue({ data: { active: true, tableNumber: 7, event: {}, drinks: [] } });
    const result = await getTableInvitation(7);
    expect(api.get).toHaveBeenCalledWith('/api/guest/table/7');
    expect(result).toEqual({ active: true, tableNumber: 7, event: {}, drinks: [] });
  });
});
