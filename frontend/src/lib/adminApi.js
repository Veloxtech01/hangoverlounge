import { api } from './api.js';
import { setToken } from './adminAuth.js';

export async function login(password) {
  const { data } = await api.post('/api/admin/auth/login', { password });
  setToken(data.token);
  return data;
}

export async function listEvents() {
  const { data } = await api.get('/api/admin/events');
  return data;
}

export async function getSeats(eventId) {
  const { data } = await api.get(`/api/admin/events/${eventId}/seats`);
  return data;
}
