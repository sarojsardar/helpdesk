import api from './axios';

// Staff dashboard
export const getStaffDashboard = () => api.get('/staff/dashboard');

// Staff availability
export const getMyStatus       = () => api.get('/staff/status');
export const updateMyStatus    = (status) => api.put('/staff/status', { availability_status: status });

// Quick assign to self
export const assignTicket      = (ticketId, agentId) => api.patch(`/tickets/${ticketId}/assign`, { agent_id: agentId });

// Snooze ticket
export const snoozeTicket      = (ticketId, snooze_until) => api.patch(`/tickets/${ticketId}/snooze`, { snooze_until });

// Batch reply
export const batchReply        = (data) => api.post('/staff/batch-reply', data);
