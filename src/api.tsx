import axios from 'axios';
import { ACCESS_TOKEN } from "@/constants";

// Use localhost for development, but you can change this to your local IP
// For local network access, replace with your actual IP like 'http://192.168.1.100:8000'
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'development'
    ? 'http://192.168.8.155:8000'  // Change this to your local IP if needed
    : 'http://127.0.0.1:8000'
}); // <-- Changed this from comma to semicolon

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;