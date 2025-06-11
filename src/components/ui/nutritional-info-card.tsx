import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NutritionInfo } from '../../types';
import { useTheme } from '../../theme/theme-context';

interface NutritionalInfoCardProps {
  nutrition: NutritionInfo;
  servingMultiplier?: number;
}

function NutritionalInfoCard({ nutrition, servingMultiplier = 1 }: NutritionalInfoCardProps) {
  // Get theme for styling
  const { theme } = useTheme();
  
  // Debug-Log für Nutrition-Objekt
  console.log('NutritionalInfoCard erhält:', nutrition);
  console.log('NutritionalInfoCard kalium-Wert:', nutrition.potassium);
  
  // Weitere Debug-Info für Kalium-Anzeige
  const hasPotassium = nutrition.potassium !== undefined;
  console.log('Kalium-Wert verfügbar?', hasPotassium, nutrition.potassium);
  
  // Calculate nutrition values based on serving multiplier
  // Für Vitaminwerte: Umrechnung von g in μg (1g = 1.000.000μg)
  const calculateValue = (value: number, unit: string = '') => {
    if (unit === 'μg' && value > 0) {
      // Umrechnung von g in μg
      return Math.round(value * 1000000 * servingMultiplier * 10) / 10;
    }
    return Math.round(value * servingMultiplier * 10) / 10;
  };

  return (
    <View style={[styles.card, { 
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.medium,
      shadowColor: theme.colors.shadow,
      borderColor: theme.colors.border,
    }]}>
      {/* Makronährstoffe Überschrift */}
      <Text style={[styles.sectionTitle, { 
        color: theme.colors.text,
        fontFamily: theme.typography.fontFamily.bold, 
        fontSize: theme.typography.fontSize.m,
        marginTop: theme.spacing.s,
        marginBottom: theme.spacing.xs
      }]}>Makronährstoffe</Text>
      
      {nutrition.calories !== undefined && (
      <View style={[styles.nutritionRow, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.nutrientName, { 
          color: theme.colors.text,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: theme.typography.fontSize.m
        }]}>Kalorien</Text>
        <Text style={[styles.nutrientValue, { 
          color: theme.colors.primary,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: theme.typography.fontSize.m
        }]}>{calculateValue(nutrition.calories)} kcal</Text>
      </View>
      )}
      
      {nutrition.protein !== undefined && nutrition.protein > 0 && (
      <View style={[styles.nutritionRow, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.nutrientName, { 
          color: theme.colors.text,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: theme.typography.fontSize.m
        }]}>Protein</Text>
        <Text style={[styles.nutrientValue, { 
          color: theme.colors.text,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: theme.typography.fontSize.m
        }]}>{calculateValue(nutrition.protein)}g</Text>
      </View>
      )}
      
      {nutrition.carbs !== undefined && nutrition.carbs > 0 && (
      <View style={[styles.nutritionRow, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.nutrientName, { 
          color: theme.colors.text,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: theme.typography.fontSize.m
        }]}>Kohlenhydrate</Text>
        <Text style={[styles.nutrientValue, { 
          color: theme.colors.text,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: theme.typography.fontSize.m
        }]}>{calculateValue(nutrition.carbs)}g</Text>
      </View>
      )}
      
      {nutrition.fat !== undefined && nutrition.fat > 0 && (
      <View style={[styles.nutritionRow, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.nutrientName, { 
          color: theme.colors.text,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: theme.typography.fontSize.m
        }]}>Fett</Text>
        <Text style={[styles.nutrientValue, { 
          color: theme.colors.text,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: theme.typography.fontSize.m
        }]}>{calculateValue(nutrition.fat)}g</Text>
      </View>
      )}
      
      {nutrition.sugar !== undefined && nutrition.sugar > 0 && (
        <View style={[styles.nutritionRow, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.nutrientName, { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.m
          }]}>Zucker</Text>
          <Text style={[styles.nutrientValue, { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.m
          }]}>{calculateValue(nutrition.sugar)}g</Text>
        </View>
      )}
      
      {nutrition.fiber !== undefined && nutrition.fiber > 0 && (
        <View style={[styles.nutritionRow, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.nutrientName, { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.m
          }]}>Ballaststoffe</Text>
          <Text style={[styles.nutrientValue, { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.m
          }]}>{calculateValue(nutrition.fiber)}g</Text>
        </View>
      )}
      

      
      {/* Elektrolyte Überschrift */}
      {(nutrition.sodium !== undefined && nutrition.sodium > 0) || 
       (nutrition.potassium !== undefined && nutrition.potassium > 0) ? (
        <Text style={[styles.sectionTitle, { 
          color: theme.colors.text,
          fontFamily: theme.typography.fontFamily.bold, 
          fontSize: theme.typography.fontSize.m,
          marginTop: theme.spacing.m,
          marginBottom: theme.spacing.xs
        }]}>Elektrolyte</Text>
      ) : null}
      
      {/* Natrium (in Elektrolyte verschoben) */}
      {nutrition.sodium !== undefined && nutrition.sodium > 0 && (
        <View style={[styles.nutritionRow, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.nutrientName, { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.m
          }]}>Natrium</Text>
          <Text style={[styles.nutrientValue, { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.m
          }]}>{calculateValue(nutrition.sodium)}mg</Text>
        </View>
      )}
      
      {/* Kalium-Bereich */}
      {nutrition.potassium !== undefined && nutrition.potassium > 0 && (
        <View style={[styles.nutritionRow, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.nutrientName, { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.m
          }]}>Kalium</Text>
          <Text style={[styles.nutrientValue, { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.m
          }]}>{calculateValue(nutrition.potassium)}mg</Text>
        </View>
      )}
      
      {/* Vitamin-Bereich - Überschrift */}
      {(nutrition.vitaminA !== undefined && nutrition.vitaminA > 0) ||
       (nutrition.vitaminB12 !== undefined && nutrition.vitaminB12 > 0) ||
       (nutrition.vitaminC !== undefined && nutrition.vitaminC > 0) ||
       (nutrition.vitaminD !== undefined && nutrition.vitaminD > 0) ? (
        <Text style={[styles.sectionTitle, { 
          color: theme.colors.text,
          fontFamily: theme.typography.fontFamily.bold, 
          fontSize: theme.typography.fontSize.m,
          marginTop: theme.spacing.m,
          marginBottom: theme.spacing.xs
        }]}>Vitamine</Text>
      ) : null}
      
      {/* Vitamin A */}
      {nutrition.vitaminA !== undefined && nutrition.vitaminA > 0 && (
        <View style={[styles.nutritionRow, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.nutrientName, { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.m
          }]}>Vitamin A</Text>
          <Text style={[styles.nutrientValue, { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.m
          }]}>{calculateValue(nutrition.vitaminA, 'μg')}μg</Text>
        </View>
      )}
      
      {/* Vitamin B12 */}
      {nutrition.vitaminB12 !== undefined && nutrition.vitaminB12 > 0 && (
        <View style={[styles.nutritionRow, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.nutrientName, { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.m
          }]}>Vitamin B12</Text>
          <Text style={[styles.nutrientValue, { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.m
          }]}>{calculateValue(nutrition.vitaminB12, 'μg')}μg</Text>
        </View>
      )}
      
      {/* Vitamin C */}
      {nutrition.vitaminC !== undefined && nutrition.vitaminC > 0 && (
        <View style={[styles.nutritionRow, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.nutrientName, { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.m
          }]}>Vitamin C</Text>
          <Text style={[styles.nutrientValue, { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.m
          }]}>{calculateValue(nutrition.vitaminC)}mg</Text>
        </View>
      )}
      
      {/* Vitamin D */}
      {nutrition.vitaminD !== undefined && nutrition.vitaminD > 0 && (
        <View style={[styles.nutritionRow, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.nutrientName, { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.m
          }]}>Vitamin D</Text>
          <Text style={[styles.nutrientValue, { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.m
          }]}>{calculateValue(nutrition.vitaminD, 'μg')}μg</Text>
        </View>
      )}

      {/* Mineralstoff-Bereich - Überschrift */}
      {(nutrition.calcium !== undefined && nutrition.calcium > 0) ||
       (nutrition.iron !== undefined && nutrition.iron > 0) ||
       (nutrition.magnesium !== undefined && nutrition.magnesium > 0) ||
       (nutrition.zinc !== undefined && nutrition.zinc > 0) ? (
        <Text style={[styles.sectionTitle, { 
          color: theme.colors.text,
          fontFamily: theme.typography.fontFamily.bold, 
          fontSize: theme.typography.fontSize.m,
          marginTop: theme.spacing.m,
          marginBottom: theme.spacing.xs
        }]}>Mineralstoffe</Text>
      ) : null}
      
      {/* Calcium */}
      {nutrition.calcium !== undefined && nutrition.calcium > 0 && (
        <View style={[styles.nutritionRow, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.nutrientName, { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.m
          }]}>Calcium</Text>
          <Text style={[styles.nutrientValue, { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.m
          }]}>{calculateValue(nutrition.calcium)}mg</Text>
        </View>
      )}
      
      {/* Eisen */}
      {nutrition.iron !== undefined && nutrition.iron > 0 && (
        <View style={[styles.nutritionRow, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.nutrientName, { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.m
          }]}>Eisen</Text>
          <Text style={[styles.nutrientValue, { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.m
          }]}>{calculateValue(nutrition.iron)}mg</Text>
        </View>
      )}
      
      {/* Magnesium */}
      {nutrition.magnesium !== undefined && nutrition.magnesium > 0 && (
        <View style={[styles.nutritionRow, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.nutrientName, { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.m
          }]}>Magnesium</Text>
          <Text style={[styles.nutrientValue, { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.m
          }]}>{calculateValue(nutrition.magnesium)}mg</Text>
        </View>
      )}
      
      {/* Zink */}
      {nutrition.zinc !== undefined && nutrition.zinc > 0 && (
        <View style={[styles.nutritionRow, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.nutrientName, { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.m
          }]}>Zink</Text>
          <Text style={[styles.nutrientValue, { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.m
          }]}>{calculateValue(nutrition.zinc)}mg</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16, // 2 Grid-Punkte (16px)
    marginVertical: 8, // 1 Grid-Punkt (8px)
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
  },
  title: {
    // Theme-spezifische Stile werden inline hinzugefügt
  },
  sectionTitle: {
    // Theme-spezifische Stile werden inline hinzugefügt
  },
  servingInfo: {
    // Theme-spezifische Stile werden inline hinzugefügt
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8, // 1 Grid-Punkt (8px)
    borderBottomWidth: 1,
    marginBottom: 8, // 1 Grid-Punkt (8px)
  },
  nutrientName: {
    // Theme-spezifische Stile werden inline hinzugefügt
  },
  nutrientValue: {
    // Theme-spezifische Stile werden inline hinzugefügt
  },
});

export default NutritionalInfoCard;
