import React from 'react';
import { View, Text } from 'react-native';
import { NutritionInfo } from '../../types';
import { useTheme } from '../../theme/ThemeContext';
import { createNutritionalInfoCardStyles } from '../../styles/components/ui/NutritionalInfoCardStyles';

interface NutritionalInfoCardProps {
  nutrition: NutritionInfo;
  servingMultiplier?: number;
}

function NutritionalInfoCard({ nutrition, servingMultiplier = 1 }: NutritionalInfoCardProps) {
  // Get theme for styling
  const { theme } = useTheme();
  const styles = createNutritionalInfoCardStyles(theme);
  
  // Debug-Log für Nutrition-Objekt
  console.log('NutritionalInfoCard erhält:', nutrition);
  console.log('NutritionalInfoCard kalium-Wert:', nutrition.potassium);
  
  // Weitere Debug-Info für Kalium-Anzeige
  const hasPotassium = nutrition.potassium !== undefined;
  console.log('Kalium-Wert verfügbar?', hasPotassium, nutrition.potassium);
  
  // Calculate nutrition values based on serving multiplier
  // Für Vitaminwerte: Umrechnung von g in μg (1g = 1.000.000μg)
  // Für Mineralwerte: Umrechnung von g in mg (1g = 1.000mg)
  const calculateValue = (value: number | undefined, unit: string = '') => {
    // Bei undefined oder null Werten 0 zurückgeben
    if (value === undefined || value === null || isNaN(value)) {
      return 0;
    }
    
    if (unit === 'μg') {
      // Umrechnung von g in μg (Mikrogramm)
      return Math.round(value * 1000000 * servingMultiplier * 10) / 10;
    } else if (unit === 'mg') {
      // Umrechnung von g in mg (Milligramm) - immer umrechnen!
      return Math.round(value * 1000 * servingMultiplier * 10) / 10;
    }
    return Math.round(value * servingMultiplier * 10) / 10;
  };
  
  // Spezifische Berechnungsfunktion für Mineralstoffe (immer in mg anzeigen)
  const calculateMineralValue = (value: number | undefined) => {
    // Bei undefined oder null Werten 0 zurückgeben
    if (value === undefined || value === null || isNaN(value)) {
      return 0;
    }
    // Umrechnung von g in mg (1g = 1000mg)
    // Runde auf eine Nachkommastelle
    return Math.round(value * 1000 * servingMultiplier * 10) / 10;
  };

  return (
    <View style={styles.card}>
      {/* Makronährstoffe Überschrift */}
      <Text style={styles.sectionTitle}>Makronährstoffe</Text>
      
      {nutrition.calories !== undefined && (
      <View style={styles.nutritionRow}>
        <Text style={styles.nutrientName}>Kalorien</Text>
        <Text style={styles.nutrientValuePrimary}>{calculateValue(nutrition.calories)} kcal</Text>
      </View>
      )}
      
      {nutrition.protein !== undefined && nutrition.protein > 0 && (
      <View style={styles.nutritionRow}>
        <Text style={styles.nutrientName}>Protein</Text>
        <Text style={styles.nutrientValue}>{calculateValue(nutrition.protein)}g</Text>
      </View>
      )}
      
      {nutrition.carbs !== undefined && nutrition.carbs > 0 && (
      <View style={styles.nutritionRow}>
        <Text style={styles.nutrientName}>Kohlenhydrate</Text>
        <Text style={styles.nutrientValue}>{calculateValue(nutrition.carbs)}g</Text>
      </View>
      )}
      
      {nutrition.fat !== undefined && nutrition.fat > 0 && (
      <View style={styles.nutritionRow}>
        <Text style={styles.nutrientName}>Fett</Text>
        <Text style={styles.nutrientValue}>{calculateValue(nutrition.fat)}g</Text>
      </View>
      )}
      
      {nutrition.sugar !== undefined && nutrition.sugar > 0 && (
        <View style={styles.nutritionRow}>
          <Text style={styles.nutrientName}>Zucker</Text>
          <Text style={styles.nutrientValue}>{calculateValue(nutrition.sugar)}g</Text>
        </View>
      )}
      
      {nutrition.fiber !== undefined && nutrition.fiber > 0 && (
        <View style={styles.nutritionRow}>
          <Text style={styles.nutrientName}>Ballaststoffe</Text>
          <Text style={styles.nutrientValue}>{calculateValue(nutrition.fiber)}g</Text>
        </View>
      )}
      

      
      {/* Elektrolyte Überschrift */}
      {(nutrition.sodium !== undefined && nutrition.sodium > 0) || 
       (nutrition.potassium !== undefined && nutrition.potassium > 0) ? (
        <Text style={[styles.sectionTitle, { marginTop: theme.spacing.m }]}>Elektrolyte</Text>
      ) : null}
      
      {/* Natrium (in Elektrolyte verschoben) */}
      {nutrition.sodium !== undefined && nutrition.sodium > 0 && (
        <View style={styles.nutritionRow}>
          <Text style={styles.nutrientName}>Natrium</Text>
          <Text style={styles.nutrientValue}>{calculateMineralValue(nutrition.sodium)}mg</Text>
        </View>
      )}
      
      {/* Kalium-Bereich */}
      {nutrition.potassium !== undefined && nutrition.potassium > 0 && (
        <View style={styles.nutritionRow}>
          <Text style={styles.nutrientName}>Kalium</Text>
          <Text style={styles.nutrientValue}>{calculateMineralValue(nutrition.potassium)}mg</Text>
        </View>
      )}
      
      {/* Vitamin-Bereich - Überschrift */}
      {(nutrition.vitaminA !== undefined && nutrition.vitaminA > 0) ||
       (nutrition.vitaminB12 !== undefined && nutrition.vitaminB12 > 0) ||
       (nutrition.vitaminC !== undefined && nutrition.vitaminC > 0) ||
       (nutrition.vitaminD !== undefined && nutrition.vitaminD > 0) ? (
        <Text style={[styles.sectionTitle, { marginTop: theme.spacing.m }]}>Vitamine</Text>
      ) : null}
      
      {/* Vitamin A */}
      {nutrition.vitaminA !== undefined && nutrition.vitaminA > 0 && (
        <View style={styles.nutritionRow}>
          <Text style={styles.nutrientName}>Vitamin A</Text>
          <Text style={styles.nutrientValue}>{calculateValue(nutrition.vitaminA, '��g')}μg</Text>
        </View>
      )}
      
      {/* Vitamin B12 */}
      {nutrition.vitaminB12 !== undefined && nutrition.vitaminB12 > 0 && (
        <View style={styles.nutritionRow}>
          <Text style={styles.nutrientName}>Vitamin B12</Text>
          <Text style={styles.nutrientValue}>{calculateValue(nutrition.vitaminB12, 'μg')}μg</Text>
        </View>
      )}
      
      {/* Vitamin C */}
      {nutrition.vitaminC !== undefined && nutrition.vitaminC > 0 && (
        <View style={styles.nutritionRow}>
          <Text style={styles.nutrientName}>Vitamin C</Text>
          <Text style={styles.nutrientValue}>{calculateMineralValue(nutrition.vitaminC)}mg</Text>
        </View>
      )}
      
      {/* Vitamin D */}
      {nutrition.vitaminD !== undefined && nutrition.vitaminD > 0 && (
        <View style={styles.nutritionRow}>
          <Text style={styles.nutrientName}>Vitamin D</Text>
          <Text style={styles.nutrientValue}>{calculateValue(nutrition.vitaminD, 'μg')}μg</Text>
        </View>
      )}

      {/* Mineralstoff-Bereich - Überschrift */}
      {(nutrition.calcium !== undefined && nutrition.calcium > 0) ||
       (nutrition.iron !== undefined && nutrition.iron > 0) ||
       (nutrition.magnesium !== undefined && nutrition.magnesium > 0) ||
       (nutrition.zinc !== undefined && nutrition.zinc > 0) ? (
        <Text style={[styles.sectionTitle, { marginTop: theme.spacing.m }]}>Mineralstoffe</Text>
      ) : null}
      
      {/* Calcium */}
      {nutrition.calcium !== undefined && nutrition.calcium > 0 && (
        <View style={styles.nutritionRow}>
          <Text style={styles.nutrientName}>Calcium</Text>
          <Text style={styles.nutrientValue}>{calculateMineralValue(nutrition.calcium)}mg</Text>
        </View>
      )}
      
      {/* Eisen */}
      {nutrition.iron !== undefined && nutrition.iron > 0 && (
        <View style={styles.nutritionRow}>
          <Text style={styles.nutrientName}>Eisen</Text>
          <Text style={styles.nutrientValue}>{calculateMineralValue(nutrition.iron)}mg</Text>
        </View>
      )}
      
      {/* Magnesium */}
      {nutrition.magnesium !== undefined && nutrition.magnesium > 0 && (
        <View style={styles.nutritionRow}>
          <Text style={styles.nutrientName}>Magnesium</Text>
          <Text style={styles.nutrientValue}>{calculateMineralValue(nutrition.magnesium)}mg</Text>
        </View>
      )}
      
      {/* Zink */}
      {nutrition.zinc !== undefined && nutrition.zinc > 0 && (
        <View style={styles.nutritionRow}>
          <Text style={styles.nutrientName}>Zink</Text>
          <Text style={styles.nutrientValue}>{calculateMineralValue(nutrition.zinc)}mg</Text>
        </View>
      )}
    </View>
  );
}

export default NutritionalInfoCard;
