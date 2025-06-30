import { FoodItem } from '../types';

/**
 * Determines the appropriate display unit for a food item based ONLY on API serving size data
 * Priority: 
 * 1. If servingSize contains ml/l units, use ml
 * 2. If servingSizeGrams suggests liquid density (≈1g/ml with ml units), use ml
 * 3. Fallback to gramm for all other cases
 */
export function determineDisplayUnit(foodItem: FoodItem | null): 'ml' | 'g' {
  if (!foodItem || !foodItem.nutrition) {
    return 'g'; // Default fallback
  }

  const { servingSize, servingSizeGrams } = foodItem.nutrition;
  
  if (!servingSize) {
    return 'g'; // No serving size info, default to grams
  }

  const servingSizeLower = servingSize.toLowerCase();

  // 1. Direct ml/l unit detection from API data
  if (servingSizeLower.includes('ml') || servingSizeLower.includes('milliliter')) {
    return 'ml';
  }
  
  if (servingSizeLower.includes('liter') || /\bl\b/.test(servingSizeLower)) {
    return 'ml';
  }

  // 2. Analyze numerical relationship (if grams ≈ ml, likely liquid)
  if (servingSizeGrams) {
    const mlMatch = servingSize.match(/(\d+(?:[.,]\d+)?)\s*ml/i);
    const lMatch = servingSize.match(/(\d+(?:[.,]\d+)?)\s*l/i);
    
    if (mlMatch) {
      const mlValue = parseFloat(mlMatch[1].replace(',', '.'));
      // If ml value closely matches grams value (within 10% tolerance)
      if (Math.abs(mlValue - servingSizeGrams) <= Math.max(mlValue * 0.1, 2)) {
        return 'ml';
      }
    }
    
    if (lMatch) {
      const lValue = parseFloat(lMatch[1].replace(',', '.'));
      const mlEquivalent = lValue * 1000;
      // If liter converted to ml closely matches grams value
      if (Math.abs(mlEquivalent - servingSizeGrams) <= Math.max(mlEquivalent * 0.1, 20)) {
        return 'ml';
      }
    }
  }
  
  // Default to grams for all other cases
  return 'g';
}


/**
 * Gets the display unit string for UI components
 */
export function getDisplayUnitString(unit: 'ml' | 'g'): string {
  return unit === 'ml' ? 'Milliliter' : 'Gramm';
}

/**
 * Gets the short unit string for labels
 */
export function getShortUnitString(unit: 'ml' | 'g'): string {
  return unit === 'ml' ? 'ml' : 'g';
}

/**
 * Determines if a food item is likely a liquid based ONLY on its serving size units
 */
export function isLikelyLiquid(foodItem: FoodItem | null): boolean {
  if (!foodItem || !foodItem.nutrition?.servingSize) {
    return false;
  }

  const servingSize = foodItem.nutrition.servingSize.toLowerCase();
  
  // Check ONLY for unit indicators in serving size (no keywords)
  const liquidUnitIndicators = [
    /\bml\b/, /\bmilliliter\b/, /\bliter\b/, /\bl\b/
  ];
  
  return liquidUnitIndicators.some(indicator => indicator.test(servingSize));
}