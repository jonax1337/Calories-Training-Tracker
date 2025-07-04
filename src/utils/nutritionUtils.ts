import { ActivityLevel, FoodEntry, UserProfile } from '../types';

/**
 * Calculate the Basal Metabolic Rate (BMR) using the Mifflin-St Jeor Equation
 * @param weight Weight in kg
 * @param height Height in cm
 * @param age Age in years
 * @param isMale Boolean indicating if the user is male
 * @returns BMR in calories
 */
export function calculateBMR(weight: number, height: number, age: number, isMale: boolean): number {
  if (!weight || !height || !age) return 0;
  
  // Mifflin-St Jeor Equation
  const bmr = 10 * weight + 6.25 * height - 5 * age + (isMale ? 5 : -161);
  return Math.round(bmr);
}

/**
 * Get the activity multiplier based on activity level
 * @param activityLevel User's activity level
 * @returns Activity multiplier for TDEE calculation
 */
export function getActivityMultiplier(activityLevel: ActivityLevel): number {
  switch (activityLevel) {
    case ActivityLevel.Sedentary:
      return 1.2;
    case ActivityLevel.LightlyActive:
      return 1.375;
    case ActivityLevel.ModeratelyActive:
      return 1.55;
    case ActivityLevel.VeryActive:
      return 1.725;
    case ActivityLevel.ExtremelyActive:
      return 1.9;
    default:
      return 1.2; // Default to sedentary
  }
}

/**
 * Calculate Total Daily Energy Expenditure (TDEE)
 * @param profile User profile with weight, height, age, gender, and activity level
 * @returns TDEE in calories
 */
export function calculateTDEE(profile: UserProfile): number {
  if (!profile.weight || !profile.height || !profile.age) return 0;
  
  const isMale = profile.gender === 'male';
  const bmr = calculateBMR(profile.weight, profile.height, profile.age, isMale);
  const activityMultiplier = getActivityMultiplier(profile.activityLevel || ActivityLevel.Sedentary);
  
  return Math.round(bmr * activityMultiplier);
}

/**
 * Calculate total nutrition from food entries
 * @param entries Array of food entries
 * @returns Object with total calories, protein, carbs, and fat
 */
export function calculateTotalNutrition(entries: FoodEntry[]) {
  return entries.reduce(
    (totals, entry) => {
      const { nutrition } = entry.foodItem;
      const multiplier = entry.servingAmount;

      return {
        calories: totals.calories + nutrition.calories * multiplier,
        protein: totals.protein + nutrition.protein * multiplier,
        carbs: totals.carbs + nutrition.carbs * multiplier,
        fat: totals.fat + nutrition.fat * multiplier,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

/**
 * Calculate macronutrient percentages
 * @param protein Protein in grams
 * @param carbs Carbs in grams
 * @param fat Fat in grams
 * @returns Object with percentage values for each macronutrient
 */
export function calculateMacroPercentages(protein: number, carbs: number, fat: number) {
  const proteinCalories = protein * 4;
  const carbCalories = carbs * 4;
  const fatCalories = fat * 9;
  const totalCalories = proteinCalories + carbCalories + fatCalories;
  
  if (totalCalories === 0) return { protein: 0, carbs: 0, fat: 0 };
  
  return {
    protein: Math.round((proteinCalories / totalCalories) * 100),
    carbs: Math.round((carbCalories / totalCalories) * 100),
    fat: Math.round((fatCalories / totalCalories) * 100),
  };
}

/**
 * Generate suggested calorie targets based on user's stats and goals
 * @param profile User profile
 * @param goalType Weight goal type ('lose', 'maintain', or 'gain')
 * @returns Object with suggested calorie and macronutrient targets
 */
export function generateNutritionTargets(profile: UserProfile, goalType: 'lose' | 'maintain' | 'gain') {
  if (!profile.weight || !profile.height || !profile.age) {
    return {
      calories: 2000, // Default value
      protein: 50,
      carbs: 250,
      fat: 70,
    };
  }
  
  const tdee = calculateTDEE(profile);
  let targetCalories: number;
  
  // Adjust calories based on goal
  switch (goalType) {
    case 'lose':
      targetCalories = tdee - 500; // 500 calorie deficit for weight loss
      break;
    case 'gain':
      targetCalories = tdee + 500; // 500 calorie surplus for weight gain
      break;
    default:
      targetCalories = tdee; // Maintenance
  }
  
  // Calculate macronutrient targets
  // Protein: ~30% of calories (2g per kg bodyweight for active individuals)
  // Fat: ~25% of calories
  // Carbs: remaining calories
  const proteinGrams = Math.round(profile.weight * (profile.activityLevel === ActivityLevel.Sedentary ? 1.2 : 1.8));
  const fatGrams = Math.round((targetCalories * 0.25) / 9); // 9 calories per gram of fat
  const proteinCalories = proteinGrams * 4; // 4 calories per gram of protein
  const fatCalories = fatGrams * 9;
  const carbCalories = targetCalories - proteinCalories - fatCalories;
  const carbGrams = Math.round(carbCalories / 4); // 4 calories per gram of carbs
  
  return {
    calories: targetCalories,
    protein: proteinGrams,
    carbs: carbGrams,
    fat: fatGrams,
  };
}
