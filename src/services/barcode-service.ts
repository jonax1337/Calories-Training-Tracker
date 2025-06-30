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
const API_URL = 'https://world.openfoodfacts.net/api/v2/product/';
const SEARCH_API_URL = 'https://world.openfoodfacts.net/cgi/search.pl';

/**
 * Gemeinsame Funktion zur Erstellung eines FoodItem aus API-Produktdaten
 * @param product Das Produktobjekt aus der API
 * @returns Ein einheitlich formatiertes FoodItem
 */
function createFoodItemFromProduct(product: ProductData): FoodItem | null {
  try {
    // Validierung der Grunddaten
    if (!product) {
      console.error('FEHLER: Produktobjekt ist null oder undefined');
      return null;
    }
    
    if (!product.code) {
      console.error('FEHLER: Produktcode fehlt für:', product.product_name || 'Unbekanntes Produkt');
      return null;
    }
    
    if (!product.product_name || product.product_name.trim() === '') {
      console.error('FEHLER: Produktname fehlt für Code:', product.code);
      return null;
    }
    
    // Debug-Log: Produktdaten
    console.log('DEBUG: Verarbeite Produkt:', product.product_name);
    console.log('DEBUG: API-Felder -', {
      serving_size: product.serving_size || 'fehlt',
      serving_quantity: product.serving_quantity || 'fehlt', 
      quantity: product.quantity || 'fehlt'
    });
  
  // Parse quantity to get serving size in grams
  let servingSizeGrams = 100; // Default to 100g
  let servingSize = product.serving_size || product.quantity || '';
  let servingDescription = "";
  let cleanedServingSize = "100 g"; // Default value
  
  // 1. Bevorzuge serving_size aus der API, wenn vorhanden
  if (servingSize) {
    // Erweiterte Suche nach allen Einheiten (g, ml, l, kg)
    const unitMatches = servingSize.match(/(\d+[.,]?\d*)\s*(g|gramm|ml|milliliter|l|liter|kg)/i);
    
    if (unitMatches && unitMatches.length >= 3) {
      const amount = parseFloat(unitMatches[1].replace(',', '.'));
      const unit = unitMatches[2].toLowerCase();
      
      // Convert to grams for internal storage
      if (unit === 'kg') {
        servingSizeGrams = amount * 1000;
        cleanedServingSize = `${amount} kg`;
      } else if (unit === 'l' || unit === 'liter') {
        servingSizeGrams = amount * 1000; // 1l ≈ 1000g for liquids
        cleanedServingSize = `${amount} l`;
      } else if (unit === 'ml' || unit === 'milliliter') {
        servingSizeGrams = amount; // 1ml ≈ 1g for liquids
        cleanedServingSize = `${amount} ml`;
      } else {
        servingSizeGrams = amount;
        cleanedServingSize = `${amount} g`;
      }
      
      console.log(`DEBUG: Portionsgröße extrahiert: ${servingSizeGrams}g (${cleanedServingSize})`);
      servingDescription = `Eine Portion entspricht ${cleanedServingSize}`;
    } else {
      // Fallback: Search for grams only (old logic)
      const gramsMatch = servingSize.match(/(\d+([.,]\d+)?)\s*(g|gramm)/i);
      if (gramsMatch) {
        servingSizeGrams = parseFloat(gramsMatch[1].replace(',', '.'));
        cleanedServingSize = `${servingSizeGrams} g`;
        servingDescription = `Eine Portion entspricht ${cleanedServingSize}`;
        console.log(`DEBUG: Fallback Gramm-Parsing: ${servingSizeGrams} g`);
      } else {
        console.log(`DEBUG: Keine Einheit gefunden in serving_size: ${servingSize}`);
      }
    }
  } 
  
  // 2. Falls serving_quantity direkt verfügbar ist, verwende diesen Wert
  if (product.serving_quantity) {
    servingSizeGrams = product.serving_quantity;
    console.log(`DEBUG: API serving_quantity übernommen: ${servingSizeGrams} g`);
    
    if (!servingDescription && servingSize) {
      // Extrahiere nur die relevanten Informationen: Zahl + Einheit (g, ml, etc.)
      let cleanedServingSize = "100 g"; // Standardwert falls nichts gefunden wird
      
      if (typeof servingSize === 'string') {
        // Suche direkt nach Zahlenwerten mit Einheiten wie "123g", "45 ml", "3.5 kg"
        const unitMatches = servingSize.match(/(\d+[.,]?\d*)\s*(g|ml|l|kg)/i);
        
        if (unitMatches && unitMatches.length >= 3) {
          // Nehme nur die Zahl und die Einheit
          const amount = unitMatches[1].replace(',', '.'); // Kommas zu Punkten konvertieren
          const unit = unitMatches[2].toLowerCase();
          cleanedServingSize = `${amount} ${unit}`;
        } else {
          // Fallback: Suche nach Zahlen im String
          const numberMatch = servingSize.match(/(\d+[.,]?\d*)/i);
          if (numberMatch) {
            // Wenn eine Zahl gefunden wurde, aber keine Einheit, nehmen wir g als Standard
            cleanedServingSize = `${numberMatch[1].replace(',', '.')} g`;
          }
        }
      }
      
      servingDescription = `Eine Portion entspricht ${cleanedServingSize}`;
    }
  }
  
  // 3. Fallback: Analysiere das quantity-Feld für die Portionsgröße
  const quantity = product.quantity || "";
  if (quantity && !servingDescription) {
    console.log(`DEBUG: Fallback zu quantity-Feld: ${quantity} g`);
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
      
      console.log(`DEBUG: Quantity zu Portionsgröße: ${servingSizeGrams} g`);
      servingDescription = `Eine Portion entspricht ${servingSizeGrams} g`;
    } else {
      console.log(`DEBUG: Quantity konnte nicht geparst werden: ${quantity}`);
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
    
    servingSize: cleanedServingSize, // Use the cleaned/parsed serving size with proper units
    servingSizeGrams: numericServingSizeGrams, // Verwende die numerische Version
    servingDescription: servingDescription,
    productQuantity: product.quantity?.replace(/\s*[℮e]\s*$/i, '') || undefined // Store cleaned product quantity from API
  };
  
  // Debug-Log für das finale Nutrition-Objekt
  console.log('DEBUG: Nutrition-Objekt erstellt:', {
    servingSize: nutrition.servingSize,
    servingSizeGrams: nutrition.servingSizeGrams,
    productQuantity: nutrition.productQuantity,
    calories: nutrition.calories
  });
  
  // Erstelle das FoodItem
  const foodItem: FoodItem = {
    id: `food_${product.code}`,
    name: product.product_name,
    brand: product.brands,
    barcode: product.code,
    nutrition,
    image: product.image_url,
    description: product.description || product.generic_name || product.ingredients_text || ''
  };
  
  console.log('DEBUG: FoodItem erfolgreich erstellt für:', foodItem.name);
  return foodItem;
  } catch (error) {
    console.error('FEHLER: createFoodItemFromProduct fehlgeschlagen:', error);
    return null;
  }
}

