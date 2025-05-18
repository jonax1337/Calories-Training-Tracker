import axios from 'axios';
import { DailyLog, FoodItem, UserProfile } from '../types';

// API configuration
const API_BASE_URL = 'http://localhost:3001/api';

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
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function createOrUpdateUserProfile(profile: UserProfile): Promise<boolean> {
  try {
    await api.post('/users', profile);
    return true;
  } catch (error) {
    console.error('Error saving user profile:', error);
    return false;
  }
}

// Food items functions
export async function fetchFoodItems(): Promise<FoodItem[]> {
  try {
    const response = await api.get('/food-items');
    return response.data;
  } catch (error) {
    console.error('Error fetching food items:', error);
    return [];
  }
}

export async function fetchFoodItemById(id: string): Promise<FoodItem | null> {
  try {
    const response = await api.get(`/food-items/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching food item:', error);
    return null;
  }
}

export async function createOrUpdateFoodItem(item: FoodItem): Promise<boolean> {
  try {
    await api.post('/food-items', item);
    return true;
  } catch (error) {
    console.error('Error saving food item:', error);
    return false;
  }
}

export async function deleteFoodItem(id: string): Promise<boolean> {
  try {
    await api.delete(`/food-items/${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting food item:', error);
    return false;
  }
}

// Daily logs functions
export async function fetchDailyLogs(userId: string): Promise<DailyLog[]> {
  try {
    const response = await api.get('/daily-logs', {
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
    const response = await api.get(`/daily-logs/${date}`, {
      params: { userId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching daily log:', error);
    return null;
  }
}

export async function createOrUpdateDailyLog(log: DailyLog, userId: string): Promise<boolean> {
  try {
    await api.post('/daily-logs', { ...log, userId });
    return true;
  } catch (error) {
    console.error('Error saving daily log:', error);
    return false;
  }
}

// Favorite foods functions
export async function fetchFavoriteFoodIds(userId: string): Promise<string[]> {
  try {
    const response = await api.get('/favorites', {
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
    const response = await api.post('/favorites/toggle', { userId, foodId });
    return response.data.isFavorite;
  } catch (error) {
    console.error('Error toggling favorite food:', error);
    return false;
  }
}
