  import { DailyLog, FoodItem, UserProfile, UserGoal, GoalType } from '../types';
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
  toggleFavoriteFood as apiToggleFavoriteFood,
  fetchGoalTypes,
  fetchUserGoals,
  createOrUpdateUserGoal as apiCreateOrUpdateUserGoal,
  deleteUserGoal as apiDeleteUserGoal
} from './apiService';
import { getCurrentUserId, isAuthenticated } from './authService';

// Default ID for fallback
const DEFAULT_USER_ID = 'default_user_id';

// User profile functions
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    // Get the authenticated user ID or use default
    const userId = await getCurrentUserId() || DEFAULT_USER_ID;
    
    // Use the API service with the current user ID
    const success = await createOrUpdateUserProfile({
      ...profile,
      id: profile.id || userId // Ensure we have an ID
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
    // Check if user is authenticated first
    const isUserAuthenticated = await isAuthenticated();
    if (!isUserAuthenticated) {
      // Don't make API calls if not authenticated
      return null;
    }
    
    // Get the authenticated user ID or use default
    const userId = await getCurrentUserId() || DEFAULT_USER_ID;
    
    // Use the API service with the current user ID
    return await fetchUserProfile(userId);
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
    // Get the authenticated user ID or use default
    const userId = await getCurrentUserId() || DEFAULT_USER_ID;
    
    // Use the API service with the current user ID
    const success = await createOrUpdateDailyLog(log, userId);
    
    if (!success) {
      throw new Error('Failed to save daily log');
    }
  } catch (error) {
    console.error('Error saving daily log:', error);
    throw error;
  }
}

export async function getDailyLogs(startDate?: string, endDate?: string): Promise<DailyLog[]> {
  try {
    // Get the authenticated user ID or use default
    const userId = await getCurrentUserId() || DEFAULT_USER_ID;
    
    // Use the API service with the current user ID
    return await fetchDailyLogs(userId, startDate, endDate);
  } catch (error) {
    console.error('Error getting daily logs:', error);
    return [];
  }
}

export async function getDailyLogByDate(date: string): Promise<DailyLog> {
  try {
    // Check if user is authenticated first
    const isUserAuthenticated = await isAuthenticated();
    if (!isUserAuthenticated) {
      // Return empty log without making API calls if not authenticated
      return createEmptyDailyLog(date, DEFAULT_USER_ID);
    }
    
    // Get the authenticated user ID or use default
    const userId = await getCurrentUserId() || DEFAULT_USER_ID;
    
    try {
      // Try to get existing log
      const dailyLog = await fetchDailyLogByDate(date, userId);
      // Ensure we never return null
      return dailyLog || createEmptyDailyLog(date, userId);
    } catch (error: any) { // Type the error as any to access response property
      // If log doesn't exist (404), return a default empty log instead of null
      if (error.response && error.response.status === 404) {
        // Only log this for authenticated users to avoid noise during logout
        if (isUserAuthenticated) {
          console.log(`Creating default empty log for ${date}`);
        }
        // Create an empty daily log with required fields
        return createEmptyDailyLog(date, userId);
      }
      throw error; // Re-throw any other errors
    }
  } catch (error) {
    console.error('Error getting daily log by date:', error);
    // Always return a default log to prevent null errors
    const userId = await getCurrentUserId() || DEFAULT_USER_ID;
    return createEmptyDailyLog(date, userId);
  }
}

// Helper function to create an empty daily log with the correct type
function createEmptyDailyLog(date: string, userId: string): DailyLog {
  return {
    date: date,
    foodEntries: [], 
    waterIntake: 0,
    dailyNotes: '',
    isCheatDay: false, // Initialisiere Cheat Day mit 'false'
    // These additional properties may be needed by your API but aren't in the interface
    // We'll cast to any to add them without TypeScript errors
    ...({
      userId: userId,
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0
    } as any)
  };
}

// Favorite foods functions
export async function toggleFavoriteFood(foodId: string): Promise<boolean> {
  try {
    // Get the authenticated user ID or use default
    const userId = await getCurrentUserId() || DEFAULT_USER_ID;
    
    // Use the API service with the current user ID and food ID
    return await apiToggleFavoriteFood(userId, foodId);
  } catch (error) {
    console.error('Error toggling favorite food:', error);
    return false;
  }
}

export async function getFavoriteFoodIds(): Promise<string[]> {
  try {
    // Get the authenticated user ID or use default
    const userId = await getCurrentUserId() || DEFAULT_USER_ID;
    
    // Use the API service with the current user ID
    return await fetchFavoriteFoodIds(userId);
  } catch (error) {
    console.error('Error getting favorite food IDs:', error);
    return [];
  }
}

// User goals functions
export async function getGoalTypes(): Promise<GoalType[]> {
  try {
    return await fetchGoalTypes();
  } catch (error) {
    console.error('Error getting goal types:', error);
    return [];
  }
}

export async function getUserGoals(): Promise<UserGoal[]> {
  try {
    // Check if user is authenticated first
    const isUserAuthenticated = await isAuthenticated();
    if (!isUserAuthenticated) {
      // Don't make API calls if not authenticated
      return [];
    }
    
    // Get the authenticated user ID or use default
    const userId = await getCurrentUserId() || DEFAULT_USER_ID;
    
    try {
      // Try to get existing goals
      return await fetchUserGoals(userId);
    } catch (error: any) { // Type the error as any to access response property
      // If no goals exist (404), return an empty array
      if (error.response && error.response.status === 404) {
        return [];
      }
      throw error; // Re-throw any other errors
    }
  } catch (error) {
    console.error('Error getting user goals:', error);
    return [];
  }
}

export async function saveUserGoal(goal: UserGoal): Promise<boolean> {
  try {
    // Get the authenticated user ID or use default
    const userId = await getCurrentUserId() || DEFAULT_USER_ID;
    
    // Use the API service with the current user ID
    return await apiCreateOrUpdateUserGoal(userId, goal);
  } catch (error) {
    console.error('Error saving user goal:', error);
    return false;
  }
}

export async function deleteUserGoal(goalId: string): Promise<boolean> {
  try {
    // Get the authenticated user ID or use default
    const userId = await getCurrentUserId() || DEFAULT_USER_ID;
    
    // Use the API service with the current user ID
    return await apiDeleteUserGoal(userId, goalId);
  } catch (error) {
    console.error('Error deleting user goal:', error);
    return false;
  }
}
