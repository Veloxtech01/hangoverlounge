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

export async function listDrinks(eventId) {
  const { data } = await api.get(`/api/admin/events/${eventId}/drinks`);
  return data;
}

export async function createDrink(eventId, drink) {
  const { data } = await api.post(`/api/admin/events/${eventId}/drinks`, drink);
  return data;
}

export async function deleteDrink(id) {
  await api.delete(`/api/admin/drinks/${id}`);
}

export async function getCodes(eventId) {
  const { data } = await api.get(`/api/admin/events/${eventId}/codes`);
  return data;
}

export async function createEvent(payload) {
  const { data } = await api.post('/api/admin/events', payload);
  return data;
}

export async function activateEvent(eventId) {
  const { data } = await api.post(`/api/admin/events/${eventId}/activate`);
  return data;
}
