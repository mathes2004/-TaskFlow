import axios from 'axios';
import { mockAdapter } from './mock/mockAdapter';

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // send and receive cookies
  withXSRFToken: true, // copy XSRF-TOKEN cookie into X-XSRF-TOKEN header
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: 15000,
  ...(USE_MOCK ? { adapter: mockAdapter } : {}),
});

export const getCsrfCookie = () => api.get('/sanctum/csrf-cookie');

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const original = error.config;

    // CSRF token expired: refresh once and retry the same request
    if (status === 419 && original && !original._retried) {
      original._retried = true;
      await getCsrfCookie();
      return api(original);
    }
    // Session ended: tell the app to log out (AuthContext listens for this)
    if (status === 401 && original && !(original.method === 'get' && original.url === '/api/user')) {
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(error);
  },
);

export default api;
