import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL  || 'https://backend-production-2f44.up.railway.app/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use((response) => {
  return response.data;
}, (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
  
  // Retourner une erreur plus descriptive
  return Promise.reject({
    message: error.response?.data?.message || 'Erreur réseau',
    status: error.response?.status,
    data: error.response?.data
  });
});

export default api;