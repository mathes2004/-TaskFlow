import api from './client';

export const getDashboard = async () => (await api.get('/api/dashboard')).data.data;
