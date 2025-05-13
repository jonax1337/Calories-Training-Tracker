import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { FoodItem, MealType } from '../types';
import NutritionalInfoCard from '../components/ui/nutritional-info-card';
import { getFoodDataByBarcode } from '../services/barcode-service';
import { saveFoodItem } from '../services/storage-service';
import { v4 as uuidv4 } from 'uuid';
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
        id: `food_${Date.now()}`,
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
        id: uuidv4(),
        foodItem: updatedFoodItem,
        servingAmount: parseFloat(servings) || 1,
        mealType: selectedMeal,
        timeConsumed: new Date().toISOString(),
      };

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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Sticky Header */}
      <View
        style={[
          styles.stickyHeader,
          {
            paddingTop: insets.top,
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
            borderBottomWidth: 1,
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          },
        ]}
      >
        <Text
          style={[
            styles.headerText,
            { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text },
          ]}
        >
          {foodItem ? foodItem.name : barcode ? 'Produkt laden...' : 'Neues Produkt'}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={{
          padding: 16, // 2 Grid-Punkte (16px)
          paddingBottom: Math.max(16, insets.bottom), // Safe Area oder 16px, je nachdem was größer ist
        }}
      >
        {isLoading ? (
          <View
            style={[
              styles.loadingContainer,
              { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.medium },
            ]}
          >
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text
              style={[
                styles.loadingText,
                { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight },
              ]}
            >
              Produktinformationen werden geladen...
            </Text>
          </View>
        ) : error ? (
          <View
            style={[
              styles.errorContainer,
              { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.medium },
            ]}
          >
            <Text
              style={[
                styles.errorText,
                { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.error },
              ]}
            >
              {error}
            </Text>
          </View>
        ) : (
          <>
            {/* Kein Bild mehr anzeigen */}
            <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.medium }]}>
              <Text style={[styles.placeholderText, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
                Nährwertangaben
              </Text>
            </View>

            {/* Food name input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text }]}>Produktname:</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                    fontFamily: theme.typography.fontFamily.regular,
                  },
                ]}
                value={customName}
                onChangeText={setCustomName}
                placeholder="Produktname eingeben"
                placeholderTextColor={theme.colors.textLight}
              />
            </View>

            {/* Brand display if available */}
            {foodItem?.brand && (
              <View style={styles.brandContainer}>
                <Text style={styles.brandLabel}>Brand:</Text>
                <Text style={styles.brandText}>{foodItem.brand}</Text>
              </View>
            )}

            {/* Barcode display if available */}
            {barcode && (
              <View style={styles.barcodeContainer}>
                <Text style={styles.barcodeLabel}>Barcode:</Text>
                <Text style={styles.barcodeText}>{barcode}</Text>
              </View>
            )}

            {/* Nutrition information */}
            {foodItem?.nutrition && (
              <>
                <View style={styles.servingsContainer}>
                  <Text style={[styles.servingsLabel, { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text }]}>Menge in Gramm:</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { 
                        backgroundColor: theme.colors.card,
                        borderColor: theme.colors.border,
                        color: theme.colors.text,
                        fontFamily: theme.typography.fontFamily.regular,
                      },
                    ]}
                    value={servings}
                    onChangeText={(text) => {
                      // Validiere und formatiere die Eingabe für Nachkommastellen
                      const filteredText = text.replace(/[^0-9.,]/g, '').replace(',', '.');
                      if (filteredText === '') {
                        setServings('');
                        return;
                      }
                      
                      // Verarbeite die Zahl mit bis zu 2 Nachkommastellen
                      const number = parseFloat(filteredText);
                      if (!isNaN(number)) {
                        // Limitiere auf 2 Nachkommastellen
                        if (filteredText.includes('.')) {
                          const parts = filteredText.split('.');
                          if (parts[1].length > 2) {
                            // Wenn mehr als 2 Nachkommastellen, kürze sie
                            setServings(`${parts[0]}.${parts[1].substring(0, 2)}`);
                            return;
                          }
                        }
                        setServings(filteredText);
                      }
                    }}
                    keyboardType="decimal-pad"
                  />
                </View>

                <NutritionalInfoCard
                  nutrition={foodItem.nutrition}
                  servingMultiplier={parseFloat(servings) || 1}
                />
                <Text style={[{
                  textAlign: 'center',
                  marginTop: 4,
                  fontFamily: theme.typography.fontFamily.regular,
                  color: theme.colors.textLight,
                  fontSize: 12
                }]}>
                  Sie können Nachkommastellen eingeben (z.B. 125.75g)
                </Text>
              </>
            )}

            {/* Meal type selection */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text }]}>Mahlzeitkategorie</Text>
              <View style={styles.mealTypeContainer}>
                {Object.entries(MealType).map(([key, type]) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.mealButton,
                      {
                        borderColor: theme.colors.border,
                        borderRadius: theme.borderRadius.small,
                      },
                      selectedMeal === type && {
                        backgroundColor: theme.colors.primary,
                        borderColor: theme.colors.primary,
                      },
                    ]}
                    onPress={() => setSelectedMeal(type)}
                  >
                    <Text
                      style={[
                        styles.mealButtonText,
                        {
                          fontFamily: theme.typography.fontFamily.medium,
                          color: theme.colors.text,
                        },
                        selectedMeal === type && {
                          color: 'white',
                          fontFamily: theme.typography.fontFamily.bold,
                        },
                      ]}
                    >
                      {getMealTypeEmoji(key.toLowerCase())} {getMealTypeLabel(key.toLowerCase())}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Add to log button */}
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.medium }]}
              onPress={handleAddToLog}
            >
              <Text style={[styles.addButtonText, { fontFamily: theme.typography.fontFamily.bold, color: 'white' }]}>
                Zur Tagesübersicht hinzufügen
              </Text>
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
  productImage: ImageStyle;
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
    paddingHorizontal: 16, // 2 Grid-Punkte (16px)
    paddingBottom: 8, // 1 Grid-Punkt (8px)
    zIndex: 10,
  },
  headerText: {
    fontSize: 20,
    textAlign: 'center',
    marginVertical: 8, // 1 Grid-Punkt (8px)
  },
  scrollContent: {
    flex: 1,
  },
  card: {
    padding: 16, // 2 Grid-Punkte (16px)
    marginBottom: 16, // 2 Grid-Punkte (16px)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
  productImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
    resizeMode: 'contain',
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
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 4,
    marginBottom: 8,
    alignItems: 'center',
  },
  selectedMealButton: {
    backgroundColor: '#4CAF50',
  },
  mealButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedMealButtonText: {
    color: 'white',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginVertical: 16,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
