// Food and nutrition related types
export interface NutritionInfo {
  // Makronährstoffe
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  sugar?: number;
  fiber?: number;
  sodium?: number;
  potassium?: number;
  
  // Wichtige Vitamine (in μg oder mg)
  vitaminA?: number; // in μg RAE
  vitaminB12?: number; // in μg
  vitaminC?: number; // in mg
  vitaminD?: number; // in μg
  
  // Wichtige Mineralstoffe (in mg)
  calcium?: number; // in mg
  iron?: number; // in mg
  magnesium?: number; // in mg
  zinc?: number; // in mg
  
  servingSize: string;  // Beschreibung der Portion (z.B. "1 Riegel (25g)")
  servingSizeGrams: number; // Gewicht einer Portion in Gramm
  servingDescription?: string; // Zusätzliche Beschreibung zur Portionsgröße
}

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  nutrition: NutritionInfo;
  image?: string;
  isFavorite?: boolean;
  description?: string; // Produktbeschreibung oder Zutatenliste
}

export interface DailyLog {
  date: string; // ISO string format
  foodEntries: FoodEntry[];
  waterIntake: number; // in ml
  weight?: number; // in kg
  dailyNotes?: string;
  isCheatDay?: boolean; // Flag für "Cheat Day"
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
  activeGoalTypeId?: string | null;
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

// Goal types for user nutrition goals
export interface GoalType {
  id: string;
  name: string;
  description?: string;
  isCustom: boolean;
}

// User goal with goal type reference
export interface UserGoal {
  id?: string;
  userId?: string;
  goalTypeId?: string;
  goalTypeName?: string;
  isCustom: boolean;
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
  dailyWater: number;
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
    serving_size?: string;  // Portionsgröße wie "1 Stück (45g)" 
    serving_quantity?: number; // Portionsgröße in Gramm (falls vorhanden)
    nutriments?: {
      'energy-kcal_100g'?: number;
      proteins_100g?: number;
      carbohydrates_100g?: number;
      fat_100g?: number;
      sugars_100g?: number;
      fiber_100g?: number;
      sodium_100g?: number;
      potassium_100g?: number;
    };
    quantity?: string;
    image_url?: string;
  };
}
