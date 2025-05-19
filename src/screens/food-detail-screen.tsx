import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert, ViewStyle, TextStyle, ImageStyle, Platform } from 'react-native';
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
import DateSelector from '../components/ui/date-selector';

type FoodDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'FoodDetail'>;

export default function FoodDetailScreen({ route, navigation }: FoodDetailScreenProps) {
  // Get theme and safe area insets
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // Get parameters from navigation
  const { barcode, foodId, mealType, foodItem: passedFoodItem } = route.params || {};
  
  const [isLoading, setIsLoading] = useState(false);
  const [foodItem, setFoodItem] = useState<FoodItem | null>(null);
  const [servings, setServings] = useState('100.00'); // Default to 100g mit 2 Nachkommastellen
  const [sliderValue, setSliderValue] = useState(100); // Slider-Wert (identisch mit servings, aber als number)
  
  // Set selected meal based on navigation parameter or default to Lunch
  const [selectedMeal, setSelectedMeal] = useState<MealType>(
    mealType ? MealType[mealType.charAt(0).toUpperCase() + mealType.slice(1) as keyof typeof MealType] : MealType.Lunch
  );
  
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Add state for the selected date (default to today)
  const [selectedDate, setSelectedDate] = useState<string>(getTodayFormatted());

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
            setError('Produkt nicht gefunden. Bitte Details manuell eingeben.');
            // Leeres Food Item erstellen
            createEmptyFoodItem();
          }
        } catch (err) {
          setError('Fehler beim Abrufen der Produktdaten');
          console.error(err);
          // Leeres Food Item erstellen bei Fehler
          createEmptyFoodItem();
        } finally {
          setIsLoading(false);
        }
      } else {
        // Wenn kein Barcode oder FoodItem übergeben wurde (manuelles Eingeben), erstelle ein leeres Food Item
        createEmptyFoodItem();
        setIsLoading(false);
      }
    };

    // Funktion zum Erstellen eines leeren Food Items
    const createEmptyFoodItem = () => {
      const emptyFood: FoodItem = {
        id: generateSimpleId(),
        name: '',
        brand: '',
        barcode: '',
        nutrition: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          servingSize: '100g',
          servingSizeGrams: 100
        }
      };
      setFoodItem(emptyFood);
      setCustomName('');
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
        return;
      }

      // STEP 2: Create a food entry for the daily log
      const entry: FoodEntry = {
        id: generateSimpleId(),
        foodItem: updatedFoodItem,
        servingAmount: parseFloat(servings) || 1,
        mealType: selectedMeal,
        timeConsumed: new Date().toISOString(),
      };
      
      // Use the selected date instead of today for the daily log
      console.log(`Using selected date for daily log: ${selectedDate}`);
      
      // Format the entry time for MySQL compatibility
      const now = new Date();
      const mysqlCompatibleTime = dateToMySQLDateTime(now);
      console.log(`Created food entry at: ${mysqlCompatibleTime} (local time)`);
      
      // Update the entry's time to use MySQL compatible format
      entry.timeConsumed = now.toISOString();
      
      // STEP 3: Get the daily log for the selected date
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
      
      // STEP 4: Add the entry to the daily log
      dailyLog.foodEntries.push(entry);
      console.log(`Added food entry ${entry.id} to daily log, now has ${dailyLog.foodEntries.length} entries`);
      
      // STEP 5: Save the updated log
      try {
        await saveDailyLog(dailyLog);
        console.log('Daily log saved successfully');
      } catch (saveLogError) {
        console.error('Error saving daily log:', saveLogError);
        Alert.alert('Fehler beim Speichern', 'Der Tageseintrag konnte nicht gespeichert werden');
        return;
      }
      
      // Show success message
      Alert.alert(
        'Erfolg',
        `${updatedFoodItem.name} wurde zu deiner ${getMealTypeLabel(selectedMeal.toString())} Liste hinzugefügt`,
        [{ 
          text: 'OK', 
          onPress: () => {
            // Zurück zum vorherigen Screen
            navigation.goBack();
          }
        }]
      );
    } catch (err) {
      console.error('Error in handleAddToLog:', err);
      Alert.alert('Fehler', 'Ein unerwarteter Fehler ist aufgetreten beim Hinzufügen des Lebensmittels');
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
        style={styles.scrollContent}
        contentContainerStyle={{
          paddingRight: 16,
          paddingLeft: 16,
        }}
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
          <View style={[styles.errorContainer, { marginTop: theme.spacing.xl }]}>
            <Text style={[styles.errorText, { 
              color: theme.colors.error,
              fontFamily: theme.typography.fontFamily.medium 
            }]}>{error}</Text>
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

            {/* Date selector */}
            <Text style={[
              styles.sectionTitle, 
              { 
                color: theme.colors.text,
                fontFamily: theme.typography.fontFamily.medium
              }
            ]}>Datum auswählen</Text>
            <View style={{
              marginBottom: theme.spacing.m,
              marginTop: theme.spacing.xs
            }}>
              <DateSelector
                date={selectedDate}
                onDateChange={(newDate) => {
                  console.log(`Selected date changed to: ${newDate}`);
                  setSelectedDate(newDate);
                }}
                containerStyle={{
                  backgroundColor: theme.colors.card,
                  borderRadius: theme.borderRadius.medium,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  padding: theme.spacing.xs,
                }}
              />
            </View>

            {/* Meal type selection */}
            <Text style={[
              styles.sectionTitle, 
              { 
                color: theme.colors.text,
                fontFamily: theme.typography.fontFamily.medium
              }
            ]}>Mahlzeit auswählen</Text>
            <View style={[styles.sectionContainer, { marginBottom: theme.spacing.l }]}>
              <Text style={[styles.sectionTitle, { 
                color: theme.colors.text,
                fontFamily: theme.typography.fontFamily.medium,
                fontSize: theme.typography.fontSize.m,
                marginBottom: theme.spacing.m
              }]}>Mahlzeitentyp:</Text>
              <View style={[styles.mealTypeContainer, { gap: theme.spacing.s }]}>
                {Object.keys(MealType).map((meal) => (
                  <TouchableOpacity
                    key={meal}
                    onPress={() => setSelectedMeal(MealType[meal as keyof typeof MealType])}
                    style={[
                      styles.mealButton,
                      { 
                        borderRadius: theme.borderRadius.medium, 
                        padding: theme.spacing.m,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.surfaceVariant,
                      },
                      selectedMeal === MealType[meal as keyof typeof MealType]
                        ? { 
                            backgroundColor: theme.colors.primary,
                            borderColor: theme.colors.primary
                          }
                        : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.mealButtonText,
                        { 
                          fontFamily: theme.typography.fontFamily.medium,
                          fontSize: theme.typography.fontSize.m,
                          color: theme.colors.text
                        },
                        selectedMeal === MealType[meal as keyof typeof MealType]
                          ? { color: 'white' }
                          : null,
                      ]}
                    >
                      {getMealTypeEmoji(meal)} {getMealTypeLabel(meal.toLowerCase())}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

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
              <Text style={[styles.addButtonText, { 
                color: 'white',
                fontFamily: theme.typography.fontFamily.bold,
                fontSize: theme.typography.fontSize.l,
                textAlign: 'center'
              }]}>Hinzufügen</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// Helper functions for meal type emoji and labels
function getMealTypeEmoji(mealType: string): string {
  switch (mealType) {
    case 'breakfast': return '🥞';
    case 'lunch': return '🍲';
    case 'dinner': return '🍽️';
    case 'snack': return '🍪';
    default: return '🍽️';
  }
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

// Define StyleSheet interface
interface Styles {
  container: ViewStyle;
  stickyHeader: ViewStyle;
  headerText: TextStyle;
  scrollContent: ViewStyle;
  card: ViewStyle;
  cardTitle: TextStyle; // Hinzugefügt, fehlte in der Interface-Definition
  imagePlaceholder: ViewStyle;
  placeholderText: TextStyle;
  inputContainer: ViewStyle;
  inputLabel: TextStyle;
  textInput: TextStyle;
  brandContainer: ViewStyle;
  brandLabel: TextStyle;
  brandText: TextStyle;
  barcodeContainer: ViewStyle;
  barcodeLabel: TextStyle;
  barcodeText: TextStyle;
  servingsContainer: ViewStyle;
  servingsLabel: TextStyle;
  servingsInput: TextStyle;
  servingHeader: ViewStyle;
  servingsAmount: TextStyle;
  slider: ViewStyle;
  sliderLabels: ViewStyle;
  sectionContainer: ViewStyle;
  sectionTitle: TextStyle;
  mealTypeContainer: ViewStyle;
  mealButton: ViewStyle;
  selectedMealButton: ViewStyle;
  mealButtonText: TextStyle;
  selectedMealButtonText: TextStyle;
  addButton: ViewStyle;
  addButtonText: TextStyle;
  loadingContainer: ViewStyle;
  loadingText: TextStyle;
  errorContainer: ViewStyle;
  errorText: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
  },
  stickyHeader: {
    width: '100%',
    zIndex: 10,
  },
  headerText: {
    textAlign: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  servingHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  servingsAmount: {
    textAlign: 'center',
  },
  slider: {
    height: 40,
    alignSelf: 'stretch',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  loadingContainer: {
    padding: 16, // 2 Grid-Punkte (16px)
    alignItems: 'center',
    marginTop: 16, // 2 Grid-Punkte (16px)
  },
  loadingText: {
    marginTop: 8, // 1 Grid-Punkt (8px)
    fontSize: 16,
  },
  errorContainer: {
    padding: 16, // 2 Grid-Punkte (16px)
    alignItems: 'center',
    marginTop: 16, // 2 Grid-Punkte (16px)
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: 'red',
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 16, // 2 Grid-Punkte (16px)
  },
  label: {
    fontSize: 16,
    marginBottom: 8, // 1 Grid-Punkt (8px)
  },
  imagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 16,
  },
  placeholderText: {
    color: '#888',
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  brandText: {
    fontSize: 16,
  },
  barcodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  barcodeLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  barcodeText: {
    fontSize: 16,
    fontFamily: 'monospace',
  },
  servingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  servingsLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  servingsInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    width: 60,
    textAlign: 'center',
    fontSize: 16,
  },
  sectionContainer: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  mealButton: {
    minWidth: '47%',
    alignItems: 'center',
  },
  selectedMealButton: {},
  mealButtonText: {
    textAlign: 'center',
  },
  selectedMealButtonText: {},
  addButton: {
    alignItems: 'center',
  },
  addButtonText: {},
});
