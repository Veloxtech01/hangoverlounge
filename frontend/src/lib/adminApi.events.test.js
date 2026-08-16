import { describe, it, expect, vi } from 'vitest';
import { createEvent, activateEvent } from './adminApi.js';
import { api } from './api.js';

vi.mock('./api.js', () => ({ api: { get: vi.fn(), post: vi.fn() } }));

describe('adminApi events calls', () => {
  it('createEvent POSTs the event fields and returns the created event + codes', async () => {
    api.post.mockResolvedValue({ data: { id: 'evt1', codes: ['048213'] } });
    const payload = { name: 'X', tagline: 'Y', eventDate: '2026-09-11T18:00:00+01:00', venue: 'V' };
    const result = await createEvent(payload);
    expect(api.post).toHaveBeenCalledWith('/api/admin/events', payload);
    expect(result).toEqual({ id: 'evt1', codes: ['048213'] });
  });

  it('activateEvent POSTs to the activate endpoint', async () => {
    api.post.mockResolvedValue({ data: { id: 'evt1', isActive: true } });
    const result = await activateEvent('evt1');
    expect(api.post).toHaveBeenCalledWith('/api/admin/events/evt1/activate');
    expect(result).toEqual({ id: 'evt1', isActive: true });
  });
});
