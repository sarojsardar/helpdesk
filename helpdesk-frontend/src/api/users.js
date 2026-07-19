import api from './axios';

export const getCategories  = ()           => api.get('/categories');
export const createCategory = (data)       => api.post('/categories', data);
export const updateCategory = (id, data)   => api.put(`/categories/${id}`, data);
export const deleteCategory = (id)         => api.delete(`/categories/${id}`);

export const getAgents      = ()           => api.get('/users/agents');
export const getUsers       = (params)     => api.get('/users', { params });
export const updateUser     = (id, data)   => api.put(`/users/${id}`, data);
export const getStats       = ()           => api.get('/stats');
export const getAuditLog    = (params)     => api.get('/audit-log', { params });

export const send2FA        = ()           => api.post('/2fa/send');
export const verify2FA      = (code)       => api.post('/2fa/verify', { code });

export const updateProfile  = (data)       => api.put('/profile', data);
export const changePassword = (data)       => api.put('/profile/password', data);
