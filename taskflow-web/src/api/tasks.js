import api from './client';

export const listTasks = async (params) => (await api.get('/api/tasks', { params })).data;
export const getTask = async (id) => (await api.get(`/api/tasks/${id}`)).data.data;
export const createTask = async (task) => (await api.post('/api/tasks', task)).data.data;
export const updateTask = async (id, task) => (await api.put(`/api/tasks/${id}`, task)).data.data;
export const patchTask = async (id, fields) => (await api.patch(`/api/tasks/${id}`, fields)).data.data;
export const deleteTask = (id) => api.delete(`/api/tasks/${id}`);
