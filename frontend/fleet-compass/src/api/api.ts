// src/lib/api.ts
import axios from 'axios';

// Load base URL from .env (Vite requires VITE_ prefix)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

if (!API_BASE_URL) {
  console.error('VITE_API_BASE_URL is not defined in .env file!');
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically add JWT token if user is logged in
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;