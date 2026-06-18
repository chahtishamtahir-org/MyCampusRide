import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies with requests (works in same-site; fallback for cross-site)
});

// Request interceptor: attach JWT token from localStorage as Bearer header
// This is needed in production (cross-site) where cookies are blocked by browsers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: if server returns a token in the body, save it
api.interceptors.response.use(
  (response) => {
    if (response.data?.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    return response;
  },
  (error) => {
    // If 401 and token exists, it's likely expired — clear it
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
    }
    return Promise.reject(error);
  }
);

export default api;

// Helper to clear the stored token on logout
export const clearAuthToken = () => {
  localStorage.removeItem('authToken');
};