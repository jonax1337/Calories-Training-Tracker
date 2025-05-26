import React, { useState, useRef } from 'react';
import { Text, View, TextInput, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
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
  const [servings, setServings] = useState('100.00');
  const [sliderValue, setSliderValue] = useState(100);
  
  // Set selected meal based on navigation parameter or default to Lunch
  const [selectedMeal, setSelectedMeal] = useState<MealType>(
    mealType ? MealType[mealType.charAt(0).toUpperCase() + mealType.slice(1) as keyof typeof MealType] : MealType.Lunch
  );
  
  // Use the date from route params, then context, or today as default
  const [selectedDate] = useState<string>(routeDate || contextDate || getTodayFormatted());

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
    servingSize: '100g',
    servingSizeGrams: 100
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
        {/* Food name input */}
        <View style={[styles.inputContainer, { marginBottom: theme.spacing.m }]}>
          <Text style={[styles.inputLabel, { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.medium,
            marginTop: theme.spacing.m,
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
            placeholder="Produktname eingeben"
            placeholderTextColor={theme.colors.placeholder}
          />
        </View>

        {/* Brand Input */}
        <View style={[styles.inputContainer, { marginBottom: theme.spacing.xl }]}>
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
            placeholder="z.B. Ehrmann"
            placeholderTextColor={theme.colors.placeholder}
          />
        </View>

        {/* Nutrition Inputs */}
        <View style={[styles.inputContainer, { marginBottom: theme.spacing.m }]}>
          <Text style={[styles.inputLabel, { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.medium,
            marginBottom: theme.spacing.s,
            fontSize: theme.typography.fontSize.l
          }]}>Nährwerte pro 100g/ml</Text>
          
          {/* Calories Input */}
          <View style={styles.inputContainer}>
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

          {/* Protein Input */}
          <View style={styles.inputContainer}>
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

          {/* Carbs Input */}
          <View style={styles.inputContainer}>
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

          {/* Fat Input */}
          <View style={styles.inputContainer}>
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

        {/* Servings input */}
        {/* Mengeneingabe mit Slider - identisch zum Food Detail Screen */}
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

        {/* Preview Nutritional Info */}
        {(parseFloat(calories) > 0 || parseFloat(protein) > 0 || parseFloat(carbs) > 0 || parseFloat(fat) > 0) && (
          <View style={{ marginBottom: theme.spacing.m }}>
            <NutritionalInfoCard
              nutrition={nutritionValues}
              servingMultiplier={parseFloat(servings) / 100} /* Durch 100 teilen, da Nährwerte pro 100g/ml gespeichert sind */
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
            marginTop: theme.spacing.l,
            marginBottom: theme.spacing.xl
          }]}
          onPress={handleAddToLog}
        >
          <Text style={styles.addButtonText}>Hinzufügen</Text>
        </TouchableOpacity>
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
