import api from './api';
import { makeApiRequest } from '../utils/apiUtils';

export const authService = {
  register: (userData, isFormData = false) => makeApiRequest(
    () => api.post('/api/auth/register', userData, isFormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : {}),
    { skipAuthHandler: true }
  ),
  login: (credentials) => makeApiRequest(() => api.post('/api/auth/login', credentials), { skipAuthHandler: true }),
  logout: () => makeApiRequest(() => api.post('/api/auth/logout')),
  getMe: () => makeApiRequest(() => api.get('/api/auth/me')),
  updateProfile: (data) => makeApiRequest(() => api.put('/api/auth/profile', data, data instanceof FormData ? {
    headers: { 'Content-Type': 'multipart/form-data' }
  } : {})),
  changePassword: (data) => makeApiRequest(() => api.put('/api/auth/change-password', data)),
  selectRoute: (routeId, stopName) => makeApiRequest(() => api.put('/api/auth/select-route', { routeId, stopName })),
};