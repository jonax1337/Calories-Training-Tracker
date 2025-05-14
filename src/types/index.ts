// Food and nutrition related types
export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar?: number;
  fiber?: number;
  sodium?: number;
  servingSize: string;
  servingSizeGrams: number;
}

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  nutrition: NutritionInfo;
  image?: string;
  isFavorite?: boolean;
}

export interface DailyLog {
  date: string; // ISO string format
  foodEntries: FoodEntry[];
  waterIntake: number; // in ml
  dailyNotes?: string;
}

export interface FoodEntry {
  id: string;
  foodItem: FoodItem;
  servingAmount: number; // number of servings
  mealType: MealType;
  timeConsumed: string; // ISO string
}

export enum MealType {
  Breakfast = 'breakfast',
  Lunch = 'lunch',
  Dinner = 'dinner',
  Snack = 'snack'
}

// User related types
export interface UserProfile {
  id: string;
  name: string;
  birthDate?: string; // ISO-Format Datum (YYYY-MM-DD)
  age?: number; // wird automatisch aus dem Geburtsdatum berechnet
  weight?: number; // in kg
  height?: number; // in cm
  gender?: 'male' | 'female' | 'divers';
  activityLevel?: ActivityLevel;
  goals: UserGoals;
}

export enum ActivityLevel {
  Sedentary = 'sedentary',
  LightlyActive = 'lightly_active',
  ModeratelyActive = 'moderately_active',
  VeryActive = 'very_active',
  ExtremelyActive = 'extremely_active'
}

export interface UserGoals {
  dailyCalories: number;
  dailyProtein?: number; // in grams
  dailyCarbs?: number; // in grams
  dailyFat?: number; // in grams
  dailyWater?: number; // in ml
  weightGoal?: number; // in kg
}

// Health data related types
export interface HealthData {
  steps: number;
  activeCaloriesBurned: number;
  heartRate?: number;
  sleepHours?: number;
}

// API related types
export interface BarcodeApiResponse {
  status: number;
  product?: {
    product_name: string;
    brands?: string;
    nutriments?: {
      'energy-kcal_100g'?: number;
      proteins_100g?: number;
      carbohydrates_100g?: number;
      fat_100g?: number;
      sugars_100g?: number;
      fiber_100g?: number;
      sodium_100g?: number;
    };
    quantity?: string;
    image_url?: string;
  };
}
