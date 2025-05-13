import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NutritionInfo } from '../../types';

interface NutritionalInfoCardProps {
  nutrition: NutritionInfo;
  servingMultiplier?: number;
}

function NutritionalInfoCard({ nutrition, servingMultiplier = 1 }: NutritionalInfoCardProps) {
  // Calculate nutrition values based on serving multiplier
  const calculateValue = (value: number) => {
    return Math.round(value * servingMultiplier * 10) / 10;
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Nutritional Information</Text>
      <Text style={styles.servingInfo}>
        {servingMultiplier > 1 ? `${servingMultiplier} x ` : ''}
        {nutrition.servingSize} ({nutrition.servingSizeGrams * servingMultiplier}g)
      </Text>
      
      <View style={styles.nutritionRow}>
        <Text style={styles.nutrientName}>Calories</Text>
        <Text style={styles.nutrientValue}>{calculateValue(nutrition.calories)} kcal</Text>
      </View>
      
      <View style={styles.nutritionRow}>
        <Text style={styles.nutrientName}>Protein</Text>
        <Text style={styles.nutrientValue}>{calculateValue(nutrition.protein)}g</Text>
      </View>
      
      <View style={styles.nutritionRow}>
        <Text style={styles.nutrientName}>Carbs</Text>
        <Text style={styles.nutrientValue}>{calculateValue(nutrition.carbs)}g</Text>
      </View>
      
      <View style={styles.nutritionRow}>
        <Text style={styles.nutrientName}>Fat</Text>
        <Text style={styles.nutrientValue}>{calculateValue(nutrition.fat)}g</Text>
      </View>
      
      {nutrition.sugar !== undefined && (
        <View style={styles.nutritionRow}>
          <Text style={styles.nutrientName}>Sugar</Text>
          <Text style={styles.nutrientValue}>{calculateValue(nutrition.sugar)}g</Text>
        </View>
      )}
      
      {nutrition.fiber !== undefined && (
        <View style={styles.nutritionRow}>
          <Text style={styles.nutrientName}>Fiber</Text>
          <Text style={styles.nutrientValue}>{calculateValue(nutrition.fiber)}g</Text>
        </View>
      )}
      
      {nutrition.sodium !== undefined && (
        <View style={styles.nutritionRow}>
          <Text style={styles.nutrientName}>Sodium</Text>
          <Text style={styles.nutrientValue}>{calculateValue(nutrition.sodium)}mg</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  servingInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  nutrientName: {
    fontSize: 16,
  },
  nutrientValue: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default NutritionalInfoCard;
