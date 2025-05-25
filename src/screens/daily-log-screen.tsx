import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, FlatList, TouchableOpacity, Alert, ScrollView, Modal } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CircleChevronUp, CircleChevronDown, ChevronsLeft, ChevronsRight, X, Trash2, Info, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { JournalTabScreenProps } from '../types/navigation-types';
import { DailyLog, FoodEntry, MealType } from '../types';
import { getDailyLogByDate, saveDailyLog } from '../services/storage-service';
import { useTheme } from '../theme/theme-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { formatToLocalISODate, formatDateForDisplay, getTodayFormatted } from '../utils/date-utils';
import { useDateContext } from '../context/date-context';
import { createDailyLogStyles } from '../styles/screens/daily-log-styles';

export default function DailyLogScreen({ navigation }: JournalTabScreenProps) {
  // Get theme from context
  const { theme } = useTheme();
  // Get safe area insets
  const insets = useSafeAreaInsets();
  
  // Styles mit aktuellem Theme initialisieren
  const styles = createDailyLogStyles(theme);
  
  // Verwende den gemeinsamen DateContext statt lokalem State
  const { selectedDate, setSelectedDate } = useDateContext();
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  
  // State for tracking expanded meal sections
  const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>({});

  // Format the date for display using our utility function
  const formattedDate = formatDateForDisplay(selectedDate);

  // Toggle expand/collapse state for meal sections
  const toggleMealAccordion = (mealType: string) => {
    setExpandedMeals(prev => ({
      ...prev,
      [mealType]: !prev[mealType]
    }));
  };
  // Function to load daily log data
  const loadDailyLog = useCallback(async () => {
    console.log('Loading daily log data...');
    setIsLoading(true);
    try {
      // Log details for debugging purposes
      console.log(`Loading daily log for date: ${selectedDate}`);
      
      // Get the current date object for timezone reference
      const now = new Date();
      console.log(`Current time in ISO format: ${now.toISOString()}`);
      console.log(`Local timezone offset: ${now.getTimezoneOffset()} minutes`);

      const log = await getDailyLogByDate(selectedDate);
      
      if (log) {
        console.log(`Loaded daily log with ${log.foodEntries.length} food entries`);
        setDailyLog(log);
      } else {
        // If no log exists for this date, create a new empty one
        console.log('No daily log found, creating a new one');
        const newLog: DailyLog = {
          date: selectedDate,
          foodEntries: [],
          waterIntake: 0,
          dailyNotes: ''
        };
        setDailyLog(newLog);
        await saveDailyLog(newLog);
      }
    } catch (error) {
      console.error('Error loading daily log:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]); // Füge selectedDate als Abhängigkeit hinzu, damit die Funktion bei Datumsänderungen neu erstellt wird

  // Use useFocusEffect to reload data when the screen comes into focus or when date changes
  useFocusEffect(
    useCallback(() => {
      loadDailyLog();
      return () => {};
    }, [loadDailyLog, selectedDate])
  );

  // Also load on initial mount
  useEffect(() => {
    loadDailyLog();
  }, [loadDailyLog]);

  // Handle removing a food entry
  const handleRemoveEntry = async (entryId: string) => {
    Alert.alert(
      'Eintrag entfernen',
      'Möchtest du diesen Eintrag wirklich entfernen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Entfernen',
          style: 'destructive',
          onPress: async () => {
            if (!dailyLog) return;
            
            try {
              // First update local state for immediate UI feedback
              const updatedEntries = dailyLog.foodEntries.filter(
                entry => entry.id !== entryId
              );

              const updatedLog = {
                ...dailyLog,
                foodEntries: updatedEntries
              };

              // Set the updated log in state
              setDailyLog(updatedLog);
              
              // Save to database
              console.log(`Removing food entry: ${entryId}`);
              await saveDailyLog(updatedLog);
              
              // Reload data from database to ensure UI is up-to-date
              console.log('Reloading daily log after removing entry');
              await loadDailyLog();
            } catch (error) {
              console.error('Error removing food entry:', error);
              Alert.alert('Fehler', 'Der Eintrag konnte nicht entfernt werden.');
            }
          }
        }
      ]
    );
  };

  // Handle adding water intake with debouncing
  const handleAddWater = async (amount: number) => {
    if (!dailyLog) return;
    
    try {
      // First update local state for immediate UI feedback
      const updatedLog = {
        ...dailyLog,
        waterIntake: Math.max(0, dailyLog.waterIntake + amount) // Ensure we don't go below 0
      };

      // Set the updated log in state
      setDailyLog(updatedLog);
      
      // Save to database
      console.log(`Updating water intake by ${amount}ml, new total: ${updatedLog.waterIntake}ml`);
      await saveDailyLog(updatedLog);
      
      // Reload data from database to ensure UI is up-to-date
      console.log('Reloading daily log after updating water intake');
      await loadDailyLog();
    } catch (error) {
      console.error('Error updating water intake:', error);
      Alert.alert('Fehler', 'Die Wassermenge konnte nicht aktualisiert werden.');
    }
  };

  // Funktion zum Öffnen der Food-Details eines Eintrags
  const handleOpenFoodDetails = (entry: FoodEntry) => {
    navigation.getParent()?.navigate('FoodDetail', {
      foodItem: entry.foodItem,
      mealType: entry.mealType,
      // Bearbeitung eines existierenden Eintrags
      existingEntryId: entry.id,
      servingAmount: entry.servingAmount
    });
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
        const entryCalories = nutrition.calories * (multiplier / 100);
        const entryProtein = nutrition.protein * (multiplier / 100);
        const entryCarbs = nutrition.carbs * (multiplier / 100);
        const entryFat = nutrition.fat * (multiplier / 100);

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
      <View style={styles.foodEntryCard}>
        <View style={styles.foodEntryHeader}>
          <Text style={styles.foodName}>
            {foodItem.name}
          </Text>
          <TouchableOpacity
            onPress={() => handleRemoveEntry(item.id)}
            style={styles.removeButton}
          >
            <Text style={styles.removeButtonText}>
              Entfernen
            </Text>
          </TouchableOpacity>
        </View>

        {foodItem.brand && (
          <Text style={styles.brandText}>
            {foodItem.brand}
          </Text>
        )}

        <View style={styles.servingContainer}>
          <Text style={styles.servingText}>
            {servingAmount} {servingAmount > 1 ? 'Portionen' : 'Portion'} ({nutrition.servingSize})
          </Text>
        </View>

        <View style={styles.nutritionContainer}>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: theme.colors.primary }]}>
              {Math.round(nutrition.calories * servingAmount)}
            </Text>
            <Text style={styles.nutritionLabel}>
              kcal
            </Text>
          </View>

          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: theme.colors.accent }]}>
              {Math.round(nutrition.protein * servingAmount)}g
            </Text>
            <Text style={styles.nutritionLabel}>
              Eiweiß
            </Text>
          </View>

          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: theme.colors.warning }]}>
              {Math.round(nutrition.carbs * servingAmount)}g
            </Text>
            <Text style={styles.nutritionLabel}>
              Kohlenhydrate
            </Text>
          </View>

          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: theme.colors.error }]}>
              {Math.round(nutrition.fat * servingAmount)}g
            </Text>
            <Text style={styles.nutritionLabel}>
              Fett
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.viewButton} 
          onPress={() => navigation.getParent()?.navigate('FoodDetail', { foodId: item.id })}
        >
          <Text style={styles.viewButtonText}>
            Details anzeigen
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Function to toggle meal expansion
  const toggleMeal = (mealType: string) => {
    setExpandedMeals(prev => ({
      ...prev,
      [mealType]: !prev[mealType]
    }));
  };
  
  // Function to add food to a specific meal type
  const handleAddFood = (mealType: string) => {
    // Navigate to the Add Food screen with the specific meal type
    navigation.getParent()?.navigate('Add', { screen: 'Scanner', params: { mealType } });
  };

  // Render a meal type group
  const renderMealGroup = ({ item }: { item: { mealType: string; entries: FoodEntry[] } }) => {
    const { mealType, entries } = item;
    const isExpanded = expandedMeals[mealType] || false;
    const mealCalories = totals.mealTotals[mealType as keyof typeof totals.mealTotals].calories;
    const entryCount = entries.length;

    return (
      <View style={styles.mealSection}>
        <View style={[styles.mealHeader, { marginBottom: isExpanded ? theme.spacing.xs : theme.spacing.m }]}>
          {/* Hauptbereich der Mahlzeit - klickbar um zum Scanner zu gehen */}
          <TouchableOpacity 
            onPress={() => navigation.getParent()?.navigate('Add', { screen: 'Scanner', params: { mealType } })}
            style={{ flex: 1 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.mealHeaderText}>
                {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              </Text>
              <Text style={styles.mealCountText}>
                ({entryCount} {entryCount === 1 ? 'Eintrag' : 'Einträge'})
              </Text>
            </View>
          </TouchableOpacity>

          {/* Rechte Seite: Kalorien + Accordion Icon */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.mealCaloriesText}>
              {Math.round(mealCalories)} kcal
            </Text>

            {/* EINFACHES ICON zum Auf-/Zuklappen */}
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                toggleMeal(mealType);
              }}
              style={styles.accordionButton}
              accessibilityLabel={"Mahlzeit " + mealType + (isExpanded ? " einklappen" : " ausklappen")}
            >
              {isExpanded ? (
                <CircleChevronUp size={24} color={theme.colors.primary} strokeWidth={1.5} />
              ) : (
                <CircleChevronDown size={24} color={theme.colors.primary} strokeWidth={1.5} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Expandierbarer Bereich */}
        {isExpanded && (
          <View style={{
            marginBottom: 16,
            marginLeft: 4,
            marginRight: 4,
          }}>
            {entries.length > 0 ? (
              <FlatList
                data={entries}
                renderItem={renderFoodEntry}
                keyExtractor={(entry) => entry.id}
                scrollEnabled={false}
              />
            ) : (
              <Text style={{
                textAlign: 'center',
                color: theme.colors.textLight,
                padding: 16,
              }}>
                Keine Einträge vorhanden
              </Text>
            )}
          </View>
        )}
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
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
          <TouchableOpacity
            onPress={() => {
              const prevDate = new Date(selectedDate);
              prevDate.setDate(prevDate.getDate() - 1);
              setSelectedDate(formatToLocalISODate(prevDate));
            }}
          >
            <ChevronLeft size={24} color={theme.colors.primary} strokeWidth={1.5} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setShowCalendarModal(true)}>
            <Text style={[
              styles.dateHeader, 
              { 
                fontFamily: theme.typography.fontFamily.bold,
                color: selectedDate === getTodayFormatted() ? theme.colors.primary : theme.colors.text
              }
            ]}>
              {new Date(selectedDate).toLocaleDateString('de-DE', { 
                weekday: 'long', 
                day: 'numeric',
                month: 'long', 
                year: 'numeric'
              })}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => {
              const nextDate = new Date(selectedDate);
              nextDate.setDate(nextDate.getDate() + 1);
              setSelectedDate(formatToLocalISODate(nextDate));
            }}
          >
            <ChevronRight size={24} color={theme.colors.primary} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Calendar Modal */}
      <Modal
        visible={showCalendarModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20
          }}
          activeOpacity={1}
          onPress={() => setShowCalendarModal(false)}
        >
          <View 
            style={{
              width: '100%',
              backgroundColor: theme.colors.card,
              borderRadius: 16,
              padding: 16,
              shadowColor: theme.colors.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ 
                fontFamily: theme.typography.fontFamily.bold,
                fontSize: 18,
                color: theme.colors.text
              }}>
                Datum auswählen
              </Text>
              <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
                <X strokeWidth={1.5} size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <Calendar
              onDayPress={(day) => {
                setSelectedDate(day.dateString);
                setShowCalendarModal(false);
              }}
              markedDates={{
                [selectedDate]: { selected: true, selectedColor: theme.colors.primary }
              }}
              theme={{
                calendarBackground: theme.colors.card,
                textSectionTitleColor: theme.colors.text,
                selectedDayBackgroundColor: theme.colors.primary,
                selectedDayTextColor: '#ffffff',
                todayTextColor: theme.colors.primary,
                dayTextColor: theme.colors.text,
                textDisabledColor: theme.colors.border,
                monthTextColor: theme.colors.text,
                arrowColor: theme.colors.primary,
                textDayFontFamily: theme.typography.fontFamily.regular,
                textMonthFontFamily: theme.typography.fontFamily.medium,
                textDayHeaderFontFamily: theme.typography.fontFamily.medium
              }}
            />
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: theme.colors.border,
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  flex: 1,
                  marginRight: 10,
                  alignItems: 'center'
                }}
                onPress={() => {
                  setSelectedDate(getTodayFormatted());
                  setShowCalendarModal(false);
                }}
              >
                <Text style={{ 
                  fontFamily: theme.typography.fontFamily.medium,
                  color: theme.colors.text
                }}>
                  Heute
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  backgroundColor: theme.colors.primary,
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  flex: 1,
                  alignItems: 'center'
                }}
                onPress={() => setShowCalendarModal(false)}
              >
                <Text style={{ 
                  fontFamily: theme.typography.fontFamily.medium,
                  color: '#ffffff'
                }}>
                  Schließen
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

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
              <Text style={[styles.summaryValue, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.nutrition.calories }]}>
                {Math.round(totals.calories)}
              </Text>
              <Text style={[styles.summaryLabel, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
                Kalorien
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.nutrition.protein }]}>
                {Math.round(totals.protein)}g
              </Text>
              <Text style={[styles.summaryLabel, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
                Protein
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.nutrition.carbs }]}>
                {Math.round(totals.carbs)}g
              </Text>
              <Text style={[styles.summaryLabel, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
                Kohlenhydrate
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.nutrition.fat }]}>
                {Math.round(totals.fat)}g
              </Text>
              <Text style={[styles.summaryLabel, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
                Fette
              </Text>
            </View>
          </View>
        </View>

        {/* Mahlzeiten-Kategorien */}
        <Text style={[styles.sectionTitle, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text, marginTop: 16, marginBottom: 16 }]}>
          Mahlzeiten
        </Text>
        
        {/* Frühstück */}
        <View style={{ marginBottom: expandedMeals['breakfast'] ? 0 : 12 }}>
          {/* Header-Bereich - klickbar für Scanner */}
          <TouchableOpacity 
            style={[styles.mealCategoryCard, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.medium, 
              borderBottomLeftRadius: expandedMeals['breakfast'] ? 0 : theme.borderRadius.medium,
              borderBottomRightRadius: expandedMeals['breakfast'] ? 0 : theme.borderRadius.medium,
              marginBottom: expandedMeals['breakfast'] ? 0 : undefined,
            }]}
          >
            <View style={styles.mealCategoryContent}>
              {/* Linke Seite - Mahlzeiteninfo */}
              <TouchableOpacity 
                style={{ flex: 1 }}
                onPress={() => navigation.getParent()?.navigate('BarcodeScanner', { mealType: 'breakfast' })}
              >
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
              </TouchableOpacity>
              
              {/* Rechte Seite - Kalorien + Akkordeon-Button */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.mealCategoryCalories, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.primary, marginRight: 8 }]}>
                  {Math.round(totals.mealTotals.breakfast?.calories || 0)} kcal
                </Text>
                {/* Akkordeon-Button - öffnet/schließt die Liste der Einträge */}
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleMealAccordion('breakfast');
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {expandedMeals['breakfast'] ? (
                    <CircleChevronUp size={24} color={theme.colors.primary} strokeWidth={1.5} />
                  ) : (
                    <CircleChevronDown size={24} color={theme.colors.primary} strokeWidth={1.5} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
          
          {/* Ausklappbarer Bereich für die Einträge */}
          {expandedMeals['breakfast'] && (
            <View style={{
              backgroundColor: theme.colors.card,
              borderBottomLeftRadius: theme.borderRadius.medium,
              borderBottomRightRadius: theme.borderRadius.medium,
              borderTopWidth: 1,     // Subtile Trennlinie
              borderTopColor: theme.colors.border + '40', // Transparentes Grau
              paddingHorizontal: 16, // 2 Grid Punkte (8px * 2)
              paddingTop: 8,        // 1 Grid Punkt (8px)
              paddingBottom: 0,     // Kein zusätzlicher Abstand unten
              marginBottom: 12,      // Abstand zum nächsten Element
            }}>
              {dailyLog && dailyLog.foodEntries.filter(entry => entry.mealType === 'breakfast').length > 0 ? (
                dailyLog.foodEntries.filter(entry => entry.mealType === 'breakfast').map((entry, index, array) => (
                  <View key={entry.id} style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 8, // 1 Grid Punkt (8px)
                    // Nur Trennlinie anzeigen, wenn es nicht das letzte Element ist
                    ...index < array.length - 1 ? {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border + '40',
                    } : {
                      marginBottom: 8, // 1 Grid Punkt Abstand zum Container-Ende
                    }
                  }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text }}>
                        {entry.foodItem.name}
                      </Text>
                      <Text style={{ fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight, fontSize: 12 }}>
                        {entry.servingAmount}g
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontFamily: theme.typography.fontFamily.medium, color: theme.colors.primary, marginRight: 8 }}>
                        {Math.round(entry.foodItem.nutrition.calories * (entry.servingAmount / 100))} kcal
                      </Text>
                      {/* Details-Button */}
                      <TouchableOpacity
                        onPress={() => handleOpenFoodDetails(entry)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={{ marginRight: 8 }}
                      >
                        <Info strokeWidth={1.5} size={20} color={theme.colors.accent} />
                      </TouchableOpacity>
                      {/* Löschen-Button */}
                      <TouchableOpacity
                        onPress={() => handleRemoveEntry(entry.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Trash2 strokeWidth={1.5} size={20} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={{ 
                  fontFamily: theme.typography.fontFamily.regular, 
                  color: theme.colors.textLight, 
                  textAlign: 'center', 
                  paddingVertical: 16, // 2 Grid Punkte (8px * 2)
                }}>
                  Keine Einträge vorhanden
                </Text>
              )}
            </View>
          )}
        </View>
        
        {/* Mittagessen */}
        <View style={{ marginBottom: expandedMeals['lunch'] ? 0 : 12 }}>
          {/* Header-Bereich - klickbar für Scanner */}
          <TouchableOpacity 
            style={[styles.mealCategoryCard, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.medium, 
              borderBottomLeftRadius: expandedMeals['lunch'] ? 0 : theme.borderRadius.medium,
              borderBottomRightRadius: expandedMeals['lunch'] ? 0 : theme.borderRadius.medium,
              marginBottom: expandedMeals['lunch'] ? 0 : undefined,
            }]}
          >
            <View style={styles.mealCategoryContent}>
              {/* Linke Seite - Mahlzeiteninfo */}
              <TouchableOpacity 
                style={{ flex: 1 }}
                onPress={() => navigation.getParent()?.navigate('BarcodeScanner', { mealType: 'lunch' })}
              >
                <View>
                  <Text style={[styles.mealCategoryTitle, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text }]}>
                    🌮 Mittagessen
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
              </TouchableOpacity>
              
              {/* Rechte Seite - Kalorien + Akkordeon-Button */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.mealCategoryCalories, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.primary, marginRight: 8 }]}>
                  {Math.round(totals.mealTotals.lunch?.calories || 0)} kcal
                </Text>
                {/* Akkordeon-Button - öffnet/schließt die Liste der Einträge */}
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleMealAccordion('lunch');
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {expandedMeals['lunch'] ? (
                    <CircleChevronUp size={24} color={theme.colors.primary} strokeWidth={1.5} />
                  ) : (
                    <CircleChevronDown size={24} color={theme.colors.primary} strokeWidth={1.5} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
          
          {/* Ausklappbarer Bereich für die Einträge */}
          {expandedMeals['lunch'] && (
            <View style={{
              backgroundColor: theme.colors.card,
              borderBottomLeftRadius: theme.borderRadius.medium,
              borderBottomRightRadius: theme.borderRadius.medium,
              borderTopWidth: 1,     // Subtile Trennlinie
              borderTopColor: theme.colors.border + '40', // Transparentes Grau
              paddingHorizontal: 16, // 2 Grid Punkte (8px * 2)
              paddingTop: 8,        // 1 Grid Punkt (8px)
              paddingBottom: 0,     // Kein zusätzlicher Abstand unten
              marginBottom: 12,      // Abstand zum nächsten Element
            }}>
              {dailyLog && dailyLog.foodEntries.filter(entry => entry.mealType === 'lunch').length > 0 ? (
                dailyLog.foodEntries.filter(entry => entry.mealType === 'lunch').map((entry, index, array) => (
                  <View key={entry.id} style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 8, // 1 Grid Punkt (8px)
                    // Nur Trennlinie anzeigen, wenn es nicht das letzte Element ist
                    ...index < array.length - 1 ? {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border + '40',
                    } : {
                      marginBottom: 8, // 1 Grid Punkt Abstand zum Container-Ende
                    }
                  }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text }}>
                        {entry.foodItem.name}
                      </Text>
                      <Text style={{ fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight, fontSize: 12 }}>
                        {entry.servingAmount}g
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontFamily: theme.typography.fontFamily.medium, color: theme.colors.primary, marginRight: 8 }}>
                        {Math.round(entry.foodItem.nutrition.calories * (entry.servingAmount / 100))} kcal
                      </Text>
                      {/* Details-Button */}
                      <TouchableOpacity
                        onPress={() => handleOpenFoodDetails(entry)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={{ marginRight: 8 }}
                      >
                        <Info strokeWidth={1.5} size={20} color={theme.colors.accent} />
                      </TouchableOpacity>
                      {/* Löschen-Button */}
                      <TouchableOpacity
                        onPress={() => handleRemoveEntry(entry.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Trash2 strokeWidth={1.5} size={20} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={{ 
                  fontFamily: theme.typography.fontFamily.regular, 
                  color: theme.colors.textLight, 
                  textAlign: 'center', 
                  paddingVertical: 16, // 2 Grid Punkte (8px * 2)
                }}>
                  Keine Einträge vorhanden
                </Text>
              )}
            </View>
          )}
        </View>
        
        {/* Abendessen */}
        <View style={{ marginBottom: expandedMeals['dinner'] ? 0 : 12 }}>
          {/* Header-Bereich - klickbar für Scanner */}
          <TouchableOpacity 
            style={[styles.mealCategoryCard, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.medium, 
              borderBottomLeftRadius: expandedMeals['dinner'] ? 0 : theme.borderRadius.medium,
              borderBottomRightRadius: expandedMeals['dinner'] ? 0 : theme.borderRadius.medium,
              marginBottom: expandedMeals['dinner'] ? 0 : undefined,
            }]}
          >
            <View style={styles.mealCategoryContent}>
              {/* Linke Seite - Mahlzeiteninfo */}
              <TouchableOpacity 
                style={{ flex: 1 }}
                onPress={() => navigation.getParent()?.navigate('BarcodeScanner', { mealType: 'dinner' })}
              >
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
              </TouchableOpacity>
              
              {/* Rechte Seite - Kalorien + Akkordeon-Button */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.mealCategoryCalories, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.primary, marginRight: 8 }]}>
                  {Math.round(totals.mealTotals.dinner?.calories || 0)} kcal
                </Text>
                {/* Akkordeon-Button - öffnet/schließt die Liste der Einträge */}
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleMealAccordion('dinner');
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {expandedMeals['dinner'] ? (
                    <CircleChevronUp size={24} color={theme.colors.primary} strokeWidth={1.5} />
                  ) : (
                    <CircleChevronDown size={24} color={theme.colors.primary} strokeWidth={1.5} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
          
          {/* Ausklappbarer Bereich für die Einträge */}
          {expandedMeals['dinner'] && (
            <View style={{
              backgroundColor: theme.colors.card,
              borderBottomLeftRadius: theme.borderRadius.medium,
              borderBottomRightRadius: theme.borderRadius.medium,
              borderTopWidth: 1,     // Subtile Trennlinie
              borderTopColor: theme.colors.border + '40', // Transparentes Grau
              paddingHorizontal: 16, // 2 Grid Punkte (8px * 2)
              paddingTop: 8,        // 1 Grid Punkt (8px)
              paddingBottom: 0,     // Kein zusätzlicher Abstand unten
              marginBottom: 12,      // Abstand zum nächsten Element
            }}>
              {dailyLog && dailyLog.foodEntries.filter(entry => entry.mealType === 'dinner').length > 0 ? (
                dailyLog.foodEntries.filter(entry => entry.mealType === 'dinner').map((entry, index, array) => (
                  <View key={entry.id} style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 8, // 1 Grid Punkt (8px)
                    // Nur Trennlinie anzeigen, wenn es nicht das letzte Element ist
                    ...index < array.length - 1 ? {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border + '40',
                    } : {
                      marginBottom: 8, // 1 Grid Punkt Abstand zum Container-Ende
                    }
                  }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text }}>
                        {entry.foodItem.name}
                      </Text>
                      <Text style={{ fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight, fontSize: 12 }}>
                        {entry.servingAmount}g
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontFamily: theme.typography.fontFamily.medium, color: theme.colors.primary, marginRight: 8 }}>
                        {Math.round(entry.foodItem.nutrition.calories * (entry.servingAmount / 100))} kcal
                      </Text>
                      {/* Details-Button */}
                      <TouchableOpacity
                        onPress={() => handleOpenFoodDetails(entry)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={{ marginRight: 8 }}
                      >
                        <Info strokeWidth={1.5} size={20} color={theme.colors.accent} />
                      </TouchableOpacity>
                      {/* Löschen-Button */}
                      <TouchableOpacity
                        onPress={() => handleRemoveEntry(entry.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Trash2 strokeWidth={1.5} size={20} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={{ 
                  fontFamily: theme.typography.fontFamily.regular, 
                  color: theme.colors.textLight, 
                  textAlign: 'center', 
                  paddingVertical: 16, // 2 Grid Punkte (8px * 2)
                }}>
                  Keine Einträge vorhanden
                </Text>
              )}
            </View>
          )}
        </View>
        
        {/* Snacks */}
        <View style={{ marginBottom: expandedMeals['snack'] ? 0 : 12 }}>
          {/* Header-Bereich - klickbar für Scanner */}
          <TouchableOpacity 
            style={[styles.mealCategoryCard, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.medium, 
              borderBottomLeftRadius: expandedMeals['snack'] ? 0 : theme.borderRadius.medium,
              borderBottomRightRadius: expandedMeals['snack'] ? 0 : theme.borderRadius.medium,
              marginBottom: expandedMeals['snack'] ? 0 : undefined,
            }]}
          >
            <View style={styles.mealCategoryContent}>
              {/* Linke Seite - Mahlzeiteninfo */}
              <TouchableOpacity 
                style={{ flex: 1 }}
                onPress={() => navigation.getParent()?.navigate('BarcodeScanner', { mealType: 'snack' })}
              >
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
              </TouchableOpacity>
              
              {/* Rechte Seite - Kalorien + Akkordeon-Button */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.mealCategoryCalories, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.primary, marginRight: 8 }]}>
                  {Math.round(totals.mealTotals.snack?.calories || 0)} kcal
                </Text>
                {/* Akkordeon-Button - öffnet/schließt die Liste der Einträge */}
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleMealAccordion('snack');
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {expandedMeals['snack'] ? (
                    <CircleChevronUp size={24} color={theme.colors.primary} strokeWidth={1.5} />
                  ) : (
                    <CircleChevronDown size={24} color={theme.colors.primary} strokeWidth={1.5} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
          
          {/* Ausklappbarer Bereich für die Einträge */}
          {expandedMeals['snack'] && (
            <View style={{
              backgroundColor: theme.colors.card,
              borderBottomLeftRadius: theme.borderRadius.medium,
              borderBottomRightRadius: theme.borderRadius.medium,
              borderTopWidth: 1,     // Subtile Trennlinie
              borderTopColor: theme.colors.border + '40', // Transparentes Grau
              paddingHorizontal: 16, // 2 Grid Punkte (8px * 2)
              paddingTop: 8,        // 1 Grid Punkt (8px)
              paddingBottom: 0,     // Kein zusätzlicher Abstand unten
              marginBottom: 0,       // Kein Abstand zum Seitenende
            }}>
              {dailyLog && dailyLog.foodEntries.filter(entry => entry.mealType === 'snack').length > 0 ? (
                dailyLog.foodEntries.filter(entry => entry.mealType === 'snack').map((entry, index, array) => (
                  <View key={entry.id} style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 8, // 1 Grid Punkt (8px)
                    // Nur Trennlinie anzeigen, wenn es nicht das letzte Element ist
                    ...index < array.length - 1 ? {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border + '40',
                    } : {
                      marginBottom: 8, // 1 Grid Punkt Abstand zum Container-Ende
                    }
                  }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text }}>
                        {entry.foodItem.name}
                      </Text>
                      <Text style={{ fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight, fontSize: 12 }}>
                        {entry.servingAmount}g
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontFamily: theme.typography.fontFamily.medium, color: theme.colors.primary, marginRight: 8 }}>
                        {Math.round(entry.foodItem.nutrition.calories * (entry.servingAmount / 100))} kcal
                      </Text>
                      {/* Details-Button */}
                      <TouchableOpacity
                        onPress={() => handleOpenFoodDetails(entry)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={{ marginRight: 8 }}
                      >
                        <Info strokeWidth={1.5} size={20} color={theme.colors.accent} />
                      </TouchableOpacity>
                      {/* Löschen-Button */}
                      <TouchableOpacity
                        onPress={() => handleRemoveEntry(entry.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Trash2 strokeWidth={1.5} size={20} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={{ 
                  fontFamily: theme.typography.fontFamily.regular, 
                  color: theme.colors.textLight, 
                  textAlign: 'center', 
                  paddingVertical: 16, // 2 Grid Punkte (8px * 2)
                }}>
                  Keine Einträge vorhanden
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

// Styles wurden in eine separate Datei ausgelagert
