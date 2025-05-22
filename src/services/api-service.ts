import axios from 'axios';
import { DailyLog, FoodItem, UserProfile } from '../types';

// API configuration
// Use the actual IP address or hostname of your server, not localhost
// localhost only works when testing in a web browser on the same machine as the server
// For mobile devices, you need to use your computer's IP address or hostname
export const API_BASE_URL = 'http://192.168.178.32:3001';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// User profile functions
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const response = await api.get(`/api/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function createOrUpdateUserProfile(profile: UserProfile): Promise<boolean> {
  try {
    await api.post('/api/users', profile);
    return true;
  } catch (error) {
    console.error('Error saving user profile:', error);
    return false;
  }
}

// Food items functions
export async function fetchFoodItems(): Promise<FoodItem[]> {
  try {
    const response = await api.get('/api/food-items');
    return response.data;
  } catch (error) {
    console.error('Error fetching food items:', error);
    return [];
  }
}

export async function fetchFoodItemById(id: string): Promise<FoodItem | null> {
  try {
    const response = await api.get(`/api/food-items/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching food item:', error);
    return null;
  }
}

export async function createOrUpdateFoodItem(item: FoodItem): Promise<boolean> {
  try {
    console.log('Saving food item to database:', item);
    await api.post('/api/food-items', item);
    console.log('Food item saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving food item:', error);
    return false;
  }
}

export async function deleteFoodItem(id: string): Promise<boolean> {
  try {
    await api.delete(`/api/food-items/${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting food item:', error);
    return false;
  }
}

// Daily logs functions
export async function fetchDailyLogs(userId: string): Promise<DailyLog[]> {
  try {
    const response = await api.get('/api/daily-logs', {
      params: { userId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching daily logs:', error);
    return [];
  }
}

export async function fetchDailyLogByDate(date: string, userId: string): Promise<DailyLog | null> {
  try {
    const response = await api.get(`/api/daily-logs/${date}`, {
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
    await api.post('/api/daily-logs', { 
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
    const response = await api.get('/api/favorites', {
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
    const response = await api.post('/api/favorites/toggle', { userId, foodId });
    return response.data.isFavorite;
  } catch (error) {
    console.error('Error toggling favorite food:', error);
    return false;
  }
}
