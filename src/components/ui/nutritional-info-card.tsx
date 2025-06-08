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
  const calculateValue = (value: number) => {
    return Math.round(value * servingMultiplier * 10) / 10;
  };

  return (
    <View style={[styles.card, { 
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.medium,
      shadowColor: theme.colors.shadow,
      borderColor: theme.colors.border,
    }]}>
      <Text style={[styles.title, { 
        color: theme.colors.text,
        fontFamily: theme.typography.fontFamily.bold, 
        fontSize: theme.typography.fontSize.l,
        marginBottom: theme.spacing.m
      }]}>Nährwertangaben</Text>
      
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
