// API Client
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add telegram ID to requests (from storage)
apiClient.interceptors.request.use(async (config) => {
  // TODO: Get telegram ID from secure storage
  // const telegramId = await getTelegramId();
  // if (telegramId) {
  //   config.headers['x-telegram-id'] = telegramId;
  // }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;