import axios from 'axios';
import { API_BASE_URL, AUTH_TOKEN_KEY, USER_ID_KEY } from '../config/api-config';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  birthDate?: string;
  name?: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    birthDate?: string;
    name?: string;
  };
}

// Storage keys now imported from api-config.ts

// Create axios instance for auth
const authApi = axios.create({
  baseURL: `${API_BASE_URL}/api/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor wurde nach api-service.ts verschoben

// Register new user
export async function register(data: RegisterData): Promise<AuthResponse | null> {
  try {
    // Füge einen leeren Namen hinzu, da der Server diesen möglicherweise noch erwartet
    const requestData = {
      ...data,
      name: null // Versende null als Namenswert
    };
    
    console.log('Sende Registrierungsdaten:', JSON.stringify(requestData, null, 2));
    
    const response = await authApi.post('/register', requestData);
    
    if (response.data.token) {
      // Save auth token and user ID
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
      await AsyncStorage.setItem(USER_ID_KEY, response.data.user.id);
    }
    
    return response.data;
  } catch (error: any) {
    // Detaillierte Fehlerinformationen
    console.error('Registration error:', error);
    
    if (error.response) {
      // Der Server hat geantwortet, aber mit einem Fehlercode
      console.error('Server response:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    
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

// Check if email already exists
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const response = await authApi.get(`/check-email?email=${encodeURIComponent(email)}`);
    return response.data.exists;
  } catch (error) {
    console.error('Email check error:', error);
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
    // Erstelle eine Anfrage mit authentifizierungsheader
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      return null; // Kein Token verfügbar, kann nicht authentifizieren
    }
    
    const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting current user profile:', error);
    return null;
  }
}
