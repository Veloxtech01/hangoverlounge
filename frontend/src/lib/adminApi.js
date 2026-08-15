import { api } from './api.js';
import { setToken } from './adminAuth.js';

export async function login(password) {
  const { data } = await api.post('/api/admin/auth/login', { password });
  setToken(data.token);
  return data;
}