/**
 * Fetches food data from the Open Food Facts API using a barcode
 * @param barcode The product barcode to search for
 * @returns A Promise that resolves to a FoodItem or null if not found
 */
export async function getFoodDataByBarcode(barcode: string): Promise<FoodItem | null> {
  try {
    console.log(`DEBUG: Barcode-Anfrage gestartet: ${barcode}`);
    const response = await fetch(`${API_URL}${barcode}.json`);
    
    if (!response.ok) {
      console.error(`FEHLER: API Antwort fehlgeschlagen: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data: BarcodeApiResponse = await response.json();
    
    if (data.status === 1 && data.product) {
      const { product } = data;
      
      // Überprüfe, ob das Produkt einen gültigen Namen hat
      if (!product.product_name) {
        console.log(`FEHLER: Produkt ohne Namen gefunden. Barcode: ${barcode}`);
        return null;
      }
      
      console.log(`DEBUG: Produkt gefunden: ${product.product_name}`);
      
       // Verwende die gemeinsame Funktion zur Erstellung des FoodItem
      const foodItem = createFoodItemFromProduct(product as ProductData);
      
      if (!foodItem) {
        console.error(`FEHLER: FoodItem konnte nicht erstellt werden für ${product.product_name}`);
        return null;
      }
      
      console.log(`DEBUG: FoodItem erfolgreich erstellt für ${foodItem.name}`);
      return foodItem;
    } else {
      console.log(`DEBUG: Kein Produkt gefunden für Barcode: ${barcode} (Status: ${data.status})`);
    }
    
    return null;
  } catch (error) {
    console.error('FEHLER: Barcode-Service Fehler:', error);
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
    
    console.log(`DEBUG: Suche gestartet für: "${query}"`);
    const response = await fetch(`${SEARCH_API_URL}?${params.toString()}`);
    
    if (!response.ok) {
      console.error(`FEHLER: Such-API fehlgeschlagen: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const data: SearchApiResponse = await response.json();
    const productCount = data.products?.length || 0;
    console.log(`DEBUG: ${productCount} Produkte gefunden für "${query}"`);
    
    if (data.products && data.products.length > 0) {
      const foodItems: FoodItem[] = [];
      
      console.log(`DEBUG: Verarbeite ${data.products.length} Produkte aus Suchergebnissen...`);
      
      for (let i = 0; i < data.products.length; i++) {
        const product = data.products[i];
        
        // Log basic info about each product before processing
        console.log(`DEBUG: Produkt ${i + 1}/${data.products.length}:`, {
          code: product?.code || 'fehlt',
          name: product?.product_name || 'fehlt',
          hasProduct: !!product
        });
        
        const foodItem = createFoodItemFromProduct(product);
        if (foodItem) {
          foodItems.push(foodItem);
        }
      }
      
      console.log(`DEBUG: ${foodItems.length} FoodItems erfolgreich erstellt`);
      return foodItems;
    }
    
    return [];
  } catch (error) {
    console.error('FEHLER: Such-Service Fehler:', error);
    return [];
  }
}
