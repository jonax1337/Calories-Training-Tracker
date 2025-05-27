import React, { useState, useEffect, useRef } from 'react';
import { Text, View, Vibration, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import SliderWithInput from '../components/ui/slider-with-input';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { FoodItem, MealType, FoodEntry } from '../types';
import NutritionalInfoCard from '../components/ui/nutritional-info-card';
import { getFoodDataByBarcode } from '../services/barcode-service';
import { saveFoodItem, getDailyLogByDate, saveDailyLog } from '../services/storage-service';
import generateSimpleId from '../utils/id-generator';
import { formatToLocalISODate, getTodayFormatted, dateToMySQLDateTime } from '../utils/date-utils';
import { useTheme } from '../theme/theme-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createFoodDetailStyles } from '../styles/screens/food-detail-styles';
import * as Haptics from 'expo-haptics';

type FoodDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'FoodDetail'>;

export default function FoodDetailScreen({ route, navigation }: FoodDetailScreenProps) {
  // Get theme and safe area insets
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Styles mit aktuellem Theme initialisieren
  const styles = createFoodDetailStyles(theme);

  // Get parameters from navigation
  const { barcode, foodId, mealType, foodItem: passedFoodItem, selectedDate: passedDate, existingEntryId, servingAmount: passedServingAmount } = route.params || {};
  
  // Debug-Log, um zu sehen, welcher Wert übergeben wird
  console.log('Food Detail Screen: Empfangene servingAmount:', passedServingAmount);
  
  const [isLoading, setIsLoading] = useState(false);
  const [foodItem, setFoodItem] = useState<FoodItem | null>(null);
  
  // Stelle sicher, dass wir den passedServingAmount-Wert mit 2 Nachkommastellen initialisieren, falls vorhanden
  // Andernfalls verwenden wir den Standardwert 100.00
  const [servings, setServings] = useState(
    typeof passedServingAmount === 'number' ? passedServingAmount.toFixed(2) : '100.00'
  ); 
  
  // sliderValue sollte identisch mit dem numerischen Wert sein
  const [sliderValue, setSliderValue] = useState(
    typeof passedServingAmount === 'number' ? passedServingAmount : 100
  );
  
  // Set selected meal based on navigation parameter or default to Lunch
  const [selectedMeal, setSelectedMeal] = useState<MealType>(
    mealType ? MealType[mealType.charAt(0).toUpperCase() + mealType.slice(1) as keyof typeof MealType] : MealType.Lunch
  );
  
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Add state for the selected date (use passed date or default to today)
  const [selectedDate, setSelectedDate] = useState<string>(passedDate || getTodayFormatted());
  
  // Flag to indicate if we're editing an existing entry
  const isEditing = Boolean(existingEntryId);

  // Referenz zum ScrollView, um Scrollposition zu kontrollieren
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Aktuellen Scrollstatus speichern und wiederherstellen
  const [scrollPosition, setScrollPosition] = useState<{x: number, y: number}>({x: 0, y: 0});
  
  // Diese Funktion hilft, die Scrollposition beizubehalten
  const maintainScrollPosition = () => {
    if (scrollViewRef.current) {
      // Aktuelle Position speichern
      scrollViewRef.current.scrollTo({x: scrollPosition.x, y: scrollPosition.y, animated: false});
    }
  };
  
  // Scroll-Position beim Text-Input-Fokus beibehalten
  const handleScrollPositionChange = (e: any) => {
    setScrollPosition({
      x: e.nativeEvent.contentOffset.x,
      y: e.nativeEvent.contentOffset.y
    });
  };

  // Load food data when component mounts or create empty food item for manual entry
  useEffect(() => {
    const loadFoodData = async () => {
      // WICHTIG: Prüfe zuerst, ob wir einen existierenden Eintrag bearbeiten
      // und hole die richtige Portionsgröße aus dem food entry
      if (isEditing && existingEntryId && passedServingAmount) {
        console.log(`Bearbeite existierenden Eintrag mit ID ${existingEntryId}, Menge: ${passedServingAmount}g`);
        
        // Hier verwenden wir die übergebene Portionsgröße aus dem Food Entry
        // NICHT die Standardgröße des Produkts!
        setServings(passedServingAmount.toFixed(2));
        setSliderValue(passedServingAmount);
      }
      
      // Wenn ein FoodItem direkt übergeben wurde, verwende dieses
      if (passedFoodItem) {
        console.log('Verwende direkt übergebenes FoodItem:', passedFoodItem.id);
        setFoodItem(passedFoodItem);
        setCustomName(passedFoodItem.name);
        
        // Setze die Portionsgröße NUR, wenn wir KEINEN existierenden Eintrag bearbeiten
        // Ansonsten verwenden wir die Menge aus dem Food Entry!
        if (!isEditing && passedFoodItem.nutrition && passedFoodItem.nutrition.servingSizeGrams) {
          const productSize = passedFoodItem.nutrition.servingSizeGrams;
          console.log(`Setze Portionsgröße auf Produktfüllmenge: ${productSize}g`);
          setServings(productSize.toFixed(2));
          setSliderValue(productSize);
        }
        
        setIsLoading(false);
        return;
      }

      // Ansonsten versuche, Daten über Barcode oder ID zu laden
      if (barcode) {
        setIsLoading(true);
        try {
          const data = await getFoodDataByBarcode(barcode);
          if (data) {
            // Entferne das Bild aus dem Food Item
            const foodWithoutImage = {
              ...data,
              image: undefined
            };
            setFoodItem(foodWithoutImage);
            setCustomName(data.name);
            
            // Setze die Portionsgröße auf die tatsächliche Füllmenge des Produkts
            if (data.nutrition && data.nutrition.servingSizeGrams) {
              const productSize = data.nutrition.servingSizeGrams;
              console.log(`Setze Portionsgröße auf Produktfüllmenge: ${productSize}g`);
              setServings(productSize.toFixed(2));
              setSliderValue(productSize);
            }
          } else {
            setError('Produkt nicht gefunden.');
          }
        } catch (err) {
          setError('Fehler beim Abrufen der Produktdaten');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    loadFoodData();
  }, [barcode, foodId, passedFoodItem]);

  const handleAddToLog = async () => {
    if (!foodItem) return;

    try {
      // Create a copy with the custom name if it was changed
      const updatedFoodItem = {
        ...foodItem,
        name: customName || foodItem.name,
      };

      console.log('Saving food item before adding to log:', JSON.stringify(updatedFoodItem));
      
      // STEP 1: Save the food item to storage - this is where errors happen
      try {
        await saveFoodItem(updatedFoodItem);
        console.log('Food item saved successfully');
      } catch (saveError) {
        console.error('Failed to save food item:', saveError);
        Alert.alert('Fehler beim Speichern', 'Das Lebensmittel konnte nicht in der Datenbank gespeichert werden.');
        // Haptics
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        return;
      }

      // Use the selected date instead of today for the daily log
      console.log(`Using selected date for daily log: ${selectedDate}`);
      
      // Format the entry time for MySQL compatibility
      const now = new Date();
      const mysqlCompatibleTime = dateToMySQLDateTime(now);
      console.log(`Operation time: ${mysqlCompatibleTime} (local time)`);
      
      // STEP 2: Get the daily log for the selected date
      let dailyLog;
      try {
        dailyLog = await getDailyLogByDate(selectedDate);
        console.log('Daily log retrieved for selected date:', dailyLog ? 'found' : 'not found');
      } catch (logError) {
        console.error('Error getting daily log:', logError);
        // Create a default log if one doesn't exist
        dailyLog = {
          date: selectedDate,
          foodEntries: [],
          waterIntake: 0,
          dailyNotes: ''
        };
        console.log('Created default daily log');
      }
      
      if (isEditing && existingEntryId) {
        // EDITING MODE: Update existing entry
        console.log(`Updating existing entry with ID: ${existingEntryId}`);
        
        // Find index of entry to update
        const entryIndex = dailyLog.foodEntries.findIndex(entry => entry.id === existingEntryId);
        
        if (entryIndex !== -1) {
          // Update the existing entry
          const updatedEntry = {
            ...dailyLog.foodEntries[entryIndex],
            foodItem: updatedFoodItem,
            servingAmount: parseFloat(servings) || 1,
            mealType: selectedMeal
            // Don't update timeConsumed to preserve original consumption time
          };
          
          // Replace the entry in the array
          dailyLog.foodEntries[entryIndex] = updatedEntry;
          console.log(`Updated food entry at index ${entryIndex}`);
        } else {
          console.error(`Entry with ID ${existingEntryId} not found in daily log`);
          Alert.alert('Fehler', 'Der zu aktualisierende Eintrag wurde nicht gefunden');
          return;
        }
      } else {
        // ADD MODE: Create a new entry
        const entry: FoodEntry = {
          id: generateSimpleId(),
          foodItem: updatedFoodItem,
          servingAmount: parseFloat(servings) || 1,
          mealType: selectedMeal,
          timeConsumed: now.toISOString(),
        };
        
        // Add the new entry to the daily log
        dailyLog.foodEntries.push(entry);
        console.log(`Added new food entry ${entry.id} to daily log, now has ${dailyLog.foodEntries.length} entries`);
      }
      
      // STEP 3: Save the updated log
      try {
        await saveDailyLog(dailyLog);
        console.log('Daily log saved successfully');
      } catch (saveLogError) {
        console.error('Error saving daily log:', saveLogError);
        Alert.alert('Fehler beim Speichern', 'Der Tageseintrag konnte nicht gespeichert werden');
        // Haptics
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        return;
      }

      // Success Haptics
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

      Vibration.vibrate([0, 100, 0, 100]);
      // Zurück zum vorherigen Screen
      navigation.goBack()
    } catch (err) {
      console.error('Error in handleAddToLog:', err);
      Alert.alert('Fehler', 'Ein unerwarteter Fehler ist aufgetreten beim Hinzufügen des Lebensmittels');
      // Error Haptics
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Vibration.vibrate([0, 500, 0, 500]);
    }
  };

  const renderMealTypeButton = (mealType: MealType, label: string) => (
    <TouchableOpacity
      style={[
        styles.mealButton,
        selectedMeal === mealType && styles.selectedMealButton,
        { borderColor: theme.colors.border, borderRadius: theme.borderRadius.small },
      ]}
      onPress={() => setSelectedMeal(mealType)}
    >
      <Text
        style={[
          styles.mealButtonText,
          selectedMeal === mealType && styles.selectedMealButtonText,
          { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { 
      backgroundColor: theme.colors.background
    }]}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollContent}
        contentContainerStyle={{
          paddingRight: 16,
          paddingLeft: 16,
        }}
        scrollEventThrottle={16}
        onScroll={handleScrollPositionChange}
        keyboardShouldPersistTaps="handled"
      >
        {isLoading ? (
          <View style={[styles.loadingContainer, { marginTop: theme.spacing.xl }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { 
              color: theme.colors.text,
              fontFamily: theme.typography.fontFamily.medium,
              marginTop: theme.spacing.m 
            }]}>Lade Produktdaten...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            {/* Food name input */}
            <View style={[styles.inputContainer, { marginBottom: theme.spacing.m }]}>
              <Text style={[styles.inputLabel, { 
                color: theme.colors.text,
                fontFamily: theme.typography.fontFamily.medium,
                marginTop: theme.spacing.m,
                marginBottom: theme.spacing.s
              }]}>Name</Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.borderRadius.small,
                  color: theme.colors.text,
                  fontFamily: theme.typography.fontFamily.regular,
                  padding: theme.spacing.m
                }]}
                value={customName}
                onChangeText={setCustomName}
                placeholder="Produktname eingeben"
                placeholderTextColor={theme.colors.placeholder}
              />
            </View>

            {/* Nutrition information */}
            {foodItem?.nutrition && (
              <NutritionalInfoCard
              nutrition={foodItem.nutrition}
              servingMultiplier={parseFloat(servings) / 100} /* Korrigiert: Immer durch 100 teilen, da Nährwerte pro 100g/ml gespeichert sind */
            />
            )}

            {/* Mengeneingabe mit wiederverwendbarem SliderWithInput */}
            <SliderWithInput
              minValue={1}
              maxValue={1000}
              middleValue={500}
              step={0.01}
              decimalPlaces={2}
              allowDecimals={true}
              value={parseFloat(servings) || 100}
              onValueChange={(value: number) => {
                setServings(value.toFixed(2));  // Formatiere mit 2 Nachkommastellen
                // Wir brauchen sliderValue für die Konsistenz im bestehenden Code
                setSliderValue(value);
              }}
              label="Menge"
              unit="Gramm"
              placeholder="100"
            />
            
            {/* Mahlzeitenauswahl - nur im Bearbeitungsmodus anzeigen */}
            {isEditing && (
              <View style={[styles.card, { marginTop: theme.spacing.m, borderWidth: 1, borderColor: theme.colors.border }]}>
                <Text style={styles.sectionTitle}>
                  Mahlzeit auswählen
                </Text>
                <View style={styles.mealTypeContainer}>
                  {Object.values(MealType).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        {
                          minWidth: '47%',
                          alignItems: 'center',
                          padding: theme.spacing.m,
                          borderRadius: theme.borderRadius.medium,
                          borderWidth: 1,
                          marginBottom: theme.spacing.s,
                        },
                        selectedMeal === type 
                          ? { 
                              borderColor: theme.colors.primary,
                              backgroundColor: theme.colors.primary + '15',
                            }
                          : {
                              borderColor: theme.colors.border,
                              backgroundColor: theme.colors.background,
                            }
                      ]}
                      onPress={() => {
                        setSelectedMeal(type);
                        // Haptic feedback
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text style={{
                        textAlign: 'center',
                        fontSize: theme.typography.fontSize.m,
                        fontFamily: selectedMeal === type 
                          ? theme.typography.fontFamily.bold 
                          : theme.typography.fontFamily.regular,
                        color: selectedMeal === type ? theme.colors.primary : theme.colors.text,
                      }}>
                        {getMealTypeLabel(type)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Add to log button */}
            <TouchableOpacity
              style={[styles.addButton, { 
                backgroundColor: theme.colors.primary,
                borderRadius: theme.borderRadius.medium,
                padding: theme.spacing.m,
                marginTop: theme.spacing.l,
                marginBottom: theme.spacing.xl
              }]}
              onPress={handleAddToLog}
            >
              <Text style={styles.addButtonText}>{isEditing ? 'Aktualisieren' : 'Hinzufügen'}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function getMealTypeLabel(mealType: string): string {
  switch (mealType) {
    case 'breakfast': return 'Frühstück';
    case 'lunch': return 'Mittagessen';
    case 'dinner': return 'Abendessen';
    case 'snack': return 'Snack';
    default: return 'Mahlzeit';
  }
}