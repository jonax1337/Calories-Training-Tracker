import { BarcodeApiResponse, FoodItem, NutritionInfo } from '../types';

// Using the Open Food Facts API for nutrition data
const API_URL = 'https://world.openfoodfacts.org/api/v2/product/';
const SEARCH_API_URL = 'https://world.openfoodfacts.org/cgi/search.pl';

/**
 * Fetches food data from the Open Food Facts API using a barcode
 * @param barcode The product barcode to search for
 * @returns A Promise that resolves to a FoodItem or null if not found
 */
export async function getFoodDataByBarcode(barcode: string): Promise<FoodItem | null> {
  try {
    console.log(`API request for barcode: ${barcode}`);
    const response = await fetch(`${API_URL}${barcode}.json`);
    
    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data: BarcodeApiResponse = await response.json();
    console.log(`API response status: ${data.status}`);
    
    if (data.status === 1 && data.product) {
      const { product } = data;

      // Überprüfe, ob das Produkt einen gültigen Namen hat
      if (!product.product_name) {
        console.log(`Produkt gefunden, aber ohne gültigen Namen. Barcode: ${barcode}`);
        return null;
      }
      
      console.log(`Product found: ${product.product_name}`);
      
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
        name: product.product_name, // Kein Fallback mehr nötig, da wir oben bereits prüfen
        brand: product.brands || '',
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

/**
 * Interface for Open Food Facts search API response
 */
interface SearchApiResponse {
  count: number;
  page: number;
  page_size: number;
  products: Array<{
    code: string;
    product_name?: string;
    brands?: string;
    image_url?: string;
    quantity?: string;
    nutriments?: {
      [key: string]: number;
    };
  }>;
}

/**
 * Searches for food products by name using the Open Food Facts API
 * @param query The product name to search for
 * @returns A Promise that resolves to an array of FoodItems
 */
export async function searchFoodByName(query: string): Promise<FoodItem[]> {
  try {
    const params = new URLSearchParams({
      search_terms: query,
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: '5' // Limit to 5 results for better performance
    });
    
    console.log(`API search request for: ${query}`);
    const response = await fetch(`${SEARCH_API_URL}?${params.toString()}`);
    
    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const data: SearchApiResponse = await response.json();
    console.log(`API search found ${data.products?.length || 0} products`);
    
    if (data.products && data.products.length > 0) {
      return data.products.map(product => {
        // Extract nutrition information
        const nutrition: NutritionInfo = {
          calories: product.nutriments?.['energy-kcal_100g'] || 0,
          protein: product.nutriments?.proteins_100g || 0,
          carbs: product.nutriments?.carbohydrates_100g || 0,
          fat: product.nutriments?.fat_100g || 0,
          sugar: product.nutriments?.sugars_100g,
          fiber: product.nutriments?.fiber_100g,
          sodium: product.nutriments?.sodium_100g,
          servingSize: product.quantity || '100g',
          servingSizeGrams: 100 // Default to 100g
        };
        
        // Create a FoodItem object
        return {
          id: `food_${product.code}`,
          name: product.product_name || 'Unknown Product',
          brand: product.brands,
          barcode: product.code,
          nutrition,
          image: product.image_url
        };
      });
    }
    
    return [];
  } catch (error) {
    console.error('Error searching food data:', error);
    return [];
  }
}
