import { api } from './api.js';

export async function getTableInvitation(tableNumber) {
  const { data } = await api.get(`/api/guest/table/${tableNumber}`);
  return data;
}
