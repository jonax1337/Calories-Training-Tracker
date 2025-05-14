import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert, ViewStyle, TextStyle, ImageStyle, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { FoodItem, MealType } from '../types';
import NutritionalInfoCard from '../components/ui/nutritional-info-card';
import { getFoodDataByBarcode } from '../services/barcode-service';
import { saveFoodItem } from '../services/storage-service';
// Eigene UUID-Generierung statt uuidv4, da es Probleme mit crypto.getRandomValues() gibt
function generateSimpleId() {
  return 'food_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 11);
}
import { useTheme } from '../theme/theme-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FoodDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'FoodDetail'>;

export default function FoodDetailScreen({ route, navigation }: FoodDetailScreenProps) {
  // Get theme and safe area insets
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // Get parameters from navigation
  const { barcode, foodId, mealType } = route.params || {};
  
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

  // Load food data when component mounts or create empty food item for manual entry
  useEffect(() => {
    const loadFoodData = async () => {
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
        // Wenn kein Barcode übergeben wurde (manuelles Eingeben), erstelle ein leeres Food Item
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
  }, [barcode, foodId]);

  const handleAddToLog = async () => {
    if (!foodItem) return;

    try {
      // Create a copy with the custom name if it was changed
      const updatedFoodItem = {
        ...foodItem,
        name: customName || foodItem.name,
      };

      // Save the food item to storage
      await saveFoodItem(updatedFoodItem);

      // Create a food entry (in a real app, this would be saved to the daily log)
      const entry = {
        id: generateSimpleId(),
        foodItem: updatedFoodItem,
        servingAmount: parseFloat(servings) || 1,
        mealType: selectedMeal,
        timeConsumed: new Date().toISOString(),
      };
      
      console.log('Food entry created:', entry.id);

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
      console.error('Error adding food to log:', err);
      Alert.alert('Error', 'Failed to add food to your log');
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
              servingMultiplier={parseFloat(servings) / foodItem.nutrition.servingSizeGrams}
            />
            )}

            {/* Servings input */}
            {/* Mengeneingabe mit Slider */}
            <View style={{
              flexDirection: 'column', 
              width: '100%',          
              padding: theme.spacing.s,
              marginTop: theme.spacing.s,
              marginBottom: theme.spacing.s,
              borderRadius: theme.borderRadius.medium,
              backgroundColor: theme.colors.surfaceVariant
            }}>
              {/* Überschrift */}
              <View style={{
                width: '100%',        
                marginBottom: theme.spacing.s
              }}>
                <Text style={{
                  color: theme.colors.text,
                  fontFamily: theme.typography.fontFamily.bold,
                  fontSize: theme.typography.fontSize.l
                }}>Menge (g)</Text>
              </View>
              
              {/* Wertanzeige - Klickbare/Editierbare Grammzahl */}
              <View style={{
                width: '100%',        
                alignItems: 'center',
                marginBottom: theme.spacing.xs
              }}>
                <TextInput
                  style={{
                    color: theme.colors.primary,
                    fontFamily: theme.typography.fontFamily.bold,
                    fontSize: theme.typography.fontSize.xxl,
                    textAlign: 'center',
                    minWidth: 120,
                    padding: theme.spacing.xs
                  }}
                  value={`${servings}`}
                  onChangeText={(text) => {
                    // Entferne das 'g' und andere nicht-numerische Zeichen (außer Punkt und Komma)
                    const validText = text.replace(/[^0-9.,]/g, '').replace(',', '.');
                    setServings(validText);
                    
                    // Aktualisiere auch den Slider, falls der Wert im gültigen Bereich liegt
                    const numValue = parseFloat(validText);
                    if (!isNaN(numValue) && numValue >= 1 && numValue <= 500) {
                      setSliderValue(Math.round(numValue));
                    }
                  }}
                  keyboardType={Platform.OS === 'ios' ? "decimal-pad" : "numeric"}
                />
              </View>
              
              {/* Slider */}
              <View style={{
                width: '100%',        
                marginBottom: theme.spacing.m
              }}>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={1}
                  maximumValue={500}
                  step={1}
                  value={sliderValue}
                  minimumTrackTintColor={theme.colors.primary}
                  maximumTrackTintColor={theme.colors.border}
                  thumbTintColor={theme.colors.primary}
                  onValueChange={(value: number) => {
                    const intValue = Math.round(value);
                    setSliderValue(intValue);
                    setServings(intValue.toString());
                  }}
                />
              </View>
                
              {/* Slider-Beschriftungen */}
              <View style={{
                width: '100%',         
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: theme.spacing.s,
                marginBottom: theme.spacing.m
              }}>
                <Text style={{color: theme.colors.textLight}}>001</Text>
                <Text style={{color: theme.colors.textLight}}>250</Text>
                <Text style={{color: theme.colors.textLight}}>500</Text>
              </View>
              
              {/* Zusätzlicher Hinweis unter der Skala */}
              <View style={{
                width: '100%',         
                marginTop: theme.spacing.s,
                marginBottom: theme.spacing.s
              }}>
                <Text style={{
                  color: theme.colors.textLight,
                  fontFamily: theme.typography.fontFamily.regular,
                  fontSize: theme.typography.fontSize.s,
                  textAlign: 'center'
                }}>
                  Tippen Sie auf den Wert oben, um eine exakte Menge einzugeben
                </Text>
              </View>
            </View>

            {/* Meal type selection */}
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
