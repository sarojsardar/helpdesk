import api from './axios';

// Articles
export const getKbArticles   = (params) => api.get('/kb/articles', { params });
export const getKbArticle    = (slugOrId) => api.get(`/kb/articles/${slugOrId}`);
export const createKbArticle = (data) => api.post('/kb/articles', data);
export const updateKbArticle = (id, data) => api.put(`/kb/articles/${id}`, data);
export const deleteKbArticle = (id) => api.delete(`/kb/articles/${id}`);
export const voteKbArticle   = (id, helpful) => api.post(`/kb/articles/${id}/vote`, { helpful });

// Categories
export const getKbCategories   = () => api.get('/kb/categories');
export const createKbCategory  = (data) => api.post('/kb/categories', data);
export const updateKbCategory  = (id, data) => api.put(`/kb/categories/${id}`, data);
export const deleteKbCategory  = (id) => api.delete(`/kb/categories/${id}`);
