import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  withCredentials: true,
});

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401, surface rate-limit message on 429
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      const isAuthRoute = ['/login', '/register'].includes(window.location.pathname);
      if (!isAuthRoute) {
        window.location.href = '/login?reason=session_expired';
      }
    }
    if (err.response?.status === 429) {
      err.message = err.response.data?.error || 'Too many requests. Please slow down.';
    }
    return Promise.reject(err);
  }
);

export default api;
