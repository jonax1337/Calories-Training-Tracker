import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyLog, FoodItem, UserProfile } from '../types';

// Storage keys
const STORAGE_KEYS = {
  USER_PROFILE: 'user_profile',
  FOOD_ITEMS: 'food_items',
  DAILY_LOGS: 'daily_logs',
  FAVORITE_FOODS: 'favorite_foods'
};

// User profile functions
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    const jsonValue = JSON.stringify(profile);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, jsonValue);
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
}

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

// Food items functions
export async function saveFoodItem(item: FoodItem): Promise<void> {
  try {
    const existingItems = await getFoodItems();
    const itemIndex = existingItems.findIndex(i => i.id === item.id);
    
    if (itemIndex !== -1) {
      existingItems[itemIndex] = item;
    } else {
      existingItems.push(item);
    }
    
    const jsonValue = JSON.stringify(existingItems);
    await AsyncStorage.setItem(STORAGE_KEYS.FOOD_ITEMS, jsonValue);
  } catch (error) {
    console.error('Error saving food item:', error);
    throw error;
  }
}

export async function getFoodItems(): Promise<FoodItem[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.FOOD_ITEMS);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error getting food items:', error);
    return [];
  }
}

// Daily logs functions
export async function saveDailyLog(log: DailyLog): Promise<void> {
  try {
    const existingLogs = await getDailyLogs();
    const logIndex = existingLogs.findIndex(l => l.date === log.date);
    
    if (logIndex !== -1) {
      existingLogs[logIndex] = log;
    } else {
      existingLogs.push(log);
    }
    
    const jsonValue = JSON.stringify(existingLogs);
    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_LOGS, jsonValue);
  } catch (error) {
    console.error('Error saving daily log:', error);
    throw error;
  }
}

export async function getDailyLogs(): Promise<DailyLog[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_LOGS);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error getting daily logs:', error);
    return [];
  }
}

export async function getDailyLogByDate(date: string): Promise<DailyLog | null> {
  try {
    const logs = await getDailyLogs();
    const log = logs.find(l => l.date === date);
    return log || null;
  } catch (error) {
    console.error('Error getting daily log by date:', error);
    return null;
  }
}

// Favorite foods functions
export async function toggleFavoriteFood(foodId: string): Promise<boolean> {
  try {
    const favoriteIds = await getFavoriteFoodIds();
    let isFavorite = favoriteIds.includes(foodId);
    
    if (isFavorite) {
      const updatedFavorites = favoriteIds.filter(id => id !== foodId);
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_FOODS, JSON.stringify(updatedFavorites));
      return false;
    } else {
      favoriteIds.push(foodId);
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_FOODS, JSON.stringify(favoriteIds));
      return true;
    }
  } catch (error) {
    console.error('Error toggling favorite food:', error);
    throw error;
  }
}

export async function getFavoriteFoodIds(): Promise<string[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_FOODS);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error getting favorite food IDs:', error);
    return [];
  }
}
