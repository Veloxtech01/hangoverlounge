import { describe, it, expect, vi } from 'vitest';
import { listDrinks, createDrink, deleteDrink } from './adminApi.js';
import { api } from './api.js';

vi.mock('./api.js', () => ({ api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }));

describe('adminApi drinks calls', () => {
  it('listDrinks GETs the event drinks', async () => {
    api.get.mockResolvedValue({ data: [] });
    await listDrinks('evt1');
    expect(api.get).toHaveBeenCalledWith('/api/admin/events/evt1/drinks');
  });

  it('createDrink POSTs a new drink', async () => {
    api.post.mockResolvedValue({ data: { _id: 'd1' } });
    const result = await createDrink('evt1', { category: 'Whisky', name: 'X', price: 1, order: 0 });
    expect(api.post).toHaveBeenCalledWith('/api/admin/events/evt1/drinks', { category: 'Whisky', name: 'X', price: 1, order: 0 });
    expect(result).toEqual({ _id: 'd1' });
  });

  it('deleteDrink DELETEs by id', async () => {
    api.delete.mockResolvedValue({});
    await deleteDrink('d1');
    expect(api.delete).toHaveBeenCalledWith('/api/admin/drinks/d1');
  });
});
