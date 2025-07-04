import axios, { AxiosError, AxiosResponse } from 'axios';
import { DailyLog, FoodItem, UserProfile, UserGoal, GoalType } from '../types';
import { API_BASE_URL, AUTH_TOKEN_KEY, USER_ID_KEY } from '../config/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API configuration
// Use the actual IP address or hostname of your server, not localhost
// localhost only works when testing in a web browser on the same machine as the server
// For mobile devices, you need to use your computer's IP address or hostname

// Create an authorized API instance for protected routes
const authorizedApi = axios.create({
  baseURL: API_BASE_URL,
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

// Response interceptor to handle token refresh
authorizedApi.interceptors.response.use(
  async (response: AxiosResponse) => {
    // Prüfe, ob ein neues Token vom Server zurückgegeben wurde
    const newToken = response.headers['x-refresh-token'];
    if (newToken) {
      console.log('Received new token from server, updating local storage');
      // Speichere das neue Token in AsyncStorage
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, newToken);
    }
    return response;
  },
  async (error: AxiosError) => {
    // Falls der Fehler 401 Unauthorized ist und einen speziellen Code enthält
    if (error.response && error.response.status === 401) {
      const responseData = error.response.data as any;
      
      // Wenn der Token abgelaufen ist, versuchen wir einen Redirect zum Login
      if (responseData.code === 'TOKEN_EXPIRED') {
        console.log('Token is expired. Redirecting to login...');
        // Versuchen, den Token zu löschen, damit die App weiß, dass die Session abgelaufen ist
        try {
          await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
          // Wir löschen nicht die User ID, damit wir sie später wieder verwenden können
        } catch (storageError) {
          console.error('Error clearing expired token:', storageError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// User profile functions
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    // Verwende authorizedApi statt api für authentifizierte Anfragen
    const response = await authorizedApi.get(`/api/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function createOrUpdateUserProfile(profile: UserProfile): Promise<boolean> {
  try {
    await authorizedApi.post('/api/users', profile);
    return true;
  } catch (error) {
    console.error('Error saving user profile:', error);
    return false;
  }
}

// Food items functions
export async function fetchFoodItems(): Promise<FoodItem[]> {
  try {
    const response = await authorizedApi.get('/api/food-items');
    return response.data;
  } catch (error) {
    console.error('Error fetching food items:', error);
    return [];
  }
}

export async function fetchFoodItemById(id: string): Promise<FoodItem | null> {
  try {
    const response = await authorizedApi.get(`/api/food-items/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching food item:', error);
    return null;
  }
}

export async function createOrUpdateFoodItem(item: FoodItem): Promise<boolean> {
  try {
    console.log('Saving food item to database:', item);
    await authorizedApi.post('/api/food-items', item);
    console.log('Food item saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving food item:', error);
    return false;
  }
}

export async function deleteFoodItem(id: string): Promise<boolean> {
  try {
    await authorizedApi.delete(`/api/food-items/${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting food item:', error);
    return false;
  }
}

// Daily logs functions
export async function fetchDailyLogs(userId: string, startDate?: string, endDate?: string): Promise<DailyLog[]> {
  try {
    const response = await authorizedApi.get('/api/daily-logs', {
      params: { userId, startDate, endDate }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching daily logs:', error);
    return [];
  }
}

export async function fetchDailyLogByDate(date: string, userId: string): Promise<DailyLog | null> {
  try {
    const response = await authorizedApi.get(`/api/daily-logs/${date}`, {
      params: { userId }
    });
    return response.data;
  } catch (error: any) {
    // Don't log 404 errors as they're expected for new users with no logs
    if (!error.response || error.response.status !== 404) {
      console.error('Error fetching daily log:', error);
    }
    // Let the calling function handle the error
    throw error;
  }
}

export async function createOrUpdateDailyLog(log: DailyLog, userId: string): Promise<boolean> {
  try {
    // Create a consistent date string that matches what we're using to fetch
    const consistentDate = (typeof log.date === 'string') ? log.date : new Date(log.date).toISOString().split('T')[0];
    
    // Log the exact dates being used for debugging
    console.log('Creating/updating daily log with date:', {
      originalDate: log.date,
      consistentDate: consistentDate,
      userId: userId
    });
    
    // Make the API call with the consistent date format
    await authorizedApi.post('/api/daily-logs', { 
      ...log, 
      date: consistentDate, // Use the formatted consistent date
      userId 
    });
    return true;
  } catch (error) {
    console.error('Error saving daily log:', error);
    return false;
  }
}

// Favorite foods functions
export async function fetchFavoriteFoodIds(userId: string): Promise<string[]> {
  try {
    const response = await authorizedApi.get('/api/favorites', {
      params: { userId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching favorite food IDs:', error);
    return [];
  }
}

export async function toggleFavoriteFood(userId: string, foodId: string): Promise<boolean> {
  try {
    const response = await authorizedApi.post('/api/favorites/toggle', { userId, foodId });
    return response.data.isFavorite;
  } catch (error) {
    console.error('Error toggling favorite food:', error);
    return false;
  }
}

// User goals functions
export async function fetchGoalTypes(): Promise<GoalType[]> {
  try {
    // Verwende auch hier authorizedApi für Konsistenz und Token-Refresh
    const response = await authorizedApi.get('/api/user-goals/types');
    return response.data;
  } catch (error) {
    console.error('Error fetching goal types:', error);
    return [];
  }
}

export async function fetchUserGoals(userId: string): Promise<UserGoal[]> {
  try {
    // Verwende authorizedApi für geschützte Routen
    const response = await authorizedApi.get(`/api/user-goals/${userId}`);
    return response.data;
  } catch (error: any) {
    // Don't log 404 errors as they're expected for users with no goals
    if (!error.response || error.response.status !== 404) {
      console.error('Error fetching user goals:', error);
    }
    // Let the calling function handle the error
    throw error;
  }
}

export async function createOrUpdateUserGoal(userId: string, goal: UserGoal): Promise<boolean> {
  try {
    // Verwende authorizedApi für geschützte Routen
    await authorizedApi.post(`/api/user-goals/${userId}`, goal);
    return true;
  } catch (error) {
    console.error('Error saving user goal:', error);
    return false;
  }
}

export async function deleteUserGoal(userId: string, goalId: string): Promise<boolean> {
  try {
    // Verwende authorizedApi für geschützte Routen
    await authorizedApi.delete(`/api/user-goals/${userId}/${goalId}`);
    return true;
  } catch (error) {
    console.error('Error deleting user goal:', error);
    return false;
  }
}
