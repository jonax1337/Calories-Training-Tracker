import React, { useState, useRef } from 'react';
import { Text, View, TextInput, TouchableOpacity, Alert, Platform, ScrollView, KeyboardAvoidingView } from 'react-native';
import SliderWithInput from '../components/ui/slider-with-input';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { FoodItem, MealType, FoodEntry } from '../types';
import NutritionalInfoCard from '../components/ui/nutritional-info-card';
import { saveFoodItem, getDailyLogByDate, saveDailyLog } from '../services/storage-service';
import generateSimpleId from '../utils/id-generator';
import { getTodayFormatted, dateToMySQLDateTime } from '../utils/date-utils';
import { useTheme } from '../theme/theme-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDateContext } from '../context/date-context';
import { createManualFoodEntryStyles } from '../styles/screens/manual-food-entry-styles';

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

  // States for the form
  const [productName, setProductName] = useState('');
  const [productBrand, setProductBrand] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [sugar, setSugar] = useState('');
  const [fiber, setFiber] = useState('');
  const [sodium, setSodium] = useState('');
  const [potassium, setPotassium] = useState('');
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

    try {
      // Create food item
      const foodItem: FoodItem = {
        id: generateSimpleId(),
        name: productName.trim(),
        brand: productBrand.trim(),
        barcode: '',
        nutrition: {
          calories: parseFloat(calories) || 0,
          protein: parseFloat(protein) || 0,
          carbs: parseFloat(carbs) || 0,
          fat: parseFloat(fat) || 0,
          sugar: parseFloat(sugar) || 0,
          fiber: parseFloat(fiber) || 0,
          sodium: parseFloat(sodium) || 0,
          potassium: parseFloat(potassium) || 0,
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
      
      // Show success message
      Alert.alert(
        'Erfolg',
        `${foodItem.name} wurde zu deiner ${getMealTypeLabel(selectedMeal.toString())} Liste hinzugefügt`,
        [{ 
          text: 'OK', 
          onPress: () => {
            // Navigate back
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

  // Calculated nutrition values based on entries
  const nutritionValues = {
    calories: parseFloat(calories) || 0,
    protein: parseFloat(protein) || 0,
    carbs: parseFloat(carbs) || 0,
    fat: parseFloat(fat) || 0,
    sugar: parseFloat(sugar) || 0,
    fiber: parseFloat(fiber) || 0,
    sodium: parseFloat(sodium) || 0,
    potassium: parseFloat(potassium) || 0,
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
          paddingBottom: theme.spacing.xl * 2, // Extra padding at bottom for keyboard space
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={true}
      >
        {/* Row: Product name and brand */}
        <View style={{ flexDirection: 'row', marginBottom: theme.spacing.m }}>
          {/* Food name input */}
          <View style={[styles.inputContainer, { width: '100%' }]}>
            <Text style={[styles.inputLabel, { 
              color: theme.colors.text,
              fontFamily: theme.typography.fontFamily.medium,
              marginTop: theme.spacing.m,
              marginBottom: theme.spacing.s
            }]}>Produkt *</Text>
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
              placeholder="Produktname eingeben"
              placeholderTextColor={theme.colors.placeholder}
            />
          </View>
        </View>

        {/* Nutrition Inputs */}
        <View style={[styles.inputContainer]}>
          <Text style={[styles.inputLabel, { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.medium,
            marginBottom: theme.spacing.s,
            fontSize: theme.typography.fontSize.l
          }]}>Nährwerte pro 100g</Text>
          
          {/* Calories Input - Full Width */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { 
              color: theme.colors.text,
              fontFamily: theme.typography.fontFamily.medium,
              marginBottom: theme.spacing.s,
              fontSize: theme.typography.fontSize.s
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

          {/* Carbs Input */}
          <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { 
                color: theme.colors.text,
                fontFamily: theme.typography.fontFamily.medium,
                marginBottom: theme.spacing.s,
                fontSize: theme.typography.fontSize.s
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

            {/* Sugar and Fiber Inputs */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {/* Sugar Input */}
            <View style={[styles.inputContainer, { flex: 1, marginRight: theme.spacing.m }]}>
              <Text style={[styles.inputLabel, { 
                color: theme.colors.text,
                fontFamily: theme.typography.fontFamily.medium,
                marginBottom: theme.spacing.s,
                fontSize: theme.typography.fontSize.s
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

            {/* Fiber Input */}
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { 
                color: theme.colors.text,
                fontFamily: theme.typography.fontFamily.medium,
                marginBottom: theme.spacing.s,
                fontSize: theme.typography.fontSize.s
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

          {/* Protein, Carbs, Fat in a Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {/* Protein Input */}
            <View style={[styles.inputContainer, { flex: 1, marginRight: theme.spacing.m }]}>
              <Text style={[styles.inputLabel, { 
                color: theme.colors.text,
                fontFamily: theme.typography.fontFamily.medium,
                marginBottom: theme.spacing.s,
                fontSize: theme.typography.fontSize.s
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

            {/* Fat Input */}
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { 
                color: theme.colors.text,
                fontFamily: theme.typography.fontFamily.medium,
                marginBottom: theme.spacing.s,
                fontSize: theme.typography.fontSize.s
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

          {/* Sodium and Potassium Inputs */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {/* Sodium Input */}
            <View style={[styles.inputContainer, { flex: 1, marginRight: theme.spacing.m }]}>
              <Text style={[styles.inputLabel, { 
                color: theme.colors.text,
                fontFamily: theme.typography.fontFamily.medium,
                marginBottom: theme.spacing.s,
                fontSize: theme.typography.fontSize.s
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

            {/* Potassium Input */}
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { 
                color: theme.colors.text,
                fontFamily: theme.typography.fontFamily.medium,
                marginBottom: theme.spacing.s,
                fontSize: theme.typography.fontSize.s
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
        </View>

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
        
        {/* Preview Nutritional Info */}
        {(parseFloat(calories) > 0 || parseFloat(protein) > 0 || parseFloat(carbs) > 0 || parseFloat(fat) > 0) && (
          <View style={{ marginBottom: theme.spacing.m }}>
            <NutritionalInfoCard
              nutrition={nutritionValues}
              servingMultiplier={parseFloat(servings) / 100} /* Durch 100 teilen, da Nährwerte pro 100g gespeichert sind */
            />
          </View>
        )}

        {/* Meal Type Selection */}
        <View style={{ marginTop: theme.spacing.m, marginBottom: theme.spacing.m, display: 'none' }}>
          <Text style={{ 
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.m,
            color: theme.colors.text,
            marginBottom: theme.spacing.s
          }}>Mahlzeittyp</Text>
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between'
          }}>
            {renderMealTypeButton(MealType.Breakfast, "Frühstück")}
            {renderMealTypeButton(MealType.Lunch, "Mittagessen")}
            {renderMealTypeButton(MealType.Dinner, "Abendessen")}
            {renderMealTypeButton(MealType.Snack, "Snack")}
          </View>
        </View>

        {/* Add to log button */}
        <TouchableOpacity
          style={[styles.addButton, { 
            backgroundColor: theme.colors.primary,
            borderRadius: theme.borderRadius.medium,
            padding: theme.spacing.m,
            marginTop: theme.spacing.m,
          }]}
          onPress={handleAddToLog}
        >
          <Text style={styles.addButtonText}>Hinzufügen</Text>
        </TouchableOpacity>
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
