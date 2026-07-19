import api from './axios';

export const getTickets    = (params)          => api.get('/tickets', { params });
export const getTicket     = (id)              => api.get(`/tickets/${id}`);
export const createTicket  = (data)            => api.post('/tickets', data);
export const updateTicket  = (id, data)        => api.put(`/tickets/${id}`, data);
export const deleteTicket  = (id)              => api.delete(`/tickets/${id}`);
export const updateStatus  = (id, status)      => api.patch(`/tickets/${id}/status`, { status });
export const assignTicket  = (id, agent_id)    => api.patch(`/tickets/${id}/assign`, { agent_id });
export const addReply      = (id, data)        => api.post(`/tickets/${id}/replies`, data);
export const rateTicket    = (id, data)        => api.post(`/tickets/${id}/rating`, data);
export const mergeTicket   = (id, source_ticket_id) => api.post(`/tickets/${id}/merge`, { source_ticket_id });
export const bulkUpdate    = (data)            => api.post('/tickets/bulk', data);
export const syncTags      = (id, tag_ids)     => api.put(`/tickets/${id}/tags`, { tag_ids });

export const getTags       = ()                => api.get('/tags');
export const createTag     = (data)            => api.post('/tags', data);
export const updateTag     = (id, data)        => api.put(`/tags/${id}`, data);
export const deleteTag     = (id)              => api.delete(`/tags/${id}`);

export const getSavedFilters  = ()             => api.get('/saved-filters');
export const createSavedFilter= (data)         => api.post('/saved-filters', data);
export const deleteSavedFilter= (id)           => api.delete(`/saved-filters/${id}`);
