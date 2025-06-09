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
      
      // Debug: Vollständige API-Antwort loggen (für Portionsgrößen-Analyse)
      console.log('DEBUG: API product object structure:', JSON.stringify(product, null, 2));
      console.log('DEBUG: Vorhandene Portionsfelder:',
        'serving_size:', product.serving_size || 'nicht vorhanden',
        'serving_quantity:', product.serving_quantity || 'nicht vorhanden',
        'quantity:', product.quantity || 'nicht vorhanden'
      );

      // Überprüfe, ob das Produkt einen gültigen Namen hat
      if (!product.product_name) {
        console.log(`Produkt gefunden, aber ohne gültigen Namen. Barcode: ${barcode}`);
        return null;
      }
      
      console.log(`Product found: ${product.product_name}`);
      
      // Extract nutrition information from the API response
      
      // Parse quantity to get serving size in grams
      let servingSizeGrams = 100; // Default to 100g
      const quantity = product.quantity || "";
      let servingSize = "";
      let servingDescription = "";
      
      // 1. Bevorzuge serving_size aus der API, wenn vorhanden
      if (product.serving_size) {
        servingSize = product.serving_size;
        console.log(`API serving size: ${servingSize}`);
        
        // Versuche, die Gramm aus der Portionsgröße zu extrahieren
        const servingSizeMatch = servingSize.match(/(\d+([.,]\d+)?)\s*(g|gramm)/i);
        if (servingSizeMatch) {
          servingSizeGrams = parseFloat(servingSizeMatch[1].replace(',', '.'));
          console.log(`Parsed serving size from API: ${servingSizeGrams}g`);
          
          // Setze Beschreibung der Portionsgröße
          servingDescription = `Eine Portion entspricht ${servingSize}`;
        }
      } 
      
      // 2. Falls serving_quantity direkt verfügbar ist, verwende diesen Wert
      if (product.serving_quantity) {
        servingSizeGrams = product.serving_quantity;
        console.log(`API serving quantity: ${servingSizeGrams}g`);
        
        if (!servingDescription && servingSize) {
          servingDescription = `Eine Portion entspricht ${servingSize}`;
        }
      }
      
      if (quantity) {
        console.log(`Product quantity: ${quantity}`);
        // Try to extract number from string like "400g"
        const match = quantity.match(/([\d.,]+)\s*(g|kg|ml|l)/i);
        if (match) {
          const amount = parseFloat(match[1].replace(',', '.'));
          const unit = match[2].toLowerCase();
          
          // Convert to grams based on unit
          if (unit === 'kg') {
            servingSizeGrams = amount * 1000;
          } else if (unit === 'g') {
            servingSizeGrams = amount;
          } else if (unit === 'l') {
            servingSizeGrams = amount * 1000; // Assuming 1L = 1000g for simplicity
          } else if (unit === 'ml') {
            servingSizeGrams = amount; // Assuming 1ml = 1g for simplicity
          }
          
          console.log(`Parsed serving size: ${servingSizeGrams}g`);
        }
      }
      
      // Debug-Log für gefundene Nährwerte
      console.log('Nutriments von API:', product.nutriments);
      console.log('Kalium-Wert von API:', product.nutriments?.potassium_100g);
      
      // Kalium kann in verschiedenen Formaten in der API vorkommen
      // Wir müssen any verwenden, da die API-Struktur nicht fest definiert ist
      const nutriments = product.nutriments as any;
      const potassiumValue = nutriments?.potassium_100g || nutriments?.['k_100g'] || undefined;
      console.log('Gefundener Kalium-Wert:', potassiumValue);
      
      const nutrition: NutritionInfo = {
        calories: product.nutriments?.['energy-kcal_100g'] || 0,
        protein: product.nutriments?.proteins_100g,
        carbs: product.nutriments?.carbohydrates_100g,
        fat: product.nutriments?.fat_100g,
        sugar: product.nutriments?.sugars_100g,
        fiber: product.nutriments?.fiber_100g,
        sodium: product.nutriments?.sodium_100g,
        potassium: potassiumValue,
        servingSize: product.serving_size || product.quantity || '100g',
        servingSizeGrams: servingSizeGrams,
        servingDescription: servingDescription || undefined
      };
      
      // Debug-Log für das erstellte Nutrition-Objekt
      console.log('Erstelltes Nutrition-Objekt:', nutrition);
      
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
    serving_size?: string;
    serving_quantity?: number;
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
      json: '1',
      page_size: '50', // Limit to 50 results for better performance
      // Nur die wirklich nötigen Felder anfordern:
      fields: [
        'code',
        'product_name',
        'brands',
        'quantity',
        'serving_size',
        'serving_quantity',
        'nutriments.energy-kcal_100g',
        'nutriments.proteins_100g',
        'nutriments.carbohydrates_100g',
        'nutriments.fat_100g',
        'nutriments.sugars_100g',
        'nutriments.fiber_100g',
        'nutriments.sodium_100g',
        'nutriments.potassium_100g',
      ].join(',')
    });
    
    console.log(`API search request for: ${SEARCH_API_URL}?${params.toString()}`);
    const response = await fetch(`${SEARCH_API_URL}?${params.toString()}`);
    
    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const data: SearchApiResponse = await response.json();
    console.log(`API search found ${data.products?.length || 0} products`);
    
    if (data.products && data.products.length > 0) {
      // Log die ersten 2 Produkte vollständig für Debug-Zwecke
      if (data.products.length >= 1) {
        console.log('DEBUG: Erstes Suchprodukt (vollständig):', JSON.stringify(data.products[0], null, 2));
      }
      if (data.products.length >= 2) {
        console.log('DEBUG: Zweites Suchprodukt (vollständig):', JSON.stringify(data.products[1], null, 2));
      }
      
      return data.products.map(product => {
        // Log serving_size und serving_quantity für jedes gefundene Produkt
        console.log('DEBUG: Produkt Portionsinfo:', product.product_name,
          'serving_size:', product.serving_size || 'nicht vorhanden',
          'serving_quantity:', product.serving_quantity || 'nicht vorhanden',
          'quantity:', product.quantity || 'nicht vorhanden'
        );
        
        // Extract nutrition information
        
        // Parse quantity to get serving size in grams (gleicher Code wie in getFoodDataByBarcode)
        let servingSizeGrams = 100; // Default to 100g
        const quantity = product.quantity || "";
        
        if (quantity) {
          console.log(`Search product quantity: ${quantity}`);
          // Try to extract number from string like "400g"
          const match = quantity.match(/([\d.,]+)\s*(g|kg|ml|l)/i);
          if (match) {
            const amount = parseFloat(match[1].replace(',', '.'));
            const unit = match[2].toLowerCase();
            
            // Convert to grams based on unit
            if (unit === 'kg') {
              servingSizeGrams = amount * 1000;
            } else if (unit === 'g') {
              servingSizeGrams = amount;
            } else if (unit === 'l') {
              servingSizeGrams = amount * 1000; // Assuming 1L = 1000g for simplicity
            } else if (unit === 'ml') {
              servingSizeGrams = amount; // Assuming 1ml = 1g for simplicity
            }
            
            console.log(`Search parsed serving size: ${servingSizeGrams}g`);
          }
        }
        
        // Debug-Log für gefundene Nährwerte
        console.log('Nutriments von API (Suche):', product.nutriments);
        console.log('Kalium-Wert von API (Suche):', product.nutriments?.potassium_100g);
        
        // Kalium kann in verschiedenen Formaten in der API vorkommen
        // Wir müssen any verwenden, da die API-Struktur nicht fest definiert ist
        const nutriments = product.nutriments as any;
        const potassiumValue = nutriments?.potassium_100g || nutriments?.['k_100g'] || undefined;
        console.log('Gefundener Kalium-Wert (Suche):', potassiumValue);
        
        const nutrition: NutritionInfo = {
          calories: product.nutriments?.['energy-kcal_100g'] || 0,
          protein: product.nutriments?.proteins_100g || 0,
          carbs: product.nutriments?.carbohydrates_100g || 0,
          fat: product.nutriments?.fat_100g || 0,
          sugar: product.nutriments?.sugars_100g,
          fiber: product.nutriments?.fiber_100g,
          sodium: product.nutriments?.sodium_100g,
          potassium: potassiumValue,
          servingSize: product.quantity || '100g',
          servingSizeGrams: servingSizeGrams
        };
        
        // Debug-Log für das erstellte Nutrition-Objekt
        console.log('Erstelltes Nutrition-Objekt (Suche):', nutrition);
        
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
