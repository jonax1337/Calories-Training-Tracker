import React, { useState, useRef, useEffect } from 'react';
import { Text, View, TextInput, TouchableOpacity, Alert, Platform, ScrollView, KeyboardAvoidingView, Switch } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import SliderWithInput from '../components/ui/slider-with-input';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { FoodItem, MealType, FoodEntry } from '../types';
import NutritionalInfoCard from '../components/ui/nutritional-info-card';
import { saveFoodItem, getDailyLogByDate, saveDailyLog } from '../services/storage-service';
import generateSimpleId from '../utils/id-generator';
import { getTodayFormatted, dateToMySQLDateTime } from '../utils/date-utils';
import { determineDisplayUnit, getDisplayUnitString } from '../utils/unit-utils';
import { useTheme } from '../theme/theme-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDateContext } from '../context/date-context';
import { createManualFoodEntryStyles } from '../styles/screens/manual-food-entry-styles';
import * as Animatable from 'react-native-animatable';

type ManualFoodEntryScreenProps = NativeStackScreenProps<RootStackParamList, 'ManualFoodEntry'>;

export default function ManualFoodEntryScreen({ route, navigation }: ManualFoodEntryScreenProps) {
  // Get theme and safe area insets
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Initialize styles with current theme
  const styles = createManualFoodEntryStyles(theme);
  
  // Get date context
  const { selectedDate: contextDate } = useDateContext();
  
  // Get parameters from navigation
  const { mealType, selectedDate: routeDate } = route.params || {};

  // Animation state management
  const animationTriggered = useRef<boolean>(false);
  const [showAnimations, setShowAnimations] = useState(false);

  // Product info states
  const [productName, setProductName] = useState('');
  const [productBrand, setProductBrand] = useState('');
  
  // Nutrition calculation mode
  const [isWholeProduct, setIsWholeProduct] = useState(false); // false = pro 100g, true = ganzes Produkt
  
  // Nutrition values states  
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [sugar, setSugar] = useState('');
  const [fiber, setFiber] = useState('');
  const [sodium, setSodium] = useState('');
  const [potassium, setPotassium] = useState('');
  
  // Serving size
  const [servings, setServings] = useState('100.00');
  const [sliderValue, setSliderValue] = useState(100);
  
  // Set selected meal based on navigation parameter or default to Lunch
  const [selectedMeal, setSelectedMeal] = useState<MealType>(
    mealType ? MealType[mealType.charAt(0).toUpperCase() + mealType.slice(1) as keyof typeof MealType] : MealType.Lunch
  );
  
  // Use the date from route params, then context, or today as default
  const [selectedDate] = useState<string>(routeDate || contextDate || getTodayFormatted());

  // Referenz zum ScrollView
  const scrollViewRef = useRef<ScrollView>(null);

  // Focus detection for smooth animations
  useFocusEffect(
    React.useCallback(() => {
      // Reset animation state when screen is focused
      animationTriggered.current = false;
      setShowAnimations(false);
      
      // Wait for screen to be properly in focus, then trigger animations
      const focusTimer = setTimeout(() => {
        if (!animationTriggered.current) {
          animationTriggered.current = true;
          setShowAnimations(true);
        }
      }, 150); // Short delay to ensure smooth focus transition

      return () => {
        clearTimeout(focusTimer);
      };
    }, [])
  );

  // Calculate nutrition values per 100g based on input mode
  const getNutritionPer100g = () => {
    if (!isWholeProduct) {
      // Already per 100g
      return {
        calories: parseFloat(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
        sugar: parseFloat(sugar) || 0,
        fiber: parseFloat(fiber) || 0,
        sodium: parseFloat(sodium) || 0,
        potassium: parseFloat(potassium) || 0,
      };
    } else {
      // Convert from whole product to per 100g using slider weight
      const weight = parseFloat(servings) || 100;
      const factor = 100 / weight;
      
      return {
        calories: (parseFloat(calories) || 0) * factor,
        protein: (parseFloat(protein) || 0) * factor,
        carbs: (parseFloat(carbs) || 0) * factor,
        fat: (parseFloat(fat) || 0) * factor,
        sugar: (parseFloat(sugar) || 0) * factor,
        fiber: (parseFloat(fiber) || 0) * factor,
        sodium: (parseFloat(sodium) || 0) * factor,
        potassium: (parseFloat(potassium) || 0) * factor,
      };
    }
  };

  // Handle add to log
  const handleAddToLog = async () => {
    // Validate inputs
    if (!productName.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie einen Produktnamen ein');
      return;
    }

    if (!calories.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie die Kalorien ein');
      return;
    }

    if (isWholeProduct && (!servings.trim() || parseFloat(servings) <= 0)) {
      Alert.alert('Fehler', 'Bitte geben Sie ein gültiges Gesamtgewicht über den Slider ein');
      return;
    }

    try {
      const nutritionPer100g = getNutritionPer100g();
      
      // Create food item with nutrition per 100g
      const foodItem: FoodItem = {
        id: generateSimpleId(),
        name: productName.trim(),
        brand: productBrand.trim(),
        barcode: '',
        nutrition: {
          ...nutritionPer100g,
          servingSize: '100g',
          servingSizeGrams: 100
        }
      };

      // Save the food item to storage
      try {
        await saveFoodItem(foodItem);
        console.log('Food item saved successfully');
      } catch (saveError) {
        console.error('Failed to save food item:', saveError);
        Alert.alert('Fehler beim Speichern', 'Das Lebensmittel konnte nicht in der Datenbank gespeichert werden.');
        return;
      }

      // Create a food entry for the daily log
      const entry: FoodEntry = {
        id: generateSimpleId(),
        foodItem: foodItem,
        servingAmount: parseFloat(servings) || 1,
        mealType: selectedMeal,
        timeConsumed: new Date().toISOString(),
      };
      
      // Format the entry time for MySQL compatibility
      const now = new Date();
      const mysqlCompatibleTime = dateToMySQLDateTime(now);
      console.log(`Created food entry at: ${mysqlCompatibleTime} (local time)`);
      
      // Update the entry's time to use MySQL compatible format
      entry.timeConsumed = now.toISOString();
      
      // Get the daily log for the selected date
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
      
      // Add the entry to the daily log
      dailyLog.foodEntries.push(entry);
      console.log(`Added food entry ${entry.id} to daily log, now has ${dailyLog.foodEntries.length} entries`);
      
      // Save the updated log
      try {
        await saveDailyLog(dailyLog);
        console.log('Daily log saved successfully');
      } catch (saveLogError) {
        console.error('Error saving daily log:', saveLogError);
        Alert.alert('Fehler beim Speichern', 'Der Tageseintrag konnte nicht gespeichert werden');
        return;
      }
      
      // Check if food item is liquid and prompt for water intake
      if (displayUnit === 'ml') {
        const waterAmount = Math.round(parseFloat(servings) || 0);
        Alert.alert(
          'Zu Wasserstand hinzufügen?',
          `Möchten Sie ${waterAmount}ml zu Ihrem Wasserstand hinzufügen?`,
          [
            {
              text: 'Nein',
              style: 'cancel',
              onPress: () => {
                showSuccessAndNavigateBack(foodItem.name);
              }
            },
            {
              text: 'Ja',
              onPress: async () => {
                await addToWaterIntake(waterAmount);
                showSuccessAndNavigateBack(foodItem.name);
              }
            }
          ]
        );
      } else {
        showSuccessAndNavigateBack(foodItem.name);
      }
    } catch (err) {
      console.error('Error in handleAddToLog:', err);
      Alert.alert('Fehler', 'Ein unerwarteter Fehler ist aufgetreten beim Hinzufügen des Lebensmittels');
    }
  };

  // Helper function to add water intake
  const addToWaterIntake = async (amount: number) => {
    try {
      // Get current daily log
      const currentLog = await getDailyLogByDate(selectedDate);
      
      // Add water amount to existing intake
      const updatedLog = {
        ...currentLog,
        waterIntake: (currentLog.waterIntake || 0) + amount
      };
      
      // Save updated log
      await saveDailyLog(updatedLog);
      console.log(`Added ${amount}ml to water intake for ${selectedDate}`);
    } catch (error) {
      console.error('Error adding to water intake:', error);
      Alert.alert('Fehler', 'Konnte nicht zum Wasserstand hinzufügen');
    }
  };

  // Helper function to show success message and navigate back
  const showSuccessAndNavigateBack = (foodName: string) => {
    Alert.alert(
      'Erfolg',
      `${foodName} wurde zu deiner ${getMealTypeLabel(selectedMeal.toString())} Liste hinzugefügt`,
      [{ 
        text: 'OK', 
        onPress: () => {
          // Navigate back
          navigation.goBack();
        }
      }]
    );
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

  // For manual entry, default to grams since we have no API serving size data
  const displayUnit: 'ml' | 'g' = 'g';
  const servingUnit = getDisplayUnitString(displayUnit);

  // Calculated nutrition values for preview (always per 100g for consistency)
  const nutritionValues = {
    ...getNutritionPer100g(),
    servingSize: '100g',
    servingSizeGrams: 100
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? theme.spacing.xl * 2 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollContent}
        contentContainerStyle={{
          paddingRight: theme.spacing.m,
          paddingLeft: theme.spacing.m,
          paddingBottom: theme.spacing.xl * 2,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={true}
      >
        {/* Show content only after animations are ready */}
        {showAnimations && (
          <>
            {/* Product Information */}
            <Animatable.View 
              animation="fadeInUp"
              duration={600}
              delay={100}
            >
              <Text style={[styles.inputLabel, { 
                color: theme.colors.text,
                fontFamily: theme.typography.fontFamily.bold,
                fontSize: theme.typography.fontSize.l,
                marginTop: theme.spacing.m,
                marginBottom: theme.spacing.m
              }]}>Produktinformationen</Text>
              
              <View style={[styles.inputContainer, { marginBottom: theme.spacing.m }]}>
                <Text style={[styles.inputLabel, { 
                  color: theme.colors.text,
                  fontFamily: theme.typography.fontFamily.medium,
                  marginBottom: theme.spacing.s
                }]}>Produktname *</Text>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderRadius: theme.borderRadius.small,
                    color: theme.colors.text,
                    fontFamily: theme.typography.fontFamily.regular,
                    padding: theme.spacing.m
                  }]}
                  value={productName}
                  onChangeText={setProductName}
                  placeholder="z.B. Apfel, Brokkoli, Hähnchenbrust..."
                  placeholderTextColor={theme.colors.placeholder}
                />
              </View>

              <View style={[styles.inputContainer]}>
                <Text style={[styles.inputLabel, { 
                  color: theme.colors.text,
                  fontFamily: theme.typography.fontFamily.medium,
                  marginBottom: theme.spacing.s
                }]}>Marke (optional)</Text>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderRadius: theme.borderRadius.small,
                    color: theme.colors.text,
                    fontFamily: theme.typography.fontFamily.regular,
                    padding: theme.spacing.m
                  }]}
                  value={productBrand}
                  onChangeText={setProductBrand}
                  placeholder="z.B. Nestle, Edeka..."
                  placeholderTextColor={theme.colors.placeholder}
                />
              </View>
            </Animatable.View>

            {/* Calculation Mode Switch */}
            <Animatable.View 
              animation="fadeInUp"
              duration={600}
              delay={200}
            >
              <Text style={[styles.inputLabel, { 
                color: theme.colors.text,
                fontFamily: theme.typography.fontFamily.bold,
                fontSize: theme.typography.fontSize.l,
                marginTop: theme.spacing.l,
                marginBottom: theme.spacing.m
              }]}>Nährwerte eingeben</Text>
              
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.medium,
                padding: theme.spacing.m,
                marginBottom: theme.spacing.s,
                borderColor: theme.colors.border,
                borderWidth: 1
              }}>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    color: theme.colors.text,
                    fontFamily: theme.typography.fontFamily.medium,
                    fontSize: theme.typography.fontSize.m
                  }}>
                    {isWholeProduct ? 'Gesamtes Produkt' : 'Pro 100g'}
                  </Text>
                </View>
                <Switch
                  value={isWholeProduct}
                  onValueChange={setIsWholeProduct}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor="white"
                />
              </View>

            </Animatable.View>

            {/* Main Nutrition Values */}
            <Animatable.View 
              animation="fadeInUp"
              duration={600}
              delay={300}
            >
              <Text style={[styles.inputLabel, { 
                color: theme.colors.text,
                fontFamily: theme.typography.fontFamily.bold,
                fontSize: theme.typography.fontSize.l,
                marginTop: theme.spacing.l,
                marginBottom: theme.spacing.m
              }]}>Hauptnährwerte {isWholeProduct ? '(ganzes Produkt)' : '(pro 100g)'}</Text>
          
              {/* Calories - Required */}
              <View style={[styles.inputContainer, { marginBottom: theme.spacing.m }]}>
                <Text style={[styles.inputLabel, { 
                  color: theme.colors.text,
                  fontFamily: theme.typography.fontFamily.medium,
                  marginBottom: theme.spacing.s
                }]}>Kalorien (kcal) *</Text>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderRadius: theme.borderRadius.small,
                    color: theme.colors.text,
                    fontFamily: theme.typography.fontFamily.regular,
                    padding: theme.spacing.m
                  }]}
                  value={calories}
                  onChangeText={(text) => setCalories(text.replace(/[^0-9.,]/g, '').replace(',', '.'))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.colors.placeholder}
                />
              </View>

              {/* Kohlenhydrate - Full Width */}
              <View style={[styles.inputContainer, { marginBottom: theme.spacing.m }]}>
                <Text style={[styles.inputLabel, { 
                  color: theme.colors.text,
                  fontFamily: theme.typography.fontFamily.medium,
                  marginBottom: theme.spacing.s
                }]}>Kohlenhydrate (g)</Text>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderRadius: theme.borderRadius.small,
                    color: theme.colors.text,
                    fontFamily: theme.typography.fontFamily.regular,
                    padding: theme.spacing.m
                  }]}
                  value={carbs}
                  onChangeText={(text) => setCarbs(text.replace(/[^0-9.,]/g, '').replace(',', '.'))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.colors.placeholder}
                />
              </View>

              {/* Protein & Fett Row */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.m }}>
                <View style={{ flex: 1, marginRight: theme.spacing.s }}>
                  <Text style={[styles.inputLabel, { 
                    color: theme.colors.text,
                    fontFamily: theme.typography.fontFamily.medium,
                    marginBottom: theme.spacing.s
                  }]}>Protein (g)</Text>
                  <TextInput
                    style={[styles.textInput, { 
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      borderRadius: theme.borderRadius.small,
                      color: theme.colors.text,
                      fontFamily: theme.typography.fontFamily.regular,
                      padding: theme.spacing.m
                    }]}
                    value={protein}
                    onChangeText={(text) => setProtein(text.replace(/[^0-9.,]/g, '').replace(',', '.'))}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={theme.colors.placeholder}
                  />
                </View>
                
                <View style={{ flex: 1, marginLeft: theme.spacing.s }}>
                  <Text style={[styles.inputLabel, { 
                    color: theme.colors.text,
                    fontFamily: theme.typography.fontFamily.medium,
                    marginBottom: theme.spacing.s
                  }]}>Fett (g)</Text>
                  <TextInput
                    style={[styles.textInput, { 
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      borderRadius: theme.borderRadius.small,
                      color: theme.colors.text,
                      fontFamily: theme.typography.fontFamily.regular,
                      padding: theme.spacing.m
                    }]}
                    value={fat}
                    onChangeText={(text) => setFat(text.replace(/[^0-9.,]/g, '').replace(',', '.'))}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={theme.colors.placeholder}
                  />
                </View>
              </View>
            </Animatable.View>

            {/* Optional Nutrition Values */}
            <Animatable.View 
              animation="fadeInUp"
              duration={600}
              delay={400}
            >
              <Text style={[styles.inputLabel, { 
                color: theme.colors.text,
                fontFamily: theme.typography.fontFamily.bold,
                fontSize: theme.typography.fontSize.l,
                marginTop: theme.spacing.l,
                marginBottom: theme.spacing.m
              }]}>Weitere Nährwerte (optional)</Text>

              {/* Sugar and Fiber Row */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.m }}>
                <View style={{ flex: 1, marginRight: theme.spacing.s }}>
                  <Text style={[styles.inputLabel, { 
                    color: theme.colors.text,
                    fontFamily: theme.typography.fontFamily.medium,
                    marginBottom: theme.spacing.s
                  }]}>Zucker (g)</Text>
                  <TextInput
                    style={[styles.textInput, { 
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      borderRadius: theme.borderRadius.small,
                      color: theme.colors.text,
                      fontFamily: theme.typography.fontFamily.regular,
                      padding: theme.spacing.m
                    }]}
                    value={sugar}
                    onChangeText={(text) => setSugar(text.replace(/[^0-9.,]/g, '').replace(',', '.'))}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={theme.colors.placeholder}
                  />
                </View>

                <View style={{ flex: 1, marginLeft: theme.spacing.s }}>
                  <Text style={[styles.inputLabel, { 
                    color: theme.colors.text,
                    fontFamily: theme.typography.fontFamily.medium,
                    marginBottom: theme.spacing.s
                  }]}>Ballaststoffe (g)</Text>
                  <TextInput
                    style={[styles.textInput, { 
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      borderRadius: theme.borderRadius.small,
                      color: theme.colors.text,
                      fontFamily: theme.typography.fontFamily.regular,
                      padding: theme.spacing.m
                    }]}
                    value={fiber}
                    onChangeText={(text) => setFiber(text.replace(/[^0-9.,]/g, '').replace(',', '.'))}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={theme.colors.placeholder}
                  />
                </View>
              </View>

              {/* Sodium and Potassium Row */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, marginRight: theme.spacing.s }}>
                  <Text style={[styles.inputLabel, { 
                    color: theme.colors.text,
                    fontFamily: theme.typography.fontFamily.medium,
                    marginBottom: theme.spacing.s
                  }]}>Natrium (mg)</Text>
                  <TextInput
                    style={[styles.textInput, { 
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      borderRadius: theme.borderRadius.small,
                      color: theme.colors.text,
                      fontFamily: theme.typography.fontFamily.regular,
                      padding: theme.spacing.m
                    }]}
                    value={sodium}
                    onChangeText={(text) => setSodium(text.replace(/[^0-9.,]/g, '').replace(',', '.'))}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={theme.colors.placeholder}
                  />
                </View>

                <View style={{ flex: 1, marginLeft: theme.spacing.s }}>
                  <Text style={[styles.inputLabel, { 
                    color: theme.colors.text,
                    fontFamily: theme.typography.fontFamily.medium,
                    marginBottom: theme.spacing.s
                  }]}>Kalium (mg)</Text>
                  <TextInput
                    style={[styles.textInput, { 
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      borderRadius: theme.borderRadius.small,
                      color: theme.colors.text,
                      fontFamily: theme.typography.fontFamily.regular,
                      padding: theme.spacing.m
                    }]}
                    value={potassium}
                    onChangeText={(text) => setPotassium(text.replace(/[^0-9.,]/g, '').replace(',', '.'))}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={theme.colors.placeholder}
                  />
                </View>
              </View>
            </Animatable.View>

            {/* Serving Size / Total Weight */}
            <Animatable.View 
              animation="fadeInUp"
              duration={600}
              delay={500}
            >
              <Text style={[styles.inputLabel, { 
                color: theme.colors.text,
                fontFamily: theme.typography.fontFamily.bold,
                fontSize: theme.typography.fontSize.l,
                marginTop: theme.spacing.l,
                marginBottom: theme.spacing.m
              }]}>{isWholeProduct ? 'Gesamtgewicht des Produkts' : 'Portionsgröße'}</Text>
              
              <SliderWithInput
                minValue={1}
                maxValue={1000}
                middleValue={500}
                step={0.01}
                decimalPlaces={2}
                allowDecimals={true}
                value={parseFloat(servings) || 100}
                onValueChange={(value: number) => {
                  setServings(value.toFixed(2));
                  setSliderValue(value);
                }}
                label={isWholeProduct ? 'Gesamtgewicht' : 'Menge'}
                unit={servingUnit}
                placeholder="100"
              />
            </Animatable.View>

            {/* Add to log button */}
            <Animatable.View 
              animation="fadeInUp"
              duration={600}
              delay={600}
              style={{ marginTop: theme.spacing.l }}
            >
              <TouchableOpacity
                style={[styles.addButton, { 
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.borderRadius.medium,
                  padding: theme.spacing.m,
                }]}
                onPress={handleAddToLog}
              >
                <Text style={[styles.addButtonText, {
                  color: 'white',
                  fontFamily: theme.typography.fontFamily.bold,
                  fontSize: theme.typography.fontSize.m,
                  textAlign: 'center'
                }]}>Hinzufügen</Text>
              </TouchableOpacity>
            </Animatable.View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
