import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, ScrollView, ViewStyle, TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { JournalTabScreenProps } from '../types/navigation-types';
import { DailyLog, FoodEntry, MealType } from '../types';
import { getDailyLogByDate, saveDailyLog } from '../services/storage-service';
import { useTheme } from '../theme/theme-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DailyLogScreen({ navigation }: JournalTabScreenProps) {
  // Get theme from context
  const { theme } = useTheme();
  // Get safe area insets
  const insets = useSafeAreaInsets();
  
  // In Tab navigation, we use today's date by default
  const date = new Date().toISOString().split('T')[0];
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Format the date for display
  const formattedDate = new Date(date).toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  // Load daily log data
  useEffect(() => {
    const loadDailyLog = async () => {
      setIsLoading(true);
      try {
        const log = await getDailyLogByDate(date);
        if (log) {
          setDailyLog(log);
        } else {
          // If no log exists for this date, create a new empty one
          const newLog: DailyLog = {
            date,
            foodEntries: [],
            waterIntake: 0
          };
          setDailyLog(newLog);
          await saveDailyLog(newLog);
        }
      } catch (error) {
        console.error('Error loading daily log:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDailyLog();
  }, [date]);

  // Handle removing a food entry
  const handleRemoveEntry = async (entryId: string) => {
    Alert.alert(
      'Remove Food Entry',
      'Are you sure you want to remove this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (!dailyLog) return;

            const updatedEntries = dailyLog.foodEntries.filter(
              entry => entry.id !== entryId
            );

            const updatedLog = {
              ...dailyLog,
              foodEntries: updatedEntries
            };

            setDailyLog(updatedLog);
            await saveDailyLog(updatedLog);
          }
        }
      ]
    );
  };

  // Handle adding water intake
  const handleAddWater = async (amount: number) => {
    if (!dailyLog) return;

    const updatedLog = {
      ...dailyLog,
      waterIntake: dailyLog.waterIntake + amount
    };

    setDailyLog(updatedLog);
    await saveDailyLog(updatedLog);
  };

  // Calculate nutrition totals
  const calculateTotals = () => {
    if (!dailyLog || dailyLog.foodEntries.length === 0) {
      return { 
        calories: 0, 
        protein: 0, 
        carbs: 0, 
        fat: 0,
        mealTotals: {
          breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          lunch: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          dinner: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          snack: { calories: 0, protein: 0, carbs: 0, fat: 0 }
        }
      };
    }

    // Initialize totals object
    const initialTotals = { 
      calories: 0, 
      protein: 0, 
      carbs: 0, 
      fat: 0,
      mealTotals: {
        breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        lunch: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        dinner: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        snack: { calories: 0, protein: 0, carbs: 0, fat: 0 }
      }
    };

    return dailyLog.foodEntries.reduce(
      (totals, entry) => {
        const { nutrition } = entry.foodItem;
        const multiplier = entry.servingAmount;
        const mealType = entry.mealType as keyof typeof totals.mealTotals;

        // Calculate nutrition values for this entry
        const entryCalories = nutrition.calories * multiplier;
        const entryProtein = nutrition.protein * multiplier;
        const entryCarbs = nutrition.carbs * multiplier;
        const entryFat = nutrition.fat * multiplier;

        // Update meal-specific totals
        totals.mealTotals[mealType].calories += entryCalories;
        totals.mealTotals[mealType].protein += entryProtein;
        totals.mealTotals[mealType].carbs += entryCarbs;
        totals.mealTotals[mealType].fat += entryFat;

        // Update overall totals
        return {
          calories: totals.calories + entryCalories,
          protein: totals.protein + entryProtein,
          carbs: totals.carbs + entryCarbs,
          fat: totals.fat + entryFat,
          mealTotals: totals.mealTotals
        };
      },
      initialTotals
    );
  };

  // Group food entries by meal type
  const groupEntriesByMealType = () => {
    if (!dailyLog || dailyLog.foodEntries.length === 0) {
      return [];
    }

    const mealGroups: Record<string, FoodEntry[]> = {};

    // Initialize meal groups
    Object.values(MealType).forEach(mealType => {
      mealGroups[mealType] = [];
    });
    // Group entries by meal type
    dailyLog.foodEntries.forEach(entry => {
      mealGroups[entry.mealType].push(entry);
    });
    // Convert to array format for rendering
    return Object.entries(mealGroups)
      .filter(([_, entries]) => entries.length > 0) // Only include meal types with entries
      .map(([mealType, entries]) => ({
        mealType,
        entries
      }));
  };

  const totals = calculateTotals();
  const mealGroups = groupEntriesByMealType();

  // Render a food entry item
  const renderFoodEntry = ({ item }: { item: FoodEntry }) => {
    const { foodItem, servingAmount } = item;
    const { nutrition } = foodItem;

    return (
      <View style={[styles.foodEntryCard, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.medium }]}>
        <View style={styles.foodEntryHeader}>
          <Text style={[styles.foodName, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text }]}>
            {foodItem.name}
          </Text>
          <TouchableOpacity
            onPress={() => handleRemoveEntry(item.id)}
            style={[styles.removeButton, { backgroundColor: theme.colors.errorLight, borderRadius: theme.borderRadius.small }]}
          >
            <Text style={[styles.removeButtonText, { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.error }]}>
              Remove
            </Text>
          </TouchableOpacity>
        </View>

        {foodItem.brand && (
          <Text style={[styles.brandText, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
            {foodItem.brand}
          </Text>
        )}

        <View style={styles.servingContainer}>
          <Text style={[styles.servingText, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
            {servingAmount} {servingAmount > 1 ? 'servings' : 'serving'} ({nutrition.servingSize})
          </Text>
        </View>

        <View style={styles.nutritionContainer}>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.primary }]}>
              {Math.round(nutrition.calories * servingAmount)}
            </Text>
            <Text style={[styles.nutritionLabel, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
              kcal
            </Text>
          </View>

          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.accent }]}>
              {Math.round(nutrition.protein * servingAmount)}g
            </Text>
            <Text style={[styles.nutritionLabel, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
              Protein
            </Text>
          </View>

          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.warning }]}>
              {Math.round(nutrition.carbs * servingAmount)}g
            </Text>
            <Text style={[styles.nutritionLabel, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
              Carbs
            </Text>
          </View>

          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.error }]}>
              {Math.round(nutrition.fat * servingAmount)}g
            </Text>
            <Text style={[styles.nutritionLabel, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
              Fat
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.viewButton, { backgroundColor: theme.colors.primaryLight, borderRadius: theme.borderRadius.small, marginTop: 8 }]} 
          onPress={() => navigation.getParent()?.navigate('FoodDetail', { foodId: item.id })}
        >
          <Text style={[styles.viewButtonText, { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.primary }]}>
            View Details
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render a meal type group
  const renderMealGroup = ({ item }: { item: { mealType: string; entries: FoodEntry[] } }) => {
    const { mealType, entries } = item;

    return (
      <View style={styles.mealSection}>
        <Text style={[styles.mealTypeHeader, { 
          fontFamily: theme.typography.fontFamily.bold, 
          color: theme.colors.text,
          borderLeftWidth: 4,
          borderLeftColor: theme.colors.primary,
          paddingLeft: 8,
        }]}>
          {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
        </Text>
        <FlatList
          data={entries}
          renderItem={renderFoodEntry}
          keyExtractor={(entry) => entry.id}
          scrollEnabled={false}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Sticky Header */}
      <View style={[
        styles.stickyHeader, 
        { 
          paddingTop: insets.top,
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: 1,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 3,
        }
      ]}>
        <Text style={[styles.dateHeader, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text }]}>
          {formattedDate}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={{ padding: 16, paddingTop: 16 }} // 2 Grid-Punkte
      >

        {/* Daily summary */}
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.medium, marginBottom: 24 }]}>
          <Text style={[styles.summaryTitle, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text }]}>
            Tagesübersicht
          </Text>
          
          <View style={styles.summaryContent}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.primary }]}>
                {Math.round(totals.calories)}
              </Text>
              <Text style={[styles.summaryLabel, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
                Kalorien
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.accent }]}>
                {Math.round(totals.protein)}g
              </Text>
              <Text style={[styles.summaryLabel, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
                Protein
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.warning }]}>
                {Math.round(totals.carbs)}g
              </Text>
              <Text style={[styles.summaryLabel, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
                Kohlenhydrate
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.error }]}>
                {Math.round(totals.fat)}g
              </Text>
              <Text style={[styles.summaryLabel, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
                Fette
              </Text>
            </View>
          </View>
        </View>

        {/* Water tracking */}
        <View style={[styles.waterCard, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.medium }]}>
          <View style={styles.waterHeader}>
            <Text style={[styles.waterTitle, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text }]}>
              Wasser
            </Text>
            <Text style={[styles.waterValue, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.primary }]}>
              {dailyLog?.waterIntake || 0} ml
            </Text>
          </View>
          
          <View style={styles.waterButtons}>
            <TouchableOpacity 
              style={[styles.waterButton, { backgroundColor: theme.colors.primaryLight, borderRadius: theme.borderRadius.small }]} 
              onPress={() => handleAddWater(100)}
            >
              <Text style={[styles.waterButtonText, { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.primary }]}>
                +100ml
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.waterButton, { backgroundColor: theme.colors.primaryLight, borderRadius: theme.borderRadius.small }]} 
              onPress={() => handleAddWater(250)}
            >
              <Text style={[styles.waterButtonText, { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.primary }]}>
                +250ml
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.waterButton, { backgroundColor: theme.colors.primaryLight, borderRadius: theme.borderRadius.small }]} 
              onPress={() => handleAddWater(500)}
            >
              <Text style={[styles.waterButtonText, { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.primary }]}>
                +500ml
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mahlzeiten-Kategorien */}
        <Text style={[styles.sectionTitle, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text, marginTop: 16, marginBottom: 16 }]}>
          Mahlzeiten
        </Text>
        
        {/* Fru00fchstu00fcck */}
        <TouchableOpacity 
          style={[styles.mealCategoryCard, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.medium }]}
          onPress={() => navigation.getParent()?.navigate('BarcodeScanner', { mealType: 'breakfast' })}
        >
          <View style={styles.mealCategoryContent}>
            <View>
              <Text style={[styles.mealCategoryTitle, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text }]}>
                🥞 Frühstück
              </Text>
              {dailyLog && dailyLog.foodEntries.filter(entry => entry.mealType === 'breakfast').length > 0 ? (
                <Text style={[styles.mealCategorySubtitle, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
                  {dailyLog.foodEntries.filter(entry => entry.mealType === 'breakfast').length} Einträge
                </Text>
              ) : (
                <Text style={[styles.mealCategorySubtitle, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
                  Noch keine Einträge
                </Text>
              )}
            </View>
            <Text style={[styles.mealCategoryCalories, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.primary }]}>
              {Math.round(totals.mealTotals.breakfast?.calories || 0)} kcal
            </Text>
          </View>
        </TouchableOpacity>
        
        {/* Mittagessen */}
        <TouchableOpacity 
          style={[styles.mealCategoryCard, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.medium }]}
          onPress={() => navigation.getParent()?.navigate('BarcodeScanner', { mealType: 'lunch' })}
        >
          <View style={styles.mealCategoryContent}>
            <View>
              <Text style={[styles.mealCategoryTitle, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text }]}>
                🍲 Mittagessen
              </Text>
              {dailyLog && dailyLog.foodEntries.filter(entry => entry.mealType === 'lunch').length > 0 ? (
                <Text style={[styles.mealCategorySubtitle, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
                  {dailyLog.foodEntries.filter(entry => entry.mealType === 'lunch').length} Einträge
                </Text>
              ) : (
                <Text style={[styles.mealCategorySubtitle, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
                  Noch keine Einträge
                </Text>
              )}
            </View>
            <Text style={[styles.mealCategoryCalories, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.primary }]}>
              {Math.round(totals.mealTotals.lunch?.calories || 0)} kcal
            </Text>
          </View>
        </TouchableOpacity>
        
        {/* Abendessen */}
        <TouchableOpacity 
          style={[styles.mealCategoryCard, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.medium }]}
          onPress={() => navigation.getParent()?.navigate('BarcodeScanner', { mealType: 'dinner' })}
        >
          <View style={styles.mealCategoryContent}>
            <View>
              <Text style={[styles.mealCategoryTitle, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text }]}>
                🍽️ Abendessen
              </Text>
              {dailyLog && dailyLog.foodEntries.filter(entry => entry.mealType === 'dinner').length > 0 ? (
                <Text style={[styles.mealCategorySubtitle, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
                  {dailyLog.foodEntries.filter(entry => entry.mealType === 'dinner').length} Einträge
                </Text>
              ) : (
                <Text style={[styles.mealCategorySubtitle, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
                  Noch keine Einträge
                </Text>
              )}
            </View>
            <Text style={[styles.mealCategoryCalories, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.primary }]}>
              {Math.round(totals.mealTotals.dinner?.calories || 0)} kcal
            </Text>
          </View>
        </TouchableOpacity>
        
        {/* Snacks */}
        <TouchableOpacity 
          style={[styles.mealCategoryCard, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.medium }]}
          onPress={() => navigation.getParent()?.navigate('BarcodeScanner', { mealType: 'snack' })}
        >
          <View style={styles.mealCategoryContent}>
            <View>
              <Text style={[styles.mealCategoryTitle, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text }]}>
                🍪 Snacks
              </Text>
              {dailyLog && dailyLog.foodEntries.filter(entry => entry.mealType === 'snack').length > 0 ? (
                <Text style={[styles.mealCategorySubtitle, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
                  {dailyLog.foodEntries.filter(entry => entry.mealType === 'snack').length} Einträge
                </Text>
              ) : (
                <Text style={[styles.mealCategorySubtitle, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
                  Noch keine Einträge
                </Text>
              )}
            </View>
            <Text style={[styles.mealCategoryCalories, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.primary }]}>
              {Math.round(totals.mealTotals.snack?.calories || 0)} kcal
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

interface Styles {
  container: ViewStyle;
  stickyHeader: ViewStyle;
  scrollContent: ViewStyle;
  dateHeader: TextStyle;
  summaryCard: ViewStyle;
  summaryTitle: TextStyle;
  summaryContent: ViewStyle;
  summaryItem: ViewStyle;
  summaryValue: TextStyle;
  summaryLabel: TextStyle;
  waterCard: ViewStyle;
  waterHeader: ViewStyle;
  waterTitle: TextStyle;
  waterValue: TextStyle;
  waterButtons: ViewStyle;
  waterButton: ViewStyle;
  waterButtonText: TextStyle;
  sectionTitle: TextStyle;
  mealCategoryCard: ViewStyle;
  mealCategoryContent: ViewStyle;
  mealCategoryTitle: TextStyle;
  mealCategorySubtitle: TextStyle;
  mealCategoryCalories: TextStyle;
  addFoodButton: ViewStyle;
  addFoodButtonText: TextStyle;
  mealList: ViewStyle;
  mealSection: ViewStyle;
  mealTypeHeader: TextStyle;
  foodEntryCard: ViewStyle;
  foodEntryHeader: ViewStyle;
  foodName: TextStyle;
  brandText: TextStyle;
  servingContainer: ViewStyle;
  servingText: TextStyle;
  nutritionContainer: ViewStyle;
  nutritionItem: ViewStyle;
  nutritionValue: TextStyle;
  nutritionLabel: TextStyle;
  removeButton: ViewStyle;
  removeButtonText: TextStyle;
  viewButton: ViewStyle;
  viewButtonText: TextStyle;
  messageText: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
  },
  stickyHeader: {
    width: '100%',
    paddingHorizontal: 16, // 2 Grid-Punkte (16px)
    paddingBottom: 8, // 1 Grid-Punkt (8px)
    zIndex: 10,
  },
  scrollContent: {
    flex: 1,
  },
  dateHeader: {
    fontSize: 20, // Anpassung an die anderen Screens (wie headerText)
    textAlign: 'center',
    marginVertical: 8, // 1 Grid-Punkt (8px)
  },
  summaryCard: {
    padding: 16, // 2 Grid-Punkte (16px)
    marginBottom: 16, // 2 Grid-Punkte (16px)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    minWidth: 70,
  },
  summaryValue: {
    fontSize: 18,
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  waterCard: {
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  waterTitle: {
    fontSize: 16,
  },
  waterValue: {
    fontSize: 18,
  },
  waterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  waterButton: {
    padding: 12,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  waterButtonText: {
    fontSize: 14,
  },
  addFoodButton: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  addFoodButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  mealCategoryCard: {
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  mealSection: {
    marginBottom: 16,
  },
  mealCategoryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealCategoryTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  mealCategorySubtitle: {
    fontSize: 14,
  },
  mealCategoryCalories: {
    fontSize: 20,
  },
  mealList: {
    marginTop: 16,
  },
  mealTypeHeader: {
    fontSize: 18,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  foodEntryCard: {
    padding: 16,
    marginVertical: 8,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  foodEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  foodName: {
    fontSize: 16,
    flex: 1,
  },
  brandText: {
    fontSize: 14,
    marginBottom: 8,
  },
  servingContainer: {
    marginBottom: 12,
  },
  servingText: {
    fontSize: 14,
  },
  nutritionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginBottom: 8,
  },
  nutritionItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  nutritionValue: {
    fontSize: 16,
  },
  nutritionLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  removeButtonText: {
    fontSize: 12,
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: 14,
  },
  messageText: {
    textAlign: 'center',
    fontSize: 16,
    padding: 16,
  },
});
