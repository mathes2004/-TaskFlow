import api, { getCsrfCookie } from './client';

export async function register(payload) {
  await getCsrfCookie();
  const { data } = await api.post('/api/register', payload);
  return data.data;
}
export async function login(payload) {
  await getCsrfCookie();
  const { data } = await api.post('/api/login', payload);
  return data.data;
}
export const logout = () => api.post('/api/logout');
export const fetchMe = async () => (await api.get('/api/user')).data.data;

export async function forgotPassword(email) {
  await getCsrfCookie();
  return (await api.post('/api/forgot-password', { email })).data;
}
export async function resetPassword(payload) {
  await getCsrfCookie();
  return (await api.post('/api/reset-password', payload)).data;
}
