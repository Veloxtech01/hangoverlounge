import { describe, it, expect, vi } from 'vitest';
import { redeemCode } from './guestApi.js';
import { api } from './api.js';

vi.mock('./api.js', () => ({ api: { post: vi.fn() } }));

describe('redeemCode', () => {
  it('posts the code and returns the response data', async () => {
    api.post.mockResolvedValue({ data: { seatNumber: 7 } });
    const result = await redeemCode('HL001');
    expect(api.post).toHaveBeenCalledWith('/api/guest/redeem', { code: 'HL001' });
    expect(result).toEqual({ seatNumber: 7 });
  });
});
