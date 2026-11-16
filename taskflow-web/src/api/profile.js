import api from './client';

export const updateProfile = async (payload) => (await api.patch('/api/user', payload)).data.data;
export const updatePassword = (payload) => api.put('/api/user/password', payload);
export const deleteAccount = (payload) => api.delete('/api/user', { data: payload });
