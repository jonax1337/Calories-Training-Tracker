  import { DailyLog, FoodItem, UserProfile } from '../types';
import {
  fetchUserProfile,
  createOrUpdateUserProfile,
  fetchFoodItems,
  fetchFoodItemById,
  createOrUpdateFoodItem,
  fetchDailyLogs,
  fetchDailyLogByDate,
  createOrUpdateDailyLog,
  fetchFavoriteFoodIds,
  toggleFavoriteFood as apiToggleFavoriteFood
} from './api-service';

// Current user ID (would normally come from authentication)
const CURRENT_USER_ID = 'default_user_id';

// User profile functions
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    // Use the API service with the current user ID
    const success = await createOrUpdateUserProfile({
      ...profile,
      id: profile.id || CURRENT_USER_ID // Ensure we have an ID
    });
    
    if (!success) {
      throw new Error('Failed to save user profile');
    }
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
}

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    // Use the API service with the current user ID
    return await fetchUserProfile(CURRENT_USER_ID);
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

// Food items functions
export async function saveFoodItem(item: FoodItem): Promise<void> {
  try {
    const success = await createOrUpdateFoodItem(item);
    
    if (!success) {
      throw new Error('Failed to save food item');
    }
  } catch (error) {
    console.error('Error saving food item:', error);
    throw error;
  }
}

export async function getFoodItems(): Promise<FoodItem[]> {
  try {
    return await fetchFoodItems();
  } catch (error) {
    console.error('Error getting food items:', error);
    return [];
  }
}

// Daily logs functions
export async function saveDailyLog(log: DailyLog): Promise<void> {
  try {
    const success = await createOrUpdateDailyLog(log, CURRENT_USER_ID);
    
    if (!success) {
      throw new Error('Failed to save daily log');
    }
  } catch (error) {
    console.error('Error saving daily log:', error);
    throw error;
  }
}

export async function getDailyLogs(): Promise<DailyLog[]> {
  try {
    return await fetchDailyLogs(CURRENT_USER_ID);
  } catch (error) {
    console.error('Error getting daily logs:', error);
    return [];
  }
}

export async function getDailyLogByDate(date: string): Promise<DailyLog | null> {
  try {
    return await fetchDailyLogByDate(date, CURRENT_USER_ID);
  } catch (error) {
    console.error('Error getting daily log by date:', error);
    return null;
  }
}

// Favorite foods functions
export async function toggleFavoriteFood(foodId: string): Promise<boolean> {
  try {
    return await apiToggleFavoriteFood(CURRENT_USER_ID, foodId);
  } catch (error) {
    console.error('Error toggling favorite food:', error);
    throw error;
  }
}

export async function getFavoriteFoodIds(): Promise<string[]> {
  try {
    return await fetchFavoriteFoodIds(CURRENT_USER_ID);
  } catch (error) {
    console.error('Error getting favorite food IDs:', error);
    return [];
  }
}
