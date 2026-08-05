import api from './axios';

export const getCustomerSummary = () => api.get('/customer/summary');
export const reopenTicket       = (ticketId, reason) => api.post(`/customer/tickets/${ticketId}/reopen`, { reason });
export const followUpTicket     = (ticketId, message) => api.post(`/customer/tickets/${ticketId}/follow-up`, { message });

// Satisfaction Survey
export const getSurvey          = (ticketId) => api.get(`/customer/tickets/${ticketId}/survey`);
export const submitSurvey       = (ticketId, data) => api.post(`/customer/tickets/${ticketId}/survey`, data);
