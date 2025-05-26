import React, { useState, useEffect, useRef } from 'react';
import { Text, View, Vibration, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
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
  
  const [isLoading, setIsLoading] = useState(false);
  const [foodItem, setFoodItem] = useState<FoodItem | null>(null);
  const [servings, setServings] = useState(passedServingAmount ? passedServingAmount.toFixed(2) : '100.00'); // Übernimm Portionsgröße oder Default
  const [sliderValue, setSliderValue] = useState(passedServingAmount || 100); // Slider-Wert (identisch mit servings, aber als number)
  
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
      // Wenn ein FoodItem direkt übergeben wurde, verwende dieses
      if (passedFoodItem) {
        console.log('Verwende direkt übergebenes FoodItem:', passedFoodItem.id);
        setFoodItem(passedFoodItem);
        setCustomName(passedFoodItem.name);
        
        // Setze die Portionsgröße auf die tatsächliche Füllmenge des Produkts
        if (passedFoodItem.nutrition && passedFoodItem.nutrition.servingSizeGrams) {
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

            {/* Servings input */}
            {/* Mengeneingabe mit Slider - angepasst an Profile-Screen-Stil */}
            <View style={{
              flexDirection: 'column', 
              width: '100%',          
              padding: theme.spacing.xs,
              marginTop: theme.spacing.s,
              marginBottom: theme.spacing.s,
              borderRadius: theme.borderRadius.medium,
              backgroundColor: theme.colors.card,
              borderWidth: 1,
              borderColor: theme.colors.border
            }}>
              {/* Überschrift */}
              <View style={{
                width: '100%'      
              }}>
                <Text style={{ 
                  fontFamily: theme.typography.fontFamily.medium, 
                  color: theme.colors.text,
                  marginTop: theme.spacing.xs,
                  marginLeft: theme.spacing.xs,
                  fontSize: theme.typography.fontSize.m
                }}>
                  Menge
                </Text>
              </View>
              
              {/* Wertanzeige - Klickbare/Editierbare Grammzahl */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                paddingHorizontal: theme.spacing.xs,
                marginBottom: theme.spacing.xs
              }}>
                <Text style={{
                  fontFamily: theme.typography.fontFamily.medium,
                  fontSize: theme.typography.fontSize.s,
                  color: theme.colors.textLight
                }}>
                  Gramm
                </Text>
                <TextInput
                  style={{
                    color: theme.colors.primary,
                    fontFamily: theme.typography.fontFamily.bold,
                    fontSize: theme.typography.fontSize.l,
                    textAlign: 'center',
                    minWidth: 80,
                    padding: theme.spacing.xs,
                    backgroundColor: theme.colors.card,
                    borderRadius: theme.borderRadius.small,
                    borderWidth: 1,
                    borderColor: theme.colors.primary,
                    elevation: 2,
                    shadowColor: theme.colors.shadow,
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.2,
                    shadowRadius: 1
                  }}
                  value={servings}
                  placeholder="100"
                  selectTextOnFocus={true}
                  onChangeText={(text) => {
                    // Validiere und formatiere die Eingabe
                    const validText = text.replace(/[^0-9.,]/g, '').replace(',', '.');
                    setServings(validText);
                    
                    // Aktualisiere auch den Slider, falls der Wert im gültigen Bereich liegt
                    const numValue = parseFloat(validText);
                    if (!isNaN(numValue)) {
                      if (numValue > 500) {
                        // Bei höheren Werten, setze Slider auf Maximum
                        setSliderValue(500);
                      } else if (numValue < 1) {
                        // Bei niedrigeren Werten, setze Slider auf Minimum
                        setSliderValue(1);
                      } else {
                        // Bei Werten im gültigen Bereich, setze exakten Wert
                        setSliderValue(Math.round(numValue));
                      }
                    }
                  }}
                  keyboardType={Platform.OS === 'ios' ? "decimal-pad" : "numeric"}
                />
              </View>
              
              {/* Slider */}
              <View style={{
                width: '100%',        
                marginBottom: theme.spacing.xs,
                paddingHorizontal: theme.spacing.xs
              }}>
                <Slider
                  style={{ width: '100%', height: 30 }}
                  minimumValue={1}
                  maximumValue={500}
                  step={1}
                  value={Math.min(Math.max(sliderValue, 1), 500)}
                  minimumTrackTintColor={theme.colors.primary}
                  maximumTrackTintColor={theme.colors.border}
                  thumbTintColor={theme.colors.primary}
                  onValueChange={(value: number) => {
                    // Runde auf ganze Zahlen für bessere Anzeige
                    const roundedValue = Math.round(value);
                    setSliderValue(roundedValue);
                    setServings(roundedValue.toString());
                  }}
                />
              </View>
                
              {/* Slider-Beschriftungen */}
              <View style={{
                width: '100%',         
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: theme.spacing.xs,
                marginBottom: theme.spacing.xs
              }}>
                <Text style={{
                  color: theme.colors.textLight,
                  fontSize: theme.typography.fontSize.xs
                }}>1</Text>
                <Text style={{
                  color: theme.colors.textLight,
                  fontSize: theme.typography.fontSize.xs
                }}>250</Text>
                <Text style={{
                  color: theme.colors.textLight,
                  fontSize: theme.typography.fontSize.xs
                }}>500</Text>
              </View>
            </View>
            
            {/* Mahlzeitenauswahl - nur im Bearbeitungsmodus anzeigen */}
            {isEditing && (
              <View style={[styles.card, { marginTop: theme.spacing.m }]}>
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