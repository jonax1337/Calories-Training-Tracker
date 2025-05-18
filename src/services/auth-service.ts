import axios from 'axios';
import { API_BASE_URL } from './api-service';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  birthDate?: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    birthDate?: string;
  };
}

// Storage keys for authentication
const AUTH_TOKEN_KEY = 'auth_token';
const USER_ID_KEY = 'user_id';

// Create axios instance for auth
const authApi = axios.create({
  baseURL: `${API_BASE_URL.split('/api')[0]}/api/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create an authorized API instance for protected routes
export const authorizedApi = axios.create({
  baseURL: API_BASE_URL.split('/api')[0],
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authorization header interceptor
authorizedApi.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Register new user
export async function register(data: RegisterData): Promise<AuthResponse | null> {
  try {
    const response = await authApi.post('/register', data);
    
    if (response.data.token) {
      // Save auth token and user ID
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
      await AsyncStorage.setItem(USER_ID_KEY, response.data.user.id);
    }
    
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    return null;
  }
}

// Login user
export async function login(credentials: LoginCredentials): Promise<AuthResponse | null> {
  try {
    const response = await authApi.post('/login', credentials);
    
    if (response.data.token) {
      // Save auth token and user ID
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
      await AsyncStorage.setItem(USER_ID_KEY, response.data.user.id);
    }
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

// Logout user
export async function logout(): Promise<boolean> {
  try {
    // Remove auth token and user ID
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    await AsyncStorage.removeItem(USER_ID_KEY);
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    return !!token;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
}

// Get current user ID
export async function getCurrentUserId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(USER_ID_KEY);
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
}

// Get current user profile
export async function getCurrentUser(): Promise<any | null> {
  try {
    const response = await authorizedApi.get('/api/auth/me');
    return response.data;
  } catch (error) {
    console.error('Error getting current user profile:', error);
    return null;
  }
}
