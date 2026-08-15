import axios from 'axios';
import { getToken, clearToken } from './adminAuth.js';

if (!import.meta.env.VITE_API_URL) {
  // Fail loudly at build/dev time instead of silently 404ing every request
  // against same-origin.
  console.error(
    '[api] VITE_API_URL is not set — API requests will be sent to the same origin as the frontend, which is almost certainly wrong.'
  );
}

const ADMIN_PREFIX = '/api/admin';
const ADMIN_LOGIN_PATH = '/api/admin/auth/login';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  const isAdminRoute = config.url?.startsWith(ADMIN_PREFIX) && config.url !== ADMIN_LOGIN_PATH;
  if (token && isAdminRoute) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const isAdminRoute = url?.startsWith(ADMIN_PREFIX) && url !== ADMIN_LOGIN_PATH;
    if (status === 401 && isAdminRoute) {
      clearToken();
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);
