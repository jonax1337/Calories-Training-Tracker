import { BarcodeApiResponse, FoodItem, NutritionInfo } from '../types';

// Gemeinsame Interface für Produktdaten aus beiden API-Endpunkten
interface ProductData {
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
  generic_name?: string;
  ingredients_text?: string;
  description?: string;
}

// Using the Open Food Facts API for nutrition data
const API_URL = 'https://world.openfoodfacts.org/api/v2/product/';
const SEARCH_API_URL = 'https://world.openfoodfacts.org/cgi/search.pl';

/**
 * Gemeinsame Funktion zur Erstellung eines FoodItem aus API-Produktdaten
 * @param product Das Produktobjekt aus der API
 * @returns Ein einheitlich formatiertes FoodItem
 */
function createFoodItemFromProduct(product: ProductData): FoodItem {
  // Debug-Log: Produktdaten
  console.log('DEBUG: Produktdaten verarbeiten:', product.product_name,
    'serving_size:', product.serving_size || 'nicht vorhanden',
    'serving_quantity:', product.serving_quantity || 'nicht vorhanden',
    'quantity:', product.quantity || 'nicht vorhanden',
    'description:', product.description || product.generic_name || 'nicht vorhanden'
  );
  
  // Parse quantity to get serving size in grams
  let servingSizeGrams = 100; // Default to 100g
  let servingSize = product.serving_size || product.quantity || '';
  let servingDescription = "";
  
  // 1. Bevorzuge serving_size aus der API, wenn vorhanden
  if (servingSize) {
    console.log(`API serving size: ${servingSize}`);
    
    // Versuche, die Gramm aus der Portionsgröße zu extrahieren
    const servingSizeMatch = servingSize.match(/(\d+([.,]\d+)?)\s*(g|gramm)/i);
    if (servingSizeMatch) {
      servingSizeGrams = parseFloat(servingSizeMatch[1].replace(',', '.'));
      console.log(`Parsed serving size from API: ${servingSizeGrams}g`);
      
      // Extrahiere nur die relevanten Informationen: Zahl + Einheit (g, ml, etc.)
      let cleanedServingSize = "100g"; // Standardwert falls nichts gefunden wird
      
      if (typeof servingSize === 'string') {
        // Suche direkt nach Zahlenwerten mit Einheiten wie "123g", "45 ml", "3.5 kg"
        const unitMatches = servingSize.match(/(\d+[.,]?\d*)\s*(g|ml|l|kg)/i);
        
        if (unitMatches && unitMatches.length >= 3) {
          // Nehme nur die Zahl und die Einheit
          const amount = unitMatches[1].replace(',', '.'); // Kommas zu Punkten konvertieren
          const unit = unitMatches[2].toLowerCase();
          cleanedServingSize = `${amount}${unit}`;
        } else {
          // Fallback: Suche nach Zahlen im String
          const numberMatch = servingSize.match(/(\d+[.,]?\d*)/i);
          if (numberMatch) {
            // Wenn eine Zahl gefunden wurde, aber keine Einheit, nehmen wir g als Standard
            cleanedServingSize = `${numberMatch[1].replace(',', '.')}g`;
          }
        }
      }
      
      servingDescription = `Eine Portion entspricht ${cleanedServingSize}`;
    }
  } 
  
  // 2. Falls serving_quantity direkt verfügbar ist, verwende diesen Wert
  if (product.serving_quantity) {
    servingSizeGrams = product.serving_quantity;
    console.log(`API serving quantity: ${servingSizeGrams}g`);
    
    if (!servingDescription && servingSize) {
      // Extrahiere nur die relevanten Informationen: Zahl + Einheit (g, ml, etc.)
      let cleanedServingSize = "100g"; // Standardwert falls nichts gefunden wird
      
      if (typeof servingSize === 'string') {
        // Suche direkt nach Zahlenwerten mit Einheiten wie "123g", "45 ml", "3.5 kg"
        const unitMatches = servingSize.match(/(\d+[.,]?\d*)\s*(g|ml|l|kg)/i);
        
        if (unitMatches && unitMatches.length >= 3) {
          // Nehme nur die Zahl und die Einheit
          const amount = unitMatches[1].replace(',', '.'); // Kommas zu Punkten konvertieren
          const unit = unitMatches[2].toLowerCase();
          cleanedServingSize = `${amount}${unit}`;
        } else {
          // Fallback: Suche nach Zahlen im String
          const numberMatch = servingSize.match(/(\d+[.,]?\d*)/i);
          if (numberMatch) {
            // Wenn eine Zahl gefunden wurde, aber keine Einheit, nehmen wir g als Standard
            cleanedServingSize = `${numberMatch[1].replace(',', '.')}g`;
          }
        }
      }
      
      servingDescription = `Eine Portion entspricht ${cleanedServingSize}`;
    }
  }
  
  // 3. Fallback: Analysiere das quantity-Feld für die Portionsgröße
  const quantity = product.quantity || "";
  if (quantity && !servingDescription) {
    console.log(`API product quantity: ${quantity}`);
    // Try to extract number from string like "400g"
    const match = quantity.match(/([\d.,]+)\s*(g|kg|ml|l)/i);
    if (match) {
      const amount = parseFloat(match[1].replace(',', '.'));
      const unit = match[2].toLowerCase();
      
      // Convert to grams based on unit
      if (unit === 'kg') {
        servingSizeGrams = amount * 1000;
      } else if (unit === 'ml' || unit === 'l') {
        // Für Flüssigkeiten nehmen wir an, dass 1ml ≈ 1g
        servingSizeGrams = unit === 'l' ? amount * 1000 : amount;
      } else {
        servingSizeGrams = amount;
      }
      
      console.log(`Parsed quantity to serving size: ${servingSizeGrams}g`);
      servingDescription = `Eine Portion entspricht ${servingSizeGrams}g`;
    }
  }
  
  // Extrahiere die Nährwerte aus der API-Antwort
  const nutriments = product.nutriments || {};
  
  // Spezielle Behandlung für Kalium, da es in unterschiedlichen Feldern auftauchen kann
  let potassiumValue = nutriments['potassium_100g'] || 0;
  
  // Hilfsfunktion zum Extrahieren von Vitaminwerten aus verschiedenen möglichen Feldern
  const extractVitaminValue = (fields: string[]): number => {
    for (const field of fields) {
      if (nutriments[field] !== undefined) {
        return nutriments[field];
      }
    }
    return 0; // Standardwert, wenn kein Wert gefunden wurde
  };
  
  // Erstelle das Nutrition-Objekt mit allen Nährwerten
  // Stelle sicher, dass servingSizeGrams immer eine Zahl ist, nicht ein String
  const numericServingSizeGrams = typeof servingSizeGrams === 'string' ? 
    parseFloat(servingSizeGrams) : 
    (typeof servingSizeGrams === 'number' ? servingSizeGrams : 100);

  const nutrition: NutritionInfo = {
    // Makronährstoffe
    calories: nutriments['energy-kcal_100g'] || 0,
    protein: nutriments?.proteins_100g,
    carbs: nutriments?.carbohydrates_100g,
    fat: nutriments?.fat_100g,
    sugar: nutriments?.sugars_100g,
    fiber: nutriments?.fiber_100g,
    sodium: nutriments?.sodium_100g,
    potassium: potassiumValue,
    
    // Vitamine
    vitaminA: extractVitaminValue(['vitamin-a_100g', 'vitamin-a_value', 'vitamin_a_100g']),
    vitaminB12: extractVitaminValue(['vitamin-b12_100g', 'vitamin-b12_value', 'vitamin_b12_100g', 'cyanocobalamin_100g']),
    vitaminC: extractVitaminValue(['vitamin-c_100g', 'vitamin-c_value', 'vitamin_c_100g', 'ascorbic-acid_100g']),
    vitaminD: extractVitaminValue(['vitamin-d_100g', 'vitamin-d_value', 'vitamin_d_100g']),
    
    // Mineralstoffe
    calcium: extractVitaminValue(['calcium_100g', 'calcium_value', 'ca_100g']),
    iron: extractVitaminValue(['iron_100g', 'iron_value', 'fe_100g']),
    magnesium: extractVitaminValue(['magnesium_100g', 'magnesium_value', 'mg_100g']),
    zinc: extractVitaminValue(['zinc_100g', 'zinc_value', 'zn_100g']),
    
    servingSize: servingSize,
    servingSizeGrams: numericServingSizeGrams, // Verwende die numerische Version
    servingDescription: servingDescription
  };
  
  // Debug-Log für das erstellte Nutrition-Objekt
  console.log('Erstelltes Nutrition-Objekt:', JSON.stringify(nutrition, null, 2));
  
  // Erstelle das FoodItem
  return {
    id: `food_${product.code}`,
    name: product.product_name || 'Unknown Product',
    brand: product.brands,
    barcode: product.code,
    nutrition,
    image: product.image_url,
    description: product.description || product.generic_name || product.ingredients_text || ''
  };
}

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
      
       // Verwende die gemeinsame Funktion zur Erstellung des FoodItem
      return createFoodItemFromProduct(product as ProductData);
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
  products: Array<ProductData>;
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
        'image_url',
        // Beschreibungen
        'generic_name',
        'ingredients_text', 
        'description',
        // Makronährstoffe
        'nutriments.energy-kcal_100g',
        'nutriments.proteins_100g',
        'nutriments.carbohydrates_100g',
        'nutriments.fat_100g',
        'nutriments.sugars_100g',
        'nutriments.fiber_100g',
        'nutriments.sodium_100g',
        'nutriments.potassium_100g',
        // Vitamine
        'nutriments.vitamin-a_100g',
        'nutriments.vitamin-b12_100g',
        'nutriments.vitamin-c_100g',
        'nutriments.vitamin-d_100g',
        'nutriments.vitamin_a_100g',
        'nutriments.vitamin_b12_100g',
        'nutriments.vitamin_c_100g',
        'nutriments.vitamin_d_100g',
        // Mineralstoffe
        'nutriments.calcium_100g',
        'nutriments.iron_100g',
        'nutriments.magnesium_100g',
        'nutriments.zinc_100g',
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
          'quantity:', product.quantity || 'nicht vorhanden',
          'description:', product.description || product.generic_name || 'nicht vorhanden'
        );
        
        // Verwende die gemeinsame Funktion zur Erstellung des FoodItem
        return createFoodItemFromProduct(product);
      });
    }
    
    return [];
  } catch (error) {
    console.error('Error searching food data:', error);
    return [];
  }
}
