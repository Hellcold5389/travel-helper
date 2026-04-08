import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// API base URL - change for production
const API_URL = 'http://192.168.0.26:3001';

// ============================================
// Types
// ============================================
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  nationality?: string;
  preferences?: {
    language: string;
    currency: string;
    timezone?: string;
  };
}

interface AuthResponse {
  user: User;
  token: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// ============================================
// API Client
// ============================================
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  private async getHeaders(token?: string): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getHeaders(token);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ============================================
  // Auth APIs
  // ============================================
  async register(email: string, password: string, name?: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async googleAuth(idToken: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
  }

  async appleAuth(identityToken: string, user?: any): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/apple', {
      method: 'POST',
      body: JSON.stringify({ identityToken, user }),
    });
  }

  async refreshToken(token: string): Promise<{ token: string }> {
    return this.request<{ token: string }>('/api/auth/refresh', {
      method: 'POST',
    }, token);
  }

  async getProfile(token: string): Promise<{ user: User }> {
    return this.request<{ user: User }>('/api/user/profile', {}, token);
  }

  async updateSettings(token: string, data: any): Promise<{ preferences: any }> {
    return this.request<{ preferences: any }>('/api/user/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token);
  }

  // ============================================
  // Public APIs (no auth required)
  // ============================================
  async getCountries() {
    return this.request('/api/countries');
  }

  async getVisa(nationality: string, destination: string) {
    return this.request(`/api/visa/${nationality}/${destination}`);
  }

  async getLegalInfo(countryCode: string) {
    return this.request(`/api/legal/${countryCode}`);
  }

  async getFunFacts(countryCode: string) {
    return this.request(`/api/funfacts/${countryCode}`);
  }

  // ============================================
  // Trip APIs
  // ============================================
  async createTrip(token: string, tripData: any) {
    return this.request('/api/trips/plan', {
      method: 'POST',
      body: JSON.stringify(tripData),
    }, token);
  }

  async getTrips(token: string, userId: string) {
    return this.request(`/api/trips?userId=${userId}`, {}, token);
  }

  async getTrip(token: string, tripId: string) {
    return this.request(`/api/trips/${tripId}`, {}, token);
  }

  async deleteTrip(token: string, tripId: string) {
    return this.request(`/api/trips/${tripId}`, {
      method: 'DELETE',
    }, token);
  }

  async updateTrip(token: string, tripId: string, data: any): Promise<any> {
    return this.request(`/api/trips/${tripId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token);
  }

  // ============================================
  // Passport APIs
  // ============================================
  async getPassports(token: string): Promise<{ passports: any[] }> {
    return this.request('/api/user/passport', {}, token);
  }

  async addPassport(token: string, data: {
    countryCode: string;
    passportNumber: string;
    issueDate?: string;
    expiryDate: string;
    nationality?: string;
  }): Promise<{ passport: any }> {
    return this.request('/api/user/passport', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  }

  async deletePassport(token: string, passportId: string): Promise<void> {
    return this.request(`/api/user/passport/${passportId}`, {
      method: 'DELETE',
    }, token);
  }
}

export const apiClient = new ApiClient();
