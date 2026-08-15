import { api } from './api.js';

export async function redeemCode(code) {
  const { data } = await api.post('/api/guest/redeem', { code });
  return data;
}
