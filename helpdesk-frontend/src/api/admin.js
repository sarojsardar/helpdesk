import api from './axios';

// Departments
export const getDepartments       = (params) => api.get('/departments', { params });
export const getDepartment        = (id) => api.get(`/departments/${id}`);
export const createDepartment     = (data) => api.post('/departments', data);
export const updateDepartment     = (id, data) => api.put(`/departments/${id}`, data);
export const deleteDepartment     = (id) => api.delete(`/departments/${id}`);

// SLA Policies
export const getSlaPolicies       = (params) => api.get('/sla-policies', { params });
export const createSlaPolicy      = (data) => api.post('/sla-policies', data);
export const updateSlaPolicy      = (id, data) => api.put(`/sla-policies/${id}`, data);
export const deleteSlaPolicy      = (id) => api.delete(`/sla-policies/${id}`);

// Escalation Rules
export const getEscalationRules   = (params) => api.get('/escalation-rules', { params });
export const createEscalationRule = (data) => api.post('/escalation-rules', data);
export const updateEscalationRule = (id, data) => api.put(`/escalation-rules/${id}`, data);
export const deleteEscalationRule = (id) => api.delete(`/escalation-rules/${id}`);

// Ticket Templates
export const getTicketTemplates     = () => api.get('/ticket-templates');
export const createTicketTemplate   = (data) => api.post('/ticket-templates', data);
export const updateTicketTemplate   = (id, data) => api.put(`/ticket-templates/${id}`, data);
export const deleteTicketTemplate   = (id) => api.delete(`/ticket-templates/${id}`);

// Business Hours
export const getBusinessHours       = () => api.get('/business-hours');
export const updateBusinessHours    = (schedule) => api.put('/business-hours', { schedule });
export const getHolidays            = () => api.get('/business-hours/holidays');
export const createHoliday          = (data) => api.post('/business-hours/holidays', data);
export const deleteHoliday          = (id) => api.delete(`/business-hours/holidays/${id}`);

// Ticket Export
export const exportTickets          = (params) => api.get('/tickets/export', { params, responseType: 'blob' });

// Announcements
export const getAnnouncements       = (params) => api.get('/announcements', { params });
export const createAnnouncement     = (data) => api.post('/announcements', data);
export const updateAnnouncement     = (id, data) => api.put(`/announcements/${id}`, data);
export const deleteAnnouncement     = (id) => api.delete(`/announcements/${id}`);
// Active announcements (for banner)
export const getActiveAnnouncements = () => api.get('/announcements/active');
