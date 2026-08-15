import axios from 'axios';
import { getToken } from './adminAuth.js';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token && config.url?.startsWith('/api/admin')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
