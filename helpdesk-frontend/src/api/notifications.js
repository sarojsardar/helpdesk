import api from './axios';

export const getNotifications  = ()     => api.get('/notifications');
export const markRead          = (id)   => api.patch(`/notifications/${id}/read`);
export const markAllRead       = ()     => api.post('/notifications/read-all');

export const getCannedResponses  = ()         => api.get('/canned-responses');
export const createCannedResponse= (data)     => api.post('/canned-responses', data);
export const updateCannedResponse= (id, data) => api.put(`/canned-responses/${id}`, data);
export const deleteCannedResponse= (id)       => api.delete(`/canned-responses/${id}`);

export const uploadAttachment  = (ticketId, file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post(`/tickets/${ticketId}/attachments`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const deleteAttachment  = (id) => api.delete(`/attachments/${id}`);
