import { BarcodeApiResponse, FoodItem, NutritionInfo } from '../types';

// Using the Open Food Facts API for nutrition data
const API_URL = 'https://world.openfoodfacts.org/api/v0/product/';

/**
 * Fetches food data from the Open Food Facts API using a barcode
 * @param barcode The product barcode to search for
 * @returns A Promise that resolves to a FoodItem or null if not found
 */
export async function getFoodDataByBarcode(barcode: string): Promise<FoodItem | null> {
  try {
    const response = await fetch(`${API_URL}${barcode}.json`);
    const data: BarcodeApiResponse = await response.json();
    
    if (data.status === 1 && data.product) {
      const { product } = data;
      
      // Extract nutrition information from the API response
      const nutrition: NutritionInfo = {
        calories: product.nutriments?.['energy-kcal_100g'] || 0,
        protein: product.nutriments?.proteins_100g || 0,
        carbs: product.nutriments?.carbohydrates_100g || 0,
        fat: product.nutriments?.fat_100g || 0,
        sugar: product.nutriments?.sugars_100g,
        fiber: product.nutriments?.fiber_100g,
        sodium: product.nutriments?.sodium_100g,
        servingSize: product.quantity || '100g',
        servingSizeGrams: 100 // Default to 100g if no specific serving size
      };
      
      // Create and return a FoodItem object from the API data
      const foodItem: FoodItem = {
        id: `food_${barcode}`,
        name: product.product_name || 'Unknown Product',
        brand: product.brands,
        barcode,
        nutrition,
        image: product.image_url
      };
      
      return foodItem;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching food data:', error);
    return null;
  }
}
